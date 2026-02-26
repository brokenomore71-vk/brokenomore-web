# Subscription Lifecycle Management Plan

## Overview
This document outlines the industry-standard approach for managing subscription lifecycles, including monthly credit granting, status monitoring, cancellation handling, and renewal processing.

---

## 1. Subscription Status Monitoring

### 1.1 Real-time Webhook Events (Primary Method)
**Current Implementation**: ✅ Webhook exists at `/api/razorpay/webhook`

**Events to Handle**:
- `subscription.authenticated` - First payment successful
- `subscription.activated` - Subscription is active
- `subscription.charged` - **NEW**: Monthly payment successful (renewal)
- `subscription.cancelled` - User cancelled subscription
- `subscription.completed` - Subscription ended naturally
- `subscription.expired` - Subscription expired
- `subscription.paused` - Subscription paused
- `payment.authorized` - Payment authorized (for subscriptions)

### 1.2 Scheduled Sync Job (Backup Method)
**Purpose**: Periodic check to catch missed webhooks or status changes

**Implementation**:
- API endpoint: `/api/razorpay/sync-subscriptions`
- Run via cron job (daily at 2 AM) or Vercel Cron
- Checks all active subscriptions in database
- Fetches latest status from Razorpay
- Updates database if status changed
- Handles expired/cancelled subscriptions

**Logic**:
```typescript
1. Fetch all subscriptions with status 'active' or 'authenticated'
2. For each subscription:
   - Fetch current status from Razorpay API
   - Compare with database status
   - If different, update database
   - If cancelled/expired, update status and end date
   - If payment failed, handle accordingly
```

---

## 2. Monthly Credit Granting Logic

### 2.1 Credit Granting Rules

**Initial Subscription (First Month)**:
- Grant 1500 credits when subscription status becomes `authenticated` or `active`
- One-time grant on subscription activation

**Monthly Renewals**:
- Grant 1500 credits when `subscription.charged` event is received
- Grant credits when `paid_count` increases in Razorpay
- Track last credit grant to prevent duplicates

### 2.2 Duplicate Prevention

**Method**: Track credit grants per billing cycle
- Store `last_credit_grant_period` in subscription metadata
- Compare with current `paid_count` from Razorpay
- Only grant if `paid_count > last_credit_grant_period`

**Database Tracking**:
```sql
-- Add to subscription metadata:
{
  "last_credit_grant_period": 1,  // Last paid_count when credits were granted
  "total_credits_granted": 1500,  // Total credits granted so far
  "last_credit_grant_date": "2024-01-15T10:00:00Z"
}
```

---

## 3. Subscription Status Handling

### 3.1 Status Flow

```
created → authenticated → active → [charged (monthly)] → active
                                    ↓
                              cancelled/expired/completed
```

### 3.2 Status Actions

| Status | Action | Credits | Access |
|--------|--------|---------|--------|
| `created` | Wait for payment | None | No Pro features |
| `authenticated` | Grant initial credits | 1500 | Pro features enabled |
| `active` | Continue service | Monthly: 1500 | Pro features enabled |
| `cancelled` | Stop future credits | None | Grace period (current period ends) |
| `expired` | Revoke access | None | No Pro features |
| `completed` | Subscription ended | None | No Pro features |

### 3.3 Grace Period Handling

**Industry Standard**: Allow access until current billing period ends
- If cancelled on day 10 of 30-day cycle, access continues until day 30
- Update `ends_at` to `current_period_end` from Razorpay
- Don't grant credits after cancellation date

---

## 4. Payment Event Handling

### 4.1 Payment Success (Renewal)

**Event**: `subscription.charged` or `payment.captured` (for subscription)

**Actions**:
1. Fetch subscription from Razorpay to get updated `paid_count`
2. Check if credits already granted for this period
3. If `paid_count` increased, grant 1500 credits
4. Update subscription `current_period_start` and `current_period_end`
5. Update `ends_at` to new period end date
6. Log credit transaction

### 4.2 Payment Failure

**Event**: `subscription.payment_failed`

**Actions**:
1. Update subscription status to `past_due` (if supported) or keep `active`
2. Log payment failure in metadata
3. Send notification to user (optional)
4. Allow grace period (e.g., 3 days)
5. After grace period, mark as `cancelled` or `expired`

---

## 5. Implementation Components

### 5.1 Enhanced Webhook Handler

**File**: `/app/api/razorpay/webhook/route.ts`

**New Events to Handle**:
- `subscription.charged` - Monthly payment successful
- `subscription.payment_failed` - Payment failed
- `payment.captured` (for subscriptions) - Payment captured

**Logic**:
```typescript
// On subscription.charged:
1. Fetch subscription from Razorpay
2. Get current paid_count
3. Check last_credit_grant_period from metadata
4. If paid_count > last_credit_grant_period:
   - Grant 1500 credits
   - Update last_credit_grant_period = paid_count
   - Update current_period_start and current_period_end
   - Log transaction
```

### 5.2 Subscription Sync Endpoint

**File**: `/app/api/razorpay/sync-subscriptions/route.ts` (NEW)

**Purpose**: Daily sync of subscription statuses

**Logic**:
```typescript
1. Fetch all active subscriptions from database
2. For each subscription:
   - Fetch from Razorpay API
   - Compare status and paid_count
   - Update if changed
   - Handle cancellations/expirations
3. Return sync report
```

