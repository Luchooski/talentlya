import { useQuery } from '@tanstack/react-query';
import LoginForm from './features/auth/LoginForm';

const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

type Me = { user: { _id: string; email: string; role: 'admin' | 'user' } };

export default function App() {
  const { data: me, refetch, isFetching } = useQuery<Me>({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/v1/auth/me`, { credentials: 'include' });
      if (!res.ok) throw new Error('Not logged');
      return res.json();
    },
    retry: false,
  });

  async function logout() {
    await fetch(`${API}/api/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    await refetch();
  }

  return (
    <div className="min-h-screen w-screen items-center justify-center bg-gray-100 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold">Talentlya</h1>

        {!me ? (
          <>
            <p className="opacity-80">Iniciá sesión para continuar.</p>
            <LoginForm />
          </>
        ) : (
          <div className="space-y-3">
            <p>
              Sesión: <b>{me.user.email}</b> ({me.user.role})
            </p>
            <div className="flex gap-3">
              <button
                className="rounded bg-black text-white dark:bg-white dark:text-black py-2 px-3"
                onClick={logout}
                disabled={isFetching}
              >
                Cerrar sesión
              </button>
              <button
                className="rounded border py-2 px-3"
                onClick={() => refetch()}
                disabled={isFetching}
              >
                Refrescar estado
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
