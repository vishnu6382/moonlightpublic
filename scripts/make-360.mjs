import sharp from 'sharp';
import fs from 'fs';

async function create360() {
  const dest = 'public/photos/temp/test-360.jpg';
  if (fs.existsSync(dest)) {
    console.log('test-360.jpg already exists');
    return;
  }
  const width = 2048;
  const height = 1024;
  
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#2B2620" />
        <stop offset="50%" stop-color="#4A4339" />
        <stop offset="100%" stop-color="#1F1B16" />
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#D4C76F" stop-opacity="0.5" />
        <stop offset="100%" stop-color="#2B2620" stop-opacity="0" />
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)" />
    <circle cx="1024" cy="512" r="400" fill="url(#glow)" />
    <text x="1024" y="490" font-family="sans-serif" font-size="44" font-weight="bold" fill="#FFFFFF" text-anchor="middle">MOON LIGHT RESORT</text>
    <text x="1024" y="550" font-family="sans-serif" font-size="26" fill="#D4C76F" text-anchor="middle">360° EQUIRECTANGULAR ROOM PANORAMA</text>
  </svg>
  `;
  
  await sharp(Buffer.from(svg)).jpeg({ quality: 90 }).toFile(dest);
  console.log('Created valid 2:1 test-360.jpg successfully!');
}

create360().catch(console.error);
