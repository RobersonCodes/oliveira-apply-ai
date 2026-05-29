import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { registerSchema, loginSchema } from '../validations/auth.validation';
import { AppError } from '../utils/AppError';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = registerSchema.parse(req.body);
      const result = await authService.register(dto);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const dto = loginSchema.parse(req.body);
      const result = await authService.login(dto, req.ip);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, data: { user: result.user, accessToken: result.accessToken, expiresIn: result.expiresIn } });
    } catch (err) { next(err); }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken || req.body.refreshToken;
      if (!token) throw new AppError('Refresh token required', 401);
      const result = await authService.refreshToken(token);
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true, secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000,
      });
      res.json({ success: true, data: { accessToken: result.accessToken, expiresIn: result.expiresIn } });
    } catch (err) { next(err); }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const token = req.cookies.refreshToken;
      await authService.logout((req as any).userId, token);
      res.clearCookie('refreshToken');
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
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  }
}

export const authController = new AuthController();
