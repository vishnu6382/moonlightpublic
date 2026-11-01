import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('Generating og-default.jpg (1200x630)...');

  const basePhotoPath = path.resolve('public/photos/temp/photo-10.webp');
  if (!fs.existsSync(basePhotoPath)) {
    throw new Error('Base photo not found: ' + basePhotoPath);
  }

  // Create an SVG overlay with dark gradient at bottom and resort branding
  const svgOverlay = Buffer.from(`
    <svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.15" />
          <stop offset="50%" stop-color="#000000" stop-opacity="0.35" />
          <stop offset="100%" stop-color="#000000" stop-opacity="0.85" />
        </linearGradient>
      </defs>
      <rect width="1200" height="630" fill="url(#grad)" />
      
      <!-- Top Eyebrow -->
      <text x="80" y="440" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#D4C76F" letter-spacing="4">NEDUNGULAM • TAMIL NADU</text>
      
      <!-- Resort Name -->
      <text x="80" y="510" font-family="Georgia, serif" font-size="56" font-weight="bold" fill="#FFFFFF" letter-spacing="1">Moon Light Resort</text>
      
      <!-- Tagline -->
      <text x="80" y="560" font-family="Arial, sans-serif" font-size="24" fill="#E2E8F0">Together Time in Nedungulam • Villas, Pool &amp; Open Spaces</text>
      
      <!-- Small Logo Icon top right -->
      <g transform="translate(1040, 60) scale(2.2)">
        <path d="M22 4.5 C13 4.5 6 11.5 6 20.5 C6 25 8 28.5 11 30.5 C7 28.5 4 24 4 19 C4 10.7 10.7 4 19 4 C20.5 4 22 4.3 22 4.5 Z" fill="#D4C76F"/>
        <circle cx="21" cy="9" r="1.5" fill="#FFFFFF"/>
      </g>
    </svg>
  `);

  await sharp(basePhotoPath)
    .resize(1200, 630, { fit: 'cover', position: 'center' })
    .composite([{ input: svgOverlay, blend: 'over' }])
    .jpeg({ quality: 88, chromaSubsampling: '4:4:4' })
    .toFile(path.resolve('public/og-default.jpg'));

  console.log('✓ Created public/og-default.jpg (1200x630)');

  // Generate apple-icon.png (180x180) from icon.svg
  const iconSvgPath = path.resolve('app/icon.svg');
  if (fs.existsSync(iconSvgPath)) {
    const iconSvgBuf = fs.readFileSync(iconSvgPath);
    await sharp(iconSvgBuf)
      .resize(180, 180)
      .png()
      .toFile(path.resolve('app/apple-icon.png'));
    console.log('✓ Created app/apple-icon.png (180x180)');
  }
}

main().catch(console.error);

