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

    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '10');
    const maxLimit = Math.min(limit, 50); // Cap at 50 for performance

    // Fetch recent activities in parallel
    const [
      { data: recentSubscriptions, error: subsError },
      { data: recentPurchases, error: purchasesError },
      { data: recentSignups, error: signupsError }
    ] = await Promise.all([
      // Recent subscriptions
      supabaseAdmin
        .from('subscriptions')
        .select('id, user_id, plan, status, created_at')
        .order('created_at', { ascending: false })
        .limit(maxLimit),
      
      // Recent purchases
      supabaseAdmin
        .from('credit_purchases')
        .select('id, user_id, payment_status, amount_paid_paise, created_at')
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(maxLimit),
      
      // Recent signups
      supabaseAdmin
        .from('user_profiles')
        .select('id, email, full_name, created_at')
        .order('created_at', { ascending: false })
        .limit(maxLimit)
    ]);

    // Get unique user IDs to fetch user profiles
    const userIds = new Set<string>();
    recentSubscriptions?.forEach((sub: any) => userIds.add(sub.user_id));
    recentPurchases?.forEach((purchase: any) => userIds.add(purchase.user_id));
    
    // Fetch user profiles for subscriptions and purchases
    let userProfilesMap = new Map<string, { email: string; full_name?: string }>();
    if (userIds.size > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', Array.from(userIds));
      
      profiles?.forEach((profile: any) => {
        userProfilesMap.set(profile.id, {
          email: profile.email || 'Unknown',
          full_name: profile.full_name || undefined,
        });
      });
    }

    if (subsError) console.error('Error fetching subscriptions:', subsError);
    if (purchasesError) console.error('Error fetching purchases:', purchasesError);
    if (signupsError) console.error('Error fetching signups:', signupsError);

    // Combine and format activities
    const activities: Array<{
      type: 'subscription' | 'purchase' | 'signup';
      id: string;
      user_email: string;
      user_name?: string;
      description: string;
      timestamp: string;
      metadata?: any;
    }> = [];

    // Add subscription activities
    if (recentSubscriptions) {
      recentSubscriptions.forEach((sub: any) => {
        const profile = userProfilesMap.get(sub.user_id);
        activities.push({
          type: 'subscription',
          id: sub.id,
          user_email: profile?.email || 'Unknown',
          user_name: profile?.full_name,
          description: `${sub.plan === 'pro' ? 'Pro' : 'Free'} plan subscription ${sub.status}`,
          timestamp: sub.created_at,
          metadata: {
            plan: sub.plan,
            status: sub.status,
          },
        });
      });
    }

    // Add purchase activities
    if (recentPurchases) {
      recentPurchases.forEach((purchase: any) => {
        const profile = userProfilesMap.get(purchase.user_id);
        const amountPaid = purchase.amount_paid_paise || 0;
        activities.push({
          type: 'purchase',
          id: purchase.id,
          user_email: profile?.email || 'Unknown',
          user_name: profile?.full_name,
          description: `Purchase completed - ₹${Math.round(amountPaid / 100)}`,
          timestamp: purchase.created_at,
          metadata: {
            amount: amountPaid,
            amountRupees: Math.round(amountPaid / 100),
          },
        });
      });
    }

    // Add signup activities
    if (recentSignups) {
      recentSignups.forEach((user: any) => {
        activities.push({
          type: 'signup',
          id: user.id,
          user_email: user.email || 'Unknown',
          user_name: user.full_name,
          description: 'New user signed up',
          timestamp: user.created_at,
        });
      });
    }

    // Sort by timestamp (most recent first) and limit
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    const limitedActivities = activities.slice(0, maxLimit);

    return NextResponse.json({
      activities: limitedActivities,
      count: limitedActivities.length,
    });
  } catch (error: any) {
    console.error('Error fetching admin activity:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
