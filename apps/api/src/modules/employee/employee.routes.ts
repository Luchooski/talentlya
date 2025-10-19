import type { FastifyInstance } from 'fastify';
import { requireAuth } from '../../middlewares/auth';
import { createHandler, deleteHandler, listHandler, updateHandler } from './employee.controller';

export async function employeeRoutes(app: FastifyInstance) {
  app.addHook('preHandler', requireAuth()); // todas protegidas
  app.get('/employees', listHandler);
  app.post('/employees', createHandler);
  app.patch('/employees/:id', updateHandler);
  app.delete('/employees/:id', deleteHandler);
}
