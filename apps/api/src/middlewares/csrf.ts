import type { FastifyReply, FastifyRequest } from 'fastify';
import { csrfCookieName, csrfHeaderName } from '../config/security';

// Métodos que modifican estado
const METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

type CsrfOptions = {
  skipPaths?: string[]; // rutas exactas o prefix simples
};

/**
 * Double-submit CSRF:
 * - Si el método es mutación, compara cookie (no httpOnly) vs header.
 * - Podés excluir rutas como /auth/login y /auth/register para el primer ingreso.
 */
export function requireCsrf(opts: CsrfOptions = {}) {
  const skip = new Set(opts.skipPaths ?? []);

  return async (req: FastifyRequest, reply: FastifyReply) => {
    if (!METHODS.has(req.method)) return;

    const url = req.url;
    // excluir exactos y por prefijo simple
    for (const s of skip) {
      if (s.endsWith('*')) {
        const prefix = s.slice(0, -1);
        if (url.startsWith(prefix)) return; // skip
      } else if (url === s) {
        return; // skip
      }
    }

    const cookieValue = req.cookies?.[csrfCookieName];
    const headerValue = (req.headers[csrfHeaderName] as string | undefined) ?? '';
    if (!cookieValue || !headerValue || cookieValue !== headerValue) {
      return reply.status(403).send({ error: { code: 'CSRF', message: 'CSRF token inválido' } });
    }
  };
}
