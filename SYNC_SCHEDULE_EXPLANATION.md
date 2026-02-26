# Subscription Sync Schedule Explanation

## 🎯 How Monthly Credit Granting Works

### **Primary Method: Webhooks (Automatic)**
When a user's subscription renews monthly, Razorpay automatically:
1. Charges the user
2. Sends a `subscription.charged` webhook event
3. Our webhook handler (`/api/razorpay/webhook`) receives it
4. Credits are granted immediately (1500 credits)
5. Database is updated

**This happens automatically - no cron job needed!**

---

## 🔄 What the Sync Endpoint Does

The sync endpoint (`/api/razorpay/sync-subscriptions`) is a **backup mechanism** that:
- ✅ Catches missed webhooks (if webhook fails or is delayed)
- ✅ Updates subscription statuses from Razorpay
- ✅ Grants credits for missed renewals
- ✅ Handles cancellations and expirations
- ✅ Keeps database in sync with Razorpay

**It should run DAILY, not monthly**, because:
- Webhooks can be missed (network issues, downtime, etc.)
- Status changes need to be caught quickly
- Users expect timely updates

---

## 📅 Current Schedule

**Current:** Daily at 2:00 AM UTC (`0 2 * * *`)

This means:
- Runs every day
- At 2:00 AM UTC
- Catches any missed events from the past 24 hours

---

## ⚙️ Schedule Options

### **Option 1: Daily (Recommended) ✅**
```json
{
  "crons": [{
    "path": "/api/razorpay/sync-subscriptions",
    "schedule": "0 2 * * *"  // Daily at 2 AM UTC
  }]
}
```
**Why:** Catches missed events quickly, ensures data is always up-to-date

### **Option 2: Twice Daily**
```json
{
  "crons": [{
    "path": "/api/razorpay/sync-subscriptions",
    "schedule": "0 */12 * * *"  // Every 12 hours
  }]
}
```
**Why:** Even faster catch-up for missed events

### **Option 3: Weekly**
```json
{
  "crons": [{
    "path": "/api/razorpay/sync-subscriptions",
    "schedule": "0 2 * * 1"  // Every Monday at 2 AM UTC
  }]
}
```
**Why:** Less frequent, but still catches issues within a week

### **Option 4: Monthly (Not Recommended) ❌**
```json
{
  "crons": [{
    "path": "/api/razorpay/sync-subscriptions",
    "schedule": "0 2 1 * *"  // First day of month at 2 AM UTC
  }]
}
```
**Why NOT recommended:**
- Missed webhooks won't be caught for up to a month
- Status changes (cancellations, expirations) delayed
- Users might experience issues for weeks before sync

---

## 🎯 Recommended Setup

**Keep it DAILY** (`0 2 * * *`)

This ensures:
- ✅ Missed webhooks caught within 24 hours
- ✅ Status updates happen quickly
- ✅ Credits granted for missed renewals promptly
- ✅ Better user experience

---

## 📊 Monthly Credit Granting Flow

```
Day 1: User subscribes → 1500 credits granted
Day 30: Razorpay charges → subscription.charged webhook → 1500 credits granted
Day 60: Razorpay charges → subscription.charged webhook → 1500 credits granted
...and so on
```

**The sync endpoint is NOT responsible for monthly credits - webhooks are!**

The sync endpoint only:
- Catches missed webhooks
- Updates statuses
- Grants credits if webhook was missed

---

## ✅ Summary

- **Monthly credits:** Handled automatically by webhooks ✅
- **Sync endpoint:** Backup mechanism, should run daily ✅
- **Current schedule:** Daily at 2 AM UTC ✅ (Keep this!)

**No changes needed - your setup is correct!** 🎉

