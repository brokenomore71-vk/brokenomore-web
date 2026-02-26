-- ============================================
-- App Settings Table Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);

-- Create RLS policy: Only admins can read/write settings
-- Note: This assumes admin@brokenomore.in is the admin email
-- You may need to adjust based on your admin authentication method
CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@brokenomore.in'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND auth.users.email = 'admin@brokenomore.in'
    )
  );

-- Insert default settings if they don't exist
INSERT INTO app_settings (setting_key, setting_value, description) VALUES
  ('general', '{"allowSignups": true, "maintenanceMode": false, "minPasswordLength": 8}'::jsonb, 'General application settings'),
  ('notifications', '{"emailNotifications": true, "pushNotifications": false}'::jsonb, 'Notification preferences'),
  ('payment', '{"razorpayTestMode": false}'::jsonb, 'Payment gateway settings')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_app_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON app_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_app_settings_updated_at();

-- Verify the table was created
SELECT * FROM app_settings;
