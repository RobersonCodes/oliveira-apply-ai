import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import { logger } from '../utils/logger';
import type { RegisterDTO, LoginDTO } from '../dtos/auth.dto';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!;
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export class AuthService {
  async register(dto: RegisterDTO) {
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

  async login(dto: LoginDTO, ip?: string) {
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

    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        ip,
      },
    });

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

    // Rotate token
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
    const accessToken = jwt.sign({ userId }, JWT_SECRET, {
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

    return { accessToken, refreshToken, expiresIn: JWT_EXPIRES_IN };
  }

  verifyAccessToken(token: string) {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: string };
    } catch {
      throw new AppError('Invalid or expired token', 401);
    }
  }
}

export const authService = new AuthService();
