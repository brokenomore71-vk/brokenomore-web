# Offer Management Integration Design

## Executive Summary

This document outlines the design and integration approach for the Offer Management feature in the admin panel. The feature will allow admins to create, manage, update, and delete offers using both manual form entry and bulk Excel upload capabilities.

---

## 1. High-Level Architecture

### 1.1 System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin Frontend (React)                    │
│  /admin/offers - Offer Management Page                      │
│  - Manual Form Entry                                        │
│  - Excel Upload Interface                                   │
│  - Offer Dashboard with Filters                             │
│  - Update/Delete Operations                                 │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ HTTP API Calls (Bearer Token)
                        │
┌───────────────────────┴─────────────────────────────────────┐
│              Next.js API Routes (Backend)                    │
│  /api/admin/offers                                          │
│    - GET    → List offers (with filters & pagination)      │
│    - POST   → Create single offer                          │
│    - POST   /bulk-upload → Bulk create from Excel          │
│  /api/admin/offers/[id]                                     │
│    - GET    → Get single offer details                     │
│    - PATCH  → Update offer                                 │
│    - DELETE → Soft delete offer                            │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        │ Supabase Admin Client
                        │ (Service Role Key)
                        │
┌───────────────────────┴─────────────────────────────────────┐
│              Supabase PostgreSQL Database                    │
│  Table: admin_offers                                         │
│  - RLS Policies (if needed for audit)                       │
│  - Indexes for performance (already exist)                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack Alignment

- **Frontend**: Next.js App Router (Client Components)
- **Backend**: Next.js API Routes (Route Handlers)
- **Database**: Supabase PostgreSQL (`admin_offers` table)
- **Authentication**: Supabase Auth (JWT tokens)
- **Authorization**: Email-based admin check (`admin@brokenomore.in`)
- **File Processing**: Excel parsing library (e.g., `xlsx` or `exceljs`)

---

## 2. Offer Creation Flow

### 2.1 Manual Form Entry

#### Frontend Flow

1. **User Action**: Admin clicks "Create Offer" button
2. **Modal/Page Display**: 
   - Opens creation form (can be modal or dedicated page)
   - Form fields aligned with `admin_offers` schema
3. **Form Fields** (based on schema):
   - **Required**:
     - `name` (text input)
     - `site_url` (URL input)
   - **Optional**:
     - `external_id` (text input, unique validation)
     - `description` (textarea)
     - `image_url` (URL input)
     - `category` (dropdown/select)
     - `region` (multi-select/tags input for array)
     - `date_start` (datetime picker)
     - `date_end` (datetime picker)
     - `status` (dropdown: 'active' | 'inactive')
     - `is_enabled` (toggle/checkbox, default: true)
     - `action_ranges` (JSON editor or structured form)
     - `reward_info` (text input)
     - `priority` (number input, default: 0)
     - `display_order` (number input)
     - `rating` (number input, 0-5 range)
     - `performance_metrics` (JSON editor or structured form)

4. **Client-Side Validation**:
   - Validate required fields
   - Validate `external_id` uniqueness (if provided)
   - Validate `site_url` format (URL pattern)
   - Validate `rating` range (0-5)
   - Validate date logic: `date_end >= date_start` (if both provided)
   - Validate `status` enum values

5. **Submission**:
   - On submit, call `POST /api/admin/offers`
   - Show loading state
   - Handle success: Close modal, refresh offer list, show success message
   - Handle errors: Display validation/error messages

#### Backend Flow

1. **Authentication Check**: Verify admin using `verifyAdmin()` helper
2. **Request Validation**:
   - Validate request body structure
   - Server-side validation for all fields (duplicate of client-side + additional checks)
3. **Database Operations**:
   - Check `external_id` uniqueness if provided
   - Insert into `admin_offers` table
   - Set `created_by` to admin user ID
   - Set `source` to 'admin' (default)
   - Set `created_at` and `updated_at` (handled by triggers)
4. **Response**: Return created offer object (with generated `id`)

#### Validation Considerations

**Client-Side**:
- Immediate feedback for user experience
- Field-level validation on blur/change
- Form-level validation on submit

**Server-Side**:
- Security: Never trust client input
- Database constraints will catch violations (unique constraints, check constraints)
- Custom validation for business logic (date ranges, rating ranges)

---

### 2.2 Excel Sheet Upload (Bulk Offers)

#### Frontend Flow

1. **User Action**: Admin selects "Bulk Upload" option (separate button or tab in create modal)
2. **File Selection**:
   - File input accepts `.xlsx`, `.xls` files
   - Optional: Show template download link
