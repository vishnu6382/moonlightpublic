import { NextResponse } from 'next/server.js';
import mongoose from 'mongoose';
import { revalidatePath } from 'next/cache';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import Room from '@/models/Room';
import HomeContent from '@/models/HomeContent';
import GalleryCategory from '@/models/GalleryCategory';
import { deleteCloudinaryAsset } from '@/lib/cloudinary';
import { getMediaUsage } from '@/lib/mediaUsage';

export async function GET(request, context) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media ID.' }, { status: 400 });
    }

    await connectDB();
    const media = await MediaItem.findById(id).lean();
    if (!media) {
      return NextResponse.json({ error: 'Media item not found.' }, { status: 404 });
    }

    const usages = await getMediaUsage(media._id, media.secureUrl);

    return NextResponse.json({
      success: true,
      media: {
        ...media,
        usages,
        usageCount: usages.length,
      },
    });
  } catch (error) {
    console.error('[Media GET Error]:', error);
    return NextResponse.json({ error: 'Failed to retrieve media item.' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media ID.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const allowedUpdates = {};

    if (body.title !== undefined) allowedUpdates.title = String(body.title).trim();
    if (body.caption !== undefined) allowedUpdates.caption = String(body.caption).trim();
    if (body.altText !== undefined) allowedUpdates.altText = String(body.altText).trim();
    if (body.showOnHome !== undefined) allowedUpdates.showOnHome = Boolean(body.showOnHome);
    if (body.showInGallery !== undefined) allowedUpdates.showInGallery = Boolean(body.showInGallery);
    if (body.isActive !== undefined) allowedUpdates.isActive = Boolean(body.isActive);
    if (body.order !== undefined) allowedUpdates.order = Number(body.order) || 0;
    if (body.roomId !== undefined) allowedUpdates.roomId = body.roomId || null;
    if (body.categoryId !== undefined) allowedUpdates.categoryId = body.categoryId || null;
    if (body.displayAs !== undefined) allowedUpdates.displayAs = body.displayAs;
    if (body.is360 !== undefined) {
      allowedUpdates.is360 = Boolean(body.is360);
      if (allowedUpdates.is360) {
        allowedUpdates.mediaType = 'pano360';
      }
    }
    if (body.mediaType !== undefined) allowedUpdates.mediaType = body.mediaType;
    if (body.width !== undefined && Number(body.width) > 0) allowedUpdates.width = Number(body.width);
    if (body.height !== undefined && Number(body.height) > 0) allowedUpdates.height = Number(body.height);
    if (body.focus !== undefined && typeof body.focus === 'object') {
      allowedUpdates.focus = {
        x: Math.max(0, Math.min(100, Number(body.focus.x) || 50)),
        y: Math.max(0, Math.min(100, Number(body.focus.y) || 50)),
      };
    }
    if (body.tags !== undefined && Array.isArray(body.tags)) {
      allowedUpdates.tags = body.tags.map((t) => String(t).trim()).filter(Boolean);
    }

    await connectDB();

    const updated = await MediaItem.findByIdAndUpdate(
      id,
      { $set: allowedUpdates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Media item not found.' }, { status: 404 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/rooms');
      revalidatePath('/gallery');
      revalidatePath('/nearby-areas');
    } catch (_) {}

    return NextResponse.json({
      success: true,
      media: updated,
    });
  } catch (error) {
    console.error('[Media Update Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update media item.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid media ID.' }, { status: 400 });
    }

    await connectDB();
    const media = await MediaItem.findById(id);

    if (!media) {
      return NextResponse.json({ error: 'Media item not found.' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const usages = await getMediaUsage(media._id, media.secureUrl);
    if (usages.length > 0 && !force) {
      return NextResponse.json(
        {
          error: `This file is currently used in ${usages.length} place(s).`,
          usages,
          requiresConfirmation: true,
        },
        { status: 409 }
      );
    }

    // 1. Delete asset from Cloudinary
    let cloudinaryResult;
    try {
      cloudinaryResult = await deleteCloudinaryAsset(
        media.cloudinaryPublicId,
        media.resourceType || 'image'
      );
    } catch (cErr) {
      console.warn('[Cloudinary Deletion Notice]:', cErr?.message || cErr);
      // If asset is not found on Cloudinary (already deleted or 404), allow DB record cleanup
      const isNotFound =
        cErr?.http_code === 404 ||
        /not found/i.test(cErr?.message || '') ||
        /not_found/i.test(cErr?.message || '');
      if (!isNotFound && !force) {
        return NextResponse.json(
          {
            error: `Cloudinary asset deletion failed: ${cErr.message || 'Unknown error'}. Database record preserved.`,
          },
          { status: 502 }
        );
      }
    }

    const cStatus = (cloudinaryResult?.result || '').toLowerCase().trim();
    const isSuccessOrGone =
      !cloudinaryResult ||
      cStatus === 'ok' ||
      cStatus === 'not_found' ||
      cStatus === 'not found';

    if (!isSuccessOrGone && !force) {
      return NextResponse.json(
        {
          error: `Cloudinary asset deletion failed with status: ${cloudinaryResult.result}. Database record preserved.`,
        },
        { status: 502 }
      );
    }

    // 2. Delete record from MongoDB
    await MediaItem.findByIdAndDelete(id);

    // 3. Cascade cleanup in Rooms
    const affectedRooms = await Room.find({
      $or: [
        { mainMediaId: id },
        { mainImage: media.secureUrl },
        { 'photos.mediaId': id },
        { 'photos.src': media.secureUrl },
        { 'videos.mediaId': id },
        { 'videos.src': media.secureUrl },
        { 'pano360.mediaId': id },
        { 'pano360.src': media.secureUrl },
        { media: id },
      ],
    });

    for (const room of affectedRooms) {
      room.photos = (room.photos || []).filter(
        (p) => p.mediaId?.toString() !== id.toString() && p.src !== media.secureUrl
      );
      room.videos = (room.videos || []).filter(
        (v) => v.mediaId?.toString() !== id.toString() && v.src !== media.secureUrl
      );
      if (
        room.pano360?.mediaId?.toString() === id.toString() ||
        room.pano360?.src === media.secureUrl
      ) {
        room.pano360 = null;
      }
      room.media = (room.media || []).filter((mId) => mId?.toString() !== id.toString());

      if (
        room.mainMediaId?.toString() === id.toString() ||
        room.mainImage === media.secureUrl
      ) {
        if (room.photos.length > 0) {
          room.mainMediaId = room.photos[0].mediaId || null;
          room.mainImage = room.photos[0].src;
        } else {
          room.mainMediaId = null;
          room.mainImage = '';
          room.isActive = false; // Cannot stay published without at least 1 photo
        }
      }

      await room.save();
    }

    // 4. Cascade cleanup in HomeContent
    const homeContent = await HomeContent.findOne({ key: 'home_singleton' });
    if (homeContent) {
      let homeChanged = false;
      if (
        homeContent.logo?.mediaId?.toString() === id.toString() ||
        homeContent.logo?.url === media.secureUrl
      ) {
        homeContent.logo.mediaId = null;
        homeContent.logo.url = '';
        homeChanged = true;
      }
      if (
        homeContent.showcase?.portalItem?.mediaId?.toString() === id.toString() ||
        homeContent.showcase?.portalItem?.src === media.secureUrl
      ) {
        homeContent.showcase.portalItem = null;
        homeChanged = true;
      }
      if (homeContent.showcase?.items?.length > 0) {
        const initialCount = homeContent.showcase.items.length;
        homeContent.showcase.items = homeContent.showcase.items.filter(
          (s) => s.mediaId?.toString() !== id.toString() && s.src !== media.secureUrl
        );
        if (homeContent.showcase.items.length !== initialCount) {
          homeChanged = true;
        }
      }
      if (homeChanged) {
        await homeContent.save();
      }
    }

    // 5. Cascade cleanup in GalleryCategory
    await GalleryCategory.updateMany(
      { coverMediaId: id },
      { $set: { coverMediaId: null } }
    );

    // 6. Revalidate public pages
    try {
      revalidatePath('/');
      revalidatePath('/rooms');
      revalidatePath('/gallery');
      revalidatePath('/nearby-areas');
    } catch (_) {}

    return NextResponse.json({
      success: true,
      message: 'Media item permanently deleted from Cloudinary and database.',
      deletedId: id,
    });
  } catch (error) {
    console.error('[Media Deletion Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete media item.' },
      { status: 500 }
    );
  }
}
