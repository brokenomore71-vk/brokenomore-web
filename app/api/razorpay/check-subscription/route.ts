import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Get Razorpay credentials
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

    // Fetch subscription from Razorpay using GET /v1/subscriptions/:id
    console.log('🔍 [CHECK-SUBSCRIPTION] Fetching subscription from Razorpay API...');
    console.log('🆔 [CHECK-SUBSCRIPTION] Subscription ID:', subscription_id);
    console.log('👤 [CHECK-SUBSCRIPTION] User ID:', user.id);
    console.log('🌐 [CHECK-SUBSCRIPTION] API Endpoint: GET /v1/subscriptions/:id');
    
    let subscription;
    try {
      // This calls: GET https://api.razorpay.com/v1/subscriptions/{subscription_id}
      subscription = await razorpay.subscriptions.fetch(subscription_id);
      console.log('✅ [CHECK-SUBSCRIPTION] Subscription fetched successfully from Razorpay API');
      console.log('📊 [CHECK-SUBSCRIPTION] Full subscription details:', {
        id: subscription.id,
        entity: subscription.entity,
        status: subscription.status,
        plan_id: subscription.plan_id,
        customer_id: subscription.customer_id,
        current_start: subscription.current_start,
        current_end: subscription.current_end,
        start_at: subscription.start_at,
        end_at: subscription.end_at,
        ended_at: subscription.ended_at,
        charge_at: subscription.charge_at,
        quantity: subscription.quantity,
        total_count: subscription.total_count,
        paid_count: subscription.paid_count,
        remaining_count: subscription.remaining_count,
        auth_attempts: subscription.auth_attempts,
        customer_notify: subscription.customer_notify,
        created_at: subscription.created_at,
        expire_by: subscription.expire_by,
        short_url: subscription.short_url,
        offer_id: subscription.offer_id,
        has_scheduled_changes: subscription.has_scheduled_changes,
      });
    } catch (error: any) {
      console.error('❌ [CHECK-SUBSCRIPTION] Error fetching subscription from Razorpay:', {
        error: error.error,
        message: error.message,
        statusCode: error.statusCode,
      });
      return NextResponse.json({
        error: 'Failed to fetch subscription',
        message: error.error?.description || error.message,
      }, { status: 500 });
    }

    // Verify the subscription belongs to this user
    if (subscription.notes?.user_id !== user.id) {
      return NextResponse.json({ error: 'Subscription does not belong to this user' }, { status: 403 });
    }

    // Check if subscription exists in our database
    console.log('🗄️ [CHECK-SUBSCRIPTION] Checking if subscription exists in database...');
    const { data: dbSubscription, error: dbError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('external_subscription_id', subscription_id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (dbError) {
      console.error('❌ [CHECK-SUBSCRIPTION] Database query error:', dbError);
    } else {
      console.log('📋 [CHECK-SUBSCRIPTION] Database check result:', {
        found: !!dbSubscription,
        subscription_id: dbSubscription?.id,
        status: dbSubscription?.status,
        plan: dbSubscription?.plan,
      });
    }

    console.log('📤 [CHECK-SUBSCRIPTION] Returning subscription status to client...');
    return NextResponse.json({
      // Core subscription info
      subscription_id: subscription.id,
      entity: subscription.entity,
      status: subscription.status,
      
      // Plan and customer info
      plan_id: subscription.plan_id,
      customer_id: subscription.customer_id,
      offer_id: subscription.offer_id,
      
      // Timing information (Unix timestamps)
      current_start: subscription.current_start,
      current_end: subscription.current_end,
      start_at: subscription.start_at,
      end_at: subscription.end_at,
      ended_at: subscription.ended_at,
      charge_at: subscription.charge_at,
      created_at: subscription.created_at,
      expire_by: subscription.expire_by,
      
      // Billing cycle info
      quantity: subscription.quantity,
      total_count: subscription.total_count,
      paid_count: subscription.paid_count,
      remaining_count: subscription.remaining_count,
      auth_attempts: subscription.auth_attempts,
      
      // Additional info
      short_url: subscription.short_url,
      customer_notify: subscription.customer_notify,
      has_scheduled_changes: subscription.has_scheduled_changes,
      notes: subscription.notes,
      
      // Database status
      in_database: !!dbSubscription,
      database_status: dbSubscription?.status,
    });
  } catch (error: any) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to check subscription',
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

