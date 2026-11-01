import fs from 'fs';
import path from 'path';

// Load .env.local
const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envLocalPath)) {
  const content = fs.readFileSync(envLocalPath, 'utf8');
  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.substring(0, idx).trim();
        let val = trimmed.substring(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  });
}

import cloudinary, { deleteCloudinaryAsset } from '../lib/cloudinary.js';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function testRealCloudinary() {
  console.log('--- STARTING REAL CLOUDINARY UPLOAD & DELETION TEST ---');
  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // 1x1 base64 transparent PNG
  const tinyTestImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

  let uploadedPublicId = null;

  try {
    console.log('1. Uploading temporary 1x1 test image to Cloudinary:');
    const uploadRes = await cloudinary.uploader.upload(tinyTestImage, {
      folder: 'moonlight_resort_test',
      tags: ['task3_test'],
    });

    uploadedPublicId = uploadRes.public_id;
    assert(!!uploadedPublicId && !!uploadRes.secure_url, `Test image uploaded successfully (public_id: ${uploadedPublicId})`);
    assert(uploadRes.bytes > 0, `Asset size reported by Cloudinary: ${uploadRes.bytes} bytes`);

    console.log('\n2. Testing Cloudinary asset resource verification:');
    const resourceInfo = await cloudinary.api.resource(uploadedPublicId);
    assert(resourceInfo.public_id === uploadedPublicId, 'Cloudinary confirmed asset belongs to configured account');

    console.log('\n3. Testing permanent deletion from Cloudinary:');
    const delRes = await deleteCloudinaryAsset(uploadedPublicId, 'image');
    assert(delRes.result === 'ok', `Cloudinary deletion confirmed with result: "${delRes.result}"`);

    // Verify asset is truly deleted
    let existsAfterDelete = true;
    try {
      await cloudinary.api.resource(uploadedPublicId);
    } catch (e) {
      if (e.error?.http_code === 404 || e.message?.includes('not found') || e.http_code === 404) {
        existsAfterDelete = false;
      }
    }
    assert(existsAfterDelete === false, 'Confirmed asset no longer exists in Cloudinary (404 Not Found)');

  } catch (err) {
    console.error('Real Cloudinary test error:', err);
    // Cleanup if upload succeeded before failure
    if (uploadedPublicId) {
      try {
        await deleteCloudinaryAsset(uploadedPublicId, 'image');
      } catch (e) {}
    }
    failed++;
  }

  console.log(`\n--- REAL CLOUDINARY TEST: ${passed} PASSED, ${failed} FAILED ---`);
  if (failed > 0) process.exit(1);
  process.exit(0);
}

testRealCloudinary();
