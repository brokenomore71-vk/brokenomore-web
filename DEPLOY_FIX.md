# Deploy the Sync Endpoint Fix

## Quick Deploy Steps

### Step 1: Commit the Changes
```bash
git add app/api/razorpay/sync-subscriptions/route.ts
git commit -m "Fix: Query only active subscriptions to avoid enum validation errors"
```

### Step 2: Push to Deploy
```bash
git push
```

If you're using Vercel, it will automatically deploy. Otherwise, deploy using your hosting platform's method.

### Step 3: Wait for Deployment
- Check your Vercel dashboard or deployment logs
- Wait for the build to complete (usually 1-2 minutes)

### Step 4: Test Again
Once deployed, test the endpoint:
```bash
SYNC_URL="https://www.brokenomore.in/api/razorpay/sync-subscriptions" \
SUBSCRIPTION_SYNC_KEY="onlyforsubscription" \
./scripts/test-sync.sh
```

---

## What Was Fixed

1. **Query Change**: Now only queries subscriptions with status `'active'` to avoid enum validation errors
2. **Removed Duplicate Code**: Cleaned up duplicate error handling
3. **Better Error Messages**: Added helpful hints in error responses

---

## Alternative: Test Locally First

If you want to test locally before deploying:

```bash
# Start your dev server
npm run dev

# In another terminal, test locally
SYNC_URL="http://localhost:3000/api/razorpay/sync-subscriptions" \
SUBSCRIPTION_SYNC_KEY="onlyforsubscription" \
./scripts/test-sync.sh
```

---

**After deployment, the sync endpoint should work correctly!** ✅

