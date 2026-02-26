import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'admin@brokenomore.in';

// Helper function to verify admin
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
    // Verify admin access
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    // Calculate date ranges for current month and previous month
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    // Fetch all stats in parallel for better performance
    const [
      { count: totalUsersCount, error: usersError },
      { count: activeSubscriptionsCount, error: subscriptionsError },
      { data: currentMonthPurchases, error: purchasesError },
      { count: totalTransactionsCount, error: transactionsError },
      { data: previousMonthPurchases, error: prevMonthError }
    ] = await Promise.all([
      // Total users count
      supabaseAdmin
        .from('user_profiles')
        .select('id', { count: 'exact', head: true }),
      
      // Active subscriptions count
      supabaseAdmin
        .from('subscriptions')
        .select('id', { count: 'exact', head: true })
        .in('status', ['active', 'trialing']),
      
      // Current month (last 30 days) completed purchases for revenue calculation
      supabaseAdmin
        .from('credit_purchases')
        .select('amount_paid_paise')
        .eq('payment_status', 'completed')
        .gte('created_at', thirtyDaysAgo.toISOString()),
      
      // Total transactions count
      supabaseAdmin
        .from('credit_transactions')
        .select('id', { count: 'exact', head: true }),
      
      // Previous month purchases for comparison (30-60 days ago)
      supabaseAdmin
        .from('credit_purchases')
        .select('amount_paid_paise')
        .eq('payment_status', 'completed')
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString())
    ]);

    // Handle errors
    if (usersError) {
      console.error('Error fetching users:', usersError);
    }
    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
    }
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    }
    if (transactionsError) {
      console.error('Error fetching transactions:', transactionsError);
    }

    // Calculate totals
    const totalUsers = totalUsersCount || 0;
    const activeSubsCount = activeSubscriptionsCount || 0;
    
    // Calculate revenue in paise, then convert to rupees (current month = last 30 days)
    const totalRevenue = currentMonthPurchases?.reduce((sum, purchase) => sum + (purchase.amount_paid_paise || 0), 0) || 0;
    const previousMonthRevenue = previousMonthPurchases?.reduce((sum, purchase) => sum + (purchase.amount_paid_paise || 0), 0) || 0;
    
    // Calculate revenue change percentage
    const revenueChange = previousMonthRevenue > 0 
      ? ((totalRevenue - previousMonthRevenue) / previousMonthRevenue) * 100 
      : 0;

    const totalTransactions = totalTransactionsCount || 0;

    // Get user growth (users created in last 30 days)
    // Use the same thirtyDaysAgo and sixtyDaysAgo already defined above
    const { count: recentUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', thirtyDaysAgo.toISOString());

    const { count: previousUsers } = await supabaseAdmin
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', sixtyDaysAgo.toISOString())
      .lt('created_at', thirtyDaysAgo.toISOString());

    const recentUsersCount = recentUsers || 0;
    const previousUsersCount = previousUsers || 0;

    const userGrowth = previousUsersCount > 0
      ? ((recentUsersCount - previousUsersCount) / previousUsersCount) * 100
      : recentUsersCount > 0 ? 100 : 0;

    return NextResponse.json({
      totalUsers,
      activeSubscriptions: activeSubsCount,
      totalRevenue: totalRevenue, // in paise
      totalRevenueRupees: Math.round(totalRevenue / 100), // converted to rupees
      revenueChange: Math.round(revenueChange * 100) / 100, // rounded to 2 decimals
      totalTransactions,
      userGrowth: Math.round(userGrowth * 100) / 100,
    });
  } catch (error: any) {
    console.error('Error fetching admin stats:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
