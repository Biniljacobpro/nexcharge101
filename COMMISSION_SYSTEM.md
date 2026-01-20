# Commission Calculation Automation System

## Overview
This document outlines the complete commission calculation automation system implemented for franchise and corporate features. The system automatically calculates, tracks, and manages commission earnings based on completed bookings.

## Features
- ✅ Automatic commission generation on booking completion
- ✅ Tax calculation (18% GST on commission amount)
- ✅ Commission status tracking (pending → approved → paid)
- ✅ Separate tracking for franchise and corporate commissions
- ✅ Monthly and quarterly summaries
- ✅ Admin approval workflow
- ✅ Payment marking functionality
- ✅ Dashboard integration with full UI

## Backend Implementation

### 1. Commission Model
**File:** `backend/src/models/commission.model.js`

**Schema Fields:**
- `entityType`: 'franchise' or 'corporate'
- `entityId`: Reference to franchise or corporate ID
- `bookingId`: Reference to booking
- `paymentId`: Reference to payment (optional)
- `source`: 'booking' or 'payment'
- `baseAmount`: Original amount before commission
- `commissionRate`: Percentage rate (e.g., 10 for 10%)
- `commissionAmount`: Calculated commission
- `taxAmount`: Tax on commission (18% GST)
- `netCommission`: Commission after tax
- `status`: 'pending' | 'approved' | 'paid' | 'cancelled' | 'disputed'
- `period`: { month, year, quarter }
- `paidAt`: Payment timestamp
- `approvedBy`: Admin who approved
- `notes`: Additional information

**Static Methods:**
```javascript
// Calculate commission with tax
Commission.calculateCommission(baseAmount, rate, taxRate);

// Get aggregated summary
Commission.getSummary(query);

// Get monthly summary
Commission.getMonthlySummary(entityType, entityId, year);
```

**Indexes:**
- entityType + entityId + createdAt (performance)
- bookingId (fast lookup)
- status + entityType (filtering)

### 2. Commission Controller
**File:** `backend/src/controllers/commission.controller.js`

**Functions:**

1. **`generateCommissionFromBooking(bookingId)`**
   - Auto-generates commission on booking completion
   - Determines entity type (franchise/corporate)
   - Applies default rates: Franchise 10%, Corporate 15%
   - Calculates tax (18% GST)
   - Creates commission record with 'pending' status

2. **`getFranchiseCommissions(req, res)`**
   - GET `/api/commissions/franchise/:franchiseId`
   - Query params: status, year, month, page, limit
   - Returns paginated list of commissions
   - Includes booking details

3. **`getCorporateCommissions(req, res)`**
   - GET `/api/commissions/corporate/:corporateId`
   - Query params: status, year, month, page, limit
   - Returns paginated list of commissions
   - Includes booking details

4. **`getMonthlyCommissionSummary(req, res)`**
   - GET `/api/commissions/:entityType/:entityId/monthly-summary`
   - Query params: year
   - Returns monthly breakdown with totals

5. **`getCommissionStats(req, res)`**
   - GET `/api/commissions/:entityType/:entityId/stats`
   - Returns: total, thisMonth, pending, paid amounts

6. **`approveCommission(req, res)`** [ADMIN ONLY]
   - PATCH `/api/commissions/:commissionId/approve`
   - Updates status to 'approved'
   - Records admin who approved

7. **`markCommissionPaid(req, res)`** [ADMIN ONLY]
   - PATCH `/api/commissions/:commissionId/pay`
   - Updates status to 'paid'
   - Records payment date and transaction ID

8. **`getAllCommissions(req, res)`** [ADMIN ONLY]
   - GET `/api/commissions/all`
   - Returns all commissions with filters
   - For admin overview

### 3. Commission Routes
**File:** `backend/src/routes/commission.routes.js`

