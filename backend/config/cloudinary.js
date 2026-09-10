import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// If production env exists and is loaded
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production', override: true });
}

export const isCloudinaryConfigured = () => {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Configure cloudinary with env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Upload a file to Cloudinary with chunked upload support (for large files up to 2GB)
 * @param {string} filePath - Absolute path to the local file on disk
 * @param {object} customOptions - Additional Cloudinary upload options
 * @returns {Promise<object>} Cloudinary upload result
 */
export const uploadLargeFile = (filePath, customOptions = {}) => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return reject(
        new Error(
          'Cloudinary is not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in backend .env'
        )
      );
    }

    const defaultOptions = {
      resource_type: 'auto',
      chunk_size: 20 * 1024 * 1024, // 20 MB chunks for smooth large file transmission
      timeout: 3600000, // 1 hour timeout for very large uploads
      folder: 'socio_legal_documents',
      ...customOptions,
    };

    cloudinary.uploader.upload_large(filePath, defaultOptions, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

/**
 * Delete a file from Cloudinary by public ID
 * @param {string} publicId - Cloudinary public ID
 * @param {string} resourceType - 'image' | 'raw' | 'video'
 * @returns {Promise<object>}
 */
export const deleteFromCloudinary = (publicId, resourceType = 'raw') => {
  return new Promise((resolve, reject) => {
    if (!isCloudinaryConfigured()) {
      return resolve({ result: 'skipped_not_configured' });
    }

    cloudinary.uploader.destroy(publicId, { resource_type: resourceType }, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });
  });
};

export default cloudinary;
