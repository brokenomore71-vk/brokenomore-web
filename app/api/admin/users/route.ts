import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdmin, sanitizeSearch } from '@/lib/admin/server';

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  try {
    const params = request.nextUrl.searchParams;
    const page = Math.max(parseInt(params.get('page') || '1') || 1, 1);
    const limit = Math.min(Math.max(parseInt(params.get('limit') || '20') || 20, 1), 100);
    const search = sanitizeSearch(params.get('search') || '');
    const sort = params.get('sort') === 'oldest' ? 'oldest' : 'newest';
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name, avatar_url, static_avatar_url, created_at', { count: 'exact' })
      .order('created_at', { ascending: sort === 'oldest' })
      .range(offset, offset + limit - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching user profiles:', error);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    const total = count || 0;
    const users = (data || []).map(({ static_avatar_url, ...u }) => ({
      ...u,
      // Fall back to the app's preset avatar when it's a full URL the web can load.
      avatar_url: u.avatar_url || (static_avatar_url?.startsWith('http') ? static_avatar_url : null),
    }));
    return NextResponse.json({
      users,
      pagination: { page, limit, total, totalPages: Math.max(Math.ceil(total / limit), 1) },
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
  }
}
