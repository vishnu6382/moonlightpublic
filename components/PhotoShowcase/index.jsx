'use client';

import React, { useRef, useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import Button from '@/components/Button';
import Section from '@/components/Section';
import FadeUp from '@/components/FadeUp';
import SectionHeader from '@/components/SectionHeader';
import MoonPortal from '@/components/MoonPortal';
import { getOptimizedVideoUrl, getOptimizedPosterUrl, getOptimizedImageUrl } from '@/lib/videoOptimizer';
import styles from './PhotoShowcase.module.css';

const Pano360Viewer = dynamic(() => import('@/components/Pano360Viewer'), {
  ssr: false,
});

// Reusable Video item that only plays when in viewport
function ShowcaseVideo({ src, poster, alt = 'Resort video', className = '' }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        const video = videoRef.current;
        if (!video) return;
        if (entry.isIntersecting) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 }
    );

    const el = videoRef.current;
    if (el) observer.observe(el);

    return () => {
      if (el) observer.unobserve(el);
    };
  }, []);

  const optimizedSrc = getOptimizedVideoUrl(src);
  const optimizedPoster = getOptimizedPosterUrl(src, poster);

  return (
    <video
      ref={videoRef}
      src={optimizedSrc}
      poster={optimizedPoster}
      aria-label={alt}
      muted
      loop
      playsInline
      preload="metadata"
      className={`${styles.mediaItem} ${className}`.trim()}
    />
  );
}

// Media renderer for Image or Video
function RenderMediaItem({ item, priority = false }) {
  const [imgSrc, setImgSrc] = useState(() => (item && item.src ? (getOptimizedImageUrl(item.src) || item.src) : ''));

  useEffect(() => {
    if (item && item.src) {
      setImgSrc(getOptimizedImageUrl(item.src) || item.src);
    }
  }, [item?.src]);

  if (!item) return null;

  if (item.type === 'video' && item.src) {
    return (
      <>
        <ShowcaseVideo
          src={item.src}
          poster={item.poster || item.thumbnail}
          alt={item.alt || item.caption}
        />
        <div className={styles.playBadge} aria-hidden="true">&#9654;</div>
      </>
    );
  }

  return (
    <Image
      src={imgSrc || item.src}
      alt={item.alt || item.caption || 'Resort Photo'}
      fill
      priority={priority}
      unoptimized
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className={styles.mediaItem}
      onError={() => {
        if (imgSrc !== item.src && item.src) {
          setImgSrc(item.src);
        }
      }}
    />
  );
}

