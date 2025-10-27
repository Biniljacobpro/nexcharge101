# NexCharge EV Charging Station Management System - UML Documentation

## Project Overview

NexCharge is a comprehensive Electric Vehicle (EV) charging station management system that connects EV users with charging stations. The system provides a platform for users to find, book, and pay for charging sessions at various stations. It also offers management capabilities for different stakeholder roles including corporate entities, franchise owners, and station managers.

The system features real-time availability tracking, predictive maintenance using machine learning, booking management, payment processing through Razorpay, and a notification system. It supports multiple user roles with role-based access control and provides dashboards for each role type with relevant metrics and management tools.

## System Architecture

The system follows a client-server architecture with:
- **Frontend**: React-based web application with Material-UI components
- **Backend**: Node.js with Express framework
- **Database**: MongoDB with Mongoose ODM
- **External Services**: Razorpay for payments, Firebase for authentication, Cloudinary for image storage

## Class Diagram

### Core Entities

#### 1. User
- **Attributes**:
  - _id: ObjectId
  - role: String [ev_user, station_manager, franchise_manager, franchise_owner, corporate_admin, admin]
  - personalInfo: Object
    - firstName: String
    - lastName: String
    - email: String
    - phone: String
    - address: String
    - profileImage: String
  - credentials: Object
    - passwordHash: String
    - lastLogin: Date
    - isActive: Boolean
    - twoFactorEnabled: Boolean
    - mustChangePassword: Boolean
    - resetOtpCode: String
    - resetOtpExpires: Date
    - resetOtpAttempts: Number
  - google: Object
    - googleId: String
    - emailVerified: Boolean
  - roleSpecificData: Object
    - evUserInfo: Object
      - vehicleInfo: VehicleInfoSchema
      - vehicles: [VehicleInfoSchema]
      - paymentMethods: [PaymentMethodSchema]
      - loyaltyPoints: Number
      - notificationPreferences: NotificationPrefsSchema
    - stationManagerInfo: Object
      - franchiseId: ObjectId
      - assignedStations: [ObjectId]
      - contactHours: String
      - commissionRate: Number
    - franchiseManagerInfo: Object
      - franchiseId: ObjectId
      - commissionRate: Number
      - accessLevel: String
      - businessType: String
      - registrationNumber: String
      - gstNumber: String
      - panNumber: String
    - franchiseOwnerInfo: Object
      - franchiseId: ObjectId
      - managedStations: [ObjectId]
      - profitShare: Number
    - corporateAdminInfo: Object
      - corporateId: ObjectId
      - accessLevel: String
      - managedFranchises: [ObjectId]
    - adminInfo: Object
      - permissions: [String]
      - lastPolicyUpdate: Date
  - createdAt: Date
  - updatedAt: Date

#### 2. Station
- **Attributes**:
  - _id: ObjectId
  - name: String
  - code: String
  - description: String
  - location: Object
    - address: String
    - city: String
    - state: String
    - country: String
    - pincode: String
    - dms: String
    - coordinates: Object
      - latitude: Number
      - longitude: Number
    - nearbyLandmarks: String
  - capacity: Object
    - totalChargers: Number
    - chargerTypes: [String]
    - maxPowerPerCharger: Number
    - totalPowerCapacity: Number
    - availableSlots: Number
    - chargers: [Object]
      - chargerId: String
      - type: String
      - power: Number
      - isAvailable: Boolean
      - currentBooking: ObjectId
  - pricing: Object
    - pricePerMinute: Number
    - cancellationPolicy: String
  - operational: Object
    - status: String
    - parkingSlots: Number
    - parkingFee: Number
    - operatingHours: Object
      - is24Hours: Boolean
      - customHours: Object
        - start: String
        - end: String
  - contact: Object
    - managerEmail: String
    - supportPhone: String
    - supportEmail: String
  - corporateId: ObjectId
  - franchiseId: ObjectId
  - managerId: ObjectId
  - analytics: Object
    - rating: Number
    - totalBookings: Number
    - totalReviews: Number
    - totalRevenue: Number
    - energyDelivered: Number
    - uptime: Number
    - lastMaintenance: Date
    - nextMaintenance: Date
  - amenities: [String]
  - images: [String]
  - documents: [Object]
    - name: String
    - url: String
    - type: String
    - uploadedAt: Date
  - latestRiskClassification: String
  - lastPredictionDate: Date
  - metadata: Object
  - createdBy: ObjectId
  - updatedBy: ObjectId
  - createdAt: Date
  - updatedAt: Date

