'use client';

import React, { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { fxConfig, cursorFxRoutes } from '@/lib/fxConfig';
import styles from './MoonCursorFX.module.css';

export default function MoonCursorFX() {
  const [mounted, setMounted] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [isHoveringLink, setIsHoveringLink] = useState(false);
  const [ripples, setRipples] = useState([]);

  const pathname = usePathname();

  const dotsRef = useRef([
    { x: -100, y: -100, targetX: -100, targetY: -100, size: 10, lerp: 0.35, opacity: 0.9 },
    { x: -100, y: -100, targetX: -100, targetY: -100, size: 7, lerp: 0.25, opacity: 0.6 },
    { x: -100, y: -100, targetX: -100, targetY: -100, size: 5, lerp: 0.18, opacity: 0.35 },
  ]);

  const dotElementsRef = useRef([]);
  const rafIdRef = useRef(null);
  const mouseStoppedTimerRef = useRef(null);
  const isLoopRunningRef = useRef(false);
  const mouseInWindowRef = useRef(false);

  // Check route support
  const isRouteAllowed =
    cursorFxRoutes.includes('*') || cursorFxRoutes.includes(pathname);

  useEffect(() => {
    setMounted(true);

    if (!fxConfig.cursorFx) return;

    if (pathname !== '/') {
      setIsIntroDone(true);
    } else {
      const checkIntro = () => {
        if (document.documentElement.dataset.intro === 'done') {
          setIsIntroDone(true);
        }
      };
      checkIntro();
      window.addEventListener('moon:introdone', checkIntro);
      return () => window.removeEventListener('moon:introdone', checkIntro);
    }
  }, [pathname]);

  // Desktop Pointer / Lerp Loop
  useEffect(() => {
    if (!mounted || !isRouteAllowed || !isIntroDone || !fxConfig.cursorFx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!isFinePointer) return;

    const loop = () => {
      let isMoving = false;
      dotsRef.current.forEach((dot, i) => {
        const dx = dot.targetX - dot.x;
        const dy = dot.targetY - dot.y;
        dot.x += dx * dot.lerp;
        dot.y += dy * dot.lerp;

        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          isMoving = true;
        }

        const el = dotElementsRef.current[i];
        if (el) {
          el.style.transform = `translate3d(${dot.x}px, ${dot.y}px, 0)`;
        }
      });

      if (isMoving && mouseInWindowRef.current) {
        rafIdRef.current = requestAnimationFrame(loop);
      } else {
        isLoopRunningRef.current = false;
      }
    };

    const startLoop = () => {
      if (!isLoopRunningRef.current) {
        isLoopRunningRef.current = true;
        rafIdRef.current = requestAnimationFrame(loop);
      }
    };

    const handleMouseMove = (e) => {
      mouseInWindowRef.current = true;
      dotsRef.current.forEach((dot) => {
        dot.targetX = e.clientX;
        dot.targetY = e.clientY;
      });

      // Check if hovering interactive element
      const target = e.target;
      const isInteractive = target && target.closest('a, button, [data-cursor="link"]');
      setIsHoveringLink(Boolean(isInteractive));

      startLoop();

      if (mouseStoppedTimerRef.current) clearTimeout(mouseStoppedTimerRef.current);
      mouseStoppedTimerRef.current = setTimeout(() => {
        // Stops 600ms after mouse stops moving
        isLoopRunningRef.current = false;
      }, 600);
    };

    const handleMouseLeave = () => {
      mouseInWindowRef.current = false;
      dotsRef.current.forEach((dot) => {
        dot.x = -100;
        dot.y = -100;
        dot.targetX = -100;
        dot.targetY = -100;
      });
      if (dotElementsRef.current[0]) {
        dotElementsRef.current.forEach((el) => {
          if (el) el.style.opacity = '0';
        });
      }
    };

    const handleMouseEnter = () => {
      mouseInWindowRef.current = true;
      if (dotElementsRef.current[0]) {
        dotElementsRef.current.forEach((el, i) => {
          if (el) el.style.opacity = String(dotsRef.current[i].opacity);
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('mouseenter', handleMouseEnter);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (mouseStoppedTimerRef.current) clearTimeout(mouseStoppedTimerRef.current);
    };
  }, [mounted, isRouteAllowed, isIntroDone]);

  // Touch Pointer Ripple Handler (coarse pointer)
  useEffect(() => {
    if (!mounted || !isRouteAllowed || !isIntroDone || !fxConfig.cursorFx) return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) return;

    const handlePointerDown = (e) => {
      if (e.pointerType === 'mouse') return;

      const newRipple = {
        id: Date.now() + Math.random(),
        x: e.clientX,
        y: e.clientY,
      };

      setRipples((prev) => [...prev.slice(-5), newRipple]); // Max 6 active
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    return () => window.removeEventListener('pointerdown', handlePointerDown);
  }, [mounted, isRouteAllowed, isIntroDone]);

  if (!mounted || !isRouteAllowed || !isIntroDone || !fxConfig.cursorFx) {
    return null;
  }

  return (
    <div className={styles.cursorFxContainer} aria-hidden="true">
      {/* Desktop 3 Golden Dots */}
      {dotsRef.current.map((dot, i) => (
        <span
          key={i}
          ref={(el) => (dotElementsRef.current[i] = el)}
          className={`${styles.cursorDot} ${i === 0 && isHoveringLink ? styles.cursorDotHover : ''}`}
          style={{
            width: `${dot.size}px`,
            height: `${dot.size}px`,
            opacity: dot.opacity,
            marginLeft: `-${dot.size / 2}px`,
            marginTop: `-${dot.size / 2}px`,
          }}
        />
      ))}

      {/* Mobile / Touch Moonlight Ripples with 5 Sparkles */}
      {ripples.map((r) => (
        <div
          key={r.id}
          className={styles.touchRipple}
          style={{ left: `${r.x}px`, top: `${r.y}px` }}
          onAnimationEnd={() => {
            setRipples((prev) => prev.filter((item) => item.id !== r.id));
          }}
        >
          <span className={styles.rippleRing} />
          <span className={`${styles.sparkle} ${styles.sp1}`} />
          <span className={`${styles.sparkle} ${styles.sp2}`} />
          <span className={`${styles.sparkle} ${styles.sp3}`} />
          <span className={`${styles.sparkle} ${styles.sp4}`} />
          <span className={`${styles.sparkle} ${styles.sp5}`} />
        </div>
      ))}
    </div>
  );
}
