import { Schema, model, type Document } from 'mongoose';
import { multiTenantPlugin } from '../../plugins/multitenant';

export interface EmployeeDoc extends Document {
  orgId: string;          // viene del plugin + schema
  firstName: string;
  lastName: string;
  email: string;
  legajo: string;         // identificador interno
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<EmployeeDoc>(
  {
    // orgId lo añade el plugin con required+index
    firstName: { type: String, required: true, index: true },
    lastName: { type: String, required: true, index: true },
    email: { type: String, required: true },
    legajo: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

EmployeeSchema.plugin(multiTenantPlugin);
EmployeeSchema.index({ orgId: 1, email: 1 }, { unique: true });
EmployeeSchema.index({ orgId: 1, legajo: 1 }, { unique: true });

export const Employee = model<EmployeeDoc>('Employee', EmployeeSchema);
