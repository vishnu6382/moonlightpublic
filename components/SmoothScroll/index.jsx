'use client';

import React, { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ReactLenis, useLenis } from 'lenis/react';

function LenisRouteSync() {
  const pathname = usePathname();
  const lenis = useLenis();

  useEffect(() => {
    if (lenis) {
      // Recalculate page height and scroll bounds on every route transition
      lenis.resize();
    }
  }, [pathname, lenis]);

  return null;
}

export default function SmoothScroll({ children }) {
  return (
    <ReactLenis
      root
      options={{
        lerp: 0.1,
        duration: 1.0,
        smoothWheel: true,
        wheelMultiplier: 1.0,
        touchMultiplier: 1.2,
        syncTouch: false,
        autoResize: true,
      }}
    >
      <LenisRouteSync />
      {children}
    </ReactLenis>
  );
}
