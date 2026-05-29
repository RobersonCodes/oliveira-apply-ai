import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { paginate, buildPaginationMeta } from '../utils/helpers';

export const applicationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const {
        page, limit, skip,
      } = paginate(req.query as any);

      const {
        status, platform, search, dateFrom, dateTo,
      } = req.query as Record<string, string>;

      const where: any = { userId };
      if (status) where.status = status;
      if (platform) where.platform = platform;
      if (dateFrom || dateTo) {
        where.appliedAt = {};
        if (dateFrom) where.appliedAt.gte = new Date(dateFrom);
        if (dateTo) where.appliedAt.lte = new Date(dateTo);
      }
      if (search) {
        where.OR = [
          { company: { contains: search, mode: 'insensitive' } },
          { jobTitle: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [applications, total] = await Promise.all([
        prisma.application.findMany({
          where,
          orderBy: { appliedAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.application.count({ where }),
      ]);

      res.json({
        success: true,
        data: applications,
        meta: buildPaginationMeta(total, page, limit),
      });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const app = await prisma.application.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!app) throw new AppError('Candidatura não encontrada', 404);
      res.json({ success: true, data: app });
    } catch (err) { next(err); }
  },

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { status, notes, interviewDate, salary } = req.body;

      const app = await prisma.application.findFirst({ where: { id: req.params.id, userId } });
      if (!app) throw new AppError('Candidatura não encontrada', 404);

      const updated = await prisma.application.update({
        where: { id: req.params.id },
        data: {
          status,
          notes: notes ?? app.notes,
          interviewDate: interviewDate ? new Date(interviewDate) : app.interviewDate,
          salary: salary ?? app.salary,
        },
      });

      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const app = await prisma.application.findFirst({ where: { id: req.params.id, userId } });
      if (!app) throw new AppError('Candidatura não encontrada', 404);
      await prisma.application.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Candidatura removida' });
    } catch (err) { next(err); }
  },

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { days = '30' } = req.query as Record<string, string>;
      const since = new Date();
      since.setDate(since.getDate() - parseInt(days, 10));

      const [total, byStatus, byPlatform] = await Promise.all([
        prisma.application.count({ where: { userId, appliedAt: { gte: since } } }),
        prisma.application.groupBy({
          by: ['status'],
          where: { userId, appliedAt: { gte: since } },
          _count: true,
        }),
        prisma.application.groupBy({
          by: ['platform'],
          where: { userId, appliedAt: { gte: since } },
          _count: true,
        }),
      ]);

      res.json({ success: true, data: { total, byStatus, byPlatform } });
    } catch (err) { next(err); }
  },
};
