'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';
import { cleanMediaCaption } from '@/lib/media';
import styles from './MediaLightbox.module.css';

export default function MediaLightbox({
  media = [],
  initialIndex = 0,
  onClose,
}) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState(0);

  const total = media.length;
  const currentItem = media[currentIndex] || null;

  const handlePrev = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : total - 1));
  }, [total]);

  const handleNext = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev < total - 1 ? prev + 1 : 0));
  }, [total]);

  // Lock body scroll and key listeners
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, handlePrev, handleNext]);

  // Touch swipe support
  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    if (diff > 50) {
      handleNext();
    } else if (diff < -50) {
      handlePrev();
    }
  };

  if (!currentItem) return null;

  const isVideo = !!currentItem.src && (currentItem.type === 'video' || currentItem.src.endsWith('.mp4') || !!currentItem.poster);

  return (
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Room Media Lightbox"
    >
      <div
        className={styles.modalContent}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={styles.closeBtn}
          aria-label="Close Lightbox"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Counter Badge */}
        {total > 1 && (
          <div className={styles.counterBadge}>
            {currentIndex + 1} / {total}
          </div>
        )}

        {/* Media Frame */}
        <div className={styles.mediaStage}>
          {isVideo ? (
            <video
              key={currentItem.src}
              src={getOptimizedVideoUrl(currentItem.src, { maxWidth: 1920, quality: 'auto:best' })}
              poster={getOptimizedPosterUrl(currentItem.src, currentItem.poster)}
              controls
              autoPlay
              playsInline
              preload="auto"
              className={styles.videoPlayer}
            />
          ) : (
            <div className={styles.imageWrapper}>
              <Image
                src={currentItem.src}
                alt={currentItem.alt || currentItem.caption || 'Room photo'}
                fill
                sizes="90vw"
                className={styles.lightboxImage}
                priority
              />
            </div>
          )}
        </div>

        {/* Caption */}
        {cleanMediaCaption(currentItem.caption || currentItem.title) && (
          <div className={styles.captionBar}>
            <p>{cleanMediaCaption(currentItem.caption || currentItem.title)}</p>
          </div>
        )}

        {/* Nav Arrows */}
        {total > 1 && (
          <>
            <button
              type="button"
              onClick={handlePrev}
              className={`${styles.navBtn} ${styles.prevBtn}`}
              aria-label="Previous Media"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              type="button"
              onClick={handleNext}
              className={`${styles.navBtn} ${styles.nextBtn}`}
              aria-label="Next Media"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
