import { env } from '@config/env';
import { logger } from '@config/logger';

export interface CoreProcessPayload {
  job_id: string;
  talhao_id: string;
  cliente_id: string;
  geometry: Record<string, unknown>;
  date_range: { start: string; end: string };
  cloud_cover_max: number;
  indices: string[] | null;
}

export class CoreClient {
  constructor(
    private readonly baseUrl: string = env.CORE_BASE_URL,
    private readonly token: string = env.CORE_SERVICE_TOKEN,
  ) {}

  async triggerProcessing(payload: CoreProcessPayload): Promise<void> {
    const response = await fetch(`${this.baseUrl}/jobs/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.token}`,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Core responded ${response.status}: ${body}`);
    }

    logger.debug({ jobId: payload.job_id }, 'Job dispatched to Core');
  }
}
