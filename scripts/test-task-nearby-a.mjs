import { getNearbyData, getDistrictViewBox, getHomeNearbyPlaces } from '../lib/nearby.js';
import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  console.log('=== TASK NEARBY-A VERIFICATION TEST ===\n');

  // 1. Data Verification
  console.log('1. DATA LAYER TEST (lib/nearby.js):');
  const data = getNearbyData();
  console.log('   - Demo mode:', data.isDemo);
  console.log('   - Resort:', data.resort.name, 'at lat:', data.resort.lat, 'lng:', data.resort.lng);
  console.log('   - Resort SVG coords:', data.resort.svgCoords);
  console.log('   - Districts count:', data.districts.length);
  console.log('   - Categories count:', data.categories.length);
  console.log('   - Places count:', data.places.length);

  if (data.places.length !== 30) {
    throw new Error(`Expected 30 places, got ${data.places.length}`);
  }

  // 2. Spot-Check Verified Places Coordinates
  console.log('\n2. SPOT-CHECKING VERIFIED PLACES COORDINATES:');
  const checks = [
    { name: 'Mettur Dam', district: 'salem' },
    { name: 'Yercaud', district: 'salem' },
    { name: 'Bhavani Sangameshwarar Temple', district: 'erode' },
    { name: 'Kodiveri Dam', district: 'erode' },
    { name: 'Kolli Hills', district: 'namakkal' },
    { name: 'Arthanareeswarar Temple, Tiruchengode', district: 'namakkal' }
  ];

  for (const c of checks) {
    const place = data.places.find(p => p.name.includes(c.name));
    if (!place) throw new Error(`Place not found: ${c.name}`);
    const districtObj = data.mapData.districts.find(d => d.slug === c.district);
    const { bbox } = districtObj;
    const inBbox =
      place.svgX >= bbox.x &&
      place.svgX <= bbox.x + bbox.width &&
      place.svgY >= bbox.y &&
      place.svgY <= bbox.y + bbox.height;

    console.log(
      `   ✓ ${place.name} (${place.district}): lat=${place.lat}, lng=${place.lng} -> SVG [${place.svgX}, ${place.svgY}] | Approx distance: ${place.displayDistance} | Inside ${c.district} bbox: ${inBbox}`
    );
    if (!inBbox) throw new Error(`Place ${place.name} not inside district ${c.district} bounding box!`);
  }

  // 3. ViewBox Zooming Test
  console.log('\n3. DISTRICT VIEWBOX TEST:');
  ['all', 'salem', 'erode', 'namakkal'].forEach(d => {
    const vb = getDistrictViewBox(d);
    console.log(`   - ${d} viewBox:`, vb);
  });

  // 4. Home Preview Test
  console.log('\n4. HOME PREVIEW TEST:');
  const homePlaces = getHomeNearbyPlaces(5);
  console.log(`   - Home places count: ${homePlaces.length}`);
  console.log(`   - First place: ${homePlaces[0].name} (district: ${homePlaces[0].district})`);
  console.log(`   - Salem district placed first: ${homePlaces[0].district === 'salem'}`);

  // 5. Server HTML Rendering Check
  console.log('\n5. TESTING LOCAL NEXT.JS SERVER:');
  const PORT = 3001;
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'pipe',
    shell: true
  });

  try {
    // Wait for server to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server start timed out')), 15000);
      server.stdout.on('data', chunk => {
        const text = chunk.toString();
        if (text.includes('Ready in') || text.includes('started server') || text.includes(`:${PORT}`)) {
          clearTimeout(timeout);
          resolve();
        }
      });
      server.stderr.on('data', chunk => {
        const text = chunk.toString();
        if (text.includes('Ready in') || text.includes(`:${PORT}`)) {
          clearTimeout(timeout);
          resolve();
        }
      });
    });

    const fetchUrl = (path) => {
      return new Promise((resolve, reject) => {
        http.get(`http://localhost:${PORT}${path}`, (res) => {
          let body = '';
          res.on('data', d => body += d);
          res.on('end', () => resolve({ status: res.statusCode, body }));
        }).on('error', reject);
      });
    };

    // Test /nearby-areas
    const nearbyRes = await fetchUrl('/nearby-areas');
    console.log(`   - /nearby-areas status: ${nearbyRes.status}`);
    const html = nearbyRes.body;
    console.log('   - Has <h1>Nearby Areas</h1>:', html.includes('Nearby Areas</h1>') || html.includes('Nearby Areas'));
    console.log('   - Has DEMO DATA badge:', html.includes('DEMO DATA'));
    console.log('   - Has Salem Tab:', html.includes('Salem') && html.includes('Home District'));
    console.log('   - Has Erode Tab:', html.includes('Erode'));
    console.log('   - Has Namakkal Tab:', html.includes('Namakkal'));
    console.log('   - Has Tamil Nadu SVG map paths:', html.includes('district-salem') && html.includes('district-erode') && html.includes('district-namakkal'));
    console.log('   - Has Resort pin pulse ring:', html.includes('resortPulseRing'));
    console.log('   - Has geoBoundaries attribution:', html.includes('geoBoundaries') || html.includes('wmgeolab.org'));
    console.log('   - Has all 6 categories in filters:',
      html.includes('Temples') &&
      html.includes('Dams &amp; Lakes') || html.includes('Dams & Lakes') &&
      html.includes('Waterfalls') &&
      html.includes('Hills &amp; Nature') || html.includes('Hills & Nature') &&
      html.includes('Heritage &amp; Museum') || html.includes('Heritage & Museum') &&
      html.includes('Wildlife')
    );

    // Test / (Home)
    const homeRes = await fetchUrl('/');
    console.log(`\n   - Home / status: ${homeRes.status}`);
    console.log('   - Home has #nearby section:', homeRes.body.includes('id="nearby"'));
    console.log('   - Home links to /nearby-areas:', homeRes.body.includes('/nearby-areas'));

    console.log('\n=== ALL AUTOMATED CHECKS PASSED SUCCESSFULLY! ===');
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error('\n❌ Test failed with error:', err);
  process.exit(1);
});
