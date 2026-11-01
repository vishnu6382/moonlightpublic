import connectDB from './db.js';
import Room from '../models/Room.js';
import HomeContent from '../models/HomeContent.js';
import Event from '../models/Event.js';
import Place from '../models/Place.js';
import MediaItem from '../models/MediaItem.js';

/**
 * Finds all places across the website where a specific media asset appears.
 * Checks Rooms (hero, photos, videos, pano360), HomeContent, Events, Places, and Gallery.
 *
 * @param {string} mediaId - Mongo ID of the MediaItem
 * @param {string} [secureUrl] - Optional secure URL of the asset
 * @returns {Promise<Array<{ page: string, section: string, label: string, url: string, editUrl: string }>>}
 */
export async function getMediaUsage(mediaId, secureUrl = '') {
  await connectDB();
  const idStr = mediaId ? String(mediaId) : '';
  const urlStr = secureUrl ? String(secureUrl).trim() : '';

  const usages = [];

  // 1. Check Rooms
  const rooms = await Room.find({}).lean();
  for (const r of rooms) {
    const isHero =
      (idStr && r.mainMediaId && String(r.mainMediaId) === idStr) ||
      (urlStr && r.mainImage === urlStr);
    if (isHero) {
      usages.push({
        page: `Room: ${r.name}`,
        section: 'Hero Image',
        label: `${r.name} — Cover Banner`,
        url: `/rooms/${r.slug}`,
        editUrl: `/admin/rooms?id=${r._id}`,
      });
    }

    (r.photos || []).forEach((p, idx) => {
      const match =
        (idStr && p.mediaId && String(p.mediaId) === idStr) ||
        (urlStr && p.src === urlStr);
      if (match) {
        usages.push({
          page: `Room: ${r.name}`,
          section: 'Room Gallery',
          label: `${r.name} — Photo #${idx + 1}${p.caption ? ` (${p.caption})` : ''}`,
          url: `/rooms/${r.slug}#gallery`,
          editUrl: `/admin/rooms?id=${r._id}`,
        });
      }
    });

    (r.videos || []).forEach((v, idx) => {
      const match =
        (idStr && v.mediaId && String(v.mediaId) === idStr) ||
        (urlStr && v.src === urlStr);
      if (match) {
        usages.push({
          page: `Room: ${r.name}`,
          section: 'Room Video',
          label: `${r.name} — Video #${idx + 1}${v.title ? ` (${v.title})` : ''}`,
          url: `/rooms/${r.slug}#gallery`,
          editUrl: `/admin/rooms?id=${r._id}`,
        });
      }
    });

    if (r.pano360) {
      const pSrc = typeof r.pano360 === 'string' ? r.pano360 : r.pano360.src;
      const pId = typeof r.pano360 === 'object' ? r.pano360.mediaId : null;
      const match =
        (idStr && pId && String(pId) === idStr) ||
        (urlStr && pSrc === urlStr);
      if (match) {
        usages.push({
          page: `Room: ${r.name}`,
          section: '360° Portal',
          label: `${r.name} — 360° Virtual Tour`,
          url: `/rooms/${r.slug}`,
          editUrl: `/admin/rooms?id=${r._id}`,
        });
      }
    }
  }

  // 2. Check Home Content
  try {
    const home = await HomeContent.findOne({}).lean();
    if (home) {
      if (urlStr && home.hero?.image === urlStr) {
        usages.push({
          page: 'Home Page',
          section: 'Hero Banner',
          label: 'Home — Main Hero Background',
          url: '/#hero',
          editUrl: '/admin/home-content',
        });
      }
      if (urlStr && home.stay?.image === urlStr) {
        usages.push({
          page: 'Home Page',
          section: 'Stay Section',
          label: 'Home — Stay Feature Photo',
          url: '/#stay',
          editUrl: '/admin/home-content',
        });
      }
      (home.facilities?.items || []).forEach((item, idx) => {
        if (urlStr && item.image === urlStr) {
          usages.push({
            page: 'Home Page',
            section: 'Facilities',
            label: `Home — Facility #${idx + 1} (${item.title || 'Facility'})`,
            url: '/#facilities',
            editUrl: '/admin/home-content',
          });
        }
      });
      (home.photoShowcase?.items || []).forEach((item, idx) => {
        const itemUrl = typeof item === 'string' ? item : item.src;
        if (urlStr && itemUrl === urlStr) {
          usages.push({
            page: 'Home Page',
            section: 'Photo Showcase',
            label: `Home — Showcase Photo #${idx + 1}`,
            url: '/#showcase',
            editUrl: '/admin/home-content',
          });
        }
      });
    }
  } catch (_) {}

  // 3. Check Events
  try {
    const events = await Event.find({}).lean();
    for (const ev of events) {
      if (urlStr && ev.image === urlStr) {
        usages.push({
          page: 'Events',
          section: ev.title || 'Event',
          label: `Event — ${ev.title}`,
          url: '/#events',
          editUrl: '/admin/events',
        });
      }
    }
  } catch (_) {}

  // 4. Check Places (Nearby)
  try {
    const places = await Place.find({}).lean();
    for (const pl of places) {
      if (urlStr && pl.image === urlStr) {
        usages.push({
          page: 'Nearby Areas',
          section: pl.name || 'Place',
          label: `Nearby — ${pl.name}`,
          url: '/nearby-areas',
          editUrl: '/admin/nearby',
        });
      }
    }
  } catch (_) {}

  // 5. Check Gallery Item flag
  if (idStr) {
    try {
      const mediaItem = await MediaItem.findById(idStr).populate('categoryId', 'name').lean();
      if (mediaItem && mediaItem.showInGallery) {
        const catName = mediaItem.categoryId?.name || 'All Media';
        usages.push({
          page: 'Gallery Page',
          section: catName,
          label: `Gallery — ${catName}`,
          url: '/gallery',
          editUrl: '/admin/gallery',
        });
      }
      if (mediaItem && mediaItem.showOnHome) {
        usages.push({
          page: 'Home Page',
          section: 'Photo Showcase',
          label: 'Home — Showcase Item',
          url: '/#showcase',
          editUrl: '/admin/home-content',
        });
      }
    } catch (_) {}
  }

  // Deduplicate usages
  const seen = new Set();
  return usages.filter((u) => {
    const key = `${u.page}|${u.section}|${u.label}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * Computes a map of mediaId / secureUrl to usage count across all documents.
 * Fast batch lookup for the Media Library grid.
 */
export async function getBatchMediaUsageMap() {
  await connectDB();
  const rooms = await Room.find({}).lean();
  const usageMap = {};

  function add(key, info) {
    if (!key) return;
    const k = String(key);
    if (!usageMap[k]) usageMap[k] = [];
    usageMap[k].push(info);
  }

  for (const r of rooms) {
    if (r.mainMediaId) add(r.mainMediaId, { page: r.name, section: 'Hero' });
    if (r.mainImage) add(r.mainImage, { page: r.name, section: 'Hero' });

    (r.photos || []).forEach((p) => {
      if (p.mediaId) add(p.mediaId, { page: r.name, section: 'Photo' });
      if (p.src) add(p.src, { page: r.name, section: 'Photo' });
    });

    (r.videos || []).forEach((v) => {
      if (v.mediaId) add(v.mediaId, { page: r.name, section: 'Video' });
      if (v.src) add(v.src, { page: r.name, section: 'Video' });
    });

    if (r.pano360) {
      if (r.pano360.mediaId) add(r.pano360.mediaId, { page: r.name, section: '360°' });
      if (typeof r.pano360 === 'string') add(r.pano360, { page: r.name, section: '360°' });
      else if (r.pano360.src) add(r.pano360.src, { page: r.name, section: '360°' });
    }
  }

  try {
    const home = await HomeContent.findOne({}).lean();
    if (home) {
      if (home.hero?.image) add(home.hero.image, { page: 'Home', section: 'Hero' });
      if (home.stay?.image) add(home.stay.image, { page: 'Home', section: 'Stay' });
      (home.facilities?.items || []).forEach((i) => {
        if (i.image) add(i.image, { page: 'Home', section: 'Facility' });
      });
      (home.photoShowcase?.items || []).forEach((i) => {
        const u = typeof i === 'string' ? i : i.src;
        if (u) add(u, { page: 'Home', section: 'Showcase' });
      });
    }
  } catch (_) {}

  try {
    const events = await Event.find({}).lean();
    events.forEach((ev) => {
      if (ev.image) add(ev.image, { page: 'Events', section: ev.title });
    });
  } catch (_) {}

  try {
    const places = await Place.find({}).lean();
    places.forEach((pl) => {
      if (pl.image) add(pl.image, { page: 'Nearby', section: pl.name });
    });
  } catch (_) {}

  return usageMap;
}

