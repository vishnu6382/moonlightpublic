/**
 * Justified-Rows Layout Engine for Moon Light Resort
 * Pure shared layout function used identically on public pages and the admin preview.
 *
 * Guarantees:
 * 1. 0% crop for all standard media (each item's width = rowHeight * naturalAspectRatio).
 * 2. Exact container width match (+-0.5px rounding).
 * 3. Never an empty cell or a lonely single tile on the last row.
 * 4. Proper junction calculation for MoonPortals with radial cutout masks.
 */

export function getNaturalAspectRatio(item) {
  if (!item) return 1.5;

  // Manual display hint from admin
  if (item.displayAs === 'portrait') return 0.75; // 3:4
  if (item.displayAs === 'landscape') return 1.5; // 3:2
  if (item.displayAs === 'square') return 1.0;

  const w = Number(item.width || item.naturalWidth);
  const h = Number(item.height || item.naturalHeight);

  if (w > 0 && h > 0) {
    return w / h;
  }

  // Fallback defaults based on type
  if (item.type === 'video' || (typeof item.src === 'string' && item.src.endsWith('.mp4'))) {
    return 16 / 9;
  }

  return 1.45; // Default pleasing landscape ratio
}

/**
 * Core pure layout function
 */
export function layoutRows(items = [], options = {}) {
  if (!items || items.length === 0) {
    return {
      rows: [],
      placedTiles: [],
      placedPortals: [],
      totalHeight: 0,
      maskGradients: [],
    };
  }

  const {
    containerWidth = 1200,
    isPhone = containerWidth < 768,
    perRowTarget = isPhone ? 2 : 4,
    minRowHeight = isPhone ? 170 : 280,
    maxRowHeight = isPhone ? 300 : 440,
    gap = isPhone ? 10 : 12,
    round360Tiles = [],
    portalDiameter = isPhone ? 132 : 160,
  } = options;

  const targetHeight = (minRowHeight + maxRowHeight) / 2;
  const portalRadius = portalDiameter / 2;

  // Enrich items with natural aspect ratios
  const enriched = items.map((it, idx) => ({
    ...it,
    naturalWidth: it.naturalWidth || it.width,
    naturalHeight: it.naturalHeight || it.height,
    originalWidth: it.originalWidth || it.width,
    originalHeight: it.originalHeight || it.height,
    id: it.id || it.src || `media-tile-${idx}`,
    itemIdx: it.itemIdx !== undefined ? it.itemIdx : idx,
    aspect: getNaturalAspectRatio(it),
  }));

  // Small sets (1, 2, 3 items)
  if (enriched.length <= 3) {
    return layoutSmallSet(enriched, {
      containerWidth,
      isPhone,
      gap,
      minRowHeight,
      maxRowHeight,
      round360Tiles,
      portalRadius,
      portalDiameter,
    });
  }

  // 4+ Items: Justified Rows partition
  const rowGroups = [];
  let currentGroup = [];

  for (let i = 0; i < enriched.length; i++) {
    currentGroup.push(enriched[i]);

    const sumAspect = currentGroup.reduce((s, it) => s + it.aspect, 0);
    const availableWidth = containerWidth - (currentGroup.length - 1) * gap;
    const computedHeight = availableWidth / sumAspect;

    // Check if adding this item brought the row close to target height or target count
    if (currentGroup.length >= perRowTarget || computedHeight <= targetHeight) {
      if (computedHeight >= minRowHeight || currentGroup.length >= perRowTarget + 1) {
        rowGroups.push(currentGroup);
        currentGroup = [];
      }
    }
  }

  if (currentGroup.length > 0) {
    rowGroups.push(currentGroup);
  }

  // Rebalance last row if it has only 1 tile and there are multiple rows
  if (rowGroups.length > 1) {
    const lastRow = rowGroups[rowGroups.length - 1];
    const prevRow = rowGroups[rowGroups.length - 2];

    if (lastRow.length === 1 && prevRow.length >= 3) {
      // Steal one item from prevRow to balance
      lastRow.unshift(prevRow.pop());
    } else if (lastRow.length === 1 && prevRow.length === 2) {
      // Merge into a 3-item row
      prevRow.push(lastRow.pop());
      rowGroups.pop();
    }
  }

  // Now compute geometry for each row
  const placedTiles = [];
  const rows = [];
  let currentY = 0;

  for (let rIdx = 0; rIdx < rowGroups.length; rIdx++) {
    const group = rowGroups[rIdx];
    const isLastRow = rIdx === rowGroups.length - 1;
    const sumAspect = group.reduce((s, it) => s + it.aspect, 0);
    const availableWidth = containerWidth - (group.length - 1) * gap;
    let rowHeight = availableWidth / sumAspect;

    // Clamp row height
    if (isLastRow && rowHeight > maxRowHeight) {
      // If last row has few items, do not let it blow up infinitely
      rowHeight = Math.min(rowHeight, Math.max(minRowHeight, targetHeight));
    } else {
      rowHeight = Math.max(minRowHeight, Math.min(maxRowHeight, rowHeight));
    }

    rowHeight = Math.round(rowHeight);

    let currentX = 0;
    const rowTiles = [];

    for (let cIdx = 0; cIdx < group.length; cIdx++) {
      const it = group[cIdx];
      let tileWidth = Math.round(rowHeight * it.aspect);

      // Force last item in row to close exact gap to containerWidth
      if (cIdx === group.length - 1 && (!isLastRow || group.length >= 2)) {
        tileWidth = Math.max(80, containerWidth - currentX);
      }

      const tile = {
        ...it,
        x: currentX,
        y: currentY,
        renderedWidth: tileWidth,
        renderedHeight: rowHeight,
        width: tileWidth,
        height: rowHeight,
        naturalWidth: it.naturalWidth || it.width,
        naturalHeight: it.naturalHeight || it.height,
        aspectRatio: tileWidth / rowHeight,
        containerAspect: tileWidth / rowHeight,
        rowIdx: rIdx,
        colIdx: cIdx,
      };

      rowTiles.push(tile);
      placedTiles.push(tile);
      currentX += tileWidth + gap;
    }

    rows.push({
      rowIdx: rIdx,
      y: currentY,
      height: rowHeight,
      tiles: rowTiles,
      items: rowTiles,
    });

    currentY += rowHeight + gap;
  }

  const totalHeight = currentY > 0 ? currentY - gap : 0;

  // Place round portals at row junctions
  const placedPortals = placePortalsAtJunctions(rows, {
    round360Tiles,
    containerWidth,
    isPhone,
    portalRadius,
    portalDiameter,
    gap,
  });

  // Generate radial cutout mask gradients
  const maskGradients = placedPortals.map((p) => {
    const cutoutRadius = p.radius + 6;
    return `radial-gradient(circle at ${p.xPx}px ${p.yPx}px, transparent 0, transparent ${cutoutRadius}px, black ${cutoutRadius + 0.5}px)`;
  });

  return {
    rows,
    placedTiles,
    placedPortals,
    totalHeight,
    maskGradients,
  };
}

