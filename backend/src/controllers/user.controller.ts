import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import bcrypt from 'bcryptjs';
import logger from '../utils/logger';

export const userController = {
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          profile: true,
          subscription: true,
          _count: {
            select: { applications: true, automations: true, resumes: true },
          },
        },
      });
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const { password, ...safeUser } = user as any;
      res.json({ success: true, data: safeUser });
    } catch (err) { next(err); }
  },

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { name, ...profileData } = req.body;

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          profile: {
            upsert: {
              update: profileData,
              create: profileData,
            },
          },
        },
        include: { profile: true },
      });

      const { password, ...safeUser } = updatedUser as any;
      res.json({ success: true, data: safeUser });
    } catch (err) { next(err); }
  },

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { currentPassword, newPassword } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) throw new AppError('Senha atual incorreta', 400, 'WRONG_PASSWORD');

      const hashed = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

      // Invalidate all refresh tokens
      await prisma.refreshToken.deleteMany({ where: { userId } });

      logger.info('Password changed', { userId });
      res.json({ success: true, message: 'Senha alterada com sucesso. Faça login novamente.' });
    } catch (err) { next(err); }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('Usuário não encontrado', 404);

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) throw new AppError('Senha incorreta', 400);

      await prisma.user.update({
        where: { id: userId },
        data: { isActive: false, email: `deleted_${userId}_${user.email}` },
      });

      logger.info('Account deleted', { userId });
      res.json({ success: true, message: 'Conta deletada com sucesso' });
    } catch (err) { next(err); }
  },

  async getUsageStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      const [applicationsThisMonth, totalApplications, activeAutomations] = await Promise.all([
        prisma.application.count({
          where: { userId, appliedAt: { gte: startOfMonth } },
        }),
        prisma.application.count({ where: { userId } }),
        prisma.automation.count({ where: { userId, status: 'RUNNING' } }),
      ]);

      const plan = user?.subscription?.plan || 'FREE';
      const limits = {
        FREE: { applications: 10 },
        STARTER: { applications: 100 },
        PRO: { applications: 500 },
        ENTERPRISE: { applications: 999999 },
      };

      const planLimit = limits[plan as keyof typeof limits];

      res.json({
        success: true,
        data: {
          applicationsThisMonth,
          totalApplications,
          activeAutomations,
          plan,
          limits: planLimit,
          usage: {
            applications: {
              used: applicationsThisMonth,
              limit: planLimit.applications,
              percentage: Math.min(100, (applicationsThisMonth / planLimit.applications) * 100),
            },
          },
        },
      });
    } catch (err) { next(err); }
  },
};
