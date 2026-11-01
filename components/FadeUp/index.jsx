'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './FadeUp.module.css';

export default function FadeUp({
  children,
  className = '',
  delay = 0,
  threshold = 0.1,
  ...rest
}) {
  const ref = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      { threshold: 0, rootMargin: '500px 0px 300px 0px' }
    );

    const el = ref.current;
    if (el) observer.observe(el);

    // Content failsafe: guarantees content is always visible
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 800);

    return () => {
      if (el) observer.unobserve(el);
      clearTimeout(timer);
    };
  }, [threshold]);

  // Cap transition delay to max 50ms so content never feels delayed or laggy
  const effectiveDelay = delay ? Math.min(delay, 50) : 0;

  return (
    <div
      ref={ref}
      className={`${styles.fadeUp} ${isVisible ? styles.visible : ''} ${className}`.trim()}
      style={effectiveDelay ? { transitionDelay: `${effectiveDelay}ms` } : undefined}
      {...rest}
    >
      {children}
    </div>
  );
}
