'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './CoveLight.module.css';
import { fxConfig } from '@/lib/fxConfig';

export default function CoveLight({
  align = 'center',
  intensity = 1,
  className = '',
}) {
  const [isLit, setIsLit] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!fxConfig.coveLight) return;

    const el = containerRef.current;
    if (!el) return;

    const section = el.closest('[data-moon-section]') || el.parentElement;

    const checkLit = () => {
      if (section && section.classList.contains('is-lit')) {
        setIsLit(true);
        return true;
      }
      return false;
    };

    if (checkLit()) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsLit(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);

    const mutationObs = new MutationObserver(() => {
      if (checkLit()) {
        mutationObs.disconnect();
      }
    });

    if (section) {
      mutationObs.observe(section, { attributes: true, attributeFilter: ['class'] });
    }

    return () => {
      observer.disconnect();
      mutationObs.disconnect();
    };
  }, []);

  if (!fxConfig.coveLight) return null;

  return (
    <div
      ref={containerRef}
      className={`${styles.wrap} ${styles[align] || styles.center} ${
        isLit ? styles.lit : ''
      } ${className}`}
      style={{ '--cove-intensity': intensity }}
      aria-hidden="true"
    >
      <div className={styles.ambientAura} />
    </div>
  );
}
