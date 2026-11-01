import { NextResponse } from 'next/server.js';
import mongoose from 'mongoose';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Room from '@/models/Room';
import { revalidateRooms } from '@/lib/revalidate';

/**
 * PATCH /api/admin/rooms/reorder
 * Reorder rooms in bulk.
 * Accepts: { items: [ { id: '...', order: 1 }, { id: '...', order: 2 } ] }
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

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON request body.' }, { status: 400 });
    }

    const { items } = body;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'An array of items with id and order is required.' }, { status: 400 });
    }

    await connectDB();

    const bulkOps = [];
    for (const item of items) {
      if (item.id && mongoose.Types.ObjectId.isValid(item.id) && typeof item.order === 'number') {
        bulkOps.push({
          updateOne: {
            filter: { _id: item.id },
            update: { $set: { order: item.order } },
          },
        });
      }
    }

    if (bulkOps.length > 0) {
      await Room.bulkWrite(bulkOps);
    }

    const updatedRooms = await Room.find().sort({ order: 1, createdAt: 1 }).lean();

    revalidateRooms();

    return NextResponse.json({
      success: true,
      message: 'Rooms reordered successfully.',
      rooms: updatedRooms,
    });
  } catch (err) {
    console.error('[API Admin Rooms Reorder Error]:', err.message);
    return NextResponse.json({ error: 'Failed to reorder rooms.' }, { status: 500 });
  }
}
