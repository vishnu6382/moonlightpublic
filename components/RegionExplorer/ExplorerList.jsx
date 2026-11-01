'use client';

import React, { useEffect, useRef } from 'react';
import Image from 'next/image';
import { CategoryIcon } from './CategoryIcons';
import styles from './ExplorerList.module.css';

export default function ExplorerList({
  places = [],
  districts = [],
  selectedPlace = null,
  onSelectPlace
}) {
  const selectedItemRef = useRef(null);

  // Auto-scroll selected row into view
  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }
  }, [selectedPlace?.id]);

  // Group places by district
  const groupedByDistrict = districts.map((d) => {
    const districtPlaces = places.filter((p) => p.district === d.slug);
    return {
      district: d,
      places: districtPlaces
    };
  }).filter((g) => g.places.length > 0);

  return (
    <aside className={styles.explorerListContainer} aria-label="Nearby places directory">
      {groupedByDistrict.length === 0 && (
        <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--muted)' }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '15px' }}>
            Nearby places are coming soon.
          </p>
        </div>
      )}
      {groupedByDistrict.map(({ district, places: dPlaces }) => {
        const districtColor = district.colorInfo?.color || '#2E9E6B';

        return (
          <div key={district.slug} className={styles.districtGroup}>
            <div className={styles.districtHeader}>
              <h3 className={styles.districtHeading}>
                {district.name}
              </h3>
              <span className={styles.districtCountBadge} style={{ color: districtColor }}>
                {dPlaces.length}
              </span>
            </div>

            <div className={styles.placesList}>
              {dPlaces.map((place) => {
                const isSelected = selectedPlace?.id === place.id;
                const catColor = place.categoryColor?.color || '#2F80ED';
                const hasPhoto = place.photos && place.photos.length > 0 && place.photos[0]?.url;

                return (
                  <div
                    key={place.id}
                    ref={isSelected ? selectedItemRef : null}
                    className={`${styles.placeRow} ${isSelected ? styles.placeRowSelected : ''}`}
                    style={
                      isSelected
                        ? {
                            borderLeftColor: catColor,
                            backgroundColor: place.categoryColor?.lightBg || 'rgba(47, 128, 237, 0.08)'
                          }
                        : {}
                    }
                    onClick={() => onSelectPlace(place)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelectPlace(place);
                      }
                    }}
                  >
                    {/* Thumbnail: 84px rounded */}
                    <div className={styles.thumbnailContainer}>
                      {hasPhoto ? (
                        <Image
                          src={place.photos[0].url}
                          alt={place.name}
                          width={84}
                          height={84}
                          className={styles.thumbnailImg}
                        />
                      ) : (
                        <div
                          className={styles.thumbnailGradient}
                          style={{
                            background: `linear-gradient(135deg, ${catColor} 0%, #1B1B1B 150%)`
                          }}
                        >
                          <CategoryIcon category={place.category} size={24} color="#FFFFFF" />
                        </div>
                      )}
                    </div>

                    {/* Details Column */}
                    <div className={styles.rowDetails}>
                      <span className={styles.rowName}>{place.name}</span>

                      <span className={styles.rowCategorySub} style={{ color: catColor }}>
                        {district.name} · {place.category}
                      </span>

                      <div className={styles.rowPill}>
                        <span>{place.pillLabel}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </aside>
  );
}
