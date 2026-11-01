'use client';

import React, { useEffect, useState } from 'react';
import PlaceDetailCard from './PlaceDetailCard';
import styles from './RegionExplorer.module.css';

export default function BottomSheet({ isOpen, place, onClose, onReplayRoute }) {
  const [touchStartY, setTouchStartY] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen || !place) return null;

  const handleReplay = () => {
    onReplayRoute?.();
    onClose?.();
  };

  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e) => {
    const touchEndY = e.changedTouches[0].clientY;
    if (touchEndY - touchStartY > 60) {
      // Swiped down
      onClose?.();
    }
  };

  return (
    <div className={styles.bottomSheetBackdrop} onClick={onClose} aria-modal="true" role="dialog">
      <div
        className={styles.bottomSheetContainer}
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className={styles.sheetHandleBar}>
          <div className={styles.sheetHandle} />
        </div>
        <div className={styles.sheetContent}>
          <PlaceDetailCard
            place={place}
            onClearSelection={onClose}
            onReplayRoute={handleReplay}
          />
        </div>
      </div>
    </div>
  );
}
