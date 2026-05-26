import { Prisma, SceneCatalog } from '@prisma/client';
import { prisma } from '../../config/prisma';

export type SceneCatalogUpsert = {
  propriedadeId: string;
  dataCena: Date;
  cloudCover: number | null;
  productId: string | null;
};

export class ScenesRepository {
  async findByPropriedadeAndRange(
    propriedadeId: string,
    from: Date,
    to: Date,
  ): Promise<SceneCatalog[]> {
    return prisma.sceneCatalog.findMany({
      where: {
        propriedadeId,
        dataCena: { gte: from, lte: to },
      },
      orderBy: { dataCena: 'asc' },
    });
  }

  async upsertMany(scenes: SceneCatalogUpsert[]): Promise<void> {
    if (scenes.length === 0) return;
    await prisma.$transaction(
      scenes.map((s) =>
        prisma.sceneCatalog.upsert({
          where: {
            propriedadeId_dataCena: {
              propriedadeId: s.propriedadeId,
              dataCena: s.dataCena,
            },
          },
          create: {
            propriedadeId: s.propriedadeId,
            dataCena: s.dataCena,
            cloudCover: s.cloudCover !== null ? new Prisma.Decimal(s.cloudCover) : null,
            productId: s.productId,
          },
          update: {
            cloudCover: s.cloudCover !== null ? new Prisma.Decimal(s.cloudCover) : null,
            productId: s.productId,
            fetchedAt: new Date(),
          },
        }),
      ),
    );
  }

  async findFreshMonths(
    propriedadeId: string,
    months: Date[],
    ttlHours: number,
  ): Promise<Set<string>> {
    if (months.length === 0) return new Set();
    const cutoff = new Date(Date.now() - ttlHours * 60 * 60 * 1000);
    const fresh = await prisma.sceneCatalogFetch.findMany({
      where: {
        propriedadeId,
        mes: { in: months },
        fetchedAt: { gte: cutoff },
      },
      select: { mes: true },
    });
    return new Set(fresh.map((f) => f.mes.toISOString().slice(0, 10)));
  }

  async markMonthsFetched(propriedadeId: string, months: Date[]): Promise<void> {
    if (months.length === 0) return;
    await prisma.$transaction(
      months.map((mes) =>
        prisma.sceneCatalogFetch.upsert({
          where: { propriedadeId_mes: { propriedadeId, mes } },
          create: { propriedadeId, mes },
          update: { fetchedAt: new Date() },
        }),
      ),
    );
  }
}
