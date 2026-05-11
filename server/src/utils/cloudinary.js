// Cloudinary utility functions
// This file provides helper functions for Cloudinary operations
// Note: The main Cloudinary configuration is in config/cloudinary.js

import cloudinaryConfig from '../config/cloudinary.js';

/**
 * Extract public ID from Cloudinary URL
 * @param {string} url - Cloudinary image URL
 * @returns {string} Public ID
 */
export const extractPublicId = (url) => {
  try {
    const urlParts = url.split('/');
    const filename = urlParts[urlParts.length - 1];
    const publicId = filename.split('.')[0];
    const folder = urlParts[urlParts.length - 2];
    return `${folder}/${publicId}`;
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return null;
  }
};

/**
 * Get image dimensions from URL
 * @param {string} url - Cloudinary image URL
 * @returns {Object} Dimensions {width, height}
 */
export const getImageDimensions = (url) => {
  try {
    // Cloudinary URLs can contain dimensions in the transformation string
    const matches = url.match(/\/w_(\d+),h_(\d+)\//);
    if (matches) {
      return {
        width: parseInt(matches[1]),
        height: parseInt(matches[2])
      };
    }
    return null;
  } catch (error) {
    console.error('Error extracting image dimensions:', error);
    return null;
  }
};

/**
 * Generate optimized URL for specific dimensions
 * @param {string} url - Original Cloudinary URL
 * @param {number} width - Target width
 * @param {number} height - Target height
 * @param {string} quality - Image quality (auto:best, auto:good, etc.)
 * @returns {string} Optimized URL
 */
export const generateOptimizedUrl = (url, width, height, quality = 'auto:best') => {
  try {
    const publicId = extractPublicId(url);
    if (!publicId) return url;

    return cloudinaryConfig.getOptimizedUrl(publicId, {
      width,
      height,
      crop: 'fill',
      quality,
      format: 'auto'
    });
  } catch (error) {
    console.error('Error generating optimized URL:', error);
    return url;
  }
};

/**
 * Generate responsive srcset for images
 * @param {string} url - Original Cloudinary URL
 * @param {Array<number>} widths - Array of widths
 * @returns {string} Srcset string
 */
export const generateSrcset = (url, widths = [300, 600, 900, 1200, 1600]) => {
  try {
    const publicId = extractPublicId(url);
    if (!publicId) return url;

    return cloudinaryConfig.getResponsiveSrcSet(publicId, widths);
  } catch (error) {
    console.error('Error generating srcset:', error);
    return url;
  }
};

export default {
  extractPublicId,
  getImageDimensions,
  generateOptimizedUrl,
  generateSrcset
};
