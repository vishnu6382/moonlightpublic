import { siteConfig } from '../content/site.js';
import { facilitiesData } from '../content/facilities.js';

/**
 * Generates LodgingBusiness / Resort JSON-LD for the Home page.
 * Strictly avoids aggregateRating/review/priceRange unless verified data exists.
 */
export function getResortJsonLd(homeContent = null, baseUrl = '') {
  const siteUrl = (baseUrl || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const checkIn = homeContent?.stayContent?.checkInTime || '13:00';
  const checkOut = homeContent?.stayContent?.checkOutTime || '11:00';

  // Amenities from real facilities list
  const amenities = [];
  if (facilitiesData && Array.isArray(facilitiesData.groups)) {
    for (const group of facilitiesData.groups) {
      if (Array.isArray(group.items)) {
        for (const item of group.items) {
          amenities.push({
            '@type': 'LocationFeatureSpecification',
            name: item.name,
            value: true,
          });
        }
      }
    }
  }

  // Real phones
  const phones = [];
  if (siteConfig.phone) phones.push(siteConfig.phone);
  if (siteConfig.secondaryPhone) phones.push(siteConfig.secondaryPhone);

  // Social links
  const socialLinks = (siteConfig.socialLinks || [])
    .filter((s) => s.url && s.url.trim().length > 0)
    .map((s) => s.url.trim());

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Resort',
    name: siteConfig.name || 'Moon Light Resort',
    url: siteUrl,
    logo: `${siteUrl}/icon.svg`,
    image: [
      `${siteUrl}/og-default.jpg`,
    ],
    telephone: phones.length > 0 ? (phones.length === 1 ? phones[0] : phones) : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Thambagoundanoor to Idappadi main Road, Koneripatti',
      addressLocality: 'Nedungulam',
      addressRegion: 'Tamil Nadu',
      addressCountry: 'IN',
    },
    checkinTime: checkIn,
    checkoutTime: checkOut,
    amenityFeature: amenities.length > 0 ? amenities : undefined,
    sameAs: socialLinks.length > 0 ? socialLinks : undefined,
  };

  return jsonLd;
}

/**
 * Generates HotelRoom JSON-LD for room details pages.
 */
export function getRoomJsonLd(room, baseUrl = '') {
  if (!room) return null;
  const siteUrl = (baseUrl || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  const roomAmenities = (room.facilities || []).map((f) => ({
    '@type': 'LocationFeatureSpecification',
    name: typeof f === 'string' ? f : f.name,
    value: true,
  }));

  const mainImg = room.mainImage || room.image || (room.photos?.[0]?.src);
  const imageUrl = mainImg
    ? (mainImg.startsWith('http') ? mainImg : `${siteUrl}${mainImg}`)
    : `${siteUrl}/og-default.jpg`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'HotelRoom',
    name: room.name,
    description: room.description || room.shortDescription || 'Comfortable stay at Moon Light Resort in Nedungulam, Tamil Nadu.',
    image: imageUrl,
    isPartOf: {
      '@type': 'Resort',
      name: siteConfig.name || 'Moon Light Resort',
      url: siteUrl,
    },
  };

  if (room.maxOccupancy) {
    jsonLd.occupancy = {
      '@type': 'QuantitativeValue',
      maxValue: Number(room.maxOccupancy),
    };
  }

  if (room.bedType) {
    jsonLd.bed = {
      '@type': 'BedDetails',
      typeOfBed: room.bedType,
    };
  }

  if (roomAmenities.length > 0) {
    jsonLd.amenityFeature = roomAmenities;
  }

  return jsonLd;
}

/**
 * Generates BreadcrumbList JSON-LD.
 */
export function getBreadcrumbJsonLd(items, baseUrl = '') {
  const siteUrl = (baseUrl || process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.path}`,
    })),
  };
}
