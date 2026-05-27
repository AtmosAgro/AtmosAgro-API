import { Job, JobStatus, Prisma } from '@prisma/client';
import { JobsRepository } from '../../repositories/jobs/jobs.repository';
import { PropriedadeRepository } from '../../repositories/propriedades/propriedades.repository';
import { ArtefatosRepository } from '../../repositories/artefatos/artefatos.repository';
import { ScenesRepository } from '../../repositories/scenes/scenes.repository';
import { jobQueue, JobPayload } from '../../workers/queues/job.queue';
import {
  CloudBucket,
  CreateBatchJobDto,
  CreateBatchJobResponseDto,
  CreateJobDto,
  JobResponseDto,
} from '../../dtos/jobs/jobs.dto';
import { CompleteJobDto, FailJobDto } from '../../dtos/jobs/jobs-callback.dto';
import { ApplicationError } from '../../common/errors/application-error';

const STALE_JOB_MINUTES = 60;

const CLOUD_BUCKET_RANGES: Record<CloudBucket, { min: number; max: number }> = {
  low: { min: 0, max: 30 },
  partial: { min: 30, max: 70 },
  cloudy: { min: 70, max: 100 },
};

const DEFAULT_BATCH_INDICES = ['ndvi', 'ndwi', 'evi', 'ndre', 'ndmi', 'gndvi'];

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function monthsBetween(from: Date, to: Date): Date[] {
  const months: Date[] = [];
  const cursor = startOfMonthUTC(from);
  const end = startOfMonthUTC(to);
  while (cursor <= end) {
    months.push(new Date(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

function sceneMatchesBuckets(cloudCover: number | null, buckets: CloudBucket[]): boolean {
  if (cloudCover === null || cloudCover === undefined) {
    // cloud_cover desconhecido só conta se "cloudy" estiver selecionado (conservador).
    return buckets.includes('cloudy');
  }
  return buckets.some((b) => {
    const range = CLOUD_BUCKET_RANGES[b];
    if (b === 'low') return cloudCover <= range.max;
    if (b === 'cloudy') return cloudCover > range.min;
    return cloudCover > range.min && cloudCover <= range.max;
  });
}

export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository = new JobsRepository(),
    private readonly propriedadeRepository: PropriedadeRepository = new PropriedadeRepository(),
    private readonly artefatosRepository: ArtefatosRepository = new ArtefatosRepository(),
    private readonly scenesRepository: ScenesRepository = new ScenesRepository(),
  ) {}

  async create(clienteId: string, dto: CreateJobDto): Promise<JobResponseDto> {
    const propriedade = await this.propriedadeRepository.findById(dto.propriedadeId);

    if (!propriedade) {
      throw new ApplicationError('Propriedade não encontrada.', 404);
    }

    if (propriedade.clienteId !== clienteId) {
      throw new ApplicationError('Acesso negado a esta propriedade.', 403);
    }

    const job = await this.jobsRepository.create({
      pipeline: 'sentinel2_indices',
      status: JobStatus.pending,
      parametros: {
        dateRange: dto.dateRange,
        indices: dto.indices ?? [],
        cloudCoverMax: dto.cloudCoverMax,
        propriedadeId: dto.propriedadeId,
      },
      cliente: { connect: { id: clienteId } },
      propriedade: { connect: { id: dto.propriedadeId } },
    });

    await jobQueue.add('process', {
      jobId: job.id,
      propriedadeId: dto.propriedadeId,
      clienteId,
      geometry: propriedade.geojson as Record<string, unknown>,
      indices: dto.indices ?? [],
      dateRange: dto.dateRange,
      cloudCoverMax: dto.cloudCoverMax,
    });

    return this._toDto(job);
  }

  async createBatch(
    clienteId: string,
    propriedadeId: string,
    dto: CreateBatchJobDto,
  ): Promise<CreateBatchJobResponseDto> {
    const propriedade = await this.propriedadeRepository.findById(propriedadeId);
    if (!propriedade || propriedade.clienteId !== clienteId) {
      throw new ApplicationError('Propriedade não encontrada.', 404);
    }

    const from = new Date(`${dto.from}T00:00:00Z`);
    const to = new Date(`${dto.to}T00:00:00Z`);

    // 1. Cenas no catálogo dentro da janela
    const scenes = await this.scenesRepository.findByPropriedadeAndRange(propriedadeId, from, to);
    const matchingScenes = scenes.filter((s) =>
      sceneMatchesBuckets(s.cloudCover !== null ? Number(s.cloudCover) : null, dto.cloudBuckets),
    );

    // 2. Avisar meses não consultados ainda na janela
    const months = monthsBetween(from, to);
    const freshMonths = await this.scenesRepository.findFreshMonths(
      propriedadeId,
      months,
      24 * 365, // qualquer fetch já registrado conta — não queremos forçar refresh aqui
    );
    const skippedMonthsNotFetched = months
      .map((m) => toIsoDate(m))
      .filter((iso) => !freshMonths.has(iso));

    // 3. Dedupe por artefato já existente (cenas já processadas)
    const processedDates = await this.artefatosRepository.findDatesByPropriedadeAndRange(
      propriedadeId,
      from,
      to,
    );

    // 4. Dedupe por job ativo (pending/running) na mesma data
    const activeJobs = await this.jobsRepository.findActiveByPropriedade(propriedadeId);
    const activeDates = new Set<string>();
    for (const job of activeJobs) {
      const params = job.parametros as { dateRange?: { start?: string; end?: string } } | null;
      const start = params?.dateRange?.start;
      const end = params?.dateRange?.end;
      // Batch sempre cria jobs de 1 dia (start === end), então start === end também aqui.
      if (start && start === end) {
        activeDates.add(start);
      }
    }

    const skippedExisting = matchingScenes.filter((s) => processedDates.has(toIsoDate(s.dataCena)))
      .length;
    const skippedRunning = matchingScenes.filter((s) => activeDates.has(toIsoDate(s.dataCena)))
      .length;

    const toCreate = matchingScenes.filter((s) => {
      const iso = toIsoDate(s.dataCena);
      return !processedDates.has(iso) && !activeDates.has(iso);
    });

    if (toCreate.length === 0) {
      return {
        created: 0,
        skippedExisting,
        skippedRunning,
        skippedMonthsNotFetched,
        jobIds: [],
      };
    }

    const indices = dto.indices && dto.indices.length > 0 ? dto.indices : DEFAULT_BATCH_INDICES;

    // 5. Cria N jobs em transação
    const cloudCoverMax = dto.cloudBuckets.includes('cloudy')
      ? 100
      : dto.cloudBuckets.includes('partial')
        ? 70
        : 30;

    const jobRows: Prisma.JobCreateManyInput[] = toCreate.map((s) => ({
      pipeline: 'sentinel2_indices',
      status: JobStatus.pending,
      parametros: {
        dateRange: { start: toIsoDate(s.dataCena), end: toIsoDate(s.dataCena) },
        indices,
        cloudCoverMax,
        propriedadeId,
        batch: true,
      },
      clienteId,
      propriedadeId,
    }));

    const jobIds = await this.jobsRepository.createMany(jobRows);

    // 6. Enfileira em lote no BullMQ
    const bulk: { name: string; data: JobPayload }[] = jobIds.map((jobId, idx) => ({
      name: 'process',
      data: {
        jobId,
        propriedadeId,
        clienteId,
        geometry: propriedade.geojson as Record<string, unknown>,
        indices,
        dateRange: jobRows[idx].parametros && (jobRows[idx].parametros as { dateRange: { start: string; end: string } }).dateRange,
        cloudCoverMax,
      },
    }));
    await jobQueue.addBulk(bulk);

    return {
      created: jobIds.length,
      skippedExisting,
      skippedRunning,
      skippedMonthsNotFetched,
      jobIds,
    };
  }

  async listByCliente(clienteId: string): Promise<JobResponseDto[]> {
    const jobs = await this.jobsRepository.listByCliente(clienteId);
    return jobs.map(this._toDto);
  }

  async findById(id: string, clienteId: string): Promise<JobResponseDto> {
    const job = await this.jobsRepository.findByIdScoped(id, clienteId);

    if (!job) {
      throw new ApplicationError('Job não encontrado.', 404);
    }

    return this._toDto(job);
  }

  async complete(jobId: string, dto: CompleteJobDto): Promise<JobResponseDto> {
    const job = await this.jobsRepository.findById(jobId);

    if (!job) {
      throw new ApplicationError('Job não encontrado.', 404);
    }

    if (job.status !== JobStatus.running) {
      throw new ApplicationError(
        `Job não pode ser concluído: status atual é '${job.status}'.`,
        409
      );
    }

    await Promise.all(
      dto.artefatos.map((artefato) =>
        this.artefatosRepository.upsertByCaminho(
          { jobId, caminho: artefato.caminho },
          {
            tipo: 'geotiff',
            indice: artefato.indice,
            caminho: artefato.caminho,
            dataReferencia: artefato.dataReferencia
              ? new Date(`${artefato.dataReferencia}T00:00:00Z`)
              : null,
            metadata: {
              tamanhoBytes: artefato.tamanhoBytes ?? null,
            },
            job: { connect: { id: jobId } },
            propriedade: { connect: { id: job.propriedadeId! } },
          }
        )
      )
    );

    const updated = await this.jobsRepository.updateStatus(jobId, JobStatus.succeeded, {
      finalizadoEm: new Date(),
    });

    return this._toDto(updated);
  }

  async fail(jobId: string, dto: FailJobDto): Promise<JobResponseDto> {
    const job = await this.jobsRepository.findById(jobId);

    if (!job) {
      throw new ApplicationError('Job não encontrado.', 404);
    }

    if (job.status !== JobStatus.running) {
      throw new ApplicationError(
        `Job não pode ser marcado como falho: status atual é '${job.status}'.`,
        409
      );
    }

    const updated = await this.jobsRepository.updateStatus(jobId, JobStatus.failed, {
      finalizadoEm: new Date(),
      erroMensagem: dto.erro,
    });

    return this._toDto(updated);
  }

  async expireStaleJobs(): Promise<number> {
    const cutoff = new Date(Date.now() - STALE_JOB_MINUTES * 60 * 1000);
    return this.jobsRepository.expireStale(cutoff);
  }

  private _toDto(job: Job): JobResponseDto {
    return {
      id: job.id,
      clienteId: job.clienteId,
      propriedadeId: job.propriedadeId,
      talhaoId: job.talhaoId,
      pipeline: job.pipeline,
      status: job.status,
      parametros: job.parametros,
      erroMensagem: job.erroMensagem,
      createdAt: job.createdAt,
      iniciadoEm: job.iniciadoEm,
      finalizadoEm: job.finalizadoEm,
    };
  }
}
