import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

export class AnalyticsController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const [
        totalApplications,
        appliedThisMonth,
        interviews,
        offers,
        responseRate,
        recentApplications,
        applicationsByStatus,
        applicationsByDay,
        topCompanies,
        topRoles,
      ] = await Promise.all([
        prisma.application.count({ where: { userId } }),
        prisma.application.count({ where: { userId, createdAt: { gte: thirtyDaysAgo }, status: 'APPLIED' } }),
        prisma.application.count({ where: { userId, status: 'INTERVIEW' } }),
        prisma.application.count({ where: { userId, status: 'OFFER' } }),
        prisma.application.count({ where: { userId, status: { in: ['VIEWED', 'INTERVIEW', 'OFFER'] } } }),
        prisma.application.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true, jobTitle: true, company: true, companyLogo: true,
            status: true, appliedAt: true, location: true, isRemote: true,
            aiScore: true, platform: true,
          },
        }),
        prisma.application.groupBy({
          by: ['status'],
          where: { userId },
          _count: { status: true },
        }),
        prisma.$queryRaw`
          SELECT DATE(created_at) as date, COUNT(*)::int as count
          FROM applications
          WHERE user_id = ${userId}
            AND created_at >= ${thirtyDaysAgo}
          GROUP BY DATE(created_at)
          ORDER BY date ASC
        `,
        prisma.application.groupBy({
          by: ['company'],
          where: { userId, status: { in: ['VIEWED', 'INTERVIEW', 'OFFER'] } },
          _count: { company: true },
          orderBy: { _count: { company: 'desc' } },
          take: 5,
        }),
        prisma.application.groupBy({
          by: ['jobTitle'],
          where: { userId },
          _count: { jobTitle: true },
          orderBy: { _count: { jobTitle: 'desc' } },
          take: 5,
        }),
      ]);

      const total = totalApplications || 1;
      const responseRatePercent = Math.round((responseRate / total) * 100);

      res.json({
        success: true,
        data: {
          stats: {
            totalApplications,
            appliedThisMonth,
            interviews,
            offers,
            responseRate: responseRatePercent,
            successRate: Math.round((offers / total) * 100),
          },
          recentApplications,
          charts: {
            applicationsByStatus: applicationsByStatus.map(s => ({
              status: s.status,
              count: s._count.status,
            })),
            applicationsByDay,
            topCompanies: topCompanies.map(c => ({
              company: c.company,
              count: c._count.company,
            })),
            topRoles: topRoles.map(r => ({
              role: r.jobTitle,
              count: r._count.jobTitle,
            })),
          },
        },
      });
    } catch (err) { next(err); }
  }

  async getApplicationTrend(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const days = parseInt(req.query.days as string) || 30;
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const data = await prisma.$queryRaw`
        SELECT 
          DATE(created_at) as date,
          COUNT(*)::int as total,
          COUNT(CASE WHEN status = 'APPLIED' THEN 1 END)::int as applied,
          COUNT(CASE WHEN status = 'INTERVIEW' THEN 1 END)::int as interviews,
          COUNT(CASE WHEN status = 'OFFER' THEN 1 END)::int as offers
        FROM applications
        WHERE user_id = ${userId} AND created_at >= ${startDate}
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `;

      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

export const analyticsController = new AnalyticsController();
