import 'dotenv/config';
import connectDB from '../lib/db.js';
import MediaItem from '../models/MediaItem.js';
import Room from '../models/Room.js';
import cloudinary from '../lib/cloudinary.js';

async function backfill() {
  console.log('Connecting to MongoDB...');
  await connectDB();

  console.log('Fetching media records from MediaItem collection...');
  const mediaItems = await MediaItem.find({
    $or: [{ width: null }, { height: null }, { width: { $exists: false } }, { height: { $exists: false } }],
  });

  console.log(`Found ${mediaItems.length} MediaItem records lacking width/height dimensions.`);

  let updatedMediaCount = 0;
  for (const item of mediaItems) {
    if (!item.cloudinaryPublicId) continue;
    try {
      const res = await cloudinary.api.resource(item.cloudinaryPublicId, {
        resource_type: item.resourceType || 'image',
      });
      if (res) {
        item.width = res.width || item.width || null;
        item.height = res.height || item.height || null;
        item.format = res.format || item.format || '';
        item.sizeBytes = res.bytes || item.sizeBytes || 0;
        if (res.duration) item.durationSec = res.duration;
        await item.save();
        updatedMediaCount++;
        console.log(`  Updated MediaItem: ${item.cloudinaryPublicId} -> ${item.width}x${item.height}`);
      }
    } catch (err) {
      console.warn(`  Could not fetch metadata for ${item.cloudinaryPublicId}: ${err.message}`);
    }
  }

  // Also backfill embedded photos on rooms
  console.log('\nChecking embedded room photos...');
  const rooms = await Room.find({});
  let updatedRoomsCount = 0;

  for (const room of rooms) {
    let modified = false;
    for (const photo of room.photos || []) {
      if ((!photo.width || !photo.height) && photo.src) {
        // Try to match with MediaItem
        let match = photo.mediaId ? await MediaItem.findById(photo.mediaId) : null;
        if (!match) {
          // Match by secureUrl
          match = await MediaItem.findOne({ secureUrl: photo.src });
        }
        if (match && match.width && match.height) {
          photo.width = match.width;
          photo.height = match.height;
          if (match.focus) photo.focus = match.focus;
          modified = true;
        } else if (photo.src.includes('res.cloudinary.com')) {
          // Extract public_id and query cloudinary
          const m = photo.src.match(/\/upload\/(?:v\d+\/)?([^.?#]+)/);
          if (m && m[1]) {
            try {
              const res = await cloudinary.api.resource(m[1], { resource_type: 'image' });
              if (res) {
                photo.width = res.width;
                photo.height = res.height;
                modified = true;
              }
            } catch (e) {
              // ignore
            }
          }
        }
      }
    }

    if (modified) {
      await room.save();
      updatedRoomsCount++;
      console.log(`  Updated room photos metadata for: ${room.name}`);
    }
  }

  console.log(`\nBackfill summary:`);
  console.log(`- MediaItem documents updated: ${updatedMediaCount}`);
  console.log(`- Rooms with updated photo dimensions: ${updatedRoomsCount}`);
  process.exit(0);
}

backfill().catch((err) => {
  console.error('Backfill error:', err);
  process.exit(1);
});

