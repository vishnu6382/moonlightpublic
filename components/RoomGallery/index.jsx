'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import MoonPortal from '@/components/MoonPortal';
import { computeBentoLayout } from '@/components/GalleryClient/bentoEngine';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';
import styles from './RoomGallery.module.css';

/**
 * GalleryMediaItem:
 * - Fits any tile aspect ratio with object-fit: cover and focal point.
 * - If aspect ratio differs by > 35% (or if fitMode === 'contain'), shows
 *   object-fit: contain over a blurred scaled copy so the image is whole.
 * - Handles videos: muted, loop, play only when visible, preload="none", poster.
 */
function GalleryMediaItem({ item, onClick, priority = false, labelPosition = '' }) {
  const videoRef = useRef(null);
  const isVideo = item.type === 'video' || (item.src && item.src.endsWith('.mp4'));

  // Video visibility observer (play only when visible)
  useEffect(() => {
    if (!isVideo || !videoRef.current) return;
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
      { threshold: 0.2 }
    );

    const el = videoRef.current;
    observer.observe(el);
    return () => {
      observer.unobserve(el);
    };
  }, [isVideo]);

  const width = item.width || 1200;
  const height = item.height || 800;
  const aspect = width / height;
  const useContainWithBlur = item.fitMode === 'contain' || aspect > 2.2 || aspect < 0.65;

  const focalX = item.focus?.x ?? 50;
  const focalY = item.focus?.y ?? 45;

  const labelPosClass =
    labelPosition === 'top-left'
      ? styles.captionTopLeft
      : labelPosition === 'top-right'
      ? styles.captionTopRight
      : labelPosition === 'bottom-left'
      ? styles.captionBottomLeft
      : labelPosition === 'bottom-right'
      ? styles.captionBottomRight
      : '';

  return (
    <div
      className={styles.tileWrapper}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-label={`View ${item.caption || item.alt || item.title || 'room media'}`}
      style={{
        '--fx': `${focalX}%`,
        '--fy': `${focalY}%`,
      }}
    >
      {/* Blurred background copy if aspect ratio differs */}
      {useContainWithBlur && (
        <div
          className={styles.blurBackdrop}
          style={{
            backgroundImage: `url(${item.poster || item.src})`,
          }}
          aria-hidden="true"
        />
      )}

      {isVideo ? (
        <>
          <video
            ref={videoRef}
            src={getOptimizedVideoUrl(item.src)}
            poster={getOptimizedPosterUrl(item.src, item.poster)}
            muted
            loop
            playsInline
            preload="metadata"
            aria-label={item.alt || item.caption || item.title}
            className={useContainWithBlur ? styles.containMedia : styles.coverMedia}
          />
          <div className={styles.videoBadge} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </>
      ) : (
        <Image
          src={item.src}
          alt={item.alt || item.caption || item.title || 'Room view'}
          fill
          quality={95}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          priority={priority}
          className={useContainWithBlur ? styles.containMedia : styles.coverMedia}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3Crect width='16' height='10' fill='%23DCD3BF'/%3E%3C/svg%3E"
        />
      )}

      {(item.caption || item.title) && (
        <span className={`${styles.captionTag} ${labelPosClass}`}>
          {item.caption || item.title}
        </span>
      )}
      <div className={styles.tileHoverOverlay} aria-hidden="true" />
    </div>
  );
}

export default function RoomGallery({
  room,
  allMedia = [],
  hasPano360 = false,
  onOpenPortal,
  onOpenLightbox,
}) {
  const containerRef = useRef(null);
  const [windowWidth, setWindowWidth] = useState(1200);
  const [containerWidth, setContainerWidth] = useState(1200);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    handleResize();
    window.addEventListener('resize', handleResize, { passive: true });
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const updateWidth = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) setContainerWidth(w);
      }
    };
    updateWidth();
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w > 0) setContainerWidth(w);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [containerRef]);

  const totalCount = allMedia.length;
  if (totalCount === 0 && !hasPano360) {
    return null;
  }

  const isPhone = windowWidth < 768;
  const numCols = isPhone ? 2 : 12;
  const portalDiameter = isPhone
    ? 132
    : windowWidth < 1024
    ? 150
    : Math.min(180, Math.max(140, Math.round(windowWidth * 0.12)));

  // Build 360 round tile if room has pano
  const round360Tiles = useMemo(() => {
    if (!hasPano360) return [];
    const panoSrc = typeof room?.pano360 === 'string' ? room.pano360 : room?.pano360?.src;
    const previewSrc = typeof room?.pano360 === 'string' ? room.pano360 : (room?.pano360?.previewSrc || panoSrc || room?.mainImage || '');
    return [
      {
        id: `room-360-${room?.slug || 'detail'}`,
        type: '360',
        roomSlug: room?.slug,
        roomName: room?.name,
        title: `${room?.name || 'Room'} · 360`,
        ringText: `${(room?.name || 'ROOM').toUpperCase()} · 360° VIEW • `,
        panoSrc,
        previewSrc,
        fallbackSrc: room?.mainImage || allMedia[0]?.src || '',
        is360: true,
        ratioNotice: room?.pano360?.ratioNotice,
      },
    ];
  }, [hasPano360, room, allMedia]);

  // Compute bento placement using identical shape and 4-tile module rules
  const { placedTiles, placedPortals, maskGradients } = useMemo(() => {
    return computeBentoLayout({
      items: allMedia,
      numCols,
      portalDiameter,
      round360Tiles,
      filterCategory: 'rooms',
      containerWidth,
    });
  }, [allMedia, numCols, portalDiameter, round360Tiles, containerWidth]);

  const maskStyle = useMemo(() => {
    if (!maskGradients || maskGradients.length === 0) return undefined;
    const gradientString = maskGradients.join(', ');
    return {
      WebkitMaskImage: gradientString,
      WebkitMaskComposite: 'source-in',
      maskImage: gradientString,
      maskComposite: 'intersect',
    };
  }, [maskGradients]);

  return (
    <section className={styles.gallerySection} aria-label="Room Media Gallery">
      <h2 className={styles.sectionTitle}>Room Gallery</h2>

      <div className={styles.bentoWrapper} ref={containerRef}>
        {/* Bento Media Tiles with circular notch mask */}
        <div className={styles.bentoContainer} style={maskStyle}>
          {placedTiles.map((tile, tIdx) => {
            const origIdx = tile.itemIdx !== undefined ? tile.itemIdx : tIdx;
            return (
              <div
                key={tile.id}
                className={styles.bentoTile}
                style={{
                  gridColumn: `${tile.colStart} / span ${tile.colSpan}`,
                  gridRow: `${tile.rowStart} / span ${tile.rowSpan}`,
                }}
              >
                <GalleryMediaItem
                  item={tile}
                  onClick={() => onOpenLightbox(origIdx)}
                  priority={false}
                  labelPosition={tile.labelPosition}
                />
              </div>
            );
          })}
        </div>

        {/* Portals Overlay sits ON TOP of the grid and is never clipped by the notch mask */}
        <div className={styles.portalsOverlay}>
          {placedPortals.map((portal) => (
            <div
              key={portal.id}
              className={styles.roundPortalAnchor}
              style={{
                left: portal.xCss,
                top: `${portal.yPx}px`,
              }}
            >
              <MoonPortal
                src={portal.previewSrc || portal.fallbackSrc}
                alt={portal.title}
                title={portal.title}
                is360={portal.is360}
                ringText={portal.ringText}
                size={portal.diameter}
                onClick={portal.is360 ? onOpenPortal : undefined}
                showHint={portal.is360}
                ratioNotice={portal.ratioNotice}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
