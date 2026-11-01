import connectDB from '../db.js';
import MediaItem from '../../models/MediaItem.js';
import { getOptimizedVideoUrl, getOptimizedPosterUrl, getOptimizedImageUrl } from '../videoOptimizer.js';

/**
 * Pure JSON mapper for a MediaItem document.
 */
export function mapMediaItem(doc) {
  if (!doc) return null;

  const id = doc._id ? doc._id.toString() : (doc.id ? String(doc.id) : '');
  const isVid = doc.mediaType === 'video';
  const isPano = Boolean(doc.is360 || doc.mediaType === 'pano360');

  const mapped = {
    id,
    _id: id,
    title: doc.title || '',
    caption: doc.caption || '',
    altText: doc.altText || doc.title || 'Resort Media',
    mediaType: doc.mediaType || 'image',
    type: isVid ? 'video' : 'photo',
    is360: isPano,
    secureUrl: isVid ? getOptimizedVideoUrl(doc.secureUrl) : getOptimizedImageUrl(doc.secureUrl),
    src: isVid ? getOptimizedVideoUrl(doc.secureUrl) : getOptimizedImageUrl(doc.secureUrl),
    posterUrl: isVid ? getOptimizedPosterUrl(doc.secureUrl, doc.posterUrl) : '',
    poster: isVid ? getOptimizedPosterUrl(doc.secureUrl, doc.posterUrl) : '',
    width: typeof doc.width === 'number' ? doc.width : 1920,
    height: typeof doc.height === 'number' ? doc.height : 1080,
    focus: doc.focus ? { x: doc.focus.x ?? 50, y: doc.focus.y ?? 50 } : { x: 50, y: 50 },
    displayAs: doc.displayAs || 'auto',
    tags: Array.isArray(doc.tags) ? [...doc.tags] : [],
    order: typeof doc.order === 'number' ? doc.order : 0,
    showOnHome: Boolean(doc.showOnHome),
    showInGallery: Boolean(doc.showInGallery),
    categoryId: doc.categoryId?._id ? doc.categoryId._id.toString() : (doc.categoryId ? doc.categoryId.toString() : null),
    categorySlug: doc.categoryId?.slug || '',
    categoryName: doc.categoryId?.name || '',
    roomId: doc.roomId?._id ? doc.roomId._id.toString() : (doc.roomId ? doc.roomId.toString() : null),
    roomSlug: doc.roomId?.slug || '',
    roomName: doc.roomId?.name || '',
    createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
  };

  return JSON.parse(JSON.stringify(mapped));
}

/**
 * Fetch media items intended for gallery display.
 */
export async function getGalleryMediaItems() {
  try {
    await connectDB();
    const items = await MediaItem.find({ isActive: true, showInGallery: true })
      .populate('categoryId', 'name slug coverImage isSpecial order')
      .populate('roomId', 'name slug mainImage order')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return items.map(mapMediaItem);
  } catch (err) {
    console.warn('[Media] Failed to fetch gallery media from MongoDB:', err.message);
    return [];
  }
}
