# Split Share Transaction Logic Implementation Prompt

## Overview
Implement transaction logic for the split share feature that automatically updates user balances when payments are marked as paid. This includes creating debit/credit transactions in the **existing transactions table** (the same table used for expenses, income, and transfers) and updating balances in the `user_credits` table after payment approval. **DO NOT create new tables** - use the existing transactions infrastructure.

## Core Requirements

### 1. Payment Settlement Flow

#### Scenario A: User Pays Off Money They Owe
- **Trigger**: When a user marks a payment as "paid" for money they owe to another user
- **Action**: 
  - Subtract the amount from the payer's balance (debit transaction)
  - Create a debit transaction record in `credit_transactions`
  - Update the payer's balance in `user_credits` table

#### Scenario B: User Receives Payment (Money Owed to Them)
- **Trigger**: When another user marks a payment as "paid" for money they owe to the current user
- **Action**:
  - Add the amount to the receiver's balance (credit transaction)
  - Create a credit transaction record in `credit_transactions`
  - Update the receiver's balance in `user_credits` table

### 2. Transaction Approval System

- **Approval Required**: All payment settlements must be approved before balance updates occur
- **Approval States**: 
  - `pending`: Payment marked but not yet approved
  - `approved`: Payment approved, balance updated, transaction created
  - `rejected`: Payment rejected, no balance update
- **Approval Flow**: 
  1. User marks payment as paid → Status: `pending`
  2. Recipient approves payment → Status: `approved` → Balance updated
  3. OR Recipient rejects payment → Status: `rejected` → No balance update

## Database Schema Requirements

### Using Existing Transactions Table

**IMPORTANT**: Use the existing transactions table that is already used for expenses, income, and transfers. **DO NOT** create new tables.

#### Existing Transactions Table Structure
The implementation should work with the existing transactions table which should have (or be extended with) the following fields:

- `id` - UUID primary key
- `user_id` - UUID reference to auth.users(id) - The user this transaction belongs to
- `amount` - DECIMAL(10, 2) - Transaction amount (positive for income/credit, negative for expense/debit)
- `transaction_type` - TEXT - Type of transaction: `'expense'`, `'income'`, `'transfer'`, `'split_share_debit'`, `'split_share_credit'`
- `description` - TEXT - Transaction description
- `status` - TEXT - Transaction status: `'pending'`, `'approved'`, `'rejected'` (for split share payments)
- `payer_id` - UUID (optional) - For split share: who is paying
- `payee_id` - UUID (optional) - For split share: who is receiving
- `related_transaction_id` - UUID (optional) - Links debit and credit transactions together
- `marked_paid_by` - UUID (optional) - Who marked the payment as paid
- `approved_by` - UUID (optional) - Who approved the payment
- `approved_at` - TIMESTAMPTZ (optional) - When payment was approved
- `metadata` - JSONB (optional) - Additional metadata (expense_id, group_id, etc.)
- `created_at` - TIMESTAMPTZ
- `updated_at` - TIMESTAMPTZ

**Note**: If the existing transactions table doesn't have all these fields, add only the missing ones via ALTER TABLE statements. The core fields (`id`, `user_id`, `amount`, `transaction_type`, `description`, `created_at`) should already exist.

## API Endpoints to Create

### 1. Mark Payment as Paid
**Endpoint**: `POST /api/split-share/mark-paid`

**Request Body**:
```typescript
{
  transaction_id: string; // UUID of the transaction record (expense/transfer type)
  marked_by: string; // User ID who is marking it as paid
}
```

**Logic**:
1. Verify the user has permission to mark this transaction as paid (must be the payer)
2. Fetch the transaction from the transactions table
3. Verify transaction type is appropriate (e.g., `'expense'` or `'transfer'` related to split share)
4. Update transaction `status` to `'pending'`
5. Set `marked_paid_by` to the user ID
6. Return success response (balance NOT updated yet)

