'use client';

import { createClient, type Session } from '@supabase/supabase-js';

// The admin's own Supabase client. Its session lives under a separate storage key, so it
// never mixes with anything else on the site. Sign-in only: there is no sign-up anywhere here.
export const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      storageKey: 'bnm-admin-session',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
    },
  }
);

export const isAdminSession = (session: Session | null) =>
  session?.user?.app_metadata?.role === 'admin';

const API_URL = (process.env.NEXT_PUBLIC_ADMIN_API_URL || '').replace(/\/$/, '');

export class AdminApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

/** GET from the admin backend on Render with the admin's access token. */
export async function adminGet<T>(path: string): Promise<T> {
  const { data } = await adminSupabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AdminApiError('Not signed in', 401);

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
    });
  } catch {
    // Render's free tier sleeps when idle; the first request can take ~30-50s or fail.
    throw new AdminApiError('Could not reach the admin server. It may be waking up, so try again in a moment.', 0);
  }

  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminApiError(body.error || `Request failed (${res.status})`, res.status);
  return body as T;
}
