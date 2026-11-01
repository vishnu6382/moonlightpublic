import { NextResponse } from 'next/server.js';
import mongoose from 'mongoose';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Room from '@/models/Room';
import MediaItem from '@/models/MediaItem';
import { generateSlug } from '@/lib/rooms';
import { revalidateRooms } from '@/lib/revalidate';

/**
 * GET /api/admin/rooms/[id]
 * Fetch single room details for editor by ID or slug.
 */
export async function GET(request, { params }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Room identifier is required.' }, { status: 400 });
    }

    await connectDB();

    const isMongoId = mongoose.Types.ObjectId.isValid(id);
    const room = isMongoId
      ? await Room.findById(id).lean()
      : await Room.findOne({ slug: id }).lean();

    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    // Also fetch associated media from MediaItem collection for full visibility
    const associatedMedia = await MediaItem.find({ roomId: room._id })
      .sort({ order: 1, createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      room,
      associatedMedia,
    });
  } catch (err) {
    console.error('[API Admin Rooms [id] GET Error]:', err.message);
    return NextResponse.json({ error: 'Failed to retrieve room.' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/rooms/[id]
 * Update a room by ID with server-side validation and duplicate slug check.
 */
export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Room ID is required.' }, { status: 400 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    await connectDB();

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    const {
      name,
      slug: rawSlug,
      roomType,
      bedType,
      maxOccupancy,
      numberOfRooms,
      shortDescription,
      description,
      features,
      facilities,
      mainImage,
      photos,
      videos,
      pano360,
      order,
      isActive,
      featuredOnHome,
      seoTitle,
      seoDescription,
    } = body;

    // Validate and update name
    if (name !== undefined) {
      if (!name || typeof name !== 'string' || !name.trim()) {
        return NextResponse.json({ error: 'Room name cannot be empty.' }, { status: 400 });
      }
      room.name = name.trim();
    }

    // Validate and update slug
    if (rawSlug !== undefined || (name !== undefined && !room.slug)) {
      const candidateSlug = (rawSlug && rawSlug.trim())
        ? generateSlug(rawSlug)
        : generateSlug(room.name);

      if (!candidateSlug) {
        return NextResponse.json({ error: 'Invalid slug.' }, { status: 400 });
      }

      if (candidateSlug !== room.slug) {
        const existing = await Room.findOne({ slug: candidateSlug, _id: { $ne: room._id } });
        if (existing) {
          return NextResponse.json(
            { error: `The slug "${candidateSlug}" is already in use by another room.` },
            { status: 409 }
          );
        }
        room.slug = candidateSlug;
      }
    }

    if (roomType !== undefined) room.roomType = String(roomType || '').trim();
    if (bedType !== undefined) room.bedType = String(bedType || '').trim();
    if (maxOccupancy !== undefined) {
      room.maxOccupancy = typeof maxOccupancy === 'number' ? maxOccupancy : (maxOccupancy ? parseInt(maxOccupancy, 10) : null);
    }
    if (numberOfRooms !== undefined) {
      room.numberOfRooms = typeof numberOfRooms === 'number' ? numberOfRooms : (numberOfRooms ? parseInt(numberOfRooms, 10) : null);
    }
    if (shortDescription !== undefined) room.shortDescription = String(shortDescription || '').trim();
    if (description !== undefined) room.description = String(description || '').trim();

    if (features !== undefined && Array.isArray(features)) {
      room.features = features.map((ft) => (typeof ft === 'string' ? ft.trim() : String(ft))).filter(Boolean);
    }

    if (facilities !== undefined && Array.isArray(facilities)) {
      room.facilities = facilities.map((f) => ({
        name: typeof f === 'string' ? f.trim() : (f.name || '').trim(),
        icon: typeof f === 'object' ? (f.icon || '') : '',
      })).filter((f) => f.name);
    }

    if (photos !== undefined && Array.isArray(photos)) {
      room.photos = photos.map((p, pIdx) => ({
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
      })).filter((p) => p.src);
    }

    if (videos !== undefined && Array.isArray(videos)) {
      room.videos = videos.map((v, vIdx) => ({
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
      })).filter((v) => v.src);
    }

    if (pano360 !== undefined) {
      if (pano360 && pano360.src) {
        room.pano360 = {
          mediaId: pano360.mediaId || null,
          src: pano360.src,
          previewSrc: pano360.previewSrc || '',
          caption: pano360.caption || '',
          alt: pano360.alt || '',
          is2to1: pano360.is2to1 !== false,
          showOnHome: Boolean(pano360.showOnHome),
          showInGallery: Boolean(pano360.showInGallery),
        };
      } else {
        room.pano360 = null;
      }
    }

    if (mainImage !== undefined) {
      room.mainImage = mainImage || (room.photos?.[0]?.src) || '';
    } else if (!room.mainImage && room.photos?.length > 0) {
      room.mainImage = room.photos[0].src;
    }

    if (order !== undefined && typeof order === 'number') {
      room.order = order;
    }
    if (isActive !== undefined) {
      room.isActive = Boolean(isActive);
    }

    // Enforce: cannot be active/published without at least one photo
    if (room.isActive && !room.mainImage && (!room.photos || room.photos.length === 0)) {
      return NextResponse.json(
        { error: 'A room cannot be published without at least one main photo. Please upload a photo or uncheck Published.' },
        { status: 400 }
      );
    }

    if (featuredOnHome !== undefined) {
      room.featuredOnHome = Boolean(featuredOnHome);
    }
    if (seoTitle !== undefined) {
      room.seoTitle = String(seoTitle || '').trim();
    }
    if (seoDescription !== undefined) {
      room.seoDescription = String(seoDescription || '').trim();
    }

    await room.save();

    revalidateRooms(room.slug);

    return NextResponse.json({
      success: true,
      message: 'Room updated successfully.',
      room,
    });
  } catch (err) {
    console.error('[API Admin Rooms [id] PUT Error]:', err.message);
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A room with this slug already exists.' }, { status: 409 });
    }
    return NextResponse.json({ error: err.message || 'Failed to update room.' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/rooms/[id]
 * Safe deletion: unlinks any associated MediaItem records without deleting Cloudinary assets.
 */
export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Room ID is required.' }, { status: 400 });
    }

    await connectDB();

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    // Safe unlinking: ensure MediaItems associated with this room are unlinked rather than deleted
    await MediaItem.updateMany({ roomId: room._id }, { $set: { roomId: null } });

    // Delete the Room record
    await Room.findByIdAndDelete(room._id);

    revalidateRooms(room.slug);

    return NextResponse.json({
      success: true,
      message: `Room "${room.name}" deleted safely. Associated media assets remain preserved in storage.`,
    });
  } catch (err) {
    console.error('[API Admin Rooms [id] DELETE Error]:', err.message);
    return NextResponse.json({ error: 'Failed to delete room.' }, { status: 500 });
  }
}
