import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { AppError } from '../utils/AppError';
import { setAuthCookies, clearAuthCookies } from '../utils/authCookies';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, name, password } = req.body;
      if (!email || !name || !password) throw new AppError('Email, nome e senha são obrigatórios', 400);
      const result = await authService.register({ email, name, password });
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.status(201).json({ success: true, data: { user: result.user, csrfToken: result.csrfToken, expiresIn: result.expiresIn } });
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      if (!email || !password) throw new AppError('Email e senha são obrigatórios', 400);
      const result = await authService.login({ email, password }, req.ip);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ success: true, data: { user: result.user, csrfToken: result.csrfToken, expiresIn: result.expiresIn } });
    } catch (err) { next(err); }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      if (!token) throw new AppError('Refresh token required', 401);
      const result = await authService.refreshToken(token);
      setAuthCookies(res, result.accessToken, result.refreshToken);
      res.json({ success: true, data: { csrfToken: result.csrfToken, expiresIn: result.expiresIn } });
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies?.refreshToken;
      await authService.logout((req as any).userId, token);
      clearAuthCookies(res);
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (err) { next(err); }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const { prisma } = await import('../config/database');
      const user = await prisma.user.findUnique({
        where: { id: (req as any).userId },
        select: {
          id: true, email: true, name: true, avatar: true, role: true,
          createdAt: true, lastLoginAt: true,
          profile: true,
          subscription: { select: { plan: true, applicationsUsed: true, applicationsLimit: true, status: true, trialEnd: true } },
        },
      });
      if (!user) throw new AppError('User not found', 404);
      res.json({ success: true, data: { ...user, csrfToken: (req as any).csrf } });
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
