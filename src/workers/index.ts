import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { JobStatus } from '@prisma/client';

import { logger } from '@config/logger';
import { env } from '@config/env';
import { JobPayload, jobQueue } from '@workers/queues/job.queue';
import { processSatelliteJob } from '@workers/processors/job.processor';
import { JobsRepository } from '@repositories/jobs/jobs.repository';

const connection = new Redis(env.REDIS_URL, { maxRetriesPerRequest: null });
const jobsRepository = new JobsRepository();

const worker = new Worker<JobPayload>('satellite-jobs', processSatelliteJob, {
  connection,
  concurrency: 2,
});

worker.on('failed', async (job, err) => {
  logger.error({ jobId: job?.data.jobId, err: err.message, attempts: job?.attemptsMade }, 'Job failed');

  const isExhausted = job && job.attemptsMade >= (job.opts.attempts ?? 1);
  if (isExhausted && job.data.jobId) {
    await jobsRepository
      .updateStatus(job.data.jobId, JobStatus.failed, {
        finalizadoEm: new Date(),
        erroMensagem: err.message,
      })
      .catch((dbErr: unknown) => logger.error({ dbErr }, 'Failed to update job status after exhaustion'));
  }
});

worker.on('error', (err) => {
  logger.error({ err }, 'Worker connection error');
});

jobQueue
  .add('expire-stale', {} as JobPayload, { repeat: { every: 600_000 } })
  .catch((err: unknown) => logger.error({ err }, 'Failed to register expire-stale job'));

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received — closing worker');
  await worker.close();
  await jobQueue.close();
  process.exit(0);
});

export { worker };
