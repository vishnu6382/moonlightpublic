'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import FestiveBanner from './FestiveBanner';
import FestiveLights from './FestiveLights';
import FestiveDiya from './FestiveDiya';
import { isFestiveActive, getActiveFestiveConfig } from '@/lib/festiveHelper';
import { launchCelebration } from '@/lib/fireworks';
import styles from './FestiveManager.module.css';

export default function FestiveManager({ festive }) {
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const containerRef = useRef(null);
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

  // Whenever user enters any page during festival time, celebrate with firecrackers!
  useEffect(() => {
    if (!isActive) return;

    const timer = setTimeout(() => {
      launchCelebration();
    }, 1100);

    return () => clearTimeout(timer);
  }, [isActive, pathname]);

  // Dynamically measure exact pixel height of top festive container and expose to CSS
  useEffect(() => {
    if (typeof document === 'undefined') return;

    if (!isActive) {
      document.documentElement.style.setProperty('--festive-top-offset', '0px');
      return;
    }

    const updateHeight = () => {
      if (containerRef.current) {
        const h = containerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--festive-top-offset', `${h}px`);
      } else {
        document.documentElement.style.setProperty('--festive-top-offset', '0px');
      }
    };

    updateHeight();

    let ro = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(updateHeight);
      ro.observe(containerRef.current);
    }

    window.addEventListener('resize', updateHeight, { passive: true });

    return () => {
      if (ro) ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
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
        <div ref={containerRef} className={styles.festiveTopContainer}>
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
