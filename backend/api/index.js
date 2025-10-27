import app from '../src/index.js';
import mongoose from 'mongoose';

// Vercel serverless function handler
export default async function handler(request, response) {
  // Log incoming request for debugging
  console.log('Incoming request:', {
    method: request.method,
    url: request.url,
    headers: {
      origin: request.headers.origin,
      'content-type': request.headers['content-type']
    }
  });
  
  // Set CORS headers explicitly for all requests
  const allowedOrigins = [
    'http://localhost:3000',
    'https://nexcharge.vercel.app'
  ];
  
  const origin = request.headers.origin;
  console.log('Request origin:', origin);
  
  if (allowedOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    console.log('Set CORS header for origin:', origin);
  } else {
    console.log('Origin not allowed:', origin);
  }
  
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    console.log('Handling preflight OPTIONS request');
    response.status(200).end();
    return;
  }
  
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState !== 1) {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('MongoDB connected for Vercel function');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      return response.status(500).json({ error: 'Database connection failed' });
    }
  }

  // Pass the request to Express app
  // Use Express app directly without wrapping in a Promise
  app(request, response);
}