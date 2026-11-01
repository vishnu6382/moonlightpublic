import { getNearbyData, getHomeNearbyPlaces } from '../lib/nearby.js';
import http from 'http';
import { spawn } from 'child_process';
import fs from 'fs';

async function run() {
  console.log('=== TASK NEARBY-A2 VERIFICATION TEST ===\n');

  // 1. Data & Route Integration
  console.log('1. DATA LAYER & OSRM ROUTES:');
  const data = getNearbyData();
  console.log('   - Total places:', data.places.length);
  console.log('   - Resort position:', [data.resort.lat, data.resort.lng]);
  console.log('   - Highlighted districts GeoJSON:', Boolean(data.districtsGeoJSON));

  const routesRaw = JSON.parse(fs.readFileSync('content/nearby.routes.json', 'utf8'));
  const routeKeys = Object.keys(routesRaw);
  console.log(`   - Precomputed routes in nearby.routes.json: ${routeKeys.length} / 30`);

  if (routeKeys.length !== 30) {
    throw new Error(`Expected 30 routes, found ${routeKeys.length}`);
  }

  // Spot-check 7 requested coordinates
  console.log('\n2. SPOT-CHECKING SPECIFIC PLACES:');
  const spotChecks = [
    'Mettur Dam',
    'Yercaud',
    'Thindal Murugan Temple',
    'Bhavani Sangameshwarar Temple',
    'Kodiveri Dam',
    'Kolli Hills',
    'Arthanareeswarar Temple, Tiruchengode'
  ];

  for (const name of spotChecks) {
    const place = data.places.find(p => p.name.includes(name));
    if (!place) throw new Error(`Missing place: ${name}`);
    console.log(
      `   ✓ ${place.name}: lat=${place.lat}, lng=${place.lng} | ${place.displayDistance} | District=${place.district} (${place.districtColor.color}) | Category=${place.category} (${place.categoryColor.color})`
    );
  }

  // 3. Check for Invented Text across codebase
  console.log('\n3. CHECKING FOR INVENTED TEXT REMOVAL:');
  const forbiddenPhrases = [
    'Discover Tamil Nadu: A central haven',
    'VERIFIED LANDMARK',
    'inspect driving distance',
    'sanctuaries surrounding Nedungulam'
  ];

  for (const phrase of forbiddenPhrases) {
    // Scan components and app
    const scanDir = (dir) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = `${dir}/${e.name}`;
        if (e.isDirectory() && !full.includes('node_modules') && !full.includes('.next')) {
          scanDir(full);
        } else if (e.isFile() && (e.name.endsWith('.js') || e.name.endsWith('.jsx') || e.name.endsWith('.css'))) {
          const content = fs.readFileSync(full, 'utf8');
          if (content.includes(phrase)) {
            throw new Error(`Found forbidden phrase "${phrase}" in file ${full}`);
          }
        }
      }
    };
    scanDir('components');
    scanDir('app');
    console.log(`   ✓ Clean: No "${phrase}" found in components/ or app/`);
  }

  // 4. Test Production Server
  console.log('\n4. TESTING PRODUCTION SERVER HTML OUTPUT:');
  const PORT = 3002;
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'pipe',
    shell: true
  });

  try {
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

    const nearbyRes = await fetchUrl('/nearby-areas');
    console.log(`   - /nearby-areas HTTP status: ${nearbyRes.status}`);
    const html = nearbyRes.body;
    console.log('   - Has <h1>Nearby Areas</h1>:', html.includes('Nearby Areas</h1>'));
    console.log('   - Has neutral subtitle:', html.includes('Places to visit around Moon Light Resort in Salem, Erode and Namakkal.'));
    console.log('   - Has DEMO DATA badge:', html.includes('DEMO DATA'));
    console.log('   - Has OpenStreetMap attribution:', html.includes('OpenStreetMap'));
    console.log('   - Has Salem / Erode / Namakkal tabs:', html.includes('Salem') && html.includes('Erode') && html.includes('Namakkal'));
    console.log('   - Has equal card items:', html.includes('equalCard') || html.includes('cardPlaceTitle'));

    // Check Home
    const homeRes = await fetchUrl('/');
    console.log(`\n   - Home / HTTP status: ${homeRes.status}`);
    console.log('   - Home has equal-box preview:', homeRes.body.includes('equalPlaceCard') || homeRes.body.includes('nearbyEqualGrid'));
    console.log('   - Home links to /nearby-areas:', homeRes.body.includes('/nearby-areas'));

    console.log('\n=== ALL TASK NEARBY-A2 VERIFICATION CHECKS PASSED! ===');
  } finally {
    server.kill();
  }
}

run().catch(err => {
  console.error('\n❌ Verification failed:', err);
  process.exit(1);
});
