import { Request, Response, NextFunction } from "express";
import { recruiterVisionService } from "../services/recruiterVision/recruiterVisionService";
import { AppError } from "../utils/AppError";

export const recruiterVisionController = {
  async analyze(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { resumeContent, jobDescription, jobTitle, company, applyUrl } = req.body;
      if (!resumeContent || !jobDescription || !company) throw new AppError("Campos obrigatorios faltando", 400);
      const result = await recruiterVisionService.analyze({ userId, resumeContent, jobDescription, jobTitle, company, applyUrl });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
  async detect(req: Request, res: Response, next: NextFunction) {
    try {
      const { company, applyUrl } = req.body;
      if (!company) throw new AppError("company e obrigatorio", 400);
      const result = await recruiterVisionService.detectOnly(company, applyUrl);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
  async score(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeContent, jobDescription, company, applyUrl } = req.body;
      const result = await recruiterVisionService.scoreOnly({ resumeContent, jobDescription, company, applyUrl });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
  async getSupportedATS(_req: Request, res: Response, next: NextFunction) {
    try {
      res.json({ success: true, data: recruiterVisionService.getSupportedATS() });
    } catch (err) { next(err); }
  },
};
