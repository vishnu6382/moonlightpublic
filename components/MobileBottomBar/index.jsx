'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/content/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { fxConfig } from '@/lib/fxConfig';
import styles from './MobileBottomBar.module.css';

/**
 * Floating Action Widget (Mobile & Desktop)
 * Anchored to the bottom-right corner with smooth pulse animation & tooltips
 */
export default function MobileBottomBar({ siteSettings }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!fxConfig.bottomBar) return;

    if (pathname !== '/') {
      // On all pages other than Home, show immediately
      setIsVisible(true);
      return;
    }

    // On Home page, strictly hide during Intro; only show after intro is scrolled past (zero reflow on scroll)
    let introHeight = 0;
    const updateIntroHeight = () => {
      const introEl = document.querySelector('[data-intro-section="true"]');
      introHeight = introEl ? introEl.offsetHeight : 0;
    };
    updateIntroHeight();

    const checkVisibility = () => {
      if (introHeight === 0) {
        setIsVisible(true);
        return;
      }
      setIsVisible(window.scrollY >= (introHeight - 80));
    };

    checkVisibility();
    window.addEventListener('scroll', checkVisibility, { passive: true });
    window.addEventListener('resize', () => {
      updateIntroHeight();
      checkVisibility();
    }, { passive: true });
    window.addEventListener('moon:introdone', checkVisibility);
    return () => {
      window.removeEventListener('scroll', checkVisibility);
      window.removeEventListener('moon:introdone', checkVisibility);
    };
  }, [pathname]);

  // Track if mobile navigation drawer or detail sheet is open
  useEffect(() => {
    const checkState = () => {
      const menuOpen = document.body.style.overflow === 'hidden' && document.querySelector('[data-menu-open="true"]');
      const sheetOpen = document.body.dataset.sheetOpen === 'true';
      setIsMenuOpen(Boolean(menuOpen || sheetOpen));
    };

    checkState();
    const observer = new MutationObserver(checkState);
    observer.observe(document.body, { attributes: true, attributeFilter: ['style', 'class', 'data-sheet-open'] });
    return () => observer.disconnect();
  }, []);

  if (!fxConfig.bottomBar || !isVisible || isMenuOpen) {
    return null;
  }

  const phoneRaw = siteSettings?.phoneRaw || siteConfig.phoneRaw || '919894486300';
  const whatsappNumber = siteSettings?.whatsappNumber || siteSettings?.whatsapp || siteConfig.whatsapp || phoneRaw;
  const whatsappMessage = siteSettings?.whatsappMessage;

  const whatsappHref = buildWhatsAppLink({
    number: whatsappNumber,
    message: whatsappMessage,
  });

  return (
    <aside className={styles.floatingWidget} aria-label="Quick contact buttons">
      {/* Call Button (FAB) */}
      <a
        href={`tel:${phoneRaw}`}
        className={styles.fabCallBtn}
        aria-label="Call resort directly"
        title="Call resort directly"
      >
        <svg className={styles.fabIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
        </svg>
        <span className={styles.fabTooltip}>Call Us</span>
      </a>

      {/* WhatsApp Button (FAB with wave pulse animation) */}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.fabWhatsAppBtn}
        aria-label="Chat with resort on WhatsApp"
        title="Chat on WhatsApp"
      >
        <span className={styles.pulseRing} aria-hidden="true" />
        <svg className={styles.fabIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm5.79 14.04c-.24.67-1.4 1.28-1.92 1.36-.51.08-1.18.11-3.41-.81-2.23-.92-3.66-3.19-3.77-3.34-.11-.15-.91-1.21-.91-2.31 0-1.1.58-1.64.78-1.87.2-.23.44-.29.58-.29.14 0 .28.01.41.01.13 0 .31-.05.48.36.18.41.61 1.49.66 1.6.05.11.09.24.02.39-.07.15-.11.24-.22.37-.11.13-.23.29-.33.39-.11.11-.23.24-.1.46.13.22.58.96 1.25 1.55.86.77 1.58 1.01 1.8 1.12.22.11.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.51-.1.21.08 1.34.63 1.57.75.23.12.38.18.44.28.06.1.06.58-.18 1.25z" />
        </svg>
        <span className={styles.fabTooltip}>WhatsApp</span>
      </a>
    </aside>
  );
}
