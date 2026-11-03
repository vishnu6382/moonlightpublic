/**
 * Festive Theme & Offers Helper
 * Computes whether the festive theme should be active today based on admin configuration.
 */

export const FESTIVAL_PRESETS = {
  diwali: {
    title: 'Diwali Celebration',
    bannerText: '✨ Diwali Special Offer: Book your stay today and get access to our exclusive festive celebration. Limited slots!',
    ctaText: 'Book Now',
    ctaLink: '/contact',
    bgColor: '#58111A', // Deep festive wine/maroon
    textColor: '#FFFFFF',
    accentColor: '#FCD34D',
    diyaText: 'May Your Days Glow',
    showLights: true,
    showFloatingDiya: true,
    enableFireworks: true,
  },
  pongal: {
    title: 'Pongal Thirunaal',
    bannerText: '🌾 Iniya Pongal Nalvazhthukkal! Celebrate traditional harvest festival at Moon Light Resort with exclusive family discounts.',
    ctaText: 'View Rooms',
    ctaLink: '/rooms',
    bgColor: '#78350F', // Warm harvest terracotta
    textColor: '#FFFFFF',
    accentColor: '#FDE047',
    diyaText: 'Happy Pongal',
    showLights: true,
    showFloatingDiya: true,
    enableFireworks: true,
  },
  newyear: {
    title: 'New Year Celebrations',
    bannerText: '🎉 Welcome 2027 at Moon Light Resort! Poolside countdown, bonfire & festive dinner packages open now.',
    ctaText: 'Enquire Now',
    ctaLink: '/contact',
    bgColor: '#0F172A', // Midnight luxury navy
    textColor: '#FFFFFF',
    accentColor: '#38BDF8',
    diyaText: 'Happy New Year',
    showLights: true,
    showFloatingDiya: true,
    enableFireworks: true,
  },
  christmas: {
    title: 'Christmas & Winter Holiday',
    bannerText: '🎄 Holiday Getaway: Experience peaceful winter villas & warm hospitality at Moon Light Resort.',
    ctaText: 'Book Stay',
    ctaLink: '/contact',
    bgColor: '#143828', // Pine forest green
    textColor: '#FFFFFF',
    accentColor: '#F87171',
    diyaText: 'Merry Christmas',
    showLights: true,
    showFloatingDiya: true,
    enableFireworks: true,
  },
  custom: {
    title: 'Special Celebration',
    bannerText: '✨ Special Festive Offer: Book your group retreat today & enjoy complimentary resort perks.',
    ctaText: 'Book Now',
    ctaLink: '/contact',
    bgColor: '#4C1D95', // Royal festive purple
    textColor: '#FFFFFF',
    accentColor: '#FCD34D',
    diyaText: 'Special Celebration',
    showLights: true,
    showFloatingDiya: true,
    enableFireworks: true,
  },
};

export const DEFAULT_FESTIVE_SETTINGS = {
  enabled: true,
  festivalType: 'diwali',
  festivalTitle: 'Diwali Celebration',
  startDate: '',
  endDate: '',
  banner: {
    enabled: true,
    text: '✨ Diwali Special Offer: Book your stay today and get access to our exclusive festive celebration. Limited slots!',
    ctaText: 'Book Now',
    ctaLink: '/contact',
    bgColor: '#58111A',
    textColor: '#FFFFFF',
    accentColor: '#FCD34D',
  },
  decorations: {
    showLights: true,
    showFloatingDiya: true,
    diyaText: 'May Your Days Glow',
    enableFireworks: true,
    fireworksOnLoad: true,
  },
};

/**
 * Returns merged festive config with all defaults safely filled.
 */
export function getActiveFestiveConfig(festive) {
  const base = DEFAULT_FESTIVE_SETTINGS;
  if (!festive || typeof festive !== 'object') return base;
  return {
    ...base,
    ...festive,
    banner: {
      ...base.banner,
      ...(festive.banner || {}),
    },
    decorations: {
      ...base.decorations,
      ...(festive.decorations || {}),
    },
  };
}

/**
 * Checks whether the festive mode is currently active based on date range.
 */
export function isFestiveActive(festive) {
  if (!festive || !festive.enabled) return false;

  const now = new Date();
  // Get YYYY-MM-DD in local time
  const todayStr = now.toISOString().slice(0, 10);

  if (festive.startDate && festive.startDate.trim()) {
    if (todayStr < festive.startDate.trim()) {
      return false; // Hasn't started yet
    }
  }

  if (festive.endDate && festive.endDate.trim()) {
    if (todayStr > festive.endDate.trim()) {
      return false; // Already expired
    }
  }

  return true;
}
