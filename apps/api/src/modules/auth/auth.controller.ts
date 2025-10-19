import type { FastifyReply, FastifyRequest } from 'fastify';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';

import { cookieOpts, ACCESS_TOKEN_NAME, REFRESH_TOKEN_NAME, accessTtlSec, refreshTtlSec, csrfCookieName } from '../../config/security';
import { LoginInputSchema, RegisterInputSchema, MeOutputSchema, AuthUserSchema } from './auth.dto';
import { createUser, issueTokens, validateUser, buildRefresh, signAccess } from './auth.service';

import { env } from '../../config/env';
import { findOrCreateOrgByName } from '../org/org.service';
import { createSession, findSessionByJti, revokeAllSessionsByUser, revokeFamily, revokeSessionByJti, rotateSession } from '../session/session.service';

import argon2 from 'argon2';
import { ChangePasswordInputSchema } from './auth.dto';
import { requireAuth } from '../../middlewares/auth';

import {
  ForgotPasswordInputSchema,
  ResetPasswordInputSchema,
  VerifyEmailInputSchema,
} from './auth.dto';
import { User } from './auth.model';
import { verifyPurposeToken } from '../../lib/tokens';
import { applyNewPassword, sendResetPassword, sendVerifyEmail } from './auth.service';

function setAuthCookies(reply: FastifyReply, tokens: { access: string; refresh: string }) {
  reply
    .setCookie(ACCESS_TOKEN_NAME, tokens.access, { ...cookieOpts, maxAge: accessTtlSec })
    .setCookie(REFRESH_TOKEN_NAME, tokens.refresh, { ...cookieOpts, maxAge: refreshTtlSec });

  // CSRF (no httpOnly) para double-submit
  reply.setCookie(csrfCookieName, nanoid(), { ...cookieOpts, httpOnly: false, maxAge: refreshTtlSec });
}

function clientMeta(req: FastifyRequest) {
  return {
    ip: (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip,
    userAgent: (req.headers['user-agent'] as string) || 'unknown',
  };
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

  const { access, refresh, jti, familyId, refreshExpiresAt } = issueTokens(safeUser);
  await createSession({
    userId: safeUser._id,
    jti,
    familyId,
    refreshToken: refresh,
    ...clientMeta(req),
    expiresAt: refreshExpiresAt,
  });

  setAuthCookies(reply, { access, refresh });
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

  const { access, refresh, jti, familyId, refreshExpiresAt } = issueTokens(safeUser);
  await createSession({
    userId: safeUser._id,
    jti,
    familyId,
    refreshToken: refresh,
    ...clientMeta(req),
    expiresAt: refreshExpiresAt,
  });

  setAuthCookies(reply, { access, refresh });
  const out = MeOutputSchema.parse({ user: safeUser });
  return reply.send(out);
}

export async function meHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = AuthUserSchema.safeParse(req.user);
  if (!parsed.success) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
  return reply.send(MeOutputSchema.parse({ user: parsed.data }));
}

export async function logoutHandler(req: FastifyRequest, reply: FastifyReply) {
  // limpiar cookies siempre
  reply
    .clearCookie(ACCESS_TOKEN_NAME, cookieOpts)
    .clearCookie(REFRESH_TOKEN_NAME, cookieOpts)
    .clearCookie(csrfCookieName, { ...cookieOpts, httpOnly: false });

  // intentamos revocar la sesión actual (si existe refresh cookie y es válida)
  const refresh = req.cookies?.[REFRESH_TOKEN_NAME];
  if (refresh) {
    try {
      const payload = jwt.verify(refresh, env.JWT_SECRET) as { sub: string; jti: string; fam: string };
      await revokeSessionByJti(payload.jti);
    } catch {
      // token inválido/expirado: no pasa nada, ya limpiamos cookies
    }
  }

  return reply.send({ ok: true });
}

export async function logoutAllHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = AuthUserSchema.safeParse(req.user);
  if (!parsed.success) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
  await revokeAllSessionsByUser(parsed.data._id);

  reply
    .clearCookie(ACCESS_TOKEN_NAME, cookieOpts)
    .clearCookie(REFRESH_TOKEN_NAME, cookieOpts)
    .clearCookie(csrfCookieName, { ...cookieOpts, httpOnly: false });

  return reply.send({ ok: true });
}

