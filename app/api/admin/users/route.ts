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

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const planFilter = searchParams.get('plan') || '';
    const offset = (page - 1) * limit;

    // Step 1: Fetch ALL user profiles (matching search if provided) without pagination
    let profilesQuery = supabaseAdmin
      .from('user_profiles')
      .select('id, email, full_name, avatar_url, created_at', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply search filter
    if (search) {
      profilesQuery = profilesQuery.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data: allProfiles, error: profilesError, count: totalProfilesCount } = await profilesQuery;

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: profilesError.message },
        { status: 500 }
      );
    }

    if (!allProfiles || allProfiles.length === 0) {
      return NextResponse.json({
        users: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      });
    }

    // Step 2: Get all user IDs to fetch credits and subscriptions
    const allUserIds = allProfiles.map((p: any) => p.id);

    // Step 3: Fetch credits and subscriptions for all users in parallel
    const [creditsRes, subscriptionsRes] = await Promise.all([
      supabaseAdmin
        .from('user_credits')
        .select('user_id, balance')
        .in('user_id', allUserIds),
      supabaseAdmin
        .from('subscriptions')
        .select('user_id, plan, status, ends_at')
        .in('user_id', allUserIds)
    ]);

    if (creditsRes.error) {
      console.error('Error fetching credits:', creditsRes.error);
    }

    if (subscriptionsRes.error) {
      console.error('Error fetching subscriptions:', subscriptionsRes.error);
    }

    const credits = creditsRes.data || [];
    const subscriptions = subscriptionsRes.data || [];

    // Step 4: Create maps for quick lookup
    const creditsMap = new Map();
    credits.forEach((credit: any) => {
      creditsMap.set(credit.user_id, credit.balance);
    });

    const subscriptionsMap = new Map();
    subscriptions.forEach((sub: any) => {
      if (!subscriptionsMap.has(sub.user_id) || 
          ['active', 'trialing'].includes(sub.status)) {
        subscriptionsMap.set(sub.user_id, sub);
      }
    });

    // Step 5: Combine data and determine plan types
    const now = new Date();
    let allUsers = allProfiles.map((profile: any) => {
      const subscription = subscriptionsMap.get(profile.id);
      let planType: 'free' | 'pro' | 'none' = 'none';
      
      if (subscription) {
        const isActive = subscription.status === 'active' || subscription.status === 'trialing';
        const isValidDate = !subscription.ends_at || new Date(subscription.ends_at) > now;
        
        if (isActive && isValidDate) {
          planType = subscription.plan === 'pro' ? 'pro' : 'free';
        }
      }

      return {
        id: profile.id,
        email: profile.email,
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        credit_balance: creditsMap.get(profile.id) || 0,
        plan_type: planType,
        subscription: subscription ? {
          plan: subscription.plan,
          status: subscription.status,
          ends_at: subscription.ends_at,
        } : null,
      };
    });

    // Step 6: Apply plan filter to ALL data (before pagination)
    if (planFilter) {
      allUsers = allUsers.filter((user: any) => user.plan_type === planFilter);
    }

    // Step 7: Get total count after filtering
    const totalCount = allUsers.length;

    // Step 8: Apply pagination to filtered results
    const paginatedUsers = allUsers.slice(offset, offset + limit);

    return NextResponse.json({
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch users' },
      { status: 500 }
    );
  }
}
