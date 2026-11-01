import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Review from '@/models/Review';
import { revalidateReviews } from '@/lib/revalidate';

export async function PUT(request, { params }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Review ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { author, rating, text, dateText, source, originalLink, order, isPublished } = body;

    await connectDB();
    const review = await Review.findById(id);
    if (!review) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    if (author !== undefined) review.author = author.trim();
    if (rating !== undefined) review.rating = Math.max(1, Math.min(5, parseInt(rating, 10) || 5));
    if (text !== undefined) review.text = text.trim();
    if (dateText !== undefined) review.dateText = String(dateText || '').trim();
    if (source !== undefined) review.source = String(source || 'Google').trim();
    if (originalLink !== undefined) review.originalLink = String(originalLink || '').trim();
    if (order !== undefined) review.order = parseInt(order, 10) || 0;
    if (isPublished !== undefined) review.isPublished = Boolean(isPublished);

    await review.save();
    revalidateReviews();

    return NextResponse.json({ success: true, message: 'Review updated', review });
  } catch (err) {
    console.error('[API Admin Reviews PUT Error]:', err.message);
    return NextResponse.json({ error: err.message || 'Failed to update review' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Review ID required' }, { status: 400 });
    }

    await connectDB();
    await Review.findByIdAndDelete(id);
    revalidateReviews();

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('[API Admin Reviews DELETE Error]:', err.message);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}
