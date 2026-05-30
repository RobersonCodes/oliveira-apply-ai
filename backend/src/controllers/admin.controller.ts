import { Request, Response, NextFunction } from "express";
import prisma from "../config/database";
export const adminController = {
  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const [totalUsers, totalApplications, totalAutomations] = await Promise.all([prisma.user.count(), prisma.application.count(), prisma.automation.count()]);
      res.json({ success: true, data: { totalUsers, totalApplications, totalAutomations, mrr: 0, runningAutomations: 0, newUsersThisMonth: 0 } });
    } catch (err) { next(err); }
  },
  async listUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, subscription: { select: { plan: true } }, _count: { select: { applications: true } } } });
      res.json({ success: true, data: users });
    } catch (err) { next(err); }
  },
  async toggleUser(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await prisma.user.update({ where: { id: req.params.id }, data: { isActive: req.body.isActive }, select: { id: true, isActive: true } });
      res.json({ success: true, data: user });
    } catch (err) { next(err); }
  },
  async getAuditLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      res.json({ success: true, data: logs });
    } catch (err) { next(err); }
  },
  async getAutomations(req: Request, res: Response, next: NextFunction) {
    try {
      const automations = await prisma.automation.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      res.json({ success: true, data: automations });
    } catch (err) { next(err); }
  },
};
