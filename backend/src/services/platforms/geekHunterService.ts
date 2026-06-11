import { GeekHunterConnector, GeekHunterJob, GeekHunterSearchParams } from './geekHunterConnector';
import { neuralService } from '../neural/neuralService';
import prisma from '../../config/database';
import logger from '../../utils/logger';
import { sleep, randomBetween } from '../../utils/helpers';

export interface GeekHunterRunConfig {
  automationId: string;
  userId: string;
  searchParams: GeekHunterSearchParams;
  maxApplications: number;
  minNeuralScore: number;
  headless?: boolean;
}

export const geekHunterService = {

  async searchWithScores(params: GeekHunterSearchParams & { userId: string }): Promise<any[]> {
    const connector = new GeekHunterConnector();
    try {
      const jobs = await connector.searchJobs(params);

      const scored = await Promise.all(
        jobs.slice(0, 30).map(async (job) => {
          const prediction = await neuralService.predict(params.userId, {
            title: job.title,
            company: job.company,
            isRemote: job.isRemote,
            seniorityLevel: job.seniorityLevel,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            detectedSkills: job.skills,
            platform: 'GEEKHUNTER',
          }).catch(() => null);

          return {
            ...job,
            neuralScore: prediction?.score,
            neuralShouldApply: prediction?.shouldApply,
            neuralReasoning: prediction?.reasoning?.summary,
          };
        }),
      );

      return scored.sort((a, b) => (b.neuralScore || 0) - (a.neuralScore || 0));
    } finally {
      await connector.close();
    }
  },

  async runAutomation(
    config: GeekHunterRunConfig,
    logFn: (msg: string) => Promise<void>,
  ): Promise<{ applied: number; skipped: number; failed: number }> {
    const connector = new GeekHunterConnector();
    let applied = 0, skipped = 0, failed = 0;

    try {
      await logFn('🎯 Iniciando busca no GeekHunter...');
      await connector.initBrowser(config.headless ?? true);

      const jobs = await connector.searchJobs({
        ...config.searchParams,
        maxResults: config.maxApplications * 3,
      });

      await logFn(`📋 ${jobs.length} vagas encontradas no GeekHunter`);

      const user = await prisma.user.findUnique({ where: { id: config.userId } });
      const profile = await prisma.profile.findUnique({ where: { userId: config.userId } });

      for (const job of jobs) {
        if (applied >= config.maxApplications) break;

        await logFn(`🔍 Analisando: ${job.title} @ ${job.company}`);

        const existing = await prisma.application.findFirst({
          where: { userId: config.userId, externalId: job.externalId, platform: 'GEEKHUNTER' },
        });
        if (existing) { skipped++; continue; }

        // Score neural
        const prediction = await neuralService.predict(config.userId, {
          title: job.title,
          company: job.company,
          isRemote: job.isRemote,
          seniorityLevel: job.seniorityLevel,
          salaryMin: job.salaryMin,
          salaryMax: job.salaryMax,
          detectedSkills: job.skills,
          platform: 'GEEKHUNTER',
        }).catch(() => null);

        if (prediction) {
          const emoji = prediction.score >= 80 ? '🔥' : prediction.score >= 60 ? '✅' : '⚠️';
          await logFn(`${emoji} Neural score: ${prediction.score}/100`);
          if (prediction.score < config.minNeuralScore) {
            await logFn(`⏭ Score ${prediction.score} < mínimo ${config.minNeuralScore}`);
            skipped++;
            continue;
          }
        }

        // Salva no banco
        await prisma.application.create({
          data: {
            userId: config.userId,
            automationId: config.automationId,
            jobTitle: job.title,
            company: job.company,
            location: job.location,
            isRemote: job.isRemote,
            salaryMin: job.salaryMin,
            salaryMax: job.salaryMax,
            jobUrl: job.applyUrl,
            jobDescription: job.description.slice(0, 2000),
            platform: 'GEEKHUNTER',
            externalId: job.externalId,
            status: 'APPLIED',
            appliedAt: new Date(),
            aiScore: prediction?.score || null,
          },
        });

        await logFn(`✅ ${job.title} @ ${job.company} — candidatura registrada`);
        applied++;
        await sleep(randomBetween(3000, 8000));
      }

      await logFn(`🏁 GeekHunter: ${applied} aplicadas, ${skipped} puladas, ${failed} falhas`);
    } catch (err: any) {
      await logFn(`❌ Erro: ${err.message}`);
      logger.error('GeekHunter automation error', { err });
    } finally {
      await connector.close();
    }

    return { applied, skipped, failed };
  },

  getSkillCategories() {
    return {
      backend: ['Node.js', 'Python', 'Java', 'Go', 'Ruby', 'PHP', 'Rust', 'C#', '.NET'],
      frontend: ['React', 'Vue.js', 'Angular', 'TypeScript', 'JavaScript', 'Next.js'],
      mobile: ['React Native', 'Flutter', 'iOS', 'Android', 'Swift', 'Kotlin'],
      data: ['Python', 'SQL', 'Spark', 'Kafka', 'dbt', 'Airflow', 'Power BI'],
      devops: ['Docker', 'Kubernetes', 'AWS', 'GCP', 'Azure', 'Terraform', 'CI/CD'],
      database: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'],
    };
  },
};
