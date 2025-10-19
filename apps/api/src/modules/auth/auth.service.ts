import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { User } from './auth.model';
import { env } from '../../config/env';
import { accessTtlSec, refreshTtlSec } from '../../config/security';

export async function createUser(email: string, password: string, orgId: string) {
  const exists = await User.findOne({ email }).lean();
  if (exists) throw Object.assign(new Error('Email ya registrado'), { statusCode: 409, code: 'EMAIL_TAKEN' });
  const passwordHash = await argon2.hash(password);
  const doc = await User.create({ email, passwordHash, orgId });
  return doc;
}

export async function validateUser(email: string, password: string) {
  const user = await User.findOne({ email });
  if (!user) return null;
  const ok = await argon2.verify(user.passwordHash, password);
  return ok ? user : null;
}

type SafeUser = { _id: string; email: string; role: 'admin' | 'user'; orgId: string };

export function signAccess(user: SafeUser) {
  const payload = { _id: user._id, email: user.email, role: user.role, orgId: user.orgId };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: accessTtlSec });
}

// Refresh rotativo con jti embebido (sin DB para MVP):
// - En cada refresh se genera un jti nuevo y se invalida el anterior por tiempo (no reuse detection).
// - (Futuro) Guardar jtis en Mongo/Redis para detectar reuse y revocar familia.
export function signRefresh(userId: string) {
  const jti = nanoid();
  return jwt.sign({ sub: userId, jti }, env.JWT_SECRET, { expiresIn: refreshTtlSec });
}

export function issueTokens(user: SafeUser) {
  return {
    access: signAccess(user),
    refresh: signRefresh(user._id),
  };
}
