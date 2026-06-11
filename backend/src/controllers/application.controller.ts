// src/controllers/application.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { emailService } from '../services/email.service';

export const applicationController = {

  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { status, platform, search, limit, page } = req.query as any;

      const where: any = { userId };
      if (status)   where.status   = status;
      if (platform) where.platform = platform;
      if (search)   where.OR = [
        { company:  { contains: search, mode: 'insensitive' } },
        { jobTitle: { contains: search, mode: 'insensitive' } },
      ];

      const take = Math.min(Number(limit) || 100, 100);
      const skip = page ? (Number(page) - 1) * take : 0;

      const apps = await prisma.application.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      });

      res.json({ success: true, data: apps });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const app = await prisma.application.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!app) throw new AppError('Candidatura não encontrada', 404);
      res.json({ success: true, data: app });
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { status, notes } = req.body;

      const app = await prisma.application.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!app) throw new AppError('Candidatura não encontrada', 404);

      const updated = await prisma.application.update({
        where: { id: req.params.id },
        data: {
          status,
          ...(notes !== undefined && { notes }),
          ...(status === 'APPLIED'   && { appliedAt:   new Date() }),
          ...(status === 'VIEWED'    && { viewedAt:    new Date() }),
          ...(status === 'INTERVIEW' && { interviewAt: new Date() }),
          ...(status === 'OFFER'     && { offerAt:     new Date() }),
          ...(status === 'REJECTED'  && { rejectedAt:  new Date() }),
        },
      });

      // Disparar email conforme novo status (fire-and-forget)
      prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true },
      }).then(user => {
        if (!user) return;
        const firstName = user.name.split(' ')[0];

        if (status === 'APPLIED') {
          emailService.sendApplicationSent(
            user.email, firstName,
            updated.jobTitle, updated.company, updated.platform,
          ).catch(() => {});
        }

        if (status === 'VIEWED') {
          emailService.sendApplicationViewed(
            user.email, firstName,
            updated.jobTitle, updated.company,
          ).catch(() => {});
        }
      }).catch(() => {});

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const app = await prisma.application.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!app) throw new AppError('Candidatura não encontrada', 404);
      await prisma.application.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (err) { next(err); }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const [total, byStatus] = await Promise.all([
        prisma.application.count({ where: { userId } }),
        prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
      ]);
      res.json({ success: true, data: { total, byStatus } });
    } catch (err) { next(err); }
  },
};
