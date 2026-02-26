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

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch metrics in parallel
    const [
      { data: currentPurchases, error: currentPurchasesError },
      { data: previousPurchases, error: previousPurchasesError },
      { data: currentSubscriptions, error: currentSubsError },
      { data: previousSubscriptions, error: previousSubsError },
      { data: totalUsers, error: usersError },
      { data: freePlanUsers, error: freeUsersError },
    ] = await Promise.all([
      // Current month revenue
      supabaseAdmin
        .from('credit_purchases')
        .select('amount_paid_paise')
        .eq('payment_status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Previous month revenue
      supabaseAdmin
        .from('credit_purchases')
        .select('amount_paid_paise')
        .eq('payment_status', 'completed')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),
      
      // Current month active subscriptions
      supabaseAdmin
        .from('subscriptions')
        .select('id')
        .in('status', ['active', 'trialing'])
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Previous month active subscriptions
      supabaseAdmin
        .from('subscriptions')
        .select('id')
        .in('status', ['active', 'trialing'])
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString()),
      
      // Total users
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Users who claimed free plan (approximation)
      supabaseAdmin
        .from('credit_transactions')
        .select('user_id', { count: 'exact', head: true })
        .eq('transaction_type', 'bonus')
        .ilike('description', '%Free Plan%'),
    ]);

    // Calculate revenue
    const currentRevenue = currentPurchases?.reduce((sum, p) => sum + (p.amount_paid_paise || 0), 0) || 0;
    const previousRevenue = previousPurchases?.reduce((sum, p) => sum + (p.amount_paid_paise || 0), 0) || 0;
    const revenueChange = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : currentRevenue > 0 ? 100 : 0;

    // Calculate subscription change
    const currentSubsCount = currentSubscriptions?.length || 0;
    const previousSubsCount = previousSubscriptions?.length || 0;
    const subscriptionChange = previousSubsCount > 0
      ? ((currentSubsCount - previousSubsCount) / previousSubsCount) * 100
      : currentSubsCount > 0 ? 100 : 0;

    // Calculate conversion rate (free to pro)
    const totalUsersCount = totalUsers?.length || 0;
    const freeUsersCount = freeUsersError ? 0 : (freeUsersError === null ? totalUsersCount : 0);
    const activeProSubs = currentSubsCount;
    const conversionRate = totalUsersCount > 0
      ? (activeProSubs / totalUsersCount) * 100
      : 0;

    // Calculate ARPU (Average Revenue Per User)
    const arpu = totalUsersCount > 0
      ? Math.round((currentRevenue / 100) / totalUsersCount) // Convert paise to rupees
      : 0;

    // Previous month ARPU for comparison
    const previousArpu = totalUsersCount > 0 && previousRevenue > 0
      ? Math.round((previousRevenue / 100) / (totalUsersCount - (currentSubsCount - previousSubsCount)))
      : 0;
    const arpuChange = previousArpu > 0
      ? ((arpu - previousArpu) / previousArpu) * 100
      : 0;

    return NextResponse.json({
      totalRevenue: Math.round(currentRevenue / 100), // in rupees
      revenueChange: Math.round(revenueChange * 100) / 100,
      activeSubscriptions: currentSubsCount,
      subscriptionChange: Math.round(subscriptionChange * 100) / 100,
      conversionRate: Math.round(conversionRate * 100) / 100,
      conversionChange: 0, // Would need historical data to calculate
      arpu: arpu,
      arpuChange: Math.round(arpuChange * 100) / 100,
    });
  } catch (error: any) {
    console.error('Error fetching metrics:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
