'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Image from 'next/image';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';
import styles from './GalleryClient.module.css';

export default function Lightbox({
  items = [],
  currentIndex = 0,
  isOpen = false,
  onClose,
  onNavigate,
  categories = [],
}) {
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const closeBtnRef = useRef(null);

  const total = items.length;
  const currentItem = items[currentIndex] || null;

  // Preload next image
  useEffect(() => {
    if (!isOpen || total === 0) return;
    const nextIdx = (currentIndex + 1) % total;
    const nextItem = items[nextIdx];
    if (nextItem && nextItem.type !== 'video' && nextItem.src) {
      const img = new window.Image();
      img.src = nextItem.src;
    }
  }, [currentIndex, isOpen, items, total]);

  // Lock body scroll and focus close button on open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      closeBtnRef.current?.focus();
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePrev = useCallback(() => {
    if (total <= 1) return;
    const nextIdx = (currentIndex - 1 + total) % total;
    onNavigate(nextIdx);
  }, [currentIndex, onNavigate, total]);

  const handleNext = useCallback(() => {
    if (total <= 1) return;
    const nextIdx = (currentIndex + 1) % total;
    onNavigate(nextIdx);
  }, [currentIndex, onNavigate, total]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose]);

  // Touch Swipe handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (!isOpen || !currentItem) return null;

  // Resolve Category or Room Name label
  let categoryLabel = '';
  if (currentItem.categoryId === 'rooms') {
    categoryLabel = currentItem.roomName ? `Rooms · ${currentItem.roomName}` : 'Rooms';
  } else {
    const cat = categories.find((c) => c.id === currentItem.categoryId);
    categoryLabel = cat?.name || '';
  }

  return (
    <div
      className={styles.lightboxOverlay}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery Lightbox"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Top Bar: Category badge, Counter, and Close Button */}
      <div className={styles.lightboxTopBar}>
        <div className={styles.lightboxInfo}>
          {categoryLabel && (
            <span className={styles.lightboxBadge}>{categoryLabel}</span>
          )}
          <span className={styles.lightboxCounter}>
            {currentIndex + 1} / {total}
          </span>
        </div>

        <button
          ref={closeBtnRef}
          type="button"
          onClick={onClose}
          className={styles.lightboxCloseBtn}
          aria-label="Close Lightbox"
        >
          <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="2.2" fill="none">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Main Media Stage */}
      <div className={styles.lightboxStage} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        {currentItem.type === 'video' ? (
          <video
            key={currentItem.src}
            src={getOptimizedVideoUrl(currentItem.src, { maxWidth: 1920, quality: 'auto:best' })}
            poster={getOptimizedPosterUrl(currentItem.src, currentItem.poster)}
            controls
            autoPlay
            playsInline
            preload="auto"
            className={styles.lightboxVideo}
          />
        ) : (
          <div className={styles.lightboxImageWrap}>
            <Image
              src={currentItem.src}
              alt={currentItem.alt || currentItem.title || 'Resort Photo'}
              fill
              sizes="100vw"
              className={styles.lightboxImage}
              priority
            />
          </div>
        )}
      </div>

      {/* Previous Arrow Button */}
      {total > 1 && (
        <button
          type="button"
          onClick={handlePrev}
          className={`${styles.lightboxNavBtn} ${styles.lightboxPrevBtn}`}
          aria-label="Previous photo"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
      )}

      {/* Next Arrow Button */}
      {total > 1 && (
        <button
          type="button"
          onClick={handleNext}
          className={`${styles.lightboxNavBtn} ${styles.lightboxNextBtn}`}
          aria-label="Next photo"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" strokeWidth="2.5" fill="none">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      )}

      {/* Bottom Bar: Title & Caption */}
      {(currentItem.title || currentItem.caption) && (
        <div className={styles.lightboxBottomBar}>
          <div className={styles.lightboxCaptionPill}>
            {currentItem.title && <strong>{currentItem.title}</strong>}
            {currentItem.title && currentItem.caption && <span className={styles.captionDot}>•</span>}
            {currentItem.caption && <span>{currentItem.caption}</span>}
          </div>
        </div>
      )}
    </div>
  );
}
