import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { getClientIp } from '../utils/helpers';
import logger from '../utils/logger';

export function auditLog(action: string, resource: string) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (userId) {
        await prisma.auditLog.create({
          data: {
            userId,
            action,
            resource,
            resourceId: req.params.id || null,
            ipAddress: getClientIp(req),
            userAgent: req.headers['user-agent'] || null,
            metadata: {
              method: req.method,
              path: req.path,
              query: req.query,
            },
          },
        });
      }
    } catch (err) {
      logger.warn('Audit log failed', { err });
    }
    next();
  };
}
