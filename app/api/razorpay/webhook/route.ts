import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
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
const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

if (!razorpayKeyId || !razorpayKeySecret) {
  console.error('Razorpay credentials are missing!');
}

const razorpay = new Razorpay({
  key_id: razorpayKeyId!,
  key_secret: razorpayKeySecret!,
});

// Disable body parsing to get raw body for signature verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    console.log('\n🔔 ===== WEBHOOK REQUEST RECEIVED =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('🌐 Request URL:', request.url);
    console.log('📋 Request Method:', request.method);
    
    // Get the webhook signature from headers
    const razorpaySignature = request.headers.get('X-Razorpay-Signature');
    
    console.log('🔐 Webhook Signature Header:', razorpaySignature ? 'Present' : 'Missing');
    
    if (!razorpaySignature) {
      console.error('❌ Missing Razorpay signature in webhook');
      console.error('📋 Available headers:', Object.fromEntries(request.headers.entries()));
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Get the raw body for signature verification
    // Note: In Next.js, we need to read the body as text for webhook signature verification
    const body = await request.text();
    console.log('📦 Webhook body length:', body.length, 'characters');
    
    // Check if webhook secret is configured
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || razorpayKeySecret!;
    const usingWebhookSecret = !!process.env.RAZORPAY_WEBHOOK_SECRET;
    
    console.log('🔑 Webhook Secret Source:', usingWebhookSecret ? 'RAZORPAY_WEBHOOK_SECRET (configured)' : 'RAZORPAY_KEY_SECRET (fallback)');
    console.log('🔑 Webhook Secret Length:', webhookSecret?.length || 0, 'characters');

    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(body)
      .digest('hex');

    console.log('🔐 Signature Verification:');
    console.log('  - Received:', razorpaySignature.substring(0, 20) + '...');
    console.log('  - Expected:', expectedSignature.substring(0, 20) + '...');
    console.log('  - Match:', razorpaySignature === expectedSignature ? '✅ Valid' : '❌ Invalid');

    if (razorpaySignature !== expectedSignature) {
      console.error('❌ Invalid webhook signature');
      console.error('💡 Tip: Make sure RAZORPAY_WEBHOOK_SECRET in .env.local matches the webhook secret from Razorpay dashboard');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    console.log('✅ Webhook signature verified successfully');

    // Parse the webhook payload
    const webhookData = JSON.parse(body);
    const event = webhookData.event;
    const payload = webhookData.payload;

    console.log('\n🔔 ===== RAZORPAY WEBHOOK RECEIVED =====');
    console.log('📅 Timestamp:', new Date().toISOString());
    console.log('📋 Webhook Event:', event);
    console.log('🆔 Entity ID:', payload?.subscription?.id || payload?.payment?.id);
    console.log('📦 Entity Type:', payload?.subscription?.entity || payload?.payment?.entity);
    console.log('📊 Full payload keys:', Object.keys(payload || {}));

    // Handle subscription events
    if (event.startsWith('subscription.')) {
      const subscription = payload.subscription;
      
      if (!subscription || !subscription.id) {
        console.error('Invalid subscription data in webhook');
        return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
      }

      const subscriptionId = subscription.id;
      const userId = subscription.notes?.user_id;

      if (!userId) {
        console.error('User ID not found in subscription notes:', subscriptionId);
        return NextResponse.json({ error: 'User ID not found' }, { status: 400 });
      }

      // Fetch full subscription details from Razorpay
      let subscriptionDetails;
      try {
        subscriptionDetails = await razorpay.subscriptions.fetch(subscriptionId);
      } catch (error: any) {
        console.error('Error fetching subscription from Razorpay:', error);
        return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
      }

      // Handle different subscription events
      if (event === 'subscription.authenticated' || event === 'subscription.activated') {
        console.log('\n✅ ===== PROCESSING SUBSCRIPTION ACTIVATION =====');
        console.log('📋 Event:', event);
        console.log('🆔 Subscription ID:', subscriptionId);
        console.log('👤 User ID:', userId);
        console.log('📊 Subscription Status:', subscriptionDetails.status);
        console.log('💰 Payment Details:', {
          paid_count: subscriptionDetails.paid_count,
          total_count: subscriptionDetails.total_count,
          remaining_count: subscriptionDetails.remaining_count,
        });
        console.log('📅 Subscription Dates:', {
          start_at: subscriptionDetails.start_at,
          end_at: subscriptionDetails.end_at,
          current_start: subscriptionDetails.current_start,
          current_end: subscriptionDetails.current_end,
        });

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

        // Yearly Plan: 500 credits per billing cycle (₹399/month billed yearly)
        const creditsToAdd = 500;

        // Check if subscription already exists
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('id, status')
          .eq('user_id', userId)
          .eq('external_subscription_id', subscriptionId)
          .maybeSingle();

        const subscriptionData: any = {
          user_id: userId,
          plan: 'pro',
          status: 'active', // DB enum only has 'active'; Razorpay 'authenticated' and 'active' both map to active
          provider: 'razorpay',
          product_id: 'pro_monthly',
          started_at: subscriptionStart,
          ends_at: subscriptionEnd,
          current_period_start: subscriptionStart,
          current_period_end: subscriptionEnd,
          external_subscription_id: subscriptionId,
          external_customer_id: subscriptionDetails.customer_id || userId,
          receipt_data: {
            razorpay_subscription_id: subscriptionId,
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
            // Billing period tracking for monthly renewals
            last_credit_grant_period: subscriptionDetails.paid_count || 0,
            total_credits_granted: creditsToAdd,
            last_credit_grant_date: new Date().toISOString(),
            billing_cycle: subscriptionDetails.paid_count || 1, // Current billing cycle number
          },
        };

        if (existingSubscription) {
          // Update existing subscription
          console.log('Updating existing subscription:', existingSubscription.id);
          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update(subscriptionData)
            .eq('id', existingSubscription.id);

          if (updateError) {
            console.error('Error updating subscription:', updateError);
            return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
          }

          console.log('✅ Subscription updated successfully');
        } else {
          // Create new subscription
          console.log('Creating new subscription record');
          const { data: newSubscription, error: insertError } = await supabaseAdmin
            .from('subscriptions')
            .insert(subscriptionData)
            .select()
            .single();

          if (insertError) {
            console.error('Error creating subscription:', insertError);
            return NextResponse.json({ error: 'Failed to create subscription' }, { status: 500 });
          }

          console.log('✅ Subscription created successfully:', newSubscription?.id);
        }

        // Add credits to user account (only on first activation to avoid duplicates)
        if (event === 'subscription.authenticated' || event === 'subscription.activated') {
          // Check if credits were already added for this subscription
          const { data: existingCredits } = await supabaseAdmin
            .from('credit_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('order_id', subscriptionId)
            .eq('transaction_type', 'purchase')
            .maybeSingle();

          if (!existingCredits) {
            console.log('💰 Adding credits to user account...');
            console.log('📊 Credits to add:', creditsToAdd);
            console.log('👤 User ID:', userId);
            console.log('🆔 Subscription ID:', subscriptionId);
            
            const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
              p_user_id: userId,
              p_amount: creditsToAdd,
              p_transaction_type: 'purchase',
              p_description: `Yearly Plan Subscription - ${creditsToAdd} credits per cycle`,
              p_purchase_id: subscriptionId,
              p_order_id: subscriptionId,
              p_metadata: {
                subscription_id: subscriptionId,
                plan_type: 'pro',
                subscription_start: subscriptionStart,
                subscription_end: subscriptionEnd,
                webhook_event: event,
              },
            });

            if (creditsError) {
              console.error('❌ Error adding credits:', creditsError);
              console.error('📋 Error details:', {
                code: creditsError.code,
                message: creditsError.message,
                details: creditsError.details,
              });
              // Don't fail the webhook, but log the error
            } else {
              console.log('✅ Credits added successfully!');
              console.log('💰 Credits added:', creditsToAdd);
              console.log('👤 User ID:', userId);
            }
          } else {
            console.log('Credits already added for this subscription, skipping');
          }
        }

        return NextResponse.json({ 
          success: true,
          message: 'Subscription processed successfully',
          subscription_id: subscriptionId,
        });
      }

      // Handle monthly subscription renewal (subscription.charged event)
      if (event === 'subscription.charged') {
        console.log('\n💰 ===== PROCESSING MONTHLY SUBSCRIPTION RENEWAL =====');
        console.log('📋 Event:', event);
        console.log('🆔 Subscription ID:', subscriptionId);
        console.log('👤 User ID:', userId);
        console.log('📊 Subscription Status:', subscriptionDetails.status);
        console.log('💳 Payment Details:', {
          paid_count: subscriptionDetails.paid_count,
          total_count: subscriptionDetails.total_count,
          remaining_count: subscriptionDetails.remaining_count,
        });
        console.log('📅 Current Period:', {
          current_start: subscriptionDetails.current_start,
          current_end: subscriptionDetails.current_end,
        });

        // Get existing subscription from database to check last credit grant period
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('id, status, metadata, current_period_start, current_period_end')
          .eq('user_id', userId)
          .eq('external_subscription_id', subscriptionId)
          .maybeSingle();

        if (!existingSubscription) {
          console.error('❌ Subscription not found in database for renewal:', subscriptionId);
          return NextResponse.json({ 
            error: 'Subscription not found',
            message: 'Cannot process renewal for subscription that does not exist in database'
          }, { status: 404 });
        }

        // Extract last credit grant period from metadata
        const existingMetadata = existingSubscription.metadata || {};
        const lastCreditGrantPeriod = existingMetadata.last_credit_grant_period || 0;
        const currentPaidCount = subscriptionDetails.paid_count || 0;

        console.log('📊 Credit Grant Check:', {
          last_credit_grant_period: lastCreditGrantPeriod,
          current_paid_count: currentPaidCount,
          should_grant: currentPaidCount > lastCreditGrantPeriod,
        });

        // Calculate new period dates
        const newPeriodStart = subscriptionDetails.current_start
          ? new Date(subscriptionDetails.current_start * 1000).toISOString()
          : new Date().toISOString();
        
        const newPeriodEnd = subscriptionDetails.current_end
          ? new Date(subscriptionDetails.current_end * 1000).toISOString()
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // Update subscription with new period and status
        const updatedSubscriptionData: any = {
          status: 'active', // DB enum only has 'active'; Razorpay 'authenticated' and 'active' both map to active
          current_period_start: newPeriodStart,
          current_period_end: newPeriodEnd,
          ends_at: subscriptionDetails.end_at
            ? new Date(subscriptionDetails.end_at * 1000).toISOString()
            : existingSubscription.current_period_end, // Keep existing if no end_at
          metadata: {
            ...existingMetadata,
            subscription_status: subscriptionDetails.status,
            paid_count: currentPaidCount,
            remaining_count: subscriptionDetails.remaining_count,
            current_start: subscriptionDetails.current_start,
            current_end: subscriptionDetails.current_end,
            billing_cycle: currentPaidCount,
          },
        };

        // Update subscription in database
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update(updatedSubscriptionData)
          .eq('id', existingSubscription.id);

        if (updateError) {
          console.error('❌ Error updating subscription for renewal:', updateError);
          return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
        }

        console.log('✅ Subscription updated for renewal');

        // Grant credits if this is a new billing period (paid_count increased)
        if (currentPaidCount > lastCreditGrantPeriod) {
          const creditsToAdd = 500; // Yearly plan: 500 credits per billing cycle

          // Check if credits were already added for this specific billing period
          const { data: existingCredits } = await supabaseAdmin
            .from('credit_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('order_id', subscriptionId)
            .eq('transaction_type', 'purchase')
            .contains('metadata', { subscription_period: currentPaidCount })
            .maybeSingle();

          if (!existingCredits) {
            console.log('💰 Granting monthly credits for renewal...');
            console.log('📊 Credits to add:', creditsToAdd);
            console.log('📅 Billing cycle:', currentPaidCount);
            
            const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
              p_user_id: userId,
              p_amount: creditsToAdd,
              p_transaction_type: 'purchase',
              p_description: `Yearly Plan Renewal - Billing Cycle ${currentPaidCount} (${creditsToAdd} credits)`,
              p_purchase_id: subscriptionId,
              p_order_id: subscriptionId,
              p_metadata: {
                subscription_id: subscriptionId,
                plan_type: 'pro',
                subscription_period: currentPaidCount,
                billing_cycle: currentPaidCount,
                renewal_date: new Date().toISOString(),
                period_start: newPeriodStart,
                period_end: newPeriodEnd,
                webhook_event: event,
                is_renewal: true,
              },
            });

            if (creditsError) {
              console.error('❌ Error adding renewal credits:', creditsError);
              console.error('📋 Error details:', {
                code: creditsError.code,
                message: creditsError.message,
                details: creditsError.details,
              });
              // Don't fail the webhook, but log the error
            } else {
              console.log('✅ Monthly renewal credits added successfully!');
              console.log('💰 Credits added:', creditsToAdd);
              console.log('📅 Billing cycle:', currentPaidCount);

              // Update subscription metadata with new credit grant period
              const { error: metadataUpdateError } = await supabaseAdmin
                .from('subscriptions')
                .update({
                  metadata: {
                    ...updatedSubscriptionData.metadata,
                    last_credit_grant_period: currentPaidCount,
                    total_credits_granted: (existingMetadata.total_credits_granted || 0) + creditsToAdd,
                    last_credit_grant_date: new Date().toISOString(),
                  },
                })
                .eq('id', existingSubscription.id);

              if (metadataUpdateError) {
                console.error('⚠️ Error updating credit grant metadata:', metadataUpdateError);
                // Non-critical error, continue
              }
            }
          } else {
            console.log('ℹ️ Credits already granted for billing cycle', currentPaidCount, '- skipping');
          }
        } else {
          console.log('ℹ️ No new billing period detected. Current paid_count:', currentPaidCount, 'Last grant period:', lastCreditGrantPeriod);
        }

        return NextResponse.json({ 
          success: true,
          message: 'Monthly renewal processed successfully',
          subscription_id: subscriptionId,
          billing_cycle: currentPaidCount,
          credits_granted: currentPaidCount > lastCreditGrantPeriod ? 500 : 0,
        });
      }

      // Handle subscription cancellation or other events
      if (event === 'subscription.cancelled' || event === 'subscription.completed' || event === 'subscription.expired') {
        console.log('\n🛑 ===== PROCESSING SUBSCRIPTION CANCELLATION/COMPLETION =====');
        console.log('📋 Event:', event);
        console.log('🆔 Subscription ID:', subscriptionId);
        console.log('👤 User ID:', userId);
        console.log('📊 Subscription Status:', subscriptionDetails.status);

        // Get existing subscription to preserve metadata
        const { data: existingSubscription } = await supabaseAdmin
          .from('subscriptions')
          .select('id, metadata, current_period_end, ends_at')
          .eq('user_id', userId)
          .eq('external_subscription_id', subscriptionId)
          .maybeSingle();

        const existingMetadata = existingSubscription?.metadata || {};
        
        // Calculate grace period end (current billing period end)
        // User should have access until current period ends
        const gracePeriodEnd = subscriptionDetails.current_end
          ? new Date(subscriptionDetails.current_end * 1000).toISOString()
          : existingSubscription?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        console.log('📅 Grace Period End:', gracePeriodEnd);
        console.log('📅 Current Period End from Razorpay:', subscriptionDetails.current_end);

        // Update subscription status but keep ends_at as grace period end
        const { error: updateError } = await supabaseAdmin
          .from('subscriptions')
          .update({
            status: subscriptionDetails.status,
            ends_at: gracePeriodEnd, // Set to current period end for grace period
            metadata: {
              ...existingMetadata,
              subscription_status: subscriptionDetails.status,
              cancelled_at: new Date().toISOString(),
              cancelled_reason: event,
              grace_period_end: gracePeriodEnd,
              // Preserve credit tracking info
              last_credit_grant_period: existingMetadata.last_credit_grant_period,
              total_credits_granted: existingMetadata.total_credits_granted,
            },
          })
          .eq('external_subscription_id', subscriptionId)
          .eq('user_id', userId);

        if (updateError) {
          console.error('❌ Error updating subscription status:', updateError);
          return NextResponse.json({ 
            error: 'Failed to update subscription status',
            details: updateError.message 
          }, { status: 500 });
        } else {
          console.log('✅ Subscription status updated');
          console.log('📅 Grace period ends at:', gracePeriodEnd);
          console.log('ℹ️ User will have access until grace period ends');
        }

        return NextResponse.json({ 
          success: true,
          message: 'Subscription cancellation/completion processed',
          grace_period_end: gracePeriodEnd,
        });
      }

      // For other subscription events, just acknowledge
      console.log('Subscription event acknowledged:', event);
      return NextResponse.json({ success: true });
    }

    // Handle payment events for subscriptions
    if (event.startsWith('payment.')) {
      console.log('\n💳 ===== PROCESSING PAYMENT EVENT =====');
      console.log('📋 Event:', event);
      
      const payment = payload.payment;
      
      if (!payment || !payment.id) {
        console.log('Payment event received but no payment data found');
        return NextResponse.json({ success: true, message: 'Payment event acknowledged' });
      }

      // Check if this payment is for a subscription
      if (payment.subscription_id) {
        const subscriptionId = payment.subscription_id;
        console.log('💳 Payment is for subscription:', subscriptionId);
        console.log('📊 Payment status:', payment.status);
        console.log('💰 Payment amount:', payment.amount, payment.currency);

        // For subscription payments, we handle them via subscription.charged event
        // But if payment.captured is received, we can also process it
        if (event === 'payment.captured' && payment.status === 'captured') {
          console.log('✅ Payment captured for subscription, checking if renewal credits needed...');
          
          // Get subscription details
          const userId = payment.notes?.user_id;
          if (!userId) {
            console.log('⚠️ User ID not found in payment notes, skipping credit grant');
            return NextResponse.json({ success: true, message: 'Payment acknowledged' });
          }

          // Fetch subscription to check if credits need to be granted
          try {
            const subscriptionDetails = await razorpay.subscriptions.fetch(subscriptionId);
            const currentPaidCount = subscriptionDetails.paid_count || 0;

            // Get existing subscription from database
            const { data: existingSubscription } = await supabaseAdmin
              .from('subscriptions')
              .select('id, metadata')
              .eq('user_id', userId)
              .eq('external_subscription_id', subscriptionId)
              .maybeSingle();

            if (existingSubscription) {
              const existingMetadata = existingSubscription.metadata || {};
              const lastCreditGrantPeriod = existingMetadata.last_credit_grant_period || 0;

              // Grant credits if this is a new billing period
              if (currentPaidCount > lastCreditGrantPeriod) {
                console.log('💰 Granting credits for payment.captured event...');
                // The subscription.charged event should handle this, but this is a backup
                // We'll let subscription.charged handle it to avoid duplicates
                console.log('ℹ️ Credits will be granted via subscription.charged event');
              }
            }
          } catch (error) {
            console.error('Error processing subscription payment:', error);
          }
        }

        return NextResponse.json({ success: true, message: 'Subscription payment event acknowledged' });
      }

      // Non-subscription payments are handled by verify-payment route
      console.log('Payment event is not for a subscription, acknowledging');
      return NextResponse.json({ success: true, message: 'Payment event acknowledged' });
    }

    // Unknown event type
    console.log('Unknown webhook event:', event);
    return NextResponse.json({ success: true, message: 'Event acknowledged' });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to process webhook',
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

