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

    // Fetch completed purchases in date range
    const { data: purchases, error: purchasesError } = await supabaseAdmin
      .from('credit_purchases')
      .select('amount_paid_paise, created_at')
      .eq('payment_status', 'completed')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true });

    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
      return NextResponse.json(
        { error: 'Failed to fetch revenue data' },
        { status: 500 }
      );
    }

    // Group by date
    const revenueByDate: { [key: string]: { revenue: number; subscriptions: number } } = {};

    purchases?.forEach((purchase) => {
      const date = new Date(purchase.created_at).toISOString().split('T')[0];
      if (!revenueByDate[date]) {
        revenueByDate[date] = { revenue: 0, subscriptions: 1 };
      }
      revenueByDate[date].revenue += purchase.amount_paid_paise || 0;
      revenueByDate[date].subscriptions += 1;
    });

    // Convert to array format
    const revenueData = Object.entries(revenueByDate)
      .map(([date, data]) => ({
        date,
        revenue: Math.round(data.revenue / 100), // Convert paise to rupees
        subscriptions: data.subscriptions,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      data: revenueData,
      period,
      totalRevenue: revenueData.reduce((sum, item) => sum + item.revenue, 0),
      totalSubscriptions: revenueData.reduce((sum, item) => sum + item.subscriptions, 0),
    });
  } catch (error: any) {
    console.error('Error fetching revenue analytics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch revenue analytics' },
      { status: 500 }
    );
  }
}
