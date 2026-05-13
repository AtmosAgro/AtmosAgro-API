import { Job, JobStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class JobsRepository {
  async create(data: Prisma.JobCreateInput): Promise<Job> {
    return prisma.job.create({ data });
  }

  async findById(id: string): Promise<Job | null> {
    return prisma.job.findUnique({
      where: { id },
      include: {
        cliente: true,
        propriedade: true,
        talhao: true,
      },
    });
  }

  async findByIdScoped(id: string, clienteId: string): Promise<Job | null> {
    return prisma.job.findFirst({
      where: { id, clienteId },
      include: {
        propriedade: { select: { nome: true } },
        talhao: { select: { nome: true, geojson: true } },
      },
    });
  }

  async findNextJob(): Promise<Job | null> {
    return prisma.job.findFirst({
      where: { status: JobStatus.pending },
      orderBy: { createdAt: 'asc' },
    });
  }

  async listByCliente(clienteId: string): Promise<Job[]> {
    return prisma.job.findMany({
      where: { clienteId },
      orderBy: { createdAt: 'desc' },
      include: {
        propriedade: { select: { nome: true } },
        talhao: { select: { nome: true } },
      },
    });
  }

  async updateStatus(
    id: string,
    status: JobStatus,
    extraData: Partial<Pick<Job, 'iniciadoEm' | 'finalizadoEm' | 'resultadoDir' | 'erroMensagem'>> = {}
  ): Promise<Job> {
    return prisma.job.update({
      where: { id },
      data: { status, ...extraData },
    });
  }

  async expireStale(olderThan: Date): Promise<number> {
    const result = await prisma.job.updateMany({
      where: {
        status: JobStatus.running,
        iniciadoEm: { lt: olderThan },
      },
      data: {
        status: JobStatus.failed,
        finalizadoEm: new Date(),
        erroMensagem: 'Job expirado por inatividade.',
      },
    });
    return result.count;
  }
}