**Response**:
```typescript
{
  success: boolean;
  transaction_id: string;
  status: 'pending';
  message: 'Payment marked as paid, awaiting approval';
}
```

### 2. Approve Payment
**Endpoint**: `POST /api/split-share/approve-payment`

**Request Body**:
```typescript
{
  transaction_id: string; // UUID of the transaction record (the original expense/transfer)
  approved_by: string; // User ID who is approving (must be the payee)
}
```

**Logic**:
1. Fetch the transaction from the transactions table
2. Verify the approving user is the `payee_id` (the one receiving money)
3. Verify transaction status is `'pending'`
4. Get transaction details (payer_id, payee_id, amount, description)
5. **For Payer (Debit)**:
   - Ensure payer has sufficient balance (if balance is required)
   - Create debit transaction in the same transactions table:
     - `user_id`: payer_id
     - `transaction_type`: `'split_share_debit'` or `'expense'`
     - `amount`: negative value (subtract from balance)
     - `description`: `"Paid to [payee_name] for [expense_description]"`
     - `status`: `'approved'`
     - `payer_id`: payer_id
     - `payee_id`: payee_id
     - `related_transaction_id`: link to credit transaction
     - `metadata`: `{ original_transaction_id, expense_id, payer_id, payee_id }`
6. **For Payee (Credit)**:
   - Create credit transaction in the same transactions table:
     - `user_id`: payee_id
     - `transaction_type`: `'split_share_credit'` or `'income'` or `'transfer'`
     - `amount`: positive value (add to balance)
     - `description`: `"Received from [payer_name] for [expense_description]"`
     - `status`: `'approved'`
     - `payer_id`: payer_id
     - `payee_id`: payee_id
     - `related_transaction_id`: link to debit transaction
     - `metadata`: `{ original_transaction_id, expense_id, payer_id, payee_id }`
7. Update original transaction `status` to `'approved'`
8. Set `approved_by` and `approved_at` on original transaction
9. Update balances in `user_credits` table for both users
10. Return success with updated balances

**Response**:
```typescript
{
  success: boolean;
  transaction_id: string;
  status: 'approved';
  payer_balance: number; // Updated balance of payer
  payee_balance: number; // Updated balance of payee
  debit_transaction_id: string; // ID of debit transaction created
  credit_transaction_id: string; // ID of credit transaction created
}
```

### 3. Reject Payment
**Endpoint**: `POST /api/split-share/reject-payment`

**Request Body**:
```typescript
{
  transaction_id: string; // UUID of the transaction record
  rejected_by: string; // User ID who is rejecting (must be the payee)
  reason?: string; // Optional rejection reason
}
```

**Logic**:
1. Fetch the transaction from the transactions table
2. Verify the rejecting user is the `payee_id`
3. Verify transaction status is `'pending'`
4. Update transaction `status` to `'rejected'`
5. Optionally store rejection reason in `metadata`
6. **NO balance updates** - balances remain unchanged
7. **NO new transactions created** - only status update
8. Return success response

**Response**:
```typescript
{
  success: boolean;
  transaction_id: string;
  status: 'rejected';
  message: 'Payment rejected, no balance changes made';
}
```

## Transaction Creation Logic

### Using Existing Credit System Functions

The implementation should leverage existing credit system functions:

#### For Debit (Payer):
```typescript
// Create debit transaction in the transactions table
const debitTransaction = await supabaseAdmin
  .from('transactions') // Use your existing transactions table name
  .insert({
    user_id: payer_id,
    amount: -Math.abs(amount), // Negative for debit/expense
    transaction_type: 'split_share_debit', // or 'expense' if that's your convention
    description: `Paid ${amount} to ${payee_name} for ${expense_description}`,
    status: 'approved',
    payer_id: payer_id,
    payee_id: payee_id,
    related_transaction_id: credit_transaction_id, // Link to credit transaction
    metadata: {
      original_transaction_id: original_transaction_id,
      expense_id: expense_id,
      payer_id: payer_id,
      payee_id: payee_id,
      transaction_type: 'split_share_debit'
    }
  })
  .select()
  .single();

// Update user_credits balance (if using credit system)
await supabaseAdmin.rpc('get_or_create_user_credits', { user_id: payer_id });
await supabaseAdmin
  .from('user_credits')
  .update({ 
    balance: supabaseAdmin.raw(`balance - ${Math.abs(amount)}`) 
  })
  .eq('user_id', payer_id);
```

