# Google Places API Setup Guide

## Overview
The Route Planner now supports **Place Autocomplete**, allowing users to simply type place names (like "Times Square" or "Central Park") instead of manually entering coordinates.

## Features Added
✅ **Place Autocomplete Component** - Users can type and search for places  
✅ **Automatic Coordinate Conversion** - Place names are converted to lat/lng for the backend  
✅ **Multi-Country Support** - Supports India (IN), USA (US), UK (GB), and UAE (AE)  
✅ **Fallback Options** - Users can still use DMS format or map picker if needed

## Enable Google Places API

### Step 1: Go to Google Cloud Console
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)

### Step 2: Enable Places API
1. Go to **APIs & Services** > **Library**
2. Search for **"Places API"**
3. Click on **Places API**
4. Click **ENABLE**

### Step 3: Verify API Key
Your API key is already configured in `.env`:
```
REACT_APP_GOOGLE_MAPS_API_KEY=AIzaSyC7lDedDdpcUGJVQz3Hhm4MWrqdyGndu_M
```

### Step 4: Add API Restrictions (Recommended)
For security, restrict your API key:
1. Go to **APIs & Services** > **Credentials**
2. Click on your API key
3. Under **Application restrictions**, select **HTTP referrers**
4. Add your domains:
   - `http://localhost:3000/*`
   - `https://yourdomain.com/*`
5. Under **API restrictions**, select **Restrict key**
6. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
   - Directions API
   - Geolocation API

## How It Works

### User Experience
1. User opens Route Planner at `/route-planner`
2. Types "Times Square" in **Start Location**
3. Selects from autocomplete dropdown
4. System automatically converts to coordinates: `{lat: 40.758, lng: -73.985}`
5. Backend receives coordinates for route calculation

### Technical Flow
```
User Input → Google Places Autocomplete → Place Selection → 
Geocoding (lat/lng) → Backend API → Route Calculation
```

## Component Details

### PlaceAutocomplete.jsx
```jsx
<PlaceAutocomplete
  label="Search Place"
  placeholder="Type a place name"
  value={formData.start.placeName}
  onChange={({ lat, lng, placeName }) => {
    // Handle place selection
  }}
  helperText="Type and select a place"
  required
/>
```

### Supported Countries
- 🇮🇳 India (IN)
- 🇺🇸 United States (US)
- 🇬🇧 United Kingdom (GB)
- 🇦🇪 United Arab Emirates (AE)

To add more countries, edit `PlaceAutocomplete.jsx`:
```jsx
componentRestrictions: { country: ['in', 'us', 'gb', 'ae', 'ca', 'au'] }
```

## Backend Compatibility

### Request Format
The backend already expects coordinates, so no changes needed:
```json
{
  "start": {
    "lat": 40.758,
    "lng": -73.985
  },
  "destination": {
    "lat": 34.052,
    "lng": -118.243
  },
  "vehicle": {...},
  "currentSOC": 65,
  "departureTime": "2026-01-12T10:00"
}
```

The place name is converted to coordinates on the frontend, and the backend receives standard lat/lng values.

## Testing

### Test the Autocomplete
1. Start the frontend: `npm start`
2. Navigate to `/route-planner`
3. Type in **Start Location**: "Times Square"
4. Select from dropdown
5. Verify coordinates appear in form
6. Type in **Destination**: "Central Park"
7. Submit the form
8. Backend should receive coordinates successfully

### Sample Places to Test
- **India**: "India Gate, New Delhi", "Gateway of India, Mumbai"
- **USA**: "Times Square, New York", "Golden Gate Bridge, San Francisco"
- **UK**: "Big Ben, London", "Buckingham Palace"
- **UAE**: "Burj Khalifa, Dubai", "Sheikh Zayed Grand Mosque, Abu Dhabi"

## Troubleshooting

### Issue: Autocomplete not showing
**Solution**: Make sure Places API is enabled in Google Cloud Console

### Issue: "This API project is not authorized"
**Solution**: Enable Places API and check API key restrictions

### Issue: No results for certain countries
**Solution**: Add country codes to `componentRestrictions` in PlaceAutocomplete.jsx

### Issue: CORS errors
**Solution**: Add your domain to HTTP referrers in API key restrictions

## Pricing
- **Places Autocomplete**: $2.83 per 1,000 requests
- **Geocoding**: $5.00 per 1,000 requests
- **Free Tier**: $200 monthly credit (covers ~70,000 autocomplete requests)

## Security Best Practices
1. ✅ Restrict API key to specific domains
2. ✅ Enable only required APIs
3. ✅ Monitor usage in Google Cloud Console
4. ✅ Set usage quotas to prevent unexpected charges
5. ✅ Never commit API keys to public repositories

## Files Modified
- ✅ `frontend/src/components/PlaceAutocomplete.jsx` - New autocomplete component
- ✅ `frontend/src/components/RoutePlanner.jsx` - Added place search fields
- ✅ `frontend/src/index.js` - Wrapped app with LoadScript for Places API

## Next Steps
1. Enable Places API in Google Cloud Console
2. Test the autocomplete functionality
3. Monitor API usage
4. Add more countries if needed

---
**Status**: ✅ Implementation Complete  
**Backend**: No changes needed (already accepts lat/lng)  
**Frontend**: Place autocomplete added with fallback options
