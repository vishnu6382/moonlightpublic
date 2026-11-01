import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import connectDB from '@/lib/db';
import Place from '@/models/Place';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { calculateRouteForPlace } from '@/lib/osrm';

function extractCoordinatesFromUrl(url) {
  if (!url) return null;
  const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  }
  const qMatch = url.match(/[?&](?:q|ll)=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (qMatch) {
    return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  }
  return null;
}

export async function PUT(request, context) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;
    const body = await request.json();

    await connectDB();
    const place = await Place.findById(id);
    if (!place) {
      return NextResponse.json({ error: 'Place not found.' }, { status: 404 });
    }

    let lat = body.lat !== undefined ? parseFloat(body.lat) : place.lat;
    let lng = body.lng !== undefined ? parseFloat(body.lng) : place.lng;

    if (isNaN(lat) || isNaN(lng)) {
      const extracted = extractCoordinatesFromUrl(body.mapsUrl);
      if (extracted) {
        lat = extracted.lat;
        lng = extracted.lng;
      }
    }

    // If coordinates changed or route missing, recalculate safely
    if (lat !== place.lat || lng !== place.lng || !place.routeGeometry) {
      try {
        const routeData = await calculateRouteForPlace(lat, lng);
        place.routeGeometry = routeData.routeGeometry;
        place.routeDistanceKm = routeData.distanceKm;
        place.routeDurationMin = routeData.durationMin;
        if (!body.distanceKm) place.distanceKm = routeData.distanceKm;
        if (!body.travelMinutes) {
          place.travelMinutes = routeData.durationMin;
          place.travelTimeLabel = `${routeData.durationMin} mins`;
        }
      } catch (_) {
        // Fallback without blocking save
      }
    }

    if (body.name !== undefined) place.name = body.name;
    if (body.district !== undefined) place.district = body.district.toLowerCase();
    if (body.category !== undefined) place.category = body.category;
    if (body.mapsUrl !== undefined) place.mapsUrl = body.mapsUrl;
    if (body.distanceKm !== undefined) place.distanceKm = parseFloat(body.distanceKm) || null;
    if (body.travelTime !== undefined) place.travelTime = body.travelTime;
    if (body.travelMinutes !== undefined) {
      place.travelMinutes = parseInt(body.travelMinutes, 10) || null;
      place.travelTimeLabel = place.travelMinutes ? `${place.travelMinutes} mins` : '';
    }
    if (body.description !== undefined) place.description = body.description;
    if (body.landmarkImage !== undefined) place.landmarkImage = body.landmarkImage;
    if (body.featuredOnHome !== undefined) {
      const isFeat = Boolean(body.featuredOnHome);
      place.featuredOnHome = isFeat;
      if (isFeat) {
        await Place.updateMany({ _id: { $ne: place._id } }, { $set: { featuredOnHome: false } });
      }
    }
    if (body.isActive !== undefined) place.isActive = Boolean(body.isActive);
    if (body.order !== undefined) place.order = parseInt(body.order, 10) || 0;

    place.lat = lat;
    place.lng = lng;

    await place.save();

    try {
      revalidatePath('/');
      revalidatePath('/nearby-areas');
    } catch (_) {}

    return NextResponse.json({ success: true, place });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    const session = await verifySessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized.' }, { status: 401 });
    }

    const { id } = await context.params;

    await connectDB();
    const deleted = await Place.findByIdAndDelete(id);

    if (!deleted) {
      return NextResponse.json({ error: 'Place not found.' }, { status: 404 });
    }

    try {
      revalidatePath('/');
      revalidatePath('/nearby-areas');
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Place deleted successfully.' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