#### 3. Booking
- **Attributes**:
  - _id: ObjectId
  - userId: ObjectId
  - stationId: ObjectId
  - chargerId: String
  - chargerType: String
  - startTime: Date
  - endTime: Date
  - duration: Number
  - vehicleId: ObjectId
  - currentCharge: Number
  - targetCharge: Number
  - pricing: Object
    - basePrice: Number
    - estimatedEnergy: Number
    - estimatedCost: Number
    - actualEnergy: Number
    - actualCost: Number
  - payment: Object
    - razorpayOrderId: String
    - razorpayPaymentId: String
    - razorpaySignature: String
    - paymentStatus: String
    - paymentMethod: String
    - paidAmount: Number
    - paymentDate: Date
    - refundId: String
    - refundAmount: Number
  - status: String
  - reminderSent: Boolean
  - notes: String
  - cancellationReason: String
  - cancelledAt: Date
  - cancelledBy: ObjectId
  - checkedInAt: Date
  - checkedOutAt: Date
  - otp: Object
    - code: String
    - generatedAt: Date
    - expiresAt: Date
    - verified: Boolean
  - chargingStatus: String
  - chargingStartedAt: Date
  - chargingStoppedAt: Date
  - createdAt: Date
  - updatedAt: Date

#### 4. Vehicle
- **Attributes**:
  - _id: ObjectId
  - make: String
  - model: String
  - vehicleType: String
  - batteryCapacity: Number
  - chargingAC: Object
    - supported: Boolean
    - maxPower: Number
    - connectorTypes: [String]
  - chargingDC: Object
    - supported: Boolean
    - maxPower: Number
    - connectorTypes: [String]
  - compatibleChargingStations: [ObjectId]
  - specifications: Object
    - year: Number
    - range: Number
    - chargingTime: Object
      - ac: Number
      - dc: Number
    - weight: Number
    - dimensions: Object
      - length: Number
      - width: Number
      - height: Number
  - images: [Object]
    - url: String
    - alt: String
    - isPrimary: Boolean
  - isActive: Boolean
  - createdBy: ObjectId
  - version: Number
  - createdAt: Date
  - updatedAt: Date

#### 5. Notification
- **Attributes**:
  - _id: ObjectId
  - userId: ObjectId
  - title: String
  - message: String
  - type: String
  - isRead: Boolean
  - isDeleted: Boolean
  - relatedBookingId: ObjectId
  - relatedStationId: ObjectId
  - actionType: String
  - actionData: Mixed
  - priority: String
  - createdAt: Date
  - readAt: Date
  - expiresAt: Date

#### 6. MaintenanceRecord
- **Attributes**:
  - _id: ObjectId
  - stationId: ObjectId
  - dataCollectedAt: Date
  - uptimeDelta: Number
  - utilizationRate: Number
  - avgSessionDuration: Number
  - errorCount: Number
  - lastServiceDays: Number
  - riskScore: Number
  - riskClassification: String
  - createdAt: Date
  - updatedAt: Date

#### 7. Corporate
- **Attributes**:
  - _id: ObjectId
  - name: String
  - businessRegistrationNumber: String
  - contactEmail: String
  - contactPhone: String
  - status: String
  - createdAt: Date
  - updatedAt: Date

#### 8. Franchise
- **Attributes**:
  - _id: ObjectId
  - name: String
  - corporateId: ObjectId
  - contactEmail: String
  - contactPhone: String
  - address: String
  - city: String
  - state: String
  - pincode: String
  - status: String
  - createdAt: Date
  - updatedAt: Date

## Object Diagram

Example object instances showing relationships:

