import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../lib/db.js';
import MediaItem from '../models/MediaItem.js';

async function check() {
  await connectDB();
  const media = await MediaItem.findById('6ae219dddc01d15cc083b7a9').lean();
  console.log('Media doc:', JSON.stringify(media, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
