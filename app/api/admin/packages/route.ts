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

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { data: packages, error } = await supabaseAdmin
      .from('credit_packages')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching packages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch packages' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      packages: packages || [],
    });
  } catch (error: any) {
    console.error('Error fetching packages:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch packages' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const body = await request.json();
    const { name, description, credits, bonus_credits, price_paise, currency, is_active } = body;

    // Validate input
    if (!name || !description || !credits || price_paise === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data: newPackage, error } = await supabaseAdmin
      .from('credit_packages')
      .insert({
        name,
        description,
        credits: parseInt(credits),
        bonus_credits: parseInt(bonus_credits || 0),
        price_paise: parseInt(price_paise),
        currency: currency || 'INR',
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating package:', error);
      return NextResponse.json(
        { error: 'Failed to create package' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      package: newPackage,
    });
  } catch (error: any) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create package' },
      { status: 500 }
    );
  }
}
