import { Organization } from './org.model';

export async function findOrCreateOrgByName(name: string) {
  const found = await Organization.findOne({ name }).lean();
  if (found) return found;
  const created = await Organization.create({ name });
  return created.toObject();
}
