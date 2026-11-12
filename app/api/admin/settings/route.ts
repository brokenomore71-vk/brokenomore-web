import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, verifyAdmin } from '@/lib/admin/server';

type Json = Record<string, unknown>;

const DEFAULTS = {
  allowSignups: true,
  maintenanceMode: false,
  minPasswordLength: 8,
  emailNotifications: true,
  pushNotifications: false,
};

async function readSetting(key: string): Promise<Json> {
  const { data, error } = await supabaseAdmin
    .from('app_settings')
    .select('setting_value')
    .eq('setting_key', key)
    .maybeSingle();
  if (error) throw error;
  return (data?.setting_value as Json) || {};
}

/** True when the app_settings table exists and is readable. */
async function storageReady(): Promise<boolean> {
  const { error } = await supabaseAdmin.from('app_settings').select('setting_key').limit(1);
  if (error) console.error('[admin/settings] app_settings unavailable:', error.message);
  return !error;
}

export async function GET(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  try {
    if (!(await storageReady())) {
      return NextResponse.json({ ...DEFAULTS, storageReady: false });
    }
    const [general, notifications] = await Promise.all([readSetting('general'), readSetting('notifications')]);
    return NextResponse.json({
      storageReady: true,
      allowSignups: (general.allowSignups as boolean) ?? DEFAULTS.allowSignups,
      maintenanceMode: (general.maintenanceMode as boolean) ?? DEFAULTS.maintenanceMode,
      minPasswordLength: (general.minPasswordLength as number) ?? DEFAULTS.minPasswordLength,
      emailNotifications: (notifications.emailNotifications as boolean) ?? DEFAULTS.emailNotifications,
      pushNotifications: (notifications.pushNotifications as boolean) ?? DEFAULTS.pushNotifications,
    });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const adminCheck = await verifyAdmin(request);
  if ('error' in adminCheck) return adminCheck.error;

  try {
    if (!(await storageReady())) {
      return NextResponse.json(
        { error: 'The app_settings table does not exist yet. Run supabase/app_settings.sql first.' },
        { status: 409 }
      );
    }

    const body = await request.json();
    const general: Json = {};
    const notifications: Json = {};

    if (typeof body.allowSignups === 'boolean') general.allowSignups = body.allowSignups;
    if (typeof body.maintenanceMode === 'boolean') general.maintenanceMode = body.maintenanceMode;
    if (
      typeof body.minPasswordLength === 'number' &&
      Number.isInteger(body.minPasswordLength) &&
      body.minPasswordLength >= 6 &&
      body.minPasswordLength <= 32
    ) {
      general.minPasswordLength = body.minPasswordLength;
    }
    if (typeof body.emailNotifications === 'boolean') notifications.emailNotifications = body.emailNotifications;
    if (typeof body.pushNotifications === 'boolean') notifications.pushNotifications = body.pushNotifications;

    const groups: [string, Json][] = [
      ['general', general],
      ['notifications', notifications],
    ];

    for (const [key, patch] of groups) {
      if (Object.keys(patch).length === 0) continue;
      const existing = await readSetting(key);
      const { error } = await supabaseAdmin.from('app_settings').upsert(
        { setting_key: key, setting_value: { ...existing, ...patch }, updated_by: adminCheck.user.id },
        { onConflict: 'setting_key' }
      );
      if (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
