import HomeFAQ from '@/components/HomeFAQ';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbJsonLd } from '@/lib/structuredData';
import { getPublicHomeContent } from '@/lib/home';

export const revalidate = 300;

export const metadata = {
  title: 'Contact & Location | Moon Light Resort',
  description:
    'Get in touch with Moon Light Resort in Nedungulam, Tamil Nadu. Direct phone bookings, WhatsApp inquiries, directions, and frequently asked questions.',
  alternates: {
    canonical: '/contact',
  },
  openGraph: {
    title: 'Contact & Location | Moon Light Resort',
    description:
      'Get in touch with Moon Light Resort in Nedungulam, Tamil Nadu. Direct phone bookings, WhatsApp inquiries, directions, and frequently asked questions.',
    url: '/contact',
    siteName: 'Moon Light Resort',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Contact Moon Light Resort',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contact & Location | Moon Light Resort',
    description:
      'Get in touch with Moon Light Resort in Nedungulam, Tamil Nadu. Direct phone bookings, WhatsApp inquiries, and directions.',
    images: ['/og-default.jpg'],
  },
};

export default async function ContactPage() {
  const homeContent = await getPublicHomeContent().catch(() => null);
  const faqs = homeContent?.faqs || [];

  return (
    <>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Contact', url: '/contact' },
        ])}
      />
      <HomeFAQ faqs={faqs} />
    </>
  );
}
