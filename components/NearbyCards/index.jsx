'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Section from '@/components/Section';
import SectionHeader from '@/components/SectionHeader';
import Button from '@/components/Button';
import CoveLight from '@/components/CoveLight/CoveLight';
import { fxConfig } from '@/lib/fxConfig';
import styles from './NearbyCards.module.css';

/**
 * Animated Distance Count-Up component.
 * Smoothly counts from 0 to targetKm over 900ms when triggered.
 * Respects prefers-reduced-motion and formats tabular numbers without layout shift.
 */
function KmCountUp({ targetKm, isVisible }) {
  const [displayValue, setDisplayValue] = useState(() => (targetKm != null ? targetKm : ''));
  const hasAnimatedRef = useRef(false);

  const numTarget = useMemo(() => {
    if (targetKm == null || targetKm === '') return null;
    const parsed = typeof targetKm === 'number' ? targetKm : parseFloat(String(targetKm).replace(/[^0-9.]/g, ''));
    return isNaN(parsed) ? null : parsed;
  }, [targetKm]);

  const hasDecimal = useMemo(() => {
    if (numTarget == null) return false;
    return String(numTarget).includes('.');
  }, [numTarget]);

  useEffect(() => {
    if (numTarget == null) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion || hasAnimatedRef.current || !isVisible) {
      if (hasAnimatedRef.current || prefersReducedMotion) {
        setDisplayValue(hasDecimal ? numTarget.toFixed(1) : String(Math.round(numTarget)));
      }
      return;
    }

    hasAnimatedRef.current = true;
    const duration = 900;
    let startTimestamp = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const elapsed = timestamp - startTimestamp;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const current = easeOut * numTarget;

      setDisplayValue(hasDecimal ? current.toFixed(1) : String(Math.round(current)));

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        setDisplayValue(hasDecimal ? numTarget.toFixed(1) : String(Math.round(numTarget)));
      }
    };

    animId = requestAnimationFrame(step);
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [numTarget, isVisible, hasDecimal]);

  if (numTarget == null) return null;

  return (
    <span className={styles.distancePill} aria-label={`${numTarget} kilometers`}>
      {displayValue} km
    </span>
  );
}

