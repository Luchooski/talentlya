import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function registerNotFound(app: FastifyInstance) {
  app.setNotFoundHandler((req: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      error: {
        code: 'NOT_FOUND',
        message: `No se encontró ${req.method} ${req.url}`,
      },
    });
  });
}
