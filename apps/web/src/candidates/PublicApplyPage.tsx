import { useState, useEffect } from 'react';
import { uploadCV, createCandidate } from './api';
import Card from '../components/Card';
import { apiFetch } from '../lib/api'; // para GET inicial de CSRF si hiciera falta

export default function PublicApplyPage() {
  const [mode, setMode] = useState<'file'|'manual'>('file');
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [file, setFile] = useState<File | null>(null);
  const [msg, setMsg] = useState<string>('');

  // Asegura cookie CSRF visitando un GET primero (tu middleware podría setearla en cualquier GET)
  useEffect(()=>{ void apiFetch('/api/v1/health'); }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault(); setMsg('');
    if (mode === 'file') {
      if (!file) { setMsg('Adjuntá un archivo.'); return; }
      await uploadCV({ firstName: form.firstName, lastName: form.lastName, email: form.email, file });
      setMsg('¡Postulación enviada!'); setFile(null);
    } else {
      await createCandidate({ firstName: form.firstName, lastName: form.lastName, email: form.email, phone: form.phone || undefined });
      setMsg('¡Postulación cargada!');
    }
    setForm({ firstName: '', lastName: '', email: '', phone: '' });
  }

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <h1 className="text-xl font-semibold mb-4">Postulá tu CV</h1>
        <div className="mb-4 flex gap-2">
          <button type="button" onClick={()=>setMode('file')} className={`px-3 py-1 rounded ${mode==='file'?'bg-black text-white':'border'}`}>Subir archivo</button>
          <button type="button" onClick={()=>setMode('manual')} className={`px-3 py-1 rounded ${mode==='manual'?'bg-black text-white':'border'}`}>Completar manualmente</button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className="block text-sm">Nombre</label>
              <input required className="border rounded px-2 py-1 w-full" value={form.firstName} onChange={(e)=>setForm({...form,firstName:e.target.value})}/></div>
            <div><label className="block text-sm">Apellido</label>
              <input required className="border rounded px-2 py-1 w-full" value={form.lastName} onChange={(e)=>setForm({...form,lastName:e.target.value})}/></div>
          </div>
          <div><label className="block text-sm">Email</label>
            <input required type="email" className="border rounded px-2 py-1 w-full" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})}/></div>
          {mode === 'manual' ? (
            <div><label className="block text-sm">Teléfono (opcional)</label>
              <input className="border rounded px-2 py-1 w-full" value={form.phone} onChange={(e)=>setForm({...form,phone:e.target.value})}/></div>
          ) : (
            <div><label className="block text-sm">Archivo (PDF/DOC/DOCX)</label>
              <input required type="file" accept=".pdf,.doc,.docx,.txt" onChange={(e)=>setFile(e.target.files?.[0] ?? null)}/></div>
          )}
          <button className="px-3 py-2 rounded bg-black text-white">Enviar</button>
          {msg && <div className="text-green-600">{msg}</div>}
        </form>
      </Card>
    </div>
  );
}
