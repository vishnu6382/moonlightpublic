import { v2 as cloudinary } from 'cloudinary';

/**
 * Configure Cloudinary server-side instance.
 * Never import this file in client-side components ('use client').
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

/**
 * Generates an authenticated signature for client-side direct uploads.
 * This keeps the API Secret strictly on the server.
 */
export function generateUploadSignature(paramsToSign = {}) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) {
    throw new Error('CLOUDINARY_API_SECRET environment variable is missing.');
  }
  return cloudinary.utils.api_sign_request(paramsToSign, apiSecret);
}

/**
 * Permanently deletes an asset from Cloudinary using its public ID.
 * Supports image, video, or raw resource types.
 */
export async function deleteCloudinaryAsset(publicId, resourceType = 'image') {
  if (!publicId) return { result: 'not_found' };
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
    invalidate: true,
  });
}

export default cloudinary;
