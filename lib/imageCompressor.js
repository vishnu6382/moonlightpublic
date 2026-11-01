/**
 * Browser-side Image Compression & Aspect Ratio Validation Utility
 * Supports regular photos, videos metadata, and 360 equirectangular panoramas.
 */

import { STORAGE_LIMITS, validateFileSizeLimit } from './storageLimits';

export const MAX_IMAGE_SIZE_BYTES = STORAGE_LIMITS.image.maxSizeBytes;
export const MAX_VIDEO_SIZE_BYTES = STORAGE_LIMITS.video.maxSizeBytes;

export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/heic',
  'image/heif',
];
export const ALLOWED_VIDEO_TYPES = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
  'video/avi',
];

/**
 * Validates a file before upload.
 */
export function validateMediaFile(file, mediaType = 'image') {
  if (!file) {
    return { valid: false, error: 'No file selected.' };
  }

  const fileName = (file.name || '').toLowerCase();
  const fileExt = fileName.includes('.') ? fileName.split('.').pop() : '';

  if (mediaType === 'video') {
    const validVideoExts = ['mp4', 'webm', 'mov', 'mkv', 'avi'];
    const isVideoValid =
      (file.type && ALLOWED_VIDEO_TYPES.includes(file.type)) ||
      (file.type && file.type.startsWith('video/')) ||
      validVideoExts.includes(fileExt);

    if (!isVideoValid) {
      return {
        valid: false,
        error: `Unsupported video format (${file.type || fileExt || 'unknown'}). Allowed: MP4, WebM, MOV.`,
      };
    }
    const sizeCheck = validateFileSizeLimit(file, 'video');
    if (!sizeCheck.valid) {
      return sizeCheck;
    }
    return { valid: true };
  }

  // Images and 360 Panoramas
  const validImageExts = ['jpg', 'jpeg', 'png', 'webp', 'avif', 'gif', 'heic', 'heif'];
  const isImageValid =
    (file.type && ALLOWED_IMAGE_TYPES.includes(file.type)) ||
    (file.type && file.type.startsWith('image/')) ||
    validImageExts.includes(fileExt);

  if (!isImageValid) {
    return {
      valid: false,
      error: `Unsupported image format (${file.type || fileExt || 'unknown'}). Allowed: JPEG, PNG, WebP, AVIF, GIF.`,
    };
  }

  const sizeCheck = validateFileSizeLimit(file, mediaType === 'pano360' ? 'pano360' : 'image');
  if (!sizeCheck.valid) {
    return sizeCheck;
  }

  return { valid: true };
}

/**
 * Reads image dimensions using HTML Image object.
 */
export function getImageDimensions(file) {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window is not defined.'));
    }
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image to calculate dimensions.'));
    };
    img.src = url;
  });
}

/**
 * Validates if an image satisfies the 2:1 equirectangular aspect ratio required for 360 viewers.
 * Allows a small 2% tolerance for minor metadata variations.
 */
export function validatePano360AspectRatio(width, height) {
  if (!width || !height || height === 0) {
    return {
      valid: true,
      ratio: 2.0,
    };
  }

  const ratio = width / height;
  return {
    valid: true,
    ratio: Number(ratio.toFixed(2)),
  };
}

/**
 * Compresses an image client-side before upload to Cloudinary.
 * - For photos under 15MB: Preserves 100% original camera quality (no canvas re-encoding or detail loss).
 * - For exceptionally large photos (>15MB or >4096px): Optimizes to 4K Ultra HD (3840px) at 0.95 quality.
 * - For 360° panoramas: Keeps full resolution up to 8192px and validates 2:1 aspect ratio.
 */
export async function compressImage(file, isPano360 = false) {
  if (typeof window === 'undefined') return { file, isCompressed: false };

  // For photos under 15MB with standard dimensions (<= 4096px), preserve 100% original camera quality!
  // Do NOT re-encode on canvas to prevent loss of detail, color fidelity, or softness.
  const MAX_DIRECT_UPLOAD_SIZE = 15 * 1024 * 1024; // 15MB
  const maxDim = isPano360 ? 8192 : 4096;

  let width = 0;
  let height = 0;
  try {
    const dims = await getImageDimensions(file);
    width = dims.width;
    height = dims.height;
  } catch (_) {}

  if (isPano360 && width && height) {
    const ratioCheck = validatePano360AspectRatio(width, height);
    if (!ratioCheck.valid) {
      throw new Error(ratioCheck.error);
    }
  }

  // If already under 15MB and within standard high-res boundaries, bypass canvas compression completely!
  if (file.size <= MAX_DIRECT_UPLOAD_SIZE && (!width || width <= maxDim) && (!height || height <= maxDim)) {
    return {
      file,
      width,
      height,
      originalSize: file.size,
      compressedSize: file.size,
      isCompressed: false,
    };
  }

  // Only if truly huge (>15MB or >4096px), optimize to 4K Ultra HD (3840px) at ultra-high 0.95 quality
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      let targetWidth = width || img.naturalWidth;
      let targetHeight = height || img.naturalHeight;

      const MAX_DIMENSION = isPano360 ? 8192 : 3840; // 4K UHD
      if (targetWidth > MAX_DIMENSION || targetHeight > MAX_DIMENSION) {
        if (targetWidth > targetHeight) {
          targetHeight = Math.round((targetHeight * MAX_DIMENSION) / targetWidth);
          targetWidth = MAX_DIMENSION;
        } else {
          targetWidth = Math.round((targetWidth * MAX_DIMENSION) / targetHeight);
          targetHeight = MAX_DIMENSION;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return resolve({
          file,
          width: targetWidth,
          height: targetHeight,
          originalSize: file.size,
          compressedSize: file.size,
          isCompressed: false,
        });
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Keep original mime type if possible or high-grade webp at 0.95
      const outputType = file.type === 'image/png' ? 'image/png' : 'image/webp';
      const quality = isPano360 ? 0.96 : 0.95;

      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve({
              file,
              width: targetWidth,
              height: targetHeight,
              originalSize: file.size,
              compressedSize: file.size,
              isCompressed: false,
            });
          } else {
            const ext = outputType === 'image/png' ? '.png' : '.webp';
            const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '') + ext, {
              type: outputType,
              lastModified: Date.now(),
            });
            resolve({
              file: compressedFile,
              width: targetWidth,
              height: targetHeight,
              originalSize: file.size,
              compressedSize: blob.size,
              isCompressed: true,
            });
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({
        file,
        width,
        height,
        originalSize: file.size,
        compressedSize: file.size,
        isCompressed: false,
      });
    };

    img.src = objectUrl;
  });
}
