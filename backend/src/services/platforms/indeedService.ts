/**
 * Indeed Service
 * Orquestra: busca vagas → score neural → aplica
 */

import { IndeedConnector, IndeedJob, IndeedSearchParams } from './indeedConnector';
import { neuralService } from '../neural/neuralService';
import { detectATS } from '../recruiterVision/atsDetector';
import prisma from '../../config/database';
import logger from '../../utils/logger';
import { sleep, randomBetween } from '../../utils/helpers';

export interface IndeedRunConfig {
  automationId: string;
  userId: string;
  searchParams: IndeedSearchParams;
  maxApplications: number;
  minNeuralScore: number;
  applyWithEasyApply: boolean;
  generateCoverLetter: boolean;
  headless?: boolean;
}

export const indeedService = {

  async runAutomation(
    config: IndeedRunConfig,
    logFn: (msg: string) => Promise<void>,
  ): Promise<{ applied: number; skipped: number; failed: number }> {
    const connector = new IndeedConnector();
    let applied = 0, skipped = 0, failed = 0;

    try {
      await logFn('🌐 Iniciando busca no Indeed...');
      await connector.init(config.headless ?? true);

      // Busca vagas
      const jobs = await connector.searchJobs({
        ...config.searchParams,
        maxResults: config.maxApplications * 3, // busca mais para ter margem após filtros
      });

      await logFn(`📋 ${jobs.length} vagas encontradas no Indeed`);

      // Busca perfil do usuário
      const profile = await prisma.profile.findUnique({ where: { userId: config.userId } });
      const user = await prisma.user.findUnique({ where: { id: config.userId } });

      for (const job of jobs) {
        if (applied >= config.maxApplications) {
          await logFn(`✅ Limite de ${config.maxApplications} candidaturas atingido`);
          break;
        }

        await logFn(`🔍 Analisando: ${job.title} @ ${job.company}`);

        // Verifica se já aplicou
        const existing = await prisma.application.findFirst({
          where: { userId: config.userId, company: job.company, jobTitle: job.title },
        });
        if (existing) {
          await logFn(`⏭ Já candidatou para ${job.title} @ ${job.company}`);
          skipped++;
          continue;
        }

        // Score neural
        const prediction = await neuralService.predict(config.userId, {
          title: job.title,
          company: job.company,
          isRemote: job.isRemote,
          isEasyApply: job.isEasyApply,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          platform: 'INDEED',
        }).catch(() => null);

        if (prediction) {
          const emoji = prediction.score >= 80 ? '🔥' : prediction.score >= 60 ? '✅' : '⚠️';
          await logFn(`${emoji} Neural score: ${prediction.score}/100 — ${prediction.reasoning.summary}`);

          if (prediction.score < config.minNeuralScore) {
            await logFn(`⏭ Score abaixo do mínimo (${prediction.score} < ${config.minNeuralScore}) — pulando`);
            skipped++;
            continue;
          }
        }

        // Detecta ATS
        const atsProfile = detectATS({ companyName: job.company, applyUrl: job.applyUrl });
        await logFn(`🎯 ATS detectado: ${atsProfile.name} (${Math.round(atsProfile.confidence * 100)}% confiança)`);

        // Busca detalhes da vaga para ter a descrição
        await logFn(`📄 Carregando detalhes da vaga...`);
        const detailedJob = await connector.getJobDetails(job).catch(() => job);
        await sleep(randomBetween(1000, 2000));

        // Tenta aplicar
        if (job.isEasyApply && config.applyWithEasyApply) {
          await logFn(`📝 Aplicando via Indeed Easy Apply...`);

          const result = await connector.applyEasyApply(detailedJob, {
            name: user?.name || 'Candidato',
            email: user?.email || '',
            phone: profile?.phone || '',
          });

          if (result.success) {
            await logFn(`✅ Candidatura enviada: ${job.title} @ ${job.company}`);
            await this.saveApplication(config.userId, config.automationId, detailedJob, prediction?.score);
            applied++;
          } else {
            await logFn(`❌ Falha: ${result.message}`);
            failed++;
          }
        } else {
          // Salva como "aplicar manualmente" com informações completas
          await logFn(`📌 Vaga salva para candidatura manual: ${job.title} @ ${job.company}`);
          await this.saveApplication(config.userId, config.automationId, detailedJob, prediction?.score, 'PENDING');
          applied++;
        }

        // Delay humano entre candidaturas
        const delay = randomBetween(5000, 15000);
        await logFn(`⏳ Aguardando ${Math.round(delay / 1000)}s...`);
        await sleep(delay);
      }

      await logFn(`🏁 Indeed finalizado: ${applied} candidaturas, ${skipped} puladas, ${failed} falhas`);
    } catch (err: any) {
      await logFn(`❌ Erro no Indeed: ${err.message}`);
      logger.error('Indeed automation error', { err });
    } finally {
      await connector.close();
    }

    return { applied, skipped, failed };
  },

  async searchOnly(params: IndeedSearchParams & { userId: string }): Promise<IndeedJob[]> {
    const connector = new IndeedConnector();
    try {
      await connector.init(true);
      const jobs = await connector.searchJobs(params);

      // Enriquece com score neural
      const scoredJobs = await Promise.all(
        jobs.slice(0, 20).map(async (job) => {
          const prediction = await neuralService.predict(params.userId, {
            title: job.title,
            company: job.company,
            isRemote: job.isRemote,
            isEasyApply: job.isEasyApply,
            platform: 'INDEED',
          }).catch(() => null);

          return { ...job, neuralScore: prediction?.score, neuralShouldApply: prediction?.shouldApply };
        }),
      );

      return scoredJobs.sort((a, b) => (b.neuralScore || 0) - (a.neuralScore || 0));
    } finally {
      await connector.close();
    }
  },

  async saveApplication(
    userId: string,
    automationId: string,
    job: IndeedJob,
    aiScore?: number,
    status: string = 'APPLIED',
  ): Promise<void> {
    await prisma.application.create({
      data: {
        userId,
        automationId,
        jobTitle: job.title,
        company: job.company,
        location: job.location,
        isRemote: job.isRemote,
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        jobUrl: job.applyUrl,
        platform: 'INDEED',
        externalId: job.externalId,
        status: status as any,
        appliedAt: new Date(),
        aiScore: aiScore || null,
      },
    });
  },

  getSupportedCountries() {
    return [
      { code: 'br', name: 'Brasil', flag: '🇧🇷' },
      { code: 'us', name: 'Estados Unidos', flag: '🇺🇸' },
      { code: 'uk', name: 'Reino Unido', flag: '🇬🇧' },
      { code: 'ca', name: 'Canadá', flag: '🇨🇦' },
      { code: 'au', name: 'Austrália', flag: '🇦🇺' },
      { code: 'de', name: 'Alemanha', flag: '🇩🇪' },
      { code: 'fr', name: 'França', flag: '🇫🇷' },
      { code: 'nl', name: 'Holanda', flag: '🇳🇱' },
      { code: 'pt', name: 'Portugal', flag: '🇵🇹' },
    ];
  },
};
