import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

export async function PUT(request, context) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    await connectDB();
    const event = await Event.findById(id);
    if (!event) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    if (body.title !== undefined) event.title = body.title;
    if (body.subtitle !== undefined) event.subtitle = body.subtitle;
    if (body.date !== undefined) event.date = body.date;
    if (body.time !== undefined) event.time = body.time;
    if (body.venue !== undefined) event.venue = body.venue;
    if (body.color !== undefined) event.color = body.color;
    if (body.coverImage !== undefined) event.coverImage = body.coverImage;
    if (body.coverVideo !== undefined) event.coverVideo = body.coverVideo;
    if (body.description !== undefined) event.description = body.description;
    if (body.photos !== undefined) event.photos = body.photos;
    if (body.isActive !== undefined) event.isActive = Boolean(body.isActive);
    if (body.order !== undefined) event.order = parseInt(body.order, 10) || 0;

    await event.save();

    try {
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json({ success: true, event });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;

    await connectDB();
    const deleted = await Event.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Event not found.' }, { status: 404 });
    }

    try {
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Event deleted successfully.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