3. **File Preview** (Before Upload):
   - Parse Excel file client-side (using `xlsx` library)
   - Display preview table with first 10-20 rows
   - Show validation warnings/errors per row
   - Display total row count
4. **Upload Process**:
   - Call `POST /api/admin/offers/bulk-upload`
   - Send FormData with file
   - Show progress indicator (for large files)
5. **Result Handling**:
   - Display success summary: `X offers created, Y skipped, Z errors`
   - Show detailed error report (row numbers, field errors)
   - Option to download error report as CSV/Excel

#### Excel Template Structure

Recommended column headers (matching schema):

| Column Name | Required | Type | Notes |
|------------|----------|------|-------|
| `name` | Yes | Text | Offer name |
| `site_url` | Yes | Text | Valid URL |
| `external_id` | No | Text | Must be unique if provided |
| `description` | No | Text | Offer description |
| `image_url` | No | Text | Image URL |
| `status` | No | Text | 'active' or 'inactive' (default: 'active') |
| `is_enabled` | No | Boolean | true/false (default: true) |
| `category` | No | Text | Category name |
| `region` | No | Text | Comma-separated values (e.g., "IN,US,UK") |
| `date_start` | No | DateTime | ISO format or Excel date |
| `date_end` | No | DateTime | ISO format or Excel date |
| `reward_info` | No | Text | Reward information |
| `priority` | No | Number | Integer (default: 0) |
| `display_order` | No | Number | Integer |
| `rating` | No | Number | 0-5 (decimal: 3.50) |

**Note**: `action_ranges` and `performance_metrics` (JSONB fields) can be omitted from template or provided as JSON strings if needed.

#### Backend Flow

1. **Authentication Check**: Verify admin
2. **File Processing**:
   - Parse uploaded Excel file (server-side using `xlsx` or `exceljs`)
   - Extract rows (skip header row)
   - Map Excel columns to database fields
3. **Validation & Transformation**:
   - Validate each row:
     - Required fields (`name`, `site_url`)
     - Data types (numbers, dates, booleans)
     - Date range logic (`date_end >= date_start`)
     - Rating range (0-5)
     - Status enum values
     - URL format for `site_url` and `image_url`
   - Transform data:
     - Convert `region` string to array (split by comma)
     - Parse dates (handle multiple formats)
     - Convert boolean strings to booleans
     - Handle empty cells as null
4. **Batch Processing**:
   - Check for duplicate `external_id` values (if provided)
   - Option 1: Single transaction (all or nothing)
   - Option 2: Batch insert with transaction per row (partial success)
   - **Recommended**: Batch insert with per-row error handling for better UX
5. **Response**:
   - Return summary:
     ```json
     {
       "success": true,
       "created": 50,
       "skipped": 5,
       "errors": [
         {
           "row": 3,
           "external_id": "OFFER-001",
           "errors": ["external_id already exists"]
         },
         {
           "row": 7,
           "errors": ["date_end must be >= date_start"]
         }
       ]
     }
     ```

#### Excel Parsing & Mapping Strategy

**Mapping Logic**:
1. Read header row to map column names to database fields
2. Normalize column names (case-insensitive, trim whitespace)
3. For each data row:
   - Create offer object with mapped values
   - Apply default values for optional fields
   - Validate row data
   - Collect errors per row

**Data Type Conversions**:
- **Text**: Trim whitespace, handle empty cells as null
- **Numbers**: Parse as integer/float, handle invalid numbers as errors
- **Dates**: Parse Excel date numbers or ISO strings, convert to UTC timestamps
- **Booleans**: "true"/"false" strings → boolean values
- **Arrays**: Split comma-separated strings, trim each value

**Error Handling**:
- Continue processing even if some rows fail
- Collect all errors and return comprehensive report
- Use database transactions per row to ensure atomicity

---

## 3. Admin Offer Dashboard

### 3.1 Offer Listing Display

#### Layout Options

**Option A: Table View** (Recommended for admin dashboards)
- Sortable columns
- Compact display for many offers
- Easy to scan

**Option B: Card Grid View**
- Visual representation with images
- Better for browsing

**Option C: Hybrid (Default Table, Toggle to Cards)**
- Best of both worlds

#### Recommended Table Columns

| Column | Display |
|--------|---------|
| `name` | Clickable link to view/edit |
| `category` | Badge/tag |
| `status` | Colored badge (active/inactive) |
| `is_enabled` | Toggle switch |
| `region` | Comma-separated or badges |
| `date_start` / `date_end` | Formatted dates or "Active Now" indicator |
| `priority` | Number with sort indicator |
| `display_order` | Number |
| `created_at` | Relative time or formatted date |
| Actions | Edit / Delete buttons |

