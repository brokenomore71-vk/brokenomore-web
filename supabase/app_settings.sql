-- ============================================
-- app_settings — storage for the admin console's Settings page
-- Run once in the Supabase SQL editor.
-- (Same as the previous app-settings-table.sql, minus the old payment row.)
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Only the admin account may read/write directly. The admin API uses the
-- service role key, which bypasses RLS.
DROP POLICY IF EXISTS "Admins can manage app settings" ON app_settings;
CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'admin@brokenomore.in')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@brokenomore.in');

INSERT INTO app_settings (setting_key, setting_value, description) VALUES
  ('general', '{"allowSignups": true, "maintenanceMode": false, "minPasswordLength": 8}'::jsonb, 'General application settings'),
  ('notifications', '{"emailNotifications": true, "pushNotifications": false}'::jsonb, 'Notification preferences')
ON CONFLICT (setting_key) DO NOTHING;

CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS app_settings_updated_at ON app_settings;
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();
