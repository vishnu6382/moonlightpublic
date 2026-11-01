import { NextResponse } from 'next/server.js';
import mongoose from 'mongoose';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Room from '@/models/Room';
import { revalidateRooms } from '@/lib/revalidate';

/**
 * PATCH /api/admin/rooms/[id]/visibility
 * Quick toggle for room active status.
 * Body: { isActive: boolean }
 */
export async function PATCH(request, { params }) {
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

    const { isActive } = body;
    if (typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive must be a boolean.' }, { status: 400 });
    }

    await connectDB();

    const room = await Room.findById(id);
    if (!room) {
      return NextResponse.json({ error: 'Room not found.' }, { status: 404 });
    }

    if (isActive && !room.mainImage && (!room.photos || room.photos.length === 0)) {
      return NextResponse.json(
        { error: 'A room cannot be published without at least one main photo.' },
        { status: 400 }
      );
    }

    room.isActive = isActive;
    await room.save();

    revalidateRooms(room.slug);

    return NextResponse.json({
      success: true,
      message: `Room "${room.name}" is now ${isActive ? 'active' : 'hidden'}.`,
      room,
    });
  } catch (err) {
    console.error('[API Admin Rooms Visibility Error]:', err.message);
    return NextResponse.json({ error: 'Failed to update room visibility.' }, { status: 500 });
  }
}
