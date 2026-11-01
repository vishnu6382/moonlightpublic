import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../lib/db.js';

async function run() {
  const mongoose = await connectDB();
  const col = mongoose.connection.db.collection('sitesettings');
  const res = await col.updateMany(
    {},
    {
      $set: {
        phone: '+91 98944 86300',
        phoneRaw: '+919894486300',
        whatsapp: '+91 98944 86300',
      },
    }
  );
  console.log('MongoDB sitesettings updated:', res.modifiedCount);

  // Also check if any other collection has the old number
  const homeContentCol = mongoose.connection.db.collection('homecontents');
  const hcDocs = await homeContentCol.find({}).toArray();
  for (const doc of hcDocs) {
    let str = JSON.stringify(doc);
    if (str.includes('9842044300') || str.includes('98420 44300') || str.includes('9087844300')) {
      str = str.replace(/9842044300/g, '9894486300')
               .replace(/98420 44300/g, '98944 86300')
               .replace(/9087844300/g, '9894486300');
      const updatedDoc = JSON.parse(str);
      const { _id, ...rest } = updatedDoc;
      await homeContentCol.updateOne({ _id: doc._id }, { $set: rest });
      console.log('Updated homecontents doc:', doc._id);
    }
  }

  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
