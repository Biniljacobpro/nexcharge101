# NexCharge - EV Charging Management System

## Overview

NexCharge is a comprehensive Electric Vehicle (EV) charging management system that connects EV users with charging stations. The system provides a complete platform for users to find, book, and pay for charging sessions, while also offering management dashboards for different stakeholder roles including corporate administrators, franchise owners, and station managers.

The system is built using a MERN stack (MongoDB, Express.js, React, Node.js) with additional services like Firebase for authentication, Cloudinary for image storage, and Razorpay for payment processing.

## Technology Stack

### Backend
- **Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT, Firebase Admin, Google OAuth
- **Payment Processing**: Razorpay
- **Email Service**: Nodemailer with Gmail OAuth2/SMTP support
- **Image Storage**: Cloudinary with local fallback
- **Validation**: express-validator, express-mongo-sanitize, xss
- **Security**: helmet, cors, express-rate-limit
- **Scheduling**: node-cron for background jobs
- **File Upload**: multer with multer-storage-cloudinary

### Frontend
- **Framework**: React with React Router
- **UI Library**: Material-UI (MUI) Components
- **State Management**: React Hooks
- **Maps**: Google Maps API with @react-google-maps/api
- **Animations**: Framer Motion
- **Charts**: Recharts
- **Build Tool**: React Scripts

### Database
- **MongoDB**: Document-based NoSQL database
- **Mongoose**: ODM for MongoDB

## System Architecture

The system follows a multi-role architecture with distinct user types, each having specific permissions and dashboards:

1. **EV Users** - Regular users who book charging sessions
2. **Station Managers** - Manage individual charging stations
3. **Franchise Managers** - Manage franchises and multiple stations
4. **Franchise Owners** - Own franchises and receive profit shares
5. **Corporate Admins** - Manage corporate accounts and applications
6. **System Admins** - Full system access and management

## MongoDB Data Models

### 1. User Model
The User model is the core entity that represents all users in the system with role-based data structures:

- **Basic Information**: firstName, lastName, email, phone, address, profileImage
- **Authentication**: passwordHash, lastLogin, isActive, twoFactorEnabled
- **Google Integration**: googleId, emailVerified
- **Role-Specific Data**:
  - **EV User Info**: Vehicle information, payment methods, loyalty points, notification preferences
  - **Station Manager Info**: Franchise assignment, assigned stations, contact hours, commission rate
  - **Franchise Manager Info**: Franchise details, commission rates, business registration info
  - **Franchise Owner Info**: Managed stations, profit share
  - **Corporate Admin Info**: Corporate access levels, managed franchises
  - **Admin Info**: System permissions, policy updates

### 2. Station Model
The Station model represents charging stations with comprehensive details:

- **Basic Info**: Name, code, description
- **Location**: Address, city, state, country, pincode, coordinates, landmarks
- **Capacity**: Total chargers, charger types, power capacity, available slots
- **Individual Chargers**: Charger ID, type, power, availability status
- **Pricing**: Price per minute, cancellation policy
- **Operational Details**: Status (active/inactive/maintenance), parking slots, operating hours
- **Contact Info**: Manager email, support phone, support email
- **Business Relations**: Corporate ID, franchise ID, manager ID
- **Analytics**: Rating, total bookings, revenue, energy delivered, uptime
- **Media**: Images, documents
- **Audit**: Created by, updated by

### 3. Booking Model
The Booking model manages charging session reservations:

- **User & Station**: User ID, station ID, charger ID, charger type
- **Timing**: Start time, end time, duration
- **Vehicle**: Vehicle ID, current charge, target charge
- **Pricing**: Base price, estimated/actual energy and cost
- **Payment**: Razorpay order/payment IDs, payment status, method, amounts
- **Status**: Pending, confirmed, active, completed, cancelled, no-show
- **Tracking**: Reminder status, notes, cancellation reason, check-in/out times
- **OTP**: Code for charging verification
- **Charging Status**: Not started, started, stopped, completed

### 4. Vehicle Model
The Vehicle model stores EV specifications:

- **Identification**: Make, model, year
- **Battery**: Capacity, chemistry, cycle life
- **Charging**: AC/DC charging capabilities, connector types, max power
- **Performance**: Range, efficiency
- **Status**: Active/inactive
- **Audit**: Created by, updated by

### 5. Corporate Model
The Corporate model represents corporate entities:

- **Basic Info**: Name, email, contact person, phone
- **Address**: Full address details
- **Business Details**: Registration number, GST number, PAN number
- **Status**: Active/inactive/approval pending
- **Audit**: Created by, updated by

### 6. Franchise Model
The Franchise model manages franchise operations:

- **Basic Info**: Name, code, description
- **Location**: Address details
- **Contact**: Email, phone, website
- **Business**: Commission rate, contract dates, status
- **Audit**: Created by, updated by

### 7. Notification Model
The Notification model handles user communications:

- **Recipient**: User ID
- **Content**: Title, message, type
- **Status**: Read/unread, priority
- **Metadata**: Related entity, action URL

### 8. Review Model
The Review model manages user feedback:

- **Entities**: User ID, station ID, booking ID
- **Content**: Rating, comment
- **Status**: Active/inactive
- **Audit**: Created by, updated by

## Backend API Structure

### Authentication Routes (/api/auth)
- User registration and login
- Google authentication integration
- Password reset functionality
- Token refresh mechanism
- Email verification

### Admin Routes (/api/admin)
- User management (CRUD operations)
- Role assignment and permissions
- System configuration
- Analytics and reporting
- Content management

### Corporate Routes (/api/corporate)
- Corporate dashboard access
- Fleet management
- Booking analytics
- Invoice generation

