'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Section from '@/components/Section';
import SectionHeader from '@/components/SectionHeader';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';
import { fxConfig } from '@/lib/fxConfig';
import CoveLight from '@/components/CoveLight/CoveLight';
import styles from './HomeEvents.module.css';

function getEventStatus(event) {
  if (!event || !event.date) return 'past';
  const eventDate = new Date(event.date);
  const now = new Date();
  return eventDate >= now ? 'upcoming' : 'past';
}

function formatDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function HomeEvents({ events = [] }) {
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isSectionVisible, setIsSectionVisible] = useState(false);

  const sectionRef = useRef(null);
  const scrollerRef = useRef(null);
  const rafIdRef = useRef(null);

  // Clean hide if no events
  if (!events || events.length === 0) {
    return null;
  }

  // Calculate moon-arc styles and active index on scroll
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

      if (fxConfig.eventsArc) {
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
      }
    });

    setActiveIndex(closestIndex);
    setCanScrollLeft(scroller.scrollLeft > 10);
    setCanScrollRight(scroller.scrollLeft + scroller.clientWidth < scroller.scrollWidth - 10);
  }, []);

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

  // Keyboard navigation on scroller
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByCard(-1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByCard(1);
    }
  };

  // Visibility and initial layout calculation
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
      { threshold: 0.15 }
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

  // Modal ESC key listener & body scroll lock
  useEffect(() => {
    const handleModalKey = (e) => {
      if (e.key === 'Escape') setSelectedEvent(null);
    };
    if (selectedEvent) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleModalKey);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleModalKey);
    };
  }, [selectedEvent]);

  const showScrollerControls = events.length > 2;

  return (
    <Section
      id="events"
      spacing="xl"
      variant="white"
      className={styles.eventsSection}
      data-moon-section="true"
    >
      <CoveLight align="center" intensity={1} />
      <div ref={sectionRef} className={styles.sectionInner}>
        <div className={styles.headerRow}>
          <SectionHeader
            label="EVENTS AT MOON LIGHT RESORT"
            title="Events"
            subtitle="Celebrations, poolside gatherings, and memorable group get-togethers in Nedungulam."
            align="left"
            divider
          />

          {/* Desktop Frosted Navigation Arrows */}
          {showScrollerControls && (
            <div className={styles.desktopArrows} aria-label="Event navigation controls">
              <button
                type="button"
                className={`${styles.navArrowBtn} ${!canScrollLeft ? styles.navArrowDisabled : ''}`}
                onClick={() => scrollByCard(-1)}
                disabled={!canScrollLeft}
                aria-label="Previous event card"
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
                aria-label="Next event card"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Scroller Track */}
        <div
          ref={scrollerRef}
          className={`${styles.scrollerTrack} ${!showScrollerControls ? styles.staticTrack : ''}`}
          onScroll={handleScroll}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="region"
          aria-label="Events carousel"
        >
          {events.map((event, idx) => {
            const status = getEventStatus(event);
            const isUpcoming = status === 'upcoming';
            const isVideo = Boolean(event.coverVideo);
            const mediaUrl = event.coverImage || event.coverVideo;
            const staggerDelay = Math.min(idx * 80, 480);

            return (
              <div
                key={event.id || idx}
                className={`${styles.cardArcWrapper} ${isSectionVisible ? styles.cardVisible : ''}`}
                style={{
                  transitionDelay: `${staggerDelay}ms`,
                }}
              >
                <div
                  className={styles.eventCard}
                  onClick={() => setSelectedEvent(event)}
                  role="button"
                  tabIndex={0}
                  aria-label={`View details for ${event.title}`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedEvent(event);
                    }
                  }}
                >
                  {/* Inner Photo / Video Area (58% height, radius 22px) */}
                  <div className={styles.cardMediaArea}>
                    {isVideo ? (
                      <div className={styles.videoPosterWrap}>
                        <video
                          src={getOptimizedVideoUrl(event.coverVideo)}
                          poster={getOptimizedPosterUrl(event.coverVideo, event.coverImage)}
                          muted
                          loop
                          playsInline
                          preload="metadata"
                          className={styles.cardMedia}
                        />
                        <div className={styles.playIconBadge} aria-hidden="true">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                        </div>
                      </div>
                    ) : mediaUrl ? (
                      <Image
                        src={mediaUrl}
                        alt={event.title || 'Resort event'}
                        fill
                        sizes="(max-width: 640px) 260px, (max-width: 1024px) 320px, 340px"
                        className={styles.cardMedia}
                      />
                    ) : (
                      <div className={styles.mediaFallback}>
                        <span className={styles.fallbackIcon}>✦</span>
                      </div>
                    )}
                  </div>

                  {/* Pills Row (below photo) */}
                  <div className={styles.pillsRow}>
                    <span
                      className={`${styles.statusPill} ${isUpcoming ? styles.upcomingPill : styles.pastPill}`}
                    >
                      {isUpcoming ? 'Upcoming' : 'Past'}
                    </span>
                    {event.date && (
                      <span className={styles.datePill}>{formatDate(event.date)}</span>
                    )}
                    {event.venue && (
                      <span className={styles.venuePill}>{event.venue}</span>
                    )}
                  </div>

                  {/* Card Content: Title, Subtitle, Description */}
                  <div className={styles.cardContent}>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    {event.subtitle && (
                      <p className={styles.eventSubtitle}>{event.subtitle}</p>
                    )}
                    {event.description && (
                      <p className={styles.eventDescription}>{event.description}</p>
                    )}
                  </div>

                  {/* Action "Know more" Arrow Button (min 44x44px touch) */}
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

        {/* Mobile Navigation Dots */}
        {showScrollerControls && (
          <div className={styles.mobileDotsWrap} aria-hidden="true">
            {events.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dotBtn} ${i === activeIndex ? styles.dotActive : ''}`}
                onClick={() => scrollToIndex(i)}
                aria-label={`Go to event ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Event Details Lightbox Modal */}
      {selectedEvent && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedEvent(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalEventTitle"
        >
          <div
            className={styles.modalContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setSelectedEvent(null)}
              aria-label="Close modal"
            >
              &times;
            </button>

            <div className={styles.modalHeader}>
              <div className={styles.pillsRow}>
                {getEventStatus(selectedEvent) === 'upcoming' ? (
                  <span className={`${styles.statusPill} ${styles.upcomingPill}`}>
                    Upcoming
                  </span>
                ) : (
                  <span className={`${styles.statusPill} ${styles.pastPill}`}>
                    Past Event
                  </span>
                )}
                {selectedEvent.date && (
                  <span className={styles.datePill}>
                    {formatDate(selectedEvent.date)}
                  </span>
                )}
                {selectedEvent.venue && (
                  <span className={styles.venuePill}>{selectedEvent.venue}</span>
                )}
              </div>

              <h2 id="modalEventTitle" className={styles.modalTitle}>
                {selectedEvent.title}
              </h2>
              {selectedEvent.subtitle && (
                <p className={styles.modalSubtitle}>{selectedEvent.subtitle}</p>
              )}
            </div>

            {selectedEvent.description && (
              <p className={styles.modalDescription}>{selectedEvent.description}</p>
            )}

            {/* Event Media Bento Grid in modal */}
            {selectedEvent.photos && selectedEvent.photos.length > 0 && (
              <div className={styles.modalGalleryGrid}>
                {selectedEvent.photos.map((photo, pIdx) => (
                  <div
                    key={pIdx}
                    className={`${styles.modalPhotoWrap} ${pIdx === 0 ? styles.photoMain : ''}`}
                  >
                    <Image
                      src={photo.src}
                      alt={photo.alt || selectedEvent.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 500px"
                      className={styles.modalImg}
                    />
                    {photo.caption && (
                      <span className={styles.photoCaption}>{photo.caption}</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Section>
  );
}
