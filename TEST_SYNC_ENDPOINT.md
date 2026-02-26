# How to Test the Sync Endpoint - Step by Step

## 🎯 Quick Start

### **Method 1: Using the Test Script (Easiest)**

1. **Open Terminal** in your project folder

2. **Set your domain** (choose one):
   ```bash

helo







   # For production (your live website)
   export SYNC_URL="https://brokenomore.in/api/razorpay/sync-subscriptions"
   





   
   # OR for local testing (if running locally)
   export SYNC_URL="http://localhost:3000/api/razorpay/sync-subscriptions"
   ```

3. **Set your sync key** (from your `.env.local` file):
   ```bash
   export SUBSCRIPTION_SYNC_KEY="onlyforsubscription"
   ```

4. **Run the test script**:
   ```bash
   ./scripts/test-sync.sh
   ```

5. **Check the output** - You should see:
   - ✅ Success message
   - 📋 Response with sync results

---

### **Method 2: Using curl (Alternative)**

Copy and paste this command (replace with your actual domain):

```bash
curl -X POST https://brokenomore.in/api/razorpay/sync-subscriptions \
  -H "Authorization: Bearer onlyforsubscription" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

## 📋 What You'll See

### **Success Response:**
```json
{
  "success": true,
  "message": "Subscription sync completed",
  "results": {
    "total": 5,              // Total subscriptions checked
    "updated": 2,            // Subscriptions updated
    "credits_granted": 1,    // Credits granted for missed renewals
    "cancelled": 0,          // Cancelled subscriptions found
    "expired": 0,            // Expired subscriptions found
    "errors": 0              // Errors encountered
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### **Error Response:**
If something goes wrong, you'll see:
```json
{
  "error": "Error message here",
  "message": "Details about the error"
}
```

---

## 🔍 Troubleshooting

### **Error: "SYNC_URL not set"**
- Make sure you ran the `export SYNC_URL=...` command first

### **Error: "401 Unauthorized"**
- Check that `SUBSCRIPTION_SYNC_KEY` matches your `.env.local` file
- Make sure you exported it: `export SUBSCRIPTION_SYNC_KEY="onlyforsubscription"`

### **Error: "Connection refused" or "Could not resolve host"**
- Check your domain is correct
- For local testing, make sure your dev server is running: `npm run dev`
- For production, verify the URL is correct

### **Error: "500 Internal Server Error"**
- Check your application logs
- Verify environment variables are set correctly
- Check Razorpay and Supabase credentials

---

## ✅ Success Checklist

After running the test, you should see:
- [ ] HTTP Status: 200
- [ ] Success message displayed
- [ ] Response shows sync results
- [ ] No errors in the output

---

## 🚀 Next Steps

Once the test works:
1. ✅ The endpoint is working correctly
2. ✅ The cron job will work when deployed
3. ✅ You can manually trigger sync anytime using this command

---

**Need Help?** Check the full guide: `CRON_SETUP_GUIDE.md`

