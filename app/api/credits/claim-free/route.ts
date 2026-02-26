import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
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

    // Check if user already claimed free plan
    const { data: existingTransactions, error: checkError } = await supabaseAdmin
      .from('credit_transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('transaction_type', 'bonus')
      .ilike('description', '%Free Plan%')
      .limit(1);

    if (checkError) {
      console.error('Error checking existing transactions:', checkError);
    }

    if (existingTransactions && existingTransactions.length > 0) {
      return NextResponse.json(
        { error: 'Free plan already claimed', already_claimed: true },
        { status: 400 }
      );
    }

    // Ensure user has user_credits row
    const { error: creditsError } = await supabaseAdmin.rpc('get_or_create_user_credits', {
      user_id: user.id,
    });

    if (creditsError) {
      console.error('Error ensuring user credits:', creditsError);
    }

    // Add 5 credits via add_credits function
    const { error: addError } = await supabaseAdmin.rpc('add_credits', {
      p_user_id: user.id,
      p_amount: 5,
      p_transaction_type: 'bonus',
      p_description: 'Free Plan - 5 lifetime credits',
      p_purchase_id: null,
      p_order_id: null,
      p_metadata: {
        plan_type: 'free',
        claimed_at: new Date().toISOString(),
      },
    });

    if (addError) {
      console.error('Error adding free credits:', addError);
      return NextResponse.json(
        { error: 'Failed to add credits' },
        { status: 500 }
      );
    }

    // Check if simple plan subscription already exists (free plan maps to 'simple')
    const { data: existingSimpleSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('user_id', user.id)
      .eq('plan', 'simple')
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    // Create subscription record for free plan (mapped to 'simple' plan) if it doesn't exist
    // Free plan is lifetime, so set end date far in future
    if (!existingSimpleSubscription) {
      const subscriptionStart = new Date().toISOString();
      const subscriptionEnd = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString(); // 100 years from now (lifetime)

      const subscriptionData = {
        user_id: user.id,
        plan: 'simple' as const,
        status: 'active' as const,
        provider: 'manual' as const, // Free plan is manual/not paid
        started_at: subscriptionStart,
        ends_at: subscriptionEnd,
        current_period_start: subscriptionStart,
        current_period_end: subscriptionEnd,
        metadata: {
          plan_type: 'free',
          credits: 5,
          claimed_at: new Date().toISOString(),
        },
      };

      // Insert subscription with admin client
      const { data: subscription, error: subscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (subscriptionError) {
        console.error('Error creating free plan subscription:', subscriptionError);
        // Don't fail the request, but log the error
      } else {
        console.log('Free plan subscription (simple) created successfully:', subscription?.id);
      }
    } else {
      console.log('Simple plan subscription already exists:', existingSimpleSubscription.id);
    }

    // Get updated balance
    const { data: balance } = await supabaseAdmin.rpc('get_user_credit_balance', {
      p_user_id: user.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Free plan activated successfully',
      credits_added: 5,
      balance: balance || 0,
    });
  } catch (error: any) {
    console.error('Error claiming free plan:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to claim free plan' },
      { status: 500 }
    );
  }
}