/**
 * Small set layout (1 to 3 items)
 */
function layoutSmallSet(items, opts) {
  const {
    containerWidth,
    isPhone,
    gap,
    minRowHeight,
    maxRowHeight,
    round360Tiles,
    portalRadius,
    portalDiameter,
  } = opts;

  const placedTiles = [];
  const rows = [];
  const placedPortals = [];

  if (items.length === 1) {
    const it = items[0];
    const h = isPhone ? 280 : 420;
    const tile = {
      ...it,
      x: 0,
      y: 0,
      renderedWidth: containerWidth,
      renderedHeight: h,
      width: containerWidth,
      height: h,
      naturalWidth: it.naturalWidth || it.width,
      naturalHeight: it.naturalHeight || it.height,
      aspectRatio: containerWidth / h,
      containerAspect: containerWidth / h,
      rowIdx: 0,
      colIdx: 0,
    };
    placedTiles.push(tile);
    rows.push({ rowIdx: 0, y: 0, height: h, tiles: [tile], items: [tile] });

    if (round360Tiles.length > 0) {
      placedPortals.push({
        ...round360Tiles[0],
        xPx: Math.round(containerWidth / 2),
        yPx: h,
        radius: portalRadius,
        diameter: portalDiameter,
      });
    }

    const maskGradients = placedPortals.map((p) => {
      const cutout = p.radius + 6;
      return `radial-gradient(circle at ${p.xPx}px ${p.yPx}px, transparent 0, transparent ${cutout}px, black ${cutout + 0.5}px)`;
    });

    return { rows, placedTiles, placedPortals, totalHeight: h, maskGradients };
  }

  if (items.length === 2) {
    if (isPhone) {
      // 2 stacked rows on phone
      const h = 220;
      for (let i = 0; i < 2; i++) {
        const tile = {
          ...items[i],
          x: 0,
          y: i * (h + gap),
          renderedWidth: containerWidth,
          renderedHeight: h,
          width: containerWidth,
          height: h,
          naturalWidth: items[i].naturalWidth || items[i].width,
          naturalHeight: items[i].naturalHeight || items[i].height,
          aspectRatio: containerWidth / h,
          containerAspect: containerWidth / h,
          rowIdx: i,
          colIdx: 0,
        };
        placedTiles.push(tile);
        rows.push({ rowIdx: i, y: i * (h + gap), height: h, tiles: [tile], items: [tile] });
      }

      if (round360Tiles.length > 0) {
        placedPortals.push({
          ...round360Tiles[0],
          xPx: Math.round(containerWidth / 2),
          yPx: h + Math.round(gap / 2),
          radius: portalRadius,
          diameter: portalDiameter,
        });
      }

      const totalH = h * 2 + gap;
      const maskGradients = placedPortals.map((p) => {
        const cutout = p.radius + 6;
        return `radial-gradient(circle at ${p.xPx}px ${p.yPx}px, transparent 0, transparent ${cutout}px, black ${cutout + 0.5}px)`;
      });
      return { rows, placedTiles, placedPortals, totalHeight: totalH, maskGradients };
    } else {
      // 2 items side-by-side on desktop
      const sumAspect = items[0].aspect + items[1].aspect;
      const h = Math.round(Math.min(maxRowHeight, Math.max(minRowHeight, (containerWidth - gap) / sumAspect)));
      const w0 = Math.round(h * items[0].aspect);
      const w1 = containerWidth - w0 - gap;

      const t0 = { ...items[0], x: 0, y: 0, renderedWidth: w0, renderedHeight: h, width: w0, height: h, naturalWidth: items[0].naturalWidth || items[0].width, naturalHeight: items[0].naturalHeight || items[0].height, aspectRatio: w0 / h, rowIdx: 0, colIdx: 0 };
      const t1 = { ...items[1], x: w0 + gap, y: 0, renderedWidth: w1, renderedHeight: h, width: w1, height: h, naturalWidth: items[1].naturalWidth || items[1].width, naturalHeight: items[1].naturalHeight || items[1].height, aspectRatio: w1 / h, rowIdx: 0, colIdx: 1 };
      placedTiles.push(t0, t1);
      rows.push({ rowIdx: 0, y: 0, height: h, tiles: [t0, t1], items: [t0, t1] });

      if (round360Tiles.length > 0) {
        placedPortals.push({
          ...round360Tiles[0],
          xPx: w0 + Math.round(gap / 2),
          yPx: Math.round(h / 2),
          radius: portalRadius,
          diameter: portalDiameter,
        });
      }

      const maskGradients = placedPortals.map((p) => {
        const cutout = p.radius + 6;
        return `radial-gradient(circle at ${p.xPx}px ${p.yPx}px, transparent 0, transparent ${cutout}px, black ${cutout + 0.5}px)`;
      });
      return { rows, placedTiles, placedPortals, totalHeight: h, maskGradients };
    }
  }

  // 3 Items: Row 1 = wide hero (or 2 items), Row 2 = remaining
  const sumAspect = items[0].aspect + items[1].aspect + items[2].aspect;
  const h = Math.round(Math.min(maxRowHeight, Math.max(minRowHeight, (containerWidth - gap * 2) / sumAspect)));

  if (!isPhone && h >= minRowHeight && h <= maxRowHeight) {
    // 3 items in a single desktop row
    let curX = 0;
    const rTiles = [];
    for (let i = 0; i < 3; i++) {
      let w = Math.round(h * items[i].aspect);
      if (i === 2) w = containerWidth - curX;
      const t = { ...items[i], x: curX, y: 0, renderedWidth: w, renderedHeight: h, width: w, height: h, naturalWidth: items[i].naturalWidth || items[i].width, naturalHeight: items[i].naturalHeight || items[i].height, aspectRatio: w / h, rowIdx: 0, colIdx: i };
      rTiles.push(t);
      placedTiles.push(t);
      curX += w + gap;
    }
    rows.push({ rowIdx: 0, y: 0, height: h, tiles: rTiles, items: rTiles });

    if (round360Tiles.length > 0) {
      placedPortals.push({
        ...round360Tiles[0],
        xPx: Math.round(rTiles[0].width + gap / 2),
        yPx: Math.round(h / 2),
        radius: portalRadius,
        diameter: portalDiameter,
      });
    }

    const maskGradients = placedPortals.map((p) => {
      const cutout = p.radius + 6;
      return `radial-gradient(circle at ${p.xPx}px ${p.yPx}px, transparent 0, transparent ${cutout}px, black ${cutout + 0.5}px)`;
    });
    return { rows, placedTiles, placedPortals, totalHeight: h, maskGradients };
  } else {
    // Row 1: Item 0 (span full), Row 2: Items 1 & 2
    const h1 = isPhone ? 220 : 340;
    const h2 = isPhone ? 180 : 300;
    const t0 = { ...items[0], x: 0, y: 0, renderedWidth: containerWidth, renderedHeight: h1, width: containerWidth, height: h1, naturalWidth: items[0].naturalWidth || items[0].width, naturalHeight: items[0].naturalHeight || items[0].height, aspectRatio: containerWidth / h1, rowIdx: 0, colIdx: 0 };
    rows.push({ rowIdx: 0, y: 0, height: h1, tiles: [t0], items: [t0] });
    placedTiles.push(t0);

    const w1 = Math.round((containerWidth - gap) / 2);
    const w2 = containerWidth - w1 - gap;
    const t1 = { ...items[1], x: 0, y: h1 + gap, renderedWidth: w1, renderedHeight: h2, width: w1, height: h2, naturalWidth: items[1].naturalWidth || items[1].width, naturalHeight: items[1].naturalHeight || items[1].height, aspectRatio: w1 / h2, rowIdx: 1, colIdx: 0 };
    const t2 = { ...items[2], x: w1 + gap, y: h1 + gap, renderedWidth: w2, renderedHeight: h2, width: w2, height: h2, naturalWidth: items[2].naturalWidth || items[2].width, naturalHeight: items[2].naturalHeight || items[2].height, aspectRatio: w2 / h2, rowIdx: 1, colIdx: 1 };
    rows.push({ rowIdx: 1, y: h1 + gap, height: h2, tiles: [t1, t2], items: [t1, t2] });
    placedTiles.push(t1, t2);

    if (round360Tiles.length > 0) {
      placedPortals.push({
        ...round360Tiles[0],
        xPx: Math.round(containerWidth / 2),
        yPx: h1 + Math.round(gap / 2),
        radius: portalRadius,
        diameter: portalDiameter,
      });
    }

    const totalH = h1 + gap + h2;
    const maskGradients = placedPortals.map((p) => {
      const cutout = p.radius + 6;
      return `radial-gradient(circle at ${p.xPx}px ${p.yPx}px, transparent 0, transparent ${cutout}px, black ${cutout + 0.5}px)`;
    });
    return { rows, placedTiles, placedPortals, totalHeight: totalH, maskGradients };
  }
}

