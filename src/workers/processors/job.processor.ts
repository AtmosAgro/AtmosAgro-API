import { Job } from 'bullmq';
import { JobStatus } from '@prisma/client';

import { logger } from '@config/logger';
import { JobsRepository } from '@repositories/jobs/jobs.repository';
import { JobsService } from '@services/jobs/jobs.service';
import { CoreClient, CoreProcessPayload } from '@integrations/core/workflow.client';
import { JobPayload } from '@workers/queues/job.queue';

const jobsRepository = new JobsRepository();
const jobsService = new JobsService();
const coreClient = new CoreClient();

export async function processSatelliteJob(job: Job): Promise<void> {
  if (job.name === 'expire-stale') {
    const count = await jobsService.expireStaleJobs();
    logger.info({ count }, 'Stale jobs expired');
    return;
  }

  const { jobId, propriedadeId, clienteId, geometry, indices, dateRange, cloudCoverMax } =
    job.data as JobPayload;

  logger.info({ jobId, attempt: job.attemptsMade + 1 }, 'Processing satellite job');

  await jobsRepository.updateStatus(jobId, JobStatus.running, { iniciadoEm: new Date() });

  const payload: CoreProcessPayload = {
    job_id: jobId,
    propriedade_id: propriedadeId,
    cliente_id: clienteId,
    geometry,
    date_range: dateRange,
    cloud_cover_max: cloudCoverMax,
    indices: indices.length > 0 ? indices : null,
  };

  await coreClient.triggerProcessing(payload);

  logger.info({ jobId }, 'Dispatched to Core — awaiting callback');
}
