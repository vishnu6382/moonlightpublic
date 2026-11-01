'use client';

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { CategoryIcon } from './CategoryIcons';
import styles from './PhoneCarousel.module.css';

export default function PhoneCarousel({
  places = [],
  selectedPlace = null,
  onSelectPlace,
  onOpenDetails
}) {
  const carouselRef = useRef(null);
  const cardRefs = useRef({});
  const isProgrammaticScroll = useRef(false);
  const scrollTimeout = useRef(null);

  // Scroll active card into view when selectedPlace changes from outside (e.g. map tap)
  useEffect(() => {
    if (selectedPlace && cardRefs.current[selectedPlace.id] && !isProgrammaticScroll.current) {
      const cardEl = cardRefs.current[selectedPlace.id];
      cardEl.scrollIntoView({
        behavior: 'smooth',
        inline: 'center',
        block: 'nearest'
      });
    }
  }, [selectedPlace?.id]);

  // Handle scroll snap to detect centred card
  const handleScroll = () => {
    if (isProgrammaticScroll.current) return;

    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }

    scrollTimeout.current = setTimeout(() => {
      const container = carouselRef.current;
      if (!container) return;

      const containerCenter = container.getBoundingClientRect().left + container.offsetWidth / 2;
      let closestPlace = null;
      let minDistance = Infinity;

      places.forEach((p) => {
        const el = cardRefs.current[p.id];
        if (el) {
          const rect = el.getBoundingClientRect();
          const cardCenter = rect.left + rect.width / 2;
          const dist = Math.abs(containerCenter - cardCenter);
          if (dist < minDistance) {
            minDistance = dist;
            closestPlace = p;
          }
        }
      });

      if (closestPlace && closestPlace.id !== selectedPlace?.id) {
        onSelectPlace?.(closestPlace);
      }
    }, 150);
  };

  const handleCardClick = (place) => {
    isProgrammaticScroll.current = true;
    onSelectPlace?.(place);
    onOpenDetails?.(place);
    setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 400);
  };

  return (
    <div
      ref={carouselRef}
      className={styles.carouselContainer}
      onScroll={handleScroll}
      aria-label="Nearby places swipe carousel"
    >
      {places.map((place) => {
        const isSelected = selectedPlace?.id === place.id;
        const catColor = place.categoryColor?.color || '#2F80ED';
        const districtName = place.district ? place.district.charAt(0).toUpperCase() + place.district.slice(1) : '';
        const hasPhoto = place.photos && place.photos.length > 0 && place.photos[0]?.url;

        return (
          <div
            key={place.id}
            ref={(el) => {
              if (el) cardRefs.current[place.id] = el;
            }}
            className={`${styles.carouselCard} ${isSelected ? styles.cardSelected : ''}`}
            onClick={() => handleCardClick(place)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCardClick(place);
              }
            }}
          >
            {/* Left 96px Photo */}
            <div className={styles.photoBox}>
              {hasPhoto ? (
                <Image
                  src={place.photos[0].url}
                  alt={place.name}
                  width={96}
                  height={96}
                  className={styles.photoImg}
                />
              ) : (
                <div
                  className={styles.photoGradient}
                  style={{
                    background: `linear-gradient(135deg, ${catColor} 0%, #1B1B1B 150%)`
                  }}
                >
                  <CategoryIcon category={place.category} size={28} color="#FFFFFF" />
                </div>
              )}
            </div>

            {/* Right Card Content */}
            <div className={styles.cardDetails}>
              <h4 className={styles.placeName}>{place.name}</h4>
              <span className={styles.districtSub} style={{ color: catColor }}>
                {districtName} · {place.category}
              </span>

              <div className={styles.cardFooter}>
                <div className={styles.distPill}>
                  <span>{place.pillLabel}</span>
                </div>

                <div
                  className={styles.arrowCircle}
                  style={{ backgroundColor: catColor }}
                  aria-hidden="true"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5">
                    <line x1="7" y1="17" x2="17" y2="7" />
                    <polyline points="7 7 17 7 17 17" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
