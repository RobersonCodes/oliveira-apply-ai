// controller
import { Request, Response, NextFunction } from 'express';
import { platformsService, Platform } from '../services/platforms/platformsService';
import { AppError } from '../utils/AppError';

export const platformsController = {

  async searchAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { keywords, location, remoteOnly, platforms, maxPerPlatform, minNeuralScore } = req.body;

      if (!keywords) throw new AppError('keywords é obrigatório', 400);
      if (!platforms?.length) throw new AppError('Selecione ao menos uma plataforma', 400);

      const result = await platformsService.searchAll({
        userId,
        keywords,
        location,
        remoteOnly,
        platforms: platforms as Platform[],
        maxPerPlatform: Math.min(maxPerPlatform || 10, 20),
        minNeuralScore,
      });

      res.json({
        success: true,
        data: result.results,
        meta: {
          total: result.results.length,
          byPlatform: result.byPlatform,
          errors: result.errors,
          withHighScore: result.results.filter(j => (j.neuralScore || 0) >= 70).length,
        },
      });
    } catch (err) { next(err); }
  },

  async getPlatforms(_req: Request, res: Response, next: NextFunction) {
    try {
      const platforms = platformsService.getPlatformInfo();
      res.json({ success: true, data: platforms });
    } catch (err) { next(err); }
  },
};
