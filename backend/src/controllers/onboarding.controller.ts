// src/controllers/onboarding.controller.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export const onboardingController = {

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          onboardingCompleted: true,
          preferences: true,
        },
      });

      if (!user) throw new AppError('Usuário não encontrado', 404);

      res.json({
        success: true,
        data: {
          onboardingCompleted: user.onboardingCompleted,
          preferences: user.preferences ?? null,
        },
      });
    } catch (err) { next(err); }
  },

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      const {
        jobTitle,
        area,
        minSalary,
        workRegime,
        city,
        state,
        remoteOnly = false,
        autoApplyEnabled = false,
        platforms = [],
      } = req.body;

      if (!jobTitle || typeof jobTitle !== 'string' || jobTitle.trim().length === 0) {
        throw new AppError('Cargo desejado é obrigatório', 400);
      }

      const validRegimes = ['CLT', 'PJ', 'Remoto', 'Híbrido'];
      if (workRegime && !validRegimes.includes(workRegime)) {
        throw new AppError('Regime de trabalho inválido', 400);
      }

      const validPlatforms = ['LinkedIn', 'Indeed', 'InfoJobs', 'Gupy', 'Catho'];
      const invalidPlatforms = (platforms as string[]).filter((p: string) => !validPlatforms.includes(p));
      if (invalidPlatforms.length > 0) {
        throw new AppError(`Plataformas inválidas: ${invalidPlatforms.join(', ')}`, 400);
      }

      const preferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          jobTitle: jobTitle.trim(),
          area: area?.trim() ?? null,
          minSalary: minSalary ? Number(minSalary) : null,
          workRegime: workRegime ?? null,
          city: city?.trim() ?? null,
          state: state?.trim() ?? null,
          remoteOnly: Boolean(remoteOnly),
          autoApplyEnabled: Boolean(autoApplyEnabled),
          platforms,
        },
        create: {
          userId,
          jobTitle: jobTitle.trim(),
          area: area?.trim() ?? null,
          minSalary: minSalary ? Number(minSalary) : null,
          workRegime: workRegime ?? null,
          city: city?.trim() ?? null,
          state: state?.trim() ?? null,
          remoteOnly: Boolean(remoteOnly),
          autoApplyEnabled: Boolean(autoApplyEnabled),
          platforms,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { onboardingCompleted: true },
      });

      logger.info('Onboarding completed', { userId, jobTitle, platforms });

      res.json({
        success: true,
        message: 'Onboarding concluído com sucesso',
        data: preferences,
      });
    } catch (err) { next(err); }
  },

  async updatePreferences(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;

      const {
        jobTitle,
        area,
        minSalary,
        workRegime,
        city,
        state,
        remoteOnly,
        autoApplyEnabled,
        platforms,
      } = req.body;

      const validRegimes = ['CLT', 'PJ', 'Remoto', 'Híbrido'];
      if (workRegime && !validRegimes.includes(workRegime)) {
        throw new AppError('Regime de trabalho inválido', 400);
      }

      const validPlatforms = ['LinkedIn', 'Indeed', 'InfoJobs', 'Gupy', 'Catho'];
      if (platforms) {
        const invalid = (platforms as string[]).filter((p: string) => !validPlatforms.includes(p));
        if (invalid.length > 0) throw new AppError(`Plataformas inválidas: ${invalid.join(', ')}`, 400);
      }

      const updated = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
          ...(jobTitle !== undefined && { jobTitle: jobTitle.trim() }),
          ...(area !== undefined && { area: area?.trim() ?? null }),
          ...(minSalary !== undefined && { minSalary: minSalary ? Number(minSalary) : null }),
          ...(workRegime !== undefined && { workRegime }),
          ...(city !== undefined && { city: city?.trim() ?? null }),
          ...(state !== undefined && { state: state?.trim() ?? null }),
          ...(remoteOnly !== undefined && { remoteOnly: Boolean(remoteOnly) }),
          ...(autoApplyEnabled !== undefined && { autoApplyEnabled: Boolean(autoApplyEnabled) }),
          ...(platforms !== undefined && { platforms }),
        },
        create: {
          userId,
          jobTitle: jobTitle?.trim() ?? '',
          area: area?.trim() ?? null,
          minSalary: minSalary ? Number(minSalary) : null,
          workRegime: workRegime ?? null,
          city: city?.trim() ?? null,
          state: state?.trim() ?? null,
          remoteOnly: remoteOnly ? Boolean(remoteOnly) : false,
          autoApplyEnabled: autoApplyEnabled ? Boolean(autoApplyEnabled) : false,
          platforms: platforms ?? [],
        },
      });

      logger.info('Preferences updated', { userId });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },
};
