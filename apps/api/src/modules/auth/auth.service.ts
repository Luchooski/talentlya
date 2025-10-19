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

export function buildRefresh(userId: string, familyId?: string) {
  // jti nuevo cada emisión; familyId persiste a lo largo de las rotaciones
  const jti = nanoid();
  const fam = familyId ?? nanoid();
  const token = jwt.sign({ sub: userId, jti, fam }, env.JWT_SECRET, { expiresIn: refreshTtlSec });
  const expiresAt = new Date(Date.now() + refreshTtlSec * 1000);
  return { token, jti, familyId: fam, expiresAt };
}

export function issueTokens(user: SafeUser) {
  const access = signAccess(user);
  const { token: refresh, jti, familyId, expiresAt } = buildRefresh(user._id);
  return { access, refresh, jti, familyId, refreshExpiresAt: expiresAt };
}
