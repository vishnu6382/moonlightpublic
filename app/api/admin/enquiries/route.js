import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import Enquiry from '@/models/Enquiry';

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';

    const filter = {};
    if (status !== 'all') {
      filter.status = status;
    }

    const [enquiries, unreadCount, totalCount] = await Promise.all([
      Enquiry.find(filter).sort({ createdAt: -1 }).lean(),
      Enquiry.countDocuments({ status: 'unread' }),
      Enquiry.countDocuments(),
    ]);

    const formatted = enquiries.map((e) => ({
      id: e._id.toString(),
      _id: e._id.toString(),
      name: e.name,
      email: e.email,
      phone: e.phone,
      message: e.message,
      status: e.status,
      notes: e.notes || '',
      createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : new Date().toISOString(),
    }));

    return NextResponse.json({
      success: true,
      enquiries: formatted,
      unreadCount,
      totalCount,
    });
  } catch (err) {
    console.error('[API Admin Enquiries GET Error]:', err.message);
    return NextResponse.json({ error: 'Failed to fetch enquiries' }, { status: 500 });
  }
}
