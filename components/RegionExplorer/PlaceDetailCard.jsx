'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { contactData } from '@/content/contact';
import { CategoryIcon } from './CategoryIcons';
import styles from './PlaceDetailCard.module.css';

export default function PlaceDetailCard({ place, onClearSelection, onReplayRoute }) {
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);

  if (!place) return null;

  const catColor = place.categoryColor?.color || '#2F80ED';
  const districtName = place.district ? place.district.charAt(0).toUpperCase() + place.district.slice(1) : '';
  const photos = Array.isArray(place.photos) ? place.photos : [];
  const hasPhotos = photos.length > 0 && photos[0]?.url;
  const currentPhoto = hasPhotos ? photos[activePhotoIdx] || photos[0] : null;

  const distVal = place.isRoadDistance
    ? `${place.distanceKm} km`
    : `about ${place.distanceKm || place.approxStraightKm} km`;
  const distSub = place.isRoadDistance ? 'by road' : 'straight line';
  const timeVal = place.travelTime || 'On request';

  const whatsappPhone = contactData.whatsappNumber || '919894486300';
  const whatsappMsg = encodeURIComponent(
    `Hi, I plan to visit ${place.name}. I would like to know about a stay at Moon Light Resort.`
  );
  const whatsappUrl = `https://wa.me/${whatsappPhone}?text=${whatsappMsg}`;

  const handleDotClick = (e, i) => {
    e.preventDefault();
    e.stopPropagation();
    setActivePhotoIdx(i);
  };

  return (
    <div className={styles.detailCardContainer}>
      {/* Top Media Banner */}
      <div className={styles.mediaBanner}>
        {hasPhotos && currentPhoto ? (
          <Image
            src={currentPhoto.url}
            alt={currentPhoto.alt || place.name}
            fill
            sizes="(max-width: 680px) 100vw, 360px"
            className={styles.bannerImage}
          />
        ) : (
          <div
            className={styles.bannerGradient}
            style={{
              background: `linear-gradient(135deg, ${catColor} 0%, #1B1B1B 140%)`
            }}
          >
            <div className={styles.bannerIconCircle}>
              <CategoryIcon category={place.category} size={32} color="#FFFFFF" />
            </div>
          </div>
        )}

        {/* Top-Right Close Button */}
        {onClearSelection && (
          <button
            type="button"
            onClick={onClearSelection}
            className={styles.closeBtn}
            aria-label="Close details"
          >
            &times;
          </button>
        )}

        {/* Bottom Frosted Chips */}
        <div className={styles.chipsRow}>
          <span
            className={styles.frostedChip}
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: catColor,
              borderColor: catColor
            }}
          >
            <CategoryIcon category={place.category} size={11} color={catColor} />
            <span>{place.category}</span>
          </span>

          <span className={styles.districtChip}>
            {districtName}
          </span>
        </div>

        {/* Photo Dots if multiple */}
        {photos.length > 1 && (
          <div className={styles.dotsRow}>
            {photos.map((_, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.dot} ${i === activePhotoIdx ? styles.activeDot : ''}`}
                onClick={(e) => handleDotClick(e, i)}
                aria-label={`Photo ${i + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Body Area */}
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <h2 className={styles.placeTitle}>{place.name}</h2>
          {onReplayRoute && (
            <button
              type="button"
              onClick={onReplayRoute}
              className={styles.replayPillBtn}
              title="Replay Route Animation"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>Replay</span>
            </button>
          )}
        </div>

        {/* Distance and Drive Time Boxes */}
        <div className={styles.metricBoxesRow}>
          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>Distance</span>
            <span className={styles.metricBoxValue}>{distVal}</span>
            <span className={styles.metricBoxSub}>{distSub}</span>
          </div>

          <div className={styles.metricBox}>
            <span className={styles.metricBoxLabel}>Drive Time</span>
            <span className={styles.metricBoxValue}>{timeVal}</span>
            <span className={styles.metricBoxSub}>from resort</span>
          </div>
        </div>

        {/* Short Description (if present) */}
        {place.description ? (
          <p className={styles.descriptionText}>{place.description}</p>
        ) : null}

        {/* Action Buttons: Plan your stay (WhatsApp) + Open in Google Maps */}
        <div className={styles.actionsColumn}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.planStayBtn}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#FFFFFF">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span>Plan your stay</span>
          </a>

          <a
            href={place.mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mapsBtn}
          >
            <span>Open in Google Maps</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>

          {/* Small Directions text link */}
          <a
            href={place.directionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.directionsTextLink}
          >
            Directions from the resort &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
