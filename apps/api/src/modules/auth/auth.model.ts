import { Schema, model, type Document } from 'mongoose';

export type UserRole = 'admin' | 'user';

export interface UserDoc extends Document {
  email: string;
  passwordHash: string;
  role: UserRole;
  orgId: string;               
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<UserDoc>(
  {
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'user'], default: 'user', index: true },
    orgId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true });

export const User = model<UserDoc>('User', UserSchema);
