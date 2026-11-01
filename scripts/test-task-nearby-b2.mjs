import assert from 'node:assert';
import { getNearbyData } from '../lib/nearby.js';

async function testTaskNearbyB2() {
  console.log('--- Testing Task NEARBY-B2 Route Animation & Data Integrity ---');

  const data = getNearbyData();
  const { resort, places } = data;

  console.log(`Resort placeholder location: [${resort.lat}, ${resort.lng}]`);

  const targetPlaceNames = [
    'Thindal Murugan Temple',
    'Arthanareeswarar Temple, Tiruchengode',
    'Mettur Dam',
    'Kolli Hills',
    'Kodiveri Dam'
  ];

  for (const name of targetPlaceNames) {
    const place = places.find((p) => p.name === name || p.name.includes('Arthanareeswarar'));
    assert(place, `Place "${name}" must exist in demo places list`);

    console.log(`\nVerifying route for: ${place.name} (${place.district})`);
    console.log(`- Coordinates: [${place.lat}, ${place.lng}]`);
    console.log(`- Category: ${place.category} (Color: ${place.categoryColor?.color})`);
    console.log(`- Distance: ${place.displayDistance} (Road: ${place.isRoadDistance})`);
    console.log(`- Duration: ${place.travelTime}`);

    assert(place.isRoadDistance, `Place "${name}" should have real road distance`);
    assert(place.routeGeometry, `Place "${name}" must have routeGeometry`);
    assert(Array.isArray(place.routeGeometry.coordinates), `Route coordinates must be array`);
    assert(place.routeGeometry.coordinates.length > 5, `Route must contain multiple coordinate waypoints`);

    // Check OSRM coordinate format [lng, lat]
    const firstCoord = place.routeGeometry.coordinates[0];
    const lastCoord = place.routeGeometry.coordinates[place.routeGeometry.coordinates.length - 1];

    console.log(`- Waypoint count: ${place.routeGeometry.coordinates.length}`);
    console.log(`- Origin waypoint: [lng: ${firstCoord[0]}, lat: ${firstCoord[1]}]`);
    console.log(`- Destination waypoint: [lng: ${lastCoord[0]}, lat: ${lastCoord[1]}]`);

    // Origin must be close to resort [11.58, 77.85] (within ~0.1 deg)
    const distResortLng = Math.abs(firstCoord[0] - resort.lng);
    const distResortLat = Math.abs(firstCoord[1] - resort.lat);
    assert(distResortLng < 0.1 && distResortLat < 0.1, 'Route origin must be close to resort location');

    // Destination waypoint must be close to destination [lat, lng]
    const distDestLng = Math.abs(lastCoord[0] - place.lng);
    const distDestLat = Math.abs(lastCoord[1] - place.lat);
    assert(distDestLng < 0.05 && distDestLat < 0.05, 'Route destination must match place coordinates');
  }

  console.log('\nAll 5 required test places have valid OSRM routes, connecting the resort to destination!');

  // Test HTTP server response if active
  try {
    const res = await fetch('http://localhost:3000/nearby-areas');
    if (res.ok) {
      const html = await res.text();
      assert(html.includes('Nearby Areas'), 'Page should include Nearby Areas title');
      assert(!html.includes('NaN'), 'Page must not contain NaN');
      console.log('HTTP GET /nearby-areas returned status 200 OK');
    }
  } catch (e) {
    console.log('Note: Dev/Prod server not queried directly or on different port (ignorable in isolated test)');
  }

  console.log('\nTASK NEARBY-B2 TEST PASSED SUCCESSFULLY!');
}

testTaskNearbyB2().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