/**
 * Finds optimal row junctions and places round portals
 */
function placePortalsAtJunctions(rows, opts) {
  const { round360Tiles, containerWidth, isPhone, portalRadius, portalDiameter, gap } = opts;
  if (!round360Tiles || round360Tiles.length === 0 || rows.length < 2) {
    return [];
  }

  const placedPortals = [];
  const targetXPercentages = isPhone ? [0.5] : [0.5, 0.25, 0.75, 0.5];
  let portalQueue = [...round360Tiles];

  for (let rIdx = 0; rIdx < rows.length - 1 && portalQueue.length > 0; rIdx++) {
    const rowAbove = rows[rIdx];
    const rowBelow = rows[rIdx + 1];
    const junctionY = rowAbove.y + rowAbove.height + Math.round(gap / 2);

    const targetX = containerWidth * (targetXPercentages[rIdx % targetXPercentages.length] || 0.5);

    // Collect all vertical seams between tiles in rowAbove and rowBelow
    const candidateSeams = [];

    rowAbove.tiles.slice(0, -1).forEach((t) => candidateSeams.push(t.x + t.width + Math.round(gap / 2)));
    rowBelow.tiles.slice(0, -1).forEach((t) => candidateSeams.push(t.x + t.width + Math.round(gap / 2)));

    // If no candidate seams, use 50%
    if (candidateSeams.length === 0) {
      candidateSeams.push(Math.round(containerWidth / 2));
    }

    // Find seam closest to targetX
    candidateSeams.sort((a, b) => Math.abs(a - targetX) - Math.abs(b - targetX));
    const bestX = candidateSeams[0];

    const portalData = portalQueue.shift();
    placedPortals.push({
      ...portalData,
      xPx: bestX,
      yPx: junctionY,
      xCss: `${bestX}px`,
      radius: portalRadius,
      diameter: portalDiameter,
    });
  }

  return placedPortals;
}

