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

import {
  validateMediaFile,
  validatePano360AspectRatio,
} from '../lib/imageCompressor.js';
import cloudinary, { generateUploadSignature, deleteCloudinaryAsset } from '../lib/cloudinary.js';
import connectDB from '../lib/db.js';
import MediaItem from '../models/MediaItem.js';
import { signSessionToken, verifySessionToken } from '../lib/auth.js';

async function runTask3Tests() {
  console.log('====================================================');
  console.log('   MOON LIGHT RESORT — TASK 3 MEDIA TEST SUITE     ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`[PASS] ${message}`);
      passed++;
    } else {
      console.error(`[FAIL] ${message}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST GROUP 1: FILE VALIDATION RULES
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: FILE VALIDATION RULES ---');

    // 1. Valid Image
    const validImage = { name: 'resort.jpg', type: 'image/jpeg', size: 5 * 1024 * 1024 };
    assert(validateMediaFile(validImage, 'image').valid === true, 'Accepts valid JPEG under 20MB');

    // 2. Unsupported Image Format (e.g. .bmp, .gif, .exe)
    const invalidImage = { name: 'test.bmp', type: 'image/bmp', size: 1024 };
    assert(validateMediaFile(invalidImage, 'image').valid === false, 'Rejects unsupported image format (.bmp)');

    // 3. Oversized Image (> 20 MB)
    const oversizedImage = { name: 'huge.jpg', type: 'image/jpeg', size: 21 * 1024 * 1024 };
    const overImgRes = validateMediaFile(oversizedImage, 'image');
    assert(overImgRes.valid === false && overImgRes.error.includes('20 MB'), 'Rejects image exceeding 20 MB');

    // 4. Valid Video
    const validVideo = { name: 'pool.mp4', type: 'video/mp4', size: 45 * 1024 * 1024 };
    assert(validateMediaFile(validVideo, 'video').valid === true, 'Accepts MP4 video under 100 MB');

    // 5. Oversized Video (> 100 MB)
    const oversizedVideo = { name: 'tour.mp4', type: 'video/mp4', size: 105 * 1024 * 1024 };
    const overVidRes = validateMediaFile(oversizedVideo, 'video');
    assert(overVidRes.valid === false && overVidRes.error.includes('100 MB'), 'Rejects video exceeding 100 MB');

    // 6. Unsupported Video Format
    const invalidVideo = { name: 'clip.avi', type: 'video/avi', size: 10 * 1024 * 1024 };
    assert(validateMediaFile(invalidVideo, 'video').valid === false, 'Rejects unsupported video format (.avi)');

    // ----------------------------------------------------
    // TEST GROUP 2: 360° EQUIRTECTANGULAR ASPECT RATIO
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: 360° PANORAMA ASPECT RATIO (2:1) ---');

    // 7. Valid 2:1 ratio (4096 x 2048)
    const validPano = validatePano360AspectRatio(4096, 2048);
    assert(validPano.valid === true, 'Accepts exact 2:1 ratio (4096x2048)');

    // 8. Valid 2:1 ratio (6000 x 3000)
    const validPano2 = validatePano360AspectRatio(6000, 3000);
    assert(validPano2.valid === true, 'Accepts exact 2:1 ratio (6000x3000)');

    // 9. Invalid non-2:1 ratio (1920 x 1080 -> 1.77:1)
    const invalidPano = validatePano360AspectRatio(1920, 1080);
    assert(invalidPano.valid === false && invalidPano.error.includes('2:1'), 'Rejects 16:9 standard photo (1920x1080) for 360° panorama');

    // 10. Invalid square ratio (2048 x 2048 -> 1:1)
    const squarePano = validatePano360AspectRatio(2048, 2048);
    assert(squarePano.valid === false, 'Rejects 1:1 square photo for 360° panorama');

    // ----------------------------------------------------
    // TEST GROUP 3: CLOUDINARY SIGNATURE GENERATION
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: SECURE SIGNED UPLOAD CONFIGURATION ---');
    const timestamp = Math.round(Date.now() / 1000);
    const signature = generateUploadSignature({ folder: 'moonlight_resort', timestamp });
    assert(typeof signature === 'string' && signature.length === 40, 'Generates valid 40-character SHA-1 Cloudinary signature');

    // ----------------------------------------------------
    // TEST GROUP 4: SESSION ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: SESSION PROTECTION ---');
    const nullSession = await verifySessionToken(null);
    assert(nullSession === null, 'Missing session token fails verification');

    const adminToken = await signSessionToken({ email: 'admin@moonlightresort.com' });
    const verifiedSession = await verifySessionToken(adminToken);
    assert(verifiedSession && verifiedSession.email === 'admin@moonlightresort.com', 'Valid admin session verified successfully');

    // ----------------------------------------------------
    // TEST GROUP 5: FORGED ASSET METADATA VALIDATION
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: CLOUDINARY ASSET VALIDATION (REJECTION OF FORGED ASSETS) ---');
    let forgedRejection = false;
    try {
      await cloudinary.api.resource('non_existent_forged_public_id_12345');
    } catch (cErr) {
      forgedRejection = true;
    }
    assert(forgedRejection === true, 'Cloudinary resource lookup correctly rejects non-existent/forged public ID');

    // ----------------------------------------------------
    // TEST GROUP 6: MONGODB REGISTRATION & VISIBILITY FLAGS
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: MONGODB MEDIA REGISTRATION & VISIBILITY ---');
    await connectDB();

    const testPublicId = `test_asset_${Date.now()}`;
    const testSecureUrl = `https://res.cloudinary.com/test/image/upload/${testPublicId}.jpg`;

    const savedMedia = await MediaItem.create({
      provider: 'cloudinary',
      cloudinaryPublicId: testPublicId,
      secureUrl: testSecureUrl,
      resourceType: 'image',
      mediaType: 'image',
      width: 1920,
      height: 1080,
      sizeBytes: 154000,
      format: 'jpg',
      title: 'Test Resort Photo',
      showOnHome: false,
      showInGallery: true,
      isActive: true,
    });

    assert(savedMedia._id && savedMedia.cloudinaryPublicId === testPublicId, 'Media item saved successfully to MongoDB');
    assert(savedMedia.showOnHome === false && savedMedia.showInGallery === true, 'Independent visibility flags (showOnHome=false, showInGallery=true)');

    // Test toggle showOnHome independently
    savedMedia.showOnHome = true;
    await savedMedia.save();
    const updatedMedia = await MediaItem.findById(savedMedia._id);
    assert(updatedMedia.showOnHome === true && updatedMedia.showInGallery === true, 'showOnHome toggled to true without changing showInGallery');

    // Test Hide (isActive = false)
    updatedMedia.isActive = false;
    await updatedMedia.save();
    const hiddenMedia = await MediaItem.findById(savedMedia._id);
    assert(hiddenMedia.isActive === false, 'Media item successfully hidden (isActive=false) in database without deleting asset');

    // Test Permanent Delete cleanup from MongoDB
    await MediaItem.findByIdAndDelete(savedMedia._id);
    const deletedCheck = await MediaItem.findById(savedMedia._id);
    assert(deletedCheck === null, 'Media record cleanly deleted from MongoDB');

  } catch (err) {
    console.error('Fatal test error:', err);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`  TASK 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================\n');

  if (failed > 0) process.exit(1);
  process.exit(0);
}

runTask3Tests();
