import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { aiService } from '../services/ai.service';
import { AppError } from '../utils/AppError';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';

export const resumeController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { page, limit, skip } = paginate(req.query as any);
      const [resumes, total] = await Promise.all([
        prisma.resume.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.resume.count({ where: { userId } }),
      ]);
      res.json({ success: true, data: resumes, meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      if (!req.file) throw new AppError('Nenhum arquivo enviado', 400);

      const resume = await prisma.resume.create({
        data: {
          userId,
          name: req.body.name || path.parse(req.file.originalname).name,
          originalName: req.file.originalname,
          filePath: req.file.path,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          isOriginal: true,
          isActive: true,
        },
      });

      // Set all others as inactive
      await prisma.resume.updateMany({
        where: { userId, id: { not: resume.id }, isOriginal: true },
        data: { isActive: false },
      });

      res.status(201).json({ success: true, data: resume });
    } catch (err) { next(err); }
  },

  async adapt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { resumeId, jobDescription, jobTitle, company } = req.body;

      const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
      if (!resume) throw new AppError('Currículo não encontrado', 404);

      let resumeContent = req.body.resumeContent;
      if (!resumeContent && resume.content) {
        resumeContent = resume.content;
      }

      if (!resumeContent) throw new AppError('Conteúdo do currículo não disponível', 400);

      const [adapted, skills] = await Promise.all([
        aiService.adaptResume(resumeContent, jobDescription),
        aiService.extractSkillsFromJD(jobDescription),
      ]);

      const adaptedResume = await prisma.resume.create({
        data: {
          userId,
          name: `${resume.name} - Adaptado para ${company || jobTitle || 'vaga'}`,
          originalName: resume.originalName,
          filePath: resume.filePath,
          fileSize: resume.fileSize,
          mimeType: resume.mimeType,
          isOriginal: false,
          isActive: false,
          content: adapted.adaptedContent,
          atsScore: adapted.atsScore,
          parentId: resume.id,
          jobTitle,
          company,
          detectedSkills: skills,
          improvements: adapted.improvements,
        },
      });

      res.json({ success: true, data: adaptedResume, adapted, skills });
    } catch (err) { next(err); }
  },

  async generateCoverLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const { jobDescription, jobTitle, company, resumeContent } = req.body;

      const profile = await prisma.profile.findUnique({ where: { userId } });
      const userName = (req as any).user.name;

      const coverLetter = await aiService.generateCoverLetter(
        resumeContent || '',
        jobDescription,
        `${company} - ${jobTitle}`,
      );

      res.json({ success: true, data: { coverLetter } });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).user.id;
      const resume = await prisma.resume.findFirst({ where: { id: req.params.id, userId } });
      if (!resume) throw new AppError('Currículo não encontrado', 404);

      if (resume.filePath) {
        try { await fs.unlink(resume.filePath); } catch { /* ignore */ }
      }

      await prisma.resume.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Currículo deletado' });
    } catch (err) { next(err); }
  },

  async analyzeMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeContent, jobDescription } = req.body;
      const result = await aiService.analyzeJobMatch(resumeContent, jobDescription);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  async interviewPrep(req: Request, res: Response, next: NextFunction) {
    try {
      const { jobDescription } = req.body;
      const result = await aiService.generateInterviewPrep(jobDescription, req.body.resumeContent || '');
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};
