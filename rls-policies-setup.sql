-- ============================================
-- RLS Policies Setup for BrokeNoMore
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This sets up Row Level Security policies to allow
-- authenticated users to manage their own credit data
-- ============================================

-- ============================================
-- 1. Enable RLS on credit_purchases table
-- ============================================
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own purchase records
CREATE POLICY "Users can insert their own purchases"
ON credit_purchases
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own purchase records
-- Using OR to allow lookup by order_id as well
CREATE POLICY "Users can view their own purchases"
ON credit_purchases
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own purchase records (for status updates)
CREATE POLICY "Users can update their own purchases"
ON credit_purchases
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 2. Enable RLS on credit_transactions table
-- ============================================
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view their own transactions"
ON credit_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: INSERT and UPDATE on credit_transactions should be done via RPC functions
-- (add_credits, consume_credits) which run with elevated privileges

-- ============================================
-- 3. Enable RLS on user_credits table
-- ============================================
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own credit balance
CREATE POLICY "Users can view their own credits"
ON user_credits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: INSERT and UPDATE on user_credits should be done via RPC functions
-- (get_or_create_user_credits, add_credits, consume_credits) which run with elevated privileges

-- ============================================
-- 4. Enable RLS on credit_packages table (read-only for users)
-- ============================================
ALTER TABLE credit_packages ENABLE ROW LEVEL SECURITY;

-- Policy: All authenticated users can view active packages
CREATE POLICY "Users can view active packages"
ON credit_packages
FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================
-- 5. Verify policies were created
-- ============================================
-- Run this to check your policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('credit_purchases', 'credit_transactions', 'user_credits', 'credit_packages')
-- ORDER BY tablename, policyname;

-- ============================================
-- Notes:
-- ============================================
-- 1. RPC functions (add_credits, consume_credits, etc.) should be created
--    with SECURITY DEFINER to bypass RLS when needed
--
-- 2. The service role key can still bypass RLS if needed for admin operations
--
-- 3. These policies ensure users can only access their own data
-- ============================================

