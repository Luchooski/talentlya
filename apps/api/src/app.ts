import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';

import { env } from './config/env';
import { registerErrorHandler } from './middlewares/error-handler';
import { registerNotFound } from './middlewares/not-found';
import { requireCsrf } from './middlewares/csrf';

import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';
import { employeeRoutes } from './modules/employee/employee.routes';

export const app = Fastify({ logger: true });

// Security headers
await app.register(helmet, {
  contentSecurityPolicy: false, // simplificamos para dev; en prod se puede configurar
});

// CORS
await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [env.WEB_ORIGIN];
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed for this origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
});

await app.register(cookie);

// Rate limit (anti fuerza bruta básica)
await app.register(rateLimit, {
  max: env.RATE_LIMIT_MAX,
  timeWindow: `${env.RATE_LIMIT_TIME_WINDOW_MIN} minutes`,
  allowList: [], // podés permitir IPs internas
});

// CSRF (double-submit) para mutaciones a nivel global
app.addHook('preHandler', requireCsrf());

// Rutas
app.register(healthRoutes, { prefix: '/api/v1' });
app.register(authRoutes,   { prefix: '/api/v1' });
app.register(employeeRoutes, { prefix: '/api/v1' });

// Middlewares globales
registerNotFound(app);
registerErrorHandler(app);
