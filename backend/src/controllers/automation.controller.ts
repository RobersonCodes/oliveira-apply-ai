import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { automationQueue } from '../config/queue';
import { AppError } from '../utils/AppError';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import { encrypt } from '../utils/crypto';
import logger from '../utils/logger';

export const automationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { page, limit, skip } = paginate(req.query as any);

      const [automations, total] = await Promise.all([
        prisma.automation.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
          include: {
            _count: { select: { applications: true, logs: true } },
          },
        }),
        prisma.automation.count({ where: { userId } }),
      ]);

      res.json({
        success: true,
        data: automations,
        meta: buildPaginationMeta(total, page, limit),
      });
    } catch (err) { next(err); }
  },

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const automation = await prisma.automation.findFirst({
        where: { id: req.params.id, userId },
        include: {
          logs: { orderBy: { createdAt: 'desc' }, take: 50 },
          _count: { select: { applications: true } },
        },
      });
      if (!automation) throw new AppError('Automação não encontrada', 404);
      res.json({ success: true, data: automation });
    } catch (err) { next(err); }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { subscription: true },
      });

      const activeCount = await prisma.automation.count({
        where: { userId, status: { in: ['RUNNING', 'PAUSED'] } },
      });

      const plan = user?.subscription?.plan || 'FREE';
      const maxConcurrent = { FREE: 1, STARTER: 2, PRO: 5, ENTERPRISE: 20 }[plan] || 1;
      if (activeCount >= maxConcurrent) {
        throw new AppError(`Seu plano permite até ${maxConcurrent} automação(ões) simultânea(s)`, 403);
      }

      const automation = await prisma.automation.create({
        data: { ...req.body, userId, status: 'IDLE' },
      });

      res.status(201).json({ success: true, data: automation });
    } catch (err) { next(err); }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const existing = await prisma.automation.findFirst({ where: { id: req.params.id, userId } });
      if (!existing) throw new AppError('Automação não encontrada', 404);
      if (existing.status === 'RUNNING') throw new AppError('Não é possível editar uma automação em execução', 400);

      const automation = await prisma.automation.update({
        where: { id: req.params.id },
        data: req.body,
      });
      res.json({ success: true, data: automation });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const existing = await prisma.automation.findFirst({ where: { id: req.params.id, userId } });
      if (!existing) throw new AppError('Automação não encontrada', 404);
      if (existing.status === 'RUNNING') throw new AppError('Pare a automação antes de deletar', 400);

      await prisma.automation.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Automação deletada com sucesso' });
    } catch (err) { next(err); }
  },

  async start(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const automation = await prisma.automation.findFirst({ where: { id: req.params.id, userId } });
      if (!automation) throw new AppError('Automação não encontrada', 404);
      if (automation.status === 'RUNNING') throw new AppError('Automação já está em execução', 400);

      const linkedInAccount = await prisma.linkedinAccount.findFirst({
        where: { userId, isActive: true },
      });
      if (!linkedInAccount) throw new AppError('Configure sua conta do LinkedIn antes de iniciar', 400);

      await prisma.automation.update({
        where: { id: automation.id },
        data: { status: 'RUNNING', startedAt: new Date() },
      });

      const job = await automationQueue.add(
        'run-automation',
        { automationId: automation.id, userId },
        { jobId: `automation-${automation.id}` },
      );

      logger.info('Automation queued', { automationId: automation.id, jobId: job.id });
      res.json({ success: true, message: 'Automação iniciada', jobId: job.id });
    } catch (err) { next(err); }
  },

  async stop(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const automation = await prisma.automation.findFirst({ where: { id: req.params.id, userId } });
      if (!automation) throw new AppError('Automação não encontrada', 404);

      await automationQueue.remove(`automation-${automation.id}`);

      await prisma.automation.update({
        where: { id: automation.id },
        data: { status: 'STOPPED', completedAt: new Date() },
      });

      await prisma.automationLog.create({
        data: {
          automationId: automation.id,
          level: 'INFO',
          message: 'Automação parada pelo usuário',
        },
      });

      res.json({ success: true, message: 'Automação parada com sucesso' });
    } catch (err) { next(err); }
  },

  async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const automation = await prisma.automation.findFirst({ where: { id: req.params.id, userId } });
      if (!automation) throw new AppError('Automação não encontrada', 404);

      const { page, limit, skip } = paginate(req.query as any);
      const [logs, total] = await Promise.all([
        prisma.automationLog.findMany({
          where: { automationId: automation.id },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.automationLog.count({ where: { automationId: automation.id } }),
      ]);

      res.json({ success: true, data: logs, meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  },

  async saveLinkedInCredentials(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { email, password } = req.body;

      const encryptedPassword = encrypt(password);

      const account = await prisma.linkedinAccount.upsert({
        where: { userId_email: { userId, email } },
        update: { password: encryptedPassword, isActive: true },
        create: { userId, email, password: encryptedPassword, isActive: true },
      });

      res.json({
        success: true,
        data: { id: account.id, email: account.email, isActive: account.isActive },
      });
    } catch (err) { next(err); }
  },
};
