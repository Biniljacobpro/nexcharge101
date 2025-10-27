# Cloudinary Integration Guide

This document explains how Cloudinary has been integrated into the NexCharge backend to replace local image storage.

## Configuration

The integration uses the following environment variables from your `.env` file:

```
CLOUDINARY_CLOUD_NAME=dzc2lma5w
CLOUDINARY_API_KEY=321938326249945
CLOUDINARY_API_SECRET=joBijmJE0-19ikSCb_MgyDZ9iOM
CLOUDINARY_URL=cloudinary://321938326249945:joBijmJE0-19ikSCb_MgyDZ9iOM@dzc2lma5w
```

## Implementation Details

### 1. Cloudinary Configuration (`config/cloudinary.js`)

- Initializes the Cloudinary SDK with credentials from environment variables
- Exports the configured Cloudinary instance

### 2. Upload Middleware (`middleware/upload.js`)

- Automatically detects if Cloudinary credentials are available
- Falls back to local storage if Cloudinary is not configured
- Supports both single and multiple file uploads
- Stores images in the "NexCharge/uploads" folder on Cloudinary
- Applies image transformations (max 1200x1200 pixels)
- Returns appropriate URLs in the request object:
  - `req.imageUrl` for single uploads
  - `req.imageUrls` for multiple uploads

### 3. Updated Existing Upload Middleware (`src/middlewares/upload.js`)

- Modified the existing local storage middleware to support Cloudinary
- Maintains backward compatibility
- Uses Cloudinary when credentials are available, otherwise falls back to local storage

### 4. Controller Updates (`src/controllers/stationManager.controller.js`)

- Updated `uploadStationImages` function to handle both Cloudinary URLs and local file paths
- Preserves existing API response format

## Usage

### In Routes

The upload middleware can be used in routes like this:

```javascript
import upload from '../middleware/upload.js';

// For single file upload
router.post('/upload', upload.single('image'), (req, res) => {
  // req.imageUrl contains the URL to the uploaded image
});

// For multiple file upload
router.post('/upload', upload.array('images', 10), (req, res) => {
  // req.imageUrls contains an array of URLs to the uploaded images
});

// For mixed uploads (single + multiple)
router.post('/upload', upload.fields([
  { name: 'image', maxCount: 1 },
  { name: 'images', maxCount: 10 }
]), (req, res) => {
  // req.imageUrl contains the URL to the single image
  // req.imageUrls contains an array of URLs to the multiple images
});
```

### Response Format

Successful uploads return a response in this format:

```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/NexCharge/uploads/your-image.jpg"
}
```

For multiple images:

```json
{
  "success": true,
  "message": "Images uploaded successfully",
  "imageUrls": [
    "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/NexCharge/uploads/image1.jpg",
    "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/NexCharge/uploads/image2.jpg"
  ]
}
```

## Fallback to Local Storage

If Cloudinary credentials are not properly configured, the system automatically falls back to local file storage in the `uploads/` directory, maintaining full backward compatibility.

## Testing

To test the integration:

1. Ensure your `.env` file contains the Cloudinary credentials
2. Run the test script: `node test-cloudinary.js`
3. Verify that the connection is successful

To test file uploads:

1. Run the test server: `node test-upload.js`
2. Use a tool like Postman or curl to send a POST request to `http://localhost:3001/test-upload` with form-data
3. Include an image file in the `image` or `images` field
4. Verify that you receive a Cloudinary URL in the response

## Deployment

The integration works seamlessly in both local development and production environments:

- **Local Development**: If Cloudinary credentials are missing, falls back to local storage
- **Production**: Uses Cloudinary when credentials are available
- **Hybrid**: Can switch between Cloudinary and local storage by changing environment variables

No code changes are required when deploying to different environments.