import { getPublicGalleryData } from '@/lib/gallery';
import GalleryClient from '@/components/GalleryClient';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbJsonLd } from '@/lib/structuredData';

export const revalidate = 60;

export const metadata = {
  title: 'Photo & Video Gallery | Moon Light Resort',
  description:
    'Explore curated photos and 360° virtual tours of Moon Light Resort in Nedungulam, Tamil Nadu. Discover our private villa rooms, swimming pool, sports turf, and peaceful open grounds.',
  alternates: {
    canonical: '/gallery',
  },
  openGraph: {
    title: 'Photo & Video Gallery | Moon Light Resort',
    description:
      'Curated photos and 360° virtual tours of Moon Light Resort in Nedungulam, Tamil Nadu.',
    url: '/gallery',
    siteName: 'Moon Light Resort',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Moon Light Resort Gallery',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Photo & Video Gallery | Moon Light Resort',
    description:
      'Curated photos and 360° virtual tours of Moon Light Resort in Nedungulam, Tamil Nadu.',
    images: ['/og-default.jpg'],
  },
};

export default async function GalleryPage() {
  const { items, categories, rooms, round360Tiles } = await getPublicGalleryData();

  return (
    <>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Gallery', url: '/gallery' },
        ])}
      />
      <GalleryClient
        initialItems={items}
        categories={categories}
        rooms={rooms}
        round360Tiles={round360Tiles}
      />
    </>
  );
}
