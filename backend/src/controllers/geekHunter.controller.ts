// controller
import { Request, Response, NextFunction } from 'express';
import { geekHunterService } from '../services/platforms/geekHunterService';
import { AppError } from '../utils/AppError';
import prisma from '../config/database';

export const geekHunterController = {

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { keywords, skills, location, remoteOnly, salaryMin, seniorityLevels, maxResults } = req.body;

      const jobs = await geekHunterService.searchWithScores({
        userId,
        keywords,
        skills,
        location,
        remoteOnly,
        salaryMin,
        seniorityLevels,
        maxResults: Math.min(maxResults || 20, 50),
      });

      res.json({
        success: true,
        data: jobs,
        meta: {
          total: jobs.length,
          withHighScore: jobs.filter((j: any) => (j.neuralScore || 0) >= 70).length,
          remote: jobs.filter((j: any) => j.isRemote).length,
        },
      });
    } catch (err) { next(err); }
  },

  async getSkillCategories(_req: Request, res: Response, next: NextFunction) {
    try {
      const categories = geekHunterService.getSkillCategories();
      res.json({ success: true, data: categories });
    } catch (err) { next(err); }
  },

  async startAutomation(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { keywords, skills, remoteOnly, maxApplications, minNeuralScore, seniorityLevels } = req.body;

      const automation = await prisma.automation.create({
        data: {
          userId,
          name: `GeekHunter — ${keywords || skills?.join(', ')}`,
          status: 'RUNNING',
          platform: 'geekhunter',
          config: req.body,
          startedAt: new Date(),
        },
      });

      geekHunterService.runAutomation(
        {
          automationId: automation.id,
          userId,
          searchParams: { keywords, skills, remoteOnly, seniorityLevels },
          maxApplications: maxApplications || 15,
          minNeuralScore: minNeuralScore || 65,
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
          data: { status: 'COMPLETED', completedAt: new Date(), jobsApplied: result.applied },
        });
      }).catch(async (err) => {
        await prisma.automation.update({
          where: { id: automation.id },
          data: { status: 'FAILED', errorMessage: err.message },
        });
      });

      res.json({ success: true, data: { automationId: automation.id }, message: 'Automação GeekHunter iniciada!' });
    } catch (err) { next(err); }
  },
};
