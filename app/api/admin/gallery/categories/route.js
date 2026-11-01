import { NextResponse } from 'next/server.js';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import GalleryCategory from '@/models/GalleryCategory';
import { generateSlug } from '@/lib/slug';

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

    const categories = await GalleryCategory.find({})
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return NextResponse.json({
      success: true,
      categories,
    });
  } catch (error) {
    console.error('[Admin Gallery Categories GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve gallery categories.' },
      { status: 500 }
    );
  }
}

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

    const body = await request.json().catch(() => ({}));
    const { name, coverImage = '', isSpecial = false, order = 0, isActive = true } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Category name is required.' },
        { status: 400 }
      );
    }

    await connectDB();

    let slug = body.slug ? generateSlug(body.slug) : generateSlug(name);
    // Ensure unique slug
    let existing = await GalleryCategory.findOne({ slug });
    if (existing) {
      slug = `${slug}-${Date.now().toString(36).slice(-4)}`;
    }

    const category = await GalleryCategory.create({
      name: name.trim(),
      slug,
      coverImage: coverImage.trim(),
      isSpecial: Boolean(isSpecial),
      order: Number(order) || 0,
      isActive: Boolean(isActive),
    });

    return NextResponse.json({
      success: true,
      category,
    });
  } catch (error) {
    console.error('[Admin Gallery Categories POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to create gallery category.' },
      { status: 500 }
    );
  }
}
