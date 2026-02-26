import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
// Note: Install 'xlsx' package for Excel parsing: npm install xlsx
import * as XLSX from 'xlsx';

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

// Normalize column names (case-insensitive, trim whitespace)
function normalizeColumnName(name: string): string {
  return name.toLowerCase().trim();
}

// Map Excel column to database field
function mapColumnToField(columnName: string): string | null {
  const normalized = normalizeColumnName(columnName);
  
  // Map common variations
  const columnMap: Record<string, string> = {
    'name': 'name',
    'site_url': 'site_url',
    'site url': 'site_url',
    'external_id': 'external_id',
    'external id': 'external_id',
    'description': 'description',
    'image_url': 'image_url',
    'image url': 'image_url',
    'status': 'status',
    'is_enabled': 'is_enabled',
    'is enabled': 'is_enabled',
    'enabled': 'is_enabled',
    'category': 'category',
    'region': 'region',
    'regions': 'region',
    'date_start': 'date_start',
    'date start': 'date_start',
    'start date': 'date_start',
    'date_end': 'date_end',
    'date end': 'date_end',
    'end date': 'date_end',
    'action_ranges': 'action_ranges',
    'action ranges': 'action_ranges',
    'reward_info': 'reward_info',
    'reward info': 'reward_info',
    'priority': 'priority',
    'display_order': 'display_order',
    'display order': 'display_order',
    'rating': 'rating',
  };

  return columnMap[normalized] || null;
}

// Validate and parse a single row
function validateRow(row: any, rowIndex: number, columnMap: Record<string, string>): { data: any; errors: string[] } {
  const errors: string[] = [];
  const data: any = {};

  // Required fields
  const name = row[columnMap.name];
  const siteUrl = row[columnMap.site_url];

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    errors.push('name is required and must be a non-empty string');
  } else {
    data.name = name.trim();
  }

  if (!siteUrl || typeof siteUrl !== 'string' || siteUrl.trim().length === 0) {
    errors.push('site_url is required and must be a non-empty string');
  } else {
    try {
      new URL(siteUrl);
      data.site_url = siteUrl.trim();
    } catch {
      errors.push('site_url must be a valid URL');
    }
  }

  // Optional fields
  if (columnMap.external_id && row[columnMap.external_id] !== undefined && row[columnMap.external_id] !== null && row[columnMap.external_id] !== '') {
    const externalId = String(row[columnMap.external_id]).trim();
    if (externalId.length > 0) {
      data.external_id = externalId;
    }
  }

  if (columnMap.description && row[columnMap.description] !== undefined && row[columnMap.description] !== null && row[columnMap.description] !== '') {
    data.description = String(row[columnMap.description]).trim();
  }

  if (columnMap.image_url && row[columnMap.image_url] !== undefined && row[columnMap.image_url] !== null && row[columnMap.image_url] !== '') {
    const imageUrl = String(row[columnMap.image_url]).trim();
    if (imageUrl.length > 0) {
      try {
        new URL(imageUrl);
        data.image_url = imageUrl;
      } catch {
        errors.push('image_url must be a valid URL');
      }
    }
  }

  if (columnMap.status && row[columnMap.status] !== undefined && row[columnMap.status] !== null && row[columnMap.status] !== '') {
    const status = String(row[columnMap.status]).trim().toLowerCase();
    if (status === 'active' || status === 'inactive') {
      data.status = status;
    } else {
      errors.push(`status must be 'active' or 'inactive'`);
    }
  }

  if (columnMap.is_enabled && row[columnMap.is_enabled] !== undefined && row[columnMap.is_enabled] !== null && row[columnMap.is_enabled] !== '') {
    const enabled = String(row[columnMap.is_enabled]).trim().toLowerCase();
    if (enabled === 'true' || enabled === '1' || enabled === 'yes') {
      data.is_enabled = true;
    } else if (enabled === 'false' || enabled === '0' || enabled === 'no') {
      data.is_enabled = false;
    }
    // Otherwise, use default (true)
  }

  if (columnMap.category && row[columnMap.category] !== undefined && row[columnMap.category] !== null && row[columnMap.category] !== '') {
    data.category = String(row[columnMap.category]).trim();
  }

  if (columnMap.region && row[columnMap.region] !== undefined && row[columnMap.region] !== null && row[columnMap.region] !== '') {
    const regionStr = String(row[columnMap.region]).trim();
    if (regionStr.length > 0) {
      data.region = regionStr.split(',').map((r: string) => r.trim()).filter((r: string) => r.length > 0);
    }
  }

  // Date parsing
  if (columnMap.date_start && row[columnMap.date_start] !== undefined && row[columnMap.date_start] !== null && row[columnMap.date_start] !== '') {
    const dateValue = row[columnMap.date_start];
    let parsedDate: Date | null = null;
    
    // Check if it's an Excel serial date number
    if (typeof dateValue === 'number') {
      // Excel date serial number (days since 1900-01-01)
      // Convert Excel serial date to JavaScript Date
      // Excel epoch is 1900-01-01, but Excel incorrectly treats 1900 as a leap year
      const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
      parsedDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
    } else if (dateValue instanceof Date) {
      // Already a Date object
      parsedDate = dateValue;
    } else {
      // Try parsing as ISO string or other date format
      parsedDate = new Date(dateValue);
    }
    
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      data.date_start = parsedDate.toISOString();
    } else {
      errors.push('date_start must be a valid date');
    }
  }

  if (columnMap.date_end && row[columnMap.date_end] !== undefined && row[columnMap.date_end] !== null && row[columnMap.date_end] !== '') {
    const dateValue = row[columnMap.date_end];
    let parsedDate: Date | null = null;
    
    // Check if it's an Excel serial date number
    if (typeof dateValue === 'number') {
      // Excel date serial number (days since 1900-01-01)
      const excelEpoch = new Date(1899, 11, 30); // Dec 30, 1899
      parsedDate = new Date(excelEpoch.getTime() + dateValue * 86400000);
    } else if (dateValue instanceof Date) {
      // Already a Date object
      parsedDate = dateValue;
    } else {
      // Try parsing as ISO string or other date format
      parsedDate = new Date(dateValue);
    }
    
    if (parsedDate && !isNaN(parsedDate.getTime())) {
      data.date_end = parsedDate.toISOString();
    } else {
      errors.push('date_end must be a valid date');
    }
  }

  // Validate date logic
  if (data.date_start && data.date_end) {
    const startDate = new Date(data.date_start);
    const endDate = new Date(data.date_end);
    if (endDate < startDate) {
      errors.push('date_end must be greater than or equal to date_start');
    }
  }

  if (columnMap.reward_info && row[columnMap.reward_info] !== undefined && row[columnMap.reward_info] !== null && row[columnMap.reward_info] !== '') {
    data.reward_info = String(row[columnMap.reward_info]).trim();
  }

  if (columnMap.priority && row[columnMap.priority] !== undefined && row[columnMap.priority] !== null && row[columnMap.priority] !== '') {
    const priority = typeof row[columnMap.priority] === 'number' ? row[columnMap.priority] : parseInt(String(row[columnMap.priority]), 10);
    if (!isNaN(priority) && Number.isInteger(priority)) {
      data.priority = priority;
    } else {
      errors.push('priority must be an integer');
    }
  }

  if (columnMap.display_order && row[columnMap.display_order] !== undefined && row[columnMap.display_order] !== null && row[columnMap.display_order] !== '') {
    const displayOrder = typeof row[columnMap.display_order] === 'number' ? row[columnMap.display_order] : parseInt(String(row[columnMap.display_order]), 10);
    if (!isNaN(displayOrder) && Number.isInteger(displayOrder)) {
      data.display_order = displayOrder;
    } else {
      errors.push('display_order must be an integer');
    }
  }

  if (columnMap.rating && row[columnMap.rating] !== undefined && row[columnMap.rating] !== null && row[columnMap.rating] !== '') {
    const rating = typeof row[columnMap.rating] === 'number' ? row[columnMap.rating] : parseFloat(String(row[columnMap.rating]));
    if (!isNaN(rating) && rating >= 0 && rating <= 5) {
      data.rating = rating;
    } else {
      errors.push('rating must be a number between 0 and 5');
    }
  }

  // Note: action_ranges and performance_metrics are not included in Excel template

  return { data, errors };
}