**Endpoints:**
```javascript
GET    /api/commissions/franchise/:franchiseId
GET    /api/commissions/corporate/:corporateId
GET    /api/commissions/:entityType/:entityId/stats
GET    /api/commissions/:entityType/:entityId/monthly-summary
GET    /api/commissions/all [ADMIN]
PATCH  /api/commissions/:commissionId/approve [ADMIN]
PATCH  /api/commissions/:commissionId/pay [ADMIN]
```

**Middleware:**
- `requireAuth`: All routes protected
- `adminOnly`: Admin-specific routes

### 4. Booking Integration
**File:** `backend/src/controllers/booking.controller.js`

**Changes:**
- Import: `generateCommissionFromBooking`
- Modified: `completeBooking()` function
- After booking completion, calls `generateCommissionFromBooking(bookingId)`
- Error handling prevents commission failure from blocking booking completion

**Code:**
```javascript
// Auto-generate commission record
try {
  await generateCommissionFromBooking(booking._id);
} catch (commError) {
  console.error('Commission generation error:', commError);
  // Don't fail booking completion due to commission error
}
```

### 5. Server Configuration
**File:** `backend/src/index.js`

**Changes:**
```javascript
const commissionRoutes = require('./routes/commission.routes');
app.use('/api/commissions', commissionRoutes);
```

## Frontend Implementation

### 1. API Functions
**File:** `frontend/src/utils/api.js`

**Added Functions:**
```javascript
// Get franchise commissions with filters
export const getFranchiseCommissions = (franchiseId, params = {}) => {...}

// Get corporate commissions with filters
export const getCorporateCommissions = (corporateId, params = {}) => {...}

// Get commission statistics
export const getCommissionStats = (entityType, entityId) => {...}

// Get monthly summary
export const getMonthlyCommissionSummary = (entityType, entityId, year) => {...}

// Admin functions
export const getAllCommissions = (params = {}) => {...}
export const approveCommission = (commissionId) => {...}
export const markCommissionPaid = (commissionId, paymentData) => {...}
```

### 2. Franchise Commissions Page
**File:** `frontend/src/pages/FranchiseCommissionsPage.jsx`

**Features:**
- **4 Stat Cards** with gradient backgrounds:
  - Total Earnings (blue gradient)
  - This Month (green gradient)
  - Pending (orange gradient)
  - Paid (purple gradient)

- **Filter Panel:**
  - Status dropdown (All, Pending, Approved, Paid)
  - Year selector (2020-2030)
  - Month dropdown (All, Jan-Dec)

- **Data Table** with columns:
  - Date
  - Booking ID
  - Base Amount
  - Commission %
  - Commission Amount
  - Tax (18%)
  - Net Amount
  - Status (with colored chips)
  - Notes

- **Pagination:** 10 items per page

- **Currency Formatting:** ₹ with 2 decimals

- **Automatic Loading:** Uses franchiseId from localStorage

### 3. Corporate Commissions Page
**File:** `frontend/src/pages/CorporateCommissionsPage.jsx`

**Features:** Identical to FranchiseCommissionsPage but uses:
- `corporateId` from localStorage
- `getCorporateCommissions` API
- Adjusted labels for corporate context

### 4. App Routing
**File:** `frontend/src/App.jsx`

**Added Routes:**
```jsx
<Route path="/franchise/commissions" element={<FranchiseCommissionsPage />} />
<Route path="/corporate/commissions" element={<CorporateCommissionsPage />} />
```

### 5. Franchise Dashboard Integration
**File:** `frontend/src/pages/FranchiseOwnerDashboard.jsx`

**Changes:**

1. **Navigation Item:**
```jsx
{
  id: 'commissions',
  label: 'Commissions',
  icon: <MoneyIcon />,
  description: 'View and track commission earnings'
}
```

2. **Render Content:**
```jsx
case 'commissions':
  return renderCommissions();
```

3. **Render Function:**
```jsx
const renderCommissions = () => {
  // Returns info card with button to navigate to /franchise/commissions
  // Shows alert about automatic calculation
  // Provides "View Full Report" button
};
```

