import crypto from 'crypto';
import { Session } from './session.model';
import { env } from '../../config/env';

export function sha256(input: string) {
  return crypto.createHash('sha256').update(input).digest('hex');
}

export async function createSession(params: {
  userId: string;
  jti: string;
  familyId: string;
  refreshToken: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
}) {
  const doc = await Session.create({
    userId: params.userId,
    jti: params.jti,
    familyId: params.familyId,
    refreshHash: sha256(params.refreshToken),
    userAgent: params.userAgent,
    ip: params.ip,
    expiresAt: params.expiresAt,
  });

  // Limitar cantidad de sesiones por usuario (LIFO)
  const count = await Session.countDocuments({ userId: params.userId });
  if (count > env.SESSIONS_MAX_PER_USER) {
    const overflow = count - env.SESSIONS_MAX_PER_USER;
    const oldSessions = await Session.find({ userId: params.userId })
      .sort({ createdAt: 1 })
      .limit(overflow)
      .lean();
    const ids = oldSessions.map((s) => s.jti);
    if (ids.length) {
      await Session.updateMany({ jti: { $in: ids } }, { $set: { revokedAt: new Date() } });
    }
  }

  return doc.toObject();
}

export async function findSessionByJti(userId: string, jti: string) {
  return Session.findOne({ userId, jti }).lean();
}

export async function revokeSessionByJti(jti: string) {
  await Session.updateOne({ jti }, { $set: { revokedAt: new Date() } });
}

export async function revokeAllSessionsByUser(userId: string) {
  await Session.updateMany({ userId }, { $set: { revokedAt: new Date() } });
}

export async function revokeFamily(familyId: string) {
  await Session.updateMany({ familyId }, { $set: { revokedAt: new Date() } });
}

export async function rotateSession(params: {
  oldJti: string;
  newJti: string;
  newRefreshToken: string;
  expiresAt: Date;
  userId: string;
  familyId: string;
  userAgent?: string;
  ip?: string;
}) {
  const now = new Date();
  await Session.updateOne(
    { jti: params.oldJti },
    { $set: { revokedAt: now, replacedBy: params.newJti } }
  );

  await createSession({
    userId: params.userId,
    jti: params.newJti,
    familyId: params.familyId,
    refreshToken: params.newRefreshToken,
    expiresAt: params.expiresAt,
    ...(params.userAgent ? { userAgent: params.userAgent } : {}),
    ...(params.ip ? { ip: params.ip } : {}),
  });
}
