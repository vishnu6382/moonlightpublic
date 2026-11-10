'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import FestiveBanner from './FestiveBanner';
import FestiveLights from './FestiveLights';
import FestiveDiya from './FestiveDiya';
import { isFestiveActive, getActiveFestiveConfig } from '@/lib/festiveHelper';
import { launchCelebration } from '@/lib/fireworks';
import styles from './FestiveManager.module.css';

export default function FestiveManager({ festive }) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const pathname = usePathname();

  const activeFestive = getActiveFestiveConfig(festive);
  const isActive = isFestiveActive(activeFestive);

  // Check dismissal in session
  useEffect(() => {
    try {
      if (sessionStorage.getItem('moon_festive_banner_dismissed') === '1') {
        setBannerDismissed(true);
      }
    } catch {}
  }, []);

  // Whenever user enters any page during active festival time, celebrate with firecrackers!
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      launchCelebration();
    }, 1200);

    return () => clearTimeout(timer);
  }, [isActive, pathname]);

  // Set CSS custom property directly without expensive continuous ResizeObserver loops
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!isActive) {
      document.documentElement.style.setProperty('--festive-top-offset', '0px');
      return;
    }

    const showBanner = activeFestive?.banner?.enabled !== false && !bannerDismissed;
    const showLights = activeFestive?.decorations?.showLights !== false;

    let offset = 0;
    if (showBanner && showLights) {
      offset = 80;
    } else if (showBanner) {
      offset = 44;
    } else if (showLights) {
      offset = 36;
    }

    document.documentElement.style.setProperty('--festive-top-offset', `${offset}px`);
  }, [isActive, bannerDismissed, activeFestive]);

  if (!isActive) {
    return null;
  }

  const showBanner = activeFestive?.banner?.enabled !== false && !bannerDismissed;
  const showLights = activeFestive?.decorations?.showLights !== false;
  const showDiya = activeFestive?.decorations?.showFloatingDiya !== false;

  return (
    <>
      {(showBanner || showLights) && (
        <div className={styles.festiveTopContainer}>
          {showBanner && (
            <FestiveBanner
              banner={activeFestive.banner}
              onDismiss={() => {
                setBannerDismissed(true);
                try {
                  sessionStorage.setItem('moon_festive_banner_dismissed', '1');
                } catch {}
              }}
            />
          )}
          {showLights && <FestiveLights />}
        </div>
      )}
      {showDiya && <FestiveDiya text={activeFestive.decorations?.diyaText || 'May Your Days Glow'} />}
    </>
  );
}
