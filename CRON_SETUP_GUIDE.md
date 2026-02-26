# Cron Job Setup Guide for Subscription Sync

This guide explains how to set up a daily cron job to sync subscription statuses from Razorpay.

---

## 🎯 Option 1: Vercel Cron Jobs (Recommended if using Vercel)

Vercel provides built-in cron job support. This is the easiest option if you're deploying on Vercel.

### Step 1: Create `vercel.json`

Create a `vercel.json` file in your project root:

```json
{
  "crons": [
    {
      "path": "/api/razorpay/sync-subscriptions",
      "schedule": "0 2 * * *"
    }
  ]
}
```

**Schedule Explanation:**
- `0 2 * * *` = Every day at 2:00 AM UTC
- Format: `minute hour day month weekday`
- Examples:
  - `0 2 * * *` = Daily at 2 AM UTC
  - `0 3 * * *` = Daily at 3 AM UTC
  - `0 2 * * 1` = Every Monday at 2 AM UTC

### Step 2: Deploy to Vercel

```bash
# Deploy to Vercel
vercel --prod

# Or push to your git repository (if connected to Vercel)
git add vercel.json
git commit -m "Add daily subscription sync cron job"
git push
```

### Step 3: Verify Cron Job

1. Go to your Vercel dashboard
2. Navigate to your project → Settings → Cron Jobs
3. You should see the cron job listed
4. Check the logs after the first run

### Step 4: (Optional) Add Authorization

If you want to secure the endpoint, add a sync key:

**1. Add to `.env.local`:**
```env
SUBSCRIPTION_SYNC_KEY=your-secret-key-here-make-it-long-and-random
```

**2. Update `vercel.json` to include headers:**
```json
{
  "crons": [
    {
      "path": "/api/razorpay/sync-subscriptions",
      "schedule": "0 2 * * *",
      "headers": {
        "Authorization": "Bearer your-secret-key-here-make-it-long-and-random"
      }
    }
  ]
}
```

**⚠️ Note:** For security, use Vercel Environment Variables instead of hardcoding:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add `SUBSCRIPTION_SYNC_KEY` with your secret value
3. The endpoint will automatically read it from `process.env.SUBSCRIPTION_SYNC_KEY`

---

## 🎯 Option 2: External Cron Service (Works with any hosting)

If you're not using Vercel or want more control, use an external cron service.

### Recommended Services:
- **cron-job.org** (Free, easy to use)
- **EasyCron** (Free tier available)
- **Cronitor** (Monitoring included)
- **Uptime Robot** (Free, reliable)

### Setup with cron-job.org:

#### Step 1: Create Account
1. Go to https://cron-job.org
2. Sign up for a free account

#### Step 2: Create Cron Job
1. Click "Create cronjob"
2. Fill in the details:

**Title:** `Subscription Sync Daily`

**Address (URL):**
```
https://your-domain.com/api/razorpay/sync-subscriptions
```

**Schedule:**
- Select "Daily"
- Set time: `02:00` (2 AM)
- Timezone: Your preferred timezone

**Request Method:** `POST`

**Request Headers:**
```
Authorization: Bearer YOUR_SYNC_KEY_HERE
Content-Type: application/json
```

**Request Body:** (Leave empty or add `{}`)

#### Step 3: Add Sync Key to Environment

Add to your `.env.local`:
```env
SUBSCRIPTION_SYNC_KEY=your-secret-key-here
```

#### Step 4: Test the Cron Job
1. Click "Run now" to test
2. Check your application logs
3. Verify the sync endpoint was called

---

## 🎯 Option 3: Server Cron (Self-hosted)

If you're self-hosting on a Linux server, use system cron.

### Step 1: Create a Script

Create `scripts/sync-subscriptions.sh`:

```bash
#!/bin/bash

# Subscription Sync Script
# This script calls the sync endpoint

SYNC_URL="https://your-domain.com/api/razorpay/sync-subscriptions"
SYNC_KEY="your-secret-key-here"

# Make POST request with authorization
curl -X POST "$SYNC_URL" \
  -H "Authorization: Bearer $SYNC_KEY" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "\nHTTP Status: %{http_code}\n" \
  -s

# Log the result
echo "Sync completed at $(date)"
```

