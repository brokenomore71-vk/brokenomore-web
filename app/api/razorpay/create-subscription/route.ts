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
// Use demo plan ID only (for testing)
const razorpayPlanId = process.env.RAZORPAY_PLAN_ID?.trim();
// Original plan offer ID - commented out for demo plan (demo plan has no offer)
// const razorpayOfferId = process.env.RAZORPAY_OFFER_ID?.trim();

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

    // Validate Razorpay credentials
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials missing:', {
        key_id: razorpayKeyId ? 'Set' : 'Missing',
        key_secret: razorpayKeySecret ? 'Set' : 'Missing'
      });
      return NextResponse.json({ 
        error: 'Razorpay not configured',
        message: 'RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables'
      }, { status: 500 });
    }

    // Validate Plan ID
    if (!razorpayPlanId) {
      return NextResponse.json({ 
        error: 'Plan ID not configured',
        message: 'RAZORPAY_PLAN_ID must be set in environment variables'
      }, { status: 500 });
    }

    console.log('Using demo plan ID:', razorpayPlanId);

    // Create Razorpay instance
    const razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Verify plan exists before creating subscription
    try {
      await razorpayInstance.plans.fetch(razorpayPlanId);
      console.log('Plan verified:', razorpayPlanId);
    } catch (planError: any) {
      console.error('Plan verification failed:', {
        plan_id: razorpayPlanId,
        error: planError.error,
      });
      
      if (planError.statusCode === 404 || planError.error?.code === 'BAD_REQUEST_ERROR') {
        return NextResponse.json({
          error: 'Invalid Plan ID',
          message: `The plan ID "${razorpayPlanId}" does not exist in Razorpay. Please verify RAZORPAY_PLAN_ID in your environment variables.`,
          details: planError.error?.description || 'Plan not found',
          code: planError.error?.code || 'BAD_REQUEST_ERROR',
        }, { status: 400 });
      }
      
      // If it's an auth error, return that
      if (planError.statusCode === 401) {
        return NextResponse.json({ 
          error: 'Razorpay authentication failed',
          message: 'Invalid Razorpay credentials. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
          details: planError.error?.description || 'Authentication failed',
        }, { status: 401 });
      }
    }

    // Note: Demo plan does not use offers
    // Original plan offer code commented out:
    // - Offer validation will be done by Razorpay when creating the subscription
    // - The Razorpay SDK doesn't provide a direct method to verify offers

    // Get user email and phone for notifications (optional)
    const userEmail = user.email;
    const userPhone = user.phone;

    // Calculate expire_by timestamp (30 days from now as default)
    // This ensures the link is valid for 30 days
    const expireBy = Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60); // 30 days in seconds

    // Get base URL for redirect (use environment variable or construct from request)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                    (request.headers.get('origin') || 
                     `https://${request.headers.get('host') || 'localhost:3000'}`);
    // Note: subscription_id will be available in localStorage, but we'll also include it in URL for Razorpay redirect
    const successRedirectUrl = `${baseUrl}/subscription-success`;

    // Prepare subscription payload for demo plan (no offer)
    const subscriptionPayload: any = {
      plan_id: razorpayPlanId,
      total_count: 12, // 12 months (1 year) - can be adjusted based on requirements
      quantity: 1,
      customer_notify: true,
      notes: {
        user_id: user.id,
        plan_name: 'Pro',
        plan_description: '399₹/month',
        success_redirect_url: successRedirectUrl, // Store redirect URL in notes
      },
      expire_by: expireBy,
    };

    // Demo plan: No offer_id (commented out for original plan)
    // Original plan code:
    // Add offer_id only if provided (Razorpay will validate it during subscription creation)
    // if (razorpayOfferId) {
    //   subscriptionPayload.offer_id = razorpayOfferId;
    // }

    // Add notification info if user email/phone is available
    if (userEmail || userPhone) {
      subscriptionPayload.notify_info = {};
      if (userEmail) {
        subscriptionPayload.notify_info.notify_email = userEmail;
      }
      if (userPhone) {
        subscriptionPayload.notify_info.notify_phone = userPhone;
      }
    }

    console.log('Creating Razorpay subscription (demo plan - no offer):', {
      plan_id: razorpayPlanId,
      offer_id: 'Not used (demo plan)',
      user_id: user.id,
      expire_by: expireBy,
    });

    // Create subscription
    let subscription;
    try {
      subscription = await razorpayInstance.subscriptions.create(subscriptionPayload);
    } catch (razorpayError: any) {
      console.error('Razorpay API Error:', {
        statusCode: razorpayError.statusCode,
        error: razorpayError.error,
        message: razorpayError.message,
        payload: {
          plan_id: razorpayPlanId,
          offer_id: 'Not used (demo plan)',
        },
      });
      
      if (razorpayError.statusCode === 401) {
        return NextResponse.json({ 
          error: 'Razorpay authentication failed',
          message: 'Invalid Razorpay credentials. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.',
          details: razorpayError.error?.description || 'Authentication failed',
          code: razorpayError.error?.code || 'BAD_REQUEST_ERROR',
        }, { status: 401 });
      }
      
      // Provide more specific error messages
      let errorMessage = razorpayError.error?.description || razorpayError.message || 'Failed to create subscription';
      if (razorpayError.error?.description?.includes('does not exist')) {
        errorMessage = `The plan ID "${razorpayPlanId}" does not exist. Please verify RAZORPAY_PLAN_ID in your environment variables.`;
      }
      
      // Handle offer-related errors (should not occur for demo plan, but handle gracefully)
      if (razorpayError.error?.description?.toLowerCase().includes('offer')) {
        errorMessage = `Demo plan does not support offers. Error: ${razorpayError.error?.description}`;
      }
      
      return NextResponse.json({
        error: 'Razorpay API error',
        message: errorMessage,
        statusCode: razorpayError.statusCode,
        code: razorpayError.error?.code,
        details: razorpayError.error,
        hint: 'Please verify that RAZORPAY_PLAN_ID exists in your Razorpay dashboard. Demo plan does not use offers.',
      }, { status: razorpayError.statusCode || 500 });
    }

    // Log the short_url for debugging
    console.log('✅ Subscription created successfully!');
    console.log('📋 Subscription Details:', {
      subscription_id: subscription.id,
      status: subscription.status,
      short_url: subscription.short_url,
      plan_id: subscription.plan_id,
      total_count: subscription.total_count,
      expire_by: subscription.expire_by,
    });
    console.log('🔗 Short URL (Authorization Payment Link):', subscription.short_url);

    // Return subscription details including the short_url and status
    return NextResponse.json({
      subscription_id: subscription.id,
      short_url: subscription.short_url,
      status: subscription.status, // 'created', 'authenticated', 'active', etc.
      plan_id: subscription.plan_id,
      offer_id: subscription.offer_id,
      expire_by: subscription.expire_by,
      created_at: subscription.created_at,
      current_start: subscription.current_start,
      current_end: subscription.current_end,
      charge_at: subscription.charge_at,
      total_count: subscription.total_count,
      paid_count: subscription.paid_count,
      remaining_count: subscription.remaining_count,
      success_redirect_url: successRedirectUrl, // Redirect URL for after payment
      // Status information for frontend
      status_info: {
        is_created: subscription.status === 'created',
        is_authenticated: subscription.status === 'authenticated',
        is_active: subscription.status === 'active',
        is_pending: subscription.status === 'pending',
        is_completed: subscription.status === 'completed',
        is_cancelled: subscription.status === 'cancelled',
        is_expired: subscription.status === 'expired',
      },
    });
  } catch (error: any) {
    console.error('Error creating Razorpay subscription:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create subscription',
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

