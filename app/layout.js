import { Cinzel, Poppins, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
  weight: ['400', '600', '700'],
});

const poppins = Poppins({
  subsets: ['latin'],
  variable: '--font-poppins',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '600', '700'],
  style: ['normal', 'italic'],
});

import { EnquiryProvider } from '@/context/EnquiryContext';
import PublicShell from '@/components/PublicShell';
import MoonCursorFX from '@/components/MoonCursorFX';
import SmoothScroll from '@/components/SmoothScroll';
import { getPublicHomeContent } from '@/lib/home';

const siteUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const isStaging = (process.env.NEXT_PUBLIC_SITE_ENV || '').toLowerCase() === 'staging' || (process.env.NEXT_PUBLIC_SITE_ENV || '').toLowerCase() === 'preview';

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    template: '%s | Moon Light Resort',
    default: 'Moon Light Resort | Stay in Nedungulam, Salem, Tamil Nadu',
  },
  description: 'Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a clean pool, and open spaces for families and group stays.',
  applicationName: 'Moon Light Resort',
  authors: [{ name: 'Moon Light Resort' }],
  creator: 'Moon Light Resort',
  publisher: 'Moon Light Resort',
  robots: isStaging
    ? { index: false, follow: false }
    : {
        index: true,
        follow: true,
        googleBot: {
          index: true,
          follow: true,
          'max-image-preview': 'large',
          'max-snippet': -1,
          'max-video-preview': -1,
        },
      },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteUrl,
    siteName: 'Moon Light Resort',
    title: 'Moon Light Resort | Stay in Nedungulam, Salem, Tamil Nadu',
    description: 'Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a clean pool, and open spaces for families and group stays.',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Moon Light Resort - Nature Resort in Nedungulam, Tamil Nadu',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Moon Light Resort | Stay in Nedungulam, Salem, Tamil Nadu',
    description: 'Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a clean pool, and open spaces for families and group stays.',
    images: ['/og-default.jpg'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },
  manifest: '/manifest.webmanifest',
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? { verification: { google: process.env.GOOGLE_SITE_VERIFICATION } }
    : {}),
};

export default async function RootLayout({ children }) {
  let initialLogo = null;
  try {
    const homeContent = await getPublicHomeContent();
    initialLogo = homeContent?.logo || null;
  } catch (e) {
    // Graceful fallback
  }

  return (
    <html lang="en-IN" className={`${cinzel.variable} ${poppins.variable} ${cormorant.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.addEventListener('error', function(event) {
                var msg = event && event.message ? String(event.message) : '';
                if (msg.indexOf('ChunkLoadError') !== -1 || msg.indexOf('Loading chunk') !== -1) {
                  if (!window.__chunkReloaded) {
                    window.__chunkReloaded = true;
                    window.location.reload();
                  }
                }
              });
            `,
          }}
        />
      </head>
      <body className={poppins.className}>
        <EnquiryProvider>
          <SmoothScroll>
            <PublicShell initialLogo={initialLogo}>{children}</PublicShell>
          </SmoothScroll>
        </EnquiryProvider>
        <MoonCursorFX />
      </body>
    </html>
  );
}
