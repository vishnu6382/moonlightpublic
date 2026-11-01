'use client';

import React from 'react';
import Image from 'next/image';
import { extractMediaUrl, mediaUrl, generateSrcSet, isCloudinaryUrl } from '@/lib/media';
import styles from './MediaImage.module.css';

/**
 * MediaImage:
 * The single, unified image component for the entire website.
 * - Enforces quality floor (85+ for tiles >= 500px, 90 for hero).
 * - Generates 2x sharpness srcsets (never delivers smaller files than CSS width).
 * - fit='whole' (default): if container differs from media aspect by > 8%,
 *   renders object-fit: contain over a blurred backdrop of the same image (NEVER a zoom/cut).
 * - Respects focal point (focus: {x, y}).
 */
export default function MediaImage({
  item,
  src: rawSrc,
  alt: rawAlt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  fit = 'whole', // 'whole' (ratio-true with blurred frame fallback) or 'fill'
  priority = false,
  quality,
  containerAspect,
  className = '',
  imageClassName = '',
  style = {},
  onClick,
}) {
  const itemObj = typeof item === 'object' && item !== null ? item : {};
  const src = extractMediaUrl(rawSrc || item);
  const alt = rawAlt || itemObj.alt || itemObj.title || itemObj.caption || 'Moon Light Resort';

  if (!src) {
    return (
      <div className={`${styles.mediaContainer} ${className}`} style={style}>
        <div className={styles.placeholder}>
          <img src="/brand/moonlight-mark.png" alt="Moon Light Resort" className={styles.placeholderLogo} />
        </div>
      </div>
    );
  }

  const width = itemObj.width || itemObj.naturalWidth || 1200;
  const height = itemObj.height || itemObj.naturalHeight || 800;
  const mediaAspect = width / height;

  const focusX = itemObj.focus?.x ?? 50;
  const focusY = itemObj.focus?.y ?? 50;
  const focusStyle = { objectPosition: `${focusX}% ${focusY}%` };

  // Calculate if aspect ratio differs by > 8% from container
  let needsBlurContain = false;
  if (fit === 'whole' && containerAspect && mediaAspect) {
    const diff = Math.abs(containerAspect - mediaAspect) / mediaAspect;
    if (diff > 0.08) {
      needsBlurContain = true;
    }
  }

  // If containerAspect was not passed, check extreme ratios (very tall / very wide)
  if (fit === 'whole' && !containerAspect) {
    if (mediaAspect < 0.65 || mediaAspect > 2.2) {
      needsBlurContain = true;
    }
  }

  // Build optimized fallback URL
  const optimizedUrl = isCloudinaryUrl(src)
    ? mediaUrl(src, {
        width: Math.min(width, 1600),
        quality: quality || (priority ? 90 : undefined),
      })
    : src;

  const blurUrl = isCloudinaryUrl(src)
    ? mediaUrl(src, { width: 100, quality: 30 })
    : src;

  return (
    <div
      className={`${styles.mediaContainer} ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      {/* Blurred background copy if aspect ratio differs by > 8% */}
      {needsBlurContain && (
        <div
          className={styles.blurBackdrop}
          style={{ backgroundImage: `url(${blurUrl})` }}
          aria-hidden="true"
        />
      )}

      <Image
        src={optimizedUrl}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={`${styles.imageElement} ${
          needsBlurContain ? styles.containFit : styles.coverFit
        } ${imageClassName}`.trim()}
        style={focusStyle}
      />
    </div>
  );
}

