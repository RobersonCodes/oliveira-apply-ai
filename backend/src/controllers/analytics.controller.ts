import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";

export const analyticsController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const [total, byStatus] = await Promise.all([
        prisma.application.count({ where: { userId } }),
        prisma.application.groupBy({ by: ["status"], where: { userId }, _count: true }),
      ]);
      const interviews = byStatus.find(s => s.status === "INTERVIEW")?._count || 0;
      const offers = byStatus.find(s => s.status === "OFFER")?._count || 0;
      const responseRate = total > 0 ? Math.round(((interviews + offers) / total) * 100) : 0;
      res.json({ success: true, data: { totalApplications: total, responseRate, interviews, offers, byStatus } });
    } catch (err) { next(err); }
  },
  async getApplicationTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const days = 30;
      const since = new Date();
      since.setDate(since.getDate() - days);
      const apps = await prisma.application.findMany({ where: { userId, appliedAt: { gte: since } }, select: { appliedAt: true, status: true } });
      res.json({ success: true, data: apps });
    } catch (err) { next(err); }
  },
};
