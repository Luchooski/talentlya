import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('4000'),
  MONGODB_URI: z
    .string()
    .min(1, 'MONGODB_URI es requerido')
    .refine(
      (v) => v.startsWith('mongodb://') || v.startsWith('mongodb+srv://'),
      'MONGODB_URI debe empezar con "mongodb://" o "mongodb+srv://"',
    ),
  WEB_ORIGIN: z.string().url('WEB_ORIGIN debe ser una URL válida').default('http://localhost:5173'),
});

export const env = EnvSchema.parse(process.env);