### 5.3 Credit Granting Function

**File**: `/app/api/razorpay/grant-monthly-credits/route.ts` (NEW)

**Purpose**: Grant credits for monthly renewals

**Logic**:
```typescript
1. Verify subscription is active
2. Check if credits already granted for current period
3. Grant 1500 credits if not already granted
4. Update subscription metadata
5. Log transaction
```

---

## 6. Database Schema Updates

### 6.1 Subscription Metadata Structure

```typescript
metadata: {
  // Status tracking
  subscription_status: 'active',
  razorpay_status: 'active',
  
  // Credit tracking
  last_credit_grant_period: 1,  // Last paid_count when credits granted
  total_credits_granted: 1500,
  last_credit_grant_date: '2024-01-15T10:00:00Z',
  
  // Billing tracking
  total_count: 12,
  paid_count: 1,
  remaining_count: 11,
  
  // Period tracking
  current_start: 1705315200,
  current_end: 1707907200,
  
  // Lifecycle events
  activated_via: 'webhook' | 'polling',
  cancelled_at: null,
  cancelled_reason: null,
}
```

### 6.2 Credit Transaction Tracking

**Table**: `credit_transactions`

**Fields to Track**:
- `order_id`: Subscription ID
- `transaction_type`: 'purchase' | 'subscription_renewal'
- `metadata.subscription_period`: Current paid_count
- `metadata.billing_cycle`: Month number (1, 2, 3, etc.)

---

## 7. User Access Control

### 7.1 Active Subscription Check

**Current**: ✅ Implemented in `/api/credits/balance`

**Enhancement**: Add grace period check
```typescript
// Check if subscription is active OR in grace period
const isActive = 
  (status === 'active' || status === 'authenticated') &&
  (ends_at === null || new Date(ends_at) > new Date())
```

### 7.2 Pro Features Access

**Logic**:
- User has active subscription → Pro features enabled
- User cancelled but in grace period → Pro features enabled
- User subscription expired → Pro features disabled
- User never subscribed → Pro features disabled

---

## 8. Error Handling & Edge Cases

### 8.1 Webhook Failures

**Scenario**: Webhook missed or failed
**Solution**: Daily sync job catches missed events

### 8.2 Duplicate Credit Grants

**Scenario**: Webhook received multiple times
**Solution**: Check `last_credit_grant_period` before granting

### 8.3 Status Mismatch

**Scenario**: Database status differs from Razorpay
**Solution**: Sync job corrects discrepancies (Razorpay is source of truth)

### 8.4 Partial Payments

**Scenario**: Payment partially successful
**Solution**: Only grant credits on full payment success (`paid_count` increases)

---

## 9. Monitoring & Logging

### 9.1 Key Metrics to Track

- Active subscriptions count
- Monthly renewals count
- Credit grants per month
- Cancellation rate
- Payment failure rate
- Status sync discrepancies

### 9.2 Logging Points

- Every webhook event received
- Every credit grant
- Every status change
- Every sync job run
- Payment failures

---

## 10. Implementation Priority

### Phase 1: Critical (Week 1)
1. ✅ Enhanced webhook handler for `subscription.charged`
2. ✅ Monthly credit granting logic
3. ✅ Duplicate prevention mechanism

### Phase 2: Important (Week 2)
4. ✅ Subscription sync endpoint
5. ✅ Daily sync job setup
6. ✅ Cancellation handling

### Phase 3: Enhancement (Week 3)
7. ✅ Payment failure handling
8. ✅ Grace period logic
9. ✅ Monitoring dashboard

---

## 11. Testing Strategy

### 11.1 Test Scenarios

1. **Initial Subscription**:
   - Create subscription → Check credits granted (1500)

2. **Monthly Renewal**:
   - Simulate `subscription.charged` event → Check credits granted (1500)
   - Verify no duplicate grants

3. **Cancellation**:
   - Cancel subscription → Check status updated
   - Verify no future credits granted
   - Verify access continues until period end

4. **Payment Failure**:
   - Simulate payment failure → Check status handling
   - Verify grace period logic

5. **Sync Job**:
   - Run sync job → Verify status updates
   - Verify credit grants for missed events

---

## 12. Industry Best Practices

### 12.1 Credit Granting
- ✅ Grant credits immediately on payment success
- ✅ Prevent duplicate grants
- ✅ Track grant history
- ✅ Clear transaction logging

### 12.2 Status Management
- ✅ Razorpay is source of truth
- ✅ Regular sync to catch discrepancies
- ✅ Grace period for cancellations
- ✅ Clear status transitions

### 12.3 Error Handling
- ✅ Idempotent operations
- ✅ Retry mechanisms
- ✅ Fallback sync jobs
- ✅ Comprehensive logging

---

## Approval Checklist

- [ ] Review subscription lifecycle flow
- [ ] Approve credit granting logic
- [ ] Approve status handling approach
- [ ] Approve sync job frequency
- [ ] Approve grace period duration
- [ ] Approve monitoring strategy

---

## Next Steps After Approval

1. Implement enhanced webhook handler
2. Create subscription sync endpoint
3. Set up daily cron job
4. Add credit granting logic
5. Test end-to-end flow
6. Deploy to production

---

**Document Version**: 1.0  
**Last Updated**: 2024-01-15  
**Status**: Pending Approval

