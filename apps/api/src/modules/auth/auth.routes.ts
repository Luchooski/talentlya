import type { FastifyInstance } from 'fastify';
import {
  registerHandler,
  loginHandler,
  meHandler,
  logoutHandler,
  refreshHandler,
  changePasswordHandler,
  logoutAllHandler,
  listMySessionsHandler,
  forgotPasswordHandler,
  resetPasswordHandler,
  sendVerifyEmailHandler,
  verifyEmailHandler,
} from './auth.controller';
import { requireAuth } from '../../middlewares/auth';

export async function authRoutes(app: FastifyInstance) {
  // públicos
  app.post('/auth/register', registerHandler);
  app.post('/auth/login', loginHandler);
  app.post('/auth/forgot-password', forgotPasswordHandler);
  app.post('/auth/reset-password', resetPasswordHandler);
  app.get('/auth/verify-email', verifyEmailHandler);

  // CSRF protected + auth
  app.post('/auth/logout', logoutHandler);
  app.post('/auth/logout-all', { preHandler: [requireAuth()] }, logoutAllHandler);
  app.post('/auth/refresh', refreshHandler);
  app.get('/auth/me', { preHandler: [requireAuth()] }, meHandler);
  app.get('/auth/sessions', { preHandler: [requireAuth()] }, listMySessionsHandler);
  app.post('/auth/change-password', { preHandler: [requireAuth()] }, changePasswordHandler);
  app.post('/auth/send-verify-email', { preHandler: [requireAuth()] }, sendVerifyEmailHandler);
}
