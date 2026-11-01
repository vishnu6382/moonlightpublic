import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../lib/db.js';
import Room from '../models/Room.js';
import MediaItem from '../models/MediaItem.js';

async function check() {
  await connectDB();
  const rooms = await Room.find({}).lean();
  console.log('--- ROOMS 360 CHECK ---');
  for (const r of rooms) {
    console.log('Room:', r.name, '| slug:', r.slug, '| pano360Url:', r.pano360Url, '| has360:', r.has360);
    if (r.photos) {
      r.photos.forEach(p => {
        if (p.is360 || p.mediaType === 'pano360') console.log('  Photo 360:', p.url);
      });
    }
  }
  const media360 = await MediaItem.find({ $or: [{ is360: true }, { mediaType: 'pano360' }] }).lean();
  console.log('--- MEDIA ITEMS 360 COUNT:', media360.length);
  media360.forEach(m => console.log('Media 360:', m.secureUrl, '| width:', m.width, '| height:', m.height));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
