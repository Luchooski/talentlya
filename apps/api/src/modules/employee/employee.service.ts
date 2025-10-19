import { Employee } from './employee.model';

type AnyObj = Record<string, any>;

export async function listEmployees(orgId: string, skip = 0, limit = 20) {
  const [items, total] = await Promise.all([
    Employee.find({}, null, { tenant: { orgId } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean<AnyObj[]>(),
    Employee.countDocuments({}, { tenant: { orgId } }),
  ]);

  const mapped = (items ?? []).map((i) => ({
    ...i,
    _id: String((i as AnyObj)._id ?? ''), // ⬅️ asegura string
  }));

  return { items: mapped, total };
}

export async function createEmployee(orgId: string, data: AnyObj) {
  // Usamos save() con $locals.tenant para que el plugin aplique orgId en pre('save')
  const doc = new Employee(data);
  (doc as AnyObj).$locals = { ...(doc as AnyObj).$locals, tenant: { orgId } };
  await doc.save();
  const item = doc.toObject() as AnyObj;
  return { ...item, _id: String(item._id ?? '') };
}

export async function updateEmployee(orgId: string, id: string, data: AnyObj) {
  const updated = await Employee.findOneAndUpdate({ _id: id }, { $set: data }, { new: true, tenant: { orgId } })
    .lean<AnyObj | null>();
  return updated ? { ...updated, _id: String((updated as AnyObj)._id ?? '') } : null;
}

export async function deleteEmployee(orgId: string, id: string) {
  const r = await Employee.deleteOne({ _id: id }, { tenant: { orgId } });
  return r.deletedCount === 1;
}
