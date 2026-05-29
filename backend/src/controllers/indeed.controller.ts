// controller
import { Request, Response, NextFunction } from 'express';
import { indeedService } from '../services/platforms/indeedService';
import { AppError } from '../utils/AppError';

export const indeedController = {

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { keywords, location, remoteOnly, country, datePosted, jobType, maxResults } = req.body;

      if (!keywords) throw new AppError('keywords é obrigatório', 400);

      const jobs = await indeedService.searchOnly({
        userId,
        keywords,
        location,
        remoteOnly,
        country: country || 'br',
        datePosted: datePosted || '7days',
        jobType,
        maxResults: Math.min(maxResults || 20, 50),
      });

      res.json({
        success: true,
        data: jobs,
        meta: {
          total: jobs.length,
          country: country || 'br',
          withEasyApply: jobs.filter(j => j.isEasyApply).length,
          highScore: jobs.filter((j: any) => (j.neuralScore || 0) >= 70).length,
        },
      });
    } catch (err) { next(err); }
  },

  async getCountries(_req: Request, res: Response, next: NextFunction) {
    try {
      const countries = indeedService.getSupportedCountries();
      res.json({ success: true, data: countries });
    } catch (err) { next(err); }
  },

  async startAutomation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const {
        keywords, location, remoteOnly, country,
        maxApplications, minNeuralScore, applyWithEasyApply,
      } = req.body;

      if (!keywords) throw new AppError('keywords é obrigatório', 400);

      // Cria registro de automação
      const prisma = (await import('../config/database')).default;
      const automation = await prisma.automation.create({
        data: {
          userId,
          name: `Indeed — ${keywords}`,
          status: 'RUNNING',
          platform: 'indeed',
          config: req.body,
          startedAt: new Date(),
        },
      });

      // Roda em background
      indeedService.runAutomation(
        {
          automationId: automation.id,
          userId,
          searchParams: { keywords, location, remoteOnly, country: country || 'br', datePosted: '7days' },
          maxApplications: maxApplications || 20,
          minNeuralScore: minNeuralScore || 60,
          applyWithEasyApply: applyWithEasyApply ?? true,
          generateCoverLetter: false,
          headless: true,
        },
        async (msg) => {
          await prisma.automationLog.create({
            data: { automationId: automation.id, level: 'INFO', message: msg },
          });
        },
      ).then(async (result) => {
        await prisma.automation.update({
          where: { id: automation.id },
          data: {
            status: 'COMPLETED',
            completedAt: new Date(),
            jobsApplied: result.applied,
            jobsSkipped: result.skipped,
            jobsFailed: result.failed,
          },
        });
      }).catch(async (err) => {
        await prisma.automation.update({
          where: { id: automation.id },
          data: { status: 'FAILED', errorMessage: err.message },
        });
      });

      res.json({
        success: true,
        data: { automationId: automation.id },
        message: 'Automação Indeed iniciada em background',
      });
    } catch (err) { next(err); }
  },
};
