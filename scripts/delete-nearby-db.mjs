import dotenv from 'dotenv';
dotenv.config();
import connectDB from '../lib/db.js';

async function run() {
  const mongoose = await connectDB();
  const placesCol = mongoose.connection.db.collection('places');
  const count = await placesCol.countDocuments();
  console.log('Places before deletion:', count);

  const deleteResult = await placesCol.deleteMany({});
  console.log('Places deleted count:', deleteResult.deletedCount);

  // Check homecontents for any embedded nearby sections or arrays
  const homeCol = mongoose.connection.db.collection('homecontents');
  const hcDocs = await homeCol.find({}).toArray();
  for (const doc of hcDocs) {
    if (doc.nearby || doc.featuredPlaces || doc.places) {
      console.log('Cleaning nearby fields in homecontents doc:', doc._id);
      await homeCol.updateOne(
        { _id: doc._id },
        { $unset: { nearby: '', featuredPlaces: '', places: '' } }
      );
    }
  }

  console.log('Finished clearing nearby data from MongoDB.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Error during cleanup:', err);
  process.exit(1);
});
