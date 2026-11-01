import Link from 'next/link';
import { siteConfig } from '@/content/site';
import Button from '@/components/Button';
import styles from './Footer.module.css';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  // Filter out any social link without a valid URL
  const visibleSocialLinks = (siteConfig.socialLinks || []).filter(
    (item) => item.url && item.url.trim().length > 0
  );

  return (
    <footer className={styles.footerSection}>
      <div className={styles.footerCard}>
        {/* Top Row: Tagline + Primary Enquire/Call Button */}
        <div className={styles.topRow}>
          <div className={styles.tagline}>
            {siteConfig.tagline}
          </div>
          <Button href={`tel:${siteConfig.phoneRaw || '+919894486300'}`} variant="outline" size="lg">
            Call Us
          </Button>
        </div>

        {/* Middle Columns */}
        <div className={styles.middleGrid}>
          {/* Col 1: Quick Links */}
          <div className={styles.quickLinksCol}>
            <h3 className={styles.columnTitle}>Quick Links</h3>
            <ul className={styles.linksList}>
              {siteConfig.navLinks.map((link) => (
                <li key={link.href} className={styles.linkItem}>
                  <Link href={link.href}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: Contact */}
          <div className={styles.contactCol}>
            <h3 className={styles.columnTitle}>Contact</h3>
            <ul className={styles.linksList}>
              <li className={styles.linkItem}>
                <a href={`tel:${siteConfig.phoneRaw || siteConfig.phone.replace(/\s+/g, '')}`}>
                  Phone: {siteConfig.phone}
                </a>
              </li>
              {siteConfig.secondaryPhone && (
                <li className={styles.linkItem}>
                  <a href={`tel:${siteConfig.secondaryPhoneRaw || siteConfig.secondaryPhone.replace(/\s+/g, '')}`}>
                    Phone: {siteConfig.secondaryPhone}
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Location */}
          <div className={styles.locationCol}>
            <h3 className={styles.columnTitle}>Location</h3>
            <p className={styles.addressText}>{siteConfig.address}</p>
            {siteConfig.googleMapsUrl && (
              <a
                href={siteConfig.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapLink}
              >
                Open in Google Maps &rarr;
              </a>
            )}
          </div>

          {/* Col 4: Say Hello / Social Pills */}
          <div className={styles.sayHelloCol}>
            <h3 className={styles.columnTitle}>Say Hello</h3>
            <div className={styles.socialPills}>
              {visibleSocialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.socialPill}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>{social.name}</span>
                </a>
              ))}

              {siteConfig.whatsapp && (
                <a
                  href={`https://wa.me/${siteConfig.whatsapp.replace(/[^0-9]/g, '')}?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20Moon%20Light%20Resort`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${styles.socialPill} ${styles.whatsappPill}`}
                  aria-label="Chat on WhatsApp"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm5.79 14.04c-.24.67-1.4 1.28-1.92 1.36-.51.08-1.18.11-3.41-.81-2.23-.92-3.66-3.19-3.77-3.34-.11-.15-.91-1.21-.91-2.31 0-1.1.58-1.64.78-1.87.2-.23.44-.29.58-.29.14 0 .28.01.41.01.13 0 .31-.05.48.36.18.41.61 1.49.66 1.6.05.11.09.24.02.39-.07.15-.11.24-.22.37-.11.13-.23.29-.33.39-.11.11-.23.24-.1.46.13.22.58.96 1.25 1.55.86.77 1.58 1.01 1.8 1.12.22.11.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.51-.1.21.08 1.34.63 1.57.75.23.12.38.18.44.28.06.1.06.58-.18 1.25z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Huge Watermark Cropped at Bottom */}
        <div className={styles.watermarkContainer} aria-hidden="true">
          <span className={styles.watermarkText}>{siteConfig.name}</span>
        </div>

        {/* Copyright Row */}
        <div className={styles.copyrightRow}>
          <span>&copy; {currentYear} {siteConfig.name}. All rights reserved.</span>
          <span>Serenity in Nature</span>
        </div>
      </div>
    </footer>
  );
}
