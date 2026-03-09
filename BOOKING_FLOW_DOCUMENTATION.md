# 📅 Booking Slot Creation Flow

**Complete documentation of endpoints and processes when creating a new booking**

---

## 🎯 Overview

When a user creates a booking, multiple systems coordinate to:
1. Validate the slot availability
2. Create the booking record
3. Update station capacity
4. Mark timeline as red/booked
5. Send notifications and emails

---

## 📡 API Endpoints Used

### 1. **Create Booking** (Main Endpoint)
```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "stationId": "65f8a2b3c4d5e6f7g8h9i0j1",
  "chargerType": "Type 2",
  "startTime": "2026-02-25T10:00:00Z",
  "endTime": "2026-02-25T12:00:00Z",
  "vehicleId": "65f8a2b3c4d5e6f7g8h9i0j2",
  "currentCharge": 20,
  "targetCharge": 80,
  "notes": "Optional notes"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "_id": "booking_id",
    "userId": "user_id",
    "stationId": "station_id",
    "chargerId": "Type2_0_0",
    "chargerType": "Type 2",
    "startTime": "2026-02-25T10:00:00.000Z",
    "endTime": "2026-02-25T12:00:00.000Z",
    "duration": 120,
    "status": "confirmed",
    "pricing": {
      "basePrice": 10,
      "estimatedCost": 1200
    }
  }
}
```

---

### 2. **Get Timeline Bookings** (For Visualization)
```http
GET /api/public/bookings/station/:stationId/timeline?date=2026-02-25&chargerType=Type%202
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "startTime": "2026-02-25T10:00:00.000Z",
      "endTime": "2026-02-25T12:00:00.000Z",
      "chargerType": "Type 2",
      "paymentStatus": "success"
    }
  ]
}
```

**Purpose:** Frontend queries this to display red bars on timeline

---

### 3. **Check Availability** (Pre-validation)
```http
GET /api/availability/station/:stationId/timerange?startTime=2026-02-25T10:00:00Z&endTime=2026-02-25T12:00:00Z&chargerType=Type%202
```

**Response:**
```json
{
  "success": true,
  "data": {
    "stationId": "station_id",
    "availableForTimeRange": true,
    "availableChargers": 3,
    "totalChargers": 5,
    "overlappingBookings": 2
  }
}
```

---

## 🔄 Step-by-Step Booking Process

### **Phase 1: User Interaction (Frontend)**

1. **User selects slot on timeline**
   - Component: `BookingTimeline.jsx`
   - User clicks on green (available) time slot
   - Timeline shows 30-minute intervals (00:00, 00:30, 01:00, etc.)

2. **Slot selection triggers callback**
   ```jsx
   onSlotSelect({
     startTime: "2026-02-25T10:00:00Z",
     endTime: "2026-02-25T12:00:00Z"  // Default 2-hour duration
   })
   ```

3. **User fills booking form**
   - Select vehicle
   - Enter current battery charge (%)
   - Enter target battery charge (%)
   - Add optional notes

4. **User submits booking**
   - Frontend makes POST request to `/api/bookings`

---

### **Phase 2: Backend Validation (booking.controller.js)**

**File:** `backend/src/controllers/booking.controller.js` → `createBooking()`

#### **Step 1: Validate Input** ✅
```javascript
// Check required fields
- stationId, chargerType, startTime, endTime
- vehicleId, currentCharge, targetCharge

// Validate charge levels
- currentCharge: 0-100%
- targetCharge: 0-100%
- targetCharge > currentCharge
```

#### **Step 2: Check Station Availability** 🏢
```javascript
// Verify station exists and is active
const station = await Station.findById(stationId);
if (station.operational.status !== 'active') {
  return error("Station not available");
}
```

#### **Step 3: Check Vehicle** 🚗
```javascript
// Verify vehicle exists and is active
const vehicle = await Vehicle.findById(vehicleId);
if (!vehicle || !vehicle.isActive) {
  return error("Vehicle not found");
}
```

#### **Step 4: Find Available Charger** 🔌
```javascript
// Find charger of requested type that's available
const availableCharger = station.capacity.chargers.find(
  charger => charger.type === chargerType && charger.isAvailable
);

if (!availableCharger) {
  return error("No available chargers");
}
```

