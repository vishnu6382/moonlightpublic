import { NextResponse } from 'next/server.js';
import { revalidatePath } from 'next/cache';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import HomeContent from '@/models/HomeContent';
import MediaItem from '@/models/MediaItem';

/**
 * GET /api/admin/home-content
 * Retrieves the singleton HomeContent document for the admin editor.
 */
export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    await connectDB();

    const homeContent = await HomeContent.findOne({ key: 'home_singleton' })
      .populate('logo.mediaId')
      .populate('showcase.portalItem.mediaId')
      .populate('showcase.items.mediaId')
      .populate('stay.tallPhoto.mediaId')
      .populate('stay.video.mediaId')
      .populate('stay.infoTile.mediaId')
      .populate('facilities.mediaId')
      .lean();

    if (!homeContent) {
      return NextResponse.json(
        { error: 'Home content not found and could not be seeded.' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      homeContent,
    });
  } catch (err) {
    console.error('[API Admin HomeContent GET Error]:', err.message);
    return NextResponse.json(
      { error: 'Failed to retrieve home content.' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/home-content
 * Updates the singleton HomeContent document.
 */
export async function PUT(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { logo, intro, stay, showcase, facilities } = body;

    await connectDB();

    const updateDoc = {};

    // 0. Logo validation & formatting
    if (logo && typeof logo === 'object') {
      updateDoc.logo = {
        mediaId: logo.mediaId || null,
        url: typeof logo.url === 'string' ? logo.url.trim() : '',
        alt: typeof logo.alt === 'string' ? logo.alt.trim() : 'Moon Light Resort',
        showText: logo.showText !== false,
      };
    }

    // 1. Intro validation & formatting
    if (intro && typeof intro === 'object') {
      updateDoc.intro = {
        eyebrow: typeof intro.eyebrow === 'string' ? intro.eyebrow.trim() : 'NEDUNGULAM • TAMIL NADU',
        headingLine1: typeof intro.headingLine1 === 'string' ? intro.headingLine1.trim() : 'Together Time',
        headingLine2: typeof intro.headingLine2 === 'string' ? intro.headingLine2.trim() : 'In Nedungulam',
        description: typeof intro.description === 'string' ? intro.description.trim() : '',
        ctaText: typeof intro.ctaText === 'string' ? intro.ctaText.trim() : 'Explore Rooms →',
        ctaHref: typeof intro.ctaHref === 'string' ? intro.ctaHref.trim() : '#rooms',
        welcomeSubtitle: typeof intro.welcomeSubtitle === 'string' ? intro.welcomeSubtitle.trim() : 'PEACEFUL NATURE RETREAT',
        welcomeTitle: typeof intro.welcomeTitle === 'string' ? intro.welcomeTitle.trim() : 'WELCOME TO MOON LIGHT',
      };
    }

    // 2. Stay validation & formatting
    if (stay && typeof stay === 'object') {
      const pills = Array.isArray(stay.featurePills)
        ? stay.featurePills.map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean)
        : [];

      updateDoc.stay = {
        label: typeof stay.label === 'string' ? stay.label.trim() : 'MOON LIGHT RESORT · NEDUNGULAM',
        title: typeof stay.title === 'string' ? stay.title.trim() : 'Together Time in Nedungulam',
        heading: typeof stay.heading === 'string' ? stay.heading.trim() : '',
        paragraph: typeof stay.paragraph === 'string' ? stay.paragraph.trim() : '',
        checkInTime: typeof stay.checkInTime === 'string' ? stay.checkInTime.trim() : '13:00',
        checkOutTime: typeof stay.checkOutTime === 'string' ? stay.checkOutTime.trim() : '11:00',
        featurePills: pills.length > 0 ? pills : ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
        tallPhoto: {
          mediaId: stay.tallPhoto?.mediaId || null,
          url: typeof stay.tallPhoto?.url === 'string' ? stay.tallPhoto.url.trim() : (typeof stay.tallPhoto?.src === 'string' ? stay.tallPhoto.src.trim() : ''),
          alt: typeof stay.tallPhoto?.alt === 'string' ? stay.tallPhoto.alt.trim() : 'Moon Light Resort pool and villa grounds',
        },
        video: {
          mediaId: stay.video?.mediaId || null,
          src: typeof stay.video?.src === 'string' ? stay.video.src.trim() : '',
          title: typeof stay.video?.title === 'string' ? stay.video.title.trim() : 'Watch Resort Video',
          subtitle: typeof stay.video?.subtitle === 'string' ? stay.video.subtitle.trim() : 'See pool, villas and open spaces',
          duration: typeof stay.video?.duration === 'string' ? stay.video.duration.trim() : '0:45',
          poster: typeof stay.video?.poster === 'string' ? stay.video.poster.trim() : '',
        },
        infoTile: {
          mediaId: stay.infoTile?.mediaId || null,
          image: typeof stay.infoTile?.image === 'string' ? stay.infoTile.image.trim() : '',
          badge: typeof stay.infoTile?.badge === 'string' ? stay.infoTile.badge.trim() : 'Timings',
          title: typeof stay.infoTile?.title === 'string' ? stay.infoTile.title.trim() : 'Check-in & Check-out',
          subtitle: typeof stay.infoTile?.subtitle === 'string' ? stay.infoTile.subtitle.trim() : '',
        },
      };
    }

    // 3. Showcase validation & formatting
    if (showcase && typeof showcase === 'object') {
      const showcasePills = Array.isArray(showcase.pills)
        ? showcase.pills.map((p) => (typeof p === 'string' ? p.trim() : '')).filter(Boolean)
        : ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'];

      const portalItem = {
        mediaId: showcase.portalItem?.mediaId || null,
        src: typeof showcase.portalItem?.src === 'string' ? showcase.portalItem.src.trim() : '',
        alt: typeof showcase.portalItem?.alt === 'string' ? showcase.portalItem.alt.trim() : 'Moon Light Resort',
        title: typeof showcase.portalItem?.title === 'string' ? showcase.portalItem.title.trim() : 'Moon Light Resort',
        is360: Boolean(showcase.portalItem?.is360),
      };

      const formattedSlots = Array.isArray(showcase.items)
        ? showcase.items.map((slot, idx) => ({
            slotNumber: typeof slot.slotNumber === 'number' ? slot.slotNumber : idx + 1,
            mediaId: slot.mediaId || null,
            src: typeof slot.src === 'string' ? slot.src.trim() : '',
            alt: typeof slot.alt === 'string' ? slot.alt.trim() : '',
            caption: typeof slot.caption === 'string' ? slot.caption.trim() : '',
            isVideoSlot: Boolean(slot.isVideoSlot),
            type: slot.type === 'video' || slot.isVideoSlot ? 'video' : 'image',
          }))
        : [];

      updateDoc.showcase = {
        title: typeof showcase.title === 'string' ? showcase.title.trim() : 'Captured Moments of Serenity',
        subtitle: typeof showcase.subtitle === 'string' ? showcase.subtitle.trim() : '',
        pills: showcasePills,
        portalItem,
        items: formattedSlots,
      };
    }

    // 4. Facilities validation & formatting
    if (facilities && typeof facilities === 'object') {
      updateDoc.facilities = {
        title: typeof facilities.title === 'string' ? facilities.title.trim() : 'Facilities',
        subtitle: typeof facilities.subtitle === 'string' ? facilities.subtitle.trim() : 'Comfort-first stay essentials.',
        badge: typeof facilities.badge === 'string' ? facilities.badge.trim() : 'Thoughtful Amenities',
        featuredTitle: typeof facilities.featuredTitle === 'string' ? facilities.featuredTitle.trim() : 'All Essentials For A Relaxing Stay',
        featuredText: typeof facilities.featuredText === 'string' ? facilities.featuredText.trim() : 'From air conditioning and full power backup to a clean swimming pool and dining space.',
        image: typeof facilities.image === 'string' ? facilities.image.trim() : '',
        mediaId: facilities.mediaId || null,
        groups: Array.isArray(facilities.groups)
          ? facilities.groups.map((g) => ({
              id: g.id || g.name?.toLowerCase().replace(/\s+/g, '-') || 'group',
              name: g.name || '',
              items: Array.isArray(g.items)
                ? g.items.map((it) => ({
                    name: it.name || '',
                    icon: it.icon || 'check',
                    group: g.name || '',
                  }))
                : [],
            }))
          : [],
      };
    }

    const updatedHomeContent = await HomeContent.findOneAndUpdate(
      { key: 'home_singleton' },
      { $set: updateDoc },
      { returnDocument: 'after', upsert: true }
    )
      .populate('logo.mediaId')
      .populate('showcase.portalItem.mediaId')
      .populate('showcase.items.mediaId')
      .populate('stay.tallPhoto.mediaId')
      .populate('stay.video.mediaId')
      .populate('stay.infoTile.mediaId')
      .populate('facilities.mediaId')
      .lean();

    try {
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Home content updated successfully.',
      homeContent: updatedHomeContent,
    });
  } catch (err) {
    console.error('[API Admin HomeContent PUT Error]:', err.message);
    return NextResponse.json(
      { error: err.message || 'Failed to update home content.' },
      { status: 500 }
    );
  }
}
