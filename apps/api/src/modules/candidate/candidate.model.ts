import { Schema, model, Document } from 'mongoose';

export interface CandidateDoc extends Document {
  tenantId?: string; // si usás multitenant por header/subdominio
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  tags: string[];
  source?: string;
  notes?: string;
  resume?: { url?: string; name?: string; mime?: string; size?: number };
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<CandidateDoc>({
  tenantId: { type: String, index: true },
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, trim: true, lowercase: true, index: true },
  phone:     { type: String },
  stage:     { type: String, enum: ['applied','screening','interview','offer','hired','rejected'], default: 'applied', index: true },
  tags:      { type: [String], default: [] },
  source:    { type: String },
  notes:     { type: String },
  resume:    { url: String, name: String, mime: String, size: Number }
}, { timestamps: true });

CandidateSchema.index({ tenantId: 1, email: 1 }, { unique: false }); // cámbialo a unique:true si querés único por tenant

export const Candidate = model<CandidateDoc>('Candidate', CandidateSchema);
