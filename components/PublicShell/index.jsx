'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import FestiveManager from '@/components/Festive/FestiveManager';
import { contactData } from '@/content/contact';
import { getActiveFestiveConfig, isFestiveActive } from '@/lib/festiveHelper';

export default function PublicShell({ children, initialLogo, festiveSettings }) {
  const pathname = usePathname();
  const isAdmin = pathname && pathname.startsWith('/admin');

  const activeFestive = getActiveFestiveConfig(festiveSettings);
  const isFestive = isFestiveActive(activeFestive);
  const showLights = isFestive && activeFestive.decorations?.showLights !== false;

  useEffect(() => {
    if (pathname !== '/') {
      document.documentElement.dataset.intro = 'done';
      window.dispatchEvent(new CustomEvent('moon:introdone'));
    } else {
      // On Home page, reset intro state if user is at the top
      if (typeof window !== 'undefined' && window.scrollY < 100) {
        delete document.documentElement.dataset.intro;
      }
    }
  }, [pathname]);

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <FestiveManager festive={activeFestive} />
      <Nav logo={initialLogo} showFestiveLights={showLights} />
      <main id="main-content">{children}</main>
      <ContactSection data={contactData} />
      <Footer />
      <MobileBottomBar />
    </>
  );
}
