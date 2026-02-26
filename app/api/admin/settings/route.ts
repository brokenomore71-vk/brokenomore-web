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

    // Fetch settings from database
    const { data: generalSettings } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'general')
      .single();

    const { data: notificationSettings } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'notifications')
      .single();

    const { data: paymentSettings } = await supabaseAdmin
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'payment')
      .single();

    // Merge all settings with defaults
    const general = (generalSettings?.setting_value as any) || {};
    const notifications = (notificationSettings?.setting_value as any) || {};
    const payment = (paymentSettings?.setting_value as any) || {};

    return NextResponse.json({
      allowSignups: general.allowSignups ?? true,
      maintenanceMode: general.maintenanceMode ?? false,
      emailNotifications: notifications.emailNotifications ?? true,
      pushNotifications: notifications.pushNotifications ?? false,
      minPasswordLength: general.minPasswordLength ?? 8,
      razorpayTestMode: payment.razorpayTestMode ?? (process.env.RAZORPAY_KEY_ID?.includes('test') || false),
    });
  } catch (error: any) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const adminCheck = await verifyAdmin(request);
    if ('error' in adminCheck) {
      return adminCheck.error;
    }

    const body = await request.json();

    // Validate settings
    const generalSettings: any = {};
    const notificationSettings: any = {};
    const paymentSettings: any = {};

    if (typeof body.allowSignups === 'boolean') {
      generalSettings.allowSignups = body.allowSignups;
    }
    if (typeof body.maintenanceMode === 'boolean') {
      generalSettings.maintenanceMode = body.maintenanceMode;
    }
    if (typeof body.minPasswordLength === 'number' && body.minPasswordLength >= 6 && body.minPasswordLength <= 32) {
      generalSettings.minPasswordLength = body.minPasswordLength;
    }
    if (typeof body.emailNotifications === 'boolean') {
      notificationSettings.emailNotifications = body.emailNotifications;
    }
    if (typeof body.pushNotifications === 'boolean') {
      notificationSettings.pushNotifications = body.pushNotifications;
    }
    if (typeof body.razorpayTestMode === 'boolean') {
      paymentSettings.razorpayTestMode = body.razorpayTestMode;
    }

    // Update settings in database
    const updates: Promise<any>[] = [];

    if (Object.keys(generalSettings).length > 0) {
      // Get existing general settings and merge
      const { data: existing } = await supabaseAdmin
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'general')
        .single();

      const mergedGeneral = {
        ...((existing?.setting_value as any) || {}),
        ...generalSettings,
      };

      updates.push(
        (supabaseAdmin
          .from('app_settings')
          .upsert({
            setting_key: 'general',
            setting_value: mergedGeneral,
            updated_by: adminCheck.user.id,
          }) as unknown) as Promise<any>
      );
    }

    if (Object.keys(notificationSettings).length > 0) {
      const { data: existing } = await supabaseAdmin
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'notifications')
        .single();

      const mergedNotifications = {
        ...((existing?.setting_value as any) || {}),
        ...notificationSettings,
      };

      updates.push(
        (supabaseAdmin
          .from('app_settings')
          .upsert({
            setting_key: 'notifications',
            setting_value: mergedNotifications,
            updated_by: adminCheck.user.id,
          }) as unknown) as Promise<any>
      );
    }

    if (Object.keys(paymentSettings).length > 0) {
      const { data: existing } = await supabaseAdmin
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'payment')
        .single();

      const mergedPayment = {
        ...((existing?.setting_value as any) || {}),
        ...paymentSettings,
      };

      updates.push(
        (supabaseAdmin
          .from('app_settings')
          .upsert({
            setting_key: 'payment',
            setting_value: mergedPayment,
            updated_by: adminCheck.user.id,
          }) as unknown) as Promise<any>
      );
    }

    // Execute all updates
    const results = await Promise.all(updates);

    // Check for errors
    for (const result of results) {
      if (result.error) {
        console.error('Error updating settings:', result.error);
        return NextResponse.json(
          { error: 'Failed to update settings' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
    });
  } catch (error: any) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update settings' },
      { status: 500 }
    );
  }
}
