import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const ADMIN_EMAIL = 'admin@brokenomore.in';

async function verifyAdmin(request: NextRequest): Promise<{ user: any } | { error: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }

  return { user };
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { id: userId } = await params;
    const body = await request.json();
    const { amount, description, transaction_type = 'adjustment' } = body;

    // Validate input
    if (typeof amount !== 'number' || amount === 0) {
      return NextResponse.json(
        { error: 'Invalid amount. Amount must be a non-zero number.' },
        { status: 400 }
      );
    }

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Check if user exists
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !user.user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Ensure user has credits record
    const { error: creditsError } = await supabaseAdmin.rpc('get_or_create_user_credits', {
      user_id: userId,
    });

    if (creditsError) {
      console.error('Error ensuring user credits:', creditsError);
      return NextResponse.json(
        { error: 'Failed to initialize user credits' },
        { status: 500 }
      );
    }

    // Add or subtract credits
    const adminDescription = `Admin adjustment: ${description}`;
    
    if (amount > 0) {
      // Add credits
      const { error: addError } = await supabaseAdmin.rpc('add_credits', {
        p_user_id: userId,
        p_amount: amount,
        p_transaction_type: transaction_type,
        p_description: adminDescription,
        p_purchase_id: null,
        p_order_id: null,
        p_metadata: {
          adjusted_by: adminCheck.user.email,
          adjustment_reason: description,
        },
      });

      if (addError) {
        console.error('Error adding credits:', addError);
        return NextResponse.json(
          { error: 'Failed to add credits' },
          { status: 500 }
        );
      }
    } else {
      // Consume credits (negative amount)
      const { error: consumeError } = await supabaseAdmin.rpc('consume_credits', {
        p_user_id: userId,
        p_amount: Math.abs(amount),
        p_consumed_for: 'admin_adjustment',
        p_description: adminDescription,
        p_metadata: {
          adjusted_by: adminCheck.user.email,
          adjustment_reason: description,
        },
      });

      if (consumeError) {
        console.error('Error consuming credits:', consumeError);
        return NextResponse.json(
          { error: 'Failed to adjust credits. User may not have sufficient balance.' },
          { status: 500 }
        );
      }
    }

    // Get updated balance
    const { data: balance } = await supabaseAdmin.rpc('get_user_credit_balance', {
      p_user_id: userId,
    });

    return NextResponse.json({
      success: true,
      message: `Credits ${amount > 0 ? 'added' : 'deducted'} successfully`,
      new_balance: balance || 0,
    });
  } catch (error: any) {
    console.error('Error adjusting credits:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to adjust credits' },
      { status: 500 }
    );
  }
}