#### **Step 5: Validate Time Slot** ⏰
```javascript
// Check timing
const start = new Date(startTime);
const end = new Date(endTime);
const now = new Date();

// Must be at least 10 minutes in future
if (start < now + 10 minutes) {
  return error("Start time must be 10+ minutes from now");
}

// End must be after start
if (end <= start) {
  return error("Invalid time range");
}
```

#### **Step 6: Check for Conflicts** 🚫
```javascript
// Check 1: Station charger availability
const overlappingBooking = await Booking.findOne({
  stationId,
  chargerId: availableCharger.chargerId,
  status: { $in: ['pending', 'confirmed', 'active'] },
  $or: [
    { startTime: { $lt: end }, endTime: { $gt: start } }
  ]
});

if (overlappingBooking) {
  return error("Time slot already booked");
}

// Check 2: User's vehicle can't be at two places
const userOverlappingBooking = await Booking.findOne({
  userId,
  vehicleId,
  status: { $in: ['pending', 'confirmed', 'active'] },
  $or: [
    { startTime: { $lt: end }, endTime: { $gt: start } }
  ]
});

if (userOverlappingBooking) {
  return error("Vehicle already booked elsewhere");
}
```

#### **Step 7: Calculate Pricing** 💰
```javascript
// Duration in minutes
const duration = Math.round((end - start) / (1000 * 60));

// Per-minute pricing
const pricePerMinute = station.pricing.pricePerMinute; // e.g., ₹10/min
const estimatedCost = duration * pricePerMinute;

// Example: 2 hours (120 min) × ₹10 = ₹1,200
```

---

### **Phase 3: Database Updates** 💾

#### **Step 8: Update Station (BEFORE creating booking)** 🏢
```javascript
// Mark charger as unavailable
availableCharger.isAvailable = false;

// Decrease available slots
station.capacity.availableSlots = station.capacity.availableSlots - 1;

// Save station
await station.save();
```

**Why first?** If booking creation fails, we rollback station changes.

#### **Step 9: Create Booking Record** 📝
```javascript
const booking = new Booking({
  userId,
  stationId,
  chargerId: availableCharger.chargerId,
  chargerType,
  startTime: start,
  endTime: end,
  duration,
  vehicleId,
  currentCharge,
  targetCharge,
  pricing: {
    basePrice: pricePerMinute,
    estimatedCost
  },
  status: 'confirmed'  // ← Confirmed immediately
});

await booking.save();
```

#### **Step 10: Link Booking to Charger** 🔗
```javascript
// Update charger with booking reference
availableCharger.currentBooking = booking._id;
await station.save();
```

---

### **Phase 4: Post-Booking Actions** 📧🔔

#### **Step 11: Send Email Notification** 📧
```javascript
await sendBookingConfirmationEmail(booking, user, station);
```

**Email includes:**
- Booking details (time, station, charger)
- Cost estimate
- Directions to station
- QR code for charging session

#### **Step 12: Create In-App Notification** 🔔
```javascript
await createBookingNotification(userId, 'booking_confirmed', booking, station);
```

**Notification:**
- "Booking confirmed at [Station Name] for [Date/Time]"
- Click to view booking details

---

### **Phase 5: Timeline Update** 🎨

#### **Step 13: Frontend Refreshes Timeline** 🔄

**Automatic refresh triggers:**
1. When booking API returns success
2. Component re-fetches timeline data

```javascript
// BookingTimeline.jsx - useEffect dependency
useEffect(() => {
  fetchBookings(); // Calls GET /api/public/bookings/station/:id/timeline
}, [stationId, selectedDate, chargerType]);
```

#### **Step 14: Timeline Renders Booked Slots** 🔴

```javascript
// Check if slot is booked
const isSlotBooked = (slotTime) => {
  const slotDateTime = new Date(selectedDate + ' ' + slotTime);
  
  return bookings.some(booking => {
    const start = new Date(booking.startTime);
    const end = new Date(booking.endTime);
    return slotDateTime >= start && slotDateTime < end;
  });
};

// Render with color
<Box sx={{
  backgroundColor: isBooked 
    ? '#e57373'  // Red for booked
    : '#81c784', // Green for available
  cursor: isBooked ? 'not-allowed' : 'pointer'
}} />
```

