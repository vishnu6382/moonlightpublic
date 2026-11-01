/**
 * Permanent 301 Redirects from Old Site URLs to New App Router URLs.
 * Ensures existing search engine indexation and inbound links preserve link equity.
 */
const redirects = [
  // 1. Old Room URLs from previous website
  {
    source: '/room-1755-moon-1',
    destination: '/rooms/moon-1',
    permanent: true,
  },
  {
    source: '/room-1755-moon-2',
    destination: '/rooms/moon-2',
    permanent: true,
  },
  {
    source: '/room-1755-moon-3',
    destination: '/rooms/moon-3',
    permanent: true,
  },
  {
    source: '/room-1755-moon-4',
    destination: '/rooms/moon-4',
    permanent: true,
  },
  // 2. Old generic / services / about URLs
  {
    source: '/services',
    destination: '/',
    permanent: true,
  },
  {
    source: '/facilities',
    destination: '/',
    permanent: true,
  },
  {
    source: '/about',
    destination: '/',
    permanent: true,
  },
  {
    source: '/about-us',
    destination: '/',
    permanent: true,
  },
  {
    source: '/home',
    destination: '/',
    permanent: true,
  },
  {
    source: '/index.html',
    destination: '/',
    permanent: true,
  },
];

export default redirects;

