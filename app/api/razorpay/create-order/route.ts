import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Admin Client (for server-side operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Get Razorpay credentials (trim whitespace)
const razorpayKeyId = process.env.RAZORPAY_KEY_ID?.trim();
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET?.trim();

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
    const { package_id, plan_type } = body;

    console.log('Creating order for:', { package_id, plan_type, user_id: user.id });

    // Fetch package from credit_packages table or use default Pro Plan values
    let packages;
    let packageError;

    if (package_id) {
      const result = await supabaseAdmin
        .from('credit_packages')
        .select('*')
        .eq('id', package_id)
        .eq('is_active', true)
        .maybeSingle();
      packages = result.data;
      packageError = result.error;
    } else if (plan_type === 'pro') {
      // Try to find Pro Plan - check multiple name variations
      let result = await supabaseAdmin
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .ilike('name', '%Pro Plan%')
        .maybeSingle();
      
      // If not found, try just "Pro"
      if (!result.data && !result.error) {
        result = await supabaseAdmin
          .from('credit_packages')
          .select('*')
          .eq('is_active', true)
          .ilike('name', '%Pro%')
          .maybeSingle();
      }
      
      // If still not found, try "pro" (lowercase)
      if (!result.data && !result.error) {
        result = await supabaseAdmin
          .from('credit_packages')
          .select('*')
          .eq('is_active', true)
          .ilike('name', '%pro%')
          .maybeSingle();
      }
      
      packages = result.data;
      packageError = result.error;

      // If no package found in database, use default Pro Plan values
      if (!packages && !packageError) {
        console.warn('No Pro Plan found in credit_packages table. Using default values.');
        packages = {
          id: 'default-pro-plan',
          name: 'Pro Plan',
          description: '50 credits per day for 1 month',
          credits: 1500,
          bonus_credits: 0,
          price_paise: 29900,
          currency: 'INR',
          is_active: true,
        };
      }
    } else if (plan_type === 'pro_one_month') {
      // One-month Pro plan: one-shot payment ₹499, 1500 credits
      let result = await supabaseAdmin
        .from('credit_packages')
        .select('*')
        .eq('is_active', true)
        .or('name.ilike.%Pro 1 Month%,name.ilike.%Pro One Month%,name.ilike.%499%')
        .maybeSingle();
      packages = result.data;
      packageError = result.error;
      if (!packages && !packageError) {
        packages = {
          id: 'default-pro-one-month',
          name: 'Pro Plan (1 Month)',
          description: '50 credits per day for 1 month - one-time payment',
          credits: 1500,
          bonus_credits: 0,
          price_paise: 49900,
          currency: 'INR',
          is_active: true,
        };
      }
    } else {
      return NextResponse.json({ error: 'Invalid package_id or plan_type' }, { status: 400 });
    }

    if (packageError) {
      console.error('Error fetching package:', packageError);
      // If it's a table not found error, use default values
      if (packageError.code === 'PGRST116' || packageError.message?.includes('does not exist')) {
        console.warn('credit_packages table may not exist. Using default plan values.');
        if (plan_type === 'pro') {
          packages = {
            id: 'default-pro-plan',
            name: 'Pro Plan',
            description: '50 credits per day for 1 month',
            credits: 1500,
            bonus_credits: 0,
            price_paise: 29900,
            currency: 'INR',
            is_active: true,
          };
        } else if (plan_type === 'pro_one_month') {
          packages = {
            id: 'default-pro-one-month',
            name: 'Pro Plan (1 Month)',
            description: '50 credits per day for 1 month - one-time payment',
            credits: 1500,
            bonus_credits: 0,
            price_paise: 49900,
            currency: 'INR',
            is_active: true,
          };
        }
      } else {
        return NextResponse.json({ 
          error: 'Failed to fetch package',
          details: packageError.message,
          code: packageError.code
        }, { status: 500 });
      }
    }

    if (!packages) {
      return NextResponse.json({ 
        error: 'Package not found',
        message: 'No active Pro Plan found in credit_packages table.',
        suggestion: 'Please create a package in credit_packages table with: name="Pro Plan" (or containing "Pro"), credits=1500, price_paise=29900, currency="INR", is_active=true',
        sql_example: `INSERT INTO credit_packages (name, description, credits, bonus_credits, price_paise, currency, is_active, created_at) VALUES ('Pro Plan', '50 credits per day for 1 month', 1500, 0, 29900, 'INR', true, NOW());`
      }, { status: 404 });
    }

    // Calculate total credits (base + bonus)
    const totalCredits = packages.credits + (packages.bonus_credits || 0);
    const amountInPaise = packages.price_paise;

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

    // Create Razorpay instance with validated credentials (create fresh instance each time)
    const razorpayInstance = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });

    // Create Razorpay order
    let razorpayOrder;
    try {
      console.log('Creating Razorpay order with:', {
        amount: amountInPaise,
        currency: packages.currency || 'INR',
        key_id_prefix: razorpayKeyId.substring(0, 12) + '...'
      });
      
      // Create a shorter receipt (Razorpay requires max 40 characters)
      // Format: ord_<short_user_id>_<timestamp>
      const shortUserId = user.id.substring(0, 8); // First 8 chars of UUID
      const timestamp = Date.now().toString().slice(-8); // Last 8 digits of timestamp
      const receipt = `ord_${shortUserId}_${timestamp}`; // Max ~25 chars
      
      razorpayOrder = await razorpayInstance.orders.create({
        amount: amountInPaise,
        currency: packages.currency || 'INR',
        receipt: receipt,
        notes: {
          user_id: user.id,
          package_id: packages.id,
          credits: totalCredits,
        },
      });
    } catch (razorpayError: any) {
      console.error('Razorpay API Error:', {
        statusCode: razorpayError.statusCode,
        error: razorpayError.error,
        message: razorpayError.message,
        key_id: razorpayKeyId?.substring(0, 10) + '...', // Log partial key for debugging
      });
      
      if (razorpayError.statusCode === 401) {
        return NextResponse.json({ 
          error: 'Razorpay authentication failed',
          message: 'Invalid Razorpay credentials. Please check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env.local file.',
          details: razorpayError.error?.description || 'Authentication failed',
          code: razorpayError.error?.code || 'BAD_REQUEST_ERROR',
          hint: 'Make sure your RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET match and are from the same Razorpay account.'
        }, { status: 401 });
      }
      
      return NextResponse.json({
        error: 'Razorpay API error',
        message: razorpayError.error?.description || razorpayError.message || 'Failed to create Razorpay order',
        statusCode: razorpayError.statusCode,
        code: razorpayError.error?.code
      }, { status: razorpayError.statusCode || 500 });
    }

    // Create credit_purchases record
    // First try with user's JWT token (uses anon key but with user context for RLS)
    const supabaseUser = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    });
    
    // Check if we have service role key (bypasses RLS)
    const hasServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY && 
                               process.env.SUPABASE_SERVICE_ROLE_KEY !== process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If using default package, set package_id to null or handle it appropriately
    const purchaseData: any = {
      user_id: user.id,
      credits_purchased: totalCredits,
      base_credits: packages.credits,
      bonus_credits: packages.bonus_credits || 0,
      amount_paid_paise: amountInPaise,
      currency: packages.currency || 'INR',
      payment_provider: 'razorpay',
      order_id: razorpayOrder.id,
      payment_status: 'pending',
      metadata: {
        razorpay_order_id: razorpayOrder.id,
        plan_type: plan_type || 'pro',
        package_name: packages.name,
        is_default_package: packages.id === 'default-pro-plan' || packages.id === 'default-pro-one-month',
      },
    };

    // Only add package_id if it's a valid UUID (not a default string id)
    const isDefaultPackage = packages.id === 'default-pro-plan' || packages.id === 'default-pro-one-month';
    if (packages.id && !isDefaultPackage) {
      purchaseData.package_id = packages.id;
    }

    // Try with user context first (respects RLS)
    let purchase;
    let purchaseError;
    
    const userResult = await supabaseUser
      .from('credit_purchases')
      .insert(purchaseData)
      .select()
      .single();
    
    purchase = userResult.data;
    purchaseError = userResult.error;

    console.log('Purchase insert result (user context):', {
      success: !!purchase,
      error: purchaseError?.code,
      purchase_id: purchase?.id
    });

    // If RLS blocks it, try with admin client (bypasses RLS if service role key is set)
    if (purchaseError && purchaseError.code === '42501') {
      console.warn('RLS blocked insert, trying with admin client...');
      
      if (hasServiceRoleKey) {
        // Use service role key to bypass RLS
        const adminResult = await supabaseAdmin
          .from('credit_purchases')
          .insert(purchaseData)
          .select()
          .single();
        
        purchase = adminResult.data;
        purchaseError = adminResult.error;
        console.log('Purchase insert result (admin context):', {
          success: !!purchase,
          error: purchaseError?.code,
          purchase_id: purchase?.id
        });
      } else {
        // No service role key, can't bypass RLS
        console.error('RLS blocked and no service role key available');
        purchaseError = {
          ...purchaseError,
          message: 'RLS policy blocked insert. Set SUPABASE_SERVICE_ROLE_KEY in .env.local to bypass RLS for server operations.',
        };
      }
    }

    if (purchaseError) {
      console.error('Error creating purchase record:', purchaseError);
      // If it's a foreign key constraint error, try without package_id
      if (purchaseError.code === '23503' || purchaseError.message?.includes('foreign key')) {
        delete purchaseData.package_id;
        const retryResult = await supabaseAdmin
          .from('credit_purchases')
          .insert(purchaseData)
          .select()
          .single();
        
        if (retryResult.error) {
          return NextResponse.json({ 
            error: 'Failed to create purchase record',
            details: retryResult.error.message 
          }, { status: 500 });
        }
        
        return NextResponse.json({
          order_id: razorpayOrder.id,
          amount: amountInPaise,
          currency: packages.currency || 'INR',
          razorpay_key_id: process.env.RAZORPAY_KEY_ID,
          purchase_id: retryResult.data.id,
        });
      }
      return NextResponse.json({ 
        error: 'Failed to create purchase record',
        details: purchaseError.message 
      }, { status: 500 });
    }

    // Ensure purchase was created
    if (!purchase || !purchase.id) {
      console.error('Purchase record was not created successfully');
      return NextResponse.json({
        error: 'Failed to create purchase record',
        message: 'Purchase record was not created. Please try again.',
        order_id: razorpayOrder.id, // Still return order_id so user can retry
      }, { status: 500 });
    }

    return NextResponse.json({
      order_id: razorpayOrder.id,
      amount: amountInPaise,
      currency: packages.currency || 'INR',
      razorpay_key_id: process.env.RAZORPAY_KEY_ID,
      purchase_id: purchase.id,
      purchase_created: true, // Flag to confirm purchase was created
    });
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create order',
        type: error.constructor.name,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Ensure the route is properly exported
export const runtime = 'nodejs';

