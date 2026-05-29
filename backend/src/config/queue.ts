import IORedis from 'ioredis';
import logger from '../utils/logger';

export const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});

redisConnection.on('connect', () => logger.info('✅ Redis connected'));
redisConnection.on('error', (err) => logger.warn('Redis error (non-fatal)', { code: err.message }));

export const QUEUE_NAMES = {
  AUTOMATION: 'automation',
  EMAIL: 'email',
  NOTIFICATION: 'notification',
} as const;

// Stub queues que não crasham se Redis estiver indisponível
const noop = () => Promise.resolve(null);

export const automationQueue = {
  add: noop,
  remove: noop,
  getJob: noop,
} as any;

export const emailQueue = { add: noop } as any;
export const notificationQueue = { add: noop } as any;
export const automationQueueEvents = { on: () => {} } as any;

export async function connectRedis(): Promise<void> {
  try {
    await redisConnection.connect();
  } catch (err) {
    logger.warn('Redis connection failed — queues disabled', { err });
  }
}