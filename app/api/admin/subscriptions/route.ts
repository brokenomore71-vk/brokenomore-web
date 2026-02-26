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
    const filter = searchParams.get('filter') || 'all';

    // Fetch all subscriptions (we'll filter by actual status later)
    // For 'active' and 'cancelled', we can optimize with DB filter, but for 'expired' 
    // we need to check all and calculate based on ends_at date
    let subscriptionsQuery = supabaseAdmin
      .from('subscriptions')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply status filter only for active and cancelled (optimization)
    // For expired, we fetch all and filter after calculating actual status
    if (filter === 'active') {
      subscriptionsQuery = subscriptionsQuery.in('status', ['active', 'trialing']);
    } else if (filter === 'cancelled') {
      subscriptionsQuery = subscriptionsQuery.eq('status', 'cancelled');
    }
    // Note: 'expired' filter is handled after calculating actualStatus below

    const { data: subscriptions, error: subscriptionsError } = await subscriptionsQuery;

    if (subscriptionsError) {
      console.error('Error fetching subscriptions:', subscriptionsError);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions', details: subscriptionsError.message },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        subscriptions: [],
      });
    }

    // Get all user IDs
    const userIds = subscriptions.map((sub: any) => sub.user_id);

    // Fetch user profiles for all subscriptions
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name')
      .in('id', userIds);

    // Create map for quick lookup
    const profilesMap = new Map();
    profiles?.forEach((profile: any) => {
      profilesMap.set(profile.id, profile);
    });

    // Fetch purchases to get amounts
    const { data: purchases } = await supabaseAdmin
      .from('credit_purchases')
      .select('user_id, amount_paid_paise, created_at, order_id')
      .in('user_id', userIds)
      .eq('payment_status', 'completed');

    // Create map of purchases by user_id (most recent first)
    const purchasesMap = new Map();
    purchases?.forEach((purchase: any) => {
      if (!purchasesMap.has(purchase.user_id)) {
        purchasesMap.set(purchase.user_id, purchase);
      }
    });

    // Combine data and format subscriptions
    // Filter out subscriptions where user profile doesn't exist (user was deleted)
    const now = new Date();
    const formattedSubscriptions = subscriptions
      .map((subscription: any) => {
        const profile = profilesMap.get(subscription.user_id);
        
        // Skip subscriptions for deleted users (no profile found)
        if (!profile) {
          return null;
        }
        
        const purchase = purchasesMap.get(subscription.user_id);
        
        // Determine actual status based on ends_at date
        let actualStatus = subscription.status;
        // Check if subscription is expired based on ends_at date
        if (subscription.ends_at && new Date(subscription.ends_at) < now) {
          actualStatus = 'expired';
        } else if (subscription.status === 'active' || subscription.status === 'trialing') {
          // If not expired and status is active/trialing, keep as active
          actualStatus = 'active';
        }

        // Determine plan display name
        let planDisplay = 'Pro';
        if (subscription.plan === 'simple') {
          planDisplay = 'Free';
        } else if (subscription.plan === 'pro') {
          planDisplay = 'Pro';
        }

        // Get amount from purchase or default
        const amountPaid = purchase?.amount_paid_paise || 0;
        const amountRupees = Math.round(amountPaid / 100);

        return {
          id: subscription.id,
          user_id: subscription.user_id,
          user_email: profile.email,
          user_name: profile.full_name || null,
          plan: subscription.plan,
          plan_display: planDisplay,
          status: actualStatus,
          provider: subscription.provider,
          amount: amountRupees > 0 ? amountRupees : (subscription.plan === 'pro' ? 299 : 0),
          started_at: subscription.started_at || subscription.created_at,
          ends_at: subscription.ends_at,
          current_period_start: subscription.current_period_start,
          current_period_end: subscription.current_period_end,
          created_at: subscription.created_at,
          cancelled_at: subscription.cancelled_at,
          cancel_at_period_end: subscription.cancel_at_period_end,
        };
      })
      .filter((sub: any) => sub !== null); // Remove null entries (deleted users)

    // Apply additional filtering based on calculated actual status
    let filteredSubscriptions = formattedSubscriptions;
    if (filter === 'active') {
      // Show only truly active subscriptions (not expired)
      filteredSubscriptions = formattedSubscriptions.filter((sub: any) => 
        sub.status === 'active' || sub.status === 'trialing'
      );
    } else if (filter === 'expired') {
      // Show only expired subscriptions (based on actual status)
      filteredSubscriptions = formattedSubscriptions.filter((sub: any) => sub.status === 'expired');
    } else if (filter === 'cancelled') {
      // Show only cancelled subscriptions
      filteredSubscriptions = formattedSubscriptions.filter((sub: any) => sub.status === 'cancelled');
    }
    // 'all' filter shows everything, no additional filtering needed

    return NextResponse.json({
      subscriptions: filteredSubscriptions,
      count: filteredSubscriptions.length,
    });
  } catch (error: any) {
    console.error('Error fetching subscriptions:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscriptions' },
      { status: 500 }
    );
  }
}
