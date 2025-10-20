import { z } from 'zod';

export const CandidateSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  stage: z.enum(['applied','screening','interview','offer','hired','rejected']),
  tags: z.array(z.string()),
  source: z.string().optional(),
  notes: z.string().optional(),
  resume: z.object({
    url: z.string().optional(),
    name: z.string().optional(),
    mime: z.string().optional(),
    size: z.number().optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});
export type Candidate = z.infer<typeof CandidateSchema>;

export const CandidateListSchema = z.object({
  items: z.array(CandidateSchema),
  total: z.number()
});
export type CandidateList = z.infer<typeof CandidateListSchema>;
