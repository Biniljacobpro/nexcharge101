import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

// Check if Cloudinary credentials are available
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                     process.env.CLOUDINARY_API_KEY && 
                     process.env.CLOUDINARY_API_SECRET;

// Configure Cloudinary storage
let cloudinaryStorage;
if (useCloudinary) {
  cloudinaryStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'NexCharge/uploads',
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
    }
  });
}

// Configure local storage as fallback
const localStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// Create multer instances
const localUpload = multer({ storage: localStorage });
let cloudinaryUpload;

if (useCloudinary) {
  cloudinaryUpload = multer({ storage: cloudinaryStorage });
} else {
  // Fallback to local storage if Cloudinary is not configured
  cloudinaryUpload = localUpload;
}

// Middleware function that chooses between Cloudinary and local storage
const uploadMiddleware = (req, res, next) => {
  // Determine which upload strategy to use
  const uploader = useCloudinary ? cloudinaryUpload : localUpload;
  
  // Handle both single and multiple file uploads
  const upload = uploader.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 10 }
  ]);
  
  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ 
        success: false, 
        message: 'File upload failed', 
        error: err.message 
      });
    }
    
    // Process uploaded files for response
    if (req.files) {
      const files = req.files;
      
      // Handle single image upload
      if (files.image && files.image.length > 0) {
        if (useCloudinary) {
          req.imageUrl = files.image[0].path; // Cloudinary URL
        } else {
          req.imageUrl = `/uploads/${files.image[0].filename}`; // Local URL
        }
      }
      
      // Handle multiple images upload
      if (files.images && files.images.length > 0) {
        req.imageUrls = files.images.map(file => {
          if (useCloudinary) {
            return file.path; // Cloudinary URL
          } else {
            return `/uploads/${file.filename}`; // Local URL
          }
        });
      }
    }
    
    next();
  });
};

export default uploadMiddleware;