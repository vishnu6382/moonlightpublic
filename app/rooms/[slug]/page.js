import { notFound } from 'next/navigation';
import { getPublicRooms, getPublicRoomBySlug } from '@/lib/rooms';
import RoomDetailClient from '@/components/RoomDetailClient';
import JsonLd from '@/components/JsonLd';
import { getRoomJsonLd, getBreadcrumbJsonLd } from '@/lib/structuredData';

export const dynamicParams = true;
export const revalidate = 60;

export async function generateStaticParams() {
  try {
    const rooms = await getPublicRooms();
    return (rooms || []).map((r) => ({ slug: r.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const room = await getPublicRoomBySlug(slug);

  if (!room) {
    return {
      title: 'Room Not Found | Moon Light Resort',
    };
  }

  const title = room.seoTitle || `${room.name} | Moon Light Resort`;
  const description =
    room.seoDescription ||
    `${room.name} at Moon Light Resort in Nedungulam, Tamil Nadu offers peaceful accommodation with access to swimming pool and open lawn spaces.`;
  const imageUrl = room.mainImage || room.image || '/og-default.jpg';

  return {
    title,
    description,
    alternates: {
      canonical: `/rooms/${slug}`,
    },
    openGraph: {
      title,
      description,
      url: `/rooms/${slug}`,
      siteName: 'Moon Light Resort',
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 675,
          alt: room.name,
        },
      ],
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
    },
  };
}

export default async function RoomDetailPage({ params }) {
  const { slug } = await params;
  const room = await getPublicRoomBySlug(slug);

  if (!room) {
    notFound();
  }

  const allRooms = await getPublicRooms();
  const otherRooms = allRooms.filter((r) => r.slug !== slug);

  const breadcrumbs = [
    { name: 'Home', url: '/' },
    { name: 'Rooms', url: '/rooms' },
    { name: room.name, url: `/rooms/${room.slug}` },
  ];

  return (
    <>
      <JsonLd data={getRoomJsonLd(room)} />
      <JsonLd data={getBreadcrumbJsonLd(breadcrumbs)} />
      <RoomDetailClient room={room} otherRooms={otherRooms} />
    </>
  );
}
