import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { aiService } from '../services/ai.service';
import { AppError } from '../utils/AppError';
import { paginate, buildPaginationMeta } from '../utils/helpers';
import path from 'path';

export const resumeController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { page, limit, skip } = paginate(req.query as any);
      const [resumes, total] = await Promise.all([
        prisma.resume.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, skip, take: limit }),
        prisma.resume.count({ where: { userId } }),
      ]);
      res.json({ success: true, data: resumes, meta: buildPaginationMeta(total, page, limit) });
    } catch (err) { next(err); }
  },

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      if (!req.file) throw new AppError('Nenhum arquivo enviado', 400);

      let rawText = '';
      try {
        // Prioriza rawText extraído pelo frontend (pdfjs-dist no browser)
        if (req.body.rawText && typeof req.body.rawText === 'string') {
          rawText = req.body.rawText.trim();
        } else if (req.file.mimetype === 'application/pdf') {
          // Fallback: tenta extrair no backend com pdf-parse
          const pdfParse = require('pdf-parse');
          const pdfOptions = { max: 0 };
          const parsed = await pdfParse(req.file.buffer, pdfOptions);
          rawText = (parsed.text || '').trim();
          if (!rawText) {
            rawText = '[PDF enviado — cole o texto manualmente para usar a adaptação por IA]';
          }
        } else if (req.file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          const rawBuf = req.file.buffer?.toString('utf-8') || '';
          const matches = rawBuf.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
          rawText = matches ? matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ').trim() : rawBuf.slice(0, 5000);
        } else {
          rawText = req.file.buffer?.toString('utf-8') || '';
        }
      } catch (parseErr) {
        console.error('[Resume Upload] Parse error:', parseErr instanceof Error ? parseErr.message : parseErr);
        rawText = '';
      }

      await prisma.resume.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });

      const resume = await prisma.resume.create({
        data: {
          userId,
          name: req.body.name || path.parse(req.file.originalname).name,
          fileUrl: null,
          fileKey: req.file.originalname,
          rawText: rawText || null,
          content: null,
          isDefault: true,
        },
      });

      res.status(201).json({ success: true, data: resume });
    } catch (err) { next(err); }
  },

  async adapt(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { resumeId, jobDescription, jobTitle, company, resumeContent: bodyContent } = req.body;

      if (!jobDescription) throw new AppError('jobDescription é obrigatório', 400);

      let resumeContent = bodyContent;

      if (!resumeContent && resumeId) {
        const resume = await prisma.resume.findFirst({ where: { id: resumeId, userId } });
        if (!resume) throw new AppError('Currículo não encontrado', 404);
        resumeContent = resume.rawText || (resume.content ? JSON.stringify(resume.content) : null);
      }

      if (!resumeContent) {
        const defaultResume = await prisma.resume.findFirst({
          where: { userId, isDefault: true },
          orderBy: { createdAt: 'desc' },
        });
        if (defaultResume) {
          resumeContent = defaultResume.rawText || (defaultResume.content ? JSON.stringify(defaultResume.content) : null);
        }
      }

      if (!resumeContent) throw new AppError('Conteúdo do currículo não disponível. Cole o texto do currículo no campo indicado.', 400);

      const [adapted, skills] = await Promise.all([
        aiService.adaptResume({ resumeContent, jobDescription, targetRole: jobTitle || '' }),
        aiService.extractSkillsFromJD(jobDescription),
      ]);

      const adaptedResume = await prisma.resume.create({
        data: {
          userId,
          name: `Adaptado — ${company || jobTitle || 'vaga'} (${new Date().toLocaleDateString('pt-BR')})`,
          fileKey: null,
          fileUrl: null,
          rawText: typeof adapted.adaptedContent === 'string' ? adapted.adaptedContent : null,
          content: { adaptedContent: adapted.adaptedContent, jobTitle, company, skills, atsScore: adapted.atsScore, improvements: adapted.improvements } as any,
          isDefault: false,
        },
      });

      res.json({
        success: true,
        data: adaptedResume,
        adapted: {
          adaptedContent: adapted.adaptedContent,
          addedKeywords: adapted.addedKeywords,
          improvements: adapted.improvements,
          atsScore: adapted.atsScore,
        },
        skills,
      });
    } catch (err) { next(err); }
  },

  async generateCoverLetter(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const { jobDescription, jobTitle, company, resumeContent } = req.body;
      if (!jobDescription) throw new AppError('jobDescription é obrigatório', 400);

      // Fetch user name for the cover letter
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { name: true } });

      const coverLetter = await aiService.generateCoverLetter({
        userName: user?.name || 'Candidato',
        jobTitle: jobTitle || '',
        company: company || '',
        jobDescription,
        resumeContent: resumeContent || '',
      });
      res.json({ success: true, data: { coverLetter } });
    } catch (err) { next(err); }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = (req as any).userId;
      const resume = await prisma.resume.findFirst({ where: { id: req.params.id, userId } });
      if (!resume) throw new AppError('Currículo não encontrado', 404);
      await prisma.resume.delete({ where: { id: req.params.id } });
      res.json({ success: true, message: 'Currículo deletado' });
    } catch (err) { next(err); }
  },

  async analyzeMatch(req: Request, res: Response, next: NextFunction) {
    try {
      const { resumeContent, jobDescription, jobTitle } = req.body;
      const result = await aiService.analyzeJobMatch({
        jobTitle: jobTitle || '',
        jobDescription: jobDescription || '',
        resumeContent: resumeContent || '',
      });
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },
};