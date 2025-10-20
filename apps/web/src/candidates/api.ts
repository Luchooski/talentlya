// Ajusta la ruta de import según dónde tengas apiFetch:
import { apiFetch } from '../lib/api'; // <-- si tu apiFetch está en otra ruta, cámbialo

import { CandidateListSchema, CandidateSchema } from './types';

export async function fetchCandidates() {
  const res = await apiFetch('/api/v1/candidates');
  return CandidateListSchema.parse(res.data);
}

export async function createCandidate(payload: {
  firstName: string; lastName: string; email: string;
  phone?: string; tags?: string[]; source?: string; notes?: string;
}) {
  const res = await apiFetch('/api/v1/candidates', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  return CandidateSchema.parse(res.data);
}

export async function uploadCV(payload: {
  firstName: string; lastName: string; email: string; file: File;
}) {
  const fd = new FormData();
  fd.append('firstName', payload.firstName);
  fd.append('lastName',  payload.lastName);
  fd.append('email',     payload.email);
  fd.append('file',      payload.file);
  // apiFetch setea headers Accept y CSRF en mutaciones; NO seteamos Content-Type aquí
  return CandidateSchema.parse((await apiFetch('/api/v1/candidates/upload-cv', {
    method: 'POST',
    body: fd
  })).data);
}
