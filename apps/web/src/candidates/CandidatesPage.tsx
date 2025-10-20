import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchCandidates, createCandidate } from './api';
import Card from '../components/Card';
import CandidateForm from './CandidateForm';

export default function CandidatesPage() {
  const qc = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey: ['candidates'], queryFn: fetchCandidates });
  const createMut = useMutation({ mutationFn: createCandidate, onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }) });

  return (
    <div className="space-y-4">
      <Card>
        <h2 className="font-semibold mb-3">Nuevo candidato (manual)</h2>
        <CandidateForm onCreate={async (p)=>createMut.mutateAsync(p)} />
      </Card>

      <Card>
        <h2 className="font-semibold mb-3">Listado</h2>
        {isLoading && <div>Cargando…</div>}
        {error && <div>Error al cargar.</div>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left border-b">
              <th className="py-2">Nombre</th><th>Email</th><th>Etapa</th><th>Fuente</th><th>CV</th>
            </tr></thead>
            <tbody>
              {data?.items.map((c)=>(
                <tr key={c.id} className="border-b last:border-0">
                  <td className="py-2">{c.firstName} {c.lastName}</td>
                  <td>{c.email}</td>
                  <td className="capitalize">{c.stage}</td>
                  <td>{c.source ?? <span className="opacity-60">—</span>}</td>
                  <td>{c.resume?.url ? <a className="underline" href={c.resume.url} target="_blank" rel="noreferrer">Ver CV</a> : <span className="opacity-60">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