#### Visual Indicators

- **Status Badges**: 
  - Active: Green
  - Inactive: Gray
- **Date Status**:
  - Upcoming: Blue (date_start > now)
  - Active: Green (date_start <= now <= date_end)
  - Expired: Red (date_end < now)
- **Enabled Toggle**: Visual toggle switch

### 3.2 Recommended Filters

1. **Status Filter** (Dropdown):
   - All
   - Active
   - Inactive

2. **Date Status Filter** (Radio/Buttons):
   - All
   - Active Now
   - Upcoming
   - Expired

3. **Category Filter** (Multi-select):
   - Dynamic list from existing categories
   - "All Categories" option

4. **Region Filter** (Multi-select):
   - Dynamic list from existing regions
   - "All Regions" option

5. **Enabled Filter** (Toggle):
   - All
   - Enabled Only
   - Disabled Only

6. **Search** (Text Input):
   - Search by `name`, `description`, `external_id`

### 3.3 Pagination and Performance Considerations

#### Pagination Strategy

**Backend**:
- Default page size: 20 offers per page
- Configurable via query param: `?page=1&limit=50`
- Return pagination metadata:
  ```json
  {
    "offers": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
  ```

**Frontend**:
- Display pagination controls (Previous, Next, Page numbers)
- Show "Showing X-Y of Z offers"
- Load more button option (infinite scroll alternative)

#### Performance Optimizations

1. **Database Queries**:
   - Use existing indexes (`idx_admin_offers_active`, `idx_admin_offers_category`, etc.)
   - Implement efficient filtering at database level
   - Use `select()` to limit returned columns if not all fields needed
   - Consider pagination at database level (LIMIT/OFFSET)

2. **Caching Strategy** (Future):
   - Cache filtered lists for short duration (30-60 seconds)
   - Invalidate cache on create/update/delete

3. **Frontend Optimizations**:
   - Lazy load offer images
   - Virtual scrolling for large lists (if using table)
   - Debounce search input (wait 300ms after typing stops)

4. **Query Optimization**:
   ```sql
   -- Example efficient query with filters
   SELECT * FROM admin_offers
   WHERE 
     ($1::text IS NULL OR status = $1)
     AND ($2::text IS NULL OR category = $2)
     AND ($3::text[] IS NULL OR region && $3)
     AND ($4::text IS NULL OR name ILIKE '%' || $4 || '%')
   ORDER BY display_order NULLS LAST, priority DESC NULLS LAST, created_at DESC
   LIMIT $5 OFFSET $6;
   ```

---

## 4. Update & Delete Operations

### 4.1 Update Flow

#### Frontend Flow

1. **User Action**: Admin clicks "Edit" button on offer card/row
2. **Edit Modal/Page**:
   - Pre-populate form with existing offer data
   - Same form structure as create (but with existing values)
   - Disable read-only fields if needed (e.g., `external_id` - or allow with validation)
3. **Validation**: Same as create form
4. **Submission**:
   - Call `PATCH /api/admin/offers/[id]`
   - Send only changed fields (optimistic) or all fields
   - Handle success: Close modal, refresh list, show success message
   - Handle errors: Display validation/error messages

#### Backend Flow

1. **Authentication**: Verify admin
2. **Authorization Check**: Verify offer exists (optional: verify `created_by` matches admin)
3. **Validation**: Validate updated fields
4. **Database Update**:
   - Update `admin_offers` table with new values
   - Update `updated_at` (handled by trigger)
   - Preserve fields not in request body
5. **Response**: Return updated offer object

#### Update Considerations

- **Partial Updates**: Support PATCH (update only provided fields)
- **Immutable Fields**: Consider if `external_id` should be immutable after creation
- **Audit Trail**: `updated_at` is automatically updated by trigger
- **Optimistic Updates**: Frontend can optimistically update UI before server response

---

### 4.2 Safe Deletion Approach

#### Soft Delete Strategy (Recommended)

**Rationale**: 
- Preserves data for audit/history
- Can be "restored" if needed
- No foreign key cascade issues
- Better for analytics

**Implementation**:
1. **Add `deleted_at` column** to `admin_offers` table (nullable timestamp)
2. **Update Queries**: Filter out soft-deleted offers in list queries (`WHERE deleted_at IS NULL`)
3. **Delete Operation**: Set `deleted_at = NOW()` instead of hard delete
4. **Restore Option**: Admin can restore offers by setting `deleted_at = NULL`

**Alternative**: Use existing `is_enabled` flag for "deactivation" instead of deletion, and use hard delete only when explicitly needed.

