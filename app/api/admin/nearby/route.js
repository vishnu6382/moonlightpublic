import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import Place from '@/models/Place';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { calculateRouteForPlace } from '@/lib/osrm';

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-');
}

function extractCoordinatesFromUrl(url) {
  if (!url) return null;
  // Match @11.12345,77.67890
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  // Match ?q=11.12345,77.67890 or &ll=11.12345,77.67890
  const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  return null;
}

export async function GET(request) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    await connectDB();
    const places = await Place.find({}).sort({ order: 1, createdAt: -1 }).lean();

    return NextResponse.json({ places });
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
      name,
      district = 'salem',
      category = 'Nature',
      mapsUrl = '',
      distanceKm,
      travelTime = '',
      description = '',
      landmarkImage = '',
      featuredOnHome = false,
      isActive = true,
      order = 0,
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: 'Destination name is required.' },
        { status: 400 }
      );
    }

    const finalDistrict = (district || 'salem').trim().toLowerCase();
    const finalCategory = (category || 'Nature').trim();

    let lat = parseFloat(body.lat);
    let lng = parseFloat(body.lng);

    if (isNaN(lat) || isNaN(lng)) {
      const extracted = extractCoordinatesFromUrl(mapsUrl);
      if (extracted) {
        lat = extracted.lat;
        lng = extracted.lng;
      }
    }

    // If still NaN, fallback to Salem/Nedungulam resort area coords (never block saving)
    if (isNaN(lat) || isNaN(lng)) {
      lat = 11.5833;
      lng = 77.8500;
    }

    await connectDB();

    const slug = slugify(name);
    const existing = await Place.findOne({ slug });
    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug;

    // Auto-generate driving route safely
    let routeData = { distanceKm: distanceKm ? parseFloat(distanceKm) : 0, durationMin: 0, routeGeometry: null };
    try {
      routeData = await calculateRouteForPlace(lat, lng);
    } catch (_) {
      // Graceful fallback if OSRM is slow or offline
    }

    const calcDistance = distanceKm ? parseFloat(distanceKm) : routeData.distanceKm;
    const calcMinutes = body.travelMinutes ? parseInt(body.travelMinutes, 10) : routeData.durationMin;
    const calcTimeLabel = travelTime || (calcMinutes ? `${calcMinutes} mins` : '');

    if (featuredOnHome) {
      await Place.updateMany({}, { $set: { featuredOnHome: false } });
    }

    const newPlace = await Place.create({
      name: name.trim(),
      slug: finalSlug,
      district: finalDistrict,
      category: finalCategory,
      mapsUrl: mapsUrl.trim(),
      lat,
      lng,
      distanceKm: calcDistance,
      travelTime: calcTimeLabel,
      travelMinutes: calcMinutes,
      travelTimeLabel: calcTimeLabel,
      routeGeometry: routeData.routeGeometry,
      routeDistanceKm: routeData.distanceKm,
      routeDurationMin: routeData.durationMin,
      landmarkImage: landmarkImage.trim(),
      featuredOnHome: Boolean(featuredOnHome),
      description: description.trim(),
      coordsVerified: true,
      isActive: Boolean(isActive),
      order: parseInt(order, 10) || 0,
    });

    try {
      revalidatePath('/');
      revalidatePath('/nearby-areas');
    } catch (_) {}

    return NextResponse.json({ success: true, place: newPlace }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

