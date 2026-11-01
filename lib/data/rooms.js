import connectDB from '../db.js';
import Room from '../../models/Room.js';
import { generateSlug } from '../slug.js';
import { getOptimizedVideoUrl, getOptimizedPosterUrl, getOptimizedImageUrl } from '../videoOptimizer.js';

export { generateSlug };

/**
 * Pure JSON mapper for a Room document.
 * Guarantees that only plain JS objects and primitive values cross the Server -> Client boundary.
 */
export function mapRoomDocument(doc) {
  if (!doc) return null;

  const id = doc._id ? doc._id.toString() : (doc.id ? String(doc.id) : '');
  const mainImg = doc.mainImage || (doc.photos?.[0]?.src) || '';

  const photos = Array.isArray(doc.photos)
    ? doc.photos.map((p, idx) => {
        const pId = p._id ? p._id.toString() : `photo-${idx}`;
        const mediaId = p.mediaId ? p.mediaId.toString() : null;
        const src = typeof p === 'string' ? p : p.src;
        return {
          id: pId,
          _id: pId,
          mediaId,
          src: getOptimizedImageUrl(src),
          alt: p.alt || doc.name || 'Room Photo',
          caption: p.caption || '',
          width: typeof p.width === 'number' ? p.width : null,
          height: typeof p.height === 'number' ? p.height : null,
          focus: p.focus ? { x: p.focus.x ?? 50, y: p.focus.y ?? 50 } : { x: 50, y: 50 },
          displayAs: p.displayAs || 'auto',
          order: typeof p.order === 'number' ? p.order : idx,
          showOnHome: Boolean(p.showOnHome),
          showInGallery: Boolean(p.showInGallery),
        };
      }).filter((p) => Boolean(p.src))
    : [];

  const videos = Array.isArray(doc.videos)
    ? doc.videos.map((v, idx) => {
        const vId = v._id ? v._id.toString() : `video-${idx}`;
        const mediaId = v.mediaId ? v.mediaId.toString() : null;
        const src = typeof v === 'string' ? v : v.src;
        return {
          id: vId,
          _id: vId,
          mediaId,
          src: getOptimizedVideoUrl(src),
          poster: getOptimizedPosterUrl(src, v.poster || mainImg),
          title: v.title || `${doc.name} Video`,
          caption: v.caption || '',
          alt: v.alt || v.title || `${doc.name} Video`,
          width: typeof v.width === 'number' ? v.width : null,
          height: typeof v.height === 'number' ? v.height : null,
          durationSec: typeof v.durationSec === 'number' ? v.durationSec : null,
          displayAs: v.displayAs || 'auto',
          order: typeof v.order === 'number' ? v.order : idx,
          showOnHome: Boolean(v.showOnHome),
          showInGallery: Boolean(v.showInGallery),
        };
      }).filter((v) => Boolean(v.src))
    : [];

  let pano360 = null;
  if (doc.pano360 && (doc.pano360.src || typeof doc.pano360 === 'string')) {
    const pSrc = typeof doc.pano360 === 'string' ? doc.pano360.trim() : doc.pano360.src;
    pano360 = {
      mediaId: doc.pano360.mediaId ? doc.pano360.mediaId.toString() : null,
      src: pSrc,
      previewSrc: typeof doc.pano360 === 'string' ? pSrc : (doc.pano360.previewSrc || pSrc),
      caption: typeof doc.pano360 === 'string' ? `${doc.name} 360° View` : (doc.pano360.caption || `${doc.name} 360° View`),
      alt: typeof doc.pano360 === 'string' ? `${doc.name} Panorama` : (doc.pano360.alt || `${doc.name} Panorama`),
      is2to1: typeof doc.pano360 === 'string' ? true : (doc.pano360.is2to1 !== false),
      showOnHome: Boolean(doc.pano360.showOnHome),
      showInGallery: Boolean(doc.pano360.showInGallery),
    };
  }

  const facilities = Array.isArray(doc.facilities)
    ? doc.facilities.map((f) => ({
        name: typeof f === 'string' ? f.trim() : (f.name || '').trim(),
        icon: typeof f === 'object' ? (f.icon || '') : '',
      })).filter((f) => Boolean(f.name))
    : [];

  const features = Array.isArray(doc.features)
    ? doc.features.map((ft) => (typeof ft === 'string' ? ft.trim() : String(ft))).filter(Boolean)
    : [];

  const mapped = {
    id,
    _id: id,
    name: doc.name || '',
    slug: doc.slug || '',
    roomType: doc.roomType || '',
    bedType: doc.bedType || '',
    maxOccupancy: typeof doc.maxOccupancy === 'number' ? doc.maxOccupancy : null,
    numberOfRooms: typeof doc.numberOfRooms === 'number' ? doc.numberOfRooms : null,
    shortDescription: doc.shortDescription || '',
    description: doc.description || '',
    features,
    facilities,
    mainImage: getOptimizedImageUrl(mainImg),
    image: getOptimizedImageUrl(mainImg),
    photos,
    videos,
    pano360,
    order: typeof doc.order === 'number' ? doc.order : 0,
    isActive: Boolean(doc.isActive),
    featuredOnHome: Boolean(doc.featuredOnHome),
    seoTitle: doc.seoTitle || '',
    seoDescription: doc.seoDescription || '',
    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : null,
  };

  // Safe parse guarantee: completely strips any prototype or BSON object methods
  return JSON.parse(JSON.stringify(mapped));
}

/**
 * Fetch all published public rooms from MongoDB.
 * A room is only shown publicly if isActive is true AND it has at least one photo.
 */
export async function getPublicRooms() {
  try {
    await connectDB();

    const dbRooms = await Room.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (!dbRooms || dbRooms.length === 0) {
      return [];
    }

    const validRooms = dbRooms.filter(
      (r) => Boolean(r.mainImage) || (Array.isArray(r.photos) && r.photos.length > 0)
    );

    return validRooms.map(mapRoomDocument);
  } catch (err) {
    console.warn('[Rooms] Failed to fetch rooms from MongoDB:', err.message);
    return [];
  }
}

/**
 * Fetch a single active public room by its slug.
 */
export async function getPublicRoomBySlug(slug) {
  if (!slug) return null;

  try {
    await connectDB();
    const doc = await Room.findOne({ slug, isActive: true }).lean();
    if (!doc) return null;

    const mainImg = doc.mainImage || (doc.photos?.[0]?.src) || '';
    if (!mainImg && (!doc.photos || doc.photos.length === 0)) {
      return null;
    }

    return mapRoomDocument(doc);
  } catch (err) {
    console.warn(`[Rooms] Failed to fetch room "${slug}" from MongoDB:`, err.message);
    return null;
  }
}

/**
 * Fetch rooms featured on the Home page.
 * If any rooms have featuredOnHome: true, returns those.
 * Otherwise falls back to top active rooms by order so Home never displays an empty section.
 */
export async function getHomeFeaturedRooms() {
  const allRooms = await getPublicRooms();
  const featured = allRooms.filter((r) => r.featuredOnHome);
  if (featured.length > 0) {
    return featured;
  }
  return allRooms;
}
