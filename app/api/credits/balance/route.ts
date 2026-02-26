import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get credit balance
    const { data: balance, error: balanceError } = await supabaseAdmin.rpc('get_user_credit_balance', {
      p_user_id: user.id,
    });

    if (balanceError) {
      console.error('Error getting balance:', balanceError);
      return NextResponse.json({ error: 'Failed to get balance' }, { status: 500 });
    }

    // Create user context client for RLS
    const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    // Get recent transactions (RLS will filter to user's own transactions)
    const { data: transactions, error: transactionsError } = await supabaseUser
      .from('credit_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    // Check if free plan was claimed
    const { data: freePlanClaimed } = await supabaseUser
      .from('credit_transactions')
      .select('id')
      .eq('transaction_type', 'bonus')
      .ilike('description', '%Free Plan%')
      .limit(1)
      .maybeSingle();

    // Get active subscription from subscriptions table (primary source)
    // Use only enum values allowed by subscription_status (e.g. active, trialing)
    const { data: activeSubscription, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Log subscription query for debugging
    if (subscriptionError) {
      console.error('Error querying subscriptions:', subscriptionError);
    } else {
      console.log('Subscription query result:', {
        found: !!activeSubscription,
        subscription_id: activeSubscription?.id,
        plan: activeSubscription?.plan,
        status: activeSubscription?.status,
        ends_at: activeSubscription?.ends_at,
      });
    }

    let planType = 'none';
    let subscriptionEnd = null;

    // If subscriptions table exists and has a record, use it
    if (activeSubscription && !subscriptionError) {
      // Check if subscription is still valid (ends_at is in the future or null)
      const now = new Date();
      const hasValidEndDate = activeSubscription.ends_at 
        ? new Date(activeSubscription.ends_at) > now
        : true; // If no end date, assume it's active (for subscriptions without explicit end dates)
      
      if (hasValidEndDate) {
        // Map plan types: 'simple' -> 'free', 'pro' -> 'pro', anything else -> 'pro' if status is active/authenticated
        if (activeSubscription.plan === 'simple') {
          planType = 'free';
        } else if (activeSubscription.plan === 'pro') {
          planType = 'pro';
        } else {
          // Default to pro if status is active/trialing/authenticated
          planType = 'pro';
        }
        subscriptionEnd = activeSubscription.ends_at;
        
        console.log('Active subscription found:', {
          plan: activeSubscription.plan,
          planType,
          status: activeSubscription.status,
          ends_at: subscriptionEnd,
        });
      } else {
        // Subscription expired, update status
        console.log('Subscription expired, updating status');
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', activeSubscription.id);
      }
    } else {
      // Fallback: Check if there's any subscription (even if status doesn't match)
      // This helps catch subscriptions that might be in a different state
      console.log('No active subscription found, checking all subscriptions...');
      const { data: allSubscriptions, error: allSubsError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (allSubscriptions && !allSubsError) {
        console.log('Found subscription with different status:', {
          id: allSubscriptions.id,
          plan: allSubscriptions.plan,
          status: allSubscriptions.status,
          ends_at: allSubscriptions.ends_at,
        });

        // If it's a pro plan subscription (even if status is not active), check if it's still valid
        if (allSubscriptions.plan === 'pro') {
          const hasValidEndDate = allSubscriptions.ends_at 
            ? new Date(allSubscriptions.ends_at) > new Date()
            : true;
          
          if (hasValidEndDate && allSubscriptions.status === 'active') {
            planType = 'pro';
            subscriptionEnd = allSubscriptions.ends_at;
            console.log('Using pro subscription from fallback query');
          }
        }
      }

      // Additional fallback: Check credit_purchases table for backward compatibility
      if (planType === 'none') {
        const { data: activePurchase } = await supabaseUser
          .from('credit_purchases')
          .select('*, credit_packages(*)')
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (activePurchase?.metadata?.subscription_end) {
          const endDate = new Date(activePurchase.metadata.subscription_end);
          if (endDate > new Date()) {
            planType = activePurchase.metadata.plan_type || 'pro';
            subscriptionEnd = activePurchase.metadata.subscription_end;
          }
        } else if (freePlanClaimed) {
          planType = 'free';
        }
      }
    }

    return NextResponse.json({
      balance: balance || 0,
      transactions: transactions || [],
      plan_type: planType,
      subscription_end: subscriptionEnd,
      free_plan_claimed: !!freePlanClaimed,
    });
  } catch (error: any) {
    console.error('Error getting credits data:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to get credits data' },
      { status: 500 }
    );
  }
}

