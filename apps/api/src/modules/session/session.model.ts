import { Schema, model, type Document } from 'mongoose';

export interface SessionDoc extends Document {
  userId: string;
  jti: string;               // id del refresh actual
  familyId: string;          // agrupa la “familia” de refresh tokens rotados
  refreshHash: string;       // SHA-256 del refresh JWT (no guardamos el token plano)
  userAgent?: string;
  ip?: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt?: Date;
  replacedBy?: string;       // jti del siguiente token (rotación)
}

const SessionSchema = new Schema<SessionDoc>({
  userId: { type: String, required: true, index: true },
  jti: { type: String, required: true, unique: true, index: true },
  familyId: { type: String, required: true, index: true },
  refreshHash: { type: String, required: true, index: true },

  userAgent: { type: String },
  ip: { type: String },

  createdAt: { type: Date, default: () => new Date(), index: true },
  expiresAt: { type: Date, required: true, index: true },
  revokedAt: { type: Date },
  replacedBy: { type: String },
});

SessionSchema.index({ userId: 1, createdAt: -1 });

export const Session = model<SessionDoc>('Session', SessionSchema);
