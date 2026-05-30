import { Request, Response, NextFunction } from "express";
import { generateNetworkingStrategy, generateCommentForPost } from "../services/conexaoCirurgica/networkingService";
import { AppError } from "../utils/AppError";
import prisma from "../config/database";
export const conexaoCirurgicaController = {
  async createStrategy(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { company, jobTitle, hiringManager, recruiterName, jobDescription, startDate } = req.body;
      if (!company || !jobTitle) throw new AppError("company e jobTitle sao obrigatorios", 400);
      const profile = await prisma.profile.findUnique({ where: { userId } });
      const userSkills = (profile?.skills as string[]) || [];
      const strategy = await generateNetworkingStrategy({ userId, company, jobTitle, hiringManager, recruiterName, userSkills, jobDescription, startDate: startDate ? new Date(startDate) : undefined });
      res.json({ success: true, data: strategy });
    } catch (err) { next(err); }
  },
  async generateComment(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { postContent, tone } = req.body;
      if (!postContent) throw new AppError("postContent e obrigatorio", 400);
      const profile = await prisma.profile.findUnique({ where: { userId } });
      const userSkills = (profile?.skills as string[]) || [];
      const comment = await generateCommentForPost({ postContent, userSkills, tone: tone || "thoughtful" });
      res.json({ success: true, data: comment });
    } catch (err) { next(err); }
  },
};
