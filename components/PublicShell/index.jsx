'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import ContactSection from '@/components/ContactSection';
import MobileBottomBar from '@/components/MobileBottomBar';
import { contactData } from '@/content/contact';

export default function PublicShell({ children, initialLogo }) {
  const pathname = usePathname();
  const isAdmin = pathname && pathname.startsWith('/admin');

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
      <Nav logo={initialLogo} />
      <main id="main-content">{children}</main>
      <ContactSection data={contactData} />
      <Footer />
      <MobileBottomBar />
    </>
  );
}