#### Hard Delete Strategy

**Rationale**: 
- Permanently remove data
- Cleaner database
- Required if legal/compliance requires permanent deletion

**Implementation**:
- Direct `DELETE FROM admin_offers WHERE id = $1`

#### Recommendation: Hybrid Approach

1. **Primary Action: Soft Delete**
   - Default delete action sets `is_enabled = false` and/or `deleted_at = NOW()`
   - Offers with `deleted_at IS NOT NULL` are hidden from normal views
2. **Secondary Action: Hard Delete** (Admin-only, with confirmation)
   - Separate "Permanently Delete" action
   - Requires explicit confirmation dialog
   - Shows warning about permanent data loss

#### Deletion Flow

**Frontend**:
1. **User Action**: Admin clicks "Delete" button
2. **Confirmation Dialog**:
   - Show offer details (name, dates)
   - Warn about consequences
   - Option: "Soft Delete" (default) vs "Permanently Delete" (advanced)
   - Confirm button
3. **Deletion Request**:
   - Call `DELETE /api/admin/offers/[id]`
   - Show loading state
4. **Result**:
   - Success: Remove from list, show success message
   - Error: Display error message

**Backend**:
1. **Authentication**: Verify admin
2. **Validation**: Verify offer exists
3. **Soft Delete** (Default):
   ```sql
   UPDATE admin_offers 
   SET deleted_at = NOW(), is_enabled = false 
   WHERE id = $1;
   ```
4. **Hard Delete** (If requested):
   ```sql
   DELETE FROM admin_offers WHERE id = $1;
   ```
5. **Response**: Return success confirmation

#### Error-Handling Strategy

**Common Error Scenarios**:

1. **Offer Not Found**:
   - Return 404 with message: "Offer not found"
   - Frontend: Show error, refresh list

2. **Concurrent Modification**:
   - If offer was updated/deleted by another admin between load and delete
   - Return 409 Conflict
   - Frontend: Refresh and show message

3. **Database Constraint Violations**:
   - If offer is referenced elsewhere (if foreign keys exist in future)
   - Return 400 with details
   - Frontend: Show specific error message

4. **Network Errors**:
   - Frontend: Retry mechanism (with exponential backoff)
   - Show user-friendly error messages

---

## 5. Backend Integration Strategy

### 5.1 API Endpoints Design

#### Endpoint: `GET /api/admin/offers`

**Purpose**: List offers with filtering, sorting, and pagination

**Query Parameters**:
- `page` (number, default: 1)
- `limit` (number, default: 20, max: 100)
- `status` (string, optional: 'active' | 'inactive')
- `category` (string, optional)
- `region` (string, optional, comma-separated for multiple)
- `enabled` (boolean, optional)
- `dateStatus` (string, optional: 'active' | 'upcoming' | 'expired')
- `search` (string, optional: search in name, description, external_id)
- `sortBy` (string, optional: 'created_at' | 'priority' | 'display_order', default: 'created_at')
- `sortOrder` (string, optional: 'asc' | 'desc', default: 'desc')

