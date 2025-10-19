import argon2 from 'argon2';
import jwt from 'jsonwebtoken';
import { User } from './auth.model';
import { env } from '../../config/env';
import { accessTtlSec, refreshTtlSec } from '../../config/security';

export async function createUser(email: string, password: string, orgId: string) {
  const exists = await User.findOne({ email }).lean();
  if (exists) {
    throw Object.assign(new Error('Email ya registrado'), { statusCode: 409, code: 'EMAIL_TAKEN' });
  }
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

export function signTokens(user: { _id: string; email: string; role: 'admin' | 'user'; orgId: string }) {
  const payload = { _id: user._id, email: user.email, role: user.role, orgId: user.orgId };
  const access = jwt.sign(payload, env.JWT_SECRET, { expiresIn: accessTtlSec });
  const refresh = jwt.sign({ sub: user._id }, env.JWT_SECRET, { expiresIn: refreshTtlSec });
  return { access, refresh };
}
