import { getResortJsonLd, getRoomJsonLd, getBreadcrumbJsonLd } from '../lib/structuredData.js';
import { realRooms } from '../content/rooms.js';

console.log('--- Testing & Validating Structured Data (JSON-LD) ---');

let hasErrors = false;

// 1. Validate Resort JSON-LD
try {
  const resortLd = getResortJsonLd(null, 'https://moonlightresortstays.com');
  const jsonStr = JSON.stringify(resortLd);
  const parsed = JSON.parse(jsonStr);

  // Check required fields
  const required = ['@context', '@type', 'name', 'url', 'address', 'telephone'];
  for (const field of required) {
    if (!parsed[field]) {
      console.error(`✗ Resort JSON-LD missing required field: ${field}`);
      hasErrors = true;
    }
  }

  // Confirm NO aggregateRating, review, or priceRange leaked
  if (parsed.aggregateRating || parsed.review || parsed.priceRange) {
    console.error('✗ CRITICAL: Fake ratings/reviews/prices leaked into Resort JSON-LD!');
    hasErrors = true;
  } else {
    console.log('✓ Verified: No aggregateRating or review leaked into Resort JSON-LD.');
  }

  console.log('✓ Resort JSON-LD parsed and validated successfully:');
  console.log(`  Type: ${parsed['@type']}`);
  console.log(`  Name: ${parsed.name}`);
  console.log(`  Address: ${parsed.address.streetAddress}, ${parsed.address.addressLocality}, ${parsed.address.addressRegion}`);
  console.log(`  Telephones: ${Array.isArray(parsed.telephone) ? parsed.telephone.join(', ') : parsed.telephone}`);
  console.log(`  Amenities count: ${parsed.amenityFeature?.length || 0}`);
} catch (err) {
  console.error('✗ Failed to validate Resort JSON-LD:', err);
  hasErrors = true;
}

// 2. Validate Room JSON-LD
try {
  const room = realRooms[0];
  const roomLd = getRoomJsonLd(room, 'https://moonlightresortstays.com');
  const parsed = JSON.parse(JSON.stringify(roomLd));

  if (parsed['@type'] !== 'HotelRoom' || !parsed.name || !parsed.isPartOf) {
    console.error('✗ Room JSON-LD failed required fields check');
    hasErrors = true;
  } else {
    console.log(`✓ Room JSON-LD (${parsed.name}) validated:`);
    console.log(`  Type: ${parsed['@type']}`);
    console.log(`  Max Occupancy: ${parsed.occupancy?.maxValue || 'N/A'}`);
    console.log(`  Bed: ${parsed.bed?.typeOfBed || 'N/A'}`);
    console.log(`  Amenities: ${parsed.amenityFeature?.length || 0}`);
  }
} catch (err) {
  console.error('✗ Failed to validate Room JSON-LD:', err);
  hasErrors = true;
}

// 3. Validate Breadcrumbs JSON-LD
try {
  const breadcrumbs = [
    { name: 'Home', path: '/' },
    { name: 'Rooms', path: '/rooms' },
    { name: 'Moon 1', path: '/rooms/moon-1' },
  ];
  const bcLd = getBreadcrumbJsonLd(breadcrumbs, 'https://moonlightresortstays.com');
  const parsed = JSON.parse(JSON.stringify(bcLd));

  if (parsed['@type'] !== 'BreadcrumbList' || parsed.itemListElement?.length !== 3) {
    console.error('✗ Breadcrumb JSON-LD validation failed');
    hasErrors = true;
  } else {
    console.log('✓ BreadcrumbList JSON-LD validated with 3 items.');
  }
} catch (err) {
  console.error('✗ Failed to validate Breadcrumbs JSON-LD:', err);
  hasErrors = true;
}

if (hasErrors) {
  console.error('\n❌ JSON-LD Validation failed with errors.');
  process.exit(1);
} else {
  console.log('\n✅ All JSON-LD schemas validated successfully!');
}

