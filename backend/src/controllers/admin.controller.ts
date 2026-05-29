import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import logger from '../utils/logger';

export const adminController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [
        totalUsers,
        activeUsers,
        totalApplications,
        totalAutomations,
        runningAutomations,
        revenue,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.application.count(),
        prisma.automation.count(),
        prisma.automation.count({ where: { status: 'RUNNING' } }),
        prisma.subscription.aggregate({
          where: { status: 'ACTIVE' },
          _sum: { amount: true },
        }),
      ]);

      const newUsersThisMonth = await prisma.user.count({
        where: {
          createdAt: { gte: new Date(new Date().setDate(1)) },
        },
      });

      res.json({
        success: true,
        data: {
          totalUsers,
          activeUsers,
          totalApplications,
          totalAutomations,
          runningAutomations,
          mrr: revenue._sum.amount || 0,
          newUsersThisMonth,
        },
      });
    } catch (err) { next(err); }
  },

  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = paginate(req.query as any);
      const { search, plan, isActive } = req.query as Record<string, string>;

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }
      if (isActive !== undefined) where.isActive = isActive === 'true';

      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, name: true, email: true, role: true,
            isActive: true, isEmailVerified: true, createdAt: true,
            subscription: { select: { plan: true, status: true } },
            _count: { select: { applications: true, automations: true } },
          },
        }),
        prisma.user.count({ where }),
      ]);

      res.json({ success: true, data: users, meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  },

  async toggleUser(req: Request, res: Response, next: NextFunction) {
    try {
      const { isActive } = req.body;
      const user = await prisma.user.update({
        where: { id: req.params.id },
        data: { isActive },
        select: { id: true, name: true, email: true, isActive: true },
      });
      logger.info('Admin toggled user', { adminId: (req as any).user.id, targetUserId: user.id, isActive });
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },

  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = paginate(req.query as any);
      const { userId, action, resource } = req.query as Record<string, string>;

      const where: any = {};
      if (userId) where.userId = userId;
      if (action) where.action = { contains: action, mode: 'insensitive' };
      if (resource) where.resource = resource;

      const [logs, total] = await Promise.all([
        prisma.auditLog.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: { user: { select: { id: true, name: true, email: true } } },
        }),
        prisma.auditLog.count({ where }),
      ]);

      res.json({ success: true, data: logs, meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  },

  async getAutomations(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, skip } = paginate(req.query as any);
      const { status } = req.query as Record<string, string>;

      const where: any = {};
      if (status) where.status = status;

      const [automations, total] = await Promise.all([
        prisma.automation.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            _count: { select: { applications: true } },
          },
        }),
        prisma.automation.count({ where }),
      ]);

      res.json({ success: true, data: automations, meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  },
};
