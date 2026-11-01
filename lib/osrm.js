import { siteConfig } from '../content/site.js';

const RESORT_COORDS = siteConfig.coordinates || { lat: 11.5835, lng: 77.7885 };

/**
 * Calculates a driving route using OSRM between the resort and target coordinates.
 * Falls back cleanly to a straight-line LineString if OSRM is unreachable.
 *
 * @param {number} destLat - Destination Latitude
 * @param {number} destLng - Destination Longitude
 * @returns {Promise<{ routeGeometry: object, distanceKm: number, durationMin: number }>}
 */
export async function calculateRouteForPlace(destLat, destLng) {
  const straightLine = {
    type: 'LineString',
    coordinates: [
      [RESORT_COORDS.lng, RESORT_COORDS.lat],
      [destLng, destLat],
    ],
  };

  // Straight line Haversine distance as baseline
  const R = 6371; // km
  const dLat = ((destLat - RESORT_COORDS.lat) * Math.PI) / 180;
  const dLon = ((destLng - RESORT_COORDS.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((RESORT_COORDS.lat * Math.PI) / 180) *
      Math.cos((destLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const haversineKm = Math.round(R * c);

  try {
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${RESORT_COORDS.lng},${RESORT_COORDS.lat};${destLng},${destLat}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(osrmUrl, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      const route = data.routes?.[0];
      if (route && route.geometry) {
        const roadDistanceKm = Math.round((route.distance || 0) / 1000);
        const roadDurationMin = Math.round((route.duration || 0) / 60);

        return {
          routeGeometry: route.geometry,
          distanceKm: roadDistanceKm || haversineKm,
          durationMin: roadDurationMin,
        };
      }
    }
  } catch (err) {
    console.warn('[OSRM] Could not compute driving route, using straight-line fallback:', err.message);
  }

  return {
    routeGeometry: straightLine,
    distanceKm: haversineKm,
    durationMin: Math.round(haversineKm * 1.5), // Estimate ~40 km/h
  };
}

