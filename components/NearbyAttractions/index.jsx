'use client';

import React, { useState, useRef, useEffect } from 'react';
import SectionHeader from '@/components/SectionHeader';
import styles from './NearbyAttractions.module.css';

/**
 * Clean, Elegant Luxury Resort Attraction Card (Matching Event Design)
 */
function ResortAttractionCard({
  place,
  index = 0,
  onSelect,
}) {
  const [imageError, setImageError] = useState(false);

  const title = place.title || place.name || 'Local Destination';
  const description = place.description || '';
  const image = place.image || place.landmarkImage || (place.photos && place.photos[0]?.url) || '';
  const locationText = place.district ? place.district.toUpperCase() : (place.location || '');
  const distanceKm = place.distanceKm != null ? `${place.distanceKm} km` : null;
  const travelTime = place.travelTime || place.travelTimeLabel || (place.travelMinutes ? `${place.travelMinutes} mins` : null);

  return (
    <article
      className={styles.card}
      onClick={() => onSelect(place)}
      role="button"
      tabIndex={0}
      aria-label={`View details for ${title}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(place);
        }
      }}
    >
      {/* Photo Frame (Matching Event Card 58% ratio & 18px radius) */}
      <div className={styles.photoArea}>
        {image && !imageError ? (
          <img
            src={image}
            alt={title}
            loading={index < 3 ? 'eager' : 'lazy'}
            decoding="async"
            className={styles.photoImg}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.photoPlaceholder} aria-hidden="true">
            <span>{title.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Pills Row (Location + Distance + Travel Time) */}
      <div className={styles.pillsRow}>
        {locationText && (
          <span className={styles.locationPill} title={locationText}>
            {locationText}
          </span>
        )}
        {distanceKm && (
          <span className={styles.distancePill} title={`Distance: ${distanceKm}`}>
            {distanceKm}
          </span>
        )}
        {travelTime && (
          <span className={styles.travelPill} title={`Travel time: ${travelTime}`}>
            {travelTime}
          </span>
        )}
      </div>

      {/* Card Content: Title & Description */}
      <div className={styles.cardContent}>
        <h3 className={styles.cardTitle}>{title}</h3>
        {description && (
          <p className={styles.cardDescription}>{description}</p>
        )}
      </div>

      {/* Action Area: Know more with circular arrow */}
      <div className={styles.cardActionArea}>
        <span className={styles.knowMoreLabel}>Know more</span>
        <span className={styles.knowMoreArrow} aria-hidden="true">
          &rarr;
        </span>
      </div>
    </article>
  );
}

/**
 * Main Luxury Editorial Nearby Attractions Page Section
 */
export default function NearbyAttractions({
  items = [],
  title = "Discover What's Around",
  subtitle = 'Explore beautiful places and memorable experiences around Moon Light Resort.',
  eyebrow = 'EXPLORE THE SURROUNDINGS',
  showEmptyState = false,
}) {
  const [selectedPlace, setSelectedPlace] = useState(null);
  const activeItems = (items || []).filter((item) => item.isActive !== false);

  // Close modal on Escape
  useEffect(() => {
    if (!selectedPlace) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setSelectedPlace(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPlace]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (selectedPlace) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedPlace]);

  if (activeItems.length === 0) {
    if (!showEmptyState) return null;
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.emptyState}>
            <h3 className={styles.emptyTitle}>Nearby Areas Updating Soon</h3>
            <p className={styles.emptyText}>
              Curated local attractions and travel highlights will appear here shortly.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.section} id="nearby">
      <div className={styles.container}>
        {/* Section Header */}
        <div className={styles.headerWrap}>
          <SectionHeader
            label={eyebrow}
            title={title}
            subtitle={subtitle}
            align="center"
            divider
          />
        </div>

        {/* Attractions Grid (Sleek, responsive 3 columns desktop, 2 tablet, 1 mobile) */}
        <div className={styles.grid}>
          {activeItems.map((place, idx) => (
            <ResortAttractionCard
              key={place.id || place._id || place.slug || idx}
              place={place}
              index={idx}
              onSelect={setSelectedPlace}
            />
          ))}
        </div>
      </div>

      {/* Place Details Modal (Clean ivory/gold luxury dialog) */}
      {selectedPlace && (
        <div
          className={styles.modalBackdrop}
          onClick={() => setSelectedPlace(null)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modalPlaceTitle"
        >
          <div
            className={styles.modalCard}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className={styles.modalCloseBtn}
              onClick={() => setSelectedPlace(null)}
              aria-label="Close details"
            >
              &times;
            </button>

            {/* Modal Photo */}
            <div className={styles.modalPhotoWrap}>
              {(selectedPlace.image || selectedPlace.landmarkImage || (selectedPlace.photos && selectedPlace.photos[0]?.url)) ? (
                <img
                  src={selectedPlace.image || selectedPlace.landmarkImage || (selectedPlace.photos && selectedPlace.photos[0]?.url)}
                  alt={selectedPlace.title || selectedPlace.name}
                  className={styles.modalImg}
                />
              ) : (
                <div className={styles.modalPlaceholder}>
                  <span>{(selectedPlace.title || selectedPlace.name || 'M').charAt(0)}</span>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <div className={styles.modalBody}>
              <div className={styles.pillsRow}>
                {selectedPlace.district && (
                  <span className={styles.locationPill}>
                    {selectedPlace.district.toUpperCase()}
                  </span>
                )}
                {selectedPlace.distanceKm != null && (
                  <span className={styles.distancePill}>
                    {selectedPlace.distanceKm} km away
                  </span>
                )}
                {(selectedPlace.travelTime || selectedPlace.travelTimeLabel || selectedPlace.travelMinutes) && (
                  <span className={styles.travelPill}>
                    {selectedPlace.travelTime || selectedPlace.travelTimeLabel || `${selectedPlace.travelMinutes} mins drive`}
                  </span>
                )}
              </div>

              <h2 id="modalPlaceTitle" className={styles.modalTitle}>
                {selectedPlace.title || selectedPlace.name}
              </h2>

              {selectedPlace.description && (
                <p className={styles.modalDescription}>
                  {selectedPlace.description}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}