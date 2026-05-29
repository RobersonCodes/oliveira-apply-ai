import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { connectDatabase } from './config/database';
import logger from './utils/logger';
import { errorHandler } from './middlewares/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import applicationRoutes from './routes/application.routes';
import automationRoutes from './routes/automation.routes';
import resumeRoutes from './routes/resume.routes';
import analyticsRoutes from './routes/analytics.routes';
import adminRoutes from './routes/admin.routes';
import billingRoutes from './routes/billing.routes';
import notificationRoutes from './routes/notification.routes';
import neuralRoutes from './routes/neural.routes';
import recruiterVisionRoutes from './routes/recruiterVision.routes';
import shadowApplyRoutes from './routes/shadowApply.routes';
import vagaRadarRoutes from './routes/vagaRadar.routes';
import conexaoCirurgicaRoutes from './routes/conexaoCirurgica.routes';
import indeedRoutes from './routes/indeed.routes';
import geekHunterRoutes from './routes/geekHunter.routes';

const app = express();
const PORT = process.env.PORT || 3001;

// Ensure dirs exist
['uploads', 'logs'].forEach((dir) => {
  const p = path.join(process.cwd(), dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

// ─── Security ───────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      scriptSrc: ["'self'"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Auth rate limiter (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

// ─── Body Parsing ───────────────────────────────────────────────────────────
// Stripe webhooks need raw body — handled inside billing routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(compression() as any);

// ─── Logging ────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
    skip: (req) => req.path === '/health',
  }));
}

// ─── Static files ───────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ─── Health ─────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────────
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/automations', automationRoutes);
app.use('/api/resumes', resumeRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/neural', neuralRoutes);
app.use('/api/recruiter-vision', recruiterVisionRoutes);
app.use('/api/shadow-apply', shadowApplyRoutes);
app.use('/api/vaga-radar', vagaRadarRoutes);
app.use('/api/conexao-cirurgica', conexaoCirurgicaRoutes);
app.use('/api/indeed', indeedRoutes);
app.use('/api/geekhunter', geekHunterRoutes);

// ─── 404 ────────────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

// ─── Error Handler ──────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────────────────
async function bootstrap() {
  await connectDatabase();
  app.listen(PORT, () => {
    logger.info(`🚀 Server running on http://localhost:${PORT}`);
    logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`   Health: http://localhost:${PORT}/health`);
  });
}

bootstrap().catch((err) => {
  logger.error('Failed to start server', { err });
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

export default app;
