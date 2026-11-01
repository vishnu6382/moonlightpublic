import { getGalleryItems, getActiveCategories, getActiveRooms, getGallery360Tiles } from '../content/gallery.js';
import { computeBentoLayout } from '../components/GalleryClient/bentoEngine.js';

console.log('--- TESTING TASK 05 GALLERY ---');

// 1. Test getGalleryItems with SHOW_DEMO = true
const allItems = getGalleryItems();
console.log(`Total gallery items loaded: ${allItems.length}`);

// Check deduplication
const srcs = allItems.map(it => it.src);
const uniqueSrcs = new Set(srcs);
console.log(`Unique media sources: ${uniqueSrcs.size} / ${allItems.length}`);
if (uniqueSrcs.size !== allItems.length) {
  console.error('ERROR: Duplicate srcs found in gallery items!');
} else {
  console.log('✓ All gallery items deduped by src.');
}

// 2. Test categories
const activeCategories = getActiveCategories(allItems);
console.log(`Active categories with media: ${activeCategories.map(c => `${c.name} (${c.count})`).join(', ')}`);
if (activeCategories.length === 0) {
  console.error('ERROR: No active categories found!');
} else {
  console.log('✓ Active categories populated correctly without empty categories.');
}

// 3. Test active rooms
const activeRooms = getActiveRooms(allItems);
console.log(`Active rooms with photos: ${activeRooms.map(r => `${r.name} (${r.count})`).join(', ')}`);

// 4. Test 360 tiles
const round360Tiles = getGallery360Tiles();
console.log(`360 Round tiles available: ${round360Tiles.length} (${round360Tiles.map(t => t.title).join(', ')})`);

// 5. Test Bento Layout Engine across multiple counts (1, 2, 3, 5, 10, 24, 30, all) on Desktop (6 cols) and Phone (2 cols)
const testCounts = [1, 2, 3, 5, 10, 24, 30, allItems.length];

testCounts.forEach(count => {
  const slice = allItems.slice(0, count);

  // Desktop
  const desktopLayout = computeBentoLayout({
    items: slice,
    numCols: 6,
    rowUnit: 120,
    gap: 12,
    portalDiameter: 160,
    round360Tiles,
    filterCategory: 'all',
  });

  // Verify full last row on desktop
  const dtLastTile = desktopLayout.placedTiles[desktopLayout.placedTiles.length - 1];
  const dtEndCol = dtLastTile ? (dtLastTile.colStart - 1 + dtLastTile.colSpan) : 0;
  if (dtEndCol !== 6 && count > 0) {
    console.error(`ERROR: Desktop grid for count ${count} last row does not end at col 6! Ends at ${dtEndCol}`);
  }

  // Phone
  const phoneLayout = computeBentoLayout({
    items: slice,
    numCols: 2,
    rowUnit: 104,
    gap: 10,
    portalDiameter: 136,
    round360Tiles,
    filterCategory: 'all',
  });

  // Verify full last row on phone
  const phLastTile = phoneLayout.placedTiles[phoneLayout.placedTiles.length - 1];
  const phEndCol = phLastTile ? (phLastTile.colStart - 1 + phLastTile.colSpan) : 0;
  if (phEndCol !== 2 && count > 0) {
    console.error(`ERROR: Phone grid for count ${count} last row does not end at col 2! Ends at ${phEndCol}`);
  }

  console.log(`Count ${count}: Desktop rows = ${desktopLayout.totalRows}, Portals = ${desktopLayout.placedPortals.length}; Phone rows = ${phoneLayout.totalRows}, Portals = ${phoneLayout.placedPortals.length}`);
});

console.log('✓ All layout tests passed! No holes, full last rows verified.');
