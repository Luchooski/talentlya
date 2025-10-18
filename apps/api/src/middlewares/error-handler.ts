import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

type ErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

function zodToDetails(err: ZodError) {
  return err.issues.map((i) => ({
    path: i.path.join('.'),
    message: i.message,
    code: i.code,
  }));
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler(
    (error: FastifyError | ZodError, _req: FastifyRequest, reply: FastifyReply) => {
      let status = 500;
      let body: ErrorBody = {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Ha ocurrido un error inesperado',
        },
      };

      // Zod validation
      if (error instanceof ZodError) {
        status = 400;
        body = {
          error: {
            code: 'BAD_REQUEST',
            message: 'Datos inválidos',
            details: zodToDetails(error),
          },
        };
      } else {
        // Fastify/General
        if (error.validation) {
          status = 400;
          body = {
            error: {
              code: 'BAD_REQUEST',
              message: error.message,
              details: error.validation,
            },
          };
        } else if ('statusCode' in error && typeof error.statusCode === 'number') {
          status = error.statusCode;
          body = {
            error: {
              code: error.code ?? 'ERROR',
              message: error.message,
            },
          };
        } else {
          // log real (Fastify logger ya lo hace)
          app.log.error(error);
        }
      }

      return reply.status(status).send(body);
    },
  );
}
