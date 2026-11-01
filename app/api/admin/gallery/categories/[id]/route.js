import { NextResponse } from 'next/server.js';
import mongoose from 'mongoose';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import GalleryCategory from '@/models/GalleryCategory';
import MediaItem from '@/models/MediaItem';
import { generateSlug } from '@/lib/slug';

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
      return NextResponse.json({ error: 'Invalid category ID.' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const updates = {};

    if (body.name !== undefined) {
      updates.name = String(body.name).trim();
      if (!updates.name) {
        return NextResponse.json({ error: 'Category name cannot be empty.' }, { status: 400 });
      }
      if (!body.slug) {
        updates.slug = generateSlug(updates.name);
      }
    }
    if (body.slug !== undefined) updates.slug = generateSlug(body.slug);
    if (body.coverImage !== undefined) updates.coverImage = String(body.coverImage).trim();
    if (body.isSpecial !== undefined) updates.isSpecial = Boolean(body.isSpecial);
    if (body.order !== undefined) updates.order = Number(body.order) || 0;
    if (body.isActive !== undefined) updates.isActive = Boolean(body.isActive);

    await connectDB();

    const updated = await GalleryCategory.findByIdAndUpdate(
      id,
      { $set: updates },
      { returnDocument: 'after', runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category: updated,
    });
  } catch (error) {
    console.error('[Admin Gallery Category PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update category.' },
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
      return NextResponse.json({ error: 'Invalid category ID.' }, { status: 400 });
    }

    await connectDB();

    const category = await GalleryCategory.findByIdAndDelete(id);
    if (!category) {
      return NextResponse.json({ error: 'Category not found.' }, { status: 404 });
    }

    // Unlink any media assigned to this deleted category
    await MediaItem.updateMany(
      { categoryId: id },
      { $set: { categoryId: null } }
    );

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully and media unlinked.',
      deletedId: id,
    });
  } catch (error) {
    console.error('[Admin Gallery Category DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete category.' },
      { status: 500 }
    );
  }
}
