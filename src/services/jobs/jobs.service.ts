import { Job, JobStatus } from '@prisma/client';
import { JobsRepository } from '../../repositories/jobs/jobs.repository';
import { TalhaoRepository } from '../../repositories/talhoes/talhoes.repository';
import { jobQueue } from '../../workers/queues/job.queue';
import { CreateJobDto, JobResponseDto } from '../../dtos/jobs/jobs.dto';
import { ApplicationError } from '../../common/errors/application-error';

export class JobsService {
  constructor(
    private readonly jobsRepository: JobsRepository = new JobsRepository(),
    private readonly talhaoRepository: TalhaoRepository = new TalhaoRepository()
  ) {}

  async create(clienteId: string, dto: CreateJobDto): Promise<JobResponseDto> {
    const talhao = await this.talhaoRepository.findByIdWithPropriedade(dto.talhaoId);

    if (!talhao) {
      throw new ApplicationError('Talhão não encontrado.', 404);
    }

    if (talhao.propriedade?.clienteId !== clienteId) {
      throw new ApplicationError('Acesso negado a este talhão.', 403);
    }

    const job = await this.jobsRepository.create({
      pipeline: 'sentinel2_indices',
      status: JobStatus.pending,
      parametros: {
        dateRange: dto.dateRange,
        indices: dto.indices ?? [],
        cloudCoverMax: dto.cloudCoverMax,
        talhaoId: dto.talhaoId,
      },
      cliente: { connect: { id: clienteId } },
      propriedade: { connect: { id: talhao.propriedadeId! } },
      talhao: { connect: { id: dto.talhaoId } },
    });

    await jobQueue.add('process', {
      jobId: job.id,
      talhaoId: dto.talhaoId,
      clienteId,
      propriedadeId: talhao.propriedadeId!,
      geometry: talhao.geojson as Record<string, unknown>,
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
