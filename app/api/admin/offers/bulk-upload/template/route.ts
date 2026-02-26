import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
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

export async function GET(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    // Define column headers with descriptions
    const headers = [
      'name',                    // Required
      'site_url',                // Required
      'external_id',              // Optional
      'description',             // Optional
      'image_url',               // Optional
      'status',                  // Optional: 'active' or 'inactive'
      'is_enabled',              // Optional: 'true', 'false', 'yes', 'no', '1', '0'
      'category',                 // Optional
      'region',                  // Optional: comma-separated (e.g., "IN, US, UK")
      'date_start',              // Optional: ISO date or Excel date format
      'date_end',                // Optional: ISO date or Excel date format
      'reward_info',             // Optional
      'priority',                // Optional: integer
      'display_order',           // Optional: integer
      'rating',                  // Optional: number 0-5
    ];

    // Create sample data row with examples and notes
    const sampleRow: any = {
      name: 'Sample Offer Name',
      site_url: 'https://example.com/offer',
      external_id: 'OFFER-001',
      description: 'This is a sample offer description',
      image_url: 'https://example.com/image.jpg',
      status: 'active',
      is_enabled: 'true',
      category: 'Retail',
      region: 'IN, US, UK',
      date_start: new Date().toISOString(),
      date_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      reward_info: 'Get 20% cashback',
      priority: 0,
      display_order: 1,
      rating: 4.5,
    };

    // Create workbook
    const workbook = XLSX.utils.book_new();

    // Create worksheet with headers and sample row
    const worksheetData = [
      headers,
      Object.values(sampleRow),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Set column widths for better readability
    const columnWidths = [
      { wch: 25 }, // name
      { wch: 30 }, // site_url
      { wch: 15 }, // external_id
      { wch: 40 }, // description
      { wch: 30 }, // image_url
      { wch: 12 }, // status
      { wch: 12 }, // is_enabled
      { wch: 15 }, // category
      { wch: 20 }, // region
      { wch: 20 }, // date_start
      { wch: 20 }, // date_end
      { wch: 25 }, // reward_info
      { wch: 10 }, // priority
      { wch: 15 }, // display_order
      { wch: 10 }, // rating
    ];
    worksheet['!cols'] = columnWidths;

    // Style header row (bold)
    const headerRange = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: 'E0E0E0' } },
      };
    }

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Offers');

    // Create instructions sheet
    const instructionsData = [
      ['OFFER BULK UPLOAD TEMPLATE - INSTRUCTIONS'],
      [],
      ['REQUIRED FIELDS:'],
      ['• name: Offer name (text, required)'],
      ['• site_url: Website URL (valid URL, required)'],
      [],
      ['OPTIONAL FIELDS:'],
      ['• external_id: Unique external identifier (text, optional)'],
      ['• description: Offer description (text, optional)'],
      ['• image_url: Image URL (valid URL, optional)'],
      ['• status: Offer status (active or inactive, optional, default: active)'],
      ['• is_enabled: Enable/disable offer (true/false/yes/no/1/0, optional, default: true)'],
      ['• category: Offer category (text, optional)'],
      ['• region: Comma-separated regions (e.g., "IN, US, UK", optional)'],
      ['• date_start: Start date (ISO date or Excel date, optional)'],
      ['• date_end: End date (ISO date or Excel date, optional, must be >= date_start)'],
      ['• reward_info: Reward information (text, optional)'],
      ['• priority: Priority number (integer, optional, default: 0)'],
      ['• display_order: Display order (integer, optional)'],
      ['• rating: Rating (number 0-5, optional)'],
      [],
      ['IMPORTANT NOTES:'],
      ['1. Delete the sample row (row 2) before adding your data'],
      ['2. Keep the header row (row 1) as is'],
      ['3. Column names are case-insensitive (e.g., "Name", "name", "NAME" all work)'],
      ['4. Dates can be in ISO format (YYYY-MM-DDTHH:mm:ss.sssZ) or Excel date format'],
      ['5. Region field accepts comma-separated values (e.g., "IN, US, UK")'],
      ['6. Status must be exactly "active" or "inactive"'],
      ['7. Rating must be between 0 and 5'],
      ['8. date_end must be greater than or equal to date_start'],
      ['9. external_id must be unique (if provided)'],
      [],
      ['VALIDATION:'],
      ['• Invalid rows will be skipped with error messages'],
      ['• Valid rows will be inserted successfully'],
      ['• You will receive a report showing created, skipped, and error details'],
    ];

    const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
    instructionsSheet['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Instructions');

    // Generate Excel file buffer
    const excelBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Return file as download
    return new NextResponse(excelBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="offer-upload-template-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error: any) {
    console.error('Error generating template:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate template' },
      { status: 500 }
    );
  }
}

