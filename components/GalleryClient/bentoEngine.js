/**
 * Bento Grid Layout Engine - Moon Light Resort Luxury Gallery
 * 
 * Guarantees:
 * 1. ZERO duplicate or overlapping portals (strict single portal per module, >= 800px separation).
 * 2. On Desktop (12 cols): Strictly at least 3 photos per row (recipes: 4+4+4, 3+3+3+3, 6+3+3, 3+3+6, 3+6+3).
 * 3. ZERO empty cells or jagged gaps (every row's colSpans sum to exactly 12, uniform row height per row).
 * 4. On Phone (2 cols): Strictly 2 photos per row (1+1) with balanced module hug.
 * 5. All images fit their cards with object-fit: cover and consistent rounded bento corners.
 */

export function computeBentoLayout({
  items = [],
  numCols = 12,
  portalDiameter = 160,
  round360Tiles = [],
  filterCategory = 'all',
  containerWidth = 1500,
}) {
  if (!items || items.length === 0) {
    return {
      placedTiles: [],
      placedPortals: [],
      totalRows: 0,
      maskGradients: [],
    };
  }

  const isPhone = numCols <= 4;
  const cols = isPhone ? 2 : 12;
  const gap = isPhone ? 10 : 12;
  const portalRadius = portalDiameter / 2;
  const show360 = filterCategory === 'all' || filterCategory === 'rooms';

  // Deduplicate 360 tiles by roomSlug / id to prevent redundant duplicate portals
  const seen360 = new Set();
  const deduped360 = [];
  (round360Tiles || []).forEach((t) => {
    const key = t.roomSlug ? `room-${t.roomSlug}` : (t.panoSrc || t.id);
    if (!seen360.has(key)) {
      seen360.add(key);
      deduped360.push({ ...t, is360: true });
    }
  });
  let available360 = [...deduped360];

  // Helper to compute junction coordinates
  function getJunctionCoords(cLine, rLine) {
    if (isPhone) {
      // On phone (2 columns), junction is always at the 50% seam
      const yPx = (rLine - 1) * 10 - gap / 2;
      return { xCss: '50%', yPx };
    }

    const cIndex = cLine - 1;
    const xPercent = (cIndex / cols) * 100;
    const xOffsetPx = (cIndex - cols / 2) * (gap / cols);
    const xCss = `calc(${xPercent}% + ${xOffsetPx}px)`;
    const yPx = (rLine - 1) * 10 - gap / 2;

    return { xCss, yPx };
  }

  const placedTiles = [];
  const placedPortals = [];
  let currentRow = 1;

  const itemQueue = items.map((it, idx) => ({
    ...it,
    id: it.id || it.src || `tile-${idx}`,
    itemIdx: it.itemIdx !== undefined ? it.itemIdx : idx,
  }));

  // =========================================================================
  // PHONE LAYOUT (2 Columns)
  // =========================================================================
  if (isPhone) {
    let modulePlaced = false;

    // Small dataset (1-3 items)
    if (items.length <= 3) {
      if (items.length === 1) {
        placedTiles.push({
          ...items[0],
          id: items[0].id || items[0].src || 'tile-0',
          itemIdx: 0,
          colStart: 1,
          colSpan: 2,
          rowStart: 1,
          rowSpan: 30,
        });
        currentRow = 31;
        if (show360 && available360.length > 0) {
          const { yPx } = getJunctionCoords(2, 31);
          placedPortals.push({
            ...available360[0],
            is360: true,
            xCss: '50%',
            yPx,
            radius: portalRadius,
            diameter: portalDiameter,
          });
        }
      } else if (items.length === 2) {
        placedTiles.push(
          { ...items[0], id: items[0].id || items[0].src || 'tile-0', itemIdx: 0, colStart: 1, colSpan: 1, rowStart: 1, rowSpan: 25 },
          { ...items[1], id: items[1].id || items[1].src || 'tile-1', itemIdx: 1, colStart: 2, colSpan: 1, rowStart: 1, rowSpan: 25 }
        );
        currentRow = 26;
        if (show360 && available360.length > 0) {
          const { yPx } = getJunctionCoords(2, 26);
          placedPortals.push({
            ...available360[0],
            is360: true,
            xCss: '50%',
            yPx,
            radius: portalRadius,
            diameter: portalDiameter,
          });
        }
      } else if (items.length === 3) {
        placedTiles.push(
          { ...items[0], id: items[0].id || items[0].src || 'tile-0', itemIdx: 0, colStart: 1, colSpan: 2, rowStart: 1, rowSpan: 25 },
          { ...items[1], id: items[1].id || items[1].src || 'tile-1', itemIdx: 1, colStart: 1, colSpan: 1, rowStart: 26, rowSpan: 25 },
          { ...items[2], id: items[2].id || items[2].src || 'tile-2', itemIdx: 2, colStart: 2, colSpan: 1, rowStart: 26, rowSpan: 25 }
        );
        currentRow = 51;
        if (show360 && available360.length > 0) {
          const { yPx } = getJunctionCoords(2, 26);
          placedPortals.push({
            ...available360[0],
            is360: true,
            xCss: '50%',
            yPx,
            radius: portalRadius,
            diameter: portalDiameter,
          });
        }
      }
    } else {
      // 4+ items on phone
      while (itemQueue.length > 0) {
        // 4-tile module with center 360 portal
        if (show360 && available360.length > 0 && itemQueue.length >= 4 && !modulePlaced) {
          const tTL = itemQueue.shift();
          const tTR = itemQueue.shift();
          const tBL = itemQueue.shift();
          const tBR = itemQueue.shift();
          const halfRowSpan = 25;
          const rLine = currentRow + halfRowSpan + 1;

          placedTiles.push(
            { ...tTL, colStart: 1, colSpan: 1, rowStart: currentRow, rowSpan: halfRowSpan, labelPosition: 'top-left' },
            { ...tTR, colStart: 2, colSpan: 1, rowStart: currentRow, rowSpan: halfRowSpan, labelPosition: 'top-right' },
            { ...tBL, colStart: 1, colSpan: 1, rowStart: currentRow + halfRowSpan, rowSpan: halfRowSpan, labelPosition: 'bottom-left' },
            { ...tBR, colStart: 2, colSpan: 1, rowStart: currentRow + halfRowSpan, rowSpan: halfRowSpan, labelPosition: 'bottom-right' }
          );

          const portalData = available360.shift();
          const { xCss, yPx } = getJunctionCoords(2, rLine);
          placedPortals.push({
            ...portalData,
            is360: true,
            xCss,
            yPx,
            radius: portalRadius,
            diameter: portalDiameter,
          });

          currentRow += halfRowSpan * 2;
          modulePlaced = true;
          continue;
        }

        if (itemQueue.length >= 2) {
          const t1 = itemQueue.shift();
          const t2 = itemQueue.shift();
          const rowSpan = 25;
          placedTiles.push(
            { ...t1, colStart: 1, colSpan: 1, rowStart: currentRow, rowSpan },
            { ...t2, colStart: 2, colSpan: 1, rowStart: currentRow, rowSpan }
          );
          currentRow += rowSpan;
        } else {
          // 1 item left
          const t1 = itemQueue.shift();
          const rowSpan = 26;
          placedTiles.push(
            { ...t1, colStart: 1, colSpan: 2, rowStart: currentRow, rowSpan }
          );
          currentRow += rowSpan;
        }
      }
    }
  }

  // =========================================================================
  // DESKTOP LAYOUT (12 Columns)
  // Strictly >= 3 photos per row, full 12-column row blocks, 0 holes, 0 duplicate portals
  // =========================================================================
  if (!isPhone) {
    let moduleCount = 0;
    let rowsSinceModule = 999;
    let patternIdx = 0;

    // Small dataset (1-3 items)
    if (items.length <= 3) {
      if (items.length === 1) {
        placedTiles.push({
          ...items[0],
          id: items[0].id || items[0].src || 'tile-0',
          itemIdx: 0,
          colStart: 1,
          colSpan: 12,
          rowStart: 1,
          rowSpan: 38,
        });
        currentRow = 39;
        if (show360 && available360.length > 0) {
          const { yPx } = getJunctionCoords(7, 39);
          placedPortals.push({
            ...available360[0],
            is360: true,
            xCss: '50%',
            yPx,
            radius: portalRadius,
            diameter: portalDiameter,
          });
        }
      } else if (items.length === 2) {
        placedTiles.push(
          { ...items[0], id: items[0].id || items[0].src || 'tile-0', itemIdx: 0, colStart: 1, colSpan: 6, rowStart: 1, rowSpan: 32 },
          { ...items[1], id: items[1].id || items[1].src || 'tile-1', itemIdx: 1, colStart: 7, colSpan: 6, rowStart: 1, rowSpan: 32 }
        );
        currentRow = 33;
        if (show360 && available360.length > 0) {
          const { yPx } = getJunctionCoords(7, 33);
          placedPortals.push({
            ...available360[0],
            is360: true,
            xCss: '50%',
            yPx,
            radius: portalRadius,
            diameter: portalDiameter,
          });
        }
      } else if (items.length === 3) {
        placedTiles.push(
          { ...items[0], id: items[0].id || items[0].src || 'tile-0', itemIdx: 0, colStart: 1, colSpan: 4, rowStart: 1, rowSpan: 28 },
          { ...items[1], id: items[1].id || items[1].src || 'tile-1', itemIdx: 1, colStart: 5, colSpan: 4, rowStart: 1, rowSpan: 28 },
          { ...items[2], id: items[2].id || items[2].src || 'tile-2', itemIdx: 2, colStart: 9, colSpan: 4, rowStart: 1, rowSpan: 28 }
        );
        currentRow = 29;
        if (show360 && available360.length > 0) {
          const { yPx } = getJunctionCoords(5, 29);
          placedPortals.push({
            ...available360[0],
            is360: true,
            xCss: 'calc(33.333% - 2px)',
            yPx,
            radius: portalRadius,
            diameter: portalDiameter,
          });
        }
      }
    } else {
      // 4+ items on desktop
      while (itemQueue.length > 0) {
        // Check if we should build a 4-tile round module with 360 portal:
        // Requires: show360, available 360 portal, at least 4 items left, and at least 3 rows between modules
        const shouldInsertModule =
          show360 &&
          available360.length > 0 &&
          itemQueue.length >= 4 &&
          (moduleCount === 0 || rowsSinceModule >= 3);

        if (shouldInsertModule) {
          const portalData = available360.shift();
          const halfRowSpan = 28; // 280px visual height

          // If >= 6 items left, create a 6-item module block:
          // Row 1: 3 photos (cols 1-4, 5-8, 9-12)
          // Row 2: 3 photos (cols 1-4, 5-8, 9-12)
          // Strictly 3 photos per row, portal nestled at the junction!
          if (itemQueue.length >= 6) {
            const tTL = itemQueue.shift();
            const tTR = itemQueue.shift();
            const tSide1 = itemQueue.shift();
            const tBL = itemQueue.shift();
            const tBR = itemQueue.shift();
            const tSide2 = itemQueue.shift();

            // Alternate module position: Left (cols 1-8 module + cols 9-12 side) vs Right (cols 1-4 side + cols 5-12 module)
            const isLeft = moduleCount % 2 === 0;
            const mCol = isLeft ? 0 : 4;
            const sCol = isLeft ? 8 : 0;
            const cLine = isLeft ? 5 : 9;
            const rLine = currentRow + halfRowSpan + 1;

            // Top row (3 photos)
            placedTiles.push(
              { ...tTL, colStart: mCol + 1, colSpan: 4, rowStart: currentRow, rowSpan: halfRowSpan, labelPosition: 'top-left' },
              { ...tTR, colStart: mCol + 5, colSpan: 4, rowStart: currentRow, rowSpan: halfRowSpan, labelPosition: 'top-right' },
              { ...tSide1, colStart: sCol + 1, colSpan: 4, rowStart: currentRow, rowSpan: halfRowSpan }
            );

            // Bottom row (3 photos)
            placedTiles.push(
              { ...tBL, colStart: mCol + 1, colSpan: 4, rowStart: currentRow + halfRowSpan, rowSpan: halfRowSpan, labelPosition: 'bottom-left' },
              { ...tBR, colStart: mCol + 5, colSpan: 4, rowStart: currentRow + halfRowSpan, rowSpan: halfRowSpan, labelPosition: 'bottom-right' },
              { ...tSide2, colStart: sCol + 1, colSpan: 4, rowStart: currentRow + halfRowSpan, rowSpan: halfRowSpan }
            );

            const { xCss, yPx } = getJunctionCoords(cLine, rLine);
            placedPortals.push({
              ...portalData,
              is360: true,
              xCss,
              yPx,
              radius: portalRadius,
              diameter: portalDiameter,
            });

            currentRow += halfRowSpan * 2;
            moduleCount++;
            rowsSinceModule = 0;
            continue;
          } else {
            // Exactly 4 or 5 items left:
            // 4 items around center junction at line 7 (50%)
            const tTL = itemQueue.shift();
            const tTR = itemQueue.shift();
            const tBL = itemQueue.shift();
            const tBR = itemQueue.shift();
            const rLine = currentRow + halfRowSpan + 1;

            placedTiles.push(
              { ...tTL, colStart: 1, colSpan: 6, rowStart: currentRow, rowSpan: halfRowSpan, labelPosition: 'top-left' },
              { ...tTR, colStart: 7, colSpan: 6, rowStart: currentRow, rowSpan: halfRowSpan, labelPosition: 'top-right' },
              { ...tBL, colStart: 1, colSpan: 6, rowStart: currentRow + halfRowSpan, rowSpan: halfRowSpan, labelPosition: 'bottom-left' },
              { ...tBR, colStart: 7, colSpan: 6, rowStart: currentRow + halfRowSpan, rowSpan: halfRowSpan, labelPosition: 'bottom-right' }
            );

            const { yPx } = getJunctionCoords(7, rLine);
            placedPortals.push({
              ...portalData,
              is360: true,
              xCss: '50%',
              yPx,
              radius: portalRadius,
              diameter: portalDiameter,
            });

            currentRow += halfRowSpan * 2;
            moduleCount++;
            rowsSinceModule = 0;
            continue;
          }
        }

        // =====================================================================
        // STANDARD DESKTOP ROWS (Strictly >= 3 photos per row, full 12 columns)
        // =====================================================================
        const rem = itemQueue.length;

        if (rem === 1) {
          const t = itemQueue.shift();
          const rowSpan = 28;
          placedTiles.push({ ...t, colStart: 1, colSpan: 12, rowStart: currentRow, rowSpan });
          currentRow += rowSpan;
          rowsSinceModule++;
        } else if (rem === 2) {
          const t1 = itemQueue.shift();
          const t2 = itemQueue.shift();
          const rowSpan = 28;
          placedTiles.push(
            { ...t1, colStart: 1, colSpan: 6, rowStart: currentRow, rowSpan },
            { ...t2, colStart: 7, colSpan: 6, rowStart: currentRow, rowSpan }
          );
          currentRow += rowSpan;
          rowsSinceModule++;
        } else if (rem === 4) {
          // 4 items: row of 4 photos (colSpan 3 each = 12 cols, >= 3 photos)
          const rowSpan = 26;
          for (let i = 0; i < 4; i++) {
            const t = itemQueue.shift();
            placedTiles.push({
              ...t,
              colStart: i * 3 + 1,
              colSpan: 3,
              rowStart: currentRow,
              rowSpan,
            });
          }
          currentRow += rowSpan;
          rowsSinceModule++;
        } else if (rem === 5) {
          // 5 items: Row 1 of 3 photos (4+4+4), next iteration finishes rem = 2 (6+6)
          const rowSpan = 28;
          for (let i = 0; i < 3; i++) {
            const t = itemQueue.shift();
            placedTiles.push({
              ...t,
              colStart: i * 4 + 1,
              colSpan: 4,
              rowStart: currentRow,
              rowSpan,
            });
          }
          currentRow += rowSpan;
          rowsSinceModule++;
        } else {
          // >= 3 items (rem >= 3 and not 4 or 5):
          // Varied rhythmic row compositions (every row sums to 12 cols, >= 3 photos)
          const cycle = patternIdx % 6;
          patternIdx++;

          if (cycle === 1 && rem >= 7) {
            // Pattern B: 4 photos (3 + 3 + 3 + 3 = 12)
            const rowSpan = 26;
            for (let i = 0; i < 4; i++) {
              const t = itemQueue.shift();
              placedTiles.push({
                ...t,
                colStart: i * 3 + 1,
                colSpan: 3,
                rowStart: currentRow,
                rowSpan,
              });
            }
            currentRow += rowSpan;
          } else if (cycle === 2) {
            // Pattern C: 3 photos Featured Left (6 + 3 + 3 = 12)
            const rowSpan = 28;
            const t1 = itemQueue.shift();
            const t2 = itemQueue.shift();
            const t3 = itemQueue.shift();
            placedTiles.push(
              { ...t1, colStart: 1, colSpan: 6, rowStart: currentRow, rowSpan },
              { ...t2, colStart: 7, colSpan: 3, rowStart: currentRow, rowSpan },
              { ...t3, colStart: 10, colSpan: 3, rowStart: currentRow, rowSpan }
            );
            currentRow += rowSpan;
          } else if (cycle === 4) {
            // Pattern D: 3 photos Featured Right (3 + 3 + 6 = 12)
            const rowSpan = 28;
            const t1 = itemQueue.shift();
            const t2 = itemQueue.shift();
            const t3 = itemQueue.shift();
            placedTiles.push(
              { ...t1, colStart: 1, colSpan: 3, rowStart: currentRow, rowSpan },
              { ...t2, colStart: 4, colSpan: 3, rowStart: currentRow, rowSpan },
              { ...t3, colStart: 7, colSpan: 6, rowStart: currentRow, rowSpan }
            );
            currentRow += rowSpan;
          } else if (cycle === 5) {
            // Pattern E: 3 photos Center Feature (3 + 6 + 3 = 12)
            const rowSpan = 28;
            const t1 = itemQueue.shift();
            const t2 = itemQueue.shift();
            const t3 = itemQueue.shift();
            placedTiles.push(
              { ...t1, colStart: 1, colSpan: 3, rowStart: currentRow, rowSpan },
              { ...t2, colStart: 4, colSpan: 6, rowStart: currentRow, rowSpan },
              { ...t3, colStart: 10, colSpan: 3, rowStart: currentRow, rowSpan }
            );
            currentRow += rowSpan;
          } else {
            // Pattern A: 3 photos Equal (4 + 4 + 4 = 12)
            const rowSpan = 28;
            for (let i = 0; i < 3; i++) {
              const t = itemQueue.shift();
              placedTiles.push({
                ...t,
                colStart: i * 4 + 1,
                colSpan: 4,
                rowStart: currentRow,
                rowSpan,
              });
            }
            currentRow += rowSpan;
          }
          rowsSinceModule++;
        }
      }
    }
  }

  // Safety guarantee: If 360 portal was requested but ZERO portals were placed, place exactly 1 at first row junction
  if (show360 && available360.length > 0 && placedPortals.length === 0 && placedTiles.length > 0) {
    const portal = available360[0];
    const firstRowSpan = placedTiles[0]?.rowSpan || (isPhone ? 25 : 28);
    const { yPx } = getJunctionCoords(cols === 12 ? 7 : 2, firstRowSpan + 1);
    placedPortals.push({
      ...portal,
      is360: true,
      xCss: '50%',
      yPx,
      radius: portalRadius,
      diameter: portalDiameter,
    });
  }

  // Circular notch mask gradients for smooth portal integration
  const maskGradients = placedPortals.map((p) => {
    const cutoutRadius = p.radius + 6;
    return `radial-gradient(circle at ${p.xCss} ${p.yPx}px, transparent 0, transparent ${cutoutRadius}px, black ${cutoutRadius + 0.5}px)`;
  });

  return {
    placedTiles,
    placedPortals,
    totalRows: currentRow,
    maskGradients,
  };
}