export async function refreshHandler(req: FastifyRequest, reply: FastifyReply) {
  const cookieRefresh = req.cookies?.[REFRESH_TOKEN_NAME];
  if (!cookieRefresh) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No hay refresh' } });

  try {
    const payload = jwt.verify(cookieRefresh, env.JWT_SECRET) as { sub: string; jti: string; fam: string; iat: number; exp: number };
    const user = await User.findById(payload.sub).lean();
    if (!user) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Usuario no encontrado' } });

    // Verificamos que la sesión exista y no esté revocada (anti reuse)
    const sess = await findSessionByJti(String(user._id), payload.jti);
    if (!sess || sess.revokedAt) {
      // REUSE DETECTED: revocamos toda la familia y forzamos logout
      await revokeFamily(payload.fam);
      reply
        .clearCookie(ACCESS_TOKEN_NAME, cookieOpts)
        .clearCookie(REFRESH_TOKEN_NAME, cookieOpts)
        .clearCookie(csrfCookieName, { ...cookieOpts, httpOnly: false });
      return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Refresh reutilizado o inválido' } });
    }

    const safeUser = { _id: String(user._id), email: user.email, role: user.role as 'admin' | 'user', orgId: user.orgId };

    // ROTAR: crear nuevo access y nuevo refresh dentro de la misma familia
    const access = signAccess(safeUser);
    const { token: newRefresh, jti: newJti, familyId, expiresAt } = buildRefresh(safeUser._id, payload.fam);

    await rotateSession({
      oldJti: payload.jti,
      newJti,
      newRefreshToken: newRefresh,
      userId: safeUser._id,
      familyId,
      expiresAt,
      ...clientMeta(req),
    });

    setAuthCookies(reply, { access, refresh: newRefresh });

    const out = MeOutputSchema.parse({ user: safeUser });
    return reply.send(out);
  } catch {
    return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'Refresh inválido' } });
  }
}

// (Opcional) endpoint para listar sesiones actuales del usuario
export async function listMySessionsHandler(req: FastifyRequest, reply: FastifyReply) {
  const parsed = AuthUserSchema.safeParse(req.user);
  if (!parsed.success) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });
  // Sólo info básica
  const { Session } = await import('../session/session.model');
  const items = await Session.find({ userId: parsed.data._id }).sort({ createdAt: -1 }).lean();
  const mapped = items.map((s) => ({
    jti: s.jti,
    familyId: s.familyId,
    createdAt: s.createdAt,
    expiresAt: s.expiresAt,
    revokedAt: s.revokedAt ?? null,
    replacedBy: s.replacedBy ?? null,
    userAgent: s.userAgent ?? 'unknown',
    ip: s.ip ?? 'unknown',
  }));
  return reply.send({ items: mapped });
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
// POST /auth/forgot-password  (PUBLIC, sin CSRF)
export async function forgotPasswordHandler(req: FastifyRequest, reply: FastifyReply) {
  const parse = ForgotPasswordInputSchema.safeParse(req.body);
  if (!parse.success) return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Datos inválidos', details: parse.error.issues } });

  const { email } = parse.data;
  await sendResetPassword(email);
  return reply.send({ ok: true }); // No revelamos si existe o no
}

// POST /auth/reset-password (PUBLIC, sin CSRF)
export async function resetPasswordHandler(req: FastifyRequest, reply: FastifyReply) {
  const parse = ResetPasswordInputSchema.safeParse(req.body);
  if (!parse.success) return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Datos inválidos', details: parse.error.issues } });

  const { token, newPassword } = parse.data;
  try {
    const payload = verifyPurposeToken(token, 'reset'); // { sub, jti, email, ... }
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.resetJti || user.resetJti !== payload.jti) {
      return reply.status(400).send({ error: { code: 'TOKEN_INVALID', message: 'Token inválido o usado' } });
    }

    await applyNewPassword(String(user._id), newPassword);
    return reply.send({ ok: true });
  } catch {
    return reply.status(400).send({ error: { code: 'TOKEN_INVALID', message: 'Token inválido o expirado' } });
  }
}

// POST /auth/send-verify-email (AUTENTICADO) → reenvía email
export async function sendVerifyEmailHandler(req: FastifyRequest, reply: FastifyReply) {
  const userId = (req.user as any)?._id as string | undefined;
  const email = (req.user as any)?.email as string | undefined;
  if (!userId || !email) return reply.status(401).send({ error: { code: 'UNAUTHORIZED', message: 'No autenticado' } });

  await sendVerifyEmail(userId, email);
  return reply.send({ ok: true });
}

// GET /auth/verify-email?token=... (PÚBLICO, sin CSRF; redirecciona a APP)
export async function verifyEmailHandler(req: FastifyRequest, reply: FastifyReply) {
  const token = (req.query as any)?.token as string | undefined;
  if (!token) return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Falta token' } });

  try {
    const payload = verifyPurposeToken(token, 'verify'); // { sub, jti }
    const user = await User.findById(payload.sub).lean();
    if (!user || !user.verifyJti || user.verifyJti !== payload.jti) {
      return reply.status(400).send({ error: { code: 'TOKEN_INVALID', message: 'Token inválido o usado' } });
    }
    await User.updateOne({ _id: payload.sub }, { $set: { emailVerifiedAt: new Date(), verifyJti: null } });

    // Redirigimos a la app con estado
    const url = new URL('/verified', env.APP_ORIGIN);
    url.searchParams.set('status', 'ok');
    return reply.redirect(url.toString());
  } catch {
    const url = new URL('/verified', env.APP_ORIGIN);
    url.searchParams.set('status', 'error');
    return reply.redirect(url.toString());
  }
}