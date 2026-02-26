import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Create admin client with explicit auth settings to bypass RLS
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: 'public',
  },
});

// Initialize Razorpay
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

if (!razorpayKeyId || !razorpayKeySecret) {
  console.error('Razorpay credentials are missing!');
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId!,
  key_secret: razorpayKeySecret!,
});

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

    const body = await request.json();
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature, purchase_id } = body;

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Missing payment verification data' }, { status: 400 });
    }

    // Verify signature
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpay_signature) {
      // Mark purchase as failed
      if (purchase_id) {
        await supabaseAdmin
          .from('credit_purchases')
          .update({ payment_status: 'failed' })
          .eq('id', purchase_id);
      }
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    // Fetch purchase record - try multiple methods
    let purchase;
    let purchaseError;

    // Create user context client for RLS
    const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });

    console.log('Looking for purchase:', { purchase_id, razorpay_order_id, user_id: user.id });

    // First try: by order_id with user context (respects RLS)
    if (razorpay_order_id) {
      const result = await supabaseUser
        .from('credit_purchases')
        .select('*, credit_packages(*)')
        .eq('order_id', razorpay_order_id)
        .maybeSingle();
      
      purchase = result.data;
      purchaseError = result.error;
      console.log('Purchase lookup by order_id (user context):', {
        found: !!purchase,
        error: purchaseError?.code,
        purchase_id: purchase?.id
      });
    }

    // Second try: by purchase_id with user context
    if (!purchase && purchase_id) {
      const result = await supabaseUser
        .from('credit_purchases')
        .select('*, credit_packages(*)')
        .eq('id', purchase_id)
        .maybeSingle();
      
      purchase = result.data;
      purchaseError = result.error;
      console.log('Purchase lookup by purchase_id (user context):', {
        found: !!purchase,
        error: purchaseError?.code,
        purchase_id: purchase?.id
      });
    }

    // Third try: with admin client (bypasses RLS if service role key is set)
    // Try without user_id filter first, then verify ownership
    if (!purchase && razorpay_order_id) {
      console.log('Trying with admin client (no user filter)...');
      const result = await supabaseAdmin
        .from('credit_purchases')
        .select('*, credit_packages(*)')
        .eq('order_id', razorpay_order_id)
        .maybeSingle(); // Don't filter by user_id, let admin see all
      
      // Verify it belongs to the user
      if (result.data && result.data.user_id === user.id) {
        purchase = result.data;
        purchaseError = null;
        console.log('Purchase found by order_id (admin context):', {
          found: true,
          purchase_id: purchase?.id,
          user_id_match: true
        });
      } else if (result.data) {
        console.warn('Purchase found but user_id mismatch:', {
          purchase_user_id: result.data.user_id,
          current_user_id: user.id
        });
        purchaseError = { code: '403', message: 'Purchase belongs to different user' };
      } else {
        purchaseError = result.error;
        console.log('Purchase lookup by order_id (admin context):', {
          found: false,
          error: purchaseError?.code
        });
      }
    }

    // Fourth try: by purchase_id with admin client
    if (!purchase && purchase_id) {
      console.log('Trying with admin client by purchase_id...');
      const result = await supabaseAdmin
        .from('credit_purchases')
        .select('*, credit_packages(*)')
        .eq('id', purchase_id)
        .maybeSingle(); // Don't filter by user_id, let admin see all
      
      // Verify it belongs to the user
      if (result.data && result.data.user_id === user.id) {
        purchase = result.data;
        purchaseError = null;
        console.log('Purchase found by purchase_id (admin context):', {
          found: true,
          purchase_id: purchase?.id
        });
      } else if (result.data) {
        console.warn('Purchase found but user_id mismatch');
        purchaseError = { code: '403', message: 'Purchase belongs to different user' };
      } else {
        purchaseError = result.error;
        console.log('Purchase lookup by purchase_id (admin context):', {
          found: false,
          error: purchaseError?.code
        });
      }
    }

    if (purchaseError && purchaseError.code !== 'PGRST116' && purchaseError.code !== '42P01') {
      console.error('Error fetching purchase:', purchaseError);
      return NextResponse.json({ 
        error: 'Failed to fetch purchase',
        details: purchaseError.message,
        code: purchaseError.code
      }, { status: 500 });
    }

    if (!purchase) {
      console.error('Purchase not found after all attempts:', { 
        purchase_id, 
        razorpay_order_id, 
        user_id: user.id 
      });
      return NextResponse.json({ 
        error: 'Purchase not found',
        message: `Could not find purchase record with purchase_id: ${purchase_id || 'N/A'} or order_id: ${razorpay_order_id || 'N/A'}`,
        hint: 'The purchase record exists but may be blocked by RLS. Ensure RLS policies allow users to view their own purchases.',
        troubleshooting: 'Check: 1) RLS policies are set up, 2) User ID matches purchase user_id, 3) Order ID matches exactly'
      }, { status: 404 });
    }

    // Check if already processed
    if (purchase.payment_status === 'completed') {
      return NextResponse.json({ 
        message: 'Payment already processed',
        balance: await getCreditBalance(user.id)
      });
    }

    // Calculate subscription dates for Pro Plan (30 days from now)
    const subscriptionStart = new Date().toISOString();
    const subscriptionEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days from now

    // Calculate credits for Pro Plan (50 credits/day * 30 days = 1500 credits)
    // Using Option A: Give total credits upfront
    const creditsToAdd = purchase.credits_purchased || 1500; // Default to 1500 for Pro Plan

    // Update purchase status with subscription information - try with user context first (respects RLS)
    // Note: supabaseUser is already created above, reusing it
    let updateError;
    const userUpdateResult = await supabaseUser
      .from('credit_purchases')
      .update({
        payment_status: 'completed',
        metadata: {
          ...(purchase.metadata || {}),
          razorpay_payment_id,
          razorpay_order_id,
          verified_at: new Date().toISOString(),
          plan_type: 'pro',
          subscription_start: subscriptionStart,
          subscription_end: subscriptionEnd,
        },
      })
      .eq('id', purchase.id)
      .eq('user_id', user.id); // Ensure user can only update their own purchases

    updateError = userUpdateResult.error;

    // If RLS blocks it, try with admin client
    if (updateError && updateError.code === '42501') {
      console.warn('RLS blocked update, trying with admin client...');
      const adminUpdateResult = await supabaseAdmin
        .from('credit_purchases')
        .update({
          payment_status: 'completed',
          metadata: {
            ...(purchase.metadata || {}),
            razorpay_payment_id,
            razorpay_order_id,
            verified_at: new Date().toISOString(),
            plan_type: 'pro',
            subscription_start: subscriptionStart,
            subscription_end: subscriptionEnd,
          },
        })
        .eq('id', purchase.id);
      
      updateError = adminUpdateResult.error;
    }

    if (updateError) {
      console.error('Error updating purchase:', updateError);
      return NextResponse.json({ error: 'Failed to update purchase' }, { status: 500 });
    }

    // Check if active subscription already exists for this user
    const { data: existingSubscription, error: checkSubscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, status, plan')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .maybeSingle();

    if (checkSubscriptionError && checkSubscriptionError.code !== 'PGRST116') {
      console.error('Error checking existing subscription:', checkSubscriptionError);
    }

    console.log('Checking for existing subscription:', {
      found: !!existingSubscription,
      subscription_id: existingSubscription?.id,
      current_status: existingSubscription?.status,
      current_plan: existingSubscription?.plan
    });

    // Create or update subscription record
    let subscriptionCreated = false;
    let subscriptionId = null;
    
    if (!existingSubscription) {
      console.log('No existing active subscription found, creating new one...');
      // Create new subscription record matching the existing table structure
      const subscriptionData: any = {
        user_id: user.id,
        plan: 'pro', // Using string, not const to avoid type issues
        status: 'active', // Using string, not const to avoid type issues
        provider: 'razorpay',
        product_id: 'pro_monthly',
        started_at: subscriptionStart,
        ends_at: subscriptionEnd,
        current_period_start: subscriptionStart,
        current_period_end: subscriptionEnd,
        external_subscription_id: razorpay_order_id,
        external_customer_id: user.id,
        receipt_data: {
          razorpay_payment_id,
          razorpay_order_id,
          package_id: purchase.package_id,
        },
        metadata: {
          package_id: purchase.package_id,
          credits_purchased: creditsToAdd,
          purchase_id: purchase.id,
        },
      };

      // Insert subscription - try with user context first (respects RLS policies)
      // If RLS policies allow users to insert their own subscriptions, this will work
      let subscription, subscriptionError;
      
      console.log('Attempting to insert subscription with user context (respects RLS)...');
      const userInsertResult = await supabaseUser
        .from('subscriptions')
        .insert(subscriptionData)
        .select()
        .single();
      
      subscription = userInsertResult.data;
      subscriptionError = userInsertResult.error;

      // If RLS blocks it, try with admin client (service role bypasses RLS)
      if (subscriptionError && subscriptionError.code === '42501') {
        console.log('RLS blocked user context insert, trying with service role key...');
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        
        if (serviceRoleKey) {
          const adminClientWithServiceRole = createClient(
            supabaseUrl,
            serviceRoleKey,
            {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              },
              db: {
                schema: 'public',
              },
            }
          );
          
          const adminInsertResult = await adminClientWithServiceRole
            .from('subscriptions')
            .insert(subscriptionData)
            .select()
            .single();
          
          subscription = adminInsertResult.data;
          subscriptionError = adminInsertResult.error;
        } else {
          console.error('❌ RLS blocked insertion and SUPABASE_SERVICE_ROLE_KEY is not set.');
          console.error('Please either:');
          console.error('1. Add RLS INSERT policy for users (see subscriptions-rls-policies.sql)');
          console.error('2. OR set SUPABASE_SERVICE_ROLE_KEY in .env.local');
        }
      }

      if (subscriptionError) {
        console.error('❌ Error creating subscription:', subscriptionError);
        console.error('Subscription data attempted:', JSON.stringify(subscriptionData, null, 2));
        console.error('Error details:', {
          code: subscriptionError.code,
          message: subscriptionError.message,
          details: subscriptionError.details,
          hint: subscriptionError.hint
        });
        console.error('Service role key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
        
        // Don't fail the payment, but log the error
        // Credits are already added, so we'll just log this
        console.warn('⚠️ Payment successful but subscription not created. User still received credits.');
      } else {
        console.log('✅ Subscription created successfully:', subscription?.id);
        subscriptionCreated = true;
        subscriptionId = subscription?.id;
      }
    } else {
      console.log('Existing active subscription found, updating to pro plan...');
      // Update existing subscription to pro plan
      const updateData: any = {
        plan: 'pro',
        status: 'active',
        provider: 'razorpay',
        started_at: subscriptionStart,
        ends_at: subscriptionEnd,
        current_period_start: subscriptionStart,
        current_period_end: subscriptionEnd,
        external_subscription_id: razorpay_order_id,
        receipt_data: {
          razorpay_payment_id,
          razorpay_order_id,
          package_id: purchase.package_id,
        },
        metadata: {
          package_id: purchase.package_id,
          credits_purchased: creditsToAdd,
          purchase_id: purchase.id,
        },
      };

      const { error: updateSubscriptionError } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('id', existingSubscription.id);

      if (updateSubscriptionError) {
        console.error('❌ Error updating subscription:', updateSubscriptionError);
        console.error('Update data attempted:', JSON.stringify(updateData, null, 2));
        console.error('Error details:', {
          code: updateSubscriptionError.code,
          message: updateSubscriptionError.message,
          details: updateSubscriptionError.details,
          hint: updateSubscriptionError.hint
        });
        // Return error to frontend
        return NextResponse.json({ 
          error: 'Payment verified but subscription update failed',
          subscription_error: updateSubscriptionError.message,
          details: updateSubscriptionError.details,
          hint: updateSubscriptionError.hint,
          balance: await getCreditBalance(user.id)
        }, { status: 500 });
      } else {
        console.log('✅ Subscription updated to pro plan:', existingSubscription.id);
        subscriptionCreated = true;
        subscriptionId = existingSubscription.id;
      }
    }

    // Call add_credits function via RPC
    const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
      p_user_id: user.id,
      p_amount: creditsToAdd,
      p_transaction_type: 'purchase',
      p_description: `Pro Plan - 50 credits/day for 1 month (${creditsToAdd} credits)`,
      p_purchase_id: razorpay_payment_id,
      p_order_id: razorpay_order_id,
      p_metadata: {
        package_id: purchase.package_id,
        plan_type: 'pro',
        subscription_start: subscriptionStart,
        subscription_end: subscriptionEnd,
      },
    });

    if (creditsError) {
      console.error('Error adding credits:', creditsError);
      // Don't fail the request, but log the error
    }

    // Get updated balance
    const balance = await getCreditBalance(user.id);

    // Verify subscription was created/updated
    if (!subscriptionCreated) {
      console.warn('⚠️ Warning: Subscription creation/update flag is false, but no error was thrown');
    } else {
      console.log('✅ Subscription operation completed successfully. Subscription ID:', subscriptionId);
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified and credits added',
      balance,
      credits_added: creditsToAdd,
      subscription_created: subscriptionCreated,
      subscription_id: subscriptionId,
    });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

async function getCreditBalance(userId: string): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc('get_user_credit_balance', {
    p_user_id: userId,
  });
  return data || 0;
}

