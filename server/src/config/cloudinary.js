// server/src/config/cloudinary.js

import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
});

// Upload options presets
const UPLOAD_PRESETS = {
  // Property images (full size)
  PROPERTY: {
    folder: 'urbannest/properties',
    transformation: [
      { width: 1200, height: 800, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    tags: ['property', 'full-size']
  },
  
  // Thumbnails (small, fast loading)
  THUMBNAIL: {
    folder: 'urbannest/thumbnails',
    transformation: [
      { width: 300, height: 200, crop: 'fill', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    tags: ['property', 'thumbnail']
  },
  
  // Medium size (for listings)
  MEDIUM: {
    folder: 'urbannest/medium',
    transformation: [
      { width: 600, height: 400, crop: 'limit', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    tags: ['property', 'medium']
  },
  
  // Profile pictures
  PROFILE: {
    folder: 'urbannest/profiles',
    transformation: [
      { width: 200, height: 200, crop: 'fill', gravity: 'face', quality: 'auto' },
      { fetch_format: 'auto' }
    ],
    tags: ['profile']
  }
};

/**
 * Upload image to Cloudinary with automatic transformations
 */
const uploadImage = async (file, preset = 'PROPERTY', options = {}) => {
  try {
    const presetConfig = UPLOAD_PRESETS[preset];
    
    const result = await cloudinary.uploader.upload(file.path, {
      ...presetConfig,
      ...options,
      eager: [
        // Generate multiple versions in one upload
        { width: 100, height: 100, crop: 'thumb', gravity: 'face', format: 'jpg' }, // Tiny thumbnail
        { width: 300, height: 200, crop: 'fill', format: 'jpg' }, // Small
        { width: 600, height: 400, crop: 'limit', format: 'jpg' }, // Medium
        { width: 1200, height: 800, crop: 'limit', format: 'jpg' }, // Large
        { width: 2000, crop: 'limit', format: 'jpg' } // Extra large
      ],
      eager_async: false, // Wait for eager transformations
      invalidate: true // Invalidate CDN cache
    });
    
    return {
      secure_url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      format: result.format,
      created_at: result.created_at,
      // Generated versions
      thumbnail: result.eager?.[0]?.secure_url || result.secure_url,
      small: result.eager?.[1]?.secure_url || result.secure_url,
      medium: result.eager?.[2]?.secure_url || result.secure_url,
      large: result.eager?.[3]?.secure_url || result.secure_url,
      // For responsive images
      responsive_breakpoints: result.responsive_breakpoints
    };
    
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image');
  }
};

/**
 * Upload multiple images
 */
const uploadMultipleImages = async (files, preset = 'PROPERTY') => {
  const uploadPromises = files.map(file => uploadImage(file, preset));
  const results = await Promise.all(uploadPromises);
  
  return results;
};

/**
 * Delete image from Cloudinary
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
};

/**
 * Get optimized URL with transformations
 */
const getOptimizedUrl = (publicId, options = {}) => {
  const {
    width,
    height,
    crop = 'limit',
    quality = 'auto',
    format = 'auto',
    effect,
    gravity,
    radius,
    angle
  } = options;
  
  const transformation = [];
  
  if (width || height) {
    transformation.push({ width, height, crop });
  }
  
  if (quality !== 'auto') {
    transformation.push({ quality });
  }
  
  if (format !== 'auto') {
    transformation.push({ fetch_format: format });
  }
  
  if (effect) {
    transformation.push({ effect });
  }
  
  if (gravity) {
    transformation.push({ gravity });
  }
  
  if (radius) {
    transformation.push({ radius });
  }
  
  if (angle) {
    transformation.push({ angle });
  }
  
  return cloudinary.url(publicId, {
    transformation,
    secure: true
  });
};

/**
 * Generate responsive image srcset
 */
const getResponsiveSrcSet = (publicId, widths = [300, 600, 900, 1200]) => {
  const srcset = widths.map(width => {
    const url = cloudinary.url(publicId, {
      width,
      crop: 'limit',
      quality: 'auto',
      format: 'auto',
      secure: true
    });
    return `${url} ${width}w`;
  }).join(', ');
  
  return srcset;
};

export default {
  uploadImage,
  uploadMultipleImages,
  deleteImage,
  getOptimizedUrl,
  getResponsiveSrcSet,
  UPLOAD_PRESETS
};