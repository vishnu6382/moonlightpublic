import { NextResponse } from 'next/server.js';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import connectDB from '@/lib/db';
import MediaItem from '@/models/MediaItem';
import cloudinary from '@/lib/cloudinary';

export async function POST(request) {
  try {
    // 1. Session check
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized. Admin session required.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const {
      cloudinaryPublicId,
      secureUrl,
      resourceType = 'image',
      mediaType = 'image',
      title = '',
      caption = '',
      altText = '',
      roomId = null,
      categoryId = null,
      showOnHome = false,
      showInGallery = true,
      isActive = true,
      order = 0,
    } = body;

    if (!cloudinaryPublicId || !secureUrl) {
      return NextResponse.json(
        { error: 'Cloudinary Public ID and Secure URL are required.' },
        { status: 400 }
      );
    }

    // 2. Server-side verification with Cloudinary to ensure the asset exists and get confirmed metadata
    let assetMetadata;
    try {
      assetMetadata = await cloudinary.api.resource(cloudinaryPublicId, {
        resource_type: resourceType,
      });
    } catch (cErr) {
      console.error('[Cloudinary Resource Verification Error]:', cErr);
      return NextResponse.json(
        {
          error:
            'Failed to verify asset with Cloudinary. Asset might not exist or belongs to an unauthorized account.',
        },
        { status: 400 }
      );
    }

    const confirmedWidth = assetMetadata.width || body.width || null;
    const confirmedHeight = assetMetadata.height || body.height || null;
    const confirmedBytes = assetMetadata.bytes || body.sizeBytes || 0;
    const confirmedFormat = assetMetadata.format || body.format || '';
    const confirmedDuration = assetMetadata.duration || body.durationSec || null;
    const confirmedUrl = assetMetadata.secure_url || secureUrl;

    // Reject SVG, HTML, script, or unapproved media formats
    const ALLOWED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
    const ALLOWED_VIDEO_FORMATS = ['mp4', 'webm', 'mov', 'm4v'];
    const normalizedFormat = (confirmedFormat || '').toLowerCase();

    if (resourceType === 'image' && !ALLOWED_IMAGE_FORMATS.includes(normalizedFormat)) {
      return NextResponse.json(
        {
          error: `Image format .${normalizedFormat || 'unknown'} is forbidden. Allowed formats: JPG, PNG, WEBP, AVIF. Vector SVG and scripts are blocked for security.`,
        },
        { status: 400 }
      );
    }

    if (resourceType === 'video' && !ALLOWED_VIDEO_FORMATS.includes(normalizedFormat)) {
      return NextResponse.json(
        {
          error: `Video format .${normalizedFormat || 'unknown'} is not allowed. Supported formats: MP4, WEBM, MOV.`,
        },
        { status: 400 }
      );
    }

    // 3. For 360 Panoramas, validate 2:1 aspect ratio
    if (mediaType === 'pano360') {
      if (!confirmedWidth || !confirmedHeight) {
        return NextResponse.json(
          { error: 'Unable to verify dimensions for 360° panorama.' },
          { status: 400 }
        );
      }
      const ratio = confirmedWidth / confirmedHeight;
      if (Math.abs(ratio - 2.0) > 0.05) {
        return NextResponse.json(
          {
            error: `360° Panorama requires a 2:1 aspect ratio. Detected ${confirmedWidth}x${confirmedHeight} (ratio: ${ratio.toFixed(2)}:1).`,
          },
          { status: 400 }
        );
      }
    }

    // 4. Save record to MongoDB
    await connectDB();

    const is360Photo = Boolean(
      body.is360 ||
      mediaType === 'pano360' ||
      (confirmedWidth && confirmedHeight && Math.abs(confirmedWidth / confirmedHeight - 2.0) <= 0.1)
    );

    const newMedia = await MediaItem.create({
      provider: 'cloudinary',
      cloudinaryPublicId,
      secureUrl: confirmedUrl,
      resourceType,
      mediaType: is360Photo ? 'pano360' : mediaType,
      is360: is360Photo,
      format: confirmedFormat,
      mimeType: `${resourceType}/${confirmedFormat}`,
      sizeBytes: confirmedBytes,
      width: confirmedWidth,
      height: confirmedHeight,
      durationSec: confirmedDuration,
      posterUrl: resourceType === 'video' ? confirmedUrl.replace(/\.[^/.]+$/, '.jpg') : '',
      title: title.trim(),
      caption: caption.trim(),
      altText: altText.trim(),
      roomId: roomId || null,
      categoryId: categoryId || null,
      showOnHome: Boolean(showOnHome),
      showInGallery: Boolean(showInGallery),
      isActive: Boolean(isActive),
      order: Number(order) || 0,
    });

    return NextResponse.json({
      success: true,
      media: newMedia,
    });
  } catch (error) {
    console.error('[Media Registration Error]:', error);
    return NextResponse.json(
      {
        error:
          'Failed to register media in database. If upload succeeded in Cloudinary, asset might be untracked.',
      },
      { status: 500 }
    );
  }
}
