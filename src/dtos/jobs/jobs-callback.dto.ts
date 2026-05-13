import { z } from 'zod';

export const completeJobSchema = z.object({
  artefatos: z
    .array(
      z.object({
        indice: z.string().min(1),
        caminho: z.string().min(1),
        dataReferencia: z.string().date('dataReferencia deve ser YYYY-MM-DD.'),
        tamanhoBytes: z.number().int().positive().optional(),
      })
    )
    .min(1, 'Ao menos um artefato é obrigatório.'),
});

export const failJobSchema = z.object({
  erro: z.string().min(1, 'Mensagem de erro é obrigatória.'),
});

export type CompleteJobDto = z.infer<typeof completeJobSchema>;
export type FailJobDto = z.infer<typeof failJobSchema>;
