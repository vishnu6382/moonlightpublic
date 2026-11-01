/**
 * Unified Media Delivery Pipeline for Moon Light Resort
 * Guarantees razor-sharp image/video delivery with true-to-life aspect ratios,
 * zero unintended upscaling, quality floors (85+ for hero/large), and exact srcset generation.
 */

export function extractMediaUrl(item) {
  if (!item) return '';
  if (typeof item === 'string') return item.trim();
  return (item.src || item.url || item.secureUrl || item.panoSrc || item.previewSrc || '').trim();
}

export function isCloudinaryUrl(url) {
  return typeof url === 'string' && url.includes('res.cloudinary.com') && url.includes('/upload/');
}

/**
 * Parses Cloudinary URL into parts: prefix, existing transformations, public_id, and extension.
 */
export function parseCloudinaryUrl(url) {
  if (!isCloudinaryUrl(url)) return null;

  const match = url.match(/(https?:\/\/res\.cloudinary\.com\/[^/]+\/(image|video)\/upload\/)(?:([^/]+(?:\/[^/]+)*)\/)?(v\d+\/[^?#]+|\w[^?#]+)/);
  if (!match) return null;

  return {
    prefix: match[1],
    resourceType: match[2],
    existingTransform: match[3] || '',
    publicPath: match[4],
  };
}

/**
 * Builds an optimized Cloudinary delivery URL with quality floors, precise sizing,
 * and no upscaling (c_limit).
 */
export function mediaUrl(item, options = {}) {
  const rawUrl = extractMediaUrl(item);
  if (!rawUrl) return '';

  if (!isCloudinaryUrl(rawUrl)) {
    return rawUrl;
  }

  const parsed = parseCloudinaryUrl(rawUrl);
  if (!parsed) return rawUrl;

  const {
    width,
    height,
    aspect,
    crop = 'limit', // 'limit' (never upscale), 'fill', 'thumb'
    focus = item?.focus,
    quality,
    format = 'auto',
  } = options;

  const transforms = [];

  // 1. Format
  transforms.push(`f_${format}`);

  // 2. Quality Floor (85+ for hero & tiles >= 500px, never eco)
  if (quality) {
    transforms.push(`q_${quality}`);
  } else if (width && width >= 500) {
    transforms.push('q_88');
  } else {
    transforms.push('q_auto:good');
  }

  // 3. Sizing & Aspect Ratio
  if (width) {
    transforms.push(`w_${Math.round(width)}`);
  }
  if (height) {
    transforms.push(`h_${Math.round(height)}`);
  }
  if (aspect) {
    transforms.push(`ar_${typeof aspect === 'number' ? aspect.toFixed(2) : aspect}`);
  }

  // 4. Crop Mode & Focal Point
  if (crop === 'fill') {
    transforms.push('c_fill');
    if (focus && typeof focus.x === 'number' && typeof focus.y === 'number') {
      transforms.push(`g_xy_center,x_${Math.round(focus.x)},y_${Math.round(focus.y)}`);
    } else {
      transforms.push('g_auto');
    }
  } else {
    // Default safe limit: never upscale or distort
    transforms.push('c_limit');
  }

  const transformString = transforms.join(',');
  return `${parsed.prefix}${transformString}/${parsed.publicPath}`;
}

/**
 * Generates an optimized srcset string for 1x and 2x DPR screens
 * across a set of target widths (e.g. [400, 640, 800, 1200, 1600, 2000]).
 */
export function generateSrcSet(item, targetWidths = [400, 640, 800, 1200, 1600, 2000], options = {}) {
  const rawUrl = extractMediaUrl(item);
  if (!rawUrl || !isCloudinaryUrl(rawUrl)) return undefined;

  const originalWidth = item?.width || item?.naturalWidth;
  const validWidths = originalWidth
    ? targetWidths.filter((w) => w <= originalWidth * 1.05)
    : targetWidths;

  const widthsToUse = validWidths.length > 0 ? validWidths : [targetWidths[0]];

  return widthsToUse
    .map((w) => {
      const url = mediaUrl(item, { ...options, width: w });
      return `${url} ${w}w`;
    })
    .join(', ');
}

/**
 * Calculates how much an image is cropped when placed into a given container aspect ratio.
 */
export function calculateCropPercent(mediaAspect, containerAspect) {
  if (!mediaAspect || !containerAspect || mediaAspect <= 0 || containerAspect <= 0) {
    return 0;
  }
  if (Math.abs(mediaAspect - containerAspect) < 0.01) return 0;

  if (containerAspect > mediaAspect) {
    // Container is wider than media -> height is cropped
    const renderedHeightRatio = containerAspect / mediaAspect;
    return Math.round(((renderedHeightRatio - 1) / renderedHeightRatio) * 100);
  } else {
    // Container is taller than media -> width is cropped
    const renderedWidthRatio = mediaAspect / containerAspect;
    return Math.round(((renderedWidthRatio - 1) / renderedWidthRatio) * 100);
  }
}

/**
 * Categorizes an aspect ratio into a standard tag:
 * Portrait, Landscape, Square, Panorama, Tall Video, Wide Video.
 */
export function getOrientationTag(width, height, isVideo = false) {
  if (!width || !height) return isVideo ? 'Video' : 'Photo';
  const ar = width / height;

  if (isVideo) {
    return ar < 0.85 ? 'Tall video' : 'Wide video';
  }
  if (ar >= 2.2) return 'Panorama';
  if (ar >= 1.15) return 'Landscape';
  if (ar <= 0.85) return 'Portrait';
  return 'Square';
}

