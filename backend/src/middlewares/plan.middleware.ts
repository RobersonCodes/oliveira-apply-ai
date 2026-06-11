import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';

type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';

const PLAN_RANK: Record<PlanType, number> = {
  FREE: 0,
  STARTER: 1,
  PRO: 2,
  ENTERPRISE: 3,
};

/**
 * requirePlan('PRO') — bloqueia FREE e STARTER
 * requirePlan('STARTER') — bloqueia só FREE
 */
export function requirePlan(minimumPlan: PlanType) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../config/database');
      const userId = (req as any).userId;

      if (!userId) throw new AppError('Não autenticado', 401);

      const subscription = await prisma.subscription.findUnique({
        where: { userId },
        select: { plan: true, status: true },
      });

      const userPlan = (subscription?.plan as PlanType) ?? 'FREE';
      const userRank = PLAN_RANK[userPlan] ?? 0;
      const requiredRank = PLAN_RANK[minimumPlan] ?? 0;

      if (userRank < requiredRank) {
        throw new AppError(
          `Este recurso requer o plano ${minimumPlan} ou superior. Seu plano atual é ${userPlan}.`,
          403,
        );
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
