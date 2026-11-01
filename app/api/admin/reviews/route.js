import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import { revalidateReviews } from '@/lib/revalidate';

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const reviews = await Review.find().sort({ order: 1, createdAt: -1 }).lean();

    return NextResponse.json({
      success: true,
      reviews: reviews.map((r) => ({
        id: r._id.toString(),
        _id: r._id.toString(),
        author: r.author,
        rating: r.rating || 5,
        text: r.text,
        dateText: r.dateText || '',
        source: r.source || 'Google',
        originalLink: r.originalLink || '',
        order: r.order || 0,
        isPublished: Boolean(r.isPublished),
        createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      })),
    });
  } catch (err) {
    console.error('[API Admin Reviews GET Error]:', err.message);
    return NextResponse.json({ error: 'Failed to retrieve reviews' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { author, rating = 5, text, dateText = '', source = 'Google', originalLink = '', order = 0, isPublished = true } = body;

    if (!author || !author.trim()) {
      return NextResponse.json({ error: 'Guest name is required' }, { status: 400 });
    }
    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'Review text is required' }, { status: 400 });
    }

    await connectDB();

    const newReview = await Review.create({
      author: author.trim(),
      rating: Math.max(1, Math.min(5, parseInt(rating, 10) || 5)),
      text: text.trim(),
      dateText: String(dateText || '').trim(),
      source: String(source || 'Google').trim(),
      originalLink: String(originalLink || '').trim(),
      order: parseInt(order, 10) || 0,
      isPublished: Boolean(isPublished),
    });

    revalidateReviews();

    return NextResponse.json({
      success: true,
      message: 'Review added successfully',
      review: newReview,
    });
  } catch (err) {
    console.error('[API Admin Reviews POST Error]:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to create review' }, { status: 500 });
  }
}