#### For Credit (Payee):
```typescript
// Create credit transaction in the transactions table
const creditTransaction = await supabaseAdmin
  .from('transactions') // Use your existing transactions table name
  .insert({
    user_id: payee_id,
    amount: Math.abs(amount), // Positive for credit/income
    transaction_type: 'split_share_credit', // or 'income' or 'transfer' if that's your convention
    description: `Received ${amount} from ${payer_name} for ${expense_description}`,
    status: 'approved',
    payer_id: payer_id,
    payee_id: payee_id,
    related_transaction_id: debit_transaction_id, // Link to debit transaction
    metadata: {
      original_transaction_id: original_transaction_id,
      expense_id: expense_id,
      payer_id: payer_id,
      payee_id: payee_id,
      transaction_type: 'split_share_credit'
    }
  })
  .select()
  .single();

// Update user_credits balance (if using credit system)
await supabaseAdmin.rpc('get_or_create_user_credits', { user_id: payee_id });
await supabaseAdmin.rpc('add_credits', {
  p_user_id: payee_id,
  p_amount: Math.abs(amount),
  p_transaction_type: 'split_share_credit',
  p_description: `Received ${amount} from ${payer_name} for ${expense_description}`,
  p_purchase_id: null,
  p_order_id: null,
  p_metadata: {
    transaction_id: creditTransaction.id,
    original_transaction_id: original_transaction_id,
    expense_id: expense_id,
    payer_id: payer_id,
    payee_id: payee_id
  }
});
```

## Implementation Details

### 1. Balance Validation
- **Before Approval**: Check if payer has sufficient balance (if balance-based system)
- **If Insufficient**: Return error, do not approve payment
- **Error Response**:
```typescript
{
  success: false;
  error: 'insufficient_balance';
  message: 'Payer does not have sufficient balance';
  required_balance: number;
  current_balance: number;
}
```

### 2. Transaction Atomicity
- Use database transactions to ensure:
  - Both debit and credit transactions are created together
  - Both balances are updated together
  - Payment status is updated only if transactions succeed
- If any step fails, rollback all changes

### 3. Error Handling
- Handle cases where:
  - Transaction doesn't exist
  - Transaction already approved/rejected
  - User doesn't have permission
  - Balance update fails
  - Transaction creation fails
- Return appropriate error messages with status codes

### 4. Idempotency
- Ensure approving the same transaction twice doesn't create duplicate transactions
- Check transaction status before processing
- Use database constraints to prevent duplicate transactions
- Check if related transactions already exist before creating new ones

## API Route Structure

