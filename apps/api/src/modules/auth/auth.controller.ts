import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

import { cookieOpts, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME, accessTtlSec, refreshTtlSec, csrfCookieName } from '../../config/security';
import { LoginInputSchema, RegisterInputSchema, MeOutputSchema, AuthUserSchema } from './auth.dto';
import { createUser, issueTokens, validateUser } from './auth.service';
import { User } from './auth.model';
import { env } from '../../config/env';
import { findOrCreateOrgByName } from '../org/org.service';

import argon2 from 'argon2';
import { ChangePasswordInputSchema } from './auth.dto';
import { requireAuth } from '../../middlewares/auth';

function setAuthCookies(reply: FastifyReply, tokens: { access: string; refresh: string }) {
  reply
    .setCookie(ACCESS_TOKEN_NAME, tokens.access, { ...cookieOpts, maxAge: accessTtlSec })
    .setCookie(REFRESH_TOKEN_NAME, tokens.refresh, { ...cookieOpts, maxAge: refreshTtlSec });

  // Set CSRF (NO httpOnly) para double-submit
  reply.setCookie(csrfCookieName, nanoid(), {
    ...cookieOpts,
    httpOnly: false,
    maxAge: refreshTtlSec,
  });
}

export async function registerHandler(req: FastifyRequest, reply: FastifyReply) {
  const parse = RegisterInputSchema.safeParse(req.body);
  if (!parse.success) {
    return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Datos inválidos', details: parse.error.issues } });
  }
  const { email, password, orgName } = parse.data;

  const org = await findOrCreateOrgByName(orgName);
  const user = await createUser(email, password, String(org._id));

  const safeUser = { _id: String(user._id), email: user.email, role: user.role, orgId: String(org._id) };
  const tokens = issueTokens(safeUser);

  setAuthCookies(reply, tokens);

  const out = MeOutputSchema.parse({ user: safeUser });
  return reply.status(201).send(out);
}

export async function loginHandler(req: FastifyRequest, reply: FastifyReply) {
  const parse = LoginInputSchema.safeParse(req.body);
  if (!parse.success) {
    return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Datos inválidos', details: parse.error.issues } });
  }
  const { email, password } = parse.data;

  const user = await validateUser(email, password);
  if (!user) {
    req.log.warn({ email }, 'Login failed: invalid credentials or user not found');
    return reply.status(401).send({ error: { code: 'INVALID_CREDENTIALS', message: 'Credenciales inválidas' } });
  }

  const safeUser = { _id: String(user._id), email: user.email, role: user.role, orgId: user.orgId };
  const tokens = issueTokens(safeUser);

  setAuthCookies(reply, tokens);

  const out = MeOutputSchema.parse({ user: safeUser });
  return reply.send(out);
}

export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = AuthUserSchema.safeParse(req.user);
  if (!parsed.success) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
  return reply.send(MeOutputSchema.parse({ user: parsed.data }));
}

export async function logoutHandler(_req: FastifyRequest, reply: FastifyReply) {
  reply
    .clearCookie(ACCESS_TOKEN_NAME, cookieOpts)
    .clearCookie(REFRESH_TOKEN_NAME, cookieOpts)
    .clearCookie(csrfCookieName, { ...cookieOpts, httpOnly: false });
  return reply.send({ ok: true });
}

export async function refreshHandler(req: FastifyRequest, reply: FastifyReply) {
  const refresh = req.cookies?.[REFRESH_TOKEN_NAME];
  if (!refresh) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No hay refresh' } });

  try {
    const payload = jwt.verify(refresh, env.JWT_SECRET) as { sub: string; jti: string; iat: number; exp: number };
    const user = await User.findById(payload.sub).lean();
    if (!user) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Usuario no encontrado' } });

    const safeUser = { _id: String(user._id), email: user.email, role: user.role as 'admin' | 'user', orgId: user.orgId };
    // Rotar: nuevo access y nuevo refresh (con jti distinta)
    const tokens = issueTokens(safeUser);

    setAuthCookies(reply, tokens);

    const out = MeOutputSchema.parse({ user: safeUser });
    return reply.send(out);
  } catch {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Refresh inválido' } });
  }
}
export async function changePasswordHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsedUser = AuthUserSchema.safeParse(req.user);
  if (!parsedUser.success) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });

  const parse = ChangePasswordInputSchema.safeParse(req.body);
  if (!parse.success) {
    return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Datos inválidos', details: parse.error.issues } });
  }

  const { currentPassword, newPassword } = parse.data;
  const user = await User.findById(parsedUser.data._id);
  if (!user) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Usuario no encontrado' } });

  const ok = await argon2.verify(user.passwordHash, currentPassword);
  if (!ok) return reply.status(401).send({ error: { code: 'INVALID_CREDENTIALS', message: 'Contraseña actual incorrecta' } });

  user.passwordHash = await argon2.hash(newPassword);
  await user.save();
  return reply.send({ ok: true });
}
