import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdmin, hasServiceRole } from '@/lib/admin/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminCheck = await verifyAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  try {
    const { id } = await params;

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 });
    }
    if (!profile) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Auth metadata (sign-in method, last sign in) needs the service role key.
    let auth: {
      last_sign_in_at: string | null;
      provider: string | null;
      email_confirmed_at: string | null;
    } | null = null;

    if (hasServiceRole) {
      const { data } = await supabaseAdmin.auth.admin.getUserById(id);
      if (data?.user) {
        auth = {
          last_sign_in_at: data.user.last_sign_in_at ?? null,
          provider: (data.user.app_metadata?.provider as string) ?? null,
          email_confirmed_at: data.user.email_confirmed_at ?? null,
        };
      }
    }

    return NextResponse.json({ profile, auth });
  } catch (error) {
    console.error('Error fetching user details:', error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}
