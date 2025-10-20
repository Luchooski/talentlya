import { z } from 'zod';

export const CandidateCreateInputSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
  phone:     z.string().optional(),
  stage:     z.enum(['applied','screening','interview','offer','hired','rejected']).optional(),
  tags:      z.array(z.string()).default([]),
  source:    z.string().optional(),
  notes:     z.string().optional(),
});
export type CandidateCreateInput = z.infer<typeof CandidateCreateInputSchema>;

export const CandidateUpdateInputSchema = CandidateCreateInputSchema.partial();
export type CandidateUpdateInput = z.infer<typeof CandidateUpdateInputSchema>;

export const CandidateOutputSchema = z.object({
  id:        z.string(),
  firstName: z.string(),
  lastName:  z.string(),
  email:     z.string().email(),
  phone:     z.string().optional(),
  stage:     z.enum(['applied','screening','interview','offer','hired','rejected']),
  tags:      z.array(z.string()),
  source:    z.string().optional(),
  notes:     z.string().optional(),
  resume:    z.object({
    url: z.string().optional(), name: z.string().optional(), mime: z.string().optional(), size: z.number().optional()
  }).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CandidateOutput = z.infer<typeof CandidateOutputSchema>;

export const CandidateListOutputSchema = z.object({
  items: z.array(CandidateOutputSchema),
  total: z.number(),
});
export type CandidateListOutput = z.infer<typeof CandidateListOutputSchema>;

// multipart (archivo + campos mínimos)
export const CandidateUploadCVInputSchema = z.object({
  firstName: z.string().min(1),
  lastName:  z.string().min(1),
  email:     z.string().email(),
});
export type CandidateUploadCVInput = z.infer<typeof CandidateUploadCVInputSchema>;
