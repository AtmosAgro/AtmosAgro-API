import { Artefato, ArtefatoTipo, Prisma } from '@prisma/client';
import { prisma } from '../../config/prisma';

export class ArtefatosRepository {
  async findByTalhaoId(talhaoId: string): Promise<Artefato[]> {
    return prisma.artefato.findMany({
      where: { talhaoId },
      include: {
        talhao: {
          select: { nome: true, codigo: true }
        }
      },
      orderBy: { geradoEm: 'desc' },
    });
  }

  async findByPropriedadeId(propriedadeId: string): Promise<Artefato[]> {
    return prisma.artefato.findMany({
      where: {
        OR: [
          { propriedadeId },
          { talhao: { propriedadeId } }
        ]
      },
      include: {
        talhao: {
          select: { nome: true, codigo: true }
        },
        propriedade: {
          select: { nome: true }
        }
      },
      orderBy: { geradoEm: 'desc' },
    });
  }

  async findByClienteId(clienteId: string): Promise<Artefato[]> {
    return prisma.artefato.findMany({
      where: {
        OR: [
          { propriedade: { clienteId } },
          { talhao: { propriedade: { clienteId } } }
        ]
      },
      include: {
        talhao: {
          select: {
            nome: true,
            codigo: true,
            propriedade: { select: { nome: true } }
          }
        },
        propriedade: {
          select: { nome: true }
        }
      },
      orderBy: { geradoEm: 'desc' },
    });
  }

  async findById(idOrIdentificador: string) {
    const isUuid = idOrIdentificador.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);

    return prisma.artefato.findFirst({
      where: isUuid 
        ? { id: idOrIdentificador } 
        : { identificador: idOrIdentificador },
      include: {
        talhao: {
          select: {
            codigo: true,
            propriedadeId: true,
            propriedade: { select: { clienteId: true } }
          }
        },
        propriedade: {
          select: { clienteId: true }
        }
      },
    });
  }

  async create(data: any): Promise<Artefato> {
    return prisma.artefato.create({
      data,
    });
  }

  async upsertByCaminho(
    where: { jobId: string; caminho: string },
    data: Prisma.ArtefatoCreateInput,
  ): Promise<Artefato> {
    return prisma.artefato.upsert({
      where: { jobId_caminho: where },
      create: data,
      update: { metadata: data.metadata, geradoEm: new Date() },
    });
  }
}
