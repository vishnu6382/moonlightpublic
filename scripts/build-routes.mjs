import https from 'https';
import fs from 'fs';
import path from 'path';

// Douglas-Peucker point simplification for route coordinates [lng, lat]
function getSqDist(p1, p2) {
  const dx = p1[0] - p2[0];
  const dy = p1[1] - p2[1];
  return dx * dx + dy * dy;
}

function getSqSegDist(p, p1, p2) {
  let x = p1[0], y = p1[1];
  let dx = p2[0] - x, dy = p2[1] - y;
  if (dx !== 0 || dy !== 0) {
    const t = ((p[0] - x) * dx + ((p[1] - y) * dy)) / (dx * dx + dy * dy);
    if (t > 1) {
      x = p2[0];
      y = p2[1];
    } else if (t > 0) {
      x += dx * t;
      y += dy * t;
    }
  }
  dx = p[0] - x;
  dy = p[1] - y;
  return dx * dx + dy * dy;
}

function simplifyDP(points, sqTolerance) {
  const len = points.length;
  if (len <= 2) return points;
  let maxSqDist = 0;
  let index = 0;
  for (let i = 1; i < len - 1; i++) {
    const sqDist = getSqSegDist(points[i], points[0], points[len - 1]);
    if (sqDist > maxSqDist) {
      maxSqDist = sqDist;
      index = i;
    }
  }
  if (maxSqDist > sqTolerance) {
    const left = simplifyDP(points.slice(0, index + 1), sqTolerance);
    const right = simplifyDP(points.slice(index), sqTolerance);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[len - 1]];
}

function simplifyRoutePoints(coords, maxPoints = 140) {
  if (!coords || coords.length <= maxPoints) return coords;
  let tol = 0.0001;
  let simplified = coords;
  for (let iter = 0; iter < 10; iter++) {
    simplified = simplifyDP(coords, tol * tol);
    if (simplified.length <= maxPoints) break;
    tol *= 1.8;
  }
  return simplified;
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(
      url,
      {
        headers: {
          'User-Agent': 'MoonLightResort-RouteBuilder/1.0'
        }
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}`));
        }
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }
    ).on('error', reject);
  });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

async function run() {
  console.log('=== BUILDING REAL DRIVING ROUTES VIA OSRM ===\n');

  const demoPath = path.resolve(process.cwd(), 'content/nearby.demo.json');
  const demoData = JSON.parse(fs.readFileSync(demoPath, 'utf8'));

  const resort = demoData.resort;
  const places = demoData.places;

  console.log(`Resort at Idappadi: [${resort.lng}, ${resort.lat}]`);
  console.log(`Processing ${places.length} places...\n`);

  const routes = {};
  const successes = [];
  const failures = [];

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const slug = slugify(place.name);
    const url = `https://router.project-osrm.org/route/v1/driving/${resort.lng},${resort.lat};${place.lng},${place.lat}?overview=full&geometries=geojson`;

    process.stdout.write(`[${i + 1}/${places.length}] ${place.name} ... `);

    try {
      const resp = await fetchJson(url);
      if (resp && resp.routes && resp.routes.length > 0) {
        const primaryRoute = resp.routes[0];
        const distanceKm = Number((primaryRoute.distance / 1000).toFixed(1));
        const durationMin = Math.round(primaryRoute.duration / 60);

        const rawCoords = primaryRoute.geometry?.coordinates || [];
        const simplifiedCoords = simplifyRoutePoints(rawCoords, 140);

        routes[slug] = {
          slug,
          name: place.name,
          distanceKm,
          durationMin,
          geometry: {
            type: 'LineString',
            coordinates: simplifiedCoords
          }
        };

        successes.push({ name: place.name, distanceKm, durationMin });
        console.log(`✓ ${distanceKm} km, ~${durationMin} min (${simplifiedCoords.length} pts)`);
      } else {
        failures.push({ name: place.name, reason: 'No routes returned' });
        console.log(`✗ No routes found`);
      }
    } catch (err) {
      failures.push({ name: place.name, reason: err.message });
      console.log(`✗ Error: ${err.message}`);
    }

    // Wait 1.1s between requests to be polite to the public OSRM demo server
    if (i < places.length - 1) {
      await sleep(1100);
    }
  }

  // Save to content/nearby.routes.json
  const outJsonPath = path.resolve(process.cwd(), 'content/nearby.routes.json');
  fs.writeFileSync(outJsonPath, JSON.stringify(routes, null, 2));

  // Also save a JS module for universal import
  const outJsPath = path.resolve(process.cwd(), 'content/nearby.routes.js');
  fs.writeFileSync(outJsPath, `const routesData = ${JSON.stringify(routes, null, 2)};\nexport default routesData;\n`);

  console.log(`\n========================================`);
  console.log(`Route generation complete!`);
  console.log(`Success: ${successes.length} / ${places.length}`);
  console.log(`Failures: ${failures.length}`);
  if (failures.length > 0) {
    console.log(`Failed places:`, failures);
  }
  console.log(`Saved output to ${outJsonPath} and ${outJsPath}`);
}

run().catch(console.error);
