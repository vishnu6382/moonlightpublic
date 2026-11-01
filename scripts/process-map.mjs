import https from 'https';
import fs from 'fs';
import path from 'path';

const TN_DISTRICTS = new Set([
  'Ariyalur',
  'Chengalputtu',
  'Chennai',
  'Coimbatore',
  'Cuddalore',
  'Dharmapuri',
  'Dindigul',
  'Erode',
  'Kallakurichi',
  'Kancheepuram',
  'Kanniyakumari',
  'Karur',
  'Krishnagiri',
  'Madurai',
  'Mayiladuthurai',
  'Nagapattinam',
  'Namakkal',
  'Perambalur',
  'Pudukkottai',
  'Ramanathapuram',
  'Ranipet',
  'Salem',
  'Sivaganga',
  'Tenkasi',
  'Thanjavur',
  'The Nilgiris',
  'Theni',
  'Thiruvallur',
  'Thiruvarur',
  'Thoothukkudi',
  'Tiruchirappalli',
  'Tirunelveli',
  'Tirupathur',
  'Tiruppur',
  'Tiruvannamalai',
  'Vellore',
  'Viluppuram',
  'Virudhunagar'
]);

// Mercator projection helper
function projectMercator(lng, lat) {
  const rad = Math.PI / 180;
  const x = lng;
  const latRad = Math.max(-85, Math.min(85, lat)) * rad;
  const y = Math.log(Math.tan(Math.PI / 4 + latRad / 2)) / rad;
  return [x, y];
}

// Douglas-Peucker point simplification
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

