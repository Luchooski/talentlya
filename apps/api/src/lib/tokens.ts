import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { env } from '../config/env';

type Purpose = 'verify' | 'reset';

export function signPurposeToken(userId: string, purpose: Purpose, ttlSec: number, extra: Record<string, unknown> = {}) {
  const jti = nanoid();
  const token = jwt.sign({ sub: userId, purpose, jti, ...extra }, env.JWT_SECRET, { expiresIn: ttlSec });
  const expAt = new Date(Date.now() + ttlSec * 1000);
  return { token, jti, expAt };
}

export function verifyPurposeToken(token: string, purpose: Purpose) {
  const payload = jwt.verify(token, env.JWT_SECRET) as { sub: string; purpose: Purpose; jti: string; [k: string]: any };
  if (payload.purpose !== purpose) throw new Error('Invalid purpose');
  return payload;
}
