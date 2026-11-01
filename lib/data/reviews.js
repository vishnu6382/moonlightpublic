import connectDB from '../db.js';
import Review from '../../models/Review.js';

/**
 * Pure JSON mapper for Review documents.
 */
export function mapReview(doc) {
  if (!doc) return null;
  const id = doc._id ? doc._id.toString() : (doc.id ? String(doc.id) : '');
  const mapped = {
    id,
    _id: id,
    author: doc.author || 'Resort Guest',
    guestName: doc.author || 'Resort Guest',
    rating: typeof doc.rating === 'number' ? doc.rating : 5,
    text: doc.text || '',
    date: doc.dateText || '',
    dateText: doc.dateText || '',
    source: doc.source || 'Google',
    originalLink: doc.originalLink || '',
    order: typeof doc.order === 'number' ? doc.order : 0,
    isPublished: Boolean(doc.isPublished),
  };
  return JSON.parse(JSON.stringify(mapped));
}

/**
 * Fetch all published reviews from MongoDB.
 * If 0 reviews, returns [] so the public page section is cleanly hidden.
 */
export async function getPublicReviews() {
  try {
    await connectDB();
    const reviews = await Review.find({ isPublished: true })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    if (!reviews || reviews.length === 0) {
      return [];
    }

    return reviews.map(mapReview);
  } catch (err) {
    console.warn('[Reviews] Failed to fetch reviews from MongoDB:', err.message);
    return [];
  }
}
