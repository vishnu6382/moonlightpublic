'use client';

import React, { useEffect, useRef } from 'react';
import { fxConfig } from '@/lib/fxConfig';
import styles from './HomeMoonlight.module.css';

export default function HomeMoonlight() {
  const scrollLineRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 1. TOP SCROLL PROGRESS LINE
    const handleScrollProgress = () => {
      if (!fxConfig.scrollLine || !scrollLineRef.current) return;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = maxScroll > 0 ? Math.min(1, Math.max(0, window.scrollY / maxScroll)) : 0;
      scrollLineRef.current.style.transform = `scaleX(${progress})`;
    };

    if (fxConfig.scrollLine) {
      window.addEventListener('scroll', handleScrollProgress, { passive: true });
      handleScrollProgress();
    }

    if (prefersReducedMotion) {
      return () => {
        window.removeEventListener('scroll', handleScrollProgress);
      };
    }

    let observer = null;
    let failsafeTimer = null;
    let parallaxRaf = null;

    const initMoonlight = () => {
      const sections = document.querySelectorAll('[data-moon-section]');
      if (!sections || sections.length === 0) return;

      const vh = window.innerHeight;
      const revealItems = [];

      // Add Heading Underline & Photo Rise setup
      sections.forEach((sec) => {
        // Section Headings: add gold underline if enabled
        if (fxConfig.headingUnderline) {
          const mainTitle = sec.querySelector('h2, [class*="sectionTitle"], [class*="titleTileHeading"]');
          if (mainTitle && !mainTitle.querySelector('.heading-gold-underline') && !mainTitle.nextElementSibling?.classList?.contains('heading-gold-underline')) {
            const underline = document.createElement('span');
            underline.className = 'heading-gold-underline';
            underline.setAttribute('aria-hidden', 'true');
            mainTitle.parentNode.insertBefore(underline, mainTitle.nextSibling);
            revealItems.push(underline);
          }
        }

        // Headings reveal
        if (fxConfig.textReveal) {
          const headings = sec.querySelectorAll('h2, h3, [class*="titleTileHeading"]');
          headings.forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.top > vh && !el.dataset.moonSetup) {
              el.dataset.moonSetup = 'true';
              el.classList.add(styles.pendingHeadingReveal);
              revealItems.push(el);
            }
          });
        }

        // Photo Moon-Rise
        if (fxConfig.photoRise) {
          const media = sec.querySelectorAll('img, video, [class*="cardMedia"]');
          media.forEach((el) => {
            const r = el.getBoundingClientRect();
            if (r.top > vh && !el.dataset.moonSetup) {
              el.dataset.moonSetup = 'true';
              el.classList.add(styles.pendingPhotoReveal);
              revealItems.push(el);
            }
          });
        }

        // Bento Assemble for Captured Moments
        if (fxConfig.bentoAssemble && sec.id === 'showcase') {
          const bentoTiles = sec.querySelectorAll('[class*="tile"], [class*="gridItem"]');
          bentoTiles.forEach((tile, idx) => {
            if (!tile.dataset.moonBento) {
              tile.dataset.moonBento = 'true';
              tile.classList.add(styles.pendingBento);
              tile.style.setProperty('--bento-dir', idx % 2 === 0 ? '-36px' : '36px');
              revealItems.push(tile);
            }
          });
        }
      });

      // Intersection Observer for Section Light-Up and Reveals
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const target = entry.target;

            // SECTION LIGHT-UP
            if (target.hasAttribute('data-moon-section') && fxConfig.sectionLight) {
              if (entry.isIntersecting) {
                target.classList.add('is-lit');
                target.classList.remove('was-lit');
              } else {
                if (target.classList.contains('is-lit')) {
                  target.classList.remove('is-lit');
                  target.classList.add('was-lit');
                }
              }
            }

            // HEADING GOLD UNDERLINE
            if (entry.isIntersecting && target.classList.contains('heading-gold-underline')) {
              target.classList.add('is-visible');
              observer.unobserve(target);
            }

            // BENTO ASSEMBLE
            if (entry.isIntersecting && target.classList.contains(styles.pendingBento)) {
              target.classList.remove(styles.pendingBento);
              target.classList.add(styles.animateBento);
              observer.unobserve(target);
            }

            // REVEAL ANIMATIONS
            if (entry.isIntersecting && target.dataset.moonSetup) {
              if (target.classList.contains(styles.pendingHeadingReveal)) {
                target.classList.remove(styles.pendingHeadingReveal);
                target.classList.add(styles.animateHeading);
              }
              if (target.classList.contains(styles.pendingPhotoReveal)) {
                target.classList.remove(styles.pendingPhotoReveal);
                target.classList.add(styles.animatePhoto);
                setTimeout(() => {
                  target.style.clipPath = 'none';
                }, 950);
              }
              observer.unobserve(target);
            }
          });
        },
        {
          rootMargin: '150px 0px 150px 0px',
          threshold: [0, 0.1],
        }
      );

      sections.forEach((sec) => observer.observe(sec));
      revealItems.forEach((item) => observer.observe(item));

      // PHOTO PARALLAX (-16px to +16px)
      if (fxConfig.photoParallax) {
        const parallaxMedia = document.querySelectorAll('[data-moon-section] img');

        const updateParallax = () => {
          const cy = window.innerHeight / 2;
          parallaxMedia.forEach((img) => {
            const rect = img.getBoundingClientRect();
            if (rect.bottom > 0 && rect.top < window.innerHeight) {
              const itemCenter = rect.top + rect.height / 2;
              const offset = ((itemCenter - cy) / cy) * 16;
              const clamped = Math.max(-16, Math.min(16, offset));
              img.style.transform = `translateY(${clamped.toFixed(1)}px)`;
            }
          });
        };

        const handleParallaxScroll = () => {
          if (parallaxRaf) return;
          parallaxRaf = requestAnimationFrame(() => {
            parallaxRaf = null;
            updateParallax();
          });
        };

        window.addEventListener('scroll', handleParallaxScroll, { passive: true });
      }

      // FAILSAFE: After 1800ms make all items fully visible
      failsafeTimer = setTimeout(() => {
        revealItems.forEach((el) => {
          el.classList.remove(
            styles.pendingHeadingReveal,
            styles.pendingPhotoReveal,
            styles.pendingBento
          );
          if (el.classList.contains('heading-gold-underline')) {
            el.classList.add('is-visible');
          }
          el.style.clipPath = 'none';
        });
      }, 1800);
    };

    if (document.documentElement.dataset.intro === 'done') {
      initMoonlight();
    } else {
      window.addEventListener('moon:introdone', initMoonlight, { once: true });
    }

    return () => {
      window.removeEventListener('moon:introdone', initMoonlight);
      window.removeEventListener('scroll', handleScrollProgress);
      if (observer) observer.disconnect();
      if (failsafeTimer) clearTimeout(failsafeTimer);
    };
  }, []);

  return (
    <>
      {/* Top 2px Scroll Progress Line */}
      <div ref={scrollLineRef} className="scroll-progress-line" aria-hidden="true" />
    </>
  );
}
