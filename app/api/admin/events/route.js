import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import Event from '@/models/Event';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const events = await Event.find({}).sort({ date: 1, order: 1 }).lean();

    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const body = await request.json();
    const {
      title,
      subtitle = '',
      date,
      time = '',
      venue = 'Poolside & Lawn Grounds',
      color = '#A9793E',
      coverImage = '',
      coverVideo = '',
      description = '',
      photos = [],
      isActive = true,
      order = 0,
    } = body;

    if (!title || !date) {
      return NextResponse.json(
        { error: 'Event title and date are required.' },
        { status: 400 }
      );
    }

    await connectDB();

    const baseSlug = slugify(title);
    const existing = await Event.findOne({ slug: baseSlug });
    const finalSlug = existing ? `${baseSlug}-${Date.now().toString().slice(-4)}` : baseSlug;

    const newEvent = await Event.create({
      title,
      slug: finalSlug,
      subtitle,
      date,
      time,
      venue,
      color,
      coverImage,
      coverVideo,
      description,
      photos,
      isActive: Boolean(isActive),
      order: parseInt(order, 10) || 0,
    });

    try {
      revalidatePath('/');
    } catch (_) {}

    return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

