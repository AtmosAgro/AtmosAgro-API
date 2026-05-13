import { config } from 'dotenv-flow';
import { z } from 'zod';

config({ silent: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8080),
  LOG_LEVEL: z.string().default('info'),
  DEBUG_REQUEST_LOGS: z.coerce.boolean().default(false),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório.'),
  REDIS_URL: z.string().min(1, 'REDIS_URL é obrigatório.'),
  SICAR_API_BASE: z.string().optional(),
  CORE_BASE_URL: z.string().url('CORE_BASE_URL deve ser uma URL válida.'),
  CORE_SERVICE_TOKEN: z.string().min(1, 'CORE_SERVICE_TOKEN é obrigatório.'),
  API_BASE_URL: z.string().url('API_BASE_URL deve ser uma URL válida.'),
  GCS_BUCKET: z.string().default('atmos-agro-data-lake-dev'),
  CORS_ORIGIN: z.string().optional(),
  SUPABASE_URL: z.string().url(),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY é obrigatório.'),
  SUPABASE_SERVICE_ROLE_KEY: z
    .string()
    .min(1, 'SUPABASE_SERVICE_ROLE_KEY é obrigatório.'),
  SUPABASE_PASSWORD_RESET_REDIRECT: z
    .string()
    .url('SUPABASE_PASSWORD_RESET_REDIRECT deve ser uma URL válida.'),
  SUPABASE_JWT_SECRET: z
    .string()
    .min(1, 'SUPABASE_JWT_SECRET é obrigatório para validar tokens.'),
});

export const env = envSchema.parse(process.env);
export type Env = typeof env;