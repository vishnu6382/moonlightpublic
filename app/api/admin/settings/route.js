import { NextResponse } from 'next/server';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import SiteSettings from '@/models/SiteSettings';
import { revalidateAll } from '@/lib/revalidate';

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    let settings = await SiteSettings.findOne({ key: 'global_settings' }).lean();
    if (!settings) {
      settings = await SiteSettings.create({ key: 'global_settings' });
    }

    return NextResponse.json({ success: true, settings });
  } catch (err) {
    console.error('[API Admin Settings GET Error]:', err.message);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    await connectDB();

    const updated = await SiteSettings.findOneAndUpdate(
      { key: 'global_settings' },
      { $set: body },
      { returnDocument: 'after', upsert: true }
    );

    revalidateAll();

    return NextResponse.json({ success: true, message: 'Settings saved successfully', settings: updated });
  } catch (err) {
    console.error('[API Admin Settings PUT Error]:', err.message);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
