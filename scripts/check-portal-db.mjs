import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../lib/db.js';
import HomeContent from '../models/HomeContent.js';

async function check() {
  await connectDB();
  const hc = await HomeContent.findOne({ key: 'home_singleton' }).lean();
  console.log('portalItem in DB:', hc?.showcase?.portalItem);
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
