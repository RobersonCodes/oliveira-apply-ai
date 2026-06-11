import { Worker, Job } from 'bullmq';
import { redisConnection, QUEUE_NAMES } from '../config/queue';
import { automationService } from '../services/automation.service';
import { prisma } from '../config/database';
import logger from '../utils/logger';

interface AutomationJobData {
  automationId: string;
  userId: string;
}

const automationWorker = new Worker<AutomationJobData>(
  QUEUE_NAMES.AUTOMATION,
  async (job: Job<AutomationJobData>) => {
    const { automationId, userId } = job.data;

    logger.info('Starting automation job', { automationId, jobId: job.id });

    await prisma.automationLog.create({
      data: {
        automationId,
        level: 'INFO',
        message: `Job iniciado: ${job.id}`,
      },
    });

    try {
      await automationService.runAutomation(automationId, async (msg) => {
        await job.updateProgress({ message: msg, timestamp: new Date().toISOString() });
      });
    } catch (error: any) {
      await prisma.automation.update({
        where: { id: automationId },
        data: { status: 'FAILED', completedAt: new Date() },
      });

      await prisma.automationLog.create({
        data: {
          automationId,
          level: 'ERROR',
          message: `Falha na automação: ${error.message}`,
        },
      });

      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: parseInt(process.env.AUTOMATION_CONCURRENCY || '3', 10),
    limiter: { max: 5, duration: 60000 }, // max 5 jobs/min
  },
);

automationWorker.on('completed', async (job) => {
  logger.info('Automation job completed', { jobId: job.id });
});

automationWorker.on('failed', async (job, err) => {
  logger.error('Automation job failed', { jobId: job?.id, err: err.message });
});

automationWorker.on('progress', (job, progress) => {
  logger.debug('Automation progress', { jobId: job.id, progress });
});

export default automationWorker;
