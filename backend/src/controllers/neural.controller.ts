import { Request, Response, NextFunction } from 'express';
import { neuralService } from '../services/neural/neuralService';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export const neuralController = {

  async predict(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const jobData = req.body;

      if (!jobData.title || !jobData.company) {
        throw new AppError('title e company são obrigatórios', 400);
      }

      const result = await neuralService.predict(userId, jobData);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async train(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const result = await neuralService.trainFromHistory(userId);

      if (result.samplesUsed === 0) {
        return res.json({
          success: true,
          data: result,
          message: 'Candidaturas insuficientes para treino. Continue aplicando!',
        });
      }

      res.json({
        success: true,
        data: result,
        message: `Modelo treinado com ${result.samplesUsed} candidaturas. Precisão: ${Math.round(result.accuracy * 100)}%`,
      });
    } catch (err) { next(err); }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const stats = await neuralService.getModelStats(userId);
      res.json({ success: true, data: stats });
    } catch (err) { next(err); }
  },

  async updateThreshold(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { threshold } = req.body;

      if (threshold < 0 || threshold > 100) {
        throw new AppError('Threshold deve ser entre 0 e 100', 400);
      }

      await neuralService.updateThreshold(userId, threshold);
      res.json({ success: true, message: 'Threshold atualizado' });
    } catch (err) { next(err); }
  },

  async syncOutcome(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { applicationId } = req.params;

      // Verifica ownership
      const app = await (await import('../config/database')).default.application.findFirst({
        where: { id: applicationId, userId },
      });
      if (!app) throw new AppError('Candidatura não encontrada', 404);

      await neuralService.syncApplicationOutcome(applicationId);
      res.json({ success: true, message: 'Outcome sincronizado e modelo atualizado' });
    } catch (err) { next(err); }
  },

  async batchPredict(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { jobs } = req.body;

      if (!Array.isArray(jobs) || jobs.length === 0) {
        throw new AppError('Envie um array de vagas em "jobs"', 400);
      }
      if (jobs.length > 50) {
        throw new AppError('Máximo 50 vagas por batch', 400);
      }

      const results = await Promise.all(
        jobs.map((job: any) => neuralService.predict(userId, job).catch(err => ({
          error: err.message,
          score: 0,
          shouldApply: false,
        }))),
      );

      // Ordena por score desc
      const ranked = jobs.map((job: any, i: number) => ({
        job,
        prediction: results[i],
      })).sort((a: any, b: any) => (b.prediction.score || 0) - (a.prediction.score || 0));

      res.json({
        success: true,
        data: ranked,
        summary: {
          total: ranked.length,
          shouldApply: ranked.filter((r: any) => r.prediction.shouldApply).length,
          avgScore: Math.round(results.reduce((s: number, r: any) => s + (r.score || 0), 0) / results.length),
        },
      });
    } catch (err) { next(err); }
  },
};
