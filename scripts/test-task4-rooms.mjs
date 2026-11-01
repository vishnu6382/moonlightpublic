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

import connectDB from '../lib/db.js';
import Room from '../models/Room.js';
import MediaItem from '../models/MediaItem.js';
import { generateSlug, getPublicRooms, getPublicRoomBySlug, seedInitialRoomsIfEmpty } from '../lib/rooms.js';
import { signSessionToken, verifySessionToken } from '../lib/auth.js';
import { validateMediaFile, validatePano360AspectRatio } from '../lib/imageCompressor.js';

async function runTask4Tests() {
  console.log('====================================================');
  console.log('   MOON LIGHT RESORT — TASK 4 ROOMS & MEDIA TESTS   ');
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
    // TEST GROUP 1: DATABASE & INITIAL SEEDING
    // ----------------------------------------------------
    console.log('--- TEST GROUP 1: DATABASE & INITIAL SEEDING ---');
    await connectDB();
    assert(true, 'Connected to MongoDB successfully');

    // Run seedInitialRoomsIfEmpty
    await seedInitialRoomsIfEmpty();
    const seededRooms = await Room.find({}).sort({ order: 1 });
    assert(seededRooms.length >= 4, `Database initialized with at least 4 rooms (Found: ${seededRooms.length})`);

    const moon1 = seededRooms.find((r) => r.slug === 'moon-1');
    assert(Boolean(moon1 && moon1.name === 'Moon 1'), 'Found seeded "Moon 1" room with correct name and slug');

    // ----------------------------------------------------
    // TEST GROUP 2: SLUG GENERATION & VALIDATION
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 2: SLUG GENERATION & VALIDATION ---');
    assert(generateSlug('Moon 1') === 'moon-1', 'Generates clean slug "moon-1" from "Moon 1"');
    assert(generateSlug('  Deluxe Pool Villa #5!  ') === 'deluxe-pool-villa-5', 'Handles special characters and spaces correctly');
    assert(generateSlug('ROOM---TEST') === 'room-test', 'Normalizes multiple consecutive hyphens');

    // ----------------------------------------------------
    // TEST GROUP 3: ROOM CRUD OPERATIONS
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 3: ROOM CRUD OPERATIONS ---');

    // 1. Create a test room
    const testSlug = `test-room-${Date.now()}`;
    const newRoomData = {
      name: 'Automated Test Suite Suite',
      slug: testSlug,
      roomType: 'Presidential Suite',
      bedType: 'King Bed',
      maxOccupancy: 4,
      numberOfRooms: 2,
      shortDescription: 'Short test description',
      description: 'Comprehensive full test description for testing Task 4.',
      features: ['Private Jacuzzi', 'Sunset View'],
      facilities: [{ name: 'Air-Conditioning', icon: 'ac' }, { name: 'Attached Bathroom', icon: 'bath' }],
      mainImage: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
      photos: [
        {
          src: 'https://res.cloudinary.com/demo/image/upload/sample.jpg',
          alt: 'Sample Photo',
          caption: 'Living Area',
          order: 0,
          showOnHome: true,
          showInGallery: true,
        },
      ],
      videos: [],
      pano360: {
        src: 'https://res.cloudinary.com/demo/image/upload/pano.jpg',
        is2to1: true,
        caption: '360 View of Suite',
        showOnHome: false,
        showInGallery: false,
      },
      order: 99,
      isActive: true,
    };

    const createdRoom = await Room.create(newRoomData);
    assert(Boolean(createdRoom._id), 'Successfully created test room in MongoDB');
    assert(createdRoom.slug === testSlug, 'Slug saved accurately');
    assert(createdRoom.features.length === 2, 'Features array saved properly');
    assert(createdRoom.facilities.length === 2, 'Facilities array saved properly');

    // 2. Duplicate slug prevention
    let duplicateRejected = false;
    try {
      await Room.create({
        name: 'Another Room',
        slug: testSlug, // duplicate
      });
    } catch (e) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, 'Rejected duplicate slug on Room creation');

    // 3. Edit Room (preserve unchanged fields)
    const updatedRoom = await Room.findByIdAndUpdate(
      createdRoom._id,
      { $set: { roomType: 'Updated Suite Type', maxOccupancy: 6 } },
      { returnDocument: 'after' }
    );
    assert(updatedRoom.roomType === 'Updated Suite Type', 'Updated roomType successfully');
    assert(updatedRoom.maxOccupancy === 6, 'Updated maxOccupancy successfully');
    assert(updatedRoom.name === 'Automated Test Suite Suite', 'Preserved unchanged room name');
    assert(updatedRoom.slug === testSlug, 'Preserved unchanged room slug');

    // 4. Quick Visibility Toggle
    const hiddenRoom = await Room.findByIdAndUpdate(
      createdRoom._id,
      { $set: { isActive: false } },
      { returnDocument: 'after' }
    );
    assert(hiddenRoom.isActive === false, 'Successfully toggled room to hidden (isActive: false)');

    // ----------------------------------------------------
    // TEST GROUP 4: MEDIA ASSOCIATION & SAFE DELETION
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 4: MEDIA ASSOCIATION & SAFE DELETION ---');

    // Create a mock media record associated with this test room
    const mockMedia = await MediaItem.create({
      cloudinaryPublicId: `test/asset-${Date.now()}`,
      secureUrl: 'https://res.cloudinary.com/demo/image/upload/test-asset.jpg',
      resourceType: 'image',
      mediaType: 'image',
      format: 'jpg',
      sizeBytes: 102400,
      width: 1920,
      height: 1080,
      title: 'Associated Room Photo',
      roomId: createdRoom._id,
      showOnHome: false,
      showInGallery: false,
      isActive: true,
    });
    assert(Boolean(mockMedia._id), 'Created media item associated with test room');
    assert(mockMedia.roomId.toString() === createdRoom._id.toString(), 'MediaItem correctly references Room ID');

    // Test safe delete: unlinking MediaItem without deleting asset
    await MediaItem.updateMany({ roomId: createdRoom._id }, { $set: { roomId: null } });
    await Room.findByIdAndDelete(createdRoom._id);

    const checkRoom = await Room.findById(createdRoom._id);
    assert(checkRoom === null, 'Test room deleted from MongoDB');

    const checkMedia = await MediaItem.findById(mockMedia._id);
    assert(Boolean(checkMedia), 'MediaItem record still safely exists after room deletion');
    assert(checkMedia.roomId === null, 'MediaItem roomId safely unlinked to null');

    // Clean up mock media
    await MediaItem.findByIdAndDelete(mockMedia._id);

    // ----------------------------------------------------
    // TEST GROUP 5: ORIGINAL IMAGE QUALITY REQUIREMENT
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 5: ORIGINAL IMAGE QUALITY REQUIREMENT ---');

    // Check that MediaUpload source code does NOT invoke compressImage or canvas drawing
    const mediaUploadCode = fs.readFileSync(
      path.resolve(process.cwd(), 'components/MediaUpload/index.jsx'),
      'utf8'
    );
    assert(
      !mediaUploadCode.includes('compressImage('),
      'MediaUpload does not call compressImage on upload path'
    );
    assert(
      mediaUploadCode.includes('const fileToUpload = item.originalFile;'),
      'MediaUpload passes untouched item.originalFile directly to Cloudinary'
    );
    assert(
      !mediaUploadCode.includes('document.createElement(\'canvas\')') &&
      !mediaUploadCode.includes('canvas.toBlob'),
      'MediaUpload does not re-encode image through canvas'
    );

    // ----------------------------------------------------
    // TEST GROUP 6: 360° PANORAMA ASPECT RATIO VALIDATION
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 6: 360° PANORAMA ASPECT RATIO (2:1) ---');
    assert(validatePano360AspectRatio(4096, 2048).valid === true, 'Accepts 2:1 ratio (4096x2048)');
    assert(validatePano360AspectRatio(6000, 3000).valid === true, 'Accepts 2:1 ratio (6000x3000)');
    assert(validatePano360AspectRatio(1920, 1080).valid === false, 'Rejects 16:9 ratio (1920x1080) with clear error');

    // Check Pano360Viewer component reuse
    const panoViewerCode = fs.readFileSync(
      path.resolve(process.cwd(), 'components/Pano360Viewer/index.jsx'),
      'utf8'
    );
    assert(panoViewerCode.includes('Math.abs(ratio - 2.0) > 0.2'), 'Pano360Viewer validates 2:1 aspect ratio');
    assert(panoViewerCode.includes('THREE.SphereGeometry'), 'Pano360Viewer uses Three.js sphere projection');

    // ----------------------------------------------------
    // TEST GROUP 7: PUBLIC WEBSITE INTEGRATION
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 7: PUBLIC WEBSITE INTEGRATION ---');

    const publicRooms = await getPublicRooms();
    assert(Array.isArray(publicRooms) && publicRooms.length >= 4, `getPublicRooms() returned ${publicRooms.length} active rooms from MongoDB`);

    const publicMoon1 = await getPublicRoomBySlug('moon-1');
    assert(Boolean(publicMoon1), 'getPublicRoomBySlug("moon-1") returned Moon 1 from MongoDB');
    assert(publicMoon1.name === 'Moon 1', 'Returned correct room name "Moon 1"');
    assert(publicMoon1.slug === 'moon-1', 'Returned correct slug');
    assert(Array.isArray(publicMoon1.facilities), 'Facilities array is present');
    assert(Array.isArray(publicMoon1.photos), 'Photos array is present');

    // Verify inactive room exclusion
    const tempInactive = await Room.create({
      name: 'Hidden Private Room',
      slug: `hidden-room-${Date.now()}`,
      isActive: false,
    });

    const activeList = await getPublicRooms();
    const foundInactiveInPublic = activeList.some((r) => r.slug === tempInactive.slug);
    assert(!foundInactiveInPublic, 'Hidden room (isActive: false) is correctly excluded from public rooms list');

    const fetchHiddenDirect = await getPublicRoomBySlug(tempInactive.slug);
    assert(fetchHiddenDirect === null, 'getPublicRoomBySlug returns null for inactive room');

    // Clean up temp inactive room
    await Room.findByIdAndDelete(tempInactive._id);

    // ----------------------------------------------------
    // TEST GROUP 8: AUTHENTICATION ENFORCEMENT
    // ----------------------------------------------------
    console.log('\n--- TEST GROUP 8: AUTHENTICATION ENFORCEMENT ---');

    const validToken = await signSessionToken({ email: process.env.ADMIN_EMAIL || 'admin@moonlightresort.com' });
    const verified = await verifySessionToken(validToken);
    assert(Boolean(verified && verified.role === 'admin'), 'Admin session token signs and verifies successfully');

    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.token';
    const fakeVerified = await verifySessionToken(fakeToken);
    assert(fakeVerified === null, 'Tampered session token is rejected');

    console.log('\n====================================================');
    console.log(`TOTAL PASSED: ${passed}`);
    console.log(`TOTAL FAILED: ${failed}`);
    console.log('====================================================\n');

    if (failed > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal test error:', err);
    process.exit(1);
  }
}

runTask4Tests();
