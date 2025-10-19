import { z } from 'zod';

export const EmployeeCreateInputSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  legajo: z.string().min(1),
});

export const EmployeeUpdateInputSchema = EmployeeCreateInputSchema.partial();

export const EmployeeOutputSchema = z.object({
  _id: z.string(),
  orgId: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string(),
  legajo: z.string(),
});

export const EmployeeListOutputSchema = z.object({
  items: z.array(EmployeeOutputSchema),
  total: z.number().int().nonnegative(),
});

export type EmployeeCreateInput = z.infer<typeof EmployeeCreateInputSchema>;
export type EmployeeUpdateInput = z.infer<typeof EmployeeUpdateInputSchema>;
