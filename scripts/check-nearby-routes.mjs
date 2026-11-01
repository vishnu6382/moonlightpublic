import fs from 'node:fs';
import path from 'node:path';

// Haversine distance in meters
function calculateHaversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function runCheck() {
  console.log('=== CHECKING NEARBY ROUTES ALIGNMENT (npm run nearby:check) ===\n');

  const demoPath = path.resolve(process.cwd(), 'content/nearby.demo.json');
  const routesPath = path.resolve(process.cwd(), 'content/nearby.routes.json');

  if (!fs.existsSync(demoPath)) {
    console.error(`✗ Error: Demo places file not found at ${demoPath}`);
    process.exit(1);
  }
  if (!fs.existsSync(routesPath)) {
    console.error(`✗ Error: Routes file not found at ${routesPath}`);
    process.exit(1);
  }

  const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf8'));
  const routesData = JSON.parse(fs.readFileSync(routesPath, 'utf8'));

  const places = demoData.places || [];
  console.log(`Checking ${places.length} places against saved routes in nearby.routes.json...`);

  let failures = 0;

  for (const place of places) {
    const slug = slugify(place.name);
    const route = routesData[slug];

    if (!route || !route.geometry || !Array.isArray(route.geometry.coordinates) || route.geometry.coordinates.length < 2) {
      console.error(`✗ FAIL: Place "${place.name}" (${slug}) has no saved route or route geometry!`);
      failures++;
      continue;
    }

    const coords = route.geometry.coordinates;
    const lastPoint = coords[coords.length - 1]; // [lng, lat]
    const lastLng = lastPoint[0];
    const lastLat = lastPoint[1];

    const distMeters = calculateHaversineMeters(place.lat, place.lng, lastLat, lastLng);

    if (distMeters > 150) {
      console.error(
        `✗ FAIL: Place "${place.name}" route last point is ${distMeters.toFixed(1)}m from marker (limit: 150m). Marker: [${place.lat}, ${place.lng}], Route end: [${lastLat}, ${lastLng}]`
      );
      failures++;
    } else {
      console.log(`✓ OK: ${place.name} (endpoint offset: ${distMeters.toFixed(1)}m)`);
    }
  }

  console.log('\n----------------------------------------');
  if (failures > 0) {
    console.error(`FAILED: ${failures} places failed route check.`);
    process.exit(1);
  } else {
    console.log(`SUCCESS: All ${places.length} places have valid routes ending within 150m of marker.`);
    process.exit(0);
  }
}

runCheck().catch((err) => {
  console.error('Unexpected check error:', err);
  process.exit(1);
});
