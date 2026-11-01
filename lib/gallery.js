import connectDB from './db.js';
import GalleryCategory from '../models/GalleryCategory.js';
import MediaItem from '../models/MediaItem.js';
import { getPublicRooms } from './rooms.js';
import { getOptimizedVideoUrl, getOptimizedPosterUrl, getOptimizedImageUrl } from './videoOptimizer.js';

/**
 * Retrieves full gallery dataset for public /gallery page.
 * Returns ONLY real uploaded items from MongoDB and room photos.
 * Zero demo items or static fallbacks.
 */
export async function getPublicGalleryData() {
  try {
    await connectDB();

    // 1. Fetch categories from MongoDB
    const dbCategories = await GalleryCategory.find({ isActive: true })
      .sort({ order: 1 })
      .lean();

    // 2. Fetch media items intended for gallery
    const dbMedia = await MediaItem.find({
      isActive: true,
      showInGallery: true,
    })
      .populate('categoryId', 'name slug coverImage isSpecial order')
      .populate('roomId', 'name slug mainImage order')
      .sort({ order: 1, createdAt: -1 })
      .lean();

    // 3. Fetch active public rooms
    const publicRooms = await getPublicRooms();

    const roomByUrl = new Map();
    publicRooms.forEach((r) => {
      (r.photos || []).forEach((p) => {
        const u = p.src || p.url;
        if (u) roomByUrl.set(u, r);
      });
    });

    const mergedItems = [];
    const seenIds = new Set();
    const db360Items = [];

    // Add DB uploaded media items (360 items are segregated to round360Tiles)
    dbMedia.forEach((m) => {
      const id = m._id.toString();
      if (!seenIds.has(id)) {
        seenIds.add(id);
        const cat = m.categoryId;
        const room = m.roomId || roomByUrl.get(m.secureUrl);
        const is360 = Boolean(m.is360 || m.mediaType === 'pano360');

        if (is360) {
          db360Items.push(m);
          return;
        }

        const isVid = m.mediaType === 'video';
        mergedItems.push({
          id,
          _id: id,
          type: isVid ? 'video' : 'photo',
          mediaType: m.mediaType,
          src: isVid ? getOptimizedVideoUrl(m.secureUrl) : getOptimizedImageUrl(m.secureUrl),
          poster: isVid ? getOptimizedPosterUrl(m.secureUrl, m.posterUrl) : '',
          alt: m.altText || m.title || 'Resort Photo',
          title: m.title || '',
          caption: m.caption || '',
          categoryId: cat ? cat.slug : room ? 'rooms' : 'all',
          categoryName: cat ? cat.name : room ? 'Rooms' : '',
          roomSlug: room ? room.slug : '',
          roomName: room ? room.name : '',
          width: m.width || 1920,
          height: m.height || 1080,
          order: m.order || 0,
          createdAt: m.createdAt,
        });
      }
    });

    // If completely empty, return clean empty structure
    if (mergedItems.length === 0) {
      return {
        items: [],
        categories: [],
        rooms: [],
        round360Tiles: [],
      };
    }

    // Sort by order ascending, then by creation date
    mergedItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    // Calculate category counts
    const countsByCat = { all: mergedItems.length };
    mergedItems.forEach((item) => {
      const c = item.categoryId || 'all';
      countsByCat[c] = (countsByCat[c] || 0) + 1;
    });

    const activeCategories = [
      {
        id: 'all',
        slug: 'all',
        name: 'All',
        count: mergedItems.length,
        isSpecial: false,
        order: 0,
      },
    ];

    if (countsByCat['rooms'] > 0) {
      const firstRoomMedia = mergedItems.find((m) => m.categoryId === 'rooms');
      const roomCover = firstRoomMedia ? firstRoomMedia.src : (publicRooms[0]?.mainImage || (publicRooms[0]?.photos && publicRooms[0]?.photos[0]?.src) || '');
      activeCategories.push({
        id: 'rooms',
        slug: 'rooms',
        name: 'Rooms & Villas',
        coverImage: roomCover,
        count: countsByCat['rooms'],
        isSpecial: true,
        order: 1,
      });
    }

    dbCategories.forEach((cat) => {
      const slug = cat.slug;
      const count = countsByCat[slug] || 0;
      if (count > 0 || cat.isSpecial) {
        const firstMedia = mergedItems.find((m) => m.categoryId === slug);
        const resolvedCover = (cat.coverImage && !cat.coverImage.includes('temp'))
          ? cat.coverImage
          : (firstMedia ? firstMedia.src : '');

        activeCategories.push({
          id: slug,
          slug,
          _id: cat._id.toString(),
          name: cat.name,
          coverImage: resolvedCover,
          count,
          isSpecial: true, // Show all active categories in top Category Cards
          order: cat.order || 10,
        });
      }
    });

    // Build distinct active rooms sorted by public rooms order
    const roomsMap = new Map();
    mergedItems.forEach((item) => {
      if (item.categoryId === 'rooms' && item.roomSlug && item.roomName) {
        if (!roomsMap.has(item.roomSlug)) {
          roomsMap.set(item.roomSlug, {
            slug: item.roomSlug,
            name: item.roomName,
            count: 0,
          });
        }
        roomsMap.get(item.roomSlug).count += 1;
      }
    });

    const roomOrderMap = new Map();
    publicRooms.forEach((r, idx) => roomOrderMap.set(r.slug, idx));
    const activeRooms = Array.from(roomsMap.values()).sort(
      (a, b) => (roomOrderMap.get(a.slug) ?? 99) - (roomOrderMap.get(b.slug) ?? 99)
    );

    // 360 round tiles from active rooms and uploaded 360 media
    const round360Tiles = [];
    const seen360RoomSlugs = new Set();

    publicRooms.forEach((room) => {
      const pano = room.pano360;
      if (pano && pano.src) {
        seen360RoomSlugs.add(room.slug);
        round360Tiles.push({
          id: `360-${room.slug}`,
          type: '360',
          roomSlug: room.slug,
          roomName: room.name,
          title: `${room.name} · 360`,
          ringText: `${room.name.toUpperCase()} · 360° VIEW • `,
          panoSrc: pano.src,
          previewSrc: pano.previewSrc || '',
          fallbackSrc: room.mainImage || (room.photos && room.photos[0]?.src) || pano.src,
          is360: true,
        });
      }
    });

    db360Items.forEach((m) => {
      const room = m.roomId;
      const rSlug = room ? room.slug : '';
      // If room already has a 360 tour, avoid creating a redundant duplicate for that same room
      if (rSlug && seen360RoomSlugs.has(rSlug)) return;
      if (rSlug) seen360RoomSlugs.add(rSlug);

      const title = m.title || (room ? `${room.name} 360` : 'Resort 360');
      const ringText = `${(m.title || room?.name || 'RESORT').toUpperCase()} · 360° VIEW • `;
      round360Tiles.push({
        id: `360-media-${m._id}`,
        type: '360',
        roomSlug: rSlug,
        roomName: room ? room.name : '',
        title: `${title} · 360`,
        ringText,
        panoSrc: m.secureUrl,
        previewSrc: m.secureUrl,
        fallbackSrc: m.secureUrl,
        is360: true,
      });
    });

    return {
      items: mergedItems,
      categories: activeCategories,
      rooms: activeRooms,
      round360Tiles,
    };
  } catch (err) {
    console.error('[Gallery] Error fetching gallery data from MongoDB:', err.message);
    return {
      items: [],
      categories: [],
      rooms: [],
      round360Tiles: [],
    };
  }
}
