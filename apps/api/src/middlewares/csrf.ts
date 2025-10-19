import type { FastifyReply, FastifyRequest } from 'fastify';
import { csrfCookieName, csrfHeaderName } from '../config/security';

// En rutas mutables exigimos que el header coincida con la cookie
const METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function requireCsrf() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!METHODS.has(req.method)) return; // sólo mutaciones
    const cookieValue = req.cookies?.[csrfCookieName];
    const headerValue = (req.headers[csrfHeaderName] as string | undefined) ?? '';
    if (!cookieValue || !headerValue || cookieValue !== headerValue) {
      return reply.status(403).send({ error: { code: 'CSRF', message: 'CSRF token inválido' } });
    }
  };
}
