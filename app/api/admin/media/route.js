import { NextResponse } from 'next/server.js';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import { getBatchMediaUsageMap } from '@/lib/mediaUsage';

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

    const { searchParams } = new URL(request.url);
    const mediaType = searchParams.get('mediaType');
    const typeFilter = searchParams.get('type'); // all, photo, video, 360, unused
    const q = searchParams.get('q') ? searchParams.get('q').trim() : '';
    const tag = searchParams.get('tag');
    const roomId = searchParams.get('roomId');
    const categoryId = searchParams.get('categoryId');
    const showOnHome = searchParams.get('showOnHome');
    const showInGallery = searchParams.get('showInGallery');
    const isActive = searchParams.get('isActive');

    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '50', 10)));
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const skip = (page - 1) * limit;

    const filter = {};

    if (mediaType) {
      filter.mediaType = mediaType;
    }

    if (typeFilter) {
      if (typeFilter === 'photo' || typeFilter === 'image') {
        filter.mediaType = 'image';
        filter.is360 = { $ne: true };
      } else if (typeFilter === 'video') {
        filter.mediaType = 'video';
      } else if (typeFilter === '360' || typeFilter === 'pano360') {
        filter.$or = [{ mediaType: 'pano360' }, { is360: true }];
      }
    }

    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { caption: { $regex: q, $options: 'i' } },
        { altText: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ];
    }

    if (tag) {
      filter.tags = tag;
    }

    if (roomId) filter.roomId = roomId;
    if (categoryId) filter.categoryId = categoryId;
    if (showOnHome !== null && showOnHome !== undefined && showOnHome !== '') {
      filter.showOnHome = showOnHome === 'true';
    }
    if (showInGallery !== null && showInGallery !== undefined && showInGallery !== '') {
      filter.showInGallery = showInGallery === 'true';
    }
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      filter.isActive = isActive === 'true';
    }

    await connectDB();

    const [items, total, totalBytesDoc, usageMap] = await Promise.all([
      MediaItem.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MediaItem.countDocuments(filter),
      MediaItem.aggregate([{ $group: { _id: null, totalBytes: { $sum: '$sizeBytes' } } }]),
      getBatchMediaUsageMap(),
    ]);

    const totalStorageBytes = totalBytesDoc?.[0]?.totalBytes || 0;

    // Attach usage count and summary to each item
    const mediaWithUsage = items.map((it) => {
      const idKey = it._id ? it._id.toString() : '';
      const urlKey = it.secureUrl || '';
      const usages = [...(usageMap[idKey] || []), ...(usageMap[urlKey] || [])];
      // Deduplicate usages
      const seen = new Set();
      const uniqueUsages = usages.filter((u) => {
        const k = `${u.page}|${u.section}`;
        if (seen.has(k)) return false;
        seen.add(k);
        return true;
      });

      return {
        ...it,
        usageCount: uniqueUsages.length,
        usages: uniqueUsages,
      };
    });

    // If typeFilter === 'unused', filter in-memory if needed
    let finalItems = mediaWithUsage;
    if (typeFilter === 'unused') {
      finalItems = mediaWithUsage.filter((m) => m.usageCount === 0);
    }

    return NextResponse.json({
      success: true,
      media: finalItems,
      total,
      page,
      limit,
      totalStorageBytes,
    });
  } catch (error) {
    console.error('[Media List Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve media items.' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/media
 * Bulk update media items (e.g. mark multiple items as is360 = true).
 */
export async function PATCH(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { ids = [], updates = {} } = body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array required.' }, { status: 400 });
    }

    await connectDB();

    const allowed = {};
    if (updates.is360 !== undefined) {
      allowed.is360 = Boolean(updates.is360);
      if (allowed.is360) {
        allowed.mediaType = 'pano360';
      }
    }
    if (updates.showInGallery !== undefined) allowed.showInGallery = Boolean(updates.showInGallery);
    if (updates.showOnHome !== undefined) allowed.showOnHome = Boolean(updates.showOnHome);

    const validIds = ids.filter((id) => mongoose.Types.ObjectId.isValid(id));
    await MediaItem.updateMany(
      { _id: { $in: validIds } },
      { $set: allowed }
    );

    return NextResponse.json({
      success: true,
      updatedCount: validIds.length,
    });
  } catch (error) {
    console.error('[Bulk Media Update Error]:', error);
    return NextResponse.json(
      { error: 'Failed to bulk update media items.' },
      { status: 500 }
    );
  }
}
