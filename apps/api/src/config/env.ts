import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),

  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI es requerido en apps/api/.env')
    .refine(
      (v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'),
      'MONGODB_URI debe empezar con "mongodb://" o "mongodb+srv://"'
    ),

  WEB_ORIGIN: z.string().url('WEB_ORIGIN debe ser una URL válida').default('http://localhost:5173'),

  JWT_SECRET: z.string().min(12, 'JWT_SECRET debe tener al menos 12 caracteres'),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  COOKIE_DOMAIN: z.string().default('localhost'),
});

export const env = EnvSchema.parse(process.env);
