import type { Schema } from 'mongoose';

/**
 * Plugin multi-tenant:
 * - Asegura campo orgId requerido e indexado.
 * - Inyecta filtro { orgId } en queries (find/update/delete) si viene options.tenant.orgId.
 * - En save, setea orgId desde doc.$locals.tenant.orgId si no está.
 *
 * Uso:
 * schema.plugin(multiTenantPlugin)
 * Model.find({}, null, { tenant: { orgId } })
 * const doc = new Model(data); doc.$locals = { tenant: { orgId } }; await doc.save();
 */
export function multiTenantPlugin(schema: Schema) {
  // Asegurar orgId en el schema si no estuviera
  if (!schema.path('orgId')) {
    schema.add({ orgId: { type: String, required: true, index: true } });
  }

  // Helper para inyectar { orgId } en queries (find/update/delete)
  const withOrgFilter = (hookName: string) => {
    schema.pre(hookName as any, function (this: any, next) {
      // Mongoose Query expone .options o getOptions según versión
      const orgId =
        (typeof this.getOptions === 'function' ? this.getOptions()?.tenant?.orgId : undefined) ??
        this.options?.tenant?.orgId;

      if (orgId) {
        const current = typeof this.getFilter === 'function' ? this.getFilter() : this._conditions ?? {};
        if (!current.orgId) {
          if (typeof this.setQuery === 'function') {
            this.setQuery({ ...current, orgId });
          } else {
            // fallback
            this._conditions = { ...current, orgId };
          }
        }
      }
      next();
    });
  };

  ['find', 'findOne', 'findOneAndUpdate', 'updateMany', 'updateOne', 'deleteMany', 'deleteOne'].forEach(
    withOrgFilter,
  );

  // En save, tomar orgId desde $locals.tenant.orgId si no existe aún
  schema.pre('save', function (this: any, next) {
    const orgId = this?.$locals?.tenant?.orgId;
    if (orgId && !this.orgId) this.orgId = orgId;
    next();
  });
}
