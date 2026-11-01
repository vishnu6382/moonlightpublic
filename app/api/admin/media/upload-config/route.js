import { NextResponse } from 'next/server.js';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { generateUploadSignature } from '@/lib/cloudinary';

export async function POST(request) {
  try {
    // 1. Session verification
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { mediaType = 'image' } = body;

    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = 'moonlight_resort';

    // Parameters signed for Cloudinary authenticated upload
    const paramsToSign = {
      timestamp,
      folder,
    };

    const signature = generateUploadSignature(paramsToSign);

    return NextResponse.json({
      success: true,
      timestamp,
      folder,
      signature,
      apiKey: process.env.CLOUDINARY_API_KEY,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      uploadUrl: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/${mediaType === 'video' ? 'video' : 'image'}/upload`,
    });
  } catch (error) {
    console.error('[Upload Config Error]:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload configuration.' },
      { status: 500 }
    );
  }
}
