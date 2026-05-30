import { Request, Response, NextFunction } from "express";
import { analyzeCompanySignals, generateRadarAlert, generateDemoSignals, getSignalTypeLabel } from "../services/vagaRadar/radarService";
import { AppError } from "../utils/AppError";
import prisma from "../config/database";

export const vagaRadarController = {
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { company, newsText, targetRoles } = req.body;
      if (!company || !newsText) throw new AppError("company e newsText sao obrigatorios", 400);
      const profile = await prisma.profile.findUnique({ where: { userId } });
      const userSkills = (profile?.skills as string[]) || [];
      const roles = targetRoles || [profile?.desiredRoles?.[0] || "Software Engineer"];
      const signals = await analyzeCompanySignals(company, newsText, userSkills);
      const alerts = signals.map(s => generateRadarAlert(s, userSkills, roles));
      res.json({ success: true, data: { alerts, summary: { totalSignals: signals.length } } });
    } catch (err) { next(err); }
  },
  async demo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const profile = await prisma.profile.findUnique({ where: { userId } });
      const userSkills = (profile?.skills as string[]) || ["TypeScript", "React", "Node.js"];
      const alerts = generateDemoSignals(userSkills);
      res.json({ success: true, data: { alerts, isDemo: true } });
    } catch (err) { next(err); }
  },
  async getSignalTypes(_req: Request, res: Response, next: NextFunction) {
    try {
      const types = ["funding_round","leadership_hire","product_launch","expansion","layoff_recovery","ipo_preparation","acquisition","tech_migration","regulatory_compliance","competitor_move"].map(type => ({ type, label: getSignalTypeLabel(type as any) }));
      res.json({ success: true, data: types });
    } catch (err) { next(err); }
  },
};
