# NexCharge - EV Charging Management System

A modern, AI-powered EV charging management platform built with React, Material UI, and Framer Motion.

## 🚀 Features

- **Modern UI/UX**: Clean, responsive design with EV-green theme
- **Smooth Animations**: Framer Motion powered animations throughout the app
- **Form Validation**: Comprehensive client-side validation for signup/login forms
- **Google OAuth Ready**: Placeholder integration for Google authentication
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Material UI**: Custom themed components with green/blue gradient palette

## 🛠 Tech Stack

- **React 18** - Latest React with functional components and hooks
- **Material UI (MUI)** - Custom themed UI components
- **Framer Motion** - Smooth animations and transitions
- **React Router v6** - Client-side routing
- **Context API** - State management (placeholder for auth)

## 📁 Project Structure

```
src/
├── components/          # Reusable components
│   ├── Navbar.jsx      # Navigation bar
│   ├── Footer.jsx      # Footer component
│   ├── GoogleAuthButton.jsx  # Google OAuth button
│   └── AnimatedBackground.jsx # Animated background
├── pages/              # Page components
│   ├── LandingPage.jsx # Home page
│   ├── SignupPage.jsx  # Registration page
│   └── LoginPage.jsx   # Login page
├── theme.js            # Custom MUI theme
├── App.jsx             # Main app with routing
└── index.js            # Entry point
```

## 🎨 Design Features

- **EV-Green Theme**: Sustainable color palette with green/blue gradients
- **Animated Background**: Floating EV icons and energy waves
- **Glass Morphism**: Translucent cards with backdrop blur effects
- **Smooth Transitions**: Page transitions and hover effects
- **Modern Typography**: Clean, readable fonts with proper hierarchy

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd NexCharge
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 📱 Pages

### Landing Page (`/`)
- Hero section with animated content
- Feature highlights (AI Route Planner, Smart Booking, Battery Health Advisor)
- Call-to-action buttons
- Animated background with floating EV icons

### Signup Page (`/signup`)
- Registration form with validation
- Google OAuth button (placeholder)
- Password confirmation
- Form validation with error messages

### Login Page (`/login`)
- Login form with validation
- Google OAuth button (placeholder)
- Success/error handling
- Navigation to signup

## 🎯 Key Features

### Form Validation
- Email format validation
- Password strength requirements
- Password confirmation matching
- Real-time error clearing

### Animations
- Staggered text animations on landing page
- Fade-in animations for page transitions
- Hover effects on buttons and cards
- Floating background elements

### Responsive Design
- Mobile-first approach
- Breakpoint-specific layouts
- Touch-friendly interactions
- Optimized typography scaling

## 🔧 Customization

### Theme Colors
The theme can be customized in `src/theme.js`:
- Primary: Green (#4CAF50)
- Secondary: Blue (#2196F3)
- Background gradients and overlays

### Adding New Pages
1. Create a new component in `src/pages/`
2. Add the route in `src/App.jsx`
3. Include Navbar and Footer components
4. Add AnimatedBackground for consistency

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Netlify/Vercel
1. Push code to GitHub
2. Connect repository to Netlify/Vercel
3. Set build command: `npm run build`
4. Set publish directory: `build`

## 🔮 Future Enhancements

- Backend integration with authentication
- Real Google OAuth implementation
- Dashboard with charging station maps
- Real-time charging status updates
- Payment integration
- Push notifications

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

---

**NexCharge** - Powering the Future of EV Charging 🚗⚡
