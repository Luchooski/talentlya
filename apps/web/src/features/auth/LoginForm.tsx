import { type FormEvent, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';

export default function LoginForm() {
  const qc = useQueryClient();
  const [email, setEmail] = useState('demo@example.com');
  const [password, setPassword] = useState('demo1234');
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMsg(null);
    try {
      // /auth/login está EXCLUIDO del CSRF, así que aunque no exista cookie aún, funciona
      await apiFetch('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setMsg('¡Login OK!');
      await qc.invalidateQueries({ queryKey: ['me'] });
    } catch (err: any) {
      setMsg(err?.error?.message || 'Error de login');
    }
  }

  return (
    <form className="flex flex-col gap-3 max-w-sm mx-auto" onSubmit={submit}>
      <input
        className="border rounded p-2"
        placeholder="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        aria-label="email"
      />
      <input
        className="border rounded p-2"
        placeholder="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        aria-label="password"
      />
      <button className="rounded bg-black text-white dark:bg-white dark:text-black py-2">Entrar</button>
      {msg && <p className="text-sm">{msg}</p>}
    </form>
  );
}
