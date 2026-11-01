'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { CategoryIcon } from './CategoryIcons';
import styles from './PlaceCard.module.css';

export default function PlaceCard({ place, index = 0, onSelect, href }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!place) return null;

  const isVariantA = index % 2 === 0; // Variant A: Text on top, photo below. Variant B: Photo on top, text below.
  const catColor = place.categoryColor?.color || '#2F80ED';
  const districtName = place.district ? place.district.charAt(0).toUpperCase() + place.district.slice(1) : '';
  const photos = Array.isArray(place.photos) ? place.photos : [];
  const hasPhotos = photos.length > 0 && photos[0]?.url;
  const currentPhoto = hasPhotos ? photos[activePhotoIdx] || photos[0] : null;

  const distKmLabel = place.distanceKm ? `${place.distanceKm} km` : `${place.approxStraightKm || ''} km`;
  const timeLabel = place.travelTime ? `${place.travelTime} drive` : 'Drive time on request';
  const pillText = place.travelTime
    ? `${place.travelTime} · ${place.distanceKm || place.approxStraightKm} km`
    : `${place.distanceKm || place.approxStraightKm} km`;

  const handleDotClick = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePhotoIdx(i);
  };

  const handleCardClick = (e) => {
    if (onSelect) {
      e.preventDefault();
      onSelect(place);
    }
  };

  // Card Content: Text Block
  const renderTextBlock = () => (
    <div className={styles.textBlock}>
      <h3 className={styles.placeName} title={place.name}>
        {place.name}
      </h3>
      <p className={styles.districtTimeSubline}>
        <span>{districtName}</span>
        <span className={styles.sublineDot}>·</span>
        <span>{timeLabel}</span>
      </p>

      {place.description ? (
        <p className={styles.descriptionText} title={place.description}>
          {place.description}
        </p>
      ) : (
        <div className={styles.descriptionSpacer} />
      )}

      <div className={styles.bottomActionRow}>
        <div className={styles.timeDistancePill}>
          <span>{pillText}</span>
        </div>

        <button
          type="button"
          className={styles.roundArrowBtn}
          style={{ backgroundColor: catColor }}
          aria-label={`Explore route to ${place.name}`}
          tabIndex={-1}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
            <line x1="7" y1="17" x2="17" y2="7" />
            <polyline points="7 7 17 7 17 17" />
          </svg>
        </button>
      </div>
    </div>
  );

  // Card Content: Photo Area (about 58% height, 22px inner radius, 8px margin)
  const renderPhotoArea = () => (
    <div className={styles.photoArea}>
      {hasPhotos && currentPhoto ? (
        <Image
          src={currentPhoto.url}
          alt={currentPhoto.alt || place.name}
          fill
          sizes="(max-width: 680px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className={styles.photoImg}
        />
      ) : (
        <div className={styles.neutralBrandPlaceholder}>
          <img
            src="/brand/moonlight-mark.png"
            alt="Moon Light Resort"
            className={styles.placeholderLogoImg}
          />
        </div>
      )}

      {/* Top-Right Frosted Distance Chip */}
      <div className={styles.topRightFrostedChip}>
        <span>{distKmLabel}</span>
      </div>

      {/* Bottom Frosted Chips: Category + District */}
      <div className={styles.bottomFrostedChipsRow}>
        <div
          className={styles.frostedCategoryChip}
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.88)',
            color: catColor,
            borderColor: catColor
          }}
        >
          <CategoryIcon category={place.category} size={11} color={catColor} />
          <span>{place.category}</span>
        </div>

        <div className={styles.frostedDistrictChip}>
          <span>{districtName}</span>
        </div>
      </div>

      {/* Carousel Dots (if place has more than 1 photo) */}
      {photos.length > 1 && (
        <div className={styles.carouselDotsContainer}>
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.carouselDot} ${i === activePhotoIdx ? styles.activeDot : ''}`}
              onClick={(e) => handleDotClick(e, i)}
              aria-label={`View photo ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );

  const cardInner = isVariantA ? (
    <>
      {renderTextBlock()}
      {renderPhotoArea()}
    </>
  ) : (
    <>
      {renderPhotoArea()}
      {renderTextBlock()}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={styles.premiumCardLinkWrapper}>
        <article className={`${styles.premiumPlaceCard} ${isVariantA ? styles.variantA : styles.variantB}`}>
          {cardInner}
        </article>
      </Link>
    );
  }

  return (
    <article
      className={`${styles.premiumPlaceCard} ${isVariantA ? styles.variantA : styles.variantB}`}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick(e);
        }
      }}
    >
      {cardInner}
    </article>
  );
}