**Response**:
```json
{
  "offers": [
    {
      "id": "uuid",
      "external_id": "OFFER-001",
      "name": "Summer Sale",
      "description": "...",
      "image_url": "...",
      "site_url": "https://...",
      "status": "active",
      "is_enabled": true,
      "category": "Retail",
      "region": ["IN", "US"],
      "date_start": "2024-06-01T00:00:00Z",
      "date_end": "2024-08-31T23:59:59Z",
      "action_ranges": {...},
      "reward_info": "...",
      "priority": 10,
      "display_order": 1,
      "rating": 4.5,
      "performance_metrics": {...},
      "source": "admin",
      "created_by": "uuid",
      "created_at": "2024-05-01T00:00:00Z",
      "updated_at": "2024-05-01T00:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

#### Endpoint: `POST /api/admin/offers`

**Purpose**: Create a single offer

**Request Body**:
```json
{
  "external_id": "OFFER-001", // optional
  "name": "Summer Sale",
  "description": "...",
  "image_url": "...",
  "site_url": "https://example.com",
  "status": "active", // optional, default: 'active'
  "is_enabled": true, // optional, default: true
  "category": "Retail", // optional
  "region": ["IN", "US"], // optional
  "date_start": "2024-06-01T00:00:00Z", // optional
  "date_end": "2024-08-31T23:59:59Z", // optional
  "action_ranges": {...}, // optional
  "reward_info": "...", // optional
  "priority": 10, // optional, default: 0
  "display_order": 1, // optional
  "rating": 4.5, // optional, 0-5
  "performance_metrics": {...} // optional
}
```

**Response**: 201 Created
```json
{
  "id": "uuid",
  ... // all fields including generated ones
}
```

---

#### Endpoint: `POST /api/admin/offers/bulk-upload`

**Purpose**: Bulk create offers from Excel file

**Request**: `multipart/form-data`
- `file`: Excel file (.xlsx, .xls)

**Response**: 200 OK
```json
{
  "success": true,
  "created": 50,
  "skipped": 5,
  "errors": [
    {
      "row": 3,
      "data": {...}, // row data for reference
      "errors": ["external_id already exists", "invalid date format"]
    }
  ]
}
```

---

#### Endpoint: `GET /api/admin/offers/[id]`

**Purpose**: Get single offer details

**Response**: 200 OK
```json
{
  "id": "uuid",
  ... // all offer fields
}
```

**Errors**: 404 if not found

---

#### Endpoint: `PATCH /api/admin/offers/[id]`

**Purpose**: Update an offer (partial update)

**Request Body**: Same as POST, but all fields optional

**Response**: 200 OK (updated offer object)

**Errors**: 
- 404 if not found
- 400 if validation fails

---

#### Endpoint: `DELETE /api/admin/offers/[id]`

**Purpose**: Delete an offer (soft delete by default)

**Query Parameters**:
- `hard` (boolean, optional): If true, perform hard delete

**Response**: 200 OK
```json
{
  "success": true,
  "message": "Offer deleted successfully"
}
```

**Errors**: 
- 404 if not found
- 400 if deletion not allowed (e.g., foreign key constraints)

---

### 5.2 Data Flow Between Frontend and Backend

#### Create Offer Flow

```
Frontend                    Backend                    Database
   │                          │                          │
   │ POST /api/admin/offers   │                          │
   │─────────────────────────>│                          │
   │                          │                          │
   │                          │ verifyAdmin()            │
   │                          │<────────────────────────>│
   │                          │                          │
   │                          │ validateRequest()        │
   │                          │                          │
   │                          │ INSERT INTO admin_offers │
   │                          │─────────────────────────>│
   │                          │                          │
   │                          │<─────────────────────────│
   │ 201 Created              │                          │
   │<─────────────────────────│                          │
   │                          │                          │
```

#### List Offers Flow

```
Frontend                    Backend                    Database
   │                          │                          │
   │ GET /api/admin/offers    │                          │
   │ ?page=1&limit=20&...     │                          │
   │─────────────────────────>│                          │
   │                          │                          │
   │                          │ verifyAdmin()            │
   │                          │<────────────────────────>│
   │                          │                          │
   │                          │ SELECT * FROM admin_offers│
   │                          │ WHERE ...                │
   │                          │ LIMIT 20 OFFSET 0        │
   │                          │─────────────────────────>│
   │                          │                          │
   │                          │<─────────────────────────│
   │ 200 OK                   │                          │
   │ { offers: [...],         │                          │
   │   pagination: {...} }    │                          │
   │<─────────────────────────│                          │
   │                          │                          │
```

#### Bulk Upload Flow

```
Frontend                    Backend                    Database
   │                          │                          │
   │ POST /api/admin/offers/  │                          │
   │ bulk-upload              │                          │
   │ (FormData with file)     │                          │
   │─────────────────────────>│                          │
   │                          │                          │
   │                          │ verifyAdmin()            │
   │                          │<────────────────────────>│
   │                          │                          │
   │                          │ Parse Excel File         │
   │                          │ Validate Rows            │
   │                          │                          │
   │                          │ BEGIN TRANSACTION        │
   │                          │ INSERT (row 1)           │
   │                          │─────────────────────────>│
   │                          │<─────────────────────────│
   │                          │ INSERT (row 2)           │
   │                          │─────────────────────────>│
   │                          │ ... (batch or loop)      │
   │                          │                          │
   │                          │<─────────────────────────│
   │ 200 OK                   │                          │
   │ { created: 50,           │                          │
   │   errors: [...] }        │                          │
   │<─────────────────────────│                          │
   │                          │                          │
```

---

### 5.3 Integration with Existing Backend

#### Reusable Helper: `verifyAdmin()`

Create a shared helper function (similar to existing admin API routes):

```typescript
// lib/admin-auth.ts (or similar)
export async function verifyAdmin(request: NextRequest): Promise<{ user: any } | { error: NextResponse }> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

  if (authError || !user) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL) {
    return { error: NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 }) };
  }

  return { user };
}
```

#### Database Connection Pattern

Use existing Supabase admin client pattern:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
```

#### Error Handling Pattern

