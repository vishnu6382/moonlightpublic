'use client';

import React, { useRef, useEffect } from 'react';
import { extractMediaUrl, mediaUrl, isCloudinaryUrl } from '@/lib/media';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';
import styles from './MediaVideo.module.css';

/**
 * MediaVideo:
 * Single, unified video player component.
 * - Respects true video ratio (portrait video vs landscape video).
 * - Plays only when visible (IntersectionObserver).
 * - preload='none', muted, loop, playsInline.
 * - Generates high-res poster from Cloudinary.
 */
export default function MediaVideo({
  item,
  src: rawSrc,
  poster: rawPoster,
  alt: rawAlt,
  fit = 'whole',
  containerAspect,
  className = '',
  videoClassName = '',
  style = {},
  onClick,
}) {
  const videoRef = useRef(null);
  const itemObj = typeof item === 'object' && item !== null ? item : {};
  const src = extractMediaUrl(rawSrc || item);
  const alt = rawAlt || itemObj.alt || itemObj.title || 'Resort video';

  const width = itemObj.width || itemObj.naturalWidth || 1280;
  const height = itemObj.height || itemObj.naturalHeight || 720;
  const videoAspect = width / height;

  useEffect(() => {
    if (!videoRef.current) return;
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!videoRef.current) return;
        if (entry.isIntersecting) {
          videoRef.current.play().catch(() => {});
        } else {
          videoRef.current.pause();
        }
      },
      { threshold: 0.25 }
    );

    const el = videoRef.current;
    observer.observe(el);
    return () => observer.unobserve(el);
  }, []);

  const optimizedSrc = getOptimizedVideoUrl(src);
  const optimizedPoster = getOptimizedPosterUrl(src, rawPoster || itemObj.poster || itemObj.thumbnail);

  let needsBlurContain = false;
  if (fit === 'whole' && containerAspect && videoAspect) {
    const diff = Math.abs(containerAspect - videoAspect) / videoAspect;
    if (diff > 0.08) {
      needsBlurContain = true;
    }
  }

  const focusX = itemObj.focus?.x ?? 50;
  const focusY = itemObj.focus?.y ?? 50;
  const focusStyle = { objectPosition: `${focusX}% ${focusY}%` };

  return (
    <div
      className={`${styles.videoContainer} ${className}`.trim()}
      style={style}
      onClick={onClick}
    >
      {needsBlurContain && optimizedPoster && (
        <div
          className={styles.blurBackdrop}
          style={{ backgroundImage: `url(${optimizedPoster})` }}
          aria-hidden="true"
        />
      )}

      <video
        ref={videoRef}
        src={optimizedSrc}
        poster={optimizedPoster}
        aria-label={alt}
        muted
        loop
        playsInline
        preload="none"
        className={`${styles.videoElement} ${
          needsBlurContain ? styles.containFit : styles.coverFit
        } ${videoClassName}`.trim()}
        style={focusStyle}
      />

      <div className={styles.videoBadge} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
          <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
        <span>Video</span>
      </div>
    </div>
  );
}

