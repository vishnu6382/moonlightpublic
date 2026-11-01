'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import styles from './GalleryClient.module.css';
import CrescentMoonDecoration from './CrescentMoonDecoration';
import Lightbox from './Lightbox';
import MoonPortal from '@/components/MoonPortal';
import SectionBackdrop from '@/components/SectionBackdrop';
import { computeBentoLayout } from './bentoEngine';
import { getOptimizedVideoUrl, getOptimizedPosterUrl, getOptimizedImageUrl } from '@/lib/videoOptimizer';

// Dynamically import 360 Viewer on demand
const Pano360Viewer = dynamic(() => import('@/components/Pano360Viewer'), {
  ssr: false,
});

export default function GalleryClient({
  initialItems = [],
  categories = [],
  rooms = [],
  round360Tiles = [],
}) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState('all');
  const [visibleCount, setVisibleCount] = useState(24);
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [active360, setActive360] = useState(null);
  const [windowWidth, setWindowWidth] = useState(1200);

  const sentinelRef = useRef(null);
  const containerRef = useRef(null);
  const videoRefs = useRef({});
  const lastClickedTileRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(1200);

  // Track window resize and container measurement
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

  const isPhone = windowWidth <= 900;
  const numCols = isPhone ? 2 : 12;
  const portalDiameter = isPhone
    ? 132
    : windowWidth < 1024
    ? 150
    : Math.min(180, Math.max(140, Math.round(windowWidth * 0.12)));

  // Filter items by category & room
  const filteredItems = useMemo(() => {
    return initialItems.filter((item) => {
      if (selectedCategory === 'all') return true;
      if (selectedCategory === 'rooms') {
        if (selectedRoom === 'all') return item.categoryId === 'rooms';
        return item.categoryId === 'rooms' && item.roomSlug === selectedRoom;
      }
      return item.categoryId === selectedCategory;
    });
  }, [initialItems, selectedCategory, selectedRoom]);

  // Reset pagination when category changes
  const handleCategoryChange = useCallback((catId) => {
    setSelectedCategory(catId);
    setSelectedRoom('all');
    setVisibleCount(24);
  }, []);

  const handleRoomChange = useCallback((roomSlug) => {
    setSelectedRoom(roomSlug);
    setVisibleCount(24);
  }, []);

  // Filtered 360 round tiles
  const relevant360Tiles = useMemo(() => {
    if (selectedCategory === 'all') return round360Tiles;
    if (selectedCategory === 'rooms') {
      if (selectedRoom === 'all') return round360Tiles;
      return round360Tiles.filter((t) => t.roomSlug === selectedRoom);
    }
    return []; // No 360 tiles in non-room categories (like Turf or Swimming Pool)
  }, [round360Tiles, selectedCategory, selectedRoom]);

  // Compute Bento Grid Placements
  const visibleItems = useMemo(() => {
    return filteredItems.slice(0, visibleCount);
  }, [filteredItems, visibleCount]);

  const { placedTiles, placedPortals, totalRows, maskGradients } = useMemo(() => {
    return computeBentoLayout({
      items: visibleItems,
      numCols,
      portalDiameter,
      round360Tiles: relevant360Tiles,
      filterCategory: selectedCategory,
      containerWidth,
    });
  }, [visibleItems, numCols, portalDiameter, relevant360Tiles, selectedCategory, containerWidth]);

  // Special Categories for top Category Showcase
  const specialsWithMedia = useMemo(() => {
    return categories.filter((c) => c.id !== 'all' && c.count > 0).slice(0, 8);
  }, [categories]);

  const featured360 = round360Tiles && round360Tiles.length > 0 ? round360Tiles[0] : null;

  // Idle warmup for 360 viewer chunk & primary 360 texture
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const warmup = () => {
        import('@/components/Pano360Viewer');
        if (featured360 && (featured360.panoSrc || featured360.src)) {
          const img = new window.Image();
          img.src = featured360.panoSrc || featured360.src;
        }
      };
      if ('requestIdleCallback' in window) {
        window.requestIdleCallback(warmup);
      } else {
        setTimeout(warmup, 1200);
      }
    }
  }, [featured360]);

  // IntersectionObserver for infinite scrolling / load more with 600px root margin
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredItems.length) {
          setVisibleCount((prev) => Math.min(prev + 24, filteredItems.length));
        }
      },
      { rootMargin: '600px' }
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [filteredItems.length, visibleCount]);

  // Open Lightbox
  const handleOpenLightbox = (tileIndex, e) => {
    lastClickedTileRef.current = e?.currentTarget;
    setLightboxIndex(tileIndex);
  };

  // Close Lightbox & restore focus
  const handleCloseLightbox = () => {
    setLightboxIndex(null);
    setTimeout(() => {
      lastClickedTileRef.current?.focus();
    }, 50);
  };

  // Open 360 Viewer
  const handleOpen360 = (portal) => {
    setActive360({
      src: portal.panoSrc || portal.src,
      roomName: portal.roomName || 'Resort 360° Virtual Tour',
    });
  };

  // Close 360 Viewer
  const handleClose360 = () => {
    setActive360(null);
  };

  // Smooth scroll to grid
  const scrollToGrid = (catId) => {
    handleCategoryChange(catId);
    const gridEl = document.getElementById('gallery-grid');
    if (gridEl) {
      gridEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Construct concave notch mask style
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
    <main className={styles.galleryPage}>
      {/* Background Decorative Rings in empty side area */}
      <SectionBackdrop align="right" hideOnMobile={true} />

      <div className={styles.galleryContainer}>
        {/* 1. Header Section */}
        <header className={styles.headerSection}>
          <h1 className={styles.headerTitle}>Gallery</h1>

          {/* Faint crescent decoration beside header (desktop) */}
          <CrescentMoonDecoration className={styles.headerDecoration} />
        </header>

        {/* 2. Top Category Showcase Cards */}
        {specialsWithMedia.length > 0 && (
          <section className={styles.specialsSection} aria-label="Explore Categories">
            <div className={styles.specialsHeadingRow}>
              <div>
                <h2 className={styles.specialsTitle}>Explore by Category</h2>
                <span className={styles.specialsSubtitle}>
                  {specialsWithMedia.length} Curated Collections
                </span>
              </div>
            </div>

            <div className={styles.specialsGrid}>
              {specialsWithMedia.map((cat) => {
                const isActive = selectedCategory === cat.id;

                return (
                  <div key={cat.id} className={styles.specialCardWrapper}>
                    <button
                      type="button"
                      onClick={() => handleCategoryChange(isActive ? 'all' : cat.id)}
                      className={`${styles.specialCard} ${isActive ? styles.specialCardActive : ''}`.trim()}
                      aria-label={`Filter by ${cat.name}`}
                      aria-pressed={isActive}
                    >
                      {cat.coverImage && (
                        <Image
                          src={cat.coverImage}
                          alt={cat.name}
                          fill
                          sizes="(max-width: 768px) 100vw, 33vw"
                          className={styles.specialCardImage}
                        />
                      )}
                      <div className={styles.specialCardOverlay} />
                      <div className={styles.specialCardContent}>
                        <div className={`${styles.specialCardPill} ${isActive ? styles.specialCardPillActive : ''}`.trim()}>
                          <h3 className={styles.specialCardName}>{cat.name}</h3>
                          <span className={styles.specialCardCount}>
                            {cat.count} {cat.count === 1 ? 'Photo' : 'Photos'}
                          </span>
                        </div>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 3. Sticky Filter Pills Row */}
        <div id="gallery-grid" className={styles.filterStickyWrapper}>
          <div className={styles.filterScrollRow} role="tablist" aria-label="Gallery Categories">
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => handleCategoryChange(cat.id)}
                  className={`${styles.filterPill} ${isActive ? styles.filterPillActive : ''}`}
                >
                  <span>{cat.name}</span>
                  <span className={styles.pillBadge}>{cat.count}</span>
                </button>
              );
            })}
          </div>

          {/* Secondary Room Filter Pills (when Rooms is active) */}
          {selectedCategory === 'rooms' && rooms.length > 0 && (
            <div className={styles.roomSubFilterRow} role="tablist" aria-label="Room Filter">
              <button
                type="button"
                role="tab"
                aria-selected={selectedRoom === 'all'}
                onClick={() => handleRoomChange('all')}
                className={`${styles.roomSubPill} ${
                  selectedRoom === 'all' ? styles.roomSubPillActive : ''
                }`}
              >
                All Rooms
              </button>
              {rooms.map((rm) => {
                const isActive = selectedRoom === rm.slug;
                return (
                  <button
                    key={rm.slug}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleRoomChange(rm.slug)}
                    className={`${styles.roomSubPill} ${isActive ? styles.roomSubPillActive : ''}`}
                  >
                    <span>{rm.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Bento Gallery Grid */}
        {placedTiles.length > 0 ? (
          <div className={styles.bentoWrapper} ref={containerRef}>
            {/* Bento Media Tiles with circular notch mask */}
            <div
              className={styles.bentoContainer}
              style={maskStyle}
            >
              {placedTiles.map((tile, tIdx) => {
                const isVideo = tile.type === 'video';
                const labelPosClass =
                  tile.labelPosition === 'top-left'
                    ? styles.captionTopLeft
                    : tile.labelPosition === 'top-right'
                    ? styles.captionTopRight
                    : tile.labelPosition === 'bottom-left'
                    ? styles.captionBottomLeft
                    : tile.labelPosition === 'bottom-right'
                    ? styles.captionBottomRight
                    : '';

                return (
                  <button
                    key={tile.id}
                    type="button"
                    onClick={(e) => handleOpenLightbox(tIdx, e)}
                    className={styles.bentoTile}
                    style={{
                      gridColumn: `${tile.colStart} / span ${tile.colSpan}`,
                      gridRow: `${tile.rowStart} / span ${tile.rowSpan}`,
                    }}
                    aria-label={`Open photo ${tile.title || tile.alt}`}
                  >
                    {isVideo ? (
                      <>
                        <video
                          ref={(el) => {
                            if (el) videoRefs.current[tile.id] = el;
                            else delete videoRefs.current[tile.id];
                          }}
                          src={getOptimizedVideoUrl(tile.src, { maxWidth: 640 })}
                          poster={getOptimizedPosterUrl(tile.src, tile.poster)}
                          muted
                          loop
                          playsInline
                          preload="none"
                          onMouseEnter={(e) => {
                            e.currentTarget.play().catch(() => {});
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                          className={styles.gridVideo}
                        />
                        <div className={styles.videoBadge}>
                          <svg viewBox="0 0 24 24" fill="currentColor" width="12" height="12">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>Video</span>
                        </div>
                      </>
                    ) : (
                      <Image
                        src={getOptimizedImageUrl(tile.src)}
                        alt={tile.alt || tile.title || 'Resort Photo'}
                        fill
                        unoptimized
                        sizes={tile.colSpan >= 8 ? '100vw' : tile.colSpan >= 6 ? '(max-width: 900px) 100vw, 60vw' : '(max-width: 900px) 50vw, 40vw'}
                        className={styles.tileMedia}
                        loading={tIdx < 6 ? 'eager' : 'lazy'}
                        placeholder="blur"
                        blurDataURL="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 10'%3E%3Crect width='16' height='10' fill='%23DCD3BF'/%3E%3C/svg%3E"
                      />
                    )}

                    {/* Frosted White Caption Pill */}
                    {(tile.title || tile.caption) && (
                      <span className={`${styles.tileCaptionPill} ${labelPosClass}`}>
                        {tile.title || tile.caption}
                      </span>
                    )}
                  </button>
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
                    onClick={portal.is360 ? () => handleOpen360(portal) : undefined}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Empty State (when no media exists) */
          <div className={styles.emptyState}>
            <h2 className={styles.emptyStateTitle}>No photos yet.</h2>
            <p className={styles.emptyStateText}>
              Photos and 360° views will appear here once uploaded.
            </p>
          </div>
        )}

        {/* 5. Performance / Show More Button */}
        {filteredItems.length > visibleCount && (
          <div className={styles.showMoreSection}>
            <button
              type="button"
              onClick={() =>
                setVisibleCount((prev) => Math.min(prev + 24, filteredItems.length))
              }
              className={styles.showMoreBtn}
            >
              <span>Show More Photos</span>
              <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.2" fill="none">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            <span className={styles.showingCounter}>
              Showing {visibleCount} of {filteredItems.length} media
            </span>
            <div ref={sentinelRef} style={{ height: '1px' }} />
          </div>
        )}
      </div>

      {/* 6. Lightbox Fullscreen Modal */}
      {lightboxIndex !== null && (
        <Lightbox
          items={filteredItems}
          currentIndex={lightboxIndex}
          isOpen={lightboxIndex !== null}
          onClose={handleCloseLightbox}
          onNavigate={(newIdx) => setLightboxIndex(newIdx)}
          categories={categories}
        />
      )}

      {/* 7. 360 Degree Viewer Panel */}
      {active360 && (
        <Pano360Viewer
          src={active360.src}
          roomName={active360.roomName}
          onClose={handleClose360}
        />
      )}
    </main>
  );
}
