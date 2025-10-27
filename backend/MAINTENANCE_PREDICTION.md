# Predictive Maintenance Risk Classification

## Overview
This document describes the implementation of a K-Nearest Neighbors (KNN) based predictive maintenance system for the NexCharge EV Charging Management System. The system analyzes station performance metrics to predict maintenance risk levels (Low, Medium, High) for charging stations.

## Components

### 1. Data Model Changes

#### MaintenanceRecord Model
A new model to store historical maintenance predictions:
- `stationId`: Reference to the Station
- `dataCollectedAt`: Timestamp of feature calculation
- `uptimeDelta`: Uptime percentage change over last 30 days
- `utilizationRate`: Normalized booking count (0.0 to 1.0)
- `avgSessionDuration`: Average charging session duration in minutes
- `errorCount`: Count of critical errors in last 30 days
- `lastServiceDays`: Days since last official maintenance
- `riskScore`: Raw risk score from KNN model
- `riskClassification`: Final prediction label (Low, Medium, High)

#### Station Model Updates
Added fields to store the latest prediction:
- `latestRiskClassification`: Most recent prediction (Low, Medium, High)
- `lastPredictionDate`: Timestamp of last successful prediction

### 2. ML Logic Module
Location: `backend/src/services/maintenancePredictor.js`

Core functions:
- `trainModel()`: Initializes KNN model with training data
- `calculateFeatures(stationId)`: Calculates the 5 features for a station
- `predictRisk(features)`: Runs KNN prediction on features
- `runPredictionForStation(stationId)`: Orchestrates the full prediction process

### 3. Scheduled Job
Location: `backend/src/jobs/maintenanceScheduler.js`

Runs daily at 2:00 AM to process all active stations.

### 4. API Endpoints

#### GET /api/station-manager/maintenance-predictions
Returns stations with Medium or High risk classifications, sorted by risk level and prediction date.

#### POST /api/station-manager/run-job (Admin only)
Manually triggers the maintenance prediction job.

## Usage

### Testing
Run the maintenance prediction test:
```bash
npm run test:maintenance
```

### Manual Job Trigger
As an admin, POST to `/api/station-manager/run-job` to manually run the prediction job.

## Feature Calculation Details

1. **Uptime Delta**: Change in station uptime percentage from baseline (95%)
2. **Utilization Rate**: Normalized booking count (bookings/100, capped at 1.0)
3. **Avg Session Duration**: Average charging session duration in minutes
4. **Error Count**: Simulated based on station uptime (0 for >90%, 1-5 for 80-90%, 5-15 for <80%)
5. **Last Service Days**: Days since last maintenance record

## Future Improvements

1. Replace simulated error counts with real log data
2. Add more sophisticated feature engineering
3. Implement model retraining with actual maintenance outcomes
4. Add more granular risk scoring