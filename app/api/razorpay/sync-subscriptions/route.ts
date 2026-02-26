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

/**
 * Sync Subscriptions Endpoint
 * 
 * This endpoint syncs subscription statuses from Razorpay to the database.
 * It should be called daily via cron job to catch any missed webhooks or status changes.
 * 
 * Flow:
 * 1. Fetch all active/authenticated subscriptions from database
 * 2. For each subscription, fetch latest status from Razorpay
 * 3. Compare and update if status changed
 * 4. Handle cancellations, expirations, and renewals
 * 5. Grant credits for missed renewals
 */
export async function POST(request: NextRequest) {
  try {
    console.log('\n🔄 ===== SUBSCRIPTION SYNC JOB STARTED =====');
    console.log('📅 Timestamp:', new Date().toISOString());

    // Verify service role key is configured
    if (!supabaseServiceKey || supabaseServiceKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('❌ SUPABASE_SERVICE_ROLE_KEY is not configured or is using anon key!');
      return NextResponse.json({ 
        error: 'Server configuration error',
        message: 'SUPABASE_SERVICE_ROLE_KEY must be set in environment variables'
      }, { status: 500 });
    }

    // Optional: Check for authorization header (for manual triggers)
    const authHeader = request.headers.get('authorization');
    const syncKey = process.env.SUBSCRIPTION_SYNC_KEY; // Optional sync key for security

    if (authHeader && syncKey) {
      const providedKey = authHeader.replace('Bearer ', '');
      if (providedKey !== syncKey) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    // Fetch all active subscriptions from database
    // Note: Query only 'active' status to avoid enum validation errors
    // Subscriptions with 'authenticated' status in Razorpay will be synced when we check Razorpay API
    console.log('📊 Fetching active subscriptions from database...');
    const { data: activeSubscriptions, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('id, user_id, external_subscription_id, status, metadata, current_period_start, current_period_end, ends_at')
      .eq('provider', 'razorpay')
      .eq('status', 'active'); // Only query 'active' to avoid enum validation errors

    if (fetchError) {
      console.error('❌ Error fetching subscriptions:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to fetch subscriptions',
        details: fetchError.message,
        hint: 'If subscriptions with status "authenticated" exist, they need to be updated to "active" first'
      }, { status: 500 });
    }

    if (!activeSubscriptions || activeSubscriptions.length === 0) {
      console.log('ℹ️ No active subscriptions found to sync');
      return NextResponse.json({ 
        success: true,
        message: 'No active subscriptions to sync',
        synced: 0,
      });
    }

    console.log(`📋 Found ${activeSubscriptions.length} active subscriptions to sync`);

    const syncResults = {
      total: activeSubscriptions.length,
      updated: 0,
      credits_granted: 0,
      cancelled: 0,
      expired: 0,
      errors: 0,
      details: [] as any[],
    };

    // Process each subscription
    for (const subscription of activeSubscriptions) {
      const subscriptionId = subscription.external_subscription_id;
      const userId = subscription.user_id;
      
      try {
        console.log(`\n🔄 Syncing subscription: ${subscriptionId}`);
        console.log(`👤 User ID: ${userId}`);

        // Validate subscription ID format
        // Razorpay subscription IDs start with 'sub_'
        if (!subscriptionId || !subscriptionId.startsWith('sub_')) {
          console.log(`⚠️ Invalid subscription ID format: ${subscriptionId}`);
          console.log(`   Expected format: sub_xxxxx (got: ${subscriptionId?.substring(0, 10)}...)`);
          console.log(`   This might be an order ID (order_xxx) or payment ID (pay_xxx)`);
          syncResults.errors++;
          syncResults.details.push({
            subscription_id: subscriptionId,
            status: 'error',
            error: `Invalid subscription ID format. Expected 'sub_xxx', got '${subscriptionId?.substring(0, 10)}...'`,
            hint: 'This record may need cleanup - it contains an order/payment ID instead of subscription ID',
          });
          continue; // Skip this record
        }

        // Fetch latest status from Razorpay
        let razorpaySubscription;
        try {
          razorpaySubscription = await razorpay.subscriptions.fetch(subscriptionId);
        } catch (error: any) {
          console.error(`❌ Error fetching subscription ${subscriptionId} from Razorpay:`, error);
          syncResults.errors++;
          syncResults.details.push({
            subscription_id: subscriptionId,
            status: 'error',
            error: error.message || 'Failed to fetch from Razorpay',
          });
          continue;
        }

        const razorpayStatus = razorpaySubscription.status;
        const dbStatus = subscription.status;
        const existingMetadata = subscription.metadata || {};
        const lastCreditGrantPeriod = existingMetadata.last_credit_grant_period || 0;
        const currentPaidCount = razorpaySubscription.paid_count || 0;

        console.log(`📊 Status Comparison: DB=${dbStatus}, Razorpay=${razorpayStatus}`);
        console.log(`💰 Paid Count: ${currentPaidCount}, Last Grant Period: ${lastCreditGrantPeriod}`);

        // Handle cancelled/expired subscriptions
        if (razorpayStatus === 'cancelled' || razorpayStatus === 'expired' || razorpayStatus === 'completed') {
          console.log(`🛑 Subscription ${razorpayStatus}, updating database...`);

          const gracePeriodEnd = razorpaySubscription.current_end
            ? new Date(razorpaySubscription.current_end * 1000).toISOString()
            : subscription.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

          // Map cancelled/expired statuses - ensure they're valid enum values
          // If database enum doesn't support these, we might need to use a different approach
          // For now, try to use the status as-is, but catch errors
          let dbStatus = razorpayStatus;
          
          // If enum doesn't support certain statuses, we might need to store in metadata only
          // and keep status as a supported value
          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              status: dbStatus, // Try to use Razorpay status, but enum might reject it
              ends_at: gracePeriodEnd,
              metadata: {
                ...existingMetadata,
                subscription_status: razorpayStatus, // Always store original in metadata
                cancelled_at: new Date().toISOString(),
                grace_period_end: gracePeriodEnd,
              },
            })
            .eq('id', subscription.id);

          if (updateError) {
            console.error(`❌ Error updating cancelled subscription:`, updateError);
            syncResults.errors++;
          } else {
            if (razorpayStatus === 'cancelled') syncResults.cancelled++;
            if (razorpayStatus === 'expired') syncResults.expired++;
            syncResults.updated++;
            console.log(`✅ Subscription marked as ${razorpayStatus}`);
          }

          syncResults.details.push({
            subscription_id: subscriptionId,
            status: razorpayStatus,
            action: 'cancelled/expired',
          });

          continue;
        }

        // Update subscription if status changed or period changed
        const statusChanged = razorpayStatus !== dbStatus;
        const periodChanged = 
          razorpaySubscription.current_start !== existingMetadata.current_start ||
          razorpaySubscription.current_end !== existingMetadata.current_end;

        if (statusChanged || periodChanged) {
          console.log(`🔄 Updating subscription (status changed: ${statusChanged}, period changed: ${periodChanged})`);

          const newPeriodStart = razorpaySubscription.current_start
            ? new Date(razorpaySubscription.current_start * 1000).toISOString()
            : subscription.current_period_start;

          const newPeriodEnd = razorpaySubscription.current_end
            ? new Date(razorpaySubscription.current_end * 1000).toISOString()
            : subscription.current_period_end;

          // Map Razorpay status to database enum values
          // Database enum only supports: 'active', 'created', 'pending', 'halted', etc.
          // Map 'authenticated' and 'active' both to 'active' for database
          // Store original Razorpay status in metadata for reference
          let dbStatus: string = 'active'; // Default to active
          
          if (razorpayStatus === 'active') {
            dbStatus = 'active'; // Map both to 'active' for database enum
          } else {
            // For other statuses, keep existing database status to avoid enum errors
            dbStatus = subscription.status || 'active';
          }

          const { error: updateError } = await supabaseAdmin
            .from('subscriptions')
            .update({
              status: dbStatus,
              current_period_start: newPeriodStart,
              current_period_end: newPeriodEnd,
              ends_at: razorpaySubscription.end_at
                ? new Date(razorpaySubscription.end_at * 1000).toISOString()
                : subscription.ends_at,
              metadata: {
                ...existingMetadata,
                subscription_status: razorpayStatus, // Store original Razorpay status in metadata
                paid_count: currentPaidCount,
                remaining_count: razorpaySubscription.remaining_count,
                current_start: razorpaySubscription.current_start,
                current_end: razorpaySubscription.current_end,
                billing_cycle: currentPaidCount,
              },
            })
            .eq('id', subscription.id);

          if (updateError) {
            console.error(`❌ Error updating subscription:`, updateError);
            syncResults.errors++;
          } else {
            syncResults.updated++;
            console.log(`✅ Subscription updated`);
          }
        }

        // Check if credits need to be granted for missed renewal
        if (currentPaidCount > lastCreditGrantPeriod && razorpayStatus === 'active') {
          console.log(`💰 Detected missed credit grant for billing cycle ${currentPaidCount}`);

          // Check if credits were already granted for this period
          const { data: existingCredits } = await supabaseAdmin
            .from('credit_transactions')
            .select('id')
            .eq('user_id', userId)
            .eq('order_id', subscriptionId)
            .eq('transaction_type', 'purchase')
            .contains('metadata', { subscription_period: currentPaidCount })
            .maybeSingle();

          if (!existingCredits) {
            const creditsToAdd = 500; // Yearly plan: 500 credits per billing cycle

            console.log(`💰 Granting ${creditsToAdd} credits for missed renewal...`);

            const { error: creditsError } = await supabaseAdmin.rpc('add_credits', {
              p_user_id: userId,
              p_amount: creditsToAdd,
              p_transaction_type: 'purchase',
              p_description: `Yearly Plan Renewal (Sync) - Billing Cycle ${currentPaidCount} (${creditsToAdd} credits)`,
              p_purchase_id: subscriptionId,
              p_order_id: subscriptionId,
              p_metadata: {
                subscription_id: subscriptionId,
                plan_type: 'pro',
                subscription_period: currentPaidCount,
                billing_cycle: currentPaidCount,
                renewal_date: new Date().toISOString(),
                granted_via: 'sync_job',
                is_renewal: true,
              },
            });

            if (creditsError) {
              console.error(`❌ Error granting credits:`, creditsError);
              syncResults.errors++;
            } else {
              syncResults.credits_granted++;
              console.log(`✅ Credits granted: ${creditsToAdd}`);

              // Update metadata with new credit grant period
              await supabaseAdmin
                .from('subscriptions')
                .update({
                  metadata: {
                    ...existingMetadata,
                    last_credit_grant_period: currentPaidCount,
                    total_credits_granted: (existingMetadata.total_credits_granted || 0) + creditsToAdd,
                    last_credit_grant_date: new Date().toISOString(),
                  },
                })
                .eq('id', subscription.id);
            }
          } else {
            console.log(`ℹ️ Credits already granted for billing cycle ${currentPaidCount}`);
          }
        }

        syncResults.details.push({
          subscription_id: subscriptionId,
          status: razorpayStatus,
          paid_count: currentPaidCount,
          action: statusChanged ? 'status_updated' : 'checked',
        });

      } catch (error: any) {
        console.error(`❌ Error processing subscription ${subscriptionId}:`, error);
        syncResults.errors++;
        syncResults.details.push({
          subscription_id: subscriptionId,
          status: 'error',
          error: error.message,
        });
      }
    }

    console.log('\n✅ ===== SUBSCRIPTION SYNC JOB COMPLETED =====');
    console.log('📊 Sync Results:', syncResults);

    return NextResponse.json({
      success: true,
      message: 'Subscription sync completed',
      results: syncResults,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('❌ Error in subscription sync:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to sync subscriptions',
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

export const runtime = 'nodejs';

