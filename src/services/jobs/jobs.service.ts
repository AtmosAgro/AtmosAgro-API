import { Job, JobStatus } from '@prisma/client';
import { JobsRepository } from '../../repositories/jobs/jobs.repository';
import { PropriedadeRepository } from '../../repositories/propriedades/propriedades.repository';
import { ArtefatosRepository } from '../../repositories/artefatos/artefatos.repository';
import { jobQueue } from '../../workers/queues/job.queue';
import { CreateJobDto, JobResponseDto } from '../../dtos/jobs/jobs.dto';
import { CompleteJobDto, FailJobDto } from '../../dtos/jobs/jobs-callback.dto';
import { ApplicationError } from '../../common/errors/application-error';

const STALE_JOB_MINUTES = 60;

export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository = new JobsRepository(),
    private readonly propriedadeRepository: PropriedadeRepository = new PropriedadeRepository(),
    private readonly artefatosRepository: ArtefatosRepository = new ArtefatosRepository()
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
            metadata: {
              dataReferencia: artefato.dataReferencia,
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
