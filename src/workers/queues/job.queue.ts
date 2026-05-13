import { Queue } from 'bullmq';
import Redis from 'ioredis';
import { env } from '@config/env';

export interface JobPayload {
  jobId: string;
  propriedadeId: string;
  clienteId: string;
  geometry: Record<string, unknown>;
  indices: string[];
  dateRange: { start: string; end: string };
  cloudCoverMax: number;
}

const redisConnection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });

export const jobQueue = new Queue<JobPayload>('satellite-jobs', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 100 },
    removeOnFail: { count: 500 },
  },
});