### Franchise Owner Routes (/api/franchise-owner)
- Franchise performance monitoring
- Revenue tracking
- Station management
- Financial reporting

### Station Manager Routes (/api/station-manager)
- Station details management
- Booking oversight
- Maintenance scheduling
- Performance analytics

### Public Routes (/api/public)
- Station listings and search
- Availability checking
- Pricing information
- General system information

### Booking Routes (/api/bookings)
- Booking creation and management
- Time slot validation
- Booking modification and cancellation
- User booking history

### Vehicle Routes (/api/vehicles)
- Vehicle registration
- Model database management
- User vehicle listings
- Vehicle specifications

### Payment Routes (/api/payments)
- Razorpay order creation
- Payment verification
- Refund processing
- Transaction history

### Availability Routes (/api/availability)
- Real-time charger availability
- Slot booking validation
- Calendar integration

### Notification Routes (/api/notifications)
- Notification listing
- Read status management
- Bulk notification operations

### Review Routes (/api/reviews)
- Review submission
- Review moderation
- Rating calculations
- Feedback analysis

## Frontend Components

### User Pages
- **Landing Page**: System introduction and features overview
- **Login/Signup**: Authentication forms with Google integration
- **User Home**: Dashboard with bookings, vehicles, and notifications
- **Station Listing**: Searchable list of charging stations
- **Station Details**: Detailed station information with booking interface
- **Profile**: User information and settings management
- **Bookings**: Booking history and management
- **Payments**: Payment history and invoices

### Admin Dashboard
- **User Management**: Role-based user administration
- **Station Management**: Station creation and oversight
- **Corporate Management**: Corporate account approval and management
- **Analytics**: System-wide performance metrics and charts
- **Reports**: Financial and operational reporting

### Corporate Dashboard
- **Fleet Management**: Corporate vehicle tracking
- **Booking Analytics**: Usage patterns and trends
- **Financial Overview**: Cost analysis and budgeting
- **Sustainability Metrics**: Environmental impact reporting

### Franchise Owner Dashboard
- **Performance Monitoring**: Revenue and utilization metrics
- **Station Management**: Multi-station oversight
- **Financial Reporting**: Profit sharing and commission tracking
- **Operational Analytics**: Maintenance and uptime statistics

### Station Manager Dashboard
- **Daily Operations**: Booking schedules and status
- **Charger Management**: Individual charger monitoring
- **Maintenance Tracking**: Service schedules and history
- **Performance Metrics**: Local station analytics

### Shared Components
- **Navigation**: Role-specific navigation bars
- **Maps**: Interactive Google Maps integration for location services
- **Booking Forms**: Standardized booking interfaces
- **Notifications**: Real-time alert system
- **Vehicle Management**: Vehicle registration and selection
- **Payment Processing**: Secure payment handling

## Key Features

### 1. Multi-Role Access Control
The system implements comprehensive role-based access control with distinct dashboards and permissions for each user type, ensuring appropriate access levels and data privacy.

### 2. Real-Time Booking System
Advanced booking engine with:
- Time slot validation to prevent conflicts
- Charger availability checking
- Overlapping booking prevention
- Automatic charger assignment

### 3. Payment Integration
Secure payment processing through Razorpay with:
- Order creation and management
- Payment verification and validation
- Refund processing capabilities
- Transaction history tracking

### 4. Location Services
Comprehensive location-based features:
- Google Maps integration for station finding
- Directions and navigation
- Geolocation-based searching
- Interactive map interfaces

### 5. Vehicle Management
Intelligent vehicle handling:
- Extensive EV database with specifications
- User vehicle registration
- Charging compatibility checking
- Battery level tracking

### 6. Notification System
Multi-channel notification delivery:
- In-app notifications
- Email alerts
- Booking confirmations
- Reminders and updates

### 7. Analytics and Reporting
Data-driven insights:
- Usage analytics
- Revenue tracking
- Performance metrics
- Environmental impact reporting

### 8. Corporate Solutions
Enterprise-focused features:
- Fleet management
- Bulk booking capabilities
- Custom reporting
- API integration options

## Security Measures

### Authentication & Authorization
- JWT-based token authentication
- Role-based access control
- Google OAuth integration
- Password encryption with bcrypt
- Two-factor authentication support

### Data Protection
- Input validation and sanitization
- MongoDB injection prevention
- XSS attack protection
- Helmet security headers
- Rate limiting

### Communication Security
- HTTPS enforcement
- CORS configuration
- Secure cookie handling
- Environment variable management

## Deployment Configuration

### Environment Variables
The system requires proper configuration of environment variables for:
- Database connection (MONGODB_URI)
- Authentication (JWT_SECRET, GOOGLE_CLIENT_ID)
- Payment processing (RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET)
- Email services (SMTP settings or Gmail OAuth2)
- Cloud storage (CLOUDINARY credentials)
- API keys (Google Maps)

### Port Configuration
- Frontend: Default port 3000
- Backend: Default port 4000 (configurable to 4001 if needed)

## Testing

The project includes comprehensive testing infrastructure:
- End-to-end testing with Playwright
- Unit testing capabilities
- Integration test frameworks
- Automated test execution scripts

## Future Enhancements

### Planned Features
- Mobile application development
- IoT integration for real-time charger status
- AI-powered charging optimization
- Blockchain-based loyalty programs
- Advanced analytics and machine learning
- Government API integrations
- Sustainability certification tracking

This comprehensive documentation provides a detailed overview of the NexCharge EV Charging Management System, covering all major components and functionalities across the frontend, backend, and database layers.