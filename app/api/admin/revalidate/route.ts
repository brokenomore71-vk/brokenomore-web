// Called by the admin panel right after it changes website content (FAQs), so the next visit shows the change
// instead of waiting for the page's once-a-minute refresh. Only a signed-in admin (app_metadata.role "admin",
// the same rule as the rest of /admin) may call it; all it does is mark the cached homepage as stale.

import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const token = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '').trim();
  const url = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  if (!token || !url || !key) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });

  // Ask Supabase who the token belongs to (it checks the signature and expiry)
  const res = await fetch(`${url}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: key },
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  if (!res?.ok) return NextResponse.json({ error: 'Sign in to continue' }, { status: 401 });
  const user = await res.json().catch(() => null);
  if (user?.app_metadata?.role !== 'admin') return NextResponse.json({ error: 'Admins only' }, { status: 403 });

  revalidatePath('/');
  return NextResponse.json({ revalidated: true });
}
