import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../lib/db.js';
import Room from '../models/Room.js';

async function check() {
  await connectDB();
  const rooms = await Room.find({}).lean();
  for (const r of rooms) {
    console.log('Room:', r.name);
    console.log('  pano360:', JSON.stringify(r.pano360));
    console.log('  photos:', r.photos?.length);
  }
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
