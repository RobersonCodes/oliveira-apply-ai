/**
 * Job Match Neural Service
 * Orquestra: carrega modelo do banco, prediz, treina, salva
 */

import prisma from '../../config/database';
import { JobMatchNeuralModel, TrainingSample, ModelWeights } from './neuralModel';
import { extractFeatures, JobFeatures } from './featureExtractor';
import logger from '../../utils/logger';

const OUTCOME_FROM_STATUS: Record<string, string> = {
  APPLIED:              'PENDING',
  VIEWED:               'VIEWED',
  INTERVIEW_SCHEDULED:  'INTERVIEW',
  OFFER_RECEIVED:       'OFFER',
  REJECTED:             'REJECTED',
  WITHDRAWN:            'NO_RESPONSE',
  GHOSTED:              'NO_RESPONSE',
};

// Cache em memória para evitar I/O excessivo
const modelCache = new Map<string, { model: JobMatchNeuralModel; loadedAt: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

export const neuralService = {

  async getOrCreateModel(userId: string): Promise<JobMatchNeuralModel> {
    // Check cache
    const cached = modelCache.get(userId);
    if (cached && Date.now() - cached.loadedAt < CACHE_TTL_MS) {
      return cached.model;
    }

    // Load from DB
    let record = await prisma.userNeuralModel.findUnique({ where: { userId } });
    if (!record) {
      record = await prisma.userNeuralModel.create({
        data: { userId, weights: {}, featureImportance: {} },
      });
    }

    const savedWeights = record.weights && Object.keys(record.weights).length > 0
      ? record.weights as unknown as ModelWeights
      : undefined;

    const model = new JobMatchNeuralModel(savedWeights, record.totalSamples);

    modelCache.set(userId, { model, loadedAt: Date.now() });
    return model;
  },

  async predict(userId: string, jobData: {
    title: string;
    company: string;
    seniorityLevel?: string;
    isRemote?: boolean;
    isHybrid?: boolean;
    isEasyApply?: boolean;
    jobType?: string;
    salaryMin?: number;
    salaryMax?: number;
    platform?: string;
    companySize?: string;
    daysOpen?: number;
    applicantCount?: number;
    detectedSkills?: string[];
  }) {
    const model = await this.getOrCreateModel(userId);
    const modelRecord = await prisma.userNeuralModel.findUnique({ where: { userId } });

    // Busca perfil do usuário
    const profile = await prisma.profile.findUnique({ where: { userId } });

    // Verifica histórico com esta empresa
    const [appliedBefore, rejectedBefore, interviewedBefore] = await Promise.all([
      prisma.application.count({ where: { userId, company: jobData.company } }),
      prisma.application.count({ where: { userId, company: jobData.company, status: 'REJECTED' } }),
      prisma.application.count({ where: { userId, company: jobData.company, status: 'INTERVIEW_SCHEDULED' } }),
    ]);

    const features = extractFeatures({
      ...jobData,
      userProfile: {
        targetRole: profile?.targetRole || undefined,
        skills: (profile?.skills as string[]) || [],
      },
      userHistory: {
        appliedBefore: appliedBefore > 0,
        rejectedBefore: rejectedBefore > 0,
        interviewedBefore: interviewedBefore > 0,
      },
    });

    const threshold = modelRecord?.scoreThreshold || 70;
    const result = model.predict(features, threshold);

    // Salva predição para auditoria
    await prisma.neuralPrediction.create({
      data: {
        userId,
        jobTitle: jobData.title,
        company: jobData.company,
        features: features as any,
        score: result.score,
        confidence: result.confidence,
        shouldApply: result.shouldApply,
        reasoning: result.reasoning as any,
      },
    });

    return result;
  },

  async trainFromHistory(userId: string): Promise<{
    samplesUsed: number;
    accuracy: number;
    auc: number;
  }> {
    logger.info('Training neural model', { userId });

    // Busca todas as candidaturas com resultado conhecido
    const applications = await prisma.application.findMany({
      where: {
        userId,
        status: { not: 'APPLIED' }, // Tem algum resultado
      },
      orderBy: { appliedAt: 'asc' },
    });

    if (applications.length < 3) {
      logger.info('Not enough samples to train', { userId, count: applications.length });
      return { samplesUsed: 0, accuracy: 0, auc: 0 };
    }

    // Busca perfil
    const profile = await prisma.profile.findUnique({ where: { userId } });

    // Converte candidaturas em training samples
    const samples: TrainingSample[] = [];

    for (const app of applications) {
      const outcome = OUTCOME_FROM_STATUS[app.status] || 'PENDING';
      if (outcome === 'PENDING') continue;

      const features = extractFeatures({
        title: app.jobTitle,
        company: app.company,
        seniorityLevel: app.seniorityLevel || undefined,
        isRemote: app.location?.toLowerCase().includes('remote') || app.location?.toLowerCase().includes('remoto'),
        isEasyApply: true, // assume easy apply (automação)
        jobType: app.jobType || undefined,
        salaryMin: app.salary ? app.salary * 0.8 : undefined,
        salaryMax: app.salary || undefined,
        platform: app.platform,
        detectedSkills: (app.requiredSkills as string[]) || [],
        userProfile: {
          targetRole: profile?.targetRole || undefined,
          skills: (profile?.skills as string[]) || [],
        },
        userHistory: { appliedBefore: false, rejectedBefore: false, interviewedBefore: false },
      });

      // Peso baseado no quão importante é o outcome
      const outcomeWeight: Record<string, number> = {
        OFFER: 2.0, INTERVIEW: 1.5, VIEWED: 0.8, NO_RESPONSE: 1.0, REJECTED: 1.2,
      };

      samples.push({
        features,
        outcome,
        weight: outcomeWeight[outcome] || 1.0,
        createdAt: app.appliedAt,
      });
    }

    if (samples.length === 0) return { samplesUsed: 0, accuracy: 0, auc: 0 };

    const model = await this.getOrCreateModel(userId);
    model.trainOnline(samples, 0.05);

    const metrics = model.evaluate(samples);
    const serialized = model.serialize();
    const featureImportance = model.getFeatureImportance();

    // Salva modelo atualizado
    await prisma.userNeuralModel.update({
      where: { userId },
      data: {
        weights: serialized as any,
        totalSamples: samples.length,
        accuracy: metrics.accuracy,
        lastTrainedAt: new Date(),
        featureImportance: featureImportance as any,
      },
    });

    // Invalida cache
    modelCache.delete(userId);

    logger.info('Model trained', { userId, samples: samples.length, ...metrics });

    return { samplesUsed: samples.length, ...metrics };
  },

  async syncApplicationOutcome(applicationId: string): Promise<void> {
    const app = await prisma.application.findUnique({ where: { id: applicationId } });
    if (!app) return;

    const outcome = OUTCOME_FROM_STATUS[app.status] || 'PENDING';

    await prisma.neuralTrainingSample.upsert({
      where: { applicationId },
      update: { outcome: outcome as any },
      create: {
        modelId: await this.getModelId(app.userId),
        applicationId,
        features: {} as any,
        outcome: outcome as any,
        sampleWeight: 1.0,
      },
    });

    // Re-treina se tiver resultado definitivo
    if (['INTERVIEW', 'OFFER', 'REJECTED'].includes(outcome)) {
      await this.trainFromHistory(app.userId);
    }
  },

  async getModelStats(userId: string) {
    const [record, predictions, recentApps] = await Promise.all([
      prisma.userNeuralModel.findUnique({ where: { userId } }),
      prisma.neuralPrediction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 20,
      }),
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: true,
      }),
    ]);

    const avgScore = predictions.length > 0
      ? predictions.reduce((sum, p) => sum + p.score, 0) / predictions.length
      : 0;

    return {
      model: record,
      predictions: predictions.slice(0, 10),
      stats: {
        avgPredictedScore: Math.round(avgScore),
        totalPredictions: predictions.length,
        applicationsByStatus: recentApps,
      },
      featureImportance: record?.featureImportance || {},
    };
  },

  async updateThreshold(userId: string, threshold: number): Promise<void> {
    await prisma.userNeuralModel.upsert({
      where: { userId },
      update: { scoreThreshold: threshold },
      create: { userId, scoreThreshold: threshold, weights: {}, featureImportance: {} },
    });
  },

  async getModelId(userId: string): Promise<string> {
    const record = await prisma.userNeuralModel.upsert({
      where: { userId },
      update: {},
      create: { userId, weights: {}, featureImportance: {} },
    });
    return record.id;
  },
};