### File: `app/api/split-share/mark-paid/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Authentication and authorization logic
// Fetch transaction from transactions table
// Verify user is the payer
// Update transaction status to 'pending'
// Set marked_paid_by field
// Return success response
```

### File: `app/api/split-share/approve-payment/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Authentication and authorization logic
// Fetch transaction from transactions table
// Verify payee is approving
// Create debit transaction in transactions table for payer
// Create credit transaction in transactions table for payee
// Link transactions via related_transaction_id
// Update balances in user_credits table
// Update original transaction status to 'approved'
// Return success with updated balances
```

### File: `app/api/split-share/reject-payment/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Authentication and authorization logic
// Fetch transaction from transactions table
// Verify payee is rejecting
// Update transaction status to 'rejected'
// Store rejection reason in metadata if provided
// NO balance updates
// NO new transactions created
// Return success response
```

## Database Functions (Optional but Recommended)

### Function: `process_split_share_payment`
```sql
CREATE OR REPLACE FUNCTION process_split_share_payment(
  p_transaction_id UUID,
  p_approved_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_transaction RECORD;
  v_payer_balance INTEGER;
  v_payee_balance INTEGER;
  v_debit_transaction_id UUID;
  v_credit_transaction_id UUID;
BEGIN
  -- Get transaction details
  SELECT * INTO v_transaction
  FROM transactions -- Use your actual transactions table name
  WHERE id = p_transaction_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Transaction not found or not pending');
  END IF;
  
  -- Verify approver is the payee
  IF v_transaction.payee_id != p_approved_by THEN
    RETURN jsonb_build_object('error', 'Only payee can approve payment');
  END IF;
  
  -- Check payer balance (if required)
  -- Implementation depends on your balance system
  
  -- Create debit transaction for payer
  INSERT INTO transactions ( -- Use your actual transactions table name
    user_id,
    amount,
    transaction_type,
    description,
    status,
    payer_id,
    payee_id,
    related_transaction_id,
    metadata
  ) VALUES (
    v_transaction.payer_id,
    -ABS(v_transaction.amount),
    'split_share_debit',
    'Paid ' || v_transaction.amount || ' for split share expense',
    'approved',
    v_transaction.payer_id,
    v_transaction.payee_id,
    NULL, -- Will be updated after credit transaction is created
    jsonb_build_object(
      'original_transaction_id', p_transaction_id,
      'payer_id', v_transaction.payer_id,
      'payee_id', v_transaction.payee_id
    )
  ) RETURNING id INTO v_debit_transaction_id;
  
  -- Create credit transaction for payee
  INSERT INTO transactions ( -- Use your actual transactions table name
    user_id,
    amount,
    transaction_type,
    description,
    status,
    payer_id,
    payee_id,
    related_transaction_id,
    metadata
  ) VALUES (
    v_transaction.payee_id,
    ABS(v_transaction.amount),
    'split_share_credit',
    'Received ' || v_transaction.amount || ' for split share expense',
    'approved',
    v_transaction.payer_id,
    v_transaction.payee_id,
    v_debit_transaction_id,
    jsonb_build_object(
      'original_transaction_id', p_transaction_id,
      'payer_id', v_transaction.payer_id,
      'payee_id', v_transaction.payee_id
    )
  ) RETURNING id INTO v_credit_transaction_id;
  
  -- Update debit transaction with credit transaction link
  UPDATE transactions
  SET related_transaction_id = v_credit_transaction_id
  WHERE id = v_debit_transaction_id;
  
  -- Update payer balance (if using user_credits table)
  UPDATE user_credits
  SET balance = balance - ABS(v_transaction.amount)
  WHERE user_id = v_transaction.payer_id;
  
  -- Update payee balance (if using user_credits table)
  UPDATE user_credits
  SET balance = balance + ABS(v_transaction.amount)
  WHERE user_id = v_transaction.payee_id;
  
  -- Update original transaction status
  UPDATE transactions
  SET 
    status = 'approved',
    approved_by = p_approved_by,
    approved_at = NOW()
  WHERE id = p_transaction_id;
  
  -- Get updated balances
  SELECT balance INTO v_payer_balance FROM user_credits WHERE user_id = v_transaction.payer_id;
  SELECT balance INTO v_payee_balance FROM user_credits WHERE user_id = v_transaction.payee_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'payer_balance', v_payer_balance,
    'payee_balance', v_payee_balance,
    'debit_transaction_id', v_debit_transaction_id,
    'credit_transaction_id', v_credit_transaction_id
  );
END;
$$;
```

## Security Considerations

### 1. Authentication
- All endpoints must verify user authentication via Bearer token
- Use Supabase auth to verify user identity

### 2. Authorization
- Verify user has permission to mark/approve/reject specific payments
- Only payee can approve/reject payments
- Only payer can mark their own payments as paid

### 3. RLS Policies
- Ensure RLS policies exist for the transactions table:
  - Users can view transactions where they are the user_id, payer_id, or payee_id
  - Users can update transactions they created or are involved in (with appropriate status checks)
  - Use service role key for balance updates (server-side only)

### 4. Input Validation
- Validate transaction_id is valid UUID
- Validate amount is positive number
- Validate status transitions (pending → approved/rejected only)
- Verify transaction exists and belongs to appropriate user
- Sanitize all user inputs

## Testing Scenarios

### Test Case 1: Successful Payment Approval
1. User A marks transaction as paid (status: pending)
2. User B (payee) approves transaction
3. Verify:
   - User A's balance decreased
   - User B's balance increased
   - Debit transaction created in transactions table for User A
   - Credit transaction created in transactions table for User B
   - Transactions are linked via related_transaction_id
   - Original transaction status updated to 'approved'

### Test Case 2: Payment Rejection
1. User A marks transaction as paid (status: pending)
2. User B (payee) rejects transaction
3. Verify:
   - No balance changes
   - No new transactions created
   - Original transaction status updated to 'rejected'

### Test Case 3: Duplicate Approval Prevention
1. User A marks transaction as paid
2. User B approves transaction (success)
3. Attempt to approve same transaction again
4. Verify: Error returned, no duplicate transactions created

### Test Case 4: Unauthorized Approval
1. User A marks transaction as paid
2. User C (not payee) attempts to approve
3. Verify: Error returned, no changes made

## Integration Points

### Existing Transaction System
- Use existing `transactions` table (the same table used for expenses, income, and transfers)
- Use existing `user_credits` table for balance tracking
- Leverage existing `add_credits()` function for credit transactions if applicable
- Follow existing transaction type patterns (`'expense'`, `'income'`, `'transfer'`, etc.)
- Add new transaction types: `'split_share_debit'` and `'split_share_credit'` (or use existing types with appropriate metadata)





### UI Integration (No Changes Required)
- **DO NOT** modify existing UI components
- **DO NOT** change existing API response formats
- Only add new API endpoints
- UI will call new endpoints when needed
- Maintain backward compatibility

## Key Implementation Notes

1. **Pure Logic Addition**: This implementation should NOT modify any existing UI components, pages, or existing API routes
2. **Use Existing Table**: Use the same transactions table that handles expenses, income, and transfers - DO NOT create new tables
3. **Transaction Types**: Use `'split_share_debit'` and `'split_share_credit'` as transaction types (or use existing types like `'expense'`/`'income'` with appropriate metadata)
4. **Balance Updates**: Always update both the transactions table and `user_credits` table (if using credit system)
5. **Approval Workflow**: Two-step process (mark as paid → approve) ensures both parties agree
6. **Transaction Linking**: Use `related_transaction_id` to link debit and credit transactions together
7. **Error Recovery**: Implement proper error handling and rollback mechanisms
8. **Logging**: Log all balance updates and transaction creations for audit trail
9. **Metadata**: Store original_transaction_id, expense_id, payer_id, payee_id in transaction metadata for traceability
10. **Table Name**: Replace `'transactions'` in code examples with your actual transactions table name

## Success Criteria

✅ Transaction can be marked as paid (status: pending)
✅ Transaction can be approved by payee (creates debit/credit transactions in same table, updates balances)
✅ Transaction can be rejected by payee (no balance changes, no new transactions)
✅ Debit transaction created in transactions table for payer with correct amount
✅ Credit transaction created in transactions table for payee with correct amount
✅ Transactions are linked via related_transaction_id
✅ Both balances updated correctly in user_credits table
✅ Uses existing transactions table (no new tables created)
✅ Duplicate approvals prevented
✅ Unauthorized access prevented
✅ All operations are atomic (all succeed or all fail)
✅ No existing UI or API functionality broken
✅ Follows existing code patterns and conventions

