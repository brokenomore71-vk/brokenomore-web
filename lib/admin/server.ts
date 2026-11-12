import { NextRequest, NextResponse } from 'next/server';
import { createClient, type User } from '@supabase/supabase-js';

export const ADMIN_EMAIL = 'admin@brokenomore.in';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Server-only Supabase client. Uses the service role key when available. */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

/**
 * Verifies the bearer token belongs to the admin account.
 * Returns either the admin user or a ready-to-return error response.
 */
export async function verifyAdmin(
  request: NextRequest
): Promise<{ user: User } | { error: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.slice('Bearer '.length);
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return {
      error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }),
    };
  }

  return { user };
}

/** Strips characters that have meaning inside a PostgREST `or()` filter. */
export function sanitizeSearch(input: string): string {
  return input.replace(/[,()*%\\]/g, ' ').trim().slice(0, 100);
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** YYYY-MM-DD in UTC. */
export function dayKey(d: Date | string): string {
  return new Date(d).toISOString().slice(0, 10);
}

/** Buckets timestamps into a contiguous day-by-day series (zero-filled). */
export function dailySeries(timestamps: string[], start: Date, end: Date = new Date()) {
  const counts = new Map<string, number>();
  for (const ts of timestamps) {
    const k = dayKey(ts);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const series: { date: string; count: number }[] = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  while (cursor <= end) {
    const k = dayKey(cursor);
    series.push({ date: k, count: counts.get(k) || 0 });
    cursor.setTime(cursor.getTime() + DAY_MS);
  }
  return series;
}

export function daysAgo(n: number): Date {
  return new Date(Date.now() - n * DAY_MS);
}

export function pctChange(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 1000) / 10;
  return current > 0 ? 100 : 0;
}
