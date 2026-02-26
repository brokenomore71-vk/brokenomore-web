# Quick Cron Job Setup

## 🚀 Fastest Setup (Vercel - Recommended)

### Step 1: Deploy `vercel.json`
The file is already created! Just deploy:

```bash
git add vercel.json
git commit -m "Add daily subscription sync cron job"
git push
```

### Step 2: Verify in Vercel Dashboard
1. Go to Vercel Dashboard → Your Project → Settings → Cron Jobs
2. You should see: "Daily at 2:00 AM UTC"
3. Done! ✅

---

## 🔐 Optional: Add Security Key

### Step 1: Generate a Key
```bash
# Generate random key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Add to Environment Variables

**Local (.env.local):**
```env
SUBSCRIPTION_SYNC_KEY=onlyforsubscription
```

**Vercel Dashboard:**
1. Go to Project Settings → Environment Variables
2. Add `SUBSCRIPTION_SYNC_KEY` with your key
3. Redeploy

---

## 🧪 Test the Endpoint

### Step-by-Step Testing Instructions

#### **Step 1: Open Terminal**
Open your terminal/command prompt in the project directory.

#### **Step 2: Set Your Domain**
Replace `your-domain.com` with your actual domain (e.g., `brokenomore.in` or `localhost:3000` for local testing):

**For Production:**
```bash
export SYNC_URL="https://brokenomore.in/api/razorpay/sync-subscriptions"
```

**For Local Testing:**
```bash
export SYNC_URL="http://localhost:3000/api/razorpay/sync-subscriptions"
```

#### **Step 3: Set Your Sync Key** (Optional but Recommended)
Use the key you set in your `.env.local` file:
```bash
export SUBSCRIPTION_SYNC_KEY="onlyforsubscription"
```

**Note:** If you haven't set a sync key, the endpoint will still work but won't be secured.

#### **Step 4: Run the Test Script**
```bash
./scripts/test-sync.sh
```

#### **Step 5: Check the Results**
You should see:
- ✅ Success message with HTTP 200 status
- 📋 Response showing sync results (number of subscriptions synced, credits granted, etc.)

---

### Alternative: Using curl Directly

If you prefer to use curl directly:

```bash
# Replace with your actual domain and key
curl -X POST https://brokenomore.in/api/razorpay/sync-subscriptions \
  -H "Authorization: Bearer onlyforsubscription" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Subscription sync completed",
  "results": {
    "total": 5,
    "updated": 2,
    "credits_granted": 1,
    "cancelled": 0,
    "expired": 0,
    "errors": 0
  },
  "timestamp": "2024-01-15T02:00:00.000Z"
}
```

---

### Quick Test (All in One Command)

**For Production:**
```bash
SYNC_URL="https://brokenomore.in/api/razorpay/sync-subscriptions" \
SUBSCRIPTION_SYNC_KEY="onlyforsubscription" \
./scripts/test-sync.sh
```

**For Local:**
```bash
SYNC_URL="http://localhost:3000/api/razorpay/sync-subscriptions" \
SUBSCRIPTION_SYNC_KEY="onlyforsubscription" \
./scripts/test-sync.sh
```

---

## 📊 What the Cron Job Does

Runs daily at **2:00 AM UTC** and:
- ✅ Syncs all subscription statuses from Razorpay
- ✅ Updates database with latest status
- ✅ Grants credits for missed renewals
- ✅ Handles cancellations and expirations
- ✅ Returns detailed sync report

---

## ⚙️ Change Schedule

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/razorpay/sync-subscriptions",
      "schedule": "0 3 * * *"  // Change to 3 AM
    }
  ]
}
```

**Common Schedules:**
- `0 2 * * *` - Daily at 2 AM UTC
- `0 3 * * *` - Daily at 3 AM UTC
- `0 2 * * 1` - Every Monday at 2 AM UTC
- `0 */6 * * *` - Every 6 hours

---

## 🐛 Troubleshooting

**Cron not running?**
- Check Vercel dashboard → Cron Jobs
- Verify `vercel.json` is deployed
- Check deployment logs

**401 Unauthorized?**
- Verify `SUBSCRIPTION_SYNC_KEY` is set
- Check authorization header format

**500 Error?**
- Check application logs
- Verify environment variables
- Check Razorpay/Supabase credentials

---

## 📚 Full Documentation

See `CRON_SETUP_GUIDE.md` for:
- External cron service setup
- Server cron setup
- Advanced configuration
- Monitoring tips

---

**That's it!** Your cron job is set up. 🎉

