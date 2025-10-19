import { getCookie } from './csrf';

const API = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4000';

// Header que el backend espera (env.CSRF_HEADER_NAME)
const CSRF_HEADER = 'x-csrf-token';
// Nombre de cookie que el backend setea (env.CSRF_COOKIE_NAME)
const CSRF_COOKIE = 'csrf_token';

/**
 * fetcher que:
 * - Incluye credentials (cookies).
 * - Para métodos mutantes, envía x-csrf-token con el valor de la cookie csrf_token.
 */
export async function apiFetch(input: string, init: RequestInit = {}) {
  const url = input.startsWith('http') ? input : `${API}${input}`;

  const method = (init.method ?? 'GET').toUpperCase();
  const isMutating = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const headers = new Headers(init.headers || {});
  headers.set('Accept', 'application/json');

  if (isMutating) {
    const csrf = getCookie(CSRF_COOKIE);
    if (csrf) headers.set(CSRF_HEADER, csrf);
  }

  // si mandás JSON
  if (!headers.has('Content-Type') && init.body && typeof init.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, {
    credentials: 'include',
    ...init,
    headers,
  });

  if (!res.ok) {
    // Intentamos parsear error JSON; lanzamos para que React Query lo capture
    let err: unknown;
    try {
      err = await res.json();
    } catch {
      err = { error: { code: `HTTP_${res.status}`, message: res.statusText } };
    }
    throw err;
  }

  // si no hay cuerpo, devolvemos void
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}
