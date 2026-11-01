// Client-safe constants and math utilities for Nearby Places and Maps
// Zero database / server dependencies

export const DISTRICT_COLORS = {
  salem: {
    name: 'Salem',
    color: '#2E9E6B', // green
    textColor: '#FFFFFF',
    lightBg: 'rgba(46, 158, 107, 0.09)',
  },
  erode: {
    name: 'Erode',
    color: '#F28C28', // orange
    textColor: '#FFFFFF',
    lightBg: 'rgba(242, 140, 40, 0.09)',
  },
  namakkal: {
    name: 'Namakkal',
    color: '#7A52C7', // purple
    textColor: '#FFFFFF',
    lightBg: 'rgba(122, 82, 199, 0.09)',
  },
};

export const CATEGORY_COLORS = {
  Temples: {
    color: '#E4572E',
    textColor: '#FFFFFF',
    lightBg: 'rgba(228, 87, 46, 0.1)',
  },
  'Dams & Lakes': {
    color: '#2F80ED',
    textColor: '#FFFFFF',
    lightBg: 'rgba(47, 128, 237, 0.1)',
  },
  Waterfalls: {
    color: '#14B8C4',
    textColor: '#FFFFFF',
    lightBg: 'rgba(20, 184, 196, 0.1)',
  },
  'Hills & Nature': {
    color: '#43A047',
    textColor: '#FFFFFF',
    lightBg: 'rgba(67, 160, 71, 0.1)',
  },
  'Heritage & Museum': {
    color: '#8D6E63',
    textColor: '#FFFFFF',
    lightBg: 'rgba(141, 110, 99, 0.1)',
  },
  Wildlife: {
    color: '#F2B01E',
    textColor: '#1A1A1A',
    lightBg: 'rgba(242, 176, 30, 0.14)',
  },
};

export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export function formatTravelMinutes(min) {
  if (min == null || isNaN(min)) return null;
  const total = Number(min);
  if (total <= 0) return null;
  if (total < 60) return `${total} min`;
  const hrs = Math.floor(total / 60);
  const rem = total % 60;
  if (rem === 0) return hrs === 1 ? '1 hr' : `${hrs} hrs`;
  return `${hrs} h ${rem} min`;
}

export function slugify(str) {
  if (!str) return '';
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

