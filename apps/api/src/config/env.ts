import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),

  MONGODB_URI: z.string().min(1).refine(
    (v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'),
    'MONGODB_URI debe empezar con "mongodb://" o "mongodb+srv://"'
  ),

  WEB_ORIGIN: z.string().url().default('http://localhost:5173'),

  JWT_SECRET: z.string().min(12, 'JWT_SECRET debe tener al menos 12 caracteres'),
  ACCESS_TOKEN_TTL_MIN: z.coerce.number().int().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  COOKIE_DOMAIN: z.string().default('localhost'),

  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  RATE_LIMIT_TIME_WINDOW_MIN: z.coerce.number().int().positive().default(15),

  CSRF_COOKIE_NAME: z.string().default('csrf_token'),
  CSRF_HEADER_NAME: z.string().default('x-csrf-token'),

  // Sesiones (límite de dispositivos por usuario)
  SESSIONS_MAX_PER_USER: z.coerce.number().int().positive().default(10),
});

export const env = EnvSchema.parse(process.env);
