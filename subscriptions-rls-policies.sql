-- ============================================
-- RLS Policies for subscriptions table
-- ============================================
-- Run this SQL in your Supabase SQL Editor
-- This allows authenticated users to insert and update their own subscriptions
-- ============================================

-- Enable RLS on subscriptions table (if not already enabled)
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own subscription records
CREATE POLICY "Users can insert their own subscriptions"
ON subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own subscription records
CREATE POLICY "Users can read own subscriptions"
ON subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can update their own subscription records
CREATE POLICY "Users can update their own subscriptions"
ON subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Service role has full access (bypasses RLS)
-- This is typically already set, but adding for completeness
CREATE POLICY "Service role full access to subscriptions"
ON subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ============================================
-- Notes:
-- ============================================
-- 1. The service role policy allows admin operations to bypass RLS
-- 2. Users can only insert/update subscriptions where user_id matches their auth.uid()
-- 3. If you already have a "Service role full access" policy, you can skip that one
-- ============================================

