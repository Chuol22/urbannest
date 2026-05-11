// src/middleware/upload.cloudinary.js
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { v4 as uuidv4 } from 'uuid';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Use memory storage (no disk writing)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WEBP are allowed.'), false);
  }
};

// Multer configuration
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: fileFilter
});

// Helper function to upload buffer to Cloudinary
const uploadToCloudinary = async (fileBuffer, folder = 'properties') => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `urbannest/${folder}`,
        transformation: [
          { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
          { fetch_format: 'auto' }
        ],
        public_id: `${Date.now()}_${uuidv4()}`
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            secure_url: result.secure_url,
            public_id: result.public_id,
            bytes: result.bytes,
            format: result.format,
            width: result.width,
            height: result.height
          });
        }
      }
    );
    uploadStream.end(fileBuffer);
  });
};

// Helper to upload multiple files
const uploadMultipleToCloudinary = async (files, folder = 'properties') => {
  const uploadPromises = files.map(file => uploadToCloudinary(file.buffer, folder));
  return Promise.all(uploadPromises);
};

// ✅ CORRECT EXPORTS
export { upload, uploadToCloudinary, uploadMultipleToCloudinary };