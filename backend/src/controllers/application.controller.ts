import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
import { AppError } from "../utils/AppError";

export const applicationController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { status, platform, search } = req.query as any;
      const where: any = { userId };
      if (status) where.status = status;
      if (platform) where.platform = platform;
      if (search) where.OR = [{ company: { contains: search, mode: "insensitive" } }, { jobTitle: { contains: search, mode: "insensitive" } }];
      const apps = await prisma.application.findMany({ where, orderBy: { appliedAt: "desc" }, take: 100 });
      res.json({ success: true, data: apps });
    } catch (err) { next(err); }
  },
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const app = await prisma.application.findFirst({ where: { id: req.params.id, userId } });
      if (!app) throw new AppError("Candidatura nao encontrada", 404);
      res.json({ success: true, data: app });
    } catch (err) { next(err); }
  },
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const app = await prisma.application.findFirst({ where: { id: req.params.id, userId } });
      if (!app) throw new AppError("Candidatura nao encontrada", 404);
      const updated = await prisma.application.update({ where: { id: req.params.id }, data: { status: req.body.status } });
      res.json({ success: true, data: updated });
    } catch (err) { next(err); }
  },
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const app = await prisma.application.findFirst({ where: { id: req.params.id, userId } });
      if (!app) throw new AppError("Candidatura nao encontrada", 404);
      await prisma.application.delete({ where: { id: req.params.id } });
      res.json({ success: true });
    } catch (err) { next(err); }
  },
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const [total, byStatus] = await Promise.all([
        prisma.application.count({ where: { userId } }),
        prisma.application.groupBy({ by: ["status"], where: { userId }, _count: true }),
      ]);
      res.json({ success: true, data: { total, byStatus } });
    } catch (err) { next(err); }
  },
};
