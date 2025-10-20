import { useState } from 'react';

type Props = {
  onCreate: (p: { firstName: string; lastName: string; email: string; phone?: string; source?: string; notes?: string }) => Promise<void>;
};

export default function CandidateForm({ onCreate }: Props) {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', source: '', notes: '' });
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onCreate({
          firstName: form.firstName,
          lastName: form.lastName,
          email: form.email,
          phone: form.phone || undefined,
          source: form.source || undefined,
          notes: form.notes || undefined
        });
        setForm({ firstName: '', lastName: '', email: '', phone: '', source: '', notes: '' });
        setSubmitting(false);
      }}
    >
      <div><label className="block text-sm">Nombre</label>
        <input required className="border rounded px-2 py-1 w-full" value={form.firstName} onChange={(e)=>setForm({...form,firstName:e.target.value})}/></div>
      <div><label className="block text-sm">Apellido</label>
        <input required className="border rounded px-2 py-1 w-full" value={form.lastName} onChange={(e)=>setForm({...form,lastName:e.target.value})}/></div>
      <div className="sm:col-span-2"><label className="block text-sm">Email</label>
        <input required type="email" className="border rounded px-2 py-1 w-full" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></div>
      <div><label className="block text-sm">Teléfono</label>
        <input className="border rounded px-2 py-1 w-full" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></div>
      <div><label className="block text-sm">Fuente</label>
        <input className="border rounded px-2 py-1 w-full" value={form.source} onChange={(e)=>setForm({...form,source:e.target.value})}/></div>
      <div className="sm:col-span-2"><label className="block text-sm">Notas</label>
        <textarea className="border rounded px-2 py-1 w-full" value={form.notes} onChange={(e)=>setForm({...form,notes:e.target.value})}/></div>
      <div className="sm:col-span-2">
        <button disabled={submitting} className="px-3 py-2 rounded bg-black text-white">{submitting?'Guardando…':'Crear'}</button>
      </div>
    </form>
  );
}
