# Credit-Based Plan System Setup Guide

This guide will help you set up the complete credit-based plan system with Supabase and Razorpay.

## Prerequisites

1. **Supabase Project** with the following:
   - `user_profiles` table (already created)
   - `user_credits` table
   - `credit_transactions` table
   - `credit_packages` table
   - `credit_purchases` table
   - Required SQL functions (see Database Setup section)

2. **Razorpay Account** with test/production keys



## Environment Variables
\\
Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key (recommended for production)

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_NqVc6wCSssskwt
RAZORPAY_KEY_SECRET=1PxsaUhEKnsgZ1jmA030SUAV
```

**Note:** 
- For production, replace test keys with production keys from Razorpay dashboard
- `SUPABASE_SERVICE_ROLE_KEY` is optional but recommended for server-side operations
- If not provided, the system will fall back to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Setup

### Required Tables

The following tables should already exist in your Supabase database:

1. **user_credits** - Stores user credit balances
2. **credit_transactions** - Logs all credit transactions
3. **credit_packages** - Defines available credit packages
4. **credit_purchases** - Tracks purchase records

### Required SQL Functions

Ensure these functions exist in your Supabase database:

1. `get_or_create_user_credits(user_id uuid)` - Ensures user has a credits record
2. `add_credits(p_user_id uuid, p_amount integer, p_transaction_type text, p_description text, p_purchase_id text, p_order_id text, p_metadata jsonb)` - Adds credits to user account
3. `consume_credits(p_user_id uuid, p_amount integer, p_consumed_for text, p_description text, p_metadata jsonb)` - Consumes credits
4. `has_sufficient_credits(p_user_id uuid, p_required integer)` - Checks if user has enough credits
5. `get_user_credit_balance(p_user_id uuid)` - Returns current credit balance

### Credit Packages Setup

Create a Pro Plan entry in the `credit_packages` table:

```sql
INSERT INTO credit_packages (
  name,
  description,
  credits,
  bonus_credits,
  price_paise,
  currency,
  is_active,
  created_at
) VALUES (
  'Pro Plan',
  '50 credits per day for 1 month',
  1500,  -- Total credits (50 * 30 days)
  0,     -- No bonus credits
  29900, -- ₹299 in paise
  'INR',
  true,
  NOW()
);
```

## Features Implemented

### 1. Free Plan
- **5 lifetime credits** - One-time activation
- No payment required
- Can only be claimed once per account
- Automatically prevents duplicate claims

### 2. Pro Plan
- **50 credits per day** for 30 days
- **1,500 total credits** given upfront
- Payment via Razorpay
- ₹299 per month
- Subscription tracking with start/end dates

### 3. Authentication Flow
- Signup/Login pages with Supabase Auth
- Automatic redirect to pricing page after login
- `returnTo` query parameter support for redirecting users back to intended pages

### 4. Dashboard
- Current credit balance display
- Plan status (Free/Pro/None)
- Subscription expiry date (for Pro Plan)
- Recent transaction history
- Quick links to upgrade/purchase plans

### 5. API Routes

#### `/api/razorpay/create-order`
- Creates Razorpay order
- Creates `credit_purchases` record
- Returns order details for frontend

#### `/api/razorpay/verify-payment`
- Verifies Razorpay payment signature
- Updates purchase status
- Calls `add_credits` function to credit user account

#### `/api/credits/claim-free`
- Checks if user already claimed free plan
- Calls `add_credits` with 5 credits
- Prevents duplicate claims

#### `/api/credits/balance`
- Returns current credit balance
- Returns recent transactions
- Returns plan status and subscription info

## Usage Flow

### For New Users:
1. Visit `/pricing` page
2. Click "Activate Free Plan" or "Buy Pro Plan"
3. Redirected to `/signin` or `/signup` if not logged in
4. After authentication, redirected back to pricing
5. Complete plan activation/purchase

### For Existing Users:
1. Visit `/dashboard` to see current balance
2. Visit `/pricing` to upgrade or claim free plan
3. Pro Plan purchase flow:
   - Click "Buy Pro Plan"
   - Razorpay checkout opens
   - Complete payment
   - Credits automatically added
   - Redirected to dashboard

## Security Notes

1. **Never expose** `RAZORPAY_KEY_SECRET` or `SUPABASE_SERVICE_ROLE_KEY` to the frontend
2. All Razorpay operations (order creation, signature verification) happen server-side only
3. Payment verification uses HMAC SHA256 signature validation
4. All API routes require authentication via Supabase JWT token

## Testing

### Test Free Plan:
1. Sign up for a new account
2. Go to `/pricing`
3. Click "Activate Free Plan"
4. Verify 5 credits are added
5. Try to claim again - should show "Already Activated"

### Test Pro Plan:
1. Use Razorpay test cards:
   - Success: `4111 1111 1111 1111`
   - Failure: `4000 0000 0000 0002`
2. Complete payment flow
3. Verify credits are added in dashboard

## Troubleshooting

### "Supabase is not configured" error:
- Check `.env.local` file exists
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- Restart development server after adding env variables

### "Failed to create order" error:
- Verify `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` are set
- Check Razorpay keys are correct (test vs production)

### "Package not found" error:
- Ensure `credit_packages` table has an active Pro Plan entry
- Check package name matches what's expected in API route

### Credits not adding:
- Verify SQL functions exist in database
- Check `add_credits` function is callable
- Review Supabase logs for RPC errors

## Production Deployment

1. Replace test Razorpay keys with production keys
2. Set `SUPABASE_SERVICE_ROLE_KEY` for better security
3. Update Razorpay webhook URLs if using webhooks
4. Test payment flow thoroughly before going live
5. Set up proper error monitoring and logging

