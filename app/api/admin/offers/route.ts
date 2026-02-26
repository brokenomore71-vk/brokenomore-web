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
    
    // Pagination parameters
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Filter parameters
    const status = searchParams.get('status'); // 'active' | 'inactive'
    const category = searchParams.get('category');
    const regionParam = searchParams.get('region'); // comma-separated values
    const enabled = searchParams.get('enabled'); // 'true' | 'false'
    const dateStatus = searchParams.get('dateStatus'); // 'active' | 'upcoming' | 'expired'
    const search = searchParams.get('search'); // search in name, description, external_id

    // Sort parameters
    const sortBy = searchParams.get('sortBy') || 'created_at'; // 'created_at' | 'priority' | 'display_order'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc' | 'desc'

    // Build base query
    let query = supabaseAdmin
      .from('admin_offers')
      .select('*', { count: 'exact' });

    // Apply enabled filter (if specified)
    if (enabled === 'true') {
      query = query.eq('is_enabled', true);
    } else if (enabled === 'false') {
      query = query.eq('is_enabled', false);
    }
    // If enabled is 'all' or not specified, show all offers (no filter)

    // Apply status filter
    if (status && (status === 'active' || status === 'inactive')) {
      query = query.eq('status', status);
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category);
    }

    // Apply region filter (array overlap - offers containing any of the specified regions)
    if (regionParam) {
      const regions = regionParam.split(',').map(r => r.trim()).filter(r => r.length > 0);
      if (regions.length > 0) {
        // Use array overlap operator (&&) - checks if arrays have any common elements
        query = query.contains('region', regions);
      }
    }

    // Apply search filter (name, description, external_id)
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,external_id.ilike.%${search}%`);
    }

    // Apply date status filter
    const now = new Date().toISOString();
    const needsActiveDateFilter = dateStatus === 'active';
    
    if (dateStatus === 'upcoming') {
      // Upcoming: date_start > now (date_start must exist)
      query = query.gt('date_start', now);
    } else if (dateStatus === 'expired') {
      // Expired: date_end < now (date_end must exist)
      query = query.lt('date_end', now);
    }
    // Note: 'active' date status requires complex null handling, so we filter in memory

    // Apply sorting
    const ascending = sortOrder === 'asc';
    if (sortBy === 'priority') {
      query = query.order('priority', { ascending, nullsFirst: false });
    } else if (sortBy === 'display_order') {
      query = query.order('display_order', { ascending, nullsFirst: false });
    } else {
      // Default: created_at
      query = query.order('created_at', { ascending });
    }

    // For dateStatus='active', we need to fetch more records to filter, then paginate
    // This is because we can't efficiently express "null OR <= now" in Supabase queries
    const fetchLimit = needsActiveDateFilter ? Math.max(limit * 5, 100) : limit;
    const fetchOffset = needsActiveDateFilter ? 0 : offset;
    
    // Apply pagination (will be re-applied after filtering if needed)
    query = query.range(fetchOffset, fetchOffset + fetchLimit - 1);

    // Execute query
    const { data: offers, error, count } = await query;

    if (error) {
      console.error('Error fetching offers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch offers', details: error.message },
        { status: 500 }
      );
    }

    // Apply date status 'active' filter in memory if needed (handles null dates)
    let filteredOffers = offers || [];
    if (needsActiveDateFilter) {
      const nowDate = new Date(now);
      filteredOffers = filteredOffers.filter((offer: any) => {
        const start = offer.date_start ? new Date(offer.date_start) : null;
        const end = offer.date_end ? new Date(offer.date_end) : null;
        
        // No dates = always active
        if (!start && !end) return true;
        
        // Start only = active if started
        if (start && !end) return start <= nowDate;
        
        // End only = active if not expired
        if (!start && end) return end >= nowDate;
        
        // Both dates = must be in range
        return start != null && end != null && start <= nowDate && end >= nowDate;
      });
      
      // Re-apply pagination after filtering
      filteredOffers = filteredOffers.slice(offset, offset + limit);
    }

    // Calculate pagination metadata
    // Note: With dateStatus='active' and in-memory filtering, total count is approximate
    // For accurate counts with complex filters, consider using a database function or fetching all
    let total = count || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      offers: filteredOffers,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error('Error fetching offers:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch offers' },
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

    const { user } = adminCheck;
    const body = await request.json();

    // Extract and validate required fields
    const { name, site_url } = body;
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'name is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (!site_url || typeof site_url !== 'string' || site_url.trim().length === 0) {
      return NextResponse.json(
        { error: 'site_url is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    // Validate URL format for site_url
    try {
      new URL(site_url);
    } catch {
      return NextResponse.json(
        { error: 'site_url must be a valid URL' },
        { status: 400 }
      );
    }

    // Reject performance_metrics if provided (system-controlled)
    if (body.performance_metrics !== undefined) {
      return NextResponse.json(
        { error: 'performance_metrics is system-controlled and cannot be set manually' },
        { status: 400 }
      );
    }

    // Validate and extract optional fields
    const {
      external_id,
      description,
      image_url,
      status,
      is_enabled,
      category,
      region,
      date_start,
      date_end,
      action_ranges,
      reward_info,
      priority,
      display_order,
      rating,
    } = body;

    // Validate external_id uniqueness if provided
    if (external_id !== undefined && external_id !== null) {
      if (typeof external_id !== 'string') {
        return NextResponse.json(
          { error: 'external_id must be a string' },
          { status: 400 }
        );
      }

      if (external_id.trim().length > 0) {
        const { data: existingOffer, error: checkError } = await supabaseAdmin
          .from('admin_offers')
          .select('id')
          .eq('external_id', external_id.trim())
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          // PGRST116 = no rows returned (which is what we want)
          console.error('Error checking external_id uniqueness:', checkError);
          return NextResponse.json(
            { error: 'Failed to validate external_id' },
            { status: 500 }
          );
        }

        if (existingOffer) {
          return NextResponse.json(
            { error: `external_id '${external_id}' already exists` },
            { status: 409 }
          );
        }
      }
    }

    // Validate status enum
    if (status !== undefined && status !== null) {
      if (status !== 'active' && status !== 'inactive') {
        return NextResponse.json(
          { error: "status must be either 'active' or 'inactive'" },
          { status: 400 }
        );
      }
    }

    // Validate rating range (0-5)
    if (rating !== undefined && rating !== null) {
      const ratingNum = typeof rating === 'string' ? parseFloat(rating) : rating;
      if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
        return NextResponse.json(
          { error: 'rating must be a number between 0 and 5' },
          { status: 400 }
        );
      }
    }

    // Validate date logic (date_end >= date_start if both provided)
    if (date_start && date_end) {
      const startDate = new Date(date_start);
      const endDate = new Date(date_end);

      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'date_start must be a valid date' },
          { status: 400 }
        );
      }

      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'date_end must be a valid date' },
          { status: 400 }
        );
      }

      if (endDate < startDate) {
        return NextResponse.json(
          { error: 'date_end must be greater than or equal to date_start' },
          { status: 400 }
        );
      }
    } else if (date_start && !date_end) {
      // Validate date_start format
      const startDate = new Date(date_start);
      if (isNaN(startDate.getTime())) {
        return NextResponse.json(
          { error: 'date_start must be a valid date' },
          { status: 400 }
        );
      }
    } else if (date_end && !date_start) {
      // Validate date_end format
      const endDate = new Date(date_end);
      if (isNaN(endDate.getTime())) {
        return NextResponse.json(
          { error: 'date_end must be a valid date' },
          { status: 400 }
        );
      }
    }

    // Validate image_url format if provided
    if (image_url !== undefined && image_url !== null) {
      if (typeof image_url !== 'string') {
        return NextResponse.json(
          { error: 'image_url must be a string' },
          { status: 400 }
        );
      }
      if (image_url.trim().length > 0) {
        try {
          new URL(image_url);
        } catch {
          return NextResponse.json(
            { error: 'image_url must be a valid URL' },
            { status: 400 }
          );
        }
      }
    }

    // Validate region array if provided
    if (region !== undefined && region !== null) {
      if (!Array.isArray(region)) {
        return NextResponse.json(
          { error: 'region must be an array of strings' },
          { status: 400 }
        );
      }
      if (!region.every(r => typeof r === 'string')) {
        return NextResponse.json(
          { error: 'region array must contain only strings' },
          { status: 400 }
        );
      }
    }

    // Validate numeric fields
    if (priority !== undefined && priority !== null) {
      const priorityNum = typeof priority === 'string' ? parseInt(priority, 10) : priority;
      if (isNaN(priorityNum) || !Number.isInteger(priorityNum)) {
        return NextResponse.json(
          { error: 'priority must be an integer' },
          { status: 400 }
        );
      }
    }

    if (display_order !== undefined && display_order !== null) {
      const displayOrderNum = typeof display_order === 'string' ? parseInt(display_order, 10) : display_order;
      if (isNaN(displayOrderNum) || !Number.isInteger(displayOrderNum)) {
        return NextResponse.json(
          { error: 'display_order must be an integer' },
          { status: 400 }
        );
      }
    }

    // Prepare insert data
    const insertData: any = {
      name: name.trim(),
      site_url: site_url.trim(),
      created_by: user.id,
      source: 'admin',
    };

    // Add optional fields if provided
    if (external_id !== undefined && external_id !== null && external_id.trim().length > 0) {
      insertData.external_id = external_id.trim();
    }

    if (description !== undefined && description !== null) {
      insertData.description = typeof description === 'string' ? description.trim() : null;
    }

    if (image_url !== undefined && image_url !== null && image_url.trim().length > 0) {
      insertData.image_url = image_url.trim();
    }

    if (status !== undefined && status !== null) {
      insertData.status = status;
    }

    if (is_enabled !== undefined && is_enabled !== null) {
      insertData.is_enabled = Boolean(is_enabled);
    }

    if (category !== undefined && category !== null) {
      insertData.category = typeof category === 'string' ? category.trim() : null;
    }

    if (region !== undefined && region !== null) {
      insertData.region = region.length > 0 ? region.map((r: string) => r.trim()).filter((r: string) => r.length > 0) : null;
    }

    if (date_start !== undefined && date_start !== null) {
      insertData.date_start = date_start;
    }

    if (date_end !== undefined && date_end !== null) {
      insertData.date_end = date_end;
    }

    if (action_ranges !== undefined && action_ranges !== null) {
      insertData.action_ranges = action_ranges;
    }

    if (reward_info !== undefined && reward_info !== null) {
      insertData.reward_info = typeof reward_info === 'string' ? reward_info.trim() : null;
    }

    if (priority !== undefined && priority !== null) {
      insertData.priority = typeof priority === 'string' ? parseInt(priority, 10) : priority;
    }

    if (display_order !== undefined && display_order !== null) {
      insertData.display_order = typeof display_order === 'string' ? parseInt(display_order, 10) : display_order;
    }

    if (rating !== undefined && rating !== null) {
      insertData.rating = typeof rating === 'string' ? parseFloat(rating) : rating;
    }

    // Insert offer into database
    const { data: newOffer, error: insertError } = await supabaseAdmin
      .from('admin_offers')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating offer:', insertError);
      
      // Handle specific database constraint violations
      if (insertError.code === '23505') {
        // Unique constraint violation
        return NextResponse.json(
          { error: 'external_id already exists' },
          { status: 409 }
        );
      }

      if (insertError.code === '23514') {
        // Check constraint violation
        return NextResponse.json(
          { error: 'Validation failed: ' + insertError.message },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create offer', details: insertError.message },
        { status: 500 }
      );
    }

    // Return 201 Created with full offer object
    return NextResponse.json(newOffer, { status: 201 });
  } catch (error: any) {
    console.error('Error creating offer:', error);
    
    // Handle JSON parse errors
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to create offer' },
      { status: 500 }
    );
  }
}

