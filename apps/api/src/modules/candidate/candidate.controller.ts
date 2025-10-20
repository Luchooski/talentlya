import type { FastifyPluginAsync } from 'fastify';
import multipart from '@fastify/multipart';
import { z } from 'zod';
import { ok, error } from '../../lib/http'; // si no lo tenés, abajo te doy uno básico
import {
  CandidateCreateInputSchema,
  CandidateUpdateInputSchema,
  CandidateListOutputSchema,
  CandidateOutputSchema,
  CandidateUploadCVInputSchema
} from './candidate.dto';
import {
  listCandidates, createCandidate, getCandidate, updateCandidate, removeCandidate, createCandidateFromUpload
} from './candidate.service';
import { saveBuffer } from '../../config/storage';

export const candidateController: FastifyPluginAsync = async (fastify) => {
  fastify.register(multipart, { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }); // 10MB

  // List
  fastify.get('/', async (req, reply) => {
    const tenantId = (req.headers['x-tenant-id'] as string | undefined); // si usás multitenant
    const q = z.object({
      skip: z.coerce.number().min(0).default(0),
      limit: z.coerce.number().min(1).max(100).default(20)
    }).parse(req.query);

    const out = await listCandidates(tenantId, q.skip, q.limit);
    return reply.send(ok(CandidateListOutputSchema.parse(out)));
  });

  // Create manual
  fastify.post('/', async (req, reply) => {
    const tenantId = (req.headers['x-tenant-id'] as string | undefined);
    const body = CandidateCreateInputSchema.parse(req.body);
    const out = await createCandidate(tenantId, body);
    return reply.code(201).send(ok(CandidateOutputSchema.parse(out)));
  });

  // Upload CV (multipart)
  fastify.post('/upload-cv', async (req, reply) => {
    const tenantId = (req.headers['x-tenant-id'] as string | undefined);
    const parts = req.parts();
    const fields: Record<string, string> = {};
    let fileBuf: Buffer | null = null;
    let fileName = ''; let fileMime = ''; let fileSize = 0;

    for await (const part of parts) {
      if (part.type === 'file') {
        fileName = part.filename || 'cv';
        fileMime  = part.mimetype || 'application/octet-stream';
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        fileBuf  = buf; fileSize = buf.length;
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }

    const body = CandidateUploadCVInputSchema.parse(fields);
    if (!fileBuf) return reply.code(400).send(error('NO_FILE', 'CV file is required'));

    const safeName = fileName.replace(/[^\w.\-]+/g, '_');
    const key = `${tenantId || 'public'}/${Date.now()}_${safeName}`;
    const { url } = await saveBuffer(key, fileMime, fileBuf);

    const out = await createCandidateFromUpload(tenantId, body, {
      url, filename: fileName, mimetype: fileMime, size: fileSize
    });

    return reply.code(201).send(ok(CandidateOutputSchema.parse(out)));
  });

  // Get by id
  fastify.get('/:id', async (req, reply) => {
    const tenantId = (req.headers['x-tenant-id'] as string | undefined);
    const { id } = z.object({ id: z.string().length(24) }).parse(req.params);
    const found = await getCandidate(tenantId, id);
    if (!found) return reply.code(404).send(error('NOT_FOUND', 'Candidate not found'));
    return reply.send(ok(CandidateOutputSchema.parse(found)));
  });

  // Patch
  fastify.patch('/:id', async (req, reply) => {
    const tenantId = (req.headers['x-tenant-id'] as string | undefined);
    const { id } = z.object({ id: z.string().length(24) }).parse(req.params);
    const body = CandidateUpdateInputSchema.parse(req.body);
    const updated = await updateCandidate(tenantId, id, body);
    if (!updated) return reply.code(404).send(error('NOT_FOUND', 'Candidate not found'));
    return reply.send(ok(CandidateOutputSchema.parse(updated)));
  });

  // Delete
  fastify.delete('/:id', async (req, reply) => {
    const tenantId = (req.headers['x-tenant-id'] as string | undefined);
    const { id } = z.object({ id: z.string().length(24) }).parse(req.params);
    const okDel = await removeCandidate(tenantId, id);
    if (!okDel) return reply.code(404).send(error('NOT_FOUND', 'Candidate not found'));
    return reply.code(204).send();
  });
};