**Visual Result:**
- ✅ **Green slots** = Available
- 🔴 **Red slots** = Booked (newly created booking appears here)
- ⚫ **Gray slots** = Past time (can't book)

---

## 🎬 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERACTION                          │
│  1. User views timeline (green/red/gray slots)                  │
│  2. User clicks green (available) slot                          │
│  3. User fills booking form                                      │
│  4. User submits booking                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                              │
│  POST /api/bookings                                              │
│  {                                                               │
│    stationId, chargerType,                                      │
│    startTime, endTime,                                          │
│    vehicleId, currentCharge, targetCharge                       │
│  }                                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                BACKEND - VALIDATION PHASE                        │
│  ✅ Validate input fields                                        │
│  ✅ Check station exists & active                                │
│  ✅ Check vehicle exists & active                                │
│  ✅ Verify charge levels (0-100%, target > current)             │
│  ✅ Find available charger of requested type                     │
│  ✅ Validate time slot (10+ min future, end > start)            │
│  ✅ Check for overlapping bookings (station + user)             │
│  ✅ Calculate pricing (duration × pricePerMinute)               │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│               DATABASE UPDATE PHASE                              │
│  1. Update Station:                                              │
│     - Mark charger as unavailable                               │
│     - Decrease availableSlots by 1                              │
│     - Save station                                              │
│                                                                  │
│  2. Create Booking:                                              │
│     - Create booking record with status='confirmed'             │
│     - Save booking to database                                  │
│                                                                  │
│  3. Link Booking:                                                │
│     - Set charger.currentBooking = booking._id                  │
│     - Save station again                                        │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST-BOOKING ACTIONS                                │
│  📧 Send email confirmation to user                              │
│  🔔 Create in-app notification                                   │
│  💰 Generate commission record (if franchise/corporate)          │
│  ✅ Return success response to frontend                          │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│              TIMELINE UPDATE (Frontend)                          │
│  1. Receive success response                                     │
│  2. Re-fetch timeline bookings:                                  │
│     GET /api/public/bookings/station/:id/timeline?date=X         │
│  3. Timeline component re-renders:                               │
│     - New booking appears as RED slot                           │
│     - Slot becomes unclickable                                  │
│     - Tooltip shows "Booked: 10:00 AM - 12:00 PM"               │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Database Collections Modified

### 1. **Bookings Collection** 📝
```javascript
// New document created
{
  _id: ObjectId("..."),
  userId: ObjectId("..."),           // Who made booking
  stationId: ObjectId("..."),        // Which station
  chargerId: "Type2_0_0",            // Specific charger
  chargerType: "Type 2",
  startTime: ISODate("..."),
  endTime: ISODate("..."),
  duration: 120,                     // minutes
  vehicleId: ObjectId("..."),
  currentCharge: 20,
  targetCharge: 80,
  status: "confirmed",               // ← Timeline shows this
  pricing: {
    basePrice: 10,
    estimatedCost: 1200
  },
  createdAt: ISODate("..."),
  updatedAt: ISODate("...")
}
```

### 2. **Stations Collection** 🏢
```javascript
// Updated fields
{
  capacity: {
    totalChargers: 5,
    availableSlots: 2,               // ← Decreased by 1
    chargers: [
      {
        chargerId: "Type2_0_0",
        type: "Type 2",
        isAvailable: false,          // ← Changed to false
        currentBooking: ObjectId("...") // ← Booking ID added
      }
    ]
  }
}
```

### 3. **Notifications Collection** 🔔
```javascript
// New notification created
{
  userId: ObjectId("..."),
  type: "booking_confirmed",
  title: "Booking Confirmed",
  message: "Your booking at Station X is confirmed",
  relatedBooking: ObjectId("..."),
  read: false,
  createdAt: ISODate("...")
}
```

---

## 🔍 Fraud Detection Integration

**Middleware:** `fraudDetectionMiddleware`

**Applied to:** `POST /api/bookings` route

**What it checks:**
- User's booking history
- Payment patterns
- Unusual booking frequency
- Risk scoring using Decision Tree ML model

**If fraud detected:**
```javascript
// Logs fraud attempt
await FraudAttemptLog.create({
  userId,
  bookingDetails: req.body,
  riskScore: 0.85,
  classification: "high_risk"
});

// Still allows booking but flags for admin review
```

---

## 🎨 Timeline Color Legend

| Color | Status | Meaning |
|-------|--------|---------|
| 🟢 **Green** `#81c784` | Available | User can click to book |
| 🔴 **Red** `#e57373` | Booked | Time slot already reserved |
| ⚫ **Gray** `#cccccc` | Past | Cannot book past time slots |

---

## ⚡ Key Features

### 1. **Real-time Conflict Prevention** ✅
- Database-level checks for overlapping bookings
- Prevents double-booking same charger
- Prevents user vehicle being in two places

### 2. **Automatic Slot Management** 🔄
- Timeline auto-refreshes after booking
- Newly booked slots immediately turn red
- Available slots decrease in real-time

### 3. **Rollback on Failure** 🔄
If booking creation fails after station update:
```javascript
// Restore station state
availableCharger.isAvailable = true;
availableCharger.currentBooking = null;
station.capacity.availableSlots += 1;
await station.save();
```

### 4. **Minimum Lead Time** ⏰
```javascript
// Must book at least 10 minutes in advance
const tenMinutesFromNow = new Date(Date.now() + 10 * 60 * 1000);
if (startTime < tenMinutesFromNow) {
  return error("Too soon! Need 10+ min lead time");
}
```

### 5. **Date Range Display** 📅
- Timeline shows 24-hour day (00:00 - 23:59)
- 30-minute slot intervals (48 slots total)
- Navigate previous/next days with arrow buttons
- Cannot select past dates

---

## 🧪 Example: Complete Timeline Update

**Before Booking:**
```
Station: EV Hub Downtown
Date: 2026-02-25
Charger Type: Type 2

Timeline at 10:00 AM slot:
┌────────────┐
│            │ ← Green (Available)
│  10:00 AM  │ ← User can click
│            │
└────────────┘
```

**User creates booking:** 10:00 AM - 12:00 PM

**After Booking:**
```
Timeline at 10:00 AM - 12:00 PM:
┌────────────┬────────────┬────────────┬────────────┐
│ XXXXXXXXXX │ XXXXXXXXXX │ XXXXXXXXXX │ XXXXXXXXXX │ ← Red (Booked)
│  10:00 AM  │  10:30 AM  │  11:00 AM  │  11:30 AM  │ ← Can't click
│ XXXXXXXXXX │ XXXXXXXXXX │ XXXXXXXXXX │ XXXXXXXXXX │
└────────────┴────────────┴────────────┴────────────┘
```

**Tooltip on hover:**
```
🔴 Booked
10:00 AM - 12:00 PM
```

---

## 📞 Related Endpoints

### **Get User's Bookings**
```http
GET /api/bookings/my-bookings
Authorization: Bearer <token>
```

### **Cancel Booking**
```http
PATCH /api/bookings/:bookingId/cancel
Authorization: Bearer <token>
```
**Effect:** Timeline slot turns green again

### **Update Booking**
```http
PATCH /api/bookings/:bookingId
Authorization: Bearer <token>
```
**Effect:** Old slot becomes green, new slot becomes red

### **Station Availability (Real-time)**
```http
GET /api/availability/station/:stationId
```

---

## 🔐 Security & Validation

1. **Authentication Required** 🔒
   - All booking endpoints need JWT token
   - userId extracted from token

2. **Fraud Detection** 🛡️
   - ML-based risk scoring
   - Logs suspicious patterns

3. **Input Sanitization** 🧹
   - MongoDB injection prevention
   - XSS protection

4. **Rate Limiting** ⚡
   - Prevents spam bookings
   - Max 10 requests/minute per user

---

## 📝 Summary

**When a booking is created:**

1. ✅ **Validation** - Check all inputs, station, vehicle, conflicts
2. 💾 **Station Update** - Mark charger unavailable, decrease slots
3. 📝 **Booking Created** - Save booking with status='confirmed'
4. 🔗 **Link Booking** - Connect booking to charger
5. 📧 **Notifications** - Send email + in-app notification
6. 🔄 **Timeline Refresh** - Frontend re-fetches bookings
7. 🔴 **Visual Update** - Booked slots turn RED and become unclickable

**Result:** Users immediately see the slot as unavailable for that date/time/charger type.

---

**Last Updated:** February 24, 2026  
**Version:** 1.0
