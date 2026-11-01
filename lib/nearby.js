// DATA ACCESS LAYER FOR NEARBY AREAS
// Pure MongoDB dynamic source with real coordinates and driving routes.
// Zero demo files or demo chip flags.

import connectDB from './db.js';
import Place from '../models/Place.js';
import { siteConfig } from '../content/site.js';
import districtsGeoJSON from '../content/map/highlighted-districts.js';
import {
  DISTRICT_COLORS,
  CATEGORY_COLORS,
  calculateHaversineDistance,
  formatTravelMinutes,
  slugify,
} from './nearbyConstants.js';

export {
  DISTRICT_COLORS,
  CATEGORY_COLORS,
  calculateHaversineDistance,
  formatTravelMinutes,
  slugify,
};

/**
 * Main accessor function for Nearby page and components.
 * Loads directly from MongoDB Place collection.
 */
export async function getNearbyData() {
  const resort = {
    name: siteConfig.name || 'Moon Light Resort',
    lat: siteConfig.coordinates?.lat || 11.5835,
    lng: siteConfig.coordinates?.lng || 77.7885,
    address: siteConfig.address || 'Nedungulam, Tamil Nadu',
    district: 'salem',
  };

  const defaultDistricts = [
    { slug: 'salem', name: 'Salem', isHome: true, colorInfo: DISTRICT_COLORS.salem },
    { slug: 'erode', name: 'Erode', isHome: false, colorInfo: DISTRICT_COLORS.erode },
    { slug: 'namakkal', name: 'Namakkal', isHome: false, colorInfo: DISTRICT_COLORS.namakkal },
  ];

  try {
    await connectDB();
    const dbPlaces = await Place.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    if (!dbPlaces || dbPlaces.length === 0) {
      return {
        resort,
        districts: defaultDistricts,
        categories: [],
        places: [],
        districtsGeoJSON,
        isDemo: false,
        showDemoChip: false,
      };
    }

    const categoriesSet = new Set();
    const places = dbPlaces.map((p, idx) => {
      const slug = p.slug || slugify(p.name);
      const districtKey = (p.district || 'salem').toLowerCase();
      const categoryName = p.category || 'Hills & Nature';
      categoriesSet.add(categoryName);

      const approxKm = calculateHaversineDistance(
        resort.lat,
        resort.lng,
        p.lat,
        p.lng
      );

      const manualKm = p.distanceKm != null && !isNaN(p.distanceKm) ? Number(p.distanceKm) : null;
      const manualMin = p.travelMinutes != null && !isNaN(p.travelMinutes) ? Number(p.travelMinutes) : null;
      const manualTimeLabel = p.travelTimeLabel || p.travelTime || null;

      const savedKm = p.routeDistanceKm != null ? Number(p.routeDistanceKm) : null;
      const savedMin = p.routeDurationMin != null ? Number(p.routeDurationMin) : null;

      const distanceKm = manualKm ?? savedKm ?? approxKm;
      const durationMin = manualMin ?? savedMin ?? null;

      const travelTime = manualTimeLabel ?? formatTravelMinutes(durationMin) ?? null;
      const isManualDistance = manualKm != null;
      const isRoadDistance = manualKm != null || savedKm != null;

      const displayDistance = isRoadDistance
        ? (travelTime ? `${distanceKm} km · ${travelTime}` : `${distanceKm} km by road`)
        : `about ${distanceKm} km (straight line)`;

      const pillLabel = travelTime ? `${distanceKm} km · ${travelTime}` : `${distanceKm} km`;
      const pillLabelAlt = travelTime ? `${travelTime} · ${distanceKm} km` : `${distanceKm} km`;

      const mapsUrl =
        p.mapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${p.name}, ${p.district}, Tamil Nadu`
        )}`;

      const directionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${resort.lat},${resort.lng}&destination=${p.lat},${p.lng}`;

      const districtColor = DISTRICT_COLORS[districtKey] || { color: '#4A4339', textColor: '#FFFFFF' };
      const categoryColor = CATEGORY_COLORS[categoryName] || { color: '#4A4339', textColor: '#FFFFFF' };

      const order = p.order != null && !isNaN(p.order) ? Number(p.order) : idx + 1;

      return {
        id: p._id.toString(),
        _id: p._id.toString(),
        slug,
        title: p.name,
        name: p.name,
        district: districtKey,
        category: categoryName,
        lat: p.lat,
        lng: p.lng,
        mapsUrl,
        directionsUrl,
        distanceKm,
        durationMin,
        travelTime: p.travelTime || travelTime || '',
        approxStraightKm: approxKm,
        displayDistance,
        pillLabel,
        pillLabelAlt,
        isRoadDistance,
        isManualDistance,
        routeGeometry: p.routeGeometry || null,
        description: p.description || '',
        photos: Array.isArray(p.photos) ? p.photos : [],
        landmarkImage: p.landmarkImage || null,
        image: p.landmarkImage || (p.photos && p.photos[0]?.url) || '',
        coordsStatus: 'verified',
        districtColor,
        categoryColor,
        order,
        featuredOnHome: Boolean(p.featuredOnHome),
        isFeatured: Boolean(p.featuredOnHome),
        featured: Boolean(p.featuredOnHome),
        isDemo: false,
        showDemoChip: false,
      };
    });

    places.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      return (a.distanceKm || 0) - (b.distanceKm || 0);
    });

    const categories = Array.from(categoriesSet).map((catName) => ({
      name: catName,
      colorInfo: CATEGORY_COLORS[catName] || { color: '#4A4339', textColor: '#FFFFFF' },
    }));

    return {
      resort,
      districts: defaultDistricts,
      categories,
      places,
      districtsGeoJSON,
      isDemo: false,
      showDemoChip: false,
    };
  } catch (err) {
    console.error('[Nearby] Failed to fetch places from MongoDB:', err.message);
    return {
      resort,
      districts: defaultDistricts,
      categories: [],
      places: [],
      districtsGeoJSON,
      isDemo: false,
      showDemoChip: false,
    };
  }
}

/**
 * Home page preview helper (first places by order).
 */
export async function getHomeNearbyPlaces(count = 6) {
  const { places } = await getNearbyData();
  if (!places || places.length === 0) return [];
  return places.slice(0, count);
}
