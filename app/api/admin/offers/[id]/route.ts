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

    const { id } = await params;

    // Fetch offer
    // TODO: After deleted_at column is added to schema, add: .is('deleted_at', null) to exclude soft-deleted offers
    const { data: offer, error } = await supabaseAdmin
      .from('admin_offers')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(offer);
  } catch (error: any) {
    console.error('Error fetching offer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch offer' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { id } = await params;
    const body = await request.json();

    // Reject updates to external_id (immutable after creation)
    if (body.external_id !== undefined) {
      return NextResponse.json(
        { error: 'external_id is immutable and cannot be updated after creation' },
        { status: 400 }
      );
    }

    // Reject updates to performance_metrics (system-controlled)
    if (body.performance_metrics !== undefined) {
      return NextResponse.json(
        { error: 'performance_metrics is system-controlled and cannot be updated manually' },
        { status: 400 }
      );
    }

    // Verify offer exists
    // TODO: After deleted_at column is added to schema, add: .is('deleted_at', null) to exclude soft-deleted offers
    const { data: existingOffer, error: fetchError } = await supabaseAdmin
      .from('admin_offers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingOffer) {
      return NextResponse.json(
        { error: 'Offer not found or has been deleted' },
        { status: 404 }
      );
    }

    // Prepare update data (only include fields that are present in request body)
    const updateData: any = {};

    // Validate and add name if provided
    if (body.name !== undefined) {
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'name must be a non-empty string' },
          { status: 400 }
        );
      }
      updateData.name = body.name.trim();
    }

    // Validate and add site_url if provided
    if (body.site_url !== undefined) {
      if (!body.site_url || typeof body.site_url !== 'string' || body.site_url.trim().length === 0) {
        return NextResponse.json(
          { error: 'site_url must be a non-empty string' },
          { status: 400 }
        );
      }
      try {
        new URL(body.site_url);
      } catch {
        return NextResponse.json(
          { error: 'site_url must be a valid URL' },
          { status: 400 }
        );
      }
      updateData.site_url = body.site_url.trim();
    }

    // Validate and add description if provided
    if (body.description !== undefined) {
      updateData.description = body.description === null || body.description === '' 
        ? null 
        : typeof body.description === 'string' ? body.description.trim() : null;
    }

    // Validate and add image_url if provided
    if (body.image_url !== undefined) {
      if (body.image_url === null || body.image_url === '') {
        updateData.image_url = null;
      } else {
        if (typeof body.image_url !== 'string') {
          return NextResponse.json(
            { error: 'image_url must be a string' },
            { status: 400 }
          );
        }
        if (body.image_url.trim().length > 0) {
          try {
            new URL(body.image_url);
          } catch {
            return NextResponse.json(
              { error: 'image_url must be a valid URL' },
              { status: 400 }
            );
          }
          updateData.image_url = body.image_url.trim();
        } else {
          updateData.image_url = null;
        }
      }
    }

    // Validate and add status if provided
    if (body.status !== undefined) {
      if (body.status !== 'active' && body.status !== 'inactive') {
        return NextResponse.json(
          { error: "status must be either 'active' or 'inactive'" },
          { status: 400 }
        );
      }
      updateData.status = body.status;
    }

    // Validate and add is_enabled if provided
    if (body.is_enabled !== undefined) {
      updateData.is_enabled = Boolean(body.is_enabled);
    }

    // Validate and add category if provided
    if (body.category !== undefined) {
      updateData.category = body.category === null || body.category === ''
        ? null
        : typeof body.category === 'string' ? body.category.trim() : null;
    }

    // Validate and add region if provided
    if (body.region !== undefined) {
      if (body.region === null) {
        updateData.region = null;
      } else {
        if (!Array.isArray(body.region)) {
          return NextResponse.json(
            { error: 'region must be an array of strings' },
            { status: 400 }
          );
        }
        if (!body.region.every((r: any) => typeof r === 'string')) {
          return NextResponse.json(
            { error: 'region array must contain only strings' },
            { status: 400 }
          );
        }
        updateData.region = body.region.length > 0
          ? body.region.map((r: string) => r.trim()).filter((r: string) => r.length > 0)
          : null;
      }
    }

    // Validate and add dates if provided
    // Need to handle partial date updates correctly
    if (body.date_start !== undefined || body.date_end !== undefined) {
      const newDateStart = body.date_start !== undefined ? body.date_start : existingOffer.date_start;
      const newDateEnd = body.date_end !== undefined ? body.date_end : existingOffer.date_end;

      if (body.date_start !== undefined) {
        if (body.date_start === null) {
          updateData.date_start = null;
        } else {
          const startDate = new Date(body.date_start);
          if (isNaN(startDate.getTime())) {
            return NextResponse.json(
              { error: 'date_start must be a valid date' },
              { status: 400 }
            );
          }
          updateData.date_start = body.date_start;
        }
      }

      if (body.date_end !== undefined) {
        if (body.date_end === null) {
          updateData.date_end = null;
        } else {
          const endDate = new Date(body.date_end);
          if (isNaN(endDate.getTime())) {
            return NextResponse.json(
              { error: 'date_end must be a valid date' },
              { status: 400 }
            );
          }
          updateData.date_end = body.date_end;
        }
      }

      // Validate date logic: date_end >= date_start (only if both are provided)
      const finalDateStart = updateData.date_start !== undefined ? updateData.date_start : existingOffer.date_start;
      const finalDateEnd = updateData.date_end !== undefined ? updateData.date_end : existingOffer.date_end;

      if (finalDateStart && finalDateEnd) {
        const startDate = new Date(finalDateStart);
        const endDate = new Date(finalDateEnd);
        if (endDate < startDate) {
          return NextResponse.json(
            { error: 'date_end must be greater than or equal to date_start' },
            { status: 400 }
          );
        }
      }
    }

    // Validate and add action_ranges if provided
    if (body.action_ranges !== undefined) {
      updateData.action_ranges = body.action_ranges;
    }

    // Validate and add reward_info if provided
    if (body.reward_info !== undefined) {
      updateData.reward_info = body.reward_info === null || body.reward_info === ''
        ? null
        : typeof body.reward_info === 'string' ? body.reward_info.trim() : null;
    }

    // Validate and add priority if provided
    if (body.priority !== undefined) {
      if (body.priority === null) {
        updateData.priority = null;
      } else {
        const priorityNum = typeof body.priority === 'string' ? parseInt(body.priority, 10) : body.priority;
        if (isNaN(priorityNum) || !Number.isInteger(priorityNum)) {
          return NextResponse.json(
            { error: 'priority must be an integer' },
            { status: 400 }
          );
        }
        updateData.priority = priorityNum;
      }
    }

    // Validate and add display_order if provided
    if (body.display_order !== undefined) {
      if (body.display_order === null) {
        updateData.display_order = null;
      } else {
        const displayOrderNum = typeof body.display_order === 'string' ? parseInt(body.display_order, 10) : body.display_order;
        if (isNaN(displayOrderNum) || !Number.isInteger(displayOrderNum)) {
          return NextResponse.json(
            { error: 'display_order must be an integer' },
            { status: 400 }
          );
        }
        updateData.display_order = displayOrderNum;
      }
    }

    // Validate and add rating if provided
    if (body.rating !== undefined) {
      if (body.rating === null) {
        updateData.rating = null;
      } else {
        const ratingNum = typeof body.rating === 'string' ? parseFloat(body.rating) : body.rating;
        if (isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
          return NextResponse.json(
            { error: 'rating must be a number between 0 and 5' },
            { status: 400 }
          );
        }
        updateData.rating = ratingNum;
      }
    }

    // If no fields to update, return existing offer
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(existingOffer);
    }

    // Update offer in database
    // Note: updated_at is automatically updated by database trigger
    const { data: updatedOffer, error: updateError } = await supabaseAdmin
      .from('admin_offers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating offer:', updateError);

      // Handle specific database constraint violations
      if (updateError.code === '23514') {
        // Check constraint violation
        return NextResponse.json(
          { error: 'Validation failed: ' + updateError.message },
          { status: 400 }
        );
      }

      if (updateError.code === 'PGRST116') {
        // Not found
        return NextResponse.json(
          { error: 'Offer not found' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to update offer', details: updateError.message },
        { status: 500 }
      );
    }

    // Return updated offer object
    return NextResponse.json(updatedOffer);
  } catch (error: any) {
    console.error('Error updating offer:', error);

    // Handle JSON parse errors
    if (error instanceof SyntaxError || error.message?.includes('JSON')) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error.message || 'Failed to update offer' },
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

    const { id } = await params;

    // Verify offer exists
    const { data: existingOffer, error: fetchError } = await supabaseAdmin
      .from('admin_offers')
      .select('id')
      .eq('id', id)
      .single();

    if (fetchError || !existingOffer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    // Hard delete: permanently remove the offer from database
    const { error: deleteError } = await supabaseAdmin
      .from('admin_offers')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting offer:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete offer', details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Offer deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting offer:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete offer' },
      { status: 500 }
    );
  }
}

