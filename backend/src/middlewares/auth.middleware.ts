import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';

const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS'];

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;
    const token = req.cookies?.accessToken || bearerToken;

    if (!token) {
      throw new AppError('Autenticação necessária', 401);
    }

    const payload = authService.verifyAccessToken(token);
    (req as any).userId = payload.userId;
    (req as any).csrf = payload.csrf;

    // O access token vive num cookie httpOnly enviado automaticamente pelo browser,
    // então requisições que mudam estado precisam provar que quem chamou de fato leu
    // o csrfToken (devolvido só no corpo da resposta de login/refresh/me) — um site
    // atacante não consegue ler esse valor por causa do same-origin policy.
    if (!SAFE_METHODS.includes(req.method)) {
      const headerCsrf = req.headers['x-csrf-token'];
      if (!headerCsrf || headerCsrf !== payload.csrf) {
        throw new AppError('CSRF token inválido ou ausente', 403);
      }
    }

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
