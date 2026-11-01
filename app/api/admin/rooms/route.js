import { NextResponse } from 'next/server.js';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Room from '@/models/Room';
import { generateSlug } from '@/lib/rooms';
import { revalidateRooms } from '@/lib/revalidate';

/**
 * GET /api/admin/rooms
 * List all rooms for admin with display order, active status, and media summary.
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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const status = searchParams.get('status'); // 'active' | 'hidden' | 'all'

    const filter = {};
    if (status === 'active') filter.isActive = true;
    if (status === 'hidden') filter.isActive = false;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { slug: { $regex: search, $options: 'i' } },
        { roomType: { $regex: search, $options: 'i' } },
      ];
    }

    const rooms = await Room.find(filter)
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      count: rooms.length,
      rooms,
    });
  } catch (err) {
    console.error('[API Admin Rooms GET Error]:', err.message);
    return NextResponse.json(
      { error: 'Failed to retrieve rooms.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/rooms
 * Create a new room with server-side validation and duplicate slug check.
 */
export async function POST(request) {
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

    const {
      name,
      slug: rawSlug,
      roomType = '',
      bedType = '',
      maxOccupancy = null,
      numberOfRooms = null,
      shortDescription = '',
      description = '',
      features = [],
      facilities = [],
      mainImage = '',
      photos = [],
      videos = [],
      pano360 = null,
      order,
      isActive = true, // Default ON for new rooms with photos
      featuredOnHome = true, // Default ON so newly added rooms show on Home bento grid
      seoTitle = '',
      seoDescription = '',
    } = body;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return NextResponse.json({ error: 'Room name is required.' }, { status: 400 });
    }

    const slug = (rawSlug && rawSlug.trim())
      ? generateSlug(rawSlug)
      : generateSlug(name);

    if (!slug) {
      return NextResponse.json({ error: 'Valid URL slug could not be generated from room name.' }, { status: 400 });
    }

    await connectDB();

    // Check duplicate slug
    const existing = await Room.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: `The slug "${slug}" is already in use by room "${existing.name}". Please choose a unique name or slug.` },
        { status: 409 }
      );
    }

    // Determine default order if not provided
    let finalOrder = typeof order === 'number' ? order : 0;
    if (typeof order !== 'number') {
      const highestOrderRoom = await Room.findOne().sort({ order: -1 }).select('order');
      finalOrder = highestOrderRoom && typeof highestOrderRoom.order === 'number' ? highestOrderRoom.order + 1 : 1;
    }

    // Format facilities safely
    const formattedFacilities = Array.isArray(facilities)
      ? facilities.map((f) => ({
          name: typeof f === 'string' ? f.trim() : (f.name || '').trim(),
          icon: typeof f === 'object' ? (f.icon || '') : '',
        })).filter((f) => f.name)
      : [];

    // Format features safely
    const formattedFeatures = Array.isArray(features)
      ? features.map((ft) => (typeof ft === 'string' ? ft.trim() : String(ft))).filter(Boolean)
      : [];

    // Format photos
    const formattedPhotos = Array.isArray(photos)
      ? photos.map((p, pIdx) => ({
          mediaId: p.mediaId || null,
          src: p.src,
          alt: p.alt || '',
          caption: p.caption || '',
          width: typeof p.width === 'number' ? p.width : null,
          height: typeof p.height === 'number' ? p.height : null,
          focus: p.focus ? { x: p.focus.x ?? 50, y: p.focus.y ?? 50 } : { x: 50, y: 50 },
          displayAs: p.displayAs || 'auto',
          order: typeof p.order === 'number' ? p.order : pIdx,
          showOnHome: Boolean(p.showOnHome),
          showInGallery: Boolean(p.showInGallery),
        })).filter((p) => p.src)
      : [];

    // Format videos
    const formattedVideos = Array.isArray(videos)
      ? videos.map((v, vIdx) => ({
          mediaId: v.mediaId || null,
          src: v.src,
          poster: v.poster || '',
          title: v.title || '',
          caption: v.caption || '',
          alt: v.alt || '',
          width: typeof v.width === 'number' ? v.width : null,
          height: typeof v.height === 'number' ? v.height : null,
          durationSec: typeof v.durationSec === 'number' ? v.durationSec : null,
          displayAs: v.displayAs || 'auto',
          order: typeof v.order === 'number' ? v.order : vIdx,
          showOnHome: Boolean(v.showOnHome),
          showInGallery: Boolean(v.showInGallery),
        })).filter((v) => v.src)
      : [];

    // Format 360 panorama
    let formattedPano = null;
    if (pano360 && pano360.src) {
      formattedPano = {
        mediaId: pano360.mediaId || null,
        src: pano360.src,
        previewSrc: pano360.previewSrc || '',
        caption: pano360.caption || '',
        alt: pano360.alt || '',
        is2to1: pano360.is2to1 !== false,
        showOnHome: Boolean(pano360.showOnHome),
        showInGallery: Boolean(pano360.showInGallery),
      };
    }

    // Cover image determination
    const finalMainImage = mainImage || (formattedPhotos[0]?.src) || '';

    // Enforce: room cannot be published without at least one photo
    const published = Boolean(isActive);
    if (published && !finalMainImage && formattedPhotos.length === 0) {
      return NextResponse.json(
        { error: 'A room cannot be published without at least one main photo. Please upload a photo or save as unpublished.' },
        { status: 400 }
      );
    }

    const newRoom = new Room({
      name: name.trim(),
      slug,
      roomType: roomType.trim(),
      bedType: bedType.trim(),
      maxOccupancy: typeof maxOccupancy === 'number' ? maxOccupancy : (maxOccupancy ? parseInt(maxOccupancy, 10) : null),
      numberOfRooms: typeof numberOfRooms === 'number' ? numberOfRooms : (numberOfRooms ? parseInt(numberOfRooms, 10) : null),
      shortDescription: shortDescription.trim(),
      description: description.trim(),
      features: formattedFeatures,
      facilities: formattedFacilities,
      mainImage: finalMainImage,
      photos: formattedPhotos,
      videos: formattedVideos,
      pano360: formattedPano,
      order: finalOrder,
      isActive: published,
      featuredOnHome: Boolean(featuredOnHome),
      seoTitle: seoTitle.trim(),
      seoDescription: seoDescription.trim(),
    });

    await newRoom.save();

    revalidateRooms(slug);

    return NextResponse.json(
      {
        success: true,
        message: 'Room created successfully.',
        room: newRoom,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[API Admin Rooms POST Error]:', err.message);
    if (err.code === 11000) {
      return NextResponse.json(
        { error: 'A room with this slug already exists.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: err.message || 'Failed to create room.' },
      { status: 500 }
    );
  }
}
