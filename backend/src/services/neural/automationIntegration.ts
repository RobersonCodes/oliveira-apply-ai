/**
 * Patch de integração do Neural no fluxo de automação
 * 
 * Adicionar ao automation.service.ts, dentro do loop de vagas:
 * 
 * ANTES de aplicar para uma vaga, chamar:
 *   const prediction = await neuralService.predict(userId, jobData);
 *   if (!prediction.shouldApply) {
 *     await log(`⏭ Vaga pulada pelo Neural (score: ${prediction.score}): ${prediction.reasoning.summary}`);
 *     continue;
 *   }
 *   await log(`🧠 Neural score: ${prediction.score}/100 — ${prediction.reasoning.summary}`);
 * 
 * APÓS candidatura salva no banco, chamar:
 *   await neuralService.syncApplicationOutcome(application.id);
 * 
 * APÓS status mudar (webhook ou manual), chamar:
 *   await neuralService.syncApplicationOutcome(applicationId);
 */

import { neuralService } from './neural/neuralService';

export async function scoreJobWithNeural(
  userId: string,
  job: {
    title: string;
    company: string;
    seniorityLevel?: string;
    isRemote?: boolean;
    isEasyApply?: boolean;
    salaryMin?: number;
    salaryMax?: number;
    platform?: string;
    detectedSkills?: string[];
  },
  logFn?: (msg: string) => Promise<void>,
) {
  try {
    const prediction = await neuralService.predict(userId, job);

    if (logFn) {
      const emoji = prediction.score >= 85 ? '🔥' : prediction.score >= 70 ? '✅' : prediction.score >= 50 ? '⚠️' : '❌';
      await logFn(`${emoji} Neural score: ${prediction.score}/100 (confiança: ${Math.round(prediction.confidence * 100)}%) — ${prediction.reasoning.summary}`);

      if (prediction.reasoning.topPositive.length > 0) {
        await logFn(`   ✓ ${prediction.reasoning.topPositive.map(f => f.label).join(', ')}`);
      }
      if (prediction.reasoning.topNegative.length > 0) {
        await logFn(`   ✗ ${prediction.reasoning.topNegative.map(f => f.label).join(', ')}`);
      }
    }

    return prediction;
  } catch (err) {
    // Neural falhou — não bloqueia a automação
    if (logFn) await logFn('⚠️ Neural indisponível — aplicando sem score');
    return null;
  }
}
