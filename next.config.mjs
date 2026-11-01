import withBundleAnalyzer from '@next/bundle-analyzer';
import redirects from './redirects.config.js';

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

// Build strict Content Security Policy (CSP)
const cspDirectives = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob: https: https://res.cloudinary.com https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://images.unsplash.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "media-src 'self' blob: https://res.cloudinary.com https://*.r2.dev https://*.r2.cloudflarestorage.com",
  "connect-src 'self' https://res.cloudinary.com https://api.cloudinary.com https://*.r2.dev https://*.r2.cloudflarestorage.com https://*.tile.openstreetmap.org https://tile.openstreetmap.org https://router.project-osrm.org",
  "frame-src 'self' https://www.google.com https://maps.google.com",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
];

const cspHeaderValue = cspDirectives.join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: '**.r2.dev',
      },
      {
        protocol: 'https',
        hostname: '**.r2.cloudflarestorage.com',
      },
    ],
  },
  async redirects() {
    return redirects;
  },
  async headers() {
    return [
      {
        // Global security headers for all public routes
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: cspHeaderValue,
          },
        ],
      },
      {
        // Admin routes: Explicitly forbid search indexing and disable caching
        source: '/admin/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
      {
        // API routes: Explicitly forbid search indexing and disable caching
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate, proxy-revalidate',
          },
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow, noarchive',
          },
        ],
      },
      {
        // Static intro frames: Long immutable caching
        source: '/frames/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Static brand assets (logo, favicon): Long immutable caching
        source: '/brand/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // Generated 360 panorama previews: Long immutable caching
        source: '/generated/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        // OpenGraph default card: sensible daily cache with revalidation
        source: '/og-default.jpg',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        // Web manifest: sensible daily cache
        source: '/manifest.webmanifest',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ];
  },
};

export default bundleAnalyzer(nextConfig);
