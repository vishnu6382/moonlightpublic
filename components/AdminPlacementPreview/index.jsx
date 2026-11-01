'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { getOrientationTag, calculateCropPercent, mediaUrl } from '@/lib/media';
import { layoutRows } from '@/lib/justifiedLayout';
import { getOptimizedPosterUrl } from '@/lib/videoOptimizer';
import styles from './AdminPlacementPreview.module.css';

/**
 * Fit Badge component:
 * - Green "Fits well" (crop < 4%)
 * - Yellow "Slight crop X%" (4-8%)
 * - Red "Poor fit" (> 8%)
 */
export function FitBadge({ cropPercent, className = '' }) {
  const crop = Math.round(cropPercent || 0);
  if (crop <= 4) {
    return (
      <span
        className={`${styles.fitBadge} ${styles.fitWell} ${className}`}
        title={`Aspect ratio closely matches tile slot (${crop}% crop). Entire subject is sharp and visible.`}
      >
        <span className={styles.dot} /> Fits well ({crop}%)
      </span>
    );
  }
  if (crop <= 8) {
    return (
      <span
        className={`${styles.fitBadge} ${styles.fitSlight} ${className}`}
        title={`Mild edge crop (${crop}%). Safe for standard compositions.`}
      >
        <span className={styles.dot} /> Slight crop {crop}%
      </span>
    );
  }
  return (
    <span
      className={`${styles.fitBadge} ${styles.fitPoor} ${className}`}
      title={`High aspect mismatch (${crop}%). Displayed with blurred letterbox frame to prevent cutting key details.`}
    >
      <span className={styles.dot} /> Poor fit ({crop}%)
    </span>
  );
}

/**
 * Orientation Badge component:
 * Portrait / Landscape / Square / Wide video / Tall video
 */
export function OrientationBadge({ width, height, isVideo, className = '' }) {
  const tag = getOrientationTag(width, height, isVideo);
  const isTall = tag.includes('Portrait') || tag.includes('Tall');
  const isWide = tag.includes('Landscape') || tag.includes('Wide');
  return (
    <span
      className={`${styles.orientationBadge} ${
        isTall ? styles.tagPortrait : isWide ? styles.tagLandscape : styles.tagSquare
      } ${className}`}
    >
      {tag}
    </span>
  );
}

/**
 * AdminPlacementPreview
 * Dual-viewport live preview (Desktop 1440px & Mobile 390px)
 * Uses the exact justified-rows layout engine shared with the public site.
 */
