import { layoutRows } from '../lib/justifiedLayout.js';

const testAspects = [
  { type: 'photo', aspect: 4 / 3, name: 'Landscape 4:3' },
  { type: 'photo', aspect: 3 / 4, name: 'Portrait 3:4' },
  { type: 'photo', aspect: 1.0, name: 'Square 1:1' },
  { type: 'video', aspect: 9 / 16, name: 'Upright video 9:16' },
  { type: 'video', aspect: 16 / 9, name: 'Landscape video 16:9' },
  { type: 'photo', aspect: 3 / 1, name: 'Panorama 3:1' },
  { type: 'photo', aspect: 16 / 10, name: 'Wide 16:10' },
];

function runTests() {
  console.log('Running Justified-Rows Layout Engine Unit Tests...');
  let totalTests = 0;
  let passedTests = 0;

  const containerWidths = [390, 768, 1200, 1440, 1920];

  for (const cWidth of containerWidths) {
    const isPhone = cWidth < 768;

    for (let count = 1; count <= 40; count++) {
      totalTests++;
      const items = Array.from({ length: count }, (_, i) => {
        const sample = testAspects[i % testAspects.length];
        return {
          id: `item-${i}`,
          width: Math.round(1000 * sample.aspect),
          height: 1000,
          type: sample.type,
        };
      });

      const result = layoutRows(items, {
        containerWidth: cWidth,
        isPhone,
        round360Tiles: [{ id: 'p1', title: 'Portal 1' }, { id: 'p2', title: 'Portal 2' }],
      });

      // 1. Assert all items placed
      if (result.placedTiles.length !== count) {
        throw new Error(`Item count mismatch at width ${cWidth}, count ${count}: placed ${result.placedTiles.length}`);
      }

      // 2. Assert row widths equal container width
      for (const row of result.rows) {
        const rowTotalWidth = row.tiles.reduce((sum, t) => sum + t.width, 0) + (row.tiles.length - 1) * (isPhone ? 10 : 12);
        const diff = Math.abs(rowTotalWidth - cWidth);
        if (diff > 1.5 && row.tiles.length > 1) {
          throw new Error(`Row width difference exceeds 1px at width ${cWidth}, count ${count}: rowWidth=${rowTotalWidth}, containerWidth=${cWidth}`);
        }

        // 3. Assert no row taller or shorter than limits (except single items)
        if (row.tiles.length >= 2) {
          const minH = isPhone ? 160 : 250;
          const maxH = isPhone ? 320 : 460;
          if (row.height < minH || row.height > maxH) {
            throw new Error(`Row height out of bounds at width ${cWidth}, count ${count}: height=${row.height}`);
          }
        }
      }

      // 4. Assert no lonely tile on last row if total items >= 4
      if (count >= 4 && result.rows.length >= 2) {
        const lastRow = result.rows[result.rows.length - 1];
        if (lastRow.tiles.length === 1 && !isPhone) {
          throw new Error(`Lonely tile detected on last row at width ${cWidth}, count ${count}`);
        }
      }

      passedTests++;
    }
  }

  console.log(`\nAll ${passedTests} / ${totalTests} Layout Engine tests passed successfully!`);
}

runTests();