export async function POST(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const { user } = adminCheck;

    // Parse multipart/form-data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Please upload an Excel file.' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a .xlsx or .xls file.' },
        { status: 400 }
      );
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'buffer' });

    // Get first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: 'Excel file is empty or has no sheets.' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];
    // Use raw: true to get actual values, then parse dates manually
    const rows = XLSX.utils.sheet_to_json(worksheet, { raw: true, defval: null });

    if (rows.length === 0) {
      return NextResponse.json(
        { error: 'Excel file has no data rows.' },
        { status: 400 }
      );
    }

    // Map headers to database fields
    const headers = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' })[0] as string[];
    const columnMap: Record<string, string> = {};

    headers.forEach((header, index) => {
      const field = mapColumnToField(header);
      if (field) {
        columnMap[field] = header;
      }
    });

    // Validate required columns
    if (!columnMap.name || !columnMap.site_url) {
      return NextResponse.json(
        { error: 'Excel file must contain "name" and "site_url" columns.' },
        { status: 400 }
      );
    }

    // Process rows
    const results: Array<{ row: number; external_id?: string; errors: string[]; data?: any }> = [];
    let created = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i] as any;
      const rowNumber = i + 2; // +2 because Excel rows start at 1 and we skip header

      const { data: offerData, errors } = validateRow(row, rowNumber, columnMap);

      if (errors.length > 0) {
        results.push({
          row: rowNumber,
          external_id: offerData.external_id,
          errors,
        });
        continue;
      }

      // Check for duplicate external_id if provided
      if (offerData.external_id) {
        const { data: existingOffer } = await supabaseAdmin
          .from('admin_offers')
          .select('id')
          .eq('external_id', offerData.external_id)
          .single();

        if (existingOffer) {
          results.push({
            row: rowNumber,
            external_id: offerData.external_id,
            errors: [`external_id '${offerData.external_id}' already exists`],
          });
          continue;
        }
      }

      // Prepare insert data
      const insertData: any = {
        ...offerData,
        created_by: user.id,
        source: 'admin',
      };

      // Insert offer (one at a time for partial success)
      const { error: insertError } = await supabaseAdmin
        .from('admin_offers')
        .insert(insertData);

      if (insertError) {
        const errorMessages: string[] = [];
        
        if (insertError.code === '23505') {
          // Unique constraint violation
          errorMessages.push(`external_id '${offerData.external_id || 'N/A'}' already exists`);
        } else if (insertError.code === '23514') {
          // Check constraint violation
          errorMessages.push('Validation failed: ' + insertError.message);
        } else {
          errorMessages.push(insertError.message || 'Failed to insert row');
        }

        results.push({
          row: rowNumber,
          external_id: offerData.external_id,
          errors: errorMessages,
        });
      } else {
        created++;
      }
    }

    return NextResponse.json({
      success: true,
      created,
      skipped: results.length,
      errors: results,
    });
  } catch (error: any) {
    console.error('Error processing bulk upload:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process bulk upload' },
      { status: 500 }
    );
  }
}


