import { z } from 'zod';
import { JobStatus } from '@prisma/client';

export const createJobSchema = z.object({
  propriedadeId: z.string().uuid('ID de propriedade inválido.'),
  dateRange: z.object({
    start: z.string().date('Data de início inválida (esperado YYYY-MM-DD).'),
    end: z.string().date('Data de fim inválida (esperado YYYY-MM-DD).'),
  }),
  indices: z.array(z.string().min(1)).optional(),
  cloudCoverMax: z.number().int().min(0).max(100).default(30),
});

export type CreateJobDto = z.infer<typeof createJobSchema>;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD');
const jobStatusValues = ['pending', 'running', 'succeeded', 'failed'] as const;

export const listJobsQuerySchema = z.object({
  status: z
    .string()
    .optional()
    .transform((v) => {
      if (!v) return undefined;
      return v
        .split(',')
        .map((s) => s.trim())
        .filter((s): s is (typeof jobStatusValues)[number] =>
          (jobStatusValues as readonly string[]).includes(s),
        );
    }),
  propriedadeId: z.string().uuid('ID de propriedade inválido.').optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
});

export type ListJobsQueryDto = z.infer<typeof listJobsQuerySchema>;

const MAX_BATCH_RANGE_DAYS = 730;

export const cloudBucketSchema = z.enum(['low', 'partial', 'cloudy']);
export type CloudBucket = z.infer<typeof cloudBucketSchema>;

export const createBatchJobSchema = z
  .object({
    from: z.string().date('Data inicial inválida (esperado YYYY-MM-DD).'),
    to: z.string().date('Data final inválida (esperado YYYY-MM-DD).'),
    cloudBuckets: z
      .array(cloudBucketSchema)
      .min(1, 'Selecione pelo menos um bucket de nuvem.'),
    indices: z.array(z.string().min(1)).optional(),
  })
  .refine((v) => v.from <= v.to, {
    message: '`from` deve ser <= `to`.',
    path: ['from'],
  })
  .refine(
    (v) => {
      const fromMs = Date.parse(v.from);
      const toMs = Date.parse(v.to);
      return (toMs - fromMs) / (1000 * 60 * 60 * 24) <= MAX_BATCH_RANGE_DAYS;
    },
    { message: `Intervalo máximo é ${MAX_BATCH_RANGE_DAYS} dias.`, path: ['to'] },
  );

export type CreateBatchJobDto = z.infer<typeof createBatchJobSchema>;

export interface CreateBatchJobResponseDto {
  created: number;
  skippedExisting: number;
  skippedRunning: number;
  skippedMonthsNotFetched: string[];
  jobIds: string[];
}

export interface JobResponseDto {
  id: string;
  clienteId: string | null;
  propriedadeId: string | null;
  propriedadeNome: string | null;
  talhaoId: string | null;
  pipeline: string;
  status: JobStatus;
  parametros: unknown;
  erroMensagem: string | null;
  createdAt: Date | null;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
}
