import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { AppError } from '../utils/AppError';

export const notificationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { page, limit, skip } = paginate(req.query as any);
      const { unreadOnly } = req.query as Record<string, string>;

      const where: any = { userId };
      if (unreadOnly === 'true') where.isRead = false;

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.notification.count({ where }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);

      res.json({
        success: true,
        data: notifications,
        meta: { ...buildPaginationMeta(total, page, limit), unreadCount },
      });
    } catch (err) { next(err); }
  },

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { ids } = req.body;

      if (ids && Array.isArray(ids)) {
        await prisma.notification.updateMany({
          where: { id: { in: ids }, userId },
          data: { isRead: true, readAt: new Date() },
        });
      } else {
        // Mark all as read
        await prisma.notification.updateMany({
          where: { userId, isRead: false },
          data: { isRead: true, readAt: new Date() },
        });
      }

      res.json({ success: true, message: 'Notificações marcadas como lidas' });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const notif = await prisma.notification.findFirst({
        where: { id: req.params.id, userId },
      });
      if (!notif) throw new AppError('Notificação não encontrada', 404);
      await prisma.notification.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (err) { next(err); }
  },
};
