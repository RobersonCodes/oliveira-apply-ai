import { Request, Response, NextFunction } from "express";
import { generateShadowPersona, analyzeJobReceptivity } from "../services/shadowApply/personaGenerator";
import { AppError } from "../utils/AppError";
import prisma from "../config/database";

export const shadowApplyController = {
  async generatePersona(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { targetRole, targetCompany, jobDescription, seniorityLevel, location } = req.body;
      if (!targetRole || !targetCompany || !jobDescription) throw new AppError("Campos obrigatorios faltando", 400);
      const profile = await prisma.profile.findUnique({ where: { userId } });
      const userSkills = (profile?.skills as string[]) || [];
      const persona = await generateShadowPersona({ targetRole, targetCompany, jobDescription, userSkills, seniorityLevel, location });
      res.json({ success: true, data: persona });
    } catch (err) { next(err); }
  },
  async analyzeReceptivity(req: Request, res: Response, next: NextFunction) {
    try {
      const signals = analyzeJobReceptivity(req.body);
      res.json({ success: true, data: { signals, recommendation: signals.isRealOpening ? "apply_now" : "skip" } });
    } catch (err) { next(err); }
  },
  async fullAnalysis(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { targetRole, targetCompany, jobDescription, jobData, seniorityLevel } = req.body;
      if (!targetRole || !targetCompany || !jobDescription) throw new AppError("Campos obrigatorios faltando", 400);
      const profile = await prisma.profile.findUnique({ where: { userId } });
      const userSkills = (profile?.skills as string[]) || [];
      const [persona, signals] = await Promise.all([
        generateShadowPersona({ targetRole, targetCompany, jobDescription, userSkills, seniorityLevel }),
        Promise.resolve(analyzeJobReceptivity(jobData || {})),
      ]);
      res.json({ success: true, data: { persona, signals, recommendation: signals.isRealOpening ? "apply_now" : "skip" } });
    } catch (err) { next(err); }
  },
};
