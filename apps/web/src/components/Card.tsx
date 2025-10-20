import type { ReactNode } from 'react';
export default function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border p-4 shadow-sm">{children}</div>;
}
