import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdmin, dailySeries, daysAgo, pctChange } from '@/lib/admin/server';

const PERIODS: Record<string, number> = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  try {
    const periodParam = request.nextUrl.searchParams.get('period') || '30d';
    const period = periodParam in PERIODS ? periodParam : '30d';
    const days = PERIODS[period];

    const start = daysAgo(days - 1);
    const prevStart = daysAgo(days * 2 - 1);

    const [inPeriod, before, prevCount] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('created_at')
        .gte('created_at', start.toISOString())
        .order('created_at', { ascending: true })
        .limit(100000),
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .lt('created_at', start.toISOString()),
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', prevStart.toISOString())
        .lt('created_at', start.toISOString()),
    ]);

    if (inPeriod.error) {
      console.error('Error fetching users:', inPeriod.error);
      return NextResponse.json({ error: 'Failed to fetch user data' }, { status: 500 });
    }

    const daily = dailySeries((inPeriod.data || []).map((u) => u.created_at), start);
    let running = before.count || 0;
    const data = daily.map((d) => {
      running += d.count;
      return { date: d.date, new_users: d.count, total_users: running };
    });

    const newUsers = inPeriod.data?.length || 0;
    const peak = data.reduce((best, d) => (d.new_users > best.new_users ? d : best), data[0] ?? { date: '', new_users: 0 });

    return NextResponse.json({
      period,
      data,
      newUsers,
      change: pctChange(newUsers, prevCount.count || 0),
      avgPerDay: Math.round((newUsers / days) * 10) / 10,
      peakDay: peak.new_users > 0 ? { date: peak.date, count: peak.new_users } : null,
      totalUsers: running,
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch user analytics' }, { status: 500 });
  }
}
