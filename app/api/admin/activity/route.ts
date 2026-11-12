import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdmin } from '@/lib/admin/server';

type Activity = {
  type: 'signup' | 'offer';
  id: string;
  title: string;
  subtitle: string;
  avatar_url?: string | null;
  timestamp: string;
};

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  try {
    const limit = Math.min(Math.max(parseInt(request.nextUrl.searchParams.get('limit') || '10') || 10, 1), 50);

    const [signups, offers] = await Promise.all([
      supabaseAdmin
        .from('user_profiles')
        .select('id, email, full_name, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
      supabaseAdmin
        .from('admin_offers')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(limit),
    ]);

    if (signups.error) console.error('[admin/activity] signups', signups.error);
    if (offers.error) console.error('[admin/activity] offers', offers.error);

    const activities: Activity[] = [
      ...(signups.data || []).map((u) => ({
        type: 'signup' as const,
        id: u.id,
        title: u.full_name || u.email || 'New user',
        subtitle: u.full_name ? `Joined · ${u.email ?? ''}` : 'Joined BrokeNoMore',
        avatar_url: u.avatar_url,
        timestamp: u.created_at,
      })),
      ...(offers.data || []).map((o) => ({
        type: 'offer' as const,
        id: o.id,
        title: o.name,
        subtitle: 'Offer added',
        timestamp: o.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({ activities });
  } catch (error) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
