import { auth } from './firebase';

const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || 'https://lqtwchfquemarmzanzqt.supabase.co').replace(/\/$/, '');
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Calls Supabase PostgREST with the current Firebase ID token.
 * Enable Firebase as a third-party auth provider in the Supabase dashboard
 * so Supabase can validate the token and apply RLS policies.
 */
export async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const user = auth.currentUser;
  if (!user) throw new Error('Debes iniciar sesión para acceder a los datos en la nube.');
  if (!SUPABASE_ANON_KEY) {
    throw new Error('Falta VITE_SUPABASE_ANON_KEY en las variables de entorno.');
  }

  const firebaseToken = await user.getIdToken();
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${firebaseToken}`,
      'Content-Type': 'application/json',
      ...(init.body ? { Prefer: 'resolution=merge-duplicates,return=minimal' } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    // Avoid echoing response bodies that may contain provider details.
    throw new Error(`Supabase respondió con HTTP ${response.status}. Verifica la integración Firebase y las políticas RLS.`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
