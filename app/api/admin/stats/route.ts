import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdmin, dailySeries, daysAgo, pctChange } from '@/lib/admin/server';

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  try {
    const now = new Date();
    const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const d7 = daysAgo(7);
    const d30 = daysAgo(30);
    const d60 = daysAgo(60);

    // Resolves to null when the query fails (e.g. the table doesn't exist yet).
    const tryCount = (q: PromiseLike<{ count: number | null; error: unknown }>) =>
      Promise.resolve(q).then((r) => {
        if (r.error) console.error('[admin/stats]', r.error);
        return r.error ? null : r.count || 0;
      });
    const count = (q: PromiseLike<{ count: number | null; error: unknown }>) => tryCount(q).then((n) => n ?? 0);

    const usersHead = () => supabaseAdmin.from('user_profiles').select('id', { count: 'exact', head: true });
    const offersHead = () => supabaseAdmin.from('admin_offers').select('id', { count: 'exact', head: true });

    const [totalUsers, newToday, new7d, new30d, prev30d, totalOffers, liveOffers, recent] = await Promise.all([
      count(usersHead()),
      count(usersHead().gte('created_at', startOfToday.toISOString())),
      count(usersHead().gte('created_at', d7.toISOString())),
      count(usersHead().gte('created_at', d30.toISOString())),
      count(usersHead().gte('created_at', d60.toISOString()).lt('created_at', d30.toISOString())),
      tryCount(offersHead()),
      tryCount(offersHead().eq('status', 'active').eq('is_enabled', true)),
      supabaseAdmin
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', daysAgo(29).toISOString())
        .order('created_at', { ascending: true }),
    ]);

    if (recent.error) console.error('[admin/stats] series', recent.error);

    return NextResponse.json({
      totalUsers,
      newToday,
      new7d,
      new30d,
      userGrowth: pctChange(new30d, prev30d),
      totalOffers,
      liveOffers,
      signups30d: dailySeries((recent.data || []).map((r) => r.created_at), daysAgo(29)),
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
  }
}
