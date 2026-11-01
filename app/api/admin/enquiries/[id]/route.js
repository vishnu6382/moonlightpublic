import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Enquiry from '@/models/Enquiry';

export async function PATCH(request, { params }) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Valid Enquiry ID required' }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body;

    await connectDB();

    const update = {};
    if (status && ['unread', 'read', 'contacted', 'archived'].includes(status)) {
      update.status = status;
    }
    if (notes !== undefined) {
      update.notes = String(notes).trim();
    }

    const updated = await Enquiry.findByIdAndUpdate(id, { $set: update }, { returnDocument: 'after' });
    if (!updated) {
      return NextResponse.json({ error: 'Enquiry not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, enquiry: updated });
  } catch (err) {
    console.error('[API Admin Enquiries PATCH Error]:', err.message);
    return NextResponse.json({ error: 'Failed to update enquiry' }, { status: 500 });
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
      return NextResponse.json({ error: 'Valid Enquiry ID required' }, { status: 400 });
    }

    await connectDB();
    await Enquiry.findByIdAndDelete(id);

    return NextResponse.json({ success: true, message: 'Enquiry deleted successfully' });
  } catch (err) {
    console.error('[API Admin Enquiries DELETE Error]:', err.message);
    return NextResponse.json({ error: 'Failed to delete enquiry' }, { status: 500 });
  }
}