```
User: admin_user
- _id: ObjectId("507f1f77bcf86cd799439011")
- role: "admin"
- personalInfo.firstName: "System"
- personalInfo.lastName: "Administrator"
- personalInfo.email: "admin@nexcharge.com"

User: ev_user
- _id: ObjectId("507f1f77bcf86cd799439012")
- role: "ev_user"
- personalInfo.firstName: "John"
- personalInfo.lastName: "Doe"
- personalInfo.email: "john.doe@email.com"

Station: sample_station
- _id: ObjectId("507f1f77bcf86cd799439013")
- name: "Downtown Charging Point"
- corporateId: ObjectId("507f1f77bcf86cd799439014")
- franchiseId: ObjectId("507f1f77bcf86cd799439015")
- managerId: ObjectId("507f1f77bcf86cd799439016")

Booking: sample_booking
- _id: ObjectId("507f1f77bcf86cd799439017")
- userId: ObjectId("507f1f77bcf86cd799439012")
- stationId: ObjectId("507f1f77bcf86cd799439013")
- status: "confirmed"
```

## Use Case Diagram

### Primary Actors:
1. **EV User** - Individuals who need to charge their electric vehicles
2. **Station Manager** - Personnel responsible for managing charging stations
3. **Franchise Owner** - Business owners who operate multiple charging stations
4. **Corporate Admin** - Administrators from corporate entities that own charging networks
5. **System Admin** - Super administrators with full system access

### Main Use Cases:

#### EV User Use Cases:
- Register/Login to the system
- Browse/search charging stations
- View station details and real-time availability
- Book charging slots
- Make payments for bookings
- Manage vehicle profiles
- View booking history
- Receive notifications
- Rate and review stations
- Cancel bookings

#### Station Manager Use Cases:
- Login to dashboard
- View station performance metrics
- Manage station details
- Monitor real-time bookings
- Handle maintenance scheduling
- View predictive maintenance alerts
- Manage pricing
- View performance reports
- Manage customer feedback

#### Franchise Owner Use Cases:
- Login to dashboard
- View franchise performance
- Manage stations under franchise
- Manage station managers
- View financial reports
- Monitor maintenance schedules

#### Corporate Admin Use Cases:
- Login to dashboard
- Manage franchises
- View corporate-wide analytics
- Manage corporate settings
- Monitor station performance across network

#### System Admin Use Cases:
- Manage all users
- Oversee all stations
- View system-wide analytics
- Manage system configurations
- Handle support tickets

## Sequence Diagram

### User Booking Flow:

1. User searches for available stations
2. System returns list of stations with availability
3. User selects a station and time slot
4. User confirms booking details
5. System creates pending booking
6. System initiates payment process with Razorpay
7. User completes payment on Razorpay
8. Razorpay notifies system of payment success
9. System confirms booking and sends notifications
10. User receives booking confirmation

### Maintenance Prediction Flow:

1. Scheduled job runs maintenance prediction
2. System collects station data and booking history
3. System calculates features for each station
4. KNN model predicts maintenance risk
5. System creates maintenance records
6. System updates station with latest risk classification
7. Station managers receive predictive maintenance alerts

## Activity Diagram

### User Registration Process:
1. User navigates to signup page
2. User enters personal details
3. System validates input
4. System checks if email already exists
5. If email exists, show error
6. If email is new, hash password
7. Create user record in database
8. Generate JWT tokens
9. Return user data and tokens
10. Redirect to user dashboard

### Booking Process:
1. User selects station
2. User selects date/time and vehicle
3. System validates availability
4. System calculates pricing
5. System creates Razorpay order
6. System creates pending booking
7. Redirect to payment page
8. User completes payment
9. System verifies payment
10. System confirms booking
11. System sends notifications
12. User receives confirmation

## State Chart Diagram

### Booking States:
- **Pending**: Initial state when booking is created but not paid
- **Confirmed**: Payment successful, booking confirmed
- **Active**: Charging session in progress
- **Completed**: Charging session finished
- **Cancelled**: Booking cancelled by user or system
- **No Show**: User didn't show up for booking

