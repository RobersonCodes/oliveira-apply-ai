import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError('Authorization header required', 401);
    }
    const token = authHeader.split(' ')[1];
    const payload = authService.verifyAccessToken(token);
    (req as any).userId = payload.userId;
    next();
  } catch (err) { next(err); }
}

export function requireRole(...roles: string[]) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import('../config/database');
      const user = await prisma.user.findUnique({
        where: { id: (req as any).userId },
        select: { role: true },
      });
      if (!user || !roles.includes(user.role)) {
        throw new AppError('Insufficient permissions', 403);
      }
      next();
    } catch (err) { next(err); }
  };
}
