# ⚡ NexCharge - EV Charging Management System

> **MCA Final Year Project** - A Comprehensive Electric Vehicle Charging Station Management Platform

[![Made with React](https://img.shields.io/badge/Made%20with-React-61DAFB?logo=react)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

---

## 📖 About This Project

**NexCharge** is a full-stack Electric Vehicle (EV) charging management system developed as a Final Year Project for Master of Computer Applications (MCA). This comprehensive platform bridges the gap between EV users and charging station operators, providing an end-to-end solution for managing, booking, and monitoring EV charging infrastructure.

The system implements modern web technologies with advanced machine learning capabilities, featuring multi-role dashboards, real-time booking management, payment integration, fraud detection, predictive maintenance, and comprehensive analytics.

### 👨‍🎓 Project Information
- **Program**: Master of Computer Applications (MCA)
- **Project Type**: Final Year Project
- **Institution**: [Your Institution Name]
- **Academic Year**: 2025-2026
- **Developer**: [Your Name]

---

## 🌟 Key Features

### 🚗 For EV Users
- **Smart Station Discovery**: Interactive map-based search with real-time availability
- **Intelligent Booking System**: Time slot-based booking with conflict prevention
- **Multi-Stop Route Planner**: AI-powered route optimization with charging stops
- **Energy Consumption Prediction**: ML-based energy usage forecasting
- **Secure Payment Gateway**: Integrated Razorpay payment processing
- **Vehicle Management**: Register and manage multiple EVs
- **Real-time Notifications**: Firebase-powered instant updates
- **Booking History**: Complete transaction and booking history
- **Review & Rating System**: Share experiences and view station feedback
- **Loyalty Program**: Points-based rewards system
- **Two-Factor Authentication**: Enhanced account security

### 🏢 For Corporate Administrators
- **Corporate Dashboard**: Comprehensive network oversight
- **Franchise Management**: Complete CRUD operations for franchise partners
- **Multi-Station Management**: Centralized control of multiple charging stations
- **Revenue Analytics**: Real-time financial tracking and reporting
- **Commission System**: Automated commission calculation with tax handling
- **Performance Monitoring**: Network-wide KPI tracking
- **User Churn Prediction**: ML-based churn risk analysis (SVM)
- **Booking Analytics**: Advanced analytics with predictive insights
- **Geographic Distribution Analysis**: Location-based performance metrics
- **Custom Reports**: Configurable reporting and data export

### 🏪 For Franchise Owners
- **Franchise Dashboard**: Dedicated management interface
- **Station Performance Tracking**: Individual station analytics
- **Commission Tracking**: Real-time commission and payment status
- **Revenue Reports**: Detailed financial reporting
- **Booking Management**: Monitor and manage station bookings
- **Maintenance Scheduling**: Track station maintenance needs
- **Staff Management**: Assign and manage station managers

### 🔧 For Station Managers
- **Station Dashboard**: Daily operations management
- **Charger Status Monitoring**: Real-time charger availability
- **Booking Schedule**: Daily booking calendar and status
- **Maintenance Management**: Service scheduling and history
- **Performance Metrics**: Station-specific analytics
- **Customer Feedback**: Review and rating management
- **Incident Reporting**: Quick issue reporting and tracking

### 👨‍💼 For System Administrators
- **Admin Dashboard**: Complete system oversight
- **User Management**: Multi-role user administration
- **Application Approval**: Review and approve corporate/franchise applications
- **System Analytics**: Platform-wide statistics and insights
- **Fraud Detection**: ML-based fraud monitoring (Decision Tree)
- **Predictive Maintenance**: KNN-based maintenance risk prediction
- **Sentiment Analysis**: Naive Bayes classifier for review sentiment
- **Email Notifications**: Automated email system for approvals/rejections
- **Payment Reconciliation**: Financial transaction monitoring

---

## 🤖 Machine Learning Features

### 1. **Fraud Detection System** (Decision Tree Classifier)
- Real-time booking request classification
- Identifies high-risk/fraudulent booking attempts
- Features: User history, booking patterns, payment behavior
- Automatic logging of suspicious activities
- Admin dashboard for fraud monitoring

### 2. **Predictive Maintenance** (K-Nearest Neighbors)
- Predicts maintenance risk levels (Low, Medium, High)
- Features: Uptime delta, utilization rate, error count, last service days
- Automated daily predictions for all stations
- Proactive maintenance scheduling
- Performance optimization recommendations

### 3. **Churn Prediction** (Support Vector Machine)
- Identifies users at risk of churning
- Features: Last login days, booking frequency, loyalty points, reviews, 2FA status
- Weekly automated predictions
- Corporate dashboard integration
- Targeted retention campaigns

### 4. **Sentiment Analysis** (Naive Bayes Classifier)
- Automatic classification of user reviews (Positive, Neutral, Negative)
- Real-time sentiment scoring
- Confidence-based classification
- Station performance insights
- Customer satisfaction tracking

### 5. **Smart Route Planner** (Dijkstra's Algorithm + ML)
- Multi-stop route optimization
- ML-based energy consumption prediction
- SOC (State of Charge) constraint handling
- Charging time optimization
- Real-time traffic consideration

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React.js 18.2.0
- **UI Library**: Material-UI (MUI) 5.14.20
- **Routing**: React Router DOM 6.20.1
- **Animation**: Framer Motion 10.16.16
- **Maps**: 
  - React Leaflet 4.2.1
  - Google Maps API
- **Charts**: Recharts 2.15.4
- **Date Handling**: date-fns 4.1.0
- **Animations**: Lottie React 2.4.0

### Backend
- **Runtime**: Node.js with Express.js 4.19.2
- **Database**: MongoDB with Mongoose ODM 8.5.1
- **Authentication**: 
  - Firebase Authentication
  - JWT (jsonwebtoken 9.0.2)
  - Google OAuth 2.0
- **Payment**: Razorpay SDK 2.9.6
- **File Storage**: Cloudinary 1.41.3
- **Email**: Nodemailer 7.0.5
- **Security**:
  - Helmet.js 7.0.0
  - Express Rate Limit 7.4.0
  - XSS Protection 1.0.15
  - MongoDB Sanitization 2.2.0
  - bcryptjs 2.4.3

### Machine Learning Libraries
- **Decision Trees**: decision-tree 1.0.0
- **KNN**: ml-knn 3.0.0
- **SVM**: ml-svm 0.0.0
- **NLP**: natural 8.1.0
- **Python ML Service**: 
  - Flask (for ML API)
  - scikit-learn
  - pandas
  - numpy

### DevOps & Tools
- **Version Control**: Git & GitHub
- **API Testing**: Postman
- **Testing**: 
  - Playwright 1.56.1 (E2E Testing)
  - 138 automated test cases
- **Task Scheduling**: node-cron 3.0.3
- **Logging**: Morgan 1.10.0
- **Validation**: 
  - Express Validator 7.2.1
  - Joi 17.12.0

### External Services
- **Firebase**: Authentication & Real-time Notifications
- **Cloudinary**: Image CDN & Storage
- **Razorpay**: Payment Gateway (Sandbox & Production)
- **MongoDB Atlas**: Cloud Database
- **Google Maps API**: Location Services
- **Nodemailer**: Email Service

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   React UI   │  │  Mobile Web  │  │  Admin Panel │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AUTHENTICATION LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Firebase   │  │     JWT      │  │   Google     │          │
│  │     Auth     │  │   Tokens     │  │    OAuth     │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER (Node.js)                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Express    │  │     CORS     │  │  Rate Limit  │          │
│  │   Server     │  │  Middleware  │  │  & Security  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   REST API   │  │  Controllers │  │   Services   │          │
│  │   Endpoints  │  │   & Logic    │  │   Layer      │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    ▼                   ▼
┌──────────────────────────┐  ┌──────────────────────────┐
│    ML SERVICE LAYER      │  │   EXTERNAL SERVICES      │
│  ┌──────────────────┐    │  │  ┌──────────────────┐   │
│  │  Python Flask    │    │  │  │    Razorpay      │   │
│  │   ML Models      │    │  │  │    Gateway       │   │
│  └──────────────────┘    │  │  └──────────────────┘   │
│  - Fraud Detection       │  │  ┌──────────────────┐   │
│  - Energy Prediction     │  │  │   Cloudinary     │   │
│  - Maintenance Risk      │  │  │   CDN Storage    │   │
│  - Churn Analysis        │  │  └──────────────────┘   │
│  - Sentiment Analysis    │  │  ┌──────────────────┐   │
└──────────────────────────┘  │  │  Google Maps     │   │
                              │  │     API          │   │
                              │  └──────────────────┘   │
                              │  ┌──────────────────┐   │
                              │  │   Email SMTP     │   │
                              │  │   (Nodemailer)   │   │
                              │  └──────────────────┘   │
                              └──────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              MongoDB Atlas Cluster                       │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │ Collections:                                             │   │
│  │ • users          • bookings      • payments              │   │
│  │ • stations       • vehicles      • reviews               │   │
│  │ • notifications  • commissions   • franchises            │   │
│  │ • corporates     • fraudLogs     • maintenanceRecords    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Database Schema

### Core Collections

#### Users Collection
- Multi-role support (Admin, Corporate, Franchise Owner, Station Manager, EV User)
- Firebase authentication integration
- Profile management with images
- Security features (2FA, password encryption)
- Loyalty points and rewards
- Churn prediction metrics

#### Stations Collection
- Detailed station information
- Location with geospatial indexing
- Charger specifications (Type 1, Type 2, CCS, CHAdeMO)
- Pricing models
- Operational hours
- Maintenance risk classification
- Performance metrics

#### Bookings Collection
- Time slot-based booking system
- Status tracking (Pending, Confirmed, Completed, Cancelled)
- Payment integration
- Fraud flag tracking
- User and station references
- Historical booking data

#### Payments Collection
- Razorpay integration
- Transaction lifecycle management
- Refund handling
- Tax and fee calculation
- Commission tracking
- PDF receipt generation

#### Commissions Collection
- Automated commission calculation
- Tax computation (18% GST)
- Status workflow (Pending → Approved → Paid)
- Monthly and quarterly summaries
- Entity tracking (Franchise/Corporate)

#### Reviews Collection
- Star ratings (1-5)
- Comment with sentiment classification
- Automated sentiment analysis
- Confidence scoring
- Station performance tracking

#### Notifications Collection
- Multi-channel notifications
- Priority levels
- Read/unread status
- User targeting
- Timestamp tracking

#### FraudAttemptLog Collection
- ML classification results
- Decision path logging
- Feature extraction data
- Admin review status

#### MaintenanceRecord Collection
- Predictive maintenance logs
- Risk classification
- Feature metrics
- Prediction history

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- Python 3.8+ (for ML services)
- npm or yarn
- Git

### Installation

#### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/nexcharge.git
cd nexcharge
```

#### 2. Backend Setup
```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Seed admin user
npm run seed:admin

# Start backend server
npm run dev
```

#### 3. Frontend Setup
```bash
cd frontend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start frontend
npm start
```

#### 4. ML Service Setup (Optional)
```bash
cd ml
pip install -r requirements.txt

# Start ML API
python ml_api.py
```

### Environment Variables

#### Backend (.env)
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY=your_private_key

# Razorpay
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_USER=your_email
EMAIL_APP_PASSWORD=your_app_password

# Google Maps
GOOGLE_MAPS_API_KEY=your_maps_api_key
```

#### Frontend (.env)
```env
REACT_APP_API_BASE=http://localhost:4000
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_auth_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

---

## 📱 Usage

### For EV Users
1. **Sign Up**: Create account or use Google OAuth
2. **Add Vehicle**: Register your EV with specifications
3. **Find Stations**: Search using map or location
4. **Book Slot**: Select station, date, and time
5. **Make Payment**: Secure payment via Razorpay
6. **Get Charged**: Show booking QR at station
7. **Leave Review**: Rate and review your experience

### For Station Managers
1. **Login**: Access station manager dashboard
2. **Monitor**: View real-time booking status
3. **Manage**: Update charger availability
4. **Track**: Monitor performance metrics
5. **Maintain**: Schedule and log maintenance

### For Corporate/Franchise Admins
1. **Dashboard**: Access comprehensive analytics
2. **Manage**: Oversee stations and bookings
3. **Financial**: Track revenue and commissions
4. **Reports**: Generate custom reports
5. **Analytics**: View predictive insights

### For System Admins
1. **Control Panel**: System-wide administration
2. **Users**: Manage all user accounts
3. **Approvals**: Review applications
4. **Monitoring**: Track fraud and system health
5. **Reports**: Generate system reports

---

## 🧪 Testing

### Automated Testing
The project includes comprehensive Playwright E2E testing:

```bash
# Run all tests
npx playwright test

# Run tests in headed mode
npx playwright test --headed

# Run tests with UI
npx playwright test --ui

# View test report
npx playwright show-report
```

### Test Coverage
- **Total Tests**: 138
- **Pass Rate**: 71.7%
- **Browsers**: Chromium, Firefox, WebKit
- **Categories**:
  - Admin Dashboard Tests
  - Booking Flow Tests
  - Login/Authentication Tests
  - Payment Flow Tests
  - Profile Management Tests
  - Corporate Dashboard Tests
  - Notification Tests

### Test Reports
- HTML Report: `playwright-report/index.html`
- JSON Results: `test-results.json`
- Detailed Analysis: `TEST_ERROR_ANALYSIS.md`
- Summary: `TEST_SUMMARY.md`

---

## 📈 API Documentation

### Base URLs
- **Development**: `http://localhost:4000/api`
- **Production**: `https://nexcharge101.vercel.app/api`

### Key Endpoints

#### Authentication
- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/google` - Google OAuth login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout

#### Stations
- `GET /stations` - List all stations
- `GET /stations/:id` - Get station details
- `POST /stations` - Create station (Manager)
- `PUT /stations/:id` - Update station (Manager)
- `DELETE /stations/:id` - Delete station (Admin)

#### Bookings
- `GET /bookings` - List user bookings
- `POST /bookings` - Create booking
- `GET /bookings/:id` - Get booking details
- `PUT /bookings/:id` - Update booking status
- `DELETE /bookings/:id` - Cancel booking

#### Payments
- `POST /payments/create-order` - Create payment order
- `POST /payments/verify` - Verify payment
- `GET /payments` - List user payments
- `POST /payments/refund` - Request refund

#### Corporate
- `GET /corporate/dashboard` - Get dashboard data
- `GET /corporate/franchises` - List franchises
- `POST /corporate/franchises` - Add franchise
- `GET /corporate/commissions` - Get commissions
- `GET /corporate/users/churn-risk` - Churn predictions

#### ML Services
- `POST /fraud-detection/predict` - Fraud prediction
- `POST /route-planner/optimize` - Route optimization
- `GET /maintenance/predictions` - Maintenance risks

---

## 🎨 User Interface Highlights

### Design Philosophy
- **Modern & Clean**: Material Design principles
- **Responsive**: Mobile-first approach
- **Accessible**: WCAG 2.1 compliant
- **Intuitive**: User-centric navigation
- **Fast**: Optimized performance

### Key UI Components
- **Interactive Maps**: Real-time station locations
- **Dynamic Charts**: Recharts-powered analytics
- **Smooth Animations**: Framer Motion effects
- **Responsive Tables**: Data management interfaces
- **Modal Dialogs**: Action confirmation and forms
- **Toast Notifications**: Real-time user feedback
- **Skeleton Loaders**: Enhanced loading experience

---

## 🔒 Security Features

### Authentication & Authorization
- Firebase Authentication with JWT
- Role-based access control (RBAC)
- Two-factor authentication (2FA)
- Secure password hashing (bcrypt)
- Session management with refresh tokens

### API Security
- Helmet.js security headers
- CORS configuration
- Rate limiting (Express Rate Limit)
- Input validation (Express Validator, Joi)
- XSS protection
- MongoDB injection prevention
- SQL injection prevention

### Data Security
- Encrypted data transmission (HTTPS)
- Secure environment variables
- Firebase security rules
- Database access control
- Regular security audits

---

## 📊 Features Roadmap

### Completed ✅
- [x] Multi-role authentication system
- [x] Real-time booking management
- [x] Payment gateway integration
- [x] ML-based fraud detection
- [x] Predictive maintenance system
- [x] Churn prediction analysis
- [x] Sentiment analysis for reviews
- [x] Smart route planning
- [x] Commission automation
- [x] Corporate/Franchise dashboards
- [x] Email notification system
- [x] Cloudinary image integration
- [x] Comprehensive analytics
- [x] E2E testing suite

### Future Enhancements 🚀
- [ ] Mobile apps (iOS & Android)
- [ ] IoT integration for chargers
- [ ] Real-time charger monitoring
- [ ] Dynamic pricing algorithms
- [ ] Blockchain-based loyalty tokens
- [ ] Vehicle-to-Grid (V2G) support
- [ ] Renewable energy tracking
- [ ] Carbon footprint calculator
- [ ] Fleet management module
- [ ] Advanced reporting & BI tools
- [ ] Multi-language support
- [ ] Dark mode theme
- [ ] Social media integration
- [ ] Referral program
- [ ] AI chatbot support

---

## 🏆 Project Achievements

### Technical Achievements
- ✅ Full-stack MERN application with 15,000+ lines of code
- ✅ 5 Machine Learning models integrated
- ✅ 138 automated test cases with 71.7% pass rate
- ✅ Multi-role architecture with 5 user types
- ✅ Real-time features using Firebase
- ✅ Secure payment processing
- ✅ RESTful API with 50+ endpoints
- ✅ Responsive UI with 25+ pages/components
- ✅ Cloud deployment ready (Vercel compatible)
- ✅ Comprehensive documentation

### Learning Outcomes
- Advanced React.js and modern JavaScript
- Node.js backend development
- MongoDB database design and optimization
- Machine Learning integration in web apps
- RESTful API design and security
- Payment gateway integration
- Cloud services (Firebase, Cloudinary, MongoDB Atlas)
- Git version control and collaboration
- Agile development methodology
- E2E testing with Playwright

---

## 📚 Documentation

### Available Documentation
- **README.md** - This file (Project overview)
- **DEPLOYMENT_GUIDE.md** - Deployment instructions
- **API_DOCUMENTATION.md** - Complete API reference
- **TEST_SUMMARY.md** - Testing results and analysis
- **TEST_ERROR_ANALYSIS.md** - Detailed error analysis
- **PLAYWRIGHT_TEST_REPORT.md** - Test execution report
- **COMMISSION_SYSTEM.md** - Commission automation docs
- **FRAUD_DETECTION_IMPLEMENTATION.md** - Fraud detection details
- **CHURN_PREDICTION.md** - Churn prediction system
- **SENTIMENT_ANALYSIS.md** - Review sentiment analysis
- **MAINTENANCE_PREDICTION.md** - Predictive maintenance
- **PAYMENT_QUICK_START.md** - Payment integration guide
- **ROUTE_PLANNER_ENHANCEMENTS.md** - Route planning system
- **CORPORATE_DASHBOARD_FEATURES.md** - Corporate features
- **UML.md** - System UML diagrams

---

## 🤝 Contributing

This is an academic project completed as part of MCA final year. However, suggestions and feedback are welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 License

This project is developed as an academic project for educational purposes.

---

## 👨‍💻 Author

**[Your Name]**
- GitHub: [@yourusername](https://github.com/yourusername)
- LinkedIn: [Your LinkedIn](https://linkedin.com/in/yourprofile)
- Email: your.email@example.com

### Project Supervisor
**[Supervisor Name]**
- Designation: [Title]
- Institution: [Institution Name]

---

## 🙏 Acknowledgments

- **Institution**: [Your College/University Name] for providing resources and guidance
- **Supervisor**: [Supervisor Name] for continuous support and mentorship
- **Faculty**: Department of Computer Applications for technical guidance
- **Open Source Community**: For amazing libraries and tools
- **Stack Overflow**: For countless solutions and learning resources
- **Firebase, Razorpay, Cloudinary**: For providing developer-friendly services

---

## 📞 Contact & Support

For queries related to this project:
- **Email**: your.email@example.com
- **Project Repository**: [GitHub Link]
- **Documentation**: Available in `/docs` folder
- **Issues**: Report via GitHub Issues

---

## 🎓 Academic Declaration

This project is submitted in partial fulfillment of the requirements for the degree of **Master of Computer Applications (MCA)** at **[Your Institution Name]**.

**Declaration**: I hereby declare that this project work titled "NexCharge - EV Charging Management System" is a record of authentic work carried out by me under the guidance of **[Supervisor Name]**. The project has not been submitted to any other University or Institution for the award of any degree or diploma.

---

## 📸 Screenshots

### User Dashboard
![User Dashboard](docs/screenshots/user-dashboard.png)

### Station Finder Map
![Station Map](docs/screenshots/station-map.png)

### Booking Flow
![Booking Flow](docs/screenshots/booking-flow.png)

### Corporate Dashboard
![Corporate Dashboard](docs/screenshots/corporate-dashboard.png)

### Admin Panel
![Admin Panel](docs/screenshots/admin-panel.png)

### Payment Page
![Payment](docs/screenshots/payment-page.png)

---

## 📊 Project Statistics

- **Total Lines of Code**: ~15,000+
- **Components**: 50+
- **API Endpoints**: 60+
- **Database Collections**: 15+
- **ML Models**: 5
- **Test Cases**: 138
- **Documentation Pages**: 20+
- **Development Time**: 6 months
- **Contributors**: 1 (Academic Project)

---

<div align="center">

### ⚡ Powering the Future of Electric Mobility ⚡

**Made with ❤️ for MCA Final Year Project**

[⬆ Back to Top](#-nexcharge---ev-charging-management-system)

</div>

---

**Last Updated**: February 19, 2026
