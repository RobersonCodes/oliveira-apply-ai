import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/AppError';
import logger from '../utils/logger';

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    if (err.statusCode >= 500) logger.error('AppError 5xx', { err, path: req.path });
    return res.status(err.statusCode).json({ success: false, message: err.message, code: err.code });
  }

  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
    return res.status(400).json({ success: false, message: messages, code: 'VALIDATION_ERROR' });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') return res.status(409).json({ success: false, message: 'Registro duplicado.', code: 'DUPLICATE_ENTRY' });
    if (err.code === 'P2025') return res.status(404).json({ success: false, message: 'Registro não encontrado.', code: 'NOT_FOUND' });
  }

  logger.error('Unhandled error', { 
  message: err instanceof Error ? err.message : String(err),
  stack: err instanceof Error ? err.stack : undefined,
  name: err instanceof Error ? err.name : typeof err,
  path: req.path, 
  method: req.method 
})};