export default function PhotoShowcase({
  portalItem,
  items = [],
  pills = ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
  allMediaItems = [],
  title = 'Captured Moments of Serenity',
  subtitle = 'Villas, pool and open spaces at Moon Light Resort.',
}) {
  const [is360Open, setIs360Open] = useState(false);

  // Strictly 10 to 15 items on Home page (12 items total)
  const MAX_HOME_GALLERY_ITEMS = 12;

  const allMedia = useMemo(() => {
    const base = Array.isArray(items) ? [...items] : [];
    const usedUrls = new Set(base.map((it) => it.src));

    if (Array.isArray(allMediaItems)) {
      for (const m of allMediaItems) {
        if (base.length >= MAX_HOME_GALLERY_ITEMS) break;
        const url = m.secureUrl || m.src;
        if (url && !usedUrls.has(url)) {
          usedUrls.add(url);
          base.push({
            id: m._id || m.id,
            src: url,
            alt: m.altText || m.title || 'Moon Light Resort',
            caption: m.caption || '',
            type: m.mediaType || (m.isVideo ? 'video' : 'image'),
            isVideo: m.mediaType === 'video' || Boolean(m.isVideo),
            poster: m.posterUrl || '',
          });
        }
      }
    }

    return base.slice(0, MAX_HOME_GALLERY_ITEMS);
  }, [items, allMediaItems]);

  if (!portalItem && allMedia.length === 0) {
    return null;
  }

  // Distribution:
  // Item 0: Hero tile (always a photo)
  // Item 1: Connector Left
  // Item 2: Connector Right
  // Item 3: Left side tile 1
  // Item 4: Right side tile 1 (tall right)
  // Item 5: Left side tile 2 (small bottom-left)
  // Item 6: Right side tile 2 (bottom-centre-right)
  // Items 7+: Extra dense bento below
  const heroItem = allMedia[0] || portalItem;
  const connectorLeftItem = allMedia[1];
  const connectorRightItem = allMedia[2];

  const leftColumnItems = [];
  const rightColumnItems = [];
  const extraItems = [];

  if (allMedia[3]) leftColumnItems.push(allMedia[3]);
  if (allMedia[4]) rightColumnItems.push(allMedia[4]);
  if (allMedia[5]) leftColumnItems.push(allMedia[5]);
  if (allMedia[6]) rightColumnItems.push(allMedia[6]);

  if (allMedia.length > 7) {
    for (let i = 7; i < allMedia.length; i++) {
      extraItems.push(allMedia[i]);
    }
  }

  return (
    <Section id="showcase" spacing="xl" variant="white" className={styles.showcaseSection} data-moon-section="true">
      <FadeUp>
        <SectionHeader
          label="GALLERY PREVIEW"
          title={title}
          subtitle={subtitle}
          align="left"
          divider
        />
      </FadeUp>

      {/* Inside ONE big rounded panel so sides are boxed */}
      <FadeUp delay={120}>
        <div className={styles.panelCard}>
          <div className={styles.portalGrid}>
            {/* Left Column (renders if items exist) */}
            {leftColumnItems.length > 0 && (
              <div className={styles.sideColumn}>
                {leftColumnItems.map((item, idx) => (
                  <div key={item.id || `left-${idx}`} className={styles.sideTile}>
                    <RenderMediaItem item={item} />
                    {item.caption && (
                      <span className={styles.tileCaption}>{item.caption}</span>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Center Portal Block */}
            <div className={styles.centerPortalBlock}>
              {/* Hero Tile: Always a Photo */}
              <div className={styles.heroTile}>
                <RenderMediaItem item={heroItem} priority={false} />
                {heroItem?.caption && (
                  <span className={styles.tileCaption}>{heroItem.caption}</span>
                )}
              </div>

              {/* Crossroads Portal Circle with Bold Readable Text on Clean White Ring */}
              <div className={styles.portalAnchor}>
                <MoonPortal
                  src={portalItem?.src || ''}
                  alt={portalItem?.alt || 'Moon Light Resort Portal'}
                  title={portalItem?.title || (portalItem?.is360 ? 'Tap to explore 360° virtual tour' : 'Moon Light Resort')}
                  is360={Boolean(portalItem?.is360)}
                  ringText={portalItem?.is360 ? `${(portalItem?.roomName || 'RESORT').toUpperCase()} • 360° VIEW • ` : undefined}
                  onClick={portalItem?.is360 ? () => setIs360Open(true) : undefined}
                />
              </div>

              {/* Connector Tiles Row */}
              <div className={styles.connectorRow}>
                <div className={styles.connectorLeft}>
                  {connectorLeftItem ? (
                    <>
                      <RenderMediaItem item={connectorLeftItem} />
                      {connectorLeftItem.caption && (
                        <span className={styles.tileCaption}>{connectorLeftItem.caption}</span>
                      )}
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#EFECE6' }} />
                  )}
                </div>

                <div className={styles.connectorRight}>
                  {connectorRightItem ? (
                    <>
                      <RenderMediaItem item={connectorRightItem} />
                      {connectorRightItem.caption && (
                        <span className={styles.tileCaption}>{connectorRightItem.caption}</span>
                      )}
                    </>
                  ) : (
                    <div style={{ width: '100%', height: '100%', backgroundColor: '#EFECE6' }} />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column (renders if items exist) */}
            {rightColumnItems.length > 0 && (
              <div className={styles.sideColumn}>
                {rightColumnItems.map((item, idx) => (
                  <div key={item.id || `right-${idx}`} className={styles.sideTile}>
                    <RenderMediaItem item={item} />
                    {item.caption && (
                      <span className={styles.tileCaption}>{item.caption}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Continuation as dense bento below for > 7 items */}
          {extraItems.length > 0 && (
            <div className={styles.extraBentoGrid}>
              {extraItems.map((item, idx) => (
                <div key={item.id || `extra-${idx}`} className={styles.extraTile}>
                  <RenderMediaItem item={item} />
                  {item.caption && (
                    <span className={styles.tileCaption}>{item.caption}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Bottom Row: Pills + View Gallery Pill Button */}
          <div className={styles.bottomRow}>
            <div className={styles.pillsList}>
              {pills.map((pill, idx) => (
                <span key={idx} className={styles.pillItem}>
                  <span className={styles.pillDot} />
                  <span>{pill}</span>
                </span>
              ))}
            </div>
            <Button
              href="/gallery"
              variant="outline"
              size="md"
            >
              View Full Gallery &rarr;
            </Button>
          </div>
        </div>
      </FadeUp>

      {/* 360 Viewer Modal */}
      {is360Open && portalItem?.src && (
        <Pano360Viewer
          src={portalItem.panoSrc || portalItem.src}
          roomName={portalItem.roomName || 'Moon Light Resort 360° Virtual Tour'}
          onClose={() => setIs360Open(false)}
        />
      )}
    </Section>
  );
}