### Step 2: Make Script Executable

```bash
chmod +x scripts/sync-subscriptions.sh
```

### Step 3: Add to Crontab

```bash
# Edit crontab
crontab -e

# Add this line (runs daily at 2 AM):
0 2 * * * /path/to/your/project/scripts/sync-subscriptions.sh >> /var/log/subscription-sync.log 2>&1
```

### Step 4: Test

```bash
# Test the script manually
./scripts/sync-subscriptions.sh

# Check logs
tail -f /var/log/subscription-sync.log
```

---

## 🔐 Security Best Practices

### 1. Use Environment Variables

Never hardcode secrets in code or config files:

```env
# .env.local
SUBSCRIPTION_SYNC_KEY=your-very-long-random-secret-key-here
```

### 2. Generate a Strong Key

```bash
# Generate a random key (32 characters)
openssl rand -hex 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Rotate Keys Periodically

Change the sync key every 3-6 months for security.

### 4. Monitor Access

Check your application logs regularly to ensure:
- Only authorized cron jobs are calling the endpoint
- No unauthorized access attempts

---

## 🧪 Testing the Cron Job

### Manual Test

Test the endpoint manually before setting up the cron:

```bash
# Using curl
curl -X POST https://your-domain.com/api/razorpay/sync-subscriptions \
  -H "Authorization: Bearer YOUR_SYNC_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Using httpie (if installed)
http POST https://your-domain.com/api/razorpay/sync-subscriptions \
  Authorization:"Bearer YOUR_SYNC_KEY"
```

### Expected Response

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
    "errors": 0,
    "details": [...]
  },
  "timestamp": "2024-01-15T02:00:00.000Z"
}
```

---

## 📊 Monitoring

### 1. Check Logs

Monitor your application logs for:
- Sync job execution times
- Number of subscriptions synced
- Errors or warnings
- Credits granted

### 2. Set Up Alerts

Configure alerts for:
- Sync job failures
- High error rates
- Unusual activity

### 3. Dashboard (Optional)

Create a simple dashboard to view:
- Last sync time
- Sync statistics
- Recent sync results

---

## 🐛 Troubleshooting

### Cron Job Not Running

**Vercel:**
- Check `vercel.json` syntax
- Verify cron job appears in dashboard
- Check deployment logs

**External Service:**
- Verify URL is correct
- Check authorization header
- Test endpoint manually
- Check service status page

**Server Cron:**
- Check crontab syntax: `crontab -l`
- Verify script permissions: `ls -l script.sh`
- Check cron logs: `grep CRON /var/log/syslog`

### 401 Unauthorized

- Verify `SUBSCRIPTION_SYNC_KEY` is set correctly
- Check authorization header format
- Ensure key matches in both places

### 500 Errors

- Check application logs
- Verify environment variables are set
- Check Razorpay API credentials
- Verify Supabase connection

---

## 📅 Recommended Schedule

**Best Time:** 2:00 AM - 4:00 AM UTC
- Low traffic period
- Before business hours
- Allows time for processing

**Frequency:** Daily
- Catches missed webhooks
- Updates statuses regularly
- Grants missed credits

---

## ✅ Checklist

- [ ] Choose cron job method (Vercel/External/Server)
- [ ] Set up cron job configuration
- [ ] Generate and set `SUBSCRIPTION_SYNC_KEY`
- [ ] Test endpoint manually
- [ ] Verify cron job runs successfully
- [ ] Monitor first few runs
- [ ] Set up logging/monitoring
- [ ] Document for team

---

## 📚 Additional Resources

- **Vercel Cron Docs**: https://vercel.com/docs/cron-jobs
- **cron-job.org**: https://cron-job.org
- **Cron Expression Guide**: https://crontab.guru

---

**Need Help?** Check the implementation docs: `SUBSCRIPTION_LIFECYCLE_IMPLEMENTATION.md`

