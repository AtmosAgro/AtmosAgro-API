import { logger } from '@config/logger';
import { CoreClient } from '@integrations/core/workflow.client';
import { NotFoundError } from '@common/errors/application-error';
import { PropriedadeRepository } from '@repositories/propriedades/propriedades.repository';
import { ScenesRepository, SceneCatalogUpsert } from '@repositories/scenes/scenes.repository';
import { SceneSummary } from '@dtos/scenes/scenes.dto';

const CACHE_TTL_HOURS = 24;
const CLOUD_COVER_MAX = 100;

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

function endOfMonthUTC(month: Date): Date {
  return new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0));
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export class ScenesService {
  constructor(
    private readonly scenesRepository: ScenesRepository = new ScenesRepository(),
    private readonly propriedadeRepository: PropriedadeRepository = new PropriedadeRepository(),
    private readonly coreClient: CoreClient = new CoreClient(),
  ) {}

  async listAvailable(
    clienteId: string,
    propriedadeId: string,
    from: Date,
    to: Date,
  ): Promise<SceneSummary[]> {
    const propriedade = await this.propriedadeRepository.findById(propriedadeId);
    if (!propriedade || propriedade.clienteId !== clienteId) {
      throw new NotFoundError('Propriedade não encontrada');
    }

    const months = monthsBetween(from, to);
    const freshMonthsIso = await this.scenesRepository.findFreshMonths(
      propriedadeId,
      months,
      CACHE_TTL_HOURS,
    );
    const staleMonths = months.filter((m) => !freshMonthsIso.has(toIsoDate(m)));

    if (staleMonths.length > 0) {
      const geometry = propriedade.geojson as Record<string, unknown> | null;
      if (!geometry) {
        logger.warn(
          { propriedadeId },
          'Propriedade sem geojson — não é possível consultar Copernicus',
        );
      } else {
        for (const month of staleMonths) {
          await this.refreshMonth(propriedadeId, geometry, month);
        }
      }
    }

    const scenes = await this.scenesRepository.findByPropriedadeAndRange(
      propriedadeId,
      from,
      to,
    );

    return scenes.map((s) => ({
      date: toIsoDate(s.dataCena),
      cloudCover: s.cloudCover !== null ? Number(s.cloudCover) : null,
      productId: s.productId,
    }));
  }

  private async refreshMonth(
    propriedadeId: string,
    geometry: Record<string, unknown>,
    month: Date,
  ): Promise<void> {
    const start = toIsoDate(month);
    const end = toIsoDate(endOfMonthUTC(month));
    try {
      const scenes = await this.coreClient.listAvailableScenes({
        geometry,
        date_range: { start, end },
        cloud_cover_max: CLOUD_COVER_MAX,
      });

      const upserts: SceneCatalogUpsert[] = scenes.map((s) => ({
        propriedadeId,
        dataCena: new Date(`${s.date}T00:00:00Z`),
        cloudCover: s.cloud_cover,
        productId: s.product_id || null,
      }));

      await this.scenesRepository.upsertMany(upserts);
      await this.scenesRepository.markMonthsFetched(propriedadeId, [month]);
      logger.debug(
        { propriedadeId, month: start, scenes: scenes.length },
        'Scene catalog refreshed',
      );
    } catch (err) {
      logger.error(
        { err, propriedadeId, month: start },
        'Failed to refresh scene catalog from Core',
      );
    }
  }
}
