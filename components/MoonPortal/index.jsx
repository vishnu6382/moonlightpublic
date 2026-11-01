'use client';

import React from 'react';
import Image from 'next/image';
import styles from './MoonPortal.module.css';

export default function MoonPortal({
  src,
  alt = 'Moon Light Resort Portal',
  title = '',
  is360 = false,
  ringText,
  size,
  className = '',
  onClick,
  showHint = false,
  ratioNotice,
}) {
  const [interacted, setInteracted] = React.useState(false);
  const has360Photo = Boolean(is360 && src);
  const isClickable = Boolean(has360Photo && onClick);

  // Text: "360° VIEW · MOON LIGHT RESORT •" once around the ring when has360Photo is true
  const defaultRingText = has360Photo
    ? '360° VIEW · MOON LIGHT RESORT • '
    : 'MOON LIGHT RESORT • ';

  const activeRingText = ringText || defaultRingText;

  const dynamicStyle = size
    ? {
        '--portal-d': typeof size === 'number' ? `${size}px` : size,
        width: typeof size === 'number' ? `${size}px` : size,
        height: typeof size === 'number' ? `${size}px` : size,
      }
    : undefined;

  const uniqueId = React.useId ? React.useId().replace(/[^a-zA-Z0-9-_]/g, '') : 'portal';
  const pathId = `moonPortalCirclePath_${uniqueId}`;

  const handleClick = (e) => {
    setInteracted(true);
    if (onClick) onClick(e);
  };

  const handlePreload = () => {
    if (has360Photo && activeSrc) {
      try {
        const img = new window.Image();
        img.src = activeSrc;
        import('@/components/Pano360Viewer');
      } catch (_) {}
    }
  };

  const activeSrc = src || '';

  return (
    <div
      className={`${styles.portalWrapper} ${isClickable ? styles.clickable : styles.static} ${className}`.trim()}
      style={dynamicStyle}
      onClick={isClickable ? handleClick : () => setInteracted(true)}
      onPointerEnter={isClickable ? handlePreload : undefined}
      onTouchStart={isClickable ? handlePreload : undefined}
      title={isClickable ? (title || 'Tap to explore 360° view') : undefined}
      role={isClickable ? 'button' : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClick(e);
              }
            }
          : undefined
      }
      aria-label={isClickable ? (title || 'Open 360 degree panoramic view') : 'Moon Light Resort emblem'}
    >
      {/* Thin White Ring Track */}
      <div className={styles.ringTrack} aria-hidden="true" />

      {/* Rotating SVG text ring (radius = 55 in 144 viewBox) */}
      <svg
        className={styles.rotatingRing}
        viewBox="0 0 144 144"
        aria-hidden="true"
      >
        <defs>
          <path
            id={pathId}
            d="M 72, 72 m 0, -55 a 55,55 0 1,1 0,110 a 55,55 0 1,1 0,-110"
          />
        </defs>
        <text
          className={`${styles.ringText} ${is360 ? styles.ringText360 : ''}`.trim()}
          dominantBaseline="central"
          fill="#1F1B16"
          fontWeight="900"
        >
          <textPath
            href={`#${pathId}`}
            startOffset="0%"
            textLength="345.58"
            lengthAdjust="spacing"
          >
            {activeRingText}
          </textPath>
        </text>
      </svg>

      {/* Center Portal Circle with CSS background drift (never blank white) */}
      <div className={styles.portalCircle}>
        {has360Photo ? (
          <div
            className={styles.portalPanoDrift}
            style={{
              backgroundImage: `url(${activeSrc})`,
            }}
            role="img"
            aria-label={alt || 'Room 360 panorama preview'}
          />
        ) : (
          <div className={styles.logoMarkWrap}>
            <Image
              src="/brand/moonlight-mark.png"
              alt="Moon Light Resort emblem"
              width={80}
              height={80}
              className={styles.logoMarkImg}
            />
          </div>
        )}
      </div>

      {/* Tiny 360 hint pill below circle (fades after interaction) */}
      {is360 && (showHint || isClickable) && !interacted && (
        <div className={styles.hintPill} aria-hidden="true">
          <span>Tap to explore 360</span>
        </div>
      )}

      {/* Visible ratio warning notice if 360 demo is not 2:1 */}
      {ratioNotice && (
        <div className={styles.ratioNoticePill} aria-live="polite">
          <span>{ratioNotice}</span>
        </div>
      )}
    </div>
  );
}
