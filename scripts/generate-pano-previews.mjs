import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generatePanoPreviews() {
  const dir = path.join(process.cwd(), 'public', 'generated');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Look for 360 photo
  const candidates = [
    'public/photos/temp/test-360.jpeg',
    'public/photos/temp/test-360.jpg',
    'public/test-360.jpg',
    'public/test-360.png',
  ];

  let srcPath = null;
  for (const c of candidates) {
    const full = path.join(process.cwd(), c);
    if (fs.existsSync(full)) {
      srcPath = full;
      break;
    }
  }

  if (!srcPath) {
    console.log('[Pano Preview] No 360 source image found, skipping.');
    return;
  }

  // Generate previews for Moon 1 through Moon 11
  for (let i = 1; i <= 11; i++) {
    const dest = path.join(dir, `pano-preview-moon-${i}.jpg`);
    try {
      await sharp(srcPath)
        .resize(900, 450, { fit: 'cover' })
        .jpeg({ quality: 84 })
        .toFile(dest);
    } catch (err) {
      console.warn(`[Pano Preview] Failed generating preview for Moon ${i}:`, err.message);
    }
  }
  console.log('[Pano Preview] Generated 900x450 previews in public/generated/');
}

await generatePanoPreviews();
