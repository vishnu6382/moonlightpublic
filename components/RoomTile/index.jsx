'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './RoomTile.module.css';

export default function RoomTile({
  room,
  className = '',
  priority = false,
  aspectRatio,
}) {
  const imageSrc = room ? (room.mainImage || room.image || (room.photos && room.photos[0]?.src)) : '';
  const subLabel = room ? (room.subLabel || room.roomType || '') : '';
  const [currentSrc, setCurrentSrc] = React.useState(imageSrc);

  React.useEffect(() => {
    if (imageSrc) {
      setCurrentSrc(imageSrc);
    }
  }, [imageSrc]);

  if (!room) return null;

  return (
    <Link
      href={`/rooms/${room.slug}`}
      className={`${styles.roomCard} ${className}`.trim()}
      style={aspectRatio ? { aspectRatio } : undefined}
      aria-label={`View details for ${room.name}`}
    >
      {currentSrc ? (
        <Image
          src={currentSrc}
          alt={room.name}
          fill
          priority={priority}
          unoptimized
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 60vw, 50vw"
          className={styles.roomImage}
          onError={() => {
            const raw = room.photos?.[0]?.src || room.image;
            if (raw && currentSrc !== raw) {
              setCurrentSrc(raw);
            }
          }}
        />
      ) : (
        <div className={styles.fallbackBg}>
          <img
            src="/brand/moonlight-mark.png"
            alt="Moon Light Resort"
            className={styles.placeholderLogo}
          />
        </div>
      )}

      {/* Soft Bottom Gradient */}
      <div className={styles.gradientOverlay} />

      {/* Content directly on photo: no solid white bar */}
      <div className={styles.cardContent}>
        <div className={styles.roomInfo}>
          <span className={styles.roomName}>{room.name}</span>
          {subLabel && (
            <span className={styles.roomSubLabel}>{subLabel}</span>
          )}
        </div>

        <div className={styles.arrowButton} aria-hidden="true">
          <svg className={styles.arrowIcon} viewBox="0 0 24 24">
            <path
              d="M5 12h14M12 5l7 7-7 7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
        </div>
      </div>
    </Link>
  );
}
