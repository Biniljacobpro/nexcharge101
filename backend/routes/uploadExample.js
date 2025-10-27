import express from 'express';
import uploadMiddleware from '../middleware/upload.js';

const router = express.Router();

// POST route for uploading images
router.post('/upload', uploadMiddleware, (req, res) => {
  try {
    // Check if any files were uploaded
    if (!req.files || (req.files.image && req.files.image.length === 0 && req.files.images && req.files.images.length === 0)) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    // Prepare response based on uploaded files
    const response = {
      success: true,
      message: 'Image uploaded successfully'
    };

    // Add single image URL if available
    if (req.imageUrl) {
      response.imageUrl = req.imageUrl;
    }

    // Add multiple image URLs if available
    if (req.imageUrls) {
      response.imageUrls = req.imageUrls;
    }

    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error during upload',
      error: error.message
    });
  }
});

export default router;