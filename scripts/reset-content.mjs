import fs from 'fs';
import path from 'path';
import readline from 'readline';
import dns from 'dns';
import mongoose from 'mongoose';
import { v2 as cloudinary } from 'cloudinary';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (_) {}

// Load environment variables
if (fs.existsSync('.env.local')) {
  process.loadEnvFile('.env.local');
} else if (fs.existsSync('.env')) {
  process.loadEnvFile('.env');
}

import connectDB from '../lib/db.js';

const isDryRun = process.argv.includes('--dry-run') || process.argv.includes('-d');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

async function main() {
  console.log('='.repeat(70));
  console.log(` MOON LIGHT RESORT - CONTENT RESET TOOL [${isDryRun ? 'DRY-RUN PREVIEW' : 'WIPE MODE'}]`);
  console.log('='.repeat(70));

  console.log('Connecting to MongoDB Atlas...');
  await connectDB();
  console.log('✅ Connected to MongoDB.\n');

  // Load models dynamically
  const Room = mongoose.models.Room || mongoose.model('Room', new mongoose.Schema({}, { strict: false }));
  const MediaItem = mongoose.models.MediaItem || mongoose.model('MediaItem', new mongoose.Schema({}, { strict: false }));
  const Place = mongoose.models.Place || mongoose.model('Place', new mongoose.Schema({}, { strict: false }));
  const GalleryCategory = mongoose.models.GalleryCategory || mongoose.model('GalleryCategory', new mongoose.Schema({}, { strict: false }));
  const HomeContent = mongoose.models.HomeContent || mongoose.model('HomeContent', new mongoose.Schema({}, { strict: false }));
  const Event = mongoose.models.Event || mongoose.model('Event', new mongoose.Schema({}, { strict: false }));

  // Query MongoDB
  const [rooms, mediaItems, places, galleryCategories, homeContent, events] = await Promise.all([
    Room.find({}).lean(),
    MediaItem.find({}).lean(),
    Place.find({}).lean(),
    GalleryCategory.find({}).lean(),
    HomeContent.find({}).lean(),
    Event.find({}).lean(),
  ]);

  // Query Cloudinary
  let cloudinaryImages = [];
  let cloudinaryVideos = [];
  let cloudinaryError = null;

  try {
    const imgRes = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'moonlight_resort/',
      max_results: 500,
      resource_type: 'image',
    });
    cloudinaryImages = imgRes.resources || [];

    const vidRes = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'moonlight_resort/',
      max_results: 500,
      resource_type: 'video',
    });
    cloudinaryVideos = vidRes.resources || [];
  } catch (err) {
    cloudinaryError = err.message;
  }

  // Print Summary Table
  console.log('📊 CURRENT DATABASE & CLOUDINARY INVENTORY:');
  console.log('----------------------------------------------------------------------');
  console.log(`  Rooms in MongoDB:              ${rooms.length}`);
  console.log(`  Media Items in MongoDB:        ${mediaItems.length}`);
  console.log(`  Nearby Places in MongoDB:      ${places.length}`);
  console.log(`  Gallery Categories in MongoDB: ${galleryCategories.length}`);
  console.log(`  HomeContent Overrides:         ${homeContent.length}`);
  console.log(`  Cloudinary Images (prefix):    ${cloudinaryImages.length}`);
  console.log(`  Cloudinary Videos (prefix):    ${cloudinaryVideos.length}`);
  if (cloudinaryError) {
    console.log(`  Cloudinary Notice:             ${cloudinaryError}`);
  }
  console.log('----------------------------------------------------------------------\n');

  // Detailed breakdowns
  if (rooms.length > 0) {
    console.log('🏨 ROOMS TO BE WIPED:');
    rooms.forEach((r, idx) => {
      console.log(`   ${idx + 1}. [${r.slug || 'no-slug'}] ${r.name || 'Unnamed'} (Photos: ${r.photos?.length || 0}, Active: ${Boolean(r.isActive)})`);
    });
    console.log('');
  } else {
    console.log('🏨 ROOMS: Empty (0 rooms in database).\n');
  }

  if (mediaItems.length > 0) {
    console.log(`📸 MEDIA ITEMS TO BE WIPED (${mediaItems.length} records):`);
    mediaItems.slice(0, 15).forEach((m, idx) => {
      console.log(`   ${idx + 1}. [${m.mediaType || 'image'}] ${m.title || m.originalFilename || 'Media'} (Public ID: ${m.cloudinaryPublicId || 'none'})`);
    });
    if (mediaItems.length > 15) {
      console.log(`   ... and ${mediaItems.length - 15} more media items.`);
    }
    console.log('');
  } else {
    console.log('📸 MEDIA ITEMS: Empty (0 media items in database).\n');
  }

  if (places.length > 0) {
    console.log('📍 NEARBY PLACES TO BE WIPED:');
    places.forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.name} (${p.district}, ${p.category}) - ${p.distanceKm || '~'} km`);
    });
    console.log('');
  } else {
    console.log('📍 NEARBY PLACES: Empty (0 places in database).\n');
  }

  if (cloudinaryImages.length > 0 || cloudinaryVideos.length > 0) {
    console.log(`☁️  CLOUDINARY ASSETS TO BE DELETED (${cloudinaryImages.length + cloudinaryVideos.length} total):`);
    [...cloudinaryImages, ...cloudinaryVideos].slice(0, 10).forEach((c, idx) => {
      console.log(`   ${idx + 1}. ${c.public_id} (${c.resource_type}, ${(c.bytes / 1024).toFixed(1)} KB)`);
    });
    if (cloudinaryImages.length + cloudinaryVideos.length > 10) {
      console.log(`   ... and ${cloudinaryImages.length + cloudinaryVideos.length - 10} more Cloudinary assets.`);
    }
    console.log('');
  } else {
    console.log('☁️  CLOUDINARY: No assets found under moonlight_resort/ folder.\n');
  }

  if (isDryRun) {
    console.log('='.repeat(70));
    console.log('🛡️  DRY-RUN COMPLETE: No database records were modified or deleted.');
    console.log('   No Cloudinary assets were touched.');
    console.log('='.repeat(70));
    await mongoose.disconnect();
    process.exit(0);
  }

  // WIPE MODE (Only executed when explicitly run without dry-run)
  const backupDir = path.resolve(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `content-${timestamp}.json`);

  const backupData = {
    timestamp: new Date().toISOString(),
    rooms,
    mediaItems,
    places,
    galleryCategories,
    homeContent,
    cloudinaryAssets: [...cloudinaryImages, ...cloudinaryVideos].map((c) => ({
      public_id: c.public_id,
      resource_type: c.resource_type,
      secure_url: c.secure_url,
    })),
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf-8');
  console.log(`💾 Full backup saved to: ${backupFile}\n`);

  const hasForceFlag = process.argv.includes('--force') || process.argv.includes('-y');
  let answer = hasForceFlag ? 'RESET' : null;

  if (!answer) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    answer = await new Promise((resolve) => {
      rl.question(
        '⚠️  Type RESET to permanently wipe all rooms, media, places, showcase overrides and Cloudinary uploads: ',
        (ans) => {
          rl.close();
          resolve(ans.trim());
        }
      );
    });
  }

  if (answer !== 'RESET') {
    console.log('\n❌ Confirmation mismatch. Wipe cancelled. Nothing was deleted.');
    await mongoose.disconnect();
    process.exit(0);
  }

  console.log('\n🚨 Performing permanent content reset...');

  // 1. Wipe collections
  const delRooms = await Room.deleteMany({});
  const delMedia = await MediaItem.deleteMany({});
  const delPlaces = await Place.deleteMany({});
  const delCats = await GalleryCategory.deleteMany({});
  const delEvents = await Event.deleteMany({});

  // 2. Reset HomeContent singleton to empty defaults
  await HomeContent.deleteMany({});
  await HomeContent.create({
    key: 'home_singleton',
    logo: { url: '', mediaId: null, alt: 'Moon Light Resort', showText: true },
    showcase: {
      title: 'Captured Moments of Serenity',
      subtitle: 'Villas, pool and open spaces at Moon Light Resort.',
      pills: ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
      portalItem: null,
      items: [],
    },
    stay: {
      label: 'MOON LIGHT RESORT · NEDUNGULAM, TAMIL NADU',
      title: 'Together Time in Nedungulam',
      heading: 'A simple, comfortable base for families and groups.',
      paragraph: 'Surrounded by open nature and tranquil breezes...',
      checkInTime: '13:00',
      checkOutTime: '11:00',
      featurePills: ['Pure Nature', 'Private Pool', 'Spacious Grounds', 'Family Stays'],
    },
  });

  // 3. Delete Cloudinary assets
  let deletedCloudinaryCount = 0;
  for (const asset of [...cloudinaryImages, ...cloudinaryVideos]) {
    try {
      await cloudinary.uploader.destroy(asset.public_id, {
        resource_type: asset.resource_type,
        invalidate: true,
      });
      deletedCloudinaryCount++;
    } catch (cErr) {
      console.warn(`Failed to delete Cloudinary asset ${asset.public_id}:`, cErr.message);
    }
  }

  console.log('\n✅ PERMANENT CONTENT RESET COMPLETED SUCCESSFULLY:');
  console.log(`   - Rooms deleted:           ${delRooms.deletedCount}`);
  console.log(`   - Media Items deleted:     ${delMedia.deletedCount}`);
  console.log(`   - Places deleted:          ${delPlaces.deletedCount}`);
  console.log(`   - Categories deleted:      ${delCats.deletedCount}`);
  console.log(`   - HomeContent reset to:    Fresh empty state`);
  console.log(`   - Cloudinary assets wiped: ${deletedCloudinaryCount}`);
  console.log(`   - Admin credentials:       Preserved intact\n`);

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌ Fatal error during content reset:', err);
  process.exit(1);
});
