# NexCharge EV Charging Management System - Current Project Details

## Project Overview

NexCharge is a comprehensive Electric Vehicle (EV) charging management system that connects EV users with charging stations. The system provides a complete platform for users to find, book, and pay for charging sessions, while also offering management dashboards for different stakeholder roles including corporate administrators, franchise owners, and station managers.

The system is built using a MERN stack (MongoDB, Express.js, React, Node.js) with additional services like Firebase for authentication, Cloudinary for image storage, and Razorpay for payment processing.

## System Architecture

The system follows a multi-role architecture with distinct user types, each having specific permissions and dashboards:

1. **EV Users** - Regular users who book charging sessions
2. **Station Managers** - Manage individual charging stations
3. **Franchise Owners** - Manage franchises and multiple stations
4. **Corporate Admins** - Manage corporate entities and multiple franchises
5. **System Admins** - Super administrators with full system access

### Technical Stack

- **Frontend**: React with Material-UI components
- **Backend**: Node.js with Express framework
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: Firebase and JWT tokens
- **Payment Processing**: Razorpay integration
- **Image Storage**: Cloudinary
- **Machine Learning**: Decision Tree, KNN, and Naive Bayes algorithms

## Core Features

### 1. Multi-Role Access Control

The system implements comprehensive role-based access control with distinct dashboards and permissions for each user type, ensuring appropriate access levels and data privacy.

### 2. Real-Time Booking System

Advanced booking engine with:
- Time slot validation to prevent conflicts
- Charger availability checking
- OTP verification for charging start
- Booking extension functionality
- Real-time status updates

### 3. Payment Processing

Secure payment handling through Razorpay with:
- Order creation and verification
- Multiple payment method support
- Automatic refund handling
- PDF receipt generation

### 4. Intelligent Fraud Detection

Machine learning-powered fraud detection using Decision Tree classification that analyzes:
- Booking duration patterns
- User registration time
- Payment failure history
- Cancellation frequency
- Time slot preferences

### 5. Predictive Maintenance

K-Nearest Neighbors algorithm for predictive maintenance that evaluates:
- Station uptime trends
- Utilization rates
- Average session durations
- Error occurrence frequency
- Time since last service

### 6. Sentiment Analysis

Natural language processing with Naive Bayes classification for review sentiment analysis:
- Automatic sentiment classification (Positive, Neutral, Negative)
- Confidence scoring for classifications
- Analytics dashboard for station managers
- Filtering capabilities by sentiment

### 7. Notification System

Multi-channel notification delivery:
- In-app notifications with priority levels
- Email alerts for important events
- Booking confirmations and reminders
- System alerts and updates

### 8. Analytics and Reporting

Data-driven insights with:
- Revenue tracking and reporting
- Usage analytics and trends
- Performance metrics dashboards
- Custom reporting capabilities

## User Roles and Permissions

### EV Users
- Browse and search charging stations
- View real-time availability
- Book charging slots
- Make payments
- Manage vehicle profiles
- Submit reviews and ratings
- View booking history

### Station Managers
- Manage assigned stations
- Update station status and pricing
- View booking information
- Monitor charger availability
- Access maintenance alerts
- Review customer feedback
- View sentiment analytics


### Franchise Owners
- Manage assigned franchises
- Oversee multiple stations
- Financial reporting
- Performance analytics
- Staff management
- Franchise performance metrics
- Financial reporting


### Corporate Admins
- Manage corporate entities
- Oversee multiple franchises
- Advanced analytics
- Custom reporting
- User management within organization

### System Admins
- Full system access
- User management
- Content management
- System configuration
- Security monitoring
- Fraud attempt monitoring

## Machine Learning Implementations

### Fraud Detection
- **Algorithm**: Decision Tree Classifier
- **Library**: decision-tree
- **Features**: Requested duration, time since registration, payment failure rate, total cancellations, time slot
- **Classification**: Legitimate vs High-Risk bookings
- **Integration**: Real-time middleware that flags suspicious bookings

### Predictive Maintenance
- **Algorithm**: K-Nearest Neighbors (KNN)
- **Library**: ml-knn
- **Features**: Uptime delta, utilization rate, average session duration, error count, days since last service
- **Classification**: Low, Medium, High risk levels
- **Integration**: Daily scheduled job that processes all active stations

### Sentiment Analysis
- **Algorithm**: Naive Bayes Classifier
- **Library**: natural
- **Features**: Preprocessed review text with stemming and bigrams
- **Classification**: Positive, Neutral, Negative sentiment
- **Integration**: Automatic classification during review submission

## Key Technical Components

### Backend Controllers
- Auth Controller - User authentication and authorization
- Booking Controller - Booking management
- Station Controller - Station management
- Payment Controller - Payment processing
- Notification Controller - Notification management
- Review Controller - Review management
- Maintenance Controller - Maintenance prediction
- Fraud Controller - Fraud detection

### Frontend Pages
- Landing Page - System introduction and features overview
- Login/Signup - Authentication forms with Google integration
- User Home - Dashboard with bookings, vehicles, and notifications
- Station Listing - Searchable list of charging stations
- Station Details - Detailed station information with booking interface
- Profile - User information and settings management
- Admin Dashboard - System administration interface
- Corporate Dashboard - Corporate management interface
- Station Manager Dashboard - Station management interface

### Database Models
- User - Multi-role user management
- Station - Charging station information and status
- Booking - Booking details and status tracking
- Vehicle - EV specifications and compatibility
- Notification - User notifications and alerts
- Review - Customer feedback and ratings
- Maintenance Record - Predictive maintenance logs
- Fraud Attempt Log - Fraud detection logs

## External Integrations

1. **Razorpay**: Payment processing
2. **Firebase**: Authentication and notifications
3. **Cloudinary**: Image storage and management
4. **MongoDB**: Primary database
5. **Google Maps**: Location services and mapping

## Security Features

- JWT-based authentication with refresh tokens
- Role-based access control
- Password encryption
- Two-factor authentication support
- Session management
- Input validation and sanitization
- Rate limiting
- Security headers

## Deployment Architecture

The system is designed for deployment on Vercel with:
- Separate frontend and backend deployments
- Environment-specific configuration
- CORS setup for development and production
- Scalable architecture supporting horizontal growth

## Current Project Status

This project is currently at a mini-project level with a fully functional core system including:
- Complete user authentication and role management
- Real-time booking system with payment integration
- Machine learning implementations for fraud detection, maintenance prediction, and sentiment analysis
- Comprehensive dashboard interfaces for all user roles
- Notification system with multiple delivery channels
- Analytics and reporting capabilities

The system demonstrates a solid foundation with advanced features that could be expanded into a full-scale enterprise solution with additional development.