async function run() {
  console.log('Downloading geoBoundaries simplified geojson...');
  const url = 'https://media.githubusercontent.com/media/wmgeolab/geoBoundaries/9469f09592ced973a3448cf66b6100b741b64c0d/releaseData/gbOpen/IND/ADM2/geoBoundaries-IND-ADM2_simplified.geojson';
  
  const geojson = await new Promise((resolve, reject) => {
    https.get(url, res => {
      let chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))));
      res.on('error', reject);
    });
  });

  const tnFeatures = geojson.features.filter(f => TN_DISTRICTS.has(f.properties.shapeName));
  console.log(`Found ${tnFeatures.length} Tamil Nadu districts.`);

  // Find projected bounding box for Tamil Nadu
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;

  tnFeatures.forEach(f => {
    function scan(coords) {
      if (typeof coords[0] === 'number') {
        const [x, y] = projectMercator(coords[0], coords[1]);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      } else {
        coords.forEach(scan);
      }
    }
    scan(f.geometry.coordinates);
  });

  console.log(`Projected bounds: lng/X [${minX.toFixed(4)}, ${maxX.toFixed(4)}], lat/Y [${minY.toFixed(4)}, ${maxY.toFixed(4)}]`);

  // Target SVG coordinate space: Width 1000, height proportional
  const pad = 0.05; // 5% padding
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const paddedMinX = minX - spanX * pad;
  const paddedMaxX = maxX + spanX * pad;
  const paddedMinY = minY - spanY * pad;
  const paddedMaxY = maxY + spanY * pad;

  const SVG_WIDTH = 1000;
  const scale = SVG_WIDTH / (paddedMaxX - paddedMinX);
  const SVG_HEIGHT = Math.round((paddedMaxY - paddedMinY) * scale);

  function toSvgCoords(lng, lat) {
    const [x, y] = projectMercator(lng, lat);
    const svgX = Number(((x - paddedMinX) * scale).toFixed(1));
    const svgY = Number(((paddedMaxY - y) * scale).toFixed(1)); // invert Y
    return [svgX, svgY];
  }

  // District slug mapping
  const slugMap = {
    'Salem': 'salem',
    'Erode': 'erode',
    'Namakkal': 'namakkal',
    'Coimbatore': 'coimbatore',
    'Tiruppur': 'tiruppur',
    'Dharmapuri': 'dharmapuri',
    'Krishnagiri': 'krishnagiri',
    'Karur': 'karur',
    'Dindigul': 'dindigul',
    'Tiruchirappalli': 'tiruchirappalli',
    'Perambalur': 'perambalur',
    'Ariyalur': 'ariyalur',
    'Cuddalore': 'cuddalore',
    'Viluppuram': 'viluppuram',
    'Kallakurichi': 'kallakurichi',
    'Vellore': 'vellore',
    'Tirupathur': 'tirupathur',
    'Ranipet': 'ranipet',
    'Tiruvannamalai': 'tiruvannamalai',
    'Kancheepuram': 'kancheepuram',
    'Chengalputtu': 'chengalpattu',
    'Thiruvallur': 'thiruvallur',
    'Chennai': 'chennai',
    'Thanjavur': 'thanjavur',
    'Thiruvarur': 'thiruvarur',
    'Nagapattinam': 'nagapattinam',
    'Mayiladuthurai': 'mayiladuthurai',
    'Pudukkottai': 'pudukkottai',
    'Sivaganga': 'sivaganga',
    'Madurai': 'madurai',
    'Theni': 'theni',
    'Virudhunagar': 'virudhunagar',
    'Ramanathapuram': 'ramanathapuram',
    'Thoothukkudi': 'thoothukkudi',
    'Tirunelveli': 'tirunelveli',
    'Tenkasi': 'tenkasi',
    'Kanniyakumari': 'kanniyakumari',
    'The Nilgiris': 'the-nilgiris'
  };

  const districtsData = [];
  const tolerance = 0.5; // pixel tolerance in SVG coords

  for (const feature of tnFeatures) {
    const rawName = feature.properties.shapeName;
    const slug = slugMap[rawName] || rawName.toLowerCase().replace(/\s+/g, '-');
    const displayName = rawName === 'Chengalputtu' ? 'Chengalpattu'
      : rawName === 'Kancheepuram' ? 'Kanchipuram'
      : rawName === 'Thiruvallur' ? 'Tiruvallur'
      : rawName === 'Thiruvarur' ? 'Tiruvarur'
      : rawName === 'Thoothukkudi' ? 'Thoothukudi'
      : rawName === 'Kanniyakumari' ? 'Kanyakumari'
      : rawName;

    // Convert polygon coordinates to SVG path
    const geom = feature.geometry;
    const polygons = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;

    let pathD = '';
    let dMinX = Infinity, dMaxX = -Infinity, dMinY = Infinity, dMaxY = -Infinity;
    let sumX = 0, sumY = 0, totalPts = 0;

    for (const poly of polygons) {
      for (const ring of poly) {
        // Project points to SVG
        const svgPts = ring.map(pt => toSvgCoords(pt[0], pt[1]));
        const simplified = simplifyDP(svgPts, tolerance * tolerance);

        if (simplified.length < 3) continue;

        let ringD = '';
        simplified.forEach((pt, idx) => {
          if (idx === 0) ringD += `M${pt[0]} ${pt[1]}`;
          else ringD += `L${pt[0]} ${pt[1]}`;

          if (pt[0] < dMinX) dMinX = pt[0];
          if (pt[0] > dMaxX) dMaxX = pt[0];
          if (pt[1] < dMinY) dMinY = pt[1];
          if (pt[1] > dMaxY) dMaxY = pt[1];
          sumX += pt[0];
          sumY += pt[1];
          totalPts++;
        });
        ringD += 'Z';
        pathD += ringD;
      }
    }

    const bbox = {
      x: Math.round(dMinX),
      y: Math.round(dMinY),
      width: Math.round(dMaxX - dMinX),
      height: Math.round(dMaxY - dMinY)
    };
    const centroid = [
      Number((sumX / totalPts).toFixed(1)),
      Number((sumY / totalPts).toFixed(1))
    ];

    districtsData.push({
      slug,
      name: displayName,
      rawName,
      bbox,
      centroid,
      d: pathD
    });
  }

  // Sort districts so Salem, Erode, Namakkal can be easily recognized, but render all
  districtsData.sort((a, b) => a.name.localeCompare(b.name));

  const output = {
    viewBox: `0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`,
    width: SVG_WIDTH,
    height: SVG_HEIGHT,
    projection: {
      paddedMinX,
      paddedMaxX,
      paddedMinY,
      paddedMaxY,
      scale
    },
    districts: districtsData,
    credit: 'Boundary data: geoBoundaries Open (wmgeolab.org), ODbL 1.0 / Open Data Commons'
  };

  const outDir = path.resolve(process.cwd(), 'content/map');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonStr = JSON.stringify(output);
  const outPath = path.join(outDir, 'tamil-nadu-districts.json');
  fs.writeFileSync(outPath, jsonStr);

  // Also write an SVG file for direct inline import or inspection
  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}" fill="none">\n`;
  svgContent += `  <!-- ${output.credit} -->\n`;
  svgContent += `  <g id="tn-districts">\n`;
  for (const d of districtsData) {
    svgContent += `    <path id="district-${d.slug}" data-name="${d.name}" d="${d.d}" />\n`;
  }
  svgContent += `  </g>\n</svg>`;
  const svgPath = path.join(outDir, 'tamil-nadu-districts.svg');
  fs.writeFileSync(svgPath, svgContent);

  console.log(`Generated JSON map at ${outPath}: size = ${(jsonStr.length / 1024).toFixed(1)} KB`);
  console.log(`Generated SVG map at ${svgPath}: size = ${(svgContent.length / 1024).toFixed(1)} KB`);

  // Spot-check places projection
  console.log('\n--- Spot Checking Coordinates Projection ---');
  const demoData = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), 'nearby_demo_data.json'), 'utf8'));
  const testPlaces = [
    { name: 'Moon Light Resort (Idappadi)', lat: 11.58, lng: 77.85, district: 'salem' },
    { name: 'Mettur Dam', lat: 11.80, lng: 77.80, district: 'salem' },
    { name: 'Yercaud', lat: 11.7794, lng: 78.2034, district: 'salem' },
    { name: 'Bhavani Sangameshwarar Temple', lat: 11.447, lng: 77.684, district: 'erode' },
    { name: 'Kodiveri Dam', lat: 11.4731, lng: 77.2964, district: 'erode' },
    { name: 'Kolli Hills', lat: 11.3297, lng: 78.3933, district: 'namakkal' },
    { name: 'Arthanareeswarar Temple, Tiruchengode', lat: 11.379, lng: 77.8949, district: 'namakkal' }
  ];

  for (const tp of testPlaces) {
    const [sx, sy] = toSvgCoords(tp.lng, tp.lat);
    const dist = districtsData.find(d => d.slug === tp.district);
    const inBbox = dist && sx >= dist.bbox.x && sx <= dist.bbox.x + dist.bbox.width && sy >= dist.bbox.y && sy <= dist.bbox.y + dist.bbox.height;
    console.log(`${tp.name}: SVG [${sx}, ${sy}] -> inside ${tp.district} bbox: ${inBbox} (bbox: x=${dist?.bbox.x}, y=${dist?.bbox.y}, w=${dist?.bbox.width}, h=${dist?.bbox.height})`);
  }
}

run().catch(console.error);
