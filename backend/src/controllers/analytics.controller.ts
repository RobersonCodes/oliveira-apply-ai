import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export const analyticsController = {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const [total, byStatus, avgScore] = await Promise.all([
        prisma.application.count({ where: { userId } }),
        prisma.application.groupBy({ by: ['status'], where: { userId }, _count: true }),
        prisma.application.aggregate({ where: { userId, aiScore: { not: null } }, _avg: { aiScore: true } }),
      ]);
      const interviews = byStatus.find((s: any) => s.status === 'INTERVIEW')?._count || 0;
      const offers = byStatus.find((s: any) => s.status === 'OFFER')?._count || 0;
      const viewed = byStatus.find((s: any) => s.status === 'VIEWED')?._count || 0;
      const responseRate = total > 0 ? Math.round(((interviews + offers + viewed) / total) * 100) : 0;
      const statusBreakdown = byStatus.reduce((acc: any, s: any) => { acc[s.status] = s._count; return acc; }, {});
      res.json({ success: true, data: { totalApplications: total, responseRate, interviews, offers, avgAiScore: avgScore._avg.aiScore, statusBreakdown } });
    } catch (err) { next(err); }
  },

  async getCharts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const apps = await prisma.application.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true, status: true, platform: true },
        orderBy: { createdAt: 'asc' },
      });
      const trendMap: Record<string, { aplicacoes: number; respostas: number }> = {};
      apps.forEach((app: any) => {
        const day = app.createdAt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
        if (!trendMap[day]) trendMap[day] = { aplicacoes: 0, respostas: 0 };
        trendMap[day].aplicacoes++;
        if (['VIEWED', 'INTERVIEW', 'OFFER'].includes(app.status)) trendMap[day].respostas++;
      });
      const trend = Object.entries(trendMap).map(([day, data]) => ({ day, 'aplicacoes': data.aplicacoes, 'respostas': data.respostas }));
      const platformMap: Record<string, number> = {};
      apps.forEach((app: any) => { platformMap[app.platform] = (platformMap[app.platform] || 0) + 1; });
      const platforms = Object.entries(platformMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
      res.json({ success: true, data: { trend, platforms } });
    } catch (err) { next(err); }
  },

  async getApplicationTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const apps = await prisma.application.findMany({
        where: { userId, createdAt: { gte: since } },
        select: { createdAt: true, status: true },
      });
      res.json({ success: true, data: apps });
    } catch (err) { next(err); }
  },
};