import { z } from 'zod';

export const OrgCreateInputSchema = z.object({
  name: z.string().min(3, 'Nombre de organización muy corto'),
});

export const OrgOutputSchema = z.object({
  _id: z.string(),
  name: z.string(),
});

export type OrgCreateInput = z.infer<typeof OrgCreateInputSchema>;
