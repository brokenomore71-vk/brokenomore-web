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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { id: packageId } = await params;
    const body = await request.json();

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.credits !== undefined) updateData.credits = parseInt(body.credits);
    if (body.bonus_credits !== undefined) updateData.bonus_credits = parseInt(body.bonus_credits);
    if (body.price_paise !== undefined) updateData.price_paise = parseInt(body.price_paise);
    if (body.currency !== undefined) updateData.currency = body.currency;
    if (body.is_active !== undefined) updateData.is_active = body.is_active;

    const { data: updatedPackage, error } = await supabaseAdmin
      .from('credit_packages')
      .update(updateData)
      .eq('id', packageId)
      .select()
      .single();

    if (error) {
      console.error('Error updating package:', error);
      return NextResponse.json(
        { error: 'Failed to update package' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      package: updatedPackage,
    });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update package' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { id: packageId } = await params;

    const { error } = await supabaseAdmin
      .from('credit_packages')
      .delete()
      .eq('id', packageId);

    if (error) {
      console.error('Error deleting package:', error);
      return NextResponse.json(
        { error: 'Failed to delete package' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Package deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete package' },
      { status: 500 }
    );
  }
}