Follow existing API route error handling:
- Return appropriate HTTP status codes
- Return structured error responses: `{ error: string, details?: any }`
- Log errors server-side for debugging

---

## 6. Security & Access Control

### 6.1 Admin-Only Access

#### Frontend Protection

1. **Layout-Level Protection** (Already Implemented):
   - `app/admin/layout.tsx` checks admin email before rendering
   - Redirects non-admin users to `/dashboard`

2. **Page-Level Protection** (Additional Layer):
   - `app/admin/offers/page.tsx` can re-verify admin status on mount
   - Show loading state during verification

#### Backend Protection

1. **API Route Protection**:
   - Every API route uses `verifyAdmin()` helper
   - Checks Bearer token validity
   - Verifies email is `admin@brokenomore.in`
   - Returns 401 if unauthenticated, 403 if not admin

2. **Database-Level Protection** (Future Consideration):
   - Row Level Security (RLS) policies can restrict access
   - For now, service role key bypasses RLS (which is fine for admin-only operations)

### 6.2 Preventing Invalid or Duplicate Offers

#### Validation Layers

1. **Client-Side Validation** (UX):
   - Immediate feedback
   - Prevents unnecessary API calls

2. **Server-Side Validation** (Security):
   - Always validate server-side (never trust client)
   - Validate all business rules

3. **Database Constraints** (Final Guard):
   - `admin_offers_external_id_key` unique constraint prevents duplicate `external_id`
   - `valid_dates` check constraint ensures `date_end >= date_start`
   - `valid_status` check constraint ensures status is 'active' or 'inactive'
   - `admin_offers_rating_check` ensures rating is 0-5

#### Duplicate Prevention Strategy

1. **External ID Uniqueness**:
   - Check before insert/update
   - Return 409 Conflict if duplicate detected
   - Frontend: Show specific error message

2. **Business Logic Validation**:
   - Date range validation
   - URL format validation
   - Enum value validation

3. **Bulk Upload Duplicate Handling**:
   - Check duplicates within upload batch
   - Check duplicates against existing database records
   - Report all duplicates in error response

---

## 7. Scalability & Future Readiness

### 7.1 Future Feature: Offer Scheduling

**Design Considerations**:

1. **Database Schema**: Already supports `date_start` and `date_end`
   - Can automatically activate/deactivate offers based on dates
   - Frontend can filter by date status

2. **Backend Enhancement**:
   - Scheduled job (cron) to update `status` based on dates
   - Or real-time check in listing API (calculate status on-the-fly)

3. **Frontend Enhancement**:
   - Show "Upcoming" offers in separate section
   - Auto-refresh when offers transition states

**Integration Points**:
- Use existing `date_start`/`date_end` fields
- Add cron job or background worker to update `status`/`is_enabled`
- Frontend filters already support date-based filtering

---

### 7.2 Future Feature: Usage Limits

**Design Considerations**:

1. **Database Schema Enhancement**:
   - Add columns: `usage_limit` (integer), `usage_count` (integer, default: 0)
   - Or create separate `offer_usage` tracking table

2. **API Enhancement**:
   - Track offer usage when users claim/use offers
   - Prevent usage when limit reached

3. **Admin UI Enhancement**:
   - Display usage statistics in offer dashboard
   - Show progress bars for usage limits

**Integration Points**:
- Can extend `admin_offers` table without breaking existing code
- Frontend can display usage metrics from `performance_metrics` JSONB field (temporary solution)

---

### 7.3 Future Feature: User-Specific or Plan-Specific Offers

**Design Considerations**:

1. **Database Schema Enhancement**:
   - Option A: Add `target_users` (uuid[]) and `target_plans` (text[]) columns
   - Option B: Create junction tables: `offer_users`, `offer_plans`

2. **API Enhancement**:
   - Filter offers by user/plan in listing API
   - Add `target_user_id` and `target_plan` query params

3. **Admin UI Enhancement**:
   - Add user/plan selection in create/edit forms
   - Show target restrictions in offer dashboard

**Integration Points**:
- Can add columns/tables without breaking existing functionality
- Frontend can conditionally show user/plan filters when feature is enabled

---

### 7.4 Scalability Considerations

#### Database Performance

1. **Indexes**: Already in place
   - `idx_admin_offers_active` for filtering active offers
   - `idx_admin_offers_category` for category filtering
   - `idx_admin_offers_region_gin` for region filtering (GIN index for arrays)
   - `idx_admin_offers_sorting` for sorting
   - `idx_admin_offers_dates` for date filtering

2. **Query Optimization**:
   - Use indexes effectively in WHERE clauses
   - Limit result sets with pagination
   - Consider materialized views for complex aggregations (future)

