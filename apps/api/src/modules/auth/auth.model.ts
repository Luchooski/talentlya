import { Schema, model, type Document } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface UserDoc extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  orgId: string;
  emailVerifiedAt?: Date | null;

  // single-use tokens control
  verifyJti?: string | null;
  resetJti?: string | null;
  resetRequestedAt?: Date | null;

  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
    orgId: { type: String, required: true, index: true },

    emailVerifiedAt: { type: Date, default: null },

    verifyJti: { type: String, default: null },
    resetJti: { type: String, default: null },
    resetRequestedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User = model<UserDoc>('User', UserSchema);
