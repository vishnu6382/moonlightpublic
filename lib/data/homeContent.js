import connectDB from '../db.js';
import HomeContent from '../../models/HomeContent.js';
import MediaItem from '../../models/MediaItem.js';
import Event from '../../models/Event.js';
import Room from '../../models/Room.js';
import SiteSettings from '../../models/SiteSettings.js';
import { siteConfig } from '../../content/site.js';
import { facilitiesData } from '../../content/facilities.js';
import { getOptimizedVideoUrl, getOptimizedPosterUrl, getOptimizedImageUrl } from '../videoOptimizer.js';

/**
 * Retrieves public Home content for the landing page.
 * Returns strictly what is stored in MongoDB, with no default or demo photos.
 * Implements Photo Showcase auto-fill from library media marked `showOnHome: true`
 * while preserving any manually configured slot overrides.
 */
export async function getPublicHomeContent() {
  try {
    await connectDB();

    const [doc, dbEvents, roomWithPano, homeMedia, siteSettingsDoc] = await Promise.all([
      HomeContent.findOne({ key: 'home_singleton' })
        .populate('logo.mediaId')
        .populate('showcase.portalItem.mediaId')
        .populate('showcase.items.mediaId')
        .lean(),
      Event.find({ isActive: true }).sort({ date: 1, order: 1 }).lean().catch(() => []),
      Room.findOne({ isActive: true, 'pano360.src': { $exists: true, $ne: '' } }).lean().catch(() => null),
      MediaItem.find({ isActive: true, showOnHome: true }).sort({ order: 1, createdAt: -1 }).lean().catch(() => []),
      SiteSettings.findOne({ key: 'global_settings' }).lean().catch(() => null),
    ]);

    const formattedEvents = (dbEvents || []).map((e) => ({
      id: e._id.toString(),
      _id: e._id.toString(),
      title: e.title,
      subtitle: e.subtitle || '',
      date: e.date,
      time: e.time || '',
      venue: e.venue || '',
      color: e.color || '#A9793E',
      coverImage: e.coverImage ? getOptimizedImageUrl(e.coverImage) : '',
      coverVideo: e.coverVideo ? getOptimizedVideoUrl(e.coverVideo) : '',
      description: e.description || '',
      photos: Array.isArray(e.photos) ? e.photos : [],
      order: e.order || 0,
    }));

    const autoPanoPortal = roomWithPano?.pano360?.src
      ? {
          id: `room-360-${roomWithPano.slug}`,
          type: 'image',
          is360: true,
          src: roomWithPano.pano360.src,
          previewSrc: roomWithPano.pano360.previewSrc || roomWithPano.pano360.src,
          panoSrc: roomWithPano.pano360.src,
          alt: `${roomWithPano.name} 360° Virtual Tour`,
          title: `${roomWithPano.name} 360° View`,
          roomName: roomWithPano.name,
        }
      : null;

    const stayDoc = doc?.stay || {};
    const showcaseDoc = doc?.showcase || {};
    const introDoc = doc?.intro || {};

    // 1. Stay Content
    const firstImageMedia = (homeMedia || []).find((m) => m.mediaType === 'image');
    const firstVideoMedia = (homeMedia || []).find((m) => m.mediaType === 'video');

    const dynamicStayContent = {
      label: stayDoc.label || 'MOON LIGHT RESORT · NEDUNGULAM, TAMIL NADU',
      title: stayDoc.title || 'Together Time in Nedungulam',
      heading: stayDoc.heading || 'Where calm landscapes meet warm hospitality',
      paragraph: stayDoc.paragraph || 'Surrounded by open nature and tranquil breezes, Moon Light Resort is designed for families and groups who want privacy, comfort, and shared memories without rush.',
      stats: (Array.isArray(stayDoc.stats) && stayDoc.stats.length > 0)
        ? stayDoc.stats
        : [
            {
              label: 'Villa Rooms & Dorms',
              value: '10 Rooms',
              icon: 'bed',
              link: '/rooms',
            },
            {
              label: 'Clean Swimming Pool',
              value: 'Private & Clean',
              icon: 'pool',
              link: '/gallery',
            },
          ],
      infoTile: {
        badge: stayDoc.infoTile?.badge || 'Timings',
        title: stayDoc.infoTile?.title || 'Check-in & Check-out',
        subtitle: stayDoc.infoTile?.subtitle || `Check-in ${stayDoc.checkInTime || '13:00'} · Check-out ${stayDoc.checkOutTime || '11:00'}`,
        image: stayDoc.infoTile?.image || (firstImageMedia?.secureUrl || null),
      },
      tallPhoto: (stayDoc.tallPhoto?.url || stayDoc.tallPhoto?.src)
        ? {
            src: stayDoc.tallPhoto.url || stayDoc.tallPhoto.src,
            alt: stayDoc.tallPhoto.alt || 'Moon Light Resort pool and villa grounds',
          }
        : (firstImageMedia
            ? {
                src: firstImageMedia.secureUrl,
                alt: firstImageMedia.altText || firstImageMedia.title || 'Moon Light Resort',
              }
            : null),
      video: (stayDoc.video?.src)
        ? {
            src: stayDoc.video.src,
            title: stayDoc.video.title || 'Watch Resort Video',
            subtitle: stayDoc.video.subtitle || 'See pool, villas and open spaces',
            duration: stayDoc.video.duration || '0:45',
            poster: stayDoc.video.poster || (stayDoc.tallPhoto?.url || stayDoc.tallPhoto?.src || (firstImageMedia?.secureUrl || '')),
          }
        : (firstVideoMedia
            ? {
                src: firstVideoMedia.secureUrl,
                title: firstVideoMedia.title || 'Watch Resort Video',
                subtitle: firstVideoMedia.caption || 'See pool, villas and open spaces',
                duration: '0:45',
                poster: firstVideoMedia.posterUrl || (firstImageMedia?.secureUrl || ''),
              }
            : null),
      avatarPhotos: [],
      pills: [
        { name: siteConfig.addressShort || 'Nedungulam, Tamil Nadu', icon: 'pin', isAddress: true },
        ...(stayDoc.featurePills || ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces']).map((p) => ({
          name: p,
          icon: 'check',
        })),
      ],
    };

    // 2. Photo Showcase: 8 Slots with Auto-Fill Logic
    // Manual slots from DB take precedence; empty slots are filled from `homeMedia` (showOnHome: true).
    const manualSlots = Array.isArray(showcaseDoc.items) ? showcaseDoc.items : [];
    const manualMap = new Map();
    manualSlots.forEach((s) => {
      if (s.src) manualMap.set(s.slotNumber, s);
    });

    // Determine unused homeMedia candidates to auto-fill
    const usedSrcs = new Set(Array.from(manualMap.values()).map((s) => s.src));
    const autoFillCandidates = (homeMedia || []).filter((m) => !usedSrcs.has(m.secureUrl));

    const finalShowcaseItems = [];
    let autoIdx = 0;

    for (let slot = 1; slot <= 8; slot++) {
      if (manualMap.has(slot)) {
        const item = manualMap.get(slot);
        finalShowcaseItems.push({
          id: `slot-${slot}`,
          slotNumber: slot,
          src: item.isVideoSlot ? getOptimizedVideoUrl(item.src) : getOptimizedImageUrl(item.src),
          alt: item.alt || 'Moon Light Resort',
          caption: item.caption || '',
          type: item.isVideoSlot ? 'video' : 'image',
          isVideo: Boolean(item.isVideoSlot),
          poster: item.isVideoSlot ? getOptimizedPosterUrl(item.src) : '',
        });
      } else if (autoIdx < autoFillCandidates.length) {
        const candidate = autoFillCandidates[autoIdx++];
        const isVid = candidate.mediaType === 'video' && slot !== 1; // Hero tile (slot 1) is always a photo
        finalShowcaseItems.push({
          id: `auto-slot-${slot}`,
          slotNumber: slot,
          src: isVid ? getOptimizedVideoUrl(candidate.secureUrl) : getOptimizedImageUrl(candidate.secureUrl),
          alt: candidate.altText || candidate.title || 'Moon Light Resort',
          caption: candidate.caption || '',
          type: isVid ? 'video' : 'image',
          isVideo: isVid,
          poster: isVid ? getOptimizedPosterUrl(candidate.secureUrl, candidate.posterUrl) : '',
        });
      }
    }

    const defaultPanoSrc = roomWithPano?.pano360?.src || 'https://res.cloudinary.com/dqaroqfr/image/upload/v1793208541/moonlight_resort/xczyno5zqvn9fqwzmlur.webp';
    const portalItem = showcaseDoc.portalItem?.src
      ? {
          id: 'showcase-portal-custom',
          src: showcaseDoc.portalItem.src,
          previewSrc: showcaseDoc.portalItem.src,
          panoSrc: Boolean(showcaseDoc.portalItem.is360)
            ? (showcaseDoc.portalItem.panoSrc || showcaseDoc.portalItem.src || defaultPanoSrc)
            : undefined,
          alt: showcaseDoc.portalItem.alt || 'Moon Light Resort',
          title: showcaseDoc.portalItem.title || 'Moon Light Resort',
          roomName: showcaseDoc.portalItem.title || roomWithPano?.name || 'Moon Light Resort',
          is360: Boolean(showcaseDoc.portalItem.is360),
        }
      : (showcaseDoc.portalItem && showcaseDoc.portalItem.src === '' ? null : autoPanoPortal);

    const showcaseData = {
      title: showcaseDoc.title || 'Captured Moments of Serenity',
      subtitle: showcaseDoc.subtitle || 'Villas, pool and open spaces at Moon Light Resort.',
      pills: showcaseDoc.pills?.length > 0 ? showcaseDoc.pills : ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
      portalItem,
    };

    // 3. Intro Data
    const introData = {
      eyebrow: introDoc.eyebrow || siteConfig.intro?.eyebrow || 'NEDUNGULAM • TAMIL NADU',
      headingLine1: introDoc.headingLine1 || siteConfig.intro?.headingLine1 || 'Together Time',
      headingLine2: introDoc.headingLine2 || siteConfig.intro?.headingLine2 || 'In Nedungulam',
      description: introDoc.description || siteConfig.intro?.description || 'A peaceful resort nestled in the countryside...',
      ctaText: introDoc.ctaText || siteConfig.intro?.ctaText || 'Explore Rooms →',
      ctaHref: introDoc.ctaHref || siteConfig.intro?.ctaHref || '#rooms',
      welcomeSubtitle: introDoc.welcomeSubtitle || siteConfig.intro?.welcomeSubtitle || 'PEACEFUL NATURE RETREAT',
      welcomeTitle: introDoc.welcomeTitle || siteConfig.intro?.welcomeTitle || 'WELCOME TO MOON LIGHT',
    };

    const result = {
      logo: doc?.logo?.url
        ? {
            url: doc.logo.url,
            alt: doc.logo.alt || siteConfig.name,
            showText: doc.logo.showText ?? true,
          }
        : { url: '', alt: siteConfig.name, showText: true },
      stayContent: dynamicStayContent,
      showcaseData,
      showcaseItems: finalShowcaseItems,
      introData,
      facilities: {
        title: doc?.facilities?.title || facilitiesData.title,
        subtitle: doc?.facilities?.subtitle || facilitiesData.subtitle,
        badge: doc?.facilities?.badge || 'Thoughtful Amenities',
        featuredTitle: doc?.facilities?.featuredTitle || 'All Essentials For A Relaxing Stay',
        featuredText: doc?.facilities?.featuredText || 'From air conditioning and full power backup to a clean swimming pool and dining space.',
        image: doc?.facilities?.image || (firstImageMedia?.secureUrl || null),
        groups: (Array.isArray(doc?.facilities?.groups) && doc.facilities.groups.length > 0)
          ? doc.facilities.groups
          : facilitiesData.groups,
      },
      reviews: [], // Handled by reviews data provider
      events: formattedEvents,
      faqs: [],
      siteSettings: siteSettingsDoc || null,
    };

    return JSON.parse(JSON.stringify(result));
  } catch (err) {
    console.warn('[HomeContent] Failed to fetch home content from MongoDB:', err.message);
    return null;
  }
}
