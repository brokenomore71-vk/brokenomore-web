# RLS Policies Setup Instructions

## Quick Setup

1. **Open Supabase SQL Editor**
   - Go to your Supabase Dashboard
   - Navigate to SQL Editor
   - Click "New Query"

2. **Run the RLS Policies SQL**
   - Copy the contents of `rls-policies-setup.sql`
   - Paste into the SQL Editor
   - Click "Run" or press Ctrl+Enter

3. **Verify Policies Were Created**
   - Run this query to check:
   ```sql
   SELECT schemaname, tablename, policyname, permissive, roles, cmd
   FROM pg_policies 
   WHERE tablename IN ('credit_purchases', 'credit_transactions', 'user_credits', 'credit_packages')
   ORDER BY tablename, policyname;
   ```

## What the Policies Do

### credit_purchases
- ✅ Users can **insert** their own purchase records
- ✅ Users can **view** their own purchase records
- ✅ Users can **update** their own purchase records (for status updates)

### credit_transactions
- ✅ Users can **view** their own transactions
- ⚠️ INSERT/UPDATE done via RPC functions (add_credits, consume_credits) with elevated privileges

### user_credits
- ✅ Users can **view** their own credit balance
- ⚠️ INSERT/UPDATE done via RPC functions (get_or_create_user_credits, add_credits) with elevated privileges

### credit_packages
- ✅ All authenticated users can **view** active packages (read-only)

## Important Notes

1. **RPC Functions**: The SQL functions like `add_credits`, `consume_credits`, etc. should be created with `SECURITY DEFINER` to bypass RLS when needed. This is typically already set up in your database.

2. **Service Role Key**: You don't need `SUPABASE_SERVICE_ROLE_KEY` anymore for basic operations, but it's still useful for admin operations or if RLS policies need to be bypassed.

3. **Testing**: After setting up policies, test:
   - Free plan claim (should work)
   - Pro plan purchase (should work)
   - Viewing dashboard (should show only user's data)

## Troubleshooting

### If you get "permission denied" errors:
1. Check that RLS is enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'credit_purchases';`
2. Verify policies exist: Use the verification query above
3. Check that the user is authenticated (has a valid JWT token)

### If policies don't work:
- Make sure you're using the user's JWT token in API requests (already implemented in the code)
- Check that `auth.uid()` matches `user_id` in the tables
- Verify the policies are using `TO authenticated` role

## Next Steps

After running the SQL:
1. Test the free plan claim
2. Test the Pro plan purchase flow
3. Verify the dashboard shows correct data
4. Check that users can only see their own data

