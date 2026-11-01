/**
 * Single source of truth for storage and upload limits based on the current plan.
 * Cloudinary plan limits:
 * - Images: 25 MB max (auto-optimized to WebP on delivery)
 * - Videos: 100 MB max (Cloudinary plan limit)
 * - 360° Panoramas: 25 MB max (2:1 equirectangular ratio)
 */
export const STORAGE_LIMITS = {
  image: {
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    allowedFormatsLabel: 'JPEG, PNG, WebP, AVIF',
    compressTip: 'compress with squoosh.app or tinypng.com and upload again',
  },
  video: {
    maxSizeBytes: 100 * 1024 * 1024,
    maxSizeLabel: '100 MB',
    allowedFormatsLabel: 'MP4, WebM, MOV',
    compressTip: 'compress with HandBrake (handbrake.fr) and upload again',
  },
  pano360: {
    maxSizeBytes: 25 * 1024 * 1024,
    maxSizeLabel: '25 MB',
    allowedFormatsLabel: 'JPEG, PNG, WebP (2:1 aspect ratio)',
    compressTip: 'compress with squoosh.app (keep 2:1 aspect) and upload again',
  },
};

/**
 * Validates file size against STORAGE_LIMITS.
 * Returns { valid: true } or { valid: false, error: '...', tip: '...' }
 */
export function validateFileSizeLimit(file, type = 'image') {
  if (!file) return { valid: false, error: 'No file provided.' };
  const targetType = type === 'video' ? 'video' : type === 'pano360' ? 'pano360' : 'image';
  const limitConfig = STORAGE_LIMITS[targetType] || STORAGE_LIMITS.image;

  if (file.size > limitConfig.maxSizeBytes) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      fileSizeMb: sizeMb,
      limitLabel: limitConfig.maxSizeLabel,
      tip: limitConfig.compressTip,
      error: `File "${file.name}" is ${sizeMb} MB, which exceeds the ${limitConfig.maxSizeLabel} plan limit. Tip: ${limitConfig.compressTip}.`,
    };
  }

  return { valid: true };
}