### 6. Corporate Dashboard Integration
**File:** `frontend/src/pages/CorporateDashboard.jsx`

**Changes:** Same as Franchise Dashboard:
1. Added `MoneyIcon` import
2. Added navigation item
3. Added render case
4. Added `renderCommissions()` function
5. Added `useNavigate` import

## Commission Calculation Flow

### Automatic Generation
```
1. User completes booking
   ↓
2. Booking status → 'completed'
   ↓
3. completeBooking() called
   ↓
4. generateCommissionFromBooking() triggered
   ↓
5. Determine entity (franchise/corporate)
   ↓
6. Apply commission rate (10% or 15%)
   ↓
7. Calculate commission amount
   ↓
8. Calculate tax (18% GST)
   ↓
9. Calculate net commission
   ↓
10. Create commission record (status: 'pending')
```

### Approval Workflow
```
Pending → Admin Reviews → Approved → Payment Processed → Paid
   ↓           ↓              ↓             ↓
Created    Review Queue   Ready to Pay   Complete
```

## Tax Calculation

**GST Rate:** 18%

**Formula:**
```javascript
commissionAmount = baseAmount * (commissionRate / 100)
taxAmount = commissionAmount * 0.18
netCommission = commissionAmount + taxAmount
```

**Example:**
```
Base Amount: ₹10,000
Commission Rate: 10%
Commission Amount: ₹1,000
Tax (18%): ₹180
Net Commission: ₹1,180
```

## Default Commission Rates

- **Franchise:** 10%
- **Corporate:** 15%

*Note: Rates can be customized per entity in future enhancements*

## Status States

1. **pending**: Commission calculated, awaiting approval
2. **approved**: Admin approved, ready for payment
3. **paid**: Payment completed
4. **cancelled**: Commission cancelled (e.g., refunded booking)
5. **disputed**: Issue with commission calculation

## Data Security

- All routes protected with `requireAuth` middleware
- Admin-only routes require `adminOnly` middleware
- Entity verification ensures users only see their own commissions
- JWT token-based authentication

## Testing Checklist

### Backend Testing
- [ ] Commission auto-generation on booking completion
- [ ] Correct commission rates applied
- [ ] Tax calculation accuracy (18%)
- [ ] Status transitions (pending → approved → paid)
- [ ] Filter queries (status, year, month)
- [ ] Pagination functionality
- [ ] Admin approval workflow
- [ ] Payment marking workflow
- [ ] Error handling for invalid bookings

### Frontend Testing
- [ ] Franchise commissions page loads correctly
- [ ] Corporate commissions page loads correctly
- [ ] Stat cards display accurate data
- [ ] Filters work (status, year, month)
- [ ] Pagination navigation
- [ ] Currency formatting (₹)
- [ ] Status chip colors
- [ ] Navigation from dashboard
- [ ] "View Full Report" button works
- [ ] Responsive layout

### Integration Testing
- [ ] Complete booking → commission created
- [ ] Commission appears in franchise/corporate dashboard
- [ ] Stats update in real-time
- [ ] Monthly summary accuracy
- [ ] Quarterly summary accuracy
- [ ] Admin can approve commissions
- [ ] Admin can mark as paid
- [ ] Payment date recorded correctly

## Database Indexes

For optimal performance, the following indexes are created:

1. `entityType_entityId_createdAt`: Fast entity-based queries
2. `bookingId`: Quick booking lookups
3. `status_entityType`: Efficient filtering
4. Default `_id` index

## Future Enhancements

1. **Custom Commission Rates:**
   - Allow setting custom rates per franchise/corporate
   - Store in franchise/corporate profile

2. **Commission Reports:**
   - PDF generation
   - Export to CSV/Excel
   - Email reports to entities

3. **Commission Disputes:**
   - Dispute resolution workflow
   - Communication system
   - Evidence upload

4. **Payment Integration:**
   - Direct payment gateway integration
   - Automatic payment scheduling
   - Payment reminders

