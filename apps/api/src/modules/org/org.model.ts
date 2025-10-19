import { Schema, model, type Document } from 'mongoose';

export interface OrganizationDoc extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrgSchema = new Schema<OrganizationDoc>(
  { name: { type: String, required: true, unique: true, index: true } },
  { timestamps: true }
);

export const Organization = model<OrganizationDoc>('Organization', OrgSchema);
