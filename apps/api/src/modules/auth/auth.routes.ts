import type { FastifyInstance } from 'fastify';
import {
  registerHandler,
  loginHandler,
  meHandler,
  logoutHandler,
  refreshHandler,
  changePasswordHandler, // si lo implementaste antes
  logoutAllHandler,
  listMySessionsHandler,
} from './auth.controller';
import { requireAuth } from '../../middlewares/auth';

export async function authRoutes(app: FastifyInstance) {
  app.post('/auth/register', registerHandler);
  app.post('/auth/login', loginHandler);
  app.post('/auth/logout', logoutHandler);
  app.post('/auth/logout-all', { preHandler: [requireAuth()] }, logoutAllHandler);
  app.post('/auth/refresh', refreshHandler);

  app.get('/auth/me', { preHandler: [requireAuth()] }, meHandler);
  app.get('/auth/sessions', { preHandler: [requireAuth()] }, listMySessionsHandler);

  // opcional
  if (typeof changePasswordHandler === 'function') {
    app.post('/auth/change-password', { preHandler: [requireAuth()] }, changePasswordHandler);
  }
}
