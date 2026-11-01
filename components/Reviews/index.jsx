'use client';

import React, { useRef, useEffect } from 'react';
import Section from '@/components/Section';
import FadeUp from '@/components/FadeUp';
import SectionHeader from '@/components/SectionHeader';
import styles from './Reviews.module.css';

function StarIcon() {
  return (
    <svg className={styles.starIcon} viewBox="0 0 20 20" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function ReviewCard({ review }) {
  return (
    <div className={styles.reviewCard}>
      <div>
        <div className={styles.cardHeader}>
          <div className={styles.authorInfo}>
            <span className={styles.authorName}>{review.author || 'Guest'}</span>
            {review.date && <span className={styles.reviewDate}>{review.date}</span>}
          </div>
          <div className={styles.googleBadge}>
            <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Google</span>
          </div>
        </div>

        <div className={styles.starsRow} aria-label={`${review.rating || 5} out of 5 stars`}>
          {Array.from({ length: review.rating || 5 }).map((_, i) => (
            <StarIcon key={i} />
          ))}
        </div>

        <p className={styles.reviewText}>&ldquo;{review.text}&rdquo;</p>
      </div>

      <div className={styles.cardFooter}>
        <span className={styles.verifiedStayBadge}>✓ Verified Guest</span>
      </div>
    </div>
  );
}

export default function GoogleReviews({ reviews = [] }) {
  const scrollerRef = useRef(null);
  const isInteractingRef = useRef(false);
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const scrollStartRef = useRef(0);
  const pauseTimerRef = useRef(null);
  const animFrameRef = useRef(null);

  // Duplicate reviews for seamless infinite continuous scroll
  const displayReviews = reviews.length > 0 ? [...reviews, ...reviews] : [];

  const handleInteractionStart = () => {
    isInteractingRef.current = true;
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
  };

  const handleInteractionEnd = (delay = 2500) => {
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => {
      isInteractingRef.current = false;
      isDraggingRef.current = false;
    }, delay);
  };

  // Mouse drag support for desktop
  const handleMouseDown = (e) => {
    if (!scrollerRef.current) return;
    handleInteractionStart();
    isDraggingRef.current = true;
    startXRef.current = e.pageX - scrollerRef.current.offsetLeft;
    scrollStartRef.current = scrollerRef.current.scrollLeft;
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current || !scrollerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollerRef.current.offsetLeft;
    const walk = (x - startXRef.current) * 1.3;
    scrollerRef.current.scrollLeft = scrollStartRef.current - walk;
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      handleInteractionEnd(2500);
    }
  };

  // Continuous, butter-smooth animation scroll (requestAnimationFrame)
  useEffect(() => {
    if (!reviews || reviews.length <= 1) return;

    let lastTime = performance.now();

    const smoothGlide = (currentTime) => {
      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      const el = scrollerRef.current;
      if (el && !isInteractingRef.current) {
        // Continuous smooth drift (~38px per second)
        el.scrollLeft += 38 * dt;

        // When scrolled past half the duplicated items, loop back seamlessly
        const halfWidth = el.scrollWidth / 2;
        if (el.scrollLeft >= halfWidth) {
          el.scrollLeft -= halfWidth;
        }
      }

      animFrameRef.current = requestAnimationFrame(smoothGlide);
    };

    animFrameRef.current = requestAnimationFrame(smoothGlide);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, [reviews]);

  const scrollByAmount = (direction) => {
    handleInteractionStart();
    const el = scrollerRef.current;
    if (!el) return;
    const card = el.querySelector(`.${styles.reviewCard}`);
    const scrollStep = card ? card.offsetWidth + 14 : 360;
    el.scrollBy({
      left: direction * scrollStep,
      behavior: 'smooth',
    });
    handleInteractionEnd(3000);
  };

  if (!reviews || reviews.length === 0) {
    return null;
  }

  return (
    <Section id="reviews" spacing="xl" variant="panel" className={styles.reviewsSection} data-moon-section="true">
      <FadeUp>
        <div className={styles.headerRow}>
          <SectionHeader
            label="GUEST REVIEWS"
            title="What Our Guests Say"
            subtitle="Real reviews from families and groups who spent time together at Moon Light Resort."
            align="left"
            divider
          />

          {/* Desktop Navigation Arrows */}
          <div className={styles.navArrows} aria-label="Review navigation">
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByAmount(-1)}
              aria-label="Previous reviews"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              type="button"
              className={styles.navBtn}
              onClick={() => scrollByAmount(1)}
              aria-label="Next reviews"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </FadeUp>

      {/* Smooth Continuous Animated Scroller + Swipeable Track (Mobile width 95%) */}
      <div
        ref={scrollerRef}
        className={styles.scrollerTrack}
        role="region"
        aria-label="Reviews carousel"
        tabIndex={0}
        onMouseEnter={handleInteractionStart}
        onMouseLeave={() => handleInteractionEnd(1000)}
        onTouchStart={handleInteractionStart}
        onTouchEnd={() => handleInteractionEnd(2500)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleInteractionStart}
      >
        {displayReviews.map((rev, idx) => (
          <ReviewCard key={`${rev.id || 'r'}-${idx}`} review={rev} />
        ))}
      </div>
    </Section>
  );
}