export default function NearbyCards({ items = [] }) {
  // First 6 places only (as specified)
  const places = useMemo(() => {
    return (items || []).filter((p) => p.isActive !== false).slice(0, 6);
  }, [items]);

  const [selectedPlace, setSelectedPlace] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isSectionVisible, setIsSectionVisible] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [mounted, setMounted] = useState(false);

  const sectionRef = useRef(null);
  const scrollerRef = useRef(null);
  const rafIdRef = useRef(null);
  const pointerStartRef = useRef({ x: 0, y: 0, scrollLeft: 0, time: 0 });
  const lastActiveOpenerRef = useRef(null);
  const sheetRef = useRef(null);
  const dragStartRef = useRef({ y: 0, time: 0, currentTranslate: 0, isDragging: false });

  // 0 places: hide section completely
  if (!places || places.length === 0) {
    return null;
  }

  // Gate Intro integration: Rule 1
  useEffect(() => {
    setMounted(true);
    if (typeof document === 'undefined') return;
    if (document.documentElement.dataset.intro === 'done') {
      setIsIntroDone(true);
    } else {
      const handleIntro = () => setIsIntroDone(true);
      window.addEventListener('moon:introdone', handleIntro, { once: true });
      return () => window.removeEventListener('moon:introdone', handleIntro);
    }
  }, []);

  // Visible cards threshold logic
  const getVisibleCount = useCallback(() => {
    if (typeof window === 'undefined') return 4;
    const w = window.innerWidth;
    if (w >= 1024) return 4;
    if (w >= 640) return 2.5;
    return 1.5;
  }, []);

  const showScrollerControls = places.length > Math.floor(getVisibleCount());

  // Moon-Arc effect (identical to Events scroller)
  const updateMoonArc = useCallback(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    const cards = scroller.querySelectorAll(`.${styles.cardArcWrapper}`);
    if (cards.length === 0) return;

    const scrollerCenter = scroller.scrollLeft + scroller.clientWidth / 2;
    let closestIndex = 0;
    let minDistance = Infinity;

    cards.forEach((card, idx) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distFromCenter = cardCenter - scrollerCenter;
      const absDist = Math.abs(distFromCenter);

      if (absDist < minDistance) {
        minDistance = absDist;
        closestIndex = idx;
      }

      if (fxConfig.eventsArc && showScrollerControls) {
        const cardWidth = card.offsetWidth || 280;
        const normDist = distFromCenter / cardWidth;
        const absNorm = Math.abs(normDist);

        let scale = 1;
        let rotateY = 0;
        let translateY = 0;
        let brightness = 1;

        if (absNorm < 0.45) {
          scale = 1.05;
          rotateY = 0;
          translateY = 0;
          brightness = 1;
          card.classList.add(styles.cardCenterHalo);
        } else if (absNorm < 1.4) {
          const sign = distFromCenter > 0 ? -1 : 1;
          rotateY = sign * 10;
          scale = 0.92;
          translateY = 8;
          brightness = 0.94;
          card.classList.remove(styles.cardCenterHalo);
        } else {
          const sign = distFromCenter > 0 ? -1 : 1;
          rotateY = sign * 14;
          scale = 0.88;
          translateY = 16;
          brightness = 0.9;
          card.classList.remove(styles.cardCenterHalo);
        }

        card.style.transform = `scale(${scale.toFixed(3)}) translateY(${translateY}px) rotateY(${rotateY}deg)`;
        card.style.filter = `brightness(${brightness.toFixed(2)})`;
      } else {
        card.style.transform = '';
        card.style.filter = '';
        card.classList.remove(styles.cardCenterHalo);
      }
    });

    setActiveIndex(closestIndex);
    setCanScrollLeft(scroller.scrollLeft > 10);
    setCanScrollRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 10);
  }, [showScrollerControls]);

  const handleScroll = () => {
    if (rafIdRef.current) return;
    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = null;
      updateMoonArc();
    });
  };

  const scrollToIndex = (index) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = scroller.querySelectorAll(`.${styles.cardArcWrapper}`);
    if (!cards[index]) return;

    const card = cards[index];
    const targetLeft = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2;
    scroller.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: 'smooth',
    });
    setActiveIndex(index);
  };

  const scrollByCard = (direction) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const card = scroller.querySelector(`.${styles.cardArcWrapper}`);
    const cardWidth = card ? card.offsetWidth + 20 : 300;
    scroller.scrollBy({
      left: direction * cardWidth,
      behavior: 'smooth',
    });
  };

  const handleScrollerKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByCard(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByCard(1);
    }
  };

  // Section IntersectionObserver
  useEffect(() => {
    updateMoonArc();
    window.addEventListener('resize', updateMoonArc);

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsSectionVisible(true);
          updateMoonArc();
        }
      },
      { threshold: 0.12 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateMoonArc);
      observer.disconnect();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [updateMoonArc]);

  // Track pointer on scroller to distinguish click vs drag
  const handlePointerDown = (e) => {
    pointerStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      scrollLeft: scrollerRef.current?.scrollLeft || 0,
      time: Date.now(),
    };
  };

  const handleCardClick = (place, event) => {
    const scroller = scrollerRef.current;
    const curScroll = scroller ? scroller.scrollLeft : 0;
    const distX = Math.abs(event.clientX - pointerStartRef.current.x);
    const distY = Math.abs(event.clientY - pointerStartRef.current.y);
    const distScroll = Math.abs(curScroll - pointerStartRef.current.scrollLeft);

    // Ignore if scroller moved > 6px or pointer moved > 8px (was a swipe/drag)
    if (distX > 8 || distY > 8 || distScroll > 6) {
      return;
    }

    lastActiveOpenerRef.current = event.currentTarget;
    setSelectedPlace(place);
  };

  // Detail Modal / Sheet Body Lock, Focus Trap & Esc Listener
  const closeDetail = useCallback(() => {
    setSelectedPlace(null);
    delete document.body.dataset.sheetOpen;
    document.body.style.overflow = '';
    if (lastActiveOpenerRef.current && typeof lastActiveOpenerRef.current.focus === 'function') {
      lastActiveOpenerRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (!selectedPlace) {
      delete document.body.dataset.sheetOpen;
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';
    document.body.dataset.sheetOpen = 'true';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDetail();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Focus close button inside dialog for accessible focus trapping
    const timer = setTimeout(() => {
      const dialog = document.getElementById('nearbyPlaceDialog');
      const focusable = dialog?.querySelector('button, [tabindex="0"]');
      if (focusable) focusable.focus();
    }, 50);

    return () => {
      clearTimeout(timer);
      delete document.body.dataset.sheetOpen;
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPlace, closeDetail]);

  // Mobile Bottom Sheet Gesture Drag-down to dismiss
  const handleSheetTouchStart = (e) => {
    const touch = e.touches[0];
    const sheet = sheetRef.current;
    if (!sheet) return;

    // Only allow drag-down if scroll position is at the very top
    if (sheet.scrollTop > 0) return;

    dragStartRef.current = {
      y: touch.clientY,
      time: Date.now(),
      currentTranslate: 0,
      isDragging: true,
    };
  };

  const handleSheetTouchMove = (e) => {
    if (!dragStartRef.current.isDragging) return;
    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStartRef.current.y;

    if (deltaY > 0) {
      // Dragging downward
      dragStartRef.current.currentTranslate = deltaY;
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transform = `translateY(${deltaY}px)`;
        sheet.style.transition = 'none';
      }
    }
  };

  const handleSheetTouchEnd = () => {
    if (!dragStartRef.current.isDragging) return;
    dragStartRef.current.isDragging = false;
    const deltaY = dragStartRef.current.currentTranslate;
    const duration = Date.now() - dragStartRef.current.time;
    const velocity = deltaY / Math.max(duration, 1);
    const sheet = sheetRef.current;

    if (deltaY > 90 || velocity > 0.45) {
      // Dismiss sheet
      if (sheet) {
        sheet.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
        sheet.style.transform = 'translateY(100%)';
      }
      setTimeout(closeDetail, 240);
    } else {
      // Spring back to 0
      if (sheet) {
        sheet.style.transition = 'transform 260ms cubic-bezier(0.22, 1, 0.36, 1)';
        sheet.style.transform = 'translateY(0)';
      }
    }
  };

  return (
    <Section
      id="nearby"
      spacing="xl"
      variant="white"
      className={styles.nearbySection}
      data-moon-section="true"
    >
      {/* CoveLight background (Task 09c spec) */}
      <CoveLight align="center" intensity={0.8} />

      <div ref={sectionRef} className={styles.sectionInner}>
        {/* Header Row: Title on Left, Button + Desktop Arrows on Right */}
        <div className={styles.headerRow}>
          <SectionHeader
            label="EXPLORE THE SURROUNDINGS"
            title="Discover What's Around"
            subtitle="Explore beautiful places and memorable experiences around Moon Light Resort."
            align="left"
            divider
          />

          <div className={styles.headerActions}>
            <Button href="/nearby-areas" variant="outline" size="md">
              View all Nearby Areas &rarr;
            </Button>

            {/* Desktop Navigation Arrows (44px round frosted white) */}
            {showScrollerControls && (
              <div className={styles.desktopArrows} aria-label="Nearby places navigation">
                <button
                  type="button"
                  className={`${styles.navArrowBtn} ${!canScrollLeft ? styles.navArrowDisabled : ''}`}
                  onClick={() => scrollByCard(-1)}
                  disabled={!canScrollLeft}
                  aria-label="Previous nearby place"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  className={`${styles.navArrowBtn} ${!canScrollRight ? styles.navArrowDisabled : ''}`}
                  onClick={() => scrollByCard(1)}
                  disabled={!canScrollRight}
                  aria-label="Next nearby place"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Snap Scroller Track */}
        <div
          ref={scrollerRef}
          className={`${styles.scrollerTrack} ${!showScrollerControls ? styles.staticTrack : ''}`}
          onScroll={handleScroll}
          onKeyDown={handleScrollerKeyDown}
          onPointerDown={handlePointerDown}
          tabIndex={0}
          role="region"
          aria-label="Nearby attractions carousel"
        >
          {places.map((place, idx) => {
            const photoUrl = place.image || place.landmarkImage || (place.photos && place.photos[0]?.url) || '';
            const locationText = place.district ? `${place.district.charAt(0).toUpperCase() + place.district.slice(1)}` : '';
            const distanceKm = place.distanceKm != null ? place.distanceKm : null;
            const staggerDelay = Math.min(idx * 80, 480);
            const isCardVisible = isSectionVisible && isIntroDone;

            return (
              <div
                key={place.id || place._id || idx}
                className={`${styles.cardArcWrapper} ${isCardVisible ? styles.cardVisible : ''}`}
                style={{
                  transitionDelay: `${staggerDelay}ms`,
                }}
              >
                <div
                  className={styles.nearbyCard}
                  onClick={(e) => handleCardClick(place, e)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${place.name || place.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      lastActiveOpenerRef.current = e.currentTarget;
                      setSelectedPlace(place);
                    }
                  }}
                >
                  {/* Photo Frame (58% card height, inner radius 22px) */}
                  <div className={styles.photoArea}>
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt={place.name || place.title || 'Nearby attraction'}
                        loading={idx < 2 ? 'eager' : 'lazy'}
                        decoding="async"
                        className={styles.photoImg}
                      />
                    ) : (
                      <div className={styles.photoPlaceholder} aria-hidden="true">
                        <span>{(place.name || place.title || 'N').charAt(0)}</span>
                      </div>
                    )}
                  </div>

                  {/* Pills Row (below photo) */}
                  <div className={styles.pillsRow}>
                    {locationText && (
                      <span className={styles.locationPill} title={locationText}>
                        {locationText}
                      </span>
                    )}
                    {distanceKm != null && (
                      <KmCountUp targetKm={distanceKm} isVisible={isCardVisible} />
                    )}
                  </div>

                  {/* Card Content: Title, Description */}
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>
                      {place.name || place.title}
                    </h3>
                    {place.description && (
                      <p className={styles.cardDescription}>{place.description}</p>
                    )}
                  </div>

                  {/* Action "Know more" Arrow Button */}
                  <div className={styles.cardActionArea}>
                    <span className={styles.knowMoreLabel}>Know more</span>
                    <span className={styles.knowMoreArrow} aria-hidden="true">
                      &rarr;
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mobile Tappable Dots Indicator */}
        {showScrollerControls && (
          <div className={styles.mobileDotsWrap} aria-label="Nearby places dots indicator">
            {places.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dotBtn} ${i === activeIndex ? styles.dotActive : ''}`}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to nearby place ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* -------------------------------------------------------------
          DETAIL VIEW: Mobile Bottom Sheet (<1024px) / Desktop Modal (>=1024px)
          Rendered via Portal into document.body (z-index: 99999, never cut off by sibling sections)
          ------------------------------------------------------------- */}
      {mounted && selectedPlace && createPortal(
        <div
          className={styles.scrimBackdrop}
          onClick={closeDetail}
          role="dialog"
          aria-modal="true"
          aria-labelledby="nearbyDialogTitle"
          id="nearbyPlaceDialog"
        >
          {/* Mobile Bottom Sheet (<1024px) */}
          <div
            ref={sheetRef}
            className={styles.sheetContainer}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleSheetTouchStart}
            onTouchMove={handleSheetTouchMove}
            onTouchEnd={handleSheetTouchEnd}
          >
            {/* Grab Handle */}
            <div className={styles.grabHandleArea} aria-hidden="true">
              <div className={styles.grabHandle} />
            </div>

            {/* Large Photo (aspect 4/3, radius 24) */}
            <div className={styles.sheetPhotoArea}>
              {(selectedPlace.image || selectedPlace.landmarkImage || (selectedPlace.photos && selectedPlace.photos[0]?.url)) ? (
                <img
                  src={selectedPlace.image || selectedPlace.landmarkImage || selectedPlace.photos[0]?.url}
                  alt={selectedPlace.name || selectedPlace.title}
                  className={styles.sheetPhotoImg}
                />
              ) : (
                <div className={styles.photoPlaceholder} aria-hidden="true">
                  <span>{(selectedPlace.name || selectedPlace.title || 'N').charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Place Name (24px bold) */}
            <h2 id="nearbyDialogTitle" className={styles.sheetTitle}>
              {selectedPlace.name || selectedPlace.title}
            </h2>

            {/* Location + Km Pill Row */}
            <div className={styles.sheetMetaRow}>
              {selectedPlace.district && (
                <span className={styles.sheetLocation}>
                  {selectedPlace.district.charAt(0).toUpperCase() + selectedPlace.district.slice(1)}
                </span>
              )}
              {selectedPlace.distanceKm != null && (
                <span className={styles.distancePill}>
                  {selectedPlace.distanceKm} km
                </span>
              )}
            </div>

            {/* Description (scrolls inside if long) */}
            {selectedPlace.description && (
              <p className={styles.sheetDescription}>
                {selectedPlace.description}
              </p>
            )}

            {/* Small text "Close" button (min 44px tap area) */}
            <button
              type="button"
              className={styles.sheetCloseBtn}
              onClick={closeDetail}
              aria-label="Close details"
            >
              Close
            </button>
          </div>

          {/* Desktop Centered Modal (>=1024px) */}
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button top-right (44px tap area) */}
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={closeDetail}
              aria-label="Close details"
            >
              &times;
            </button>

            {/* Left Column: Photo (aspect / min-height 420px, radius 24) */}
            <div className={styles.modalPhotoArea}>
              {(selectedPlace.image || selectedPlace.landmarkImage || (selectedPlace.photos && selectedPlace.photos[0]?.url)) ? (
                <img
                  src={selectedPlace.image || selectedPlace.landmarkImage || selectedPlace.photos[0]?.url}
                  alt={selectedPlace.name || selectedPlace.title}
                  className={styles.modalPhotoImg}
                />
              ) : (
                <div className={styles.photoPlaceholder} aria-hidden="true">
                  <span>{(selectedPlace.name || selectedPlace.title || 'N').charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Right Column: Details */}
            <div className={styles.modalRightCol}>
              <h2 id="nearbyDialogTitleDesktop" className={styles.modalTitle}>
                {selectedPlace.name || selectedPlace.title}
              </h2>

              <div className={styles.modalMetaRow}>
                {selectedPlace.district && (
                  <span className={styles.modalLocation}>
                    {selectedPlace.district.charAt(0).toUpperCase() + selectedPlace.district.slice(1)}
                  </span>
                )}
                {selectedPlace.distanceKm != null && (
                  <span className={styles.distancePill}>
                    {selectedPlace.distanceKm} km
                  </span>
                )}
              </div>

              {selectedPlace.description && (
                <p className={styles.modalDescription}>
                  {selectedPlace.description}
                </p>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </Section>
  );
}
