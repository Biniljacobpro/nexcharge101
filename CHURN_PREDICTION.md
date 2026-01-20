# Churn Prediction Implementation

## Overview
This document describes the implementation of a Support Vector Machine (SVM) based churn prediction system for the NexCharge EV Charging Management System. The system analyzes user behavior metrics to predict churn risk levels (Low, Medium, High) for EV users.

## Components

### 1. Data Model Changes

#### User Model Updates
Added fields to store churn prediction results in the EV User Info section:
- `churnRisk`: Risk classification (Low, Medium, High) with index for fast filtering
- `churnProbability`: Raw probability score (0.0 to 1.0)
- `lastPredictionDate`: Timestamp of last prediction

### 2. ML Logic Module
Location: `backend/src/services/churnPredictor.js`

Core functions:
- `calculateUserFeatures(userId)`: Calculates the 5 features for a user
- `initSVM()`: Initializes and trains the SVM model with mock training data
- `predictChurn(features)`: Runs SVM prediction on normalized features
- `runPredictionForUser(userId)`: Orchestrates the full prediction process for a user

#### Features Used
1. **Last Login Days**: Calculate (Today - User.lastLogin)
2. **Average Monthly Bookings**: Aggregate data from the Booking Model (group by user ID, count records over the last 90 days, then divide by 3)
3. **Loyalty Points**: Get the raw value from the User Model's EV User Info
4. **Last Negative Review**: Check the Review Model for the most recent review by the user and classify its sentiment
5. **Two Factor Enabled**: Get the boolean value from the User Model and convert to Binary (0 or 1)

### 3. Scheduled Job
Location: `backend/src/jobs/churnScheduler.js`

Runs weekly on Mondays at 2:00 AM to process all active EV users.

### 4. API Endpoint
Location: `backend/src/routes/corporate.churn.routes.js`

#### GET /api/corporate/users/churn-risk
- **Access Control**: Protected route for Corporate Admins and System Admins only
- **Parameters**: 
  - `risk` (optional): Filter by churn risk level (High, Medium, Low)
  - `page` (optional): Pagination page number (default: 1)
  - `limit` (optional): Results per page (default: 10)
- **Response**: User details (firstName, email, phone), churnRisk, churnProbability, and lastPredictionDate

### 5. Frontend Integration
Location: `frontend/src/components/UserRetentionRisk.jsx`

#### Features
- **Risk Distribution Visualization**: Bar chart and pie chart showing distribution of users across risk levels
- **User List**: DataGrid showing users with filtering by risk level
- **Campaign Initiation**: Action button to simulate offering an incentive to High Risk users

## Technical Details

### SVM Model
The system uses a Support Vector Machine with:
- **Kernel**: Radial Basis Function (RBF)
- **Regularization Parameter (C)**: 1.0
- **Kernel Coefficient (gamma)**: 0.1

### Feature Normalization
Features are normalized to a common range (0 to 1) as SVM performance is sensitive to feature scaling.

### Risk Classification
Risk levels are determined based on probability scores:
- **High**: Probability > 0.7
- **Medium**: Probability > 0.4
- **Low**: Probability ≤ 0.4

## Testing

### Manual Testing
Run the test script to verify the churn prediction functionality:
```bash
npm run test:churn
```

### Automated Testing
The system includes automated tests in the test suite to verify:
- Feature calculation accuracy
- Model prediction consistency
- API endpoint responses
- Frontend component rendering

## Future Enhancements

1. **Model Improvement**: Replace mock training data with real historical data
2. **Feature Engineering**: Add more sophisticated features like booking patterns, payment history, etc.
3. **Model Retraining**: Implement periodic model retraining with new data
4. **Advanced Visualization**: Add trend analysis and predictive analytics dashboards
5. **Automated Campaigns**: Integrate with marketing automation systems for real campaign execution