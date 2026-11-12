-- ============================================
-- admin_offers — offers managed from the admin console (/admin/offers)
-- Run once in the Supabase SQL editor. Safe to re-run.
--
-- Rebuilt from the columns the offer API routes read/write and the
-- constraints/indexes listed in OFFER_MANAGEMENT_DESIGN.md (main branch).
-- ============================================

CREATE TABLE IF NOT EXISTS admin_offers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id         TEXT UNIQUE,                 -- admin_offers_external_id_key
  name                TEXT NOT NULL,
  description         TEXT,
  image_url           TEXT,
  site_url            TEXT NOT NULL,
  status              TEXT NOT NULL DEFAULT 'active',
  is_enabled          BOOLEAN NOT NULL DEFAULT TRUE,
  category            TEXT,
  region              TEXT[],
  date_start          TIMESTAMPTZ,
  date_end            TIMESTAMPTZ,
  action_ranges       JSONB,
  reward_info         TEXT,
  priority            INTEGER,
  display_order       INTEGER,
  rating              NUMERIC(3, 2) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),  -- admin_offers_rating_check
  performance_metrics JSONB,
  source              TEXT NOT NULL DEFAULT 'admin',
  created_by          UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT valid_status CHECK (status IN ('active', 'inactive')),
  CONSTRAINT valid_dates  CHECK (date_start IS NULL OR date_end IS NULL OR date_end >= date_start)
);

-- Indexes used by the list/filter/sort queries
CREATE INDEX IF NOT EXISTS idx_admin_offers_active     ON admin_offers (status, is_enabled);
CREATE INDEX IF NOT EXISTS idx_admin_offers_category   ON admin_offers (category);
CREATE INDEX IF NOT EXISTS idx_admin_offers_region_gin ON admin_offers USING GIN (region);
CREATE INDEX IF NOT EXISTS idx_admin_offers_sorting    ON admin_offers (priority DESC NULLS LAST, display_order ASC NULLS LAST, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_offers_dates      ON admin_offers (date_start, date_end);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION update_admin_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS admin_offers_updated_at ON admin_offers;
CREATE TRIGGER admin_offers_updated_at
  BEFORE UPDATE ON admin_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_offers_updated_at();

-- Row Level Security
-- The admin API uses the service role key (bypasses RLS).
ALTER TABLE admin_offers ENABLE ROW LEVEL SECURITY;

-- Admin account: full access when using a normal session token.
DROP POLICY IF EXISTS "Admin manages offers" ON admin_offers;
CREATE POLICY "Admin manages offers"
  ON admin_offers
  FOR ALL
  USING ((auth.jwt() ->> 'email') = 'admin@brokenomore.in')
  WITH CHECK ((auth.jwt() ->> 'email') = 'admin@brokenomore.in');

-- Signed-in app users: read only offers that are live right now.
DROP POLICY IF EXISTS "Users read live offers" ON admin_offers;
CREATE POLICY "Users read live offers"
  ON admin_offers
  FOR SELECT
  TO authenticated
  USING (
    status = 'active'
    AND is_enabled
    AND (date_start IS NULL OR date_start <= NOW())
    AND (date_end   IS NULL OR date_end   >= NOW())
  );
