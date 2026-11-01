import Intro from '@/components/Intro';
import HomeStay from '@/components/HomeStay';
import HomeFacilities from '@/components/HomeFacilities';
import PhotoShowcase from '@/components/PhotoShowcase';
import RoomsPreview from '@/components/RoomsPreview';
import GoogleReviews from '@/components/Reviews';
import NearbyPreview from '@/components/NearbyPreview';
import HomeEvents from '@/components/HomeEvents';
import HomeFAQ from '@/components/HomeFAQ';

import MoonlightBloom from '@/components/MoonlightFX/MoonlightBloom';
import HomeMoonlight from '@/components/MoonlightFX/HomeMoonlight';

import { getPublicHomeContent } from '@/lib/home';
import { getPublicRooms } from '@/lib/rooms';
import { getHomeNearbyPlaces } from '@/lib/nearby';
import { getPublicReviews } from '@/lib/data/reviews';
import { getPublicGalleryData } from '@/lib/gallery';
import { facilitiesData } from '@/content/facilities';
import JsonLd from '@/components/JsonLd';
import { getResortJsonLd } from '@/lib/structuredData';

export const revalidate = 60;

export const metadata = {
  title: 'Moon Light Resort | Stay in Nedungulam, Salem, Tamil Nadu',
  description:
    'Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a private pool, campfire, and open party spaces for family and group gatherings.',
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Moon Light Resort | Stay in Nedungulam, Salem, Tamil Nadu',
    description:
      'Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a private pool, campfire, and open party spaces for family and group gatherings.',
    url: '/',
    siteName: 'Moon Light Resort',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Moon Light Resort Nedungulam',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moon Light Resort | Stay in Nedungulam, Salem, Tamil Nadu',
    description:
      'Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a private pool, campfire, and open party spaces for family and group gatherings.',
    images: ['/og-default.jpg'],
  },
};

export default async function HomePage() {
  const [homeContent, dbRooms, nearbyPlaces, dbReviews, galleryData] = await Promise.all([
    getPublicHomeContent().catch(() => null),
    getPublicRooms().catch(() => []),
    getHomeNearbyPlaces().catch(() => []),
    getPublicReviews().catch(() => []),
    getPublicGalleryData().catch(() => null),
  ]);

  const stayData = homeContent?.stayContent || null;
  const showcaseMeta = homeContent?.showcaseData || null;
  const showcaseList = homeContent?.showcaseItems || [];
  const introData = homeContent?.introData;
  const rooms = dbRooms && dbRooms.length > 0 ? dbRooms : [];
  const reviews = dbReviews || [];
  const nearby = nearbyPlaces || [];
  const events = homeContent?.events || [];
  const faqs = homeContent?.faqs || [];

  return (
    <>
      {/* Structured Data (Schema.org / JSON-LD) */}
      <JsonLd data={getResortJsonLd(homeContent)} />

      {/* 1. Scroll-Scrub Gate Intro */}
      <Intro data={introData} />

      {/* 2. Stay / About: references/home-stay-layout.jpg */}
      {stayData && <HomeStay content={stayData} />}

      {/* 3. Facilities: 12 real facilities in 4 groups with custom featured photo */}
      <HomeFacilities data={homeContent?.facilities || facilitiesData} />

      {/* 4. Photo Showcase: Captured Moments of Serenity */}
      <PhotoShowcase
        portalItem={showcaseMeta?.portalItem}
        items={showcaseList}
        allMediaItems={galleryData?.items || []}
        pills={showcaseMeta?.pills}
        title={showcaseMeta?.title}
        subtitle={showcaseMeta?.subtitle}
      />

      {/* 5. Our Room Types */}
      <RoomsPreview rooms={rooms} />

      {/* 6. Google Reviews: Two-row CSS marquee */}
      <GoogleReviews reviews={reviews} />

      {/* 7. Nearby Areas: Bento preview linking to /nearby-areas */}
      <NearbyPreview items={nearby} />

      {/* 8. Events: Horizontal carousel with lightbox modal */}
      <HomeEvents events={events} />

      {/* 9. FAQs: Frequently Asked Questions accordion */}
      <HomeFAQ faqs={faqs} />

      {/* Moonlight Effects (TASK 09b) */}
      <MoonlightBloom />
      <HomeMoonlight />
    </>
  );
}
