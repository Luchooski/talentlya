import type { FastifyReply, FastifyRequest } from 'fastify';
import { EmployeeCreateInputSchema, EmployeeUpdateInputSchema, EmployeeListOutputSchema, EmployeeOutputSchema } from './employee.dto';
import { createEmployee, deleteEmployee, listEmployees, updateEmployee } from './employee.service';

export async function listHandler(req: FastifyRequest, reply: FastifyReply) {
  const orgId = req.user!.orgId;
  const skip = Number((req.query as any).skip ?? 0);
  const limit = Math.min(100, Number((req.query as any).limit ?? 20));
  const data = await listEmployees(orgId, skip, limit);
  return reply.send(EmployeeListOutputSchema.parse(data));
}

export async function createHandler(req: FastifyRequest, reply: FastifyReply) {
  const orgId = req.user!.orgId;
  const parse = EmployeeCreateInputSchema.safeParse(req.body);
  if (!parse.success) {
    return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Datos inválidos', details: parse.error.issues } });
  }
  const item = await createEmployee(orgId, parse.data);
  return reply.status(201).send(EmployeeOutputSchema.parse(item));
}

export async function updateHandler(req: FastifyRequest, reply: FastifyReply) {
  const orgId = req.user!.orgId;
  const { id } = req.params as { id: string };
  const parse = EmployeeUpdateInputSchema.safeParse(req.body);
  if (!parse.success) {
    return reply.status(400).send({ error: { code: 'BAD_REQUEST', message: 'Datos inválidos', details: parse.error.issues } });
  }
  const item = await updateEmployee(orgId, id, parse.data);
  if (!item) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Empleado no encontrado' } });
  return reply.send(EmployeeOutputSchema.parse(item));
}

export async function deleteHandler(req: FastifyRequest, reply: FastifyReply) {
  const orgId = req.user!.orgId;
  const { id } = req.params as { id: string };
  const ok = await deleteEmployee(orgId, id);
  if (!ok) return reply.status(404).send({ error: { code: 'NOT_FOUND', message: 'Empleado no encontrado' } });
  return reply.send({ ok: true });
}
