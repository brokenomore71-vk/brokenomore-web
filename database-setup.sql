-- ============================================
-- BrokeNoMore Credit Packages Setup
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- ============================================

-- Create Pro Plan Package
-- This will create the Pro Plan entry in credit_packages table
INSERT INTO credit_packages (
  name,
  description,
  credits,
  bonus_credits,
  price_paise,
  currency,
  is_active,
  created_at
) 
VALUES (
  'Pro Plan',
  '50 credits per day for 1 month (1,500 total credits)',
  1500,  -- Total credits (50 credits/day * 30 days)
  0,     -- No bonus credits
  29900, -- ₹299 in paise (299 * 100)
  'INR',
  true,
  NOW()
)
ON CONFLICT DO NOTHING; -- Prevents duplicate if already exists

-- Verify the package was created
SELECT * FROM credit_packages WHERE name = 'Pro Plan' AND is_active = true;

-- ============================================
-- Optional: Create Free Plan Package (if needed)
-- ============================================
-- INSERT INTO credit_packages (
--   name,
--   description,
--   credits,
--   bonus_credits,
--   price_paise,
--   currency,
--   is_active,
--   created_at
-- ) 
-- VALUES (
--   'Free Plan',
--   '5 lifetime credits',
--   5,
--   0,
--   0,  -- Free
--   'INR',
--   true,
--   NOW()
-- )
-- ON CONFLICT DO NOTHING;

