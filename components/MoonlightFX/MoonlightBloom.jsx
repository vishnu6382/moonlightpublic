'use client';

import React, { useEffect, useState } from 'react';
import { fxConfig } from '@/lib/fxConfig';
import styles from './MoonlightBloom.module.css';

export default function MoonlightBloom() {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!fxConfig.bloom) return;

    const triggerBloom = () => {
      if (typeof window !== 'undefined' && !window.__moonBloomPlayed) {
        window.__moonBloomPlayed = true;
        setActive(true);
        setTimeout(() => {
          setActive(false);
        }, 1200);
      }
    };

    setMounted(true);
    if (document.documentElement.dataset.intro === 'done') {
      triggerBloom();
    } else {
      window.addEventListener('moon:introdone', triggerBloom, { once: true });
    }

    return () => {
      window.removeEventListener('moon:introdone', triggerBloom);
    };
  }, []);

  if (!mounted || !active) return null;

  return (
    <div className={styles.bloomOverlay} aria-hidden="true">
      <div className={styles.ambientPulse} />
    </div>
  );
}