5. **Analytics Dashboard:**
   - Trend analysis
   - Comparative reports
   - Forecasting

6. **Notifications:**
   - Email notifications on commission creation
   - SMS alerts for approvals
   - Payment confirmation emails

7. **Tiered Commission Rates:**
   - Performance-based rates
   - Volume-based incentives
   - Seasonal adjustments

## API Documentation

### Get Franchise Commissions
```http
GET /api/commissions/franchise/:franchiseId
Authorization: Bearer <token>

Query Parameters:
- status: string (pending|approved|paid|cancelled|disputed)
- year: number (2020-2030)
- month: number (1-12)
- page: number (default: 1)
- limit: number (default: 10)

Response:
{
  success: true,
  data: [
    {
      _id: "...",
      entityType: "franchise",
      bookingId: { ... },
      baseAmount: 10000,
      commissionRate: 10,
      commissionAmount: 1000,
      taxAmount: 180,
      netCommission: 1180,
      status: "pending",
      period: { month: 1, year: 2024, quarter: 1 },
      createdAt: "2024-01-15T..."
    }
  ],
  pagination: {
    total: 50,
    page: 1,
    pages: 5,
    limit: 10
  }
}
```

### Get Commission Stats
```http
GET /api/commissions/:entityType/:entityId/stats
Authorization: Bearer <token>

Response:
{
  success: true,
  data: {
    totalEarnings: 15000,
    thisMonth: 2500,
    pendingAmount: 1000,
    paidAmount: 14000
  }
}
```

### Approve Commission (Admin)
```http
PATCH /api/commissions/:commissionId/approve
Authorization: Bearer <admin-token>

Body:
{
  notes: "Approved for payment"
}

Response:
{
  success: true,
  data: {
    _id: "...",
    status: "approved",
    approvedBy: "admin-id",
    approvedAt: "2024-01-15T...",
    notes: "Approved for payment"
  }
}
```

### Mark Commission Paid (Admin)
```http
PATCH /api/commissions/:commissionId/pay
Authorization: Bearer <admin-token>

Body:
{
  transactionId: "TXN123456",
  notes: "Payment processed via bank transfer"
}

Response:
{
  success: true,
  data: {
    _id: "...",
    status: "paid",
    paidAt: "2024-01-15T...",
    paymentDetails: {
      transactionId: "TXN123456",
      notes: "Payment processed via bank transfer"
    }
  }
}
```

## Troubleshooting

### Commission Not Generated
**Problem:** Booking completed but no commission record created

**Solutions:**
1. Check booking status is 'completed'
2. Verify franchise/corporate association
3. Check server logs for errors
4. Ensure commission controller imported in booking controller

### Wrong Commission Amount
**Problem:** Commission calculation incorrect

**Solutions:**
1. Verify commission rate (franchise: 10%, corporate: 15%)
2. Check base amount calculation
3. Verify tax rate (18%)
4. Review commission model calculation logic

### Stats Not Updating
**Problem:** Dashboard stats not reflecting new commissions

**Solutions:**
1. Clear browser cache
2. Check API response in network tab
3. Verify localStorage has correct entityId
4. Check query filters (year, month, status)

### Permission Denied
**Problem:** User cannot access commission pages

**Solutions:**
1. Verify JWT token is valid
2. Check user role (franchise/corporate)
3. Ensure entityId matches user's entity
4. Verify middleware chain in routes

## Summary

The Commission Calculation Automation System provides:
- ✅ **Automatic** commission generation on booking completion
- ✅ **Accurate** tax calculation (18% GST)
- ✅ **Transparent** tracking with status workflow
- ✅ **Comprehensive** dashboard UI with filters
- ✅ **Secure** access control with role-based permissions
- ✅ **Scalable** architecture with proper indexing
- ✅ **Admin-friendly** approval and payment workflows

The system is fully integrated into both franchise and corporate dashboards, providing seamless access to commission information without leaving the main dashboard interface.
