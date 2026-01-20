# Fraud Detection Implementation

## Overview
This document describes the implementation of a Decision Tree Classifier for fraud detection in the NexCharge booking system. The system classifies incoming booking requests as 'Legitimate' or 'High-Risk/Fraudulent' using real-time middleware.

## Components Implemented

### 1. Backend: Data Models and Schema Changes

#### A. New Model: FraudAttemptLog
Created a new Mongoose model to log every instance where the Decision Tree flagged a booking attempt:

**File:** `backend/src/models/fraudAttemptLog.model.js`

Fields:
- `userId`: Reference to the User who attempted the booking
- `stationId`: Reference to the target station
- `attemptTime`: Timestamp of the attempt
- `classification`: Outcome from the Decision Tree ('Legitimate' or 'High-Risk')
- `decisionPath`: Simplified path/rule string used by the DT for classification
- `featuresUsed`: Raw feature values used in the prediction
- `status`: For Admin tracking ('Logged', 'Reviewed', 'Action Taken')

#### B. Updated Booking Model
Added a field to the Booking Model for confirmed bookings that were flagged but allowed to proceed:

**File:** `backend/src/models/booking.model.js`

New field:
- `isFraudulentFlag`: Boolean flag indicating if the booking was classified as 'High-Risk'

### 2. Backend: ML Logic Module

#### Service: Fraud Detector
Created a new service file to host the Decision Tree logic:

**File:** `backend/src/services/fraudDetector.js`

Features:
- Uses the `decision-tree` Node.js library for classification
- Hardcoded mock training dataset with 20 examples (10 legitimate, 10 high-risk)
- Feature extraction from user data and booking payload
- Real-time prediction with decision path generation

Core Functions:
- `initDetector()`: Initializes, trains, and returns the Decision Tree classifier instance
- `extractFeatures(userId, bookingData)`: Converts categorical features to numerical and fetches historical data
- `predictFraud(features)`: Runs prediction on the trained DT model

### 3. Backend: Integration Middleware

#### Middleware: Fraud Detection
Implemented a middleware function to run the detection logic before the main booking controller:

**File:** `backend/src/middlewares/fraudDetection.js`

Functionality:
- Extracts user ID from authenticated request
- Calls fraudDetector service to extract features and make prediction
- Logs all attempts to the FraudAttemptLog model
- Conditionally allows or blocks bookings based on classification

#### Route Integration
Integrated the middleware into the booking routes:

**File:** `backend/src/routes/booking.routes.js`

- Added fraudDetectionMiddleware to the POST /api/bookings route

### 4. Backend: Admin API Endpoint

#### New Route: Fraud Logs
Created a new API endpoint for retrieving fraud attempt logs:

**Files:** 
- `backend/src/routes/admin.routes.js` (added the route)
- `backend/src/controllers/admin.controller.js` (added the controller function)

Endpoint: `GET /api/admin/fraud-logs`
- Protected route that queries the FraudAttemptLog model
- Supports filtering by classification and status
- Includes pagination and sorting by attemptTime
- Populates linked User details and Station name

### 5. Frontend: Admin Dashboard View

#### Service: Admin Service
Created a new service for admin APIs:

**File:** `frontend/src/services/adminService.js`

- Added functions for getting fraud logs and updating log status

#### Component: Fraud Monitoring
Created a new React component for the fraud monitoring dashboard:

**File:** `frontend/src/components/FraudMonitoring.jsx`

Features:
- Displays fraud attempt logs in a sortable Material-UI Data Table
- Supports filtering by classification and status
- Pagination for large datasets
- Ability to update log status

#### Dashboard Integration
Integrated the Fraud Monitoring component into the Admin Dashboard:

**Files:**
- `frontend/src/pages/AdminDashboard.jsx` (added navigation item and component rendering)

Changes:
- Added 'Fraud Monitoring' to the navigation items
- Added conditional rendering for the FraudMonitoring component

## Technical Details

### Decision Tree Features
The classifier uses 5 numerical features:
1. `requestedDuration`: Booking duration in minutes
2. `timeSinceRegistration`: Days since user registration
3. `paymentFailureRate`: User's payment failure rate
4. `totalCancellations`: User's total booking cancellations
5. `timeSlot`: Time slot (0 = Off-Peak, 1 = Peak)

### Mock Training Data
The Decision Tree was trained on 20 examples:
- 10 Legitimate bookings with normal patterns
- 10 High-Risk bookings with suspicious patterns

### Real-time Processing
The middleware processes each booking request in real-time:
1. Extracts features from user data and booking payload
2. Makes a prediction using the trained Decision Tree
3. Logs the attempt to the database
4. Either allows the booking to proceed or requires additional verification

## Security Considerations

1. **Non-blocking Design**: High-risk bookings are not outright rejected but require additional verification
2. **Comprehensive Logging**: All attempts are logged for auditing and model improvement
3. **Admin Review Process**: System admins can review and update the status of flagged attempts
4. **Protected Endpoints**: Admin APIs are protected with authentication and role-based access control

## Future Improvements

1. **Model Retraining**: Implement automated retraining with new fraud data
2. **Feature Expansion**: Add more sophisticated features like IP geolocation, device fingerprinting
3. **Real-time Alerts**: Implement real-time notifications for high-risk attempts
4. **Advanced ML Models**: Experiment with ensemble methods or neural networks for improved accuracy