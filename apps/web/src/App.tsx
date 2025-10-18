import { useQuery } from '@tanstack/react-query';

const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

type Health = { status: string; uptime: number };

export default function App() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['health'],
    queryFn: async (): Promise<Health> => {
      const res = await fetch(`${API}/api/v1/health`, { credentials: 'include' });
      if (!res.ok) throw new Error('Network error');
      return res.json();
    },
    staleTime: 30_000,
  });

  return (
    <div className="flex w-screen h-screen items-center justify-center bg-gray-100 dark:bg-[#0f172a] text-gray-900 dark:text-gray-100">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold">Talentlya</h1>
        {isLoading && <p className="text-lg">Cargando estado…</p>}
        {isError && <p className="text-lg">Error al conectar con la API</p>}
        {data && (
          <p className="text-lg">
            Estado del servidor: <b>{data.status}</b> — Uptime: {Math.floor(data.uptime)}s
          </p>
        )}
      </div>
    </div>
  );
}
