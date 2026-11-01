import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../lib/db.js';
import HomeContent from '../models/HomeContent.js';

async function check() {
  await connectDB();
  const hc = await HomeContent.findOne({ key: 'home_singleton' }).lean();
  console.log('--- SHOWCASE PORTAL ITEM ---');
  console.log(JSON.stringify(hc?.showcase?.portalItem, null, 2));
  process.exit(0);
}

check().catch(e => { console.error(e); process.exit(1); });
