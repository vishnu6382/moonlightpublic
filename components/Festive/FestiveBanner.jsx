'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useEnquiry } from '@/context/EnquiryContext';
import styles from './FestiveBanner.module.css';

export default function FestiveBanner({ banner = {}, onDismiss }) {
  const [dismissed, setDismissed] = useState(false);
  const enquiryCtx = useEnquiry();

  useEffect(() => {
    try {
      const isDismissed = sessionStorage.getItem('moon_festive_banner_dismissed') === '1';
      if (isDismissed) {
        setDismissed(true);
        onDismiss?.();
      }
    } catch {
      // ignore
    }
  }, [onDismiss]);

  if (dismissed || !banner || banner.enabled === false) {
    return null;
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem('moon_festive_banner_dismissed', '1');
    } catch {
      // ignore
    }
    onDismiss?.();
  };

  const handleCtaClick = (e) => {
    if (banner.ctaLink === '#enquire' || !banner.ctaLink) {
      e.preventDefault();
      if (enquiryCtx?.openEnquiry) {
        enquiryCtx.openEnquiry();
      }
    }
  };

  const bgColor = banner.bgColor || '#58111A';
  const textColor = banner.textColor || '#FFFFFF';
  const accentColor = banner.accentColor || '#FCD34D';
  const text = banner.text || '✨ Festive Special Offer: Book your stay today and get access to exclusive celebrations!';

  return (
    <div
      className={styles.bannerWrapper}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderBottomColor: accentColor ? `${accentColor}55` : 'rgba(255, 255, 255, 0.2)',
      }}
      role="banner"
      aria-label="Festive Special Offer"
    >
      {/* Left fixed badge */}
      <div className={styles.badgeWrapper}>
        <span className={styles.sparkleIcon} aria-hidden="true">✨</span>
        <span className={styles.badgeText}>FESTIVE SPECIAL</span>
      </div>

      {/* Center continuous smooth moving marquee ticker */}
      <div className={styles.tickerViewport} title="Hover to pause">
        <div className={styles.tickerTrack}>
          {/* Track 1 */}
          <div className={styles.tickerSegment}>
            <span className={styles.tickerText}>{text}</span>
            <span className={styles.tickerDivider} aria-hidden="true">✦</span>
            <span className={styles.tickerText}>{text}</span>
            <span className={styles.tickerDivider} aria-hidden="true">✦</span>
          </div>
          {/* Track 2 (identical duplicate for seamless infinite loop) */}
          <div className={styles.tickerSegment} aria-hidden="true">
            <span className={styles.tickerText}>{text}</span>
            <span className={styles.tickerDivider}>✦</span>
            <span className={styles.tickerText}>{text}</span>
            <span className={styles.tickerDivider}>✦</span>
          </div>
        </div>
      </div>

      {/* Right action group */}
      <div className={styles.actionGroup}>
        {banner.ctaText && (
          <Link
            href={banner.ctaLink || '/rooms'}
            onClick={handleCtaClick}
            className={styles.ctaBtn}
            style={{
              backgroundColor: accentColor,
              color: '#180B00',
            }}
          >
            <span>{banner.ctaText}</span>
            <span className={styles.ctaArrow} aria-hidden="true">&rarr;</span>
          </Link>
        )}

        <button
          type="button"
          onClick={handleDismiss}
          className={styles.closeBtn}
          aria-label="Dismiss banner"
          title="Dismiss banner"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
    </div>
  );
}
