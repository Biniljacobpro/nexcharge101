# NexCharge Deployment Guide

This guide explains how to deploy the NexCharge application on Vercel with separate frontend and backend deployments while maintaining local development capabilities.

## Prerequisites

1. Vercel account
2. MongoDB Atlas account
3. Cloudinary account
4. Razorpay account (for payment processing)
5. Google OAuth credentials
6. Email service credentials (SMTP or Gmail OAuth2)

## Environment Variables Setup

### Backend Environment Variables (.env.production)

Create the following environment variables in your Vercel project settings:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://biniljacob274:NcvxYsYAbvHLxsZZ@cluster0.83fbygj.mongodb.net/nexcharge?retryWrites=true&w=majority&appName=Cluster0

# JWT Secret
JWT_ACCESS_SECRET=8f1a2c79e5a4d6f9b72c9d1f8a2c3d7f6b8a9c1e4d7f2a9e1c6b4d8a7f9c0d1
JWT_REFRESH_SECRET=f3c7e1a9b4d8c2f9a0e3b7c1d5f6a9b2c4e7f8d1a3c0e6b5d9f2a8c1b7e4f9a2
JWT_ACCESS_TTL=20m
JWT_REFRESH_TTL=7d

# CORS Configuration for Production
CORS_ORIGIN=https://nexcharge.vercel.app

# Port Configuration
PORT=3000

# Firebase Configuration
FIREBASE_PROJECT_ID=nexcharge-fe3d4
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-fbsvc@nexcharge-fe3d4.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n(your private key here)\n-----END PRIVATE KEY-----\n"

# Email Configuration
EMAIL_USER=biniljacob274@gmail.com
EMAIL_APP_PASSWORD=yhkg lobl ivtb gcjz

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_RGXWGOBliVCIpU
RAZORPAY_KEY_SECRET=9Q49llzcN0kLD3021OoSstOp

# Cloudinary Configuration
CLOUDINARY_CLOUD_NAME=dzc2lma5w
CLOUDINARY_API_KEY=321938326249945
CLOUDINARY_API_SECRET=joBijmJE0-19ikSCb_MgyDZ9iOM
CLOUDINARY_URL=cloudinary://321938326249945:joBijmJE0-19ikSCb_MgyDZ9iOM@dzc2lma5w
```

### Frontend Environment Variables (.env.production)

```env
# API Base URL for Production
REACT_APP_API_BASE=https://nexcharge-qu9o.vercel.app

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=AIzaSyCPcSXZHUSLU1qgPFrdPjx1NfBxqtj-VNs
REACT_APP_FIREBASE_AUTH_DOMAIN=nexcharge-fe3d4.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=nexcharge-fe3d4
REACT_APP_FIREBASE_STORAGE_BUCKET=nexcharge-fe3d4.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=33548488430
REACT_APP_FIREBASE_APP_ID=1:33548488430:web:bda58cb7bdbfcdc697edff

# Google Maps API Key
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC7lDedDdpcUGJVQz3Hhm4MWrqdyGndu_M
```

## Deployment Steps

### 1. Backend Deployment (Vercel Serverless Functions)

1. Log in to your Vercel account
2. Create a new project
3. Import your repository
4. Configure the project:
   - Framework Preset: Other
   - Root Directory: backend
   - Build Command: `npm install`
   - Output Directory: `.`
5. Add environment variables in the "Environment Variables" section
6. Deploy the project

### 2. Frontend Deployment (Vercel Static Site)

1. Log in to your Vercel account
2. Create a new project
3. Import your repository
4. Configure the project:
   - Framework Preset: Create React App
   - Root Directory: frontend
   - Build Command: `npm run build`
   - Output Directory: `build`
5. Add environment variables in the "Environment Variables" section
6. Deploy the project

## Local Development Configuration

### Backend Local Development

1. Create a `.env` file in the `backend` directory with your local configuration:
   ```env
   MONGODB_URI=mongodb+srv://biniljacob274:NcvxYsYAbvHLxsZZ@cluster0.83fbygj.mongodb.net/nexcharge?retryWrites=true&w=majority&appName=Cluster0
   JWT_ACCESS_SECRET=8f1a2c79e5a4d6f9b72c9d1f8a2c3d7f6b8a9c1e4d7f2a9e1c6b4d8a7f9c0d1
   JWT_REFRESH_SECRET=f3c7e1a9b4d8c2f9a0e3b7c1d5f6a9b2c4e7f8d1a3c0e6b5d9f2a8c1b7e4f9a2
   JWT_ACCESS_TTL=20m
   JWT_REFRESH_TTL=7d
   CORS_ORIGIN=http://localhost:3000
   CLOUDINARY_CLOUD_NAME=dzc2lma5w
   CLOUDINARY_API_KEY=321938326249945
   CLOUDINARY_API_SECRET=joBijmJE0-19ikSCb_MgyDZ9iOM
   RAZORPAY_KEY_ID=rzp_test_RGXWGOBliVCIpU
   RAZORPAY_KEY_SECRET=9Q49llzcN0kLD3021OoSstOp
   ```

2. Run the backend:
   ```bash
   cd backend
   npm install
   npm run dev
   ```

### Frontend Local Development

1. Create a `.env` file in the `frontend` directory:
   ```env
   REACT_APP_API_BASE=http://localhost:4000
   REACT_APP_FIREBASE_API_KEY=AIzaSyCPcSXZHUSLU1qgPFrdPjx1NfBxqtj-VNs
   REACT_APP_FIREBASE_AUTH_DOMAIN=nexcharge-fe3d4.firebaseapp.com
   REACT_APP_FIREBASE_PROJECT_ID=nexcharge-fe3d4
   REACT_APP_FIREBASE_STORAGE_BUCKET=nexcharge-fe3d4.firebasestorage.app
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=33548488430
   REACT_APP_FIREBASE_APP_ID=1:33548488430:web:bda58cb7bdbfcdc697edff
   REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC7lDedDdpcUGJVQz3Hhm4MWrqdyGndu_M
   ```

2. Run the frontend:
   ```bash
   cd frontend
   npm install
   npm start
   ```

## Domain Configuration

### Custom Domains

1. In your Vercel dashboard, go to your project settings
2. Navigate to the "Domains" section
3. Add your custom domain
4. Update your DNS records as instructed by Vercel
5. Update the CORS_ORIGIN environment variable to include your custom domain

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure CORS_ORIGIN includes your frontend domain
2. **Database Connection**: Verify MONGODB_URI is correctly set
3. **Image Uploads**: Check Cloudinary credentials
4. **Payments**: Verify Razorpay keys are correct

### Environment Variables Not Loading

1. Ensure environment variables are added in Vercel project settings, not just in .env files
2. Redeploy your application after adding environment variables

## Post-Deployment Verification

1. Test user registration and login
2. Verify Google OAuth integration
3. Test image uploads
4. Check payment processing
5. Validate email notifications
6. Confirm admin dashboard functionality

## Maintenance

1. Regularly update dependencies
2. Monitor error logs in Vercel dashboard
3. Check MongoDB Atlas performance
4. Review Cloudinary storage usage
5. Update SSL certificates for custom domains

This deployment strategy allows you to:
- Run separate frontend and backend deployments on Vercel
- Maintain full local development capabilities
- Scale independently
- Keep environment-specific configurations separate