#### API Performance

1. **Caching** (Future):
   - Cache frequently accessed offers (Redis or in-memory)
   - Invalidate on create/update/delete

2. **Rate Limiting** (Future):
   - Limit API requests per admin user
   - Prevent abuse of bulk upload endpoint

3. **Background Processing** (Future):
   - For very large bulk uploads (>1000 rows), process asynchronously
   - Return job ID, poll for status

#### Frontend Performance

1. **Code Splitting**: 
   - Lazy load offer management page if needed

2. **Optimistic Updates**:
   - Update UI immediately on create/update/delete
   - Rollback on error

3. **Virtual Scrolling**:
   - For very large lists (1000+ offers), use virtual scrolling

---

## 8. Implementation Checklist

### Phase 1: Core Functionality

- [ ] Create API route: `GET /api/admin/offers` (list with filters)
- [ ] Create API route: `POST /api/admin/offers` (create single)
- [ ] Create API route: `GET /api/admin/offers/[id]` (get single)
- [ ] Create API route: `PATCH /api/admin/offers/[id]` (update)
- [ ] Create API route: `DELETE /api/admin/offers/[id]` (delete)
- [ ] Update `app/admin/offers/page.tsx` with offer listing
- [ ] Implement create offer form (manual entry)
- [ ] Implement edit offer form
- [ ] Implement delete confirmation dialog

### Phase 2: Bulk Upload

- [ ] Install Excel parsing library (`xlsx` or `exceljs`)
- [ ] Create API route: `POST /api/admin/offers/bulk-upload`
- [ ] Create Excel template download functionality
- [ ] Implement file upload UI with preview
- [ ] Implement bulk upload error reporting

### Phase 3: Enhancements

- [ ] Add advanced filters (date status, category, region)
- [ ] Implement pagination UI
- [ ] Add sorting functionality
- [ ] Add search functionality
- [ ] Optimize queries and add caching (if needed)

### Phase 4: Future Features (Optional)

- [ ] Implement offer scheduling (cron job or background worker)
- [ ] Add usage limits tracking
- [ ] Add user/plan-specific targeting

---

## 9. Summary

This design provides a comprehensive approach to integrating Offer Management into the existing admin panel. The architecture follows existing patterns (admin authentication, API route structure, database access), ensuring consistency and maintainability.

**Key Design Decisions**:
1. **Manual + Bulk Creation**: Supports both individual and bulk operations
2. **Soft Delete by Default**: Preserves data while allowing "deletion"
3. **Database-First Validation**: Leverages existing constraints and indexes
4. **Future-Ready Schema**: Existing schema supports scheduling and extensions
5. **Security First**: Admin-only access at multiple layers

**Next Steps**:
1. Review and approve this design
2. Implement Phase 1 (core functionality)
3. Test thoroughly
4. Deploy to staging
5. Iterate based on feedback

---

## 10. Final Decisions & Recommendations

### Decision 1: Soft Delete Strategy

**✅ RECOMMENDATION: Add `deleted_at` column (not `is_enabled` for deletion)**

**Rationale**:
- **Separation of Concerns**: `is_enabled` represents active/inactive state (business logic), while `deleted_at` represents deletion state (data lifecycle)
- **Restoration Capability**: Soft-deleted offers can be restored by setting `deleted_at = NULL`, without affecting `is_enabled` state
- **Audit & Analytics**: Clear audit trail of when offers were deleted
- **Query Clarity**: List queries filter `WHERE deleted_at IS NULL`, making intent explicit
- **Future-Proof**: If hard delete is needed later, soft-deleted records can be cleaned up separately

**Implementation**:
- Add `deleted_at timestamp with time zone NULL` column to `admin_offers` table
- Default delete operation sets `deleted_at = NOW()` (keep `is_enabled` unchanged initially, or set to `false` as secondary step)
- List queries filter: `WHERE deleted_at IS NULL`
- Separate restore action sets `deleted_at = NULL`

---

### Decision 2: External ID Mutability

**✅ RECOMMENDATION: `external_id` is IMMUTABLE after creation**

**Rationale**:
- **Data Integrity**: If `external_id` is used for external integrations or references, changing it breaks those references
- **Audit Trail**: Maintains historical consistency - the ID used at creation remains constant
- **Error Prevention**: Prevents accidental changes that could break integrations
- **Standard Practice**: External identifiers are typically immutable in enterprise systems

**Implementation**:
- Allow setting `external_id` only during creation (`POST`)
- Reject updates to `external_id` in `PATCH` requests (return 400 if attempted)
- Frontend: Disable `external_id` field in edit form (or make it read-only)