Transitions:
- Pending → Confirmed (when payment is successful)
- Confirmed → Active (when user checks in)
- Active → Completed (when user checks out)
- Pending → Cancelled (user cancels before payment)
- Confirmed → Cancelled (user cancels after payment)
- Confirmed → No Show (user doesn't check in on time)

### Station States:
- **Active**: Station is operational and accepting bookings
- **Inactive**: Station is not operational
- **Maintenance**: Station is under maintenance

Transitions:
- Active ↔ Inactive (admin/station manager changes status)
- Active → Maintenance (scheduled maintenance)
- Maintenance → Active (maintenance completed)

## Deployment Diagram

### Development Environment:
- **Frontend Server**: React development server (localhost:3000)
- **Backend Server**: Node.js Express server (localhost:4000)
- **Database**: MongoDB local instance
- **External Services**: 
  - Razorpay (sandbox)
  - Firebase (development project)
  - Cloudinary (development account)

### Production Environment:
- **Frontend**: Vercel hosting (nexcharge.vercel.app)
- **Backend**: Vercel serverless functions (nexcharge101.vercel.app)
- **Database**: MongoDB Atlas cluster
- **External Services**:
  - Razorpay (production)
  - Firebase (production project)
  - Cloudinary (production account)

Components:
- **Client Browser**: End users access the application through web browsers
- **Load Balancer**: Distributes requests between frontend and backend
- **Frontend Application**: React application served as static files
- **Backend API**: Node.js Express application handling API requests
- **Database**: MongoDB storing all application data
- **File Storage**: Cloudinary for image storage
- **Payment Gateway**: Razorpay for processing payments
- **Authentication Service**: Firebase for user authentication
- **Notification Service**: Firebase for push notifications

## Component Diagram

### Frontend Components:
1. **User Interface Layer**:
   - Pages (UserHomePage, StationDetails, Login, Signup)
   - Components (Navbar, Footer, InteractiveMap, BookingForm)
   - Hooks (useNotifications, useRealTimeAvailability)

2. **Service Layer**:
   - API Service (api.js) - Handles HTTP requests to backend
   - Authentication Service (firebase.js) - Handles Firebase authentication

3. **State Management**:
   - React Context API for global state
   - Component-level state for local data

### Backend Components:
1. **API Layer**:
   - Express.js application
   - Route handlers for different endpoints
   - Middleware for authentication, validation, error handling

2. **Controller Layer**:
   - Auth Controller - User authentication and authorization
   - Booking Controller - Booking management
   - Station Controller - Station management
   - Payment Controller - Payment processing
   - Notification Controller - Notification management
   - Maintenance Controller - Maintenance prediction

3. **Service Layer**:
   - Maintenance Predictor Service - Predictive maintenance using KNN
   - Email Service - Sending emails
   - JWT Service - Token management

4. **Data Access Layer**:
   - Mongoose Models for each entity (User, Station, Booking, etc.)
   - Database connection management

5. **External Integration Layer**:
   - Razorpay SDK for payments
   - Firebase Admin SDK for authentication
   - Cloudinary SDK for image storage

### External Services:
1. **Razorpay**: Payment processing
2. **Firebase**: Authentication and notifications
3. **Cloudinary**: Image storage and management
4. **MongoDB**: Primary database

## Additional System Features

### Role-Based Access Control:
- Different permissions and access levels for each user role
- Admin has full system access
- Corporate admins manage their corporate entities
- Franchise owners manage their franchises
- Station managers manage assigned stations
- EV users can book and manage their charging sessions

### Real-Time Features:
- Real-time availability updates using polling
- Live notifications through Firebase
- Real-time booking status updates

### Predictive Maintenance:
- Machine learning model (KNN) for maintenance prediction
- Scheduled jobs for regular predictions
- Risk classification for stations (Low, Medium, High)

### Payment Processing:
- Integration with Razorpay for secure payments
- Order creation and verification
- Refund handling

### Notification System:
- In-app notifications with priority levels
- Email notifications for important events
- Firebase push notifications

This UML documentation provides a comprehensive overview of the NexCharge system architecture and design, which can be used to generate the required UML diagrams.
