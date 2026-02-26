import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for this endpoint!');
}

// Create admin client with service role key (bypasses RLS)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

// Initialize Razorpay
const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

if (!razorpayKeyId || !razorpayKeySecret) {
  console.error('Razorpay credentials are missing!');
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId!,
  key_secret: razorpayKeySecret!,
});

export async function POST(request: NextRequest) {
  try {
    console.log('\n🔄 ===== ACTIVATE SUBSCRIPTION API CALLED =====');
    console.log('📅 Timestamp:', new Date().toISOString());

    // Verify service role key is configured
    if (!supabaseServiceKey || supabaseServiceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not configured or is using anon key!');
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'SUPABASE_SERVICE_ROLE_KEY must be set in environment variables to bypass RLS policies'
      }, { status: 500 });
    }

    // Get user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify token with Supabase
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { subscription_id } = body;

    if (!subscription_id) {
      return NextResponse.json({ error: 'Subscription ID is required' }, { status: 400 });
    }

    console.log('🆔 Subscription ID:', subscription_id);
    console.log('👤 User ID:', user.id);

    // Fetch subscription from Razorpay to get latest status
    let subscriptionDetails;
    try {
      console.log('📡 Fetching subscription from Razorpay...');
      subscriptionDetails = await razorpay.subscriptions.fetch(subscription_id);
      console.log('✅ Subscription fetched:', {
        id: subscriptionDetails.id,
        status: subscriptionDetails.status,
        plan_id: subscriptionDetails.plan_id,
        paid_count: subscriptionDetails.paid_count,
        total_count: subscriptionDetails.total_count,
      });
    } catch (error: any) {
      console.error('❌ Error fetching subscription from Razorpay:', error);
      return NextResponse.json({
        error: 'Failed to fetch subscription',
        message: error.error?.description || error.message,
      }, { status: 500 });
    }

    // Verify the subscription belongs to this user
    if (subscriptionDetails.notes?.user_id !== user.id) {
      console.error('❌ Subscription does not belong to user');
      return NextResponse.json({ error: 'Subscription does not belong to this user' }, { status: 403 });
    }

    // Check if subscription is in a valid state to activate
    if (subscriptionDetails.status !== 'authenticated' && subscriptionDetails.status !== 'active') {
      console.log('⚠️ Subscription not ready for activation. Current status:', subscriptionDetails.status);
      return NextResponse.json({
        error: 'Subscription not ready for activation',
        message: `Subscription status is "${subscriptionDetails.status}". Expected "authenticated" or "active".`,
        current_status: subscriptionDetails.status,
      }, { status: 400 });
    }

    // Calculate subscription dates
    const subscriptionStart = subscriptionDetails.start_at 
      ? new Date(subscriptionDetails.start_at * 1000).toISOString()
      : new Date().toISOString();
    
    // Calculate subscription end date
    // Ensure it's always in the future
    let subscriptionEnd: string;
    if (subscriptionDetails.end_at && subscriptionDetails.end_at > 0) {
      const endDate = new Date(subscriptionDetails.end_at * 1000);
      const now = new Date();
      // If the end date is in the past or less than 1 day from now, default to 30 days
      if (endDate > now && (endDate.getTime() - now.getTime()) > 24 * 60 * 60 * 1000) {
        subscriptionEnd = endDate.toISOString();
      } else {
        subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    } else {
      subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default 30 days
    }
    
    console.log('📅 Subscription dates calculated:', {
      start: subscriptionStart,
      end: subscriptionEnd,
      razorpay_end_at: subscriptionDetails.end_at,
    });

    // Calculate credits (50 credits/day * 30 days = 1500 credits for Pro Plan)
    const creditsToAdd = 1500; // Pro Plan credits

    console.log('📊 Subscription details:', {
      start: subscriptionStart,
      end: subscriptionEnd,
      credits: creditsToAdd,
    });

    // Check if subscription already exists in database
    const { data: existingSubscription } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status')
      .eq('user_id', user.id)
      .eq('external_subscription_id', subscription_id)
      .maybeSingle();

    const subscriptionData: any = {
      user_id: user.id,
      plan: 'pro',
      status: 'active', // DB enum only has 'active', not 'authenticated'; both Razorpay states map to active
      provider: 'razorpay',
      product_id: 'pro_monthly',
      started_at: subscriptionStart,
      ends_at: subscriptionEnd,
      current_period_start: subscriptionStart,
      current_period_end: subscriptionEnd,
      external_subscription_id: subscription_id,
      external_customer_id: subscriptionDetails.customer_id || user.id,
      receipt_data: {
        razorpay_subscription_id: subscription_id,
        plan_id: subscriptionDetails.plan_id,
        offer_id: subscriptionDetails.offer_id,
      },
      metadata: {
        subscription_status: subscriptionDetails.status,
        total_count: subscriptionDetails.total_count,
        paid_count: subscriptionDetails.paid_count,
        remaining_count: subscriptionDetails.remaining_count,
        current_start: subscriptionDetails.current_start,
        current_end: subscriptionDetails.current_end,
        credits_purchased: creditsToAdd,
        activated_via: 'polling', // Indicates this was activated via frontend polling
        // Billing period tracking for monthly renewals
        last_credit_grant_period: subscriptionDetails.paid_count || 0,
        total_credits_granted: creditsToAdd,
        last_credit_grant_date: new Date().toISOString(),
        billing_cycle: subscriptionDetails.paid_count || 1, // Current billing cycle number
      },
    };

    if (existingSubscription) {
      // Update existing subscription
      console.log('🔄 Updating existing subscription:', existingSubscription.id);
      const { data: updatedSubscription, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update(subscriptionData)
        .eq('id', existingSubscription.id)
        .select()
        .single();

      if (updateError) {
        console.error('❌ Error updating subscription:', updateError);
        console.error('❌ Update error details:', {
          code: updateError.code,
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
        });
        
        // If RLS error, provide helpful message
        if (updateError.code === '42501') {
          console.error('❌ RLS Policy Error: Service role key may not be configured correctly');
          return NextResponse.json({ 
            error: 'Database permission error',
            message: 'Failed to update subscription due to database permissions. Please check SUPABASE_SERVICE_ROLE_KEY configuration.',
            details: updateError.message
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          error: 'Failed to update subscription',
          message: updateError.message,
          details: updateError
        }, { status: 500 });
      }

      console.log('✅ Subscription updated successfully:', updatedSubscription?.id);
    } else {
      // Create new subscription
      console.log('➕ Creating new subscription record');
      console.log('📋 Subscription data to insert:', {
        user_id: subscriptionData.user_id,
        plan: subscriptionData.plan,
        status: subscriptionData.status,
        external_subscription_id: subscriptionData.external_subscription_id,
      });
      
      const { data: newSubscription, error: insertError } = await supabaseAdmin
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();

      if (insertError) {
        console.error('❌ Error creating subscription:', insertError);
        console.error('❌ Insert error details:', {
          code: insertError.code,
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
        });
        
        // If RLS error, provide helpful message
        if (insertError.code === '42501') {
          console.error('❌ RLS Policy Error: Service role key may not be configured correctly');
          console.error('❌ Make sure SUPABASE_SERVICE_ROLE_KEY is set in environment variables');
          return NextResponse.json({ 
            error: 'Database permission error',
            message: 'Failed to create subscription due to database permissions. Please check SUPABASE_SERVICE_ROLE_KEY configuration.',
            details: insertError.message,
            hint: 'Ensure SUPABASE_SERVICE_ROLE_KEY is set in your .env.local file'
          }, { status: 500 });
        }
        
        return NextResponse.json({ 
          error: 'Failed to create subscription',
          message: insertError.message,
          details: insertError
        }, { status: 500 });
      }

      console.log('✅ Subscription created successfully:', newSubscription?.id);
    }

    // Add credits to user account (check if already added to avoid duplicates)
    const { data: existingCredits } = await supabaseAdmin
      .from('credit_transactions')
      .select('id')
      .eq('user_id', user.id)
      .eq('order_id', subscription_id)
      .eq('transaction_type', 'purchase')
      .maybeSingle();

    if (!existingCredits) {
      console.log('💰 Adding credits to user account...');
      const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
        p_user_id: user.id,
        p_amount: creditsToAdd,
        p_transaction_type: 'purchase',
        p_description: `Pro Plan Subscription - 50 credits/day for 1 month (${creditsToAdd} credits)`,
        p_purchase_id: subscription_id,
        p_order_id: subscription_id,
        p_metadata: {
          subscription_id: subscription_id,
          plan_type: 'pro',
          subscription_start: subscriptionStart,
          subscription_end: subscriptionEnd,
          activated_via: 'polling',
          subscription_period: subscriptionDetails.paid_count || 1,
          billing_cycle: subscriptionDetails.paid_count || 1,
          is_initial_activation: true,
        },
      });

      if (creditsError) {
        console.error('❌ Error adding credits:', creditsError);
        // Don't fail the request, but log the error
      } else {
        console.log('✅ Credits added successfully:', creditsToAdd);
      }
    } else {
      console.log('ℹ️ Credits already added for this subscription, skipping');
    }

    // Get updated balance
    const { data: balance } = await supabaseAdmin.rpc('get_user_credit_balance', {
      p_user_id: user.id,
    });

    console.log('✅ Subscription activation completed successfully');
    console.log('💰 User balance:', balance || 0);

    return NextResponse.json({
      success: true,
      message: 'Subscription activated successfully',
      subscription_id: subscription_id,
      status: subscriptionDetails.status,
      credits_added: existingCredits ? 0 : creditsToAdd,
      balance: balance || 0,
    });
  } catch (error: any) {
    console.error('❌ Error activating subscription:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to activate subscription',
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

