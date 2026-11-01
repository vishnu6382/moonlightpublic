import JsonLd from '@/components/JsonLd';
import { getBreadcrumbJsonLd } from '@/lib/structuredData';
import { getNearbyData } from '@/lib/nearby';
import NearbyAttractions from '@/components/NearbyAttractions';

export const revalidate = 60;

export const metadata = {
  title: 'Nearby Attractions | Moon Light Resort',
  description:
    'Discover what is around Moon Light Resort in Nedungulam, Salem, and surrounding districts. Cinematic travel highlights and local destinations.',
  alternates: {
    canonical: '/nearby-areas',
  },
  openGraph: {
    title: 'Nearby Attractions | Moon Light Resort',
    description:
      'Discover what is around Moon Light Resort in Nedungulam, Salem, and surrounding districts. Cinematic travel highlights and local destinations.',
    url: '/nearby-areas',
    siteName: 'Moon Light Resort',
    locale: 'en_IN',
    type: 'website',
  },
};

export default async function NearbyAreasPage() {
  const { places = [] } = await getNearbyData().catch(() => ({ places: [] }));

  return (
    <>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Nearby Attractions', url: '/nearby-areas' },
        ])}
      />
      <main style={{ minHeight: '80vh', backgroundColor: '#FFFFFF' }}>
        <NearbyAttractions
          items={places}
          title="Discover What's Around"
          subtitle="Explore beautiful places and memorable experiences around Moon Light Resort."
          eyebrow="EXPLORE THE SURROUNDINGS"
          showEmptyState={true}
        />
      </main>
    </>
  );
}
