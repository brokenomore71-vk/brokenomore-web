import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [SUBSCRIPTION-STATUS] API called');
    
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ [SUBSCRIPTION-STATUS] No authorization header');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      console.error('❌ [SUBSCRIPTION-STATUS] Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('✅ [SUBSCRIPTION-STATUS] User authenticated:', user.id);
    console.log('🔍 [SUBSCRIPTION-STATUS] User ID type:', typeof user.id);
    console.log('🔍 [SUBSCRIPTION-STATUS] User ID value:', user.id);

    // First, get ALL subscriptions for this user to see what we have
    const { data: allSubscriptions, error: allSubsError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    console.log('🔍 [SUBSCRIPTION-STATUS] All subscriptions query:', {
      count: allSubscriptions?.length || 0,
      subscriptions: allSubscriptions?.map(s => ({
        id: s.id,
        plan: s.plan,
        status: s.status,
        ends_at: s.ends_at,
        user_id: s.user_id,
      })),
      error: allSubsError,
    });

    if (allSubsError) {
      console.error('❌ [SUBSCRIPTION-STATUS] Error querying all subscriptions:', allSubsError);
      return NextResponse.json({ 
        error: 'Failed to get subscription',
        details: allSubsError.message 
      }, { status: 500 });
    }

    // Find the most recent valid subscription
    let activeSubscription = null;
    
    if (allSubscriptions && allSubscriptions.length > 0) {
      // First, try to find one with active status (authenticated is not a valid enum value)
      activeSubscription = allSubscriptions.find(sub => 
        ['active', 'trialing'].includes(sub.status)
      );
      
      // If not found, use the most recent one regardless of status
      if (!activeSubscription) {
        activeSubscription = allSubscriptions[0];
        console.log('⚠️ [SUBSCRIPTION-STATUS] No active subscription found, using most recent:', {
          plan: activeSubscription.plan,
          status: activeSubscription.status,
        });
      } else {
        console.log('✅ [SUBSCRIPTION-STATUS] Found active subscription:', {
          plan: activeSubscription.plan,
          status: activeSubscription.status,
        });
      }
    }

    // Check if subscription is still valid (ends_at is in the future or null)
    if (activeSubscription) {
      const now = new Date();
      const hasValidEndDate = activeSubscription.ends_at 
        ? new Date(activeSubscription.ends_at) > now
        : true; // If no end date, assume it's active

      console.log('✅ Subscription validation:', {
        plan: activeSubscription.plan,
        status: activeSubscription.status,
        ends_at: activeSubscription.ends_at,
        hasValidEndDate,
        now: now.toISOString(),
      });

      if (hasValidEndDate) {
        return NextResponse.json({
          plan: activeSubscription.plan,
          status: activeSubscription.status,
          ends_at: activeSubscription.ends_at,
          started_at: activeSubscription.started_at,
        });
      } else {
        // Subscription expired
        console.log('⏰ Subscription expired');
        return NextResponse.json({ plan: null, status: 'expired' });
      }
    }

    // No active subscription found
    console.log('ℹ️ [SUBSCRIPTION-STATUS] No subscription found for user');
    return NextResponse.json({ plan: null, status: null });
  } catch (error: any) {
    console.error('❌ [SUBSCRIPTION-STATUS] Error getting subscription status:', error);
    console.error('❌ [SUBSCRIPTION-STATUS] Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to get subscription status',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

