import type { FastifyInstance } from 'fastify';
import { registerHandler, loginHandler, meHandler, logoutHandler, refreshHandler } from './auth.controller';
import { requireAuth } from '../../middlewares/auth';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', registerHandler);
  app.post('/auth/login', loginHandler);
  app.post('/auth/logout', logoutHandler);
  app.post('/auth/refresh', refreshHandler);

  app.get('/auth/me', { preHandler: [requireAuth()] }, meHandler);
}
