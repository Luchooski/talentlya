import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { ACCESS_TOKEN_NAME } from '../config/security';

export type AuthUser = { _id: string; email: string; role: 'admin' | 'user'; orgId: string };

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUser;
  }
}

export function requireAuth() {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies?.[ACCESS_TOKEN_NAME];
    if (!token) {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
    }
    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as AuthUser & { iat: number; exp: number };
      req.user = { _id: payload._id, email: payload.email, role: payload.role, orgId: payload.orgId };
    } catch {
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Token inválido' } });
    }
  };
}
