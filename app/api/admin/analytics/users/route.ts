import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'admin@brokenomore.in';

async function verifyAdmin(request: NextRequest): Promise<{ user: any } | { error: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }

  return { user };
}

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '90d';

    // Calculate date range
    const now = new Date();
    let daysBack = 90;
    if (period === '7d') daysBack = 7;
    else if (period === '30d') daysBack = 30;
    else if (period === '90d') daysBack = 90;
    else if (period === '1y') daysBack = 365;

    const startDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    // Fetch users in date range
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch user data' },
        { status: 500 }
      );
    }

    // Get total users count at start of period
    const { count: initialCount } = await supabaseAdmin
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .lt('created_at', startDate.toISOString());

    // Group by date
    const usersByDate: { [key: string]: { new_users: number; total_users: number } } = {};
    let runningTotal = initialCount || 0;

    users?.forEach((user) => {
      const date = new Date(user.created_at).toISOString().split('T')[0];
      if (!usersByDate[date]) {
        usersByDate[date] = { new_users: 0, total_users: runningTotal };
      }
      usersByDate[date].new_users += 1;
      runningTotal += 1;
      usersByDate[date].total_users = runningTotal;
    });

    // Convert to array format
    const userGrowthData = Object.entries(usersByDate)
      .map(([date, data]) => ({
        date,
        new_users: data.new_users,
        total_users: data.total_users,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: userGrowthData,
      period,
      totalNewUsers: userGrowthData.reduce((sum, item) => sum + item.new_users, 0),
      currentTotalUsers: runningTotal,
    });
  } catch (error: any) {
    console.error('Error fetching user analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user analytics' },
      { status: 500 }
    );
  }
}
