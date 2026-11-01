'use client';

import React from 'react';
import Image from 'next/image';
import { CategoryIcon } from './CategoryIcons';
import styles from './RegionExplorer.module.css';

export default function PlacesEqualGrid({
  places = [],
  selectedPlace = null,
  onSelectPlace
}) {
  if (!places || places.length === 0) {
    return (
      <div className={styles.emptyFilterState}>
        <p>No places match the selected district and category filter.</p>
      </div>
    );
  }

  return (
    <div className={styles.equalGridSection}>
      <div className={styles.equalGrid}>
        {places.map((place) => {
          const isSelected = selectedPlace?.id === place.id;
          const hasPhoto = place.photos && place.photos.length > 0 && place.photos[0]?.url;
          const districtColor = place.districtColor?.color || '#2E9E6B';
          const catColor = place.categoryColor?.color || '#2F80ED';
          const catTextColor = place.categoryColor?.textColor || '#FFFFFF';

          return (
            <div
              key={place.id}
              role="button"
              tabIndex={0}
              className={`${styles.equalCard} ${isSelected ? styles.equalCardSelected : ''}`}
              onClick={() => onSelectPlace(place)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectPlace(place);
                }
              }}
              aria-label={`Select ${place.name}`}
            >
              {/* Coloured Top District Strip */}
              <div
                className={styles.districtTopStrip}
                style={{ backgroundColor: districtColor }}
              >
                <span className={styles.stripDistrictName}>
                  {place.district.toUpperCase()}
                </span>
                <span className={styles.stripVerifiedTag}>
                  {place.coordsVerified ? 'Verified coords' : 'Approx. coords'}
                </span>
              </div>

              {/* Centred Visual Area (Photo or large soft category circle) */}
              <div className={styles.cardVisualArea}>
                {hasPhoto ? (
                  <div className={styles.photoContainer}>
                    <Image
                      src={place.photos[0].url}
                      alt={place.photos[0].alt || place.name}
                      fill
                      sizes="(max-width: 600px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      className={styles.cardImage}
                    />
                  </div>
                ) : (
                  <div
                    className={styles.neutralCircleBadge}
                    style={{
                      backgroundColor: place.categoryColor?.lightBg || 'rgba(47, 128, 237, 0.1)',
                      color: catColor
                    }}
                  >
                    <CategoryIcon category={place.category} size={32} color={catColor} />
                  </div>
                )}
              </div>

              {/* Card Text Content */}
              <div className={styles.cardBody}>
                {/* Category Chip */}
                <div className={styles.cardCategoryRow}>
                  <span
                    className={styles.cardCategoryChip}
                    style={{
                      backgroundColor: place.categoryColor?.lightBg || 'rgba(47, 128, 237, 0.1)',
                      color: catColor,
                      borderColor: catColor
                    }}
                  >
                    <CategoryIcon category={place.category} size={11} color={catColor} />
                    <span>{place.category}</span>
                  </span>
                </div>

                {/* Place Name (Normal font, 2 lines max) */}
                <h3 className={styles.cardPlaceTitle} title={place.name}>
                  {place.name}
                </h3>

                {/* Distance Line */}
                <div className={styles.cardDistanceLine}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{place.displayDistance}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