---

### Decision 3: Bulk Upload Transaction Strategy

**✅ RECOMMENDATION: Partial Success with Per-Row Error Reporting**

**Rationale**:
- **Better UX**: Admin can upload 1000 offers, and 50 fail - they still get 950 created. All-or-nothing would require fixing 50 rows and re-uploading all 1000
- **Efficiency**: Saves time and API calls - don't lose progress due to single bad row
- **Practical**: Excel files often have formatting errors in a few rows - partial success is more forgiving
- **Error Transparency**: Detailed per-row error reporting helps admin fix issues quickly

**Implementation**:
- Process rows individually or in small batches (10-20 rows per transaction)
- Commit successful rows, rollback only failed rows
- Collect all errors and return comprehensive report
- Return: `{ created: 50, skipped: 5, errors: [{ row: 3, errors: [...] }] }`

---

### Decision 4: Excel Template Availability

**✅ RECOMMENDATION: Provide Downloadable Excel Template**

**Rationale**:
- **Reduces Errors**: Ensures correct column headers and format from the start
- **Better UX**: Admin doesn't need to manually create format - just download and fill
- **Documentation**: Template serves as live documentation of expected format
- **Efficiency**: Faster onboarding - new admins can start immediately

**Implementation**:
- Create template Excel file (`.xlsx`) with column headers
- Include sample row with example data
- Provide download button/link in bulk upload UI
- Store template in `public/templates/` or generate dynamically

---

### Decision 5: Timezone Strategy

**✅ RECOMMENDATION: Store UTC, Display in Admin's Local Timezone**

**Rationale**:
- **Database Best Practice**: Always store timestamps in UTC (`timestamp with time zone` handles this automatically in PostgreSQL)
- **Consistency**: Database queries and comparisons are timezone-agnostic
- **Flexibility**: Can display in any timezone without data conversion
- **Standard**: Aligns with PostgreSQL and industry best practices

**Implementation**:
- **Storage**: Use `timestamp with time zone` (already in schema) - PostgreSQL converts to UTC automatically
- **API Response**: Return ISO 8601 strings with UTC (e.g., `"2024-06-01T00:00:00Z"`)
- **Frontend Display**: Convert UTC to admin's local timezone using JavaScript `Date` object or library (e.g., `date-fns-tz`)
- **Form Input**: Accept dates in admin's local timezone, convert to UTC before sending to API

**Display Options**:
- Default to server timezone or UTC for simplicity (Phase 1)
- Future enhancement: Detect admin's browser timezone or allow timezone preference setting

---

### Decision 6: Performance Metrics Management

**✅ RECOMMENDATION: System-Controlled (Read-Only in Admin UI)**

**Rationale**:
- **Data Integrity**: `performance_metrics` should reflect actual usage data, not manually edited values
- **Prevents Manipulation**: Admins shouldn't be able to artificially inflate metrics
- **Accuracy**: Metrics should be calculated from actual offer interactions (clicks, conversions, etc.)
- **Audit**: Manual edits would break audit trail of actual performance

**Implementation**:
- **Admin Form**: Display `performance_metrics` as read-only JSON viewer (formatted display)
- **Updates**: System updates `performance_metrics` based on actual offer usage/analytics
- **Future Enhancement**: Admin dashboard could show analytics/reports derived from `performance_metrics`, but not edit raw data
- **Backend**: Reject attempts to update `performance_metrics` via API (return 400, or silently ignore)

**Alternative Consideration**:
- If admin needs to input initial/estimated metrics for new offers, allow setting during creation only, but prevent edits after creation

---

## 11. Implementation Summary

**Finalized Decisions**:
1. ✅ **Soft Delete**: Use `deleted_at` column (add to schema)
2. ✅ **External ID**: Immutable after creation
3. ✅ **Bulk Upload**: Partial success with error reporting
4. ✅ **Excel Template**: Provide downloadable template
5. ✅ **Timezone**: Store UTC, display in admin's local timezone
6. ✅ **Performance Metrics**: System-controlled, read-only in admin UI

**Schema Changes Required**:
- Add `deleted_at timestamp with time zone NULL` column to `admin_offers` table

**Implementation Notes**:
- All dates stored in UTC automatically (PostgreSQL `timestamp with time zone`)
- `external_id` field disabled in edit forms
- `performance_metrics` displayed as read-only JSON viewer
- Bulk upload processes rows individually with comprehensive error reporting

---

*Document Version: 2.0*  
*Last Updated: 2024*  
*Author: AI Assistant*  
*Status: FINALIZED - Ready for Implementation*

