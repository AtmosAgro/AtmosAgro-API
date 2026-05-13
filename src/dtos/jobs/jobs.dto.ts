import { z } from 'zod';
import { JobStatus } from '@prisma/client';

export const createJobSchema = z.object({
  talhaoId: z.string().uuid('ID de talhão inválido.'),
  dateRange: z.object({
    start: z.string().date('Data de início inválida (esperado YYYY-MM-DD).'),
    end: z.string().date('Data de fim inválida (esperado YYYY-MM-DD).'),
  }),
  indices: z.array(z.string().min(1)).optional(),
  cloudCoverMax: z.number().int().min(0).max(100).default(30),
});

export type CreateJobDto = z.infer<typeof createJobSchema>;

export interface JobResponseDto {
  id: string;
  clienteId: string | null;
  propriedadeId: string | null;
  talhaoId: string | null;
  pipeline: string;
  status: JobStatus;
  parametros: unknown;
  erroMensagem: string | null;
  createdAt: Date | null;
  iniciadoEm: Date | null;
  finalizadoEm: Date | null;
}
