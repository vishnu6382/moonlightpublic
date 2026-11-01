import { getPublicRooms } from '@/lib/rooms';

export default async function sitemap() {
  const siteUrl = (process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const now = new Date();

  // 1. Static Public Pages
  const staticPages = [
    {
      url: `${siteUrl}`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/rooms`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${siteUrl}/gallery`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/nearby-areas`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${siteUrl}/contact`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // 2. Dynamic Room Pages from Database
  let roomPages = [];
  try {
    const rooms = await getPublicRooms();
    if (Array.isArray(rooms)) {
      roomPages = rooms
        .filter((r) => r.slug && !r.isDemo)
        .map((r) => ({
          url: `${siteUrl}/rooms/${r.slug}`,
          lastModified: r.updatedAt ? new Date(r.updatedAt) : now,
          changeFrequency: 'weekly',
          priority: 0.8,
        }));
    }
  } catch (err) {
    console.error('[Sitemap] Failed to fetch dynamic room routes:', err.message);
  }

  return [...staticPages, ...roomPages];
}
