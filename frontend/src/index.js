import React from 'react';
import ReactDOM from 'react-dom/client';
import { LoadScript } from '@react-google-maps/api';
import App from './App';

// Libraries must be defined outside component or memoized to prevent re-initialization
const LIBRARIES = ['places', 'geometry'];
const googleMapsApiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <LoadScript 
      googleMapsApiKey={googleMapsApiKey}
      libraries={LIBRARIES}
      loadingElement={<div>Loading Maps...</div>}
    >
      <App />
    </LoadScript>
  </React.StrictMode>
);