export default function AdminPlacementPreview({
  items = [],
  title = 'Live Placement Preview',
  roomName = 'Room',
  hasPano360 = false,
  panoPreviewSrc = '',
  onItemClick,
  onUpdateFocus,
  onUpdateDisplayAs,
}) {
  const [activeTab, setActiveTab] = useState('both'); // 'both', 'desktop', 'mobile'
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [viewHeightMode, setViewHeightMode] = useState('window'); // 'window' (capped 520px with smooth scroll) | 'full' (expanded)
  const [selectedIdx, setSelectedIdx] = useState(null);
  const [measuredDims, setMeasuredDims] = useState({});

  const desktopFrameRef = useRef(null);
  const mobileFrameRef = useRef(null);
  const [desktopFrameWidth, setDesktopFrameWidth] = useState(800);
  const [mobileFrameWidth, setMobileFrameWidth] = useState(340);

  // Measure container widths with ResizeObserver
  useEffect(() => {
    const updateWidths = () => {
      if (desktopFrameRef.current) {
        const w = desktopFrameRef.current.clientWidth;
        if (w > 0) setDesktopFrameWidth(w);
      }
      if (mobileFrameRef.current) {
        const w = mobileFrameRef.current.clientWidth;
        if (w > 0) setMobileFrameWidth(w);
      }
    };
    updateWidths();

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.target === desktopFrameRef.current) {
          if (entry.contentRect.width > 0) setDesktopFrameWidth(entry.contentRect.width);
        } else if (entry.target === mobileFrameRef.current) {
          if (entry.contentRect.width > 0) setMobileFrameWidth(entry.contentRect.width);
        }
      }
    });

    if (desktopFrameRef.current) ro.observe(desktopFrameRef.current);
    if (mobileFrameRef.current) ro.observe(mobileFrameRef.current);
    return () => ro.disconnect();
  }, [activeTab]);

  // Dynamically measure any item missing width or height so layout doesn't break
  useEffect(() => {
    (items || []).forEach((it) => {
      const itId = it._id || it.id || it.src;
      const hasDims = (it.width && it.height && it.width > 0 && it.height > 0) || measuredDims[itId];
      if (!hasDims && it.src && !it.isVideo && typeof window !== 'undefined') {
        const img = new window.Image();
        img.src = it.src;
        img.onload = () => {
          if (img.naturalWidth > 0 && img.naturalHeight > 0) {
            setMeasuredDims((prev) => ({
              ...prev,
              [itId]: { width: img.naturalWidth, height: img.naturalHeight },
            }));
            // Update backend record if it has _id
            if (it._id) {
              fetch(`/api/admin/media/${it._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ width: img.naturalWidth, height: img.naturalHeight }),
              }).catch(() => {});
            }
          }
        };
      }
    });
  }, [items, measuredDims]);

  // Separate flat items from 360 items (360 items are NEVER flat tiles in justified rows)
  const { flatItems, pano360Items } = useMemo(() => {
    const flat = [];
    const panos = [];

    (items || []).forEach((it, idx) => {
      const itId = it._id || it.id || it.src;
      const mDim = measuredDims[itId];
      const w = mDim?.width || it.width || 1200;
      const h = mDim?.height || it.height || 800;
      const ar = w / h;

      const is360 = Boolean(
        it.is360 ||
        it.mediaType === 'pano360' ||
        (w && h && ar >= 1.9 && ar <= 2.1 && (it.mediaType === 'pano360' || (it.title && String(it.title).toLowerCase().includes('360'))))
      );

      if (is360) {
        panos.push({
          ...it,
          id: itId,
          itemIdx: idx,
          is360: true,
          width: w,
          height: h,
          aspect: ar,
          title: it.title || `${roomName} · 360`,
        });
      } else {
        flat.push({
          ...it,
          id: itId,
          itemIdx: idx,
          width: w,
          height: h,
          aspect: ar,
        });
      }
    });

    return { flatItems: flat, pano360Items: panos };
  }, [items, measuredDims, roomName]);

  // Round 360 portal tiles for layout
  const roundTilesForLayout = useMemo(() => {
    const list = [...pano360Items];
    if (hasPano360 && panoPreviewSrc && list.length === 0) {
      list.push({
        id: `room-360-${roomName}`,
        src: panoPreviewSrc,
        title: `${roomName} · 360`,
        is360: true,
      });
    }
    return list.map((p, pIdx) => ({
      id: `360-${p.id || pIdx}`,
      type: '360',
      title: p.title || `${roomName} · 360`,
      ringText: `${(p.title || roomName).toUpperCase()} · 360° VIEW • `,
      panoSrc: p.src || panoPreviewSrc,
      previewSrc: p.previewSrc || p.src || panoPreviewSrc,
      fallbackSrc: p.src || panoPreviewSrc,
      is360: true,
    }));
  }, [pano360Items, hasPano360, panoPreviewSrc, roomName]);

  // Normalize flat media items with dimensions and aspect ratios
  const normalizedItems = useMemo(() => {
    return flatItems.map((it, idx) => {
      const isVideo = it.mediaType === 'video' || it.type === 'video' || (it.src && it.src.endsWith('.mp4'));
      let w = it.width || 1200;
      let h = it.height || 800;

      // Honor displayAs override if present
      if (it.displayAs === 'portrait' && w > h) {
        w = 900;
        h = 1200;
      } else if (it.displayAs === 'landscape' && h > w) {
        w = 1200;
        h = 900;
      } else if (it.displayAs === 'square') {
        w = 1000;
        h = 1000;
      }

      return {
        ...it,
        id: it.id || `item-${idx}`,
        itemIdx: it.itemIdx !== undefined ? it.itemIdx : idx,
        isVideo,
        width: w,
        height: h,
        aspect: w / h,
        focus: it.focus || { x: 50, y: 50 },
      };
    });
  }, [flatItems]);

  // Compute Layout for Desktop (1440px container, max 4/row)
  const desktopLayout = useMemo(() => {
    if (normalizedItems.length === 0 && roundTilesForLayout.length === 0) return null;
    return layoutRows(normalizedItems, {
      containerWidth: 1440,
      targetRowHeight: 340,
      minRowHeight: 280,
      maxRowHeight: 440,
      maxItemsPerRow: 4,
      gap: 12,
      round360Tiles: roundTilesForLayout,
      portalDiameter: 160,
    });
  }, [normalizedItems, roundTilesForLayout]);

  // Compute Layout for Phone (390px container, 2/row)
  const phoneLayout = useMemo(() => {
    if (normalizedItems.length === 0 && roundTilesForLayout.length === 0) return null;
    return layoutRows(normalizedItems, {
      containerWidth: 390,
      targetRowHeight: 220,
      minRowHeight: 170,
      maxRowHeight: 300,
      maxItemsPerRow: 2,
      gap: 10,
      round360Tiles: roundTilesForLayout,
      portalDiameter: 132,
    });
  }, [normalizedItems, roundTilesForLayout]);

  // Guidance line computation
  const guidance = useMemo(() => {
    const total = normalizedItems.length;
    if (total === 0) return 'No media items added yet. Upload photos or videos to see layout preview.';

    let portraits = 0;
    let landscapes = 0;
    let squares = 0;
    let videos = 0;

    normalizedItems.forEach((it) => {
      if (it.isVideo) videos++;
      else if (it.aspect < 0.85) portraits++;
      else if (it.aspect > 1.15) landscapes++;
      else squares++;
    });

    const parts = [];
    if (portraits > 0) parts.push(`${portraits} portrait`);
    if (landscapes > 0) parts.push(`${landscapes} landscape`);
    if (squares > 0) parts.push(`${squares} square`);
    if (videos > 0) parts.push(`${videos} video`);

    const composition = parts.join(', ');
    const isBalanced = total % 2 === 0 || total >= 4;
    const balanceTip = isBalanced
      ? 'The last row is balanced across phone and desktop.'
      : 'Tip: Adding 1 more photo will create a perfectly balanced final row.';

    return `${total} items (${composition}). ${balanceTip}`;
  }, [normalizedItems]);

  // Handle focal point click
  const handleFocalClick = (idx, e) => {
    if (!onUpdateFocus) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    const percentX = Math.round((clickX / rect.width) * 100);
    const percentY = Math.round((clickY / rect.height) * 100);
    onUpdateFocus(idx, { x: percentX, y: percentY });
  };

  const desktopScale = desktopFrameWidth / 1440;
  const phoneScale = mobileFrameWidth / 390;
  const scaledDesktopHeight = desktopLayout
    ? Math.round((desktopLayout.totalHeight || 400) * desktopScale)
    : 240;
  const scaledPhoneHeight = phoneLayout
    ? Math.round((phoneLayout.totalHeight || 400) * phoneScale)
    : 240;

  if (items.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <div className={styles.emptyIcon}>📐</div>
        <h4 className={styles.emptyTitle}>Live Placement Preview</h4>
        <p className={styles.emptyDesc}>
          Upload photos or videos above to see how they will arrange on Desktop and Mobile.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.previewCard}>
      {/* Header with Viewport Switcher */}
      <div className={styles.cardHeader}>
        <div className={styles.headerLeft}>
          <h3 className={styles.headerTitle}>{title}</h3>
          <span className={styles.itemCountBadge}>{items.length} tiles</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={styles.collapseBtn}
            onClick={() => setIsCollapsed((prev) => !prev)}
            title={isCollapsed ? 'Expand preview panel' : 'Collapse preview panel'}
          >
            <span>{isCollapsed ? '▼ Show Preview' : '▲ Collapse Preview'}</span>
          </button>

          {!isCollapsed && (
            <>
              <div className={styles.heightToggle}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${viewHeightMode === 'window' ? styles.tabActive : ''}`}
                  onClick={() => setViewHeightMode('window')}
                  title="Scrollable 540px window for smooth editing"
                >
                  Smooth Scroll Window
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${viewHeightMode === 'full' ? styles.tabActive : ''}`}
                  onClick={() => setViewHeightMode('full')}
                  title="Expand entire height"
                >
                  Fit All
                </button>
              </div>

              <div className={styles.viewportTabs}>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'both' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('both')}
                >
                  Dual View
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'desktop' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('desktop')}
                >
                  Desktop (1440px)
                </button>
                <button
                  type="button"
                  className={`${styles.tabBtn} ${activeTab === 'mobile' ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab('mobile')}
                >
                  Mobile (390px)
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Guidance Line */}
      <div className={styles.guidanceBar}>
        <span className={styles.guidanceIcon}>💡</span>
        <span className={styles.guidanceText}>{guidance}</span>
      </div>

      {/* Frames Container (Rendered when not collapsed) */}
      {!isCollapsed && (
        <div className={styles.framesContainer}>
        {/* DESKTOP FRAME */}
        {(activeTab === 'both' || activeTab === 'desktop') && (
          <div className={`${styles.frameWrap} ${styles.desktopFrameWrap}`}>
            <div className={styles.frameLabel}>
              <span>🖥️ Desktop (1440px Container)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {viewHeightMode === 'window' && scaledDesktopHeight > 540 && (
                  <span className={styles.scrollHintBadge}>↕ Scroll inside to preview all</span>
                )}
                <span className={styles.scaleNote}>Scaled down preview</span>
              </div>
            </div>

            <div
              className={styles.desktopViewport}
              ref={desktopFrameRef}
              style={{
                maxHeight: viewHeightMode === 'window' ? '540px' : 'none',
                height: viewHeightMode === 'window' && scaledDesktopHeight > 540 ? '540px' : `${scaledDesktopHeight}px`,
              }}
            >
              {desktopLayout && (
                <div
                  className={styles.scrollStageWrapper}
                  style={{
                    height: `${scaledDesktopHeight}px`,
                  }}
                >
                  <div
                    className={styles.scaledStage}
                    style={{
                      width: '1440px',
                      height: `${desktopLayout.totalHeight || 400}px`,
                      transform: `scale(${desktopScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                  {(desktopLayout.rows || []).map((row, rIdx) => {
                    const rowItems = row.items || row.tiles || [];
                    return (
                      <div
                        key={`d-row-${rIdx}`}
                        className={styles.previewRow}
                        style={{
                          height: `${row.height}px`,
                          marginBottom: '12px',
                        }}
                      >
                        {rowItems.map((it) => {
                          const renderedW = it.renderedWidth || it.width || 300;
                          const originalW = it.naturalWidth || it.originalWidth || it.width || 1200;
                          const originalH = it.naturalHeight || it.originalHeight || it.height || 800;
                          const mediaAspect = originalW / originalH;
                          const slotAspect = renderedW / row.height;
                          const crop = calculateCropPercent(mediaAspect, slotAspect);
                          const isSelected = selectedIdx === it.itemIdx;
                          const fx = it.focus?.x ?? 50;
                          const fy = it.focus?.y ?? 50;
                          const thumbUrl = it.isVideo
                            ? (it.posterUrl || it.poster || getOptimizedPosterUrl(it.src))
                            : (mediaUrl(it, { width: 500, quality: 80, format: 'auto' }) || it.src);

                          return (
                            <div
                              key={`d-tile-${it.id}`}
                              className={`${styles.previewTile} ${isSelected ? styles.tileSelected : ''}`}
                              style={{
                                width: `${renderedW}px`,
                                height: '100%',
                              }}
                              onClick={() => {
                                setSelectedIdx(it.itemIdx);
                                if (onItemClick) onItemClick(it.itemIdx);
                              }}
                            >
                              {/* Lazy-loaded thumbnail image */}
                              {it.isVideo ? (
                                <div className={styles.tileMediaWrap}>
                                  <img
                                    src={thumbUrl}
                                    alt={it.title || 'Video'}
                                    loading="lazy"
                                    decoding="async"
                                    className={styles.tileImageInner}
                                    style={{ objectPosition: `${fx}% ${fy}%` }}
                                  />
                                  <span className={styles.videoPlayBadge}>▶ Video</span>
                                </div>
                              ) : (
                                <img
                                  src={thumbUrl}
                                  alt={it.altText || it.title || 'Media asset'}
                                  loading="lazy"
                                  decoding="async"
                                  className={styles.tileImageInner}
                                  style={{ objectPosition: `${fx}% ${fy}%` }}
                                  onError={(e) => {
                                    if (e.target.src !== it.src) e.target.src = it.src;
                                  }}
                                />
                              )}

                              {/* Badges on Tile */}
                              <div className={styles.tileBadgeGroup}>
                                <span className={styles.tileNumberBadge}>#{it.itemIdx + 1}</span>
                                <OrientationBadge width={it.width} height={it.height} isVideo={it.isVideo} />
                              </div>

                              <div className={styles.tileFitBottom}>
                                <FitBadge cropPercent={crop} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Render 360 round portal tiles at exact layout junctions */}
                  {(desktopLayout.placedPortals || []).map((p) => (
                    <div
                      key={p.id}
                      className={styles.roundPortalPreview}
                      style={{
                        left: `${p.xPx}px`,
                        top: `${p.yPx}px`,
                        width: `${p.diameter}px`,
                        height: `${p.diameter}px`,
                        marginLeft: `-${p.radius}px`,
                        marginTop: `-${p.radius}px`,
                      }}
                      title={p.title}
                    >
                      <img src={p.previewSrc || p.fallbackSrc} alt={p.title} className={styles.roundPortalImg} />
                      <span className={styles.portalBadge}>360° VIEW</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {/* MOBILE FRAME */}
        {(activeTab === 'both' || activeTab === 'mobile') && (
          <div className={`${styles.frameWrap} ${styles.mobileFrameWrap}`}>
            <div className={styles.frameLabel}>
              <span>📱 Mobile (390px Screen)</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {viewHeightMode === 'window' && scaledPhoneHeight > 540 && (
                  <span className={styles.scrollHintBadge}>↕ Scroll inside</span>
                )}
                <span className={styles.scaleNote}>2 per row</span>
              </div>
            </div>

            <div
              className={styles.mobileViewport}
              ref={mobileFrameRef}
              style={{
                maxHeight: viewHeightMode === 'window' ? '540px' : 'none',
                height: viewHeightMode === 'window' && scaledPhoneHeight > 540 ? '540px' : `${scaledPhoneHeight}px`,
              }}
            >
              {phoneLayout && (
                <div
                  className={styles.scrollStageWrapper}
                  style={{
                    height: `${scaledPhoneHeight}px`,
                  }}
                >
                  <div
                    className={styles.scaledStage}
                    style={{
                      width: '390px',
                      height: `${phoneLayout.totalHeight || 400}px`,
                      transform: `scale(${phoneScale})`,
                      transformOrigin: 'top left',
                    }}
                  >
                  {(phoneLayout.rows || []).map((row, rIdx) => {
                    const rowItems = row.items || row.tiles || [];
                    return (
                      <div
                        key={`m-row-${rIdx}`}
                        className={styles.previewRow}
                        style={{
                          height: `${row.height}px`,
                          marginBottom: '10px',
                        }}
                      >
                        {rowItems.map((it) => {
                          const renderedW = it.renderedWidth || it.width || 180;
                          const originalW = it.naturalWidth || it.originalWidth || it.width || 1200;
                          const originalH = it.naturalHeight || it.originalHeight || it.height || 800;
                          const mediaAspect = originalW / originalH;
                          const slotAspect = renderedW / row.height;
                          const crop = calculateCropPercent(mediaAspect, slotAspect);
                          const isSelected = selectedIdx === it.itemIdx;
                          const fx = it.focus?.x ?? 50;
                          const fy = it.focus?.y ?? 50;
                          const thumbUrl = it.isVideo
                            ? (it.posterUrl || it.poster || getOptimizedPosterUrl(it.src))
                            : (mediaUrl(it, { width: 350, quality: 75, format: 'auto' }) || it.src);

                          return (
                            <div
                              key={`m-tile-${it.id}`}
                              className={`${styles.previewTile} ${isSelected ? styles.tileSelected : ''}`}
                              style={{
                                width: `${renderedW}px`,
                                height: '100%',
                              }}
                              onClick={() => {
                                setSelectedIdx(it.itemIdx);
                                if (onItemClick) onItemClick(it.itemIdx);
                              }}
                            >
                              {it.isVideo ? (
                                <div className={styles.tileMediaWrap}>
                                  <img
                                    src={thumbUrl}
                                    alt={it.title || 'Video'}
                                    loading="lazy"
                                    decoding="async"
                                    className={styles.tileImageInner}
                                    style={{ objectPosition: `${fx}% ${fy}%` }}
                                  />
                                  <span className={styles.videoPlayBadge}>▶ Video</span>
                                </div>
                              ) : (
                                <img
                                  src={thumbUrl}
                                  alt={it.altText || it.title || 'Media asset'}
                                  loading="lazy"
                                  decoding="async"
                                  className={styles.tileImageInner}
                                  style={{ objectPosition: `${fx}% ${fy}%` }}
                                  onError={(e) => {
                                    if (e.target.src !== it.src) e.target.src = it.src;
                                  }}
                                />
                              )}

                              <div className={styles.tileBadgeGroup}>
                                <span className={styles.tileNumberBadge}>#{it.itemIdx + 1}</span>
                              </div>

                              <div className={styles.tileFitBottom}>
                                <FitBadge cropPercent={crop} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}

                  {/* Render 360 round portal tiles at exact layout junctions */}
                  {(phoneLayout.placedPortals || []).map((p) => (
                    <div
                      key={p.id}
                      className={styles.roundPortalPreview}
                      style={{
                        left: `${p.xPx}px`,
                        top: `${p.yPx}px`,
                        width: `${p.diameter}px`,
                        height: `${p.diameter}px`,
                        marginLeft: `-${p.radius}px`,
                        marginTop: `-${p.radius}px`,
                      }}
                      title={p.title}
                    >
                      <img src={p.previewSrc || p.fallbackSrc} alt={p.title} className={styles.roundPortalImg} />
                      <span className={styles.portalBadge}>360°</span>
                    </div>
                  ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Selected Item Detail / Quick Editor Bar */}
      {selectedIdx !== null && normalizedItems[selectedIdx] && (
        <div className={styles.selectedDetailBar}>
          <div className={styles.detailThumbWrap}>
            <img
              src={normalizedItems[selectedIdx].src}
              alt="Selected"
              className={styles.detailThumbImg}
              onClick={(e) => handleFocalClick(selectedIdx, e)}
              title="Click on the photo to adjust focal focus center"
            />
            <span
              className={styles.focalMarker}
              style={{
                left: `${normalizedItems[selectedIdx].focus.x}%`,
                top: `${normalizedItems[selectedIdx].focus.y}%`,
              }}
            />
          </div>

          <div className={styles.detailMeta}>
            <div className={styles.detailRow}>
              <strong>Tile #{selectedIdx + 1}</strong>
              <OrientationBadge
                width={normalizedItems[selectedIdx].width}
                height={normalizedItems[selectedIdx].height}
                isVideo={normalizedItems[selectedIdx].isVideo}
              />
              <span className={styles.dimNote}>
                {normalizedItems[selectedIdx].width} × {normalizedItems[selectedIdx].height}px
              </span>
            </div>

            <div className={styles.detailControls}>
              <label className={styles.controlLabel}>
                <span>Display As:</span>
                <select
                  value={normalizedItems[selectedIdx].displayAs || 'auto'}
                  onChange={(e) => {
                    if (onUpdateDisplayAs) {
                      onUpdateDisplayAs(selectedIdx, e.target.value);
                    }
                  }}
                  className={styles.selectInput}
                >
                  <option value="auto">Auto (Native Ratio)</option>
                  <option value="portrait">Force Portrait Slot</option>
                  <option value="landscape">Force Landscape Slot</option>
                  <option value="square">Force Square Slot</option>
                </select>
              </label>

              <span className={styles.focusTip}>
                🎯 Click thumbnail to set focus ({normalizedItems[selectedIdx].focus.x}%,{' '}
                {normalizedItems[selectedIdx].focus.y}%)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

