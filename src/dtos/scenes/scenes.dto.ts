import { z } from 'zod';

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve ser YYYY-MM-DD');

export const scenesAvailableQuerySchema = z
  .object({
    from: isoDate,
    to: isoDate,
  })
  .refine((v) => v.from <= v.to, {
    message: '`from` deve ser <= `to`',
    path: ['from'],
  })
  .refine(
    (v) => {
      const fromMs = Date.parse(v.from);
      const toMs = Date.parse(v.to);
      return (toMs - fromMs) / (1000 * 60 * 60 * 24) <= 730;
    },
    { message: 'Intervalo máximo é 730 dias (2 anos)', path: ['to'] },
  );

export type ScenesAvailableQueryDto = z.infer<typeof scenesAvailableQuerySchema>;

export type SceneSummary = {
  date: string;
  cloudCover: number | null;
  productId: string | null;
};
