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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { id: userId } = await params;

    // Fetch user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch all related data in parallel
    const [
      { data: credits, error: creditsError },
      { data: subscriptions, error: subsError },
      { data: transactions, error: transError },
      { data: purchases, error: purchasesError }
    ] = await Promise.all([
      // Fetch credit balance (use maybeSingle to handle missing records)
      supabaseAdmin
        .from('user_credits')
        .select('balance')
        .eq('user_id', userId)
        .maybeSingle(),
      
      // Fetch subscriptions
      supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      
      // Fetch recent transactions
      supabaseAdmin
        .from('credit_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20),
      
      // Fetch purchases
      supabaseAdmin
        .from('credit_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
    ]);

    // Log errors but don't fail the request
    if (creditsError) {
      console.error('Error fetching credits:', creditsError);
    }
    if (subsError) {
      console.error('Error fetching subscriptions:', subsError);
    }
    if (transError) {
      console.error('Error fetching transactions:', transError);
    }
    if (purchasesError) {
      console.error('Error fetching purchases:', purchasesError);
    }

    return NextResponse.json({
      profile,
      credit_balance: credits?.balance || 0,
      subscriptions: subscriptions || [],
      transactions: transactions || [],
      purchases: purchases || [],
    });
  } catch (error: any) {
    console.error('Error fetching user details:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch user details' },
      { status: 500 }
    );
  }
}
