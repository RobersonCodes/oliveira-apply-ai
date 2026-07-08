import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export class AuthService {
  async register(dto: { email: string; name: string; password: string }) {
    const exists = await prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new AppError('Email already in use', 409);

    const hashedPassword = await bcrypt.hash(dto.password, 12);

    const user = await prisma.user.create({
      data: {
        email: dto.email,
        name: dto.name,
        password: hashedPassword,
        profile: { create: {} },
        subscription: {
          create: {
            plan: 'FREE',
            applicationsLimit: 10,
          },
        },
      },
      select: {
        id: true, email: true, name: true, role: true, createdAt: true,
        subscription: { select: { plan: true, applicationsLimit: true } },
      },
    });

    const tokens = await this.generateTokens(user.id);
    logger.info(`New user registered: ${user.email}`);
    return { user, ...tokens };
  }

  async login(dto: { email: string; password: string }, ip?: string) {
    const user = await prisma.user.findUnique({
      where: { email: dto.email },
      include: {
        subscription: true,
        profile: true,
      },
    });

    if (!user || !user.isActive) {
      throw new AppError('Invalid credentials', 401);
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new AppError('Invalid credentials', 401);

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    try {
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'USER_LOGIN',
          ip,
        },
      });
    } catch { /* ignora erro de auditoria */ }

    const tokens = await this.generateTokens(user.id);
    const { password: _pass, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  async refreshToken(token: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token } });
    if (!stored || stored.expiresAt < new Date()) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    let payload: { userId: string };
    try {
      payload = jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
    } catch {
      throw new AppError('Invalid refresh token', 401);
    }

    await prisma.refreshToken.delete({ where: { token } });
    return this.generateTokens(payload.userId);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await prisma.refreshToken.deleteMany({
        where: { userId, token: refreshToken },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async generateTokens(userId: string) {
    // csrf: valor aleatório embutido no access token e devolvido ao cliente no corpo
    // da resposta (nunca em cookie) — usado no padrão synchronizer token para proteger
    // contra CSRF já que access/refresh token agora vivem só em cookies httpOnly.
    const csrf = crypto.randomBytes(20).toString('hex');

    const accessToken = jwt.sign({ userId, csrf }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign({ userId }, JWT_REFRESH_SECRET, {
      expiresIn: REFRESH_EXPIRES_IN,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.refreshToken.create({
      data: { userId, token: refreshToken, expiresAt },
    });

    return { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN, csrfToken: csrf };
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string; csrf: string };
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

export const authService = new AuthService();