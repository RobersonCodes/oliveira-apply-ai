import { Queue, Worker, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';
import logger from '../utils/logger';

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redisConnection.on('connect', () => logger.info('✅ Redis connected'));
redisConnection.on('error', (err) => logger.error('Redis error', { err }));

export const QUEUE_NAMES = {
  AUTOMATION: 'automation',
  EMAIL: 'email',
  PDF: 'pdf',
  NOTIFICATION: 'notification',
} as const;

export const automationQueue = new Queue(QUEUE_NAMES.AUTOMATION, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 50 },
  },
});

export const emailQueue = new Queue(QUEUE_NAMES.EMAIL, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: { type: 'fixed', delay: 2000 },
  },
});

export const notificationQueue = new Queue(QUEUE_NAMES.NOTIFICATION, {
  connection: redisConnection,
});

export const automationQueueEvents = new QueueEvents(QUEUE_NAMES.AUTOMATION, {
  connection: new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
  }),
});

export async function connectRedis(): Promise<void> {
  await redisConnection.connect();
}
