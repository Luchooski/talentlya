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

await app.register(helmet, { contentSecurityPolicy: false });

await app.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    const allowed = [env.WEB_ORIGIN];
    if (allowed.includes(origin)) return cb(null, true);
    cb(new Error('CORS not allowed for this origin'), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  // Opcional: si tu navegador hace preflight con este header, podés declararlo
  allowedHeaders: ['Content-Type', 'x-csrf-token'],
});

await app.register(cookie);

await app.register(rateLimit, {
  max: env.RATE_LIMIT_MAX,
  timeWindow: `${env.RATE_LIMIT_TIME_WINDOW_MIN} minutes`,
});

// 👇 CSRF: EXCLUIMOS login/register para permitir el primer acceso
app.addHook(
  'preHandler',
  requireCsrf({
    skipPaths: [
      '/api/v1/auth/login',
      '/api/v1/auth/register',
      '/api/v1/auth/forgot-password',
      '/api/v1/auth/reset-password',
      '/api/v1/auth/verify-email', // es GET con token en query
    ],
  }),
);

// Rutas
app.register(healthRoutes, { prefix: '/api/v1' });
app.register(authRoutes,   { prefix: '/api/v1' });
app.register(employeeRoutes, { prefix: '/api/v1' });

registerNotFound(app);
registerErrorHandler(app);
