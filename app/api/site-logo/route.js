import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import HomeContent from '@/models/HomeContent';
import MediaItem from '@/models/MediaItem';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    await connectDB();
    const doc = await HomeContent.findOne({ key: 'home_singleton' })
      .populate('logo.mediaId')
      .select('logo')
      .lean();

    const logoDoc = doc?.logo || {};
    const media = logoDoc.mediaId;
    const url = media?.secureUrl || logoDoc.url || '';
    const alt = media?.altText || logoDoc.alt || 'Moon Light Resort';
    const showText = logoDoc.showText !== false;

    return NextResponse.json(
      {
        success: true,
        logo: {
          url,
          alt,
          showText,
        },
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    return NextResponse.json({
      success: true,
      logo: {
        url: '',
        alt: 'Moon Light Resort',
        showText: true,
      },
    });
  }
}
