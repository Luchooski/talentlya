import Fastify from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';

import { env } from './config/env';
import { registerErrorHandler } from './middlewares/error-handler';
import { registerNotFound } from './middlewares/not-found';
import { healthRoutes } from './modules/health/health.routes';
import { authRoutes } from './modules/auth/auth.routes';

import { employeeRoutes } from './modules/employee/employee.routes';

export const app = Fastify({ logger: true });

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

// Cookies (HTTP-only)
await app.register(cookie);

// Routes
app.register(healthRoutes, { prefix: '/api/v1' });
app.register(authRoutes, { prefix: '/api/v1' });
app.register(employeeRoutes, { prefix: '/api/v1' });

// Middlewares globales
registerNotFound(app);
registerErrorHandler(app);
