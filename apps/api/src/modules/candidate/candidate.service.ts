import { Candidate } from './candidate.model';
import type { CandidateCreateInput, CandidateUpdateInput } from './candidate.dto';

const toOut = (c: any) => ({
  firstName: c.firstName, lastName: c.lastName, email: c.email, phone: c.phone,
  stage: c.stage, tags: c.tags, source: c.source, notes: c.notes,
  resume: c.resume ? { url: c.resume.url, name: c.resume.name, mime: c.resume.mime, size: c.resume.size } : undefined,
  createdAt: c.createdAt.toISOString(), updatedAt: c.updatedAt.toISOString()
});

export async function listCandidates(tenantId?: string, skip = 0, limit = 20) {
  const q: any = tenantId ? { tenantId } : {};
  const [items, total] = await Promise.all([
    Candidate.find(q).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Candidate.countDocuments(q)
  ]);
  return { items: items.map((c) => ({ id: c._id.toString(), ...toOut(c) })), total };
}

export async function createCandidate(tenantId: string | undefined, data: CandidateCreateInput) {
  const doc = await Candidate.create({ ...data, ...(tenantId ? { tenantId } : {}) });
  const c = await Candidate.findById(doc._id).lean();
  return { id: doc._id.toString(), ...toOut(c) };
}

export async function getCandidate(tenantId: string | undefined, id: string) {
  const q: any = { _id: id }; if (tenantId) q.tenantId = tenantId;
  const c = await Candidate.findOne(q).lean();
  return c ? { id: c._id.toString(), ...toOut(c) } : null;
}

export async function updateCandidate(tenantId: string | undefined, id: string, data: CandidateUpdateInput) {
  const q: any = { _id: id }; if (tenantId) q.tenantId = tenantId;
  const c = await Candidate.findOneAndUpdate(q, data, { new: true }).lean();
  return c ? { id: c._id.toString(), ...toOut(c) } : null;
}

export async function removeCandidate(tenantId: string | undefined, id: string) {
  const q: any = { _id: id }; if (tenantId) q.tenantId = tenantId;
  const res = await Candidate.deleteOne(q);
  return res.deletedCount === 1;
}

export async function createCandidateFromUpload(
  tenantId: string | undefined,
  data: CandidateCreateInput,
  file: { url: string; filename: string; mimetype: string; size: number },
) {
  const doc = await Candidate.create({
    ...data, ...(tenantId ? { tenantId } : {}),
    resume: { url: file.url, name: file.filename, mime: file.mimetype, size: file.size },
  });
  const c = await Candidate.findById(doc._id).lean();
  return { id: doc._id.toString(), ...toOut(c) };
}
