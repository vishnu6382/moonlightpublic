'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Button from '@/components/Button';
import Section from '@/components/Section';
import FadeUp from '@/components/FadeUp';
import SectionHeader from '@/components/SectionHeader';
import CoveLight from '@/components/CoveLight/CoveLight';
import styles from './RoomsPreview.module.css';

export default function RoomsPreview({ rooms = [] }) {
  if (!rooms || rooms.length === 0) {
    return null;
  }

  // Intelligent layout assignment: guarantees 100% gap-free bento grid
  const getSpanClass = (room, index, total) => {
    if (room.orientation === 'tall') return styles.span_tall;
    if (room.orientation === 'wide') return styles.span_wide;
    if (room.orientation === 'large') return styles.span_large;
    if (room.orientation === 'square') return styles.span_square;

    // For 5 rooms (the exact count on Moon Light Resort):
    // Row 1: Title Tile (span 2) + Room 0 (span 2) -> 4 cols full
    // Row 2: Room 1, 2, 3, 4 (each span 1) -> 4 cols full (zero empty holes)
    if (total === 5) {
      return index === 0 ? styles.span_wide : styles.span_square;
    }

    if (total === 4) {
      return (index === 0 || index === 3) ? styles.span_wide : styles.span_square;
    }

    if (total >= 6) {
      if (index === 0 || index === 3 || index === 4 || index === 5) return styles.span_wide;
      return styles.span_square;
    }

    return index === 0 ? styles.span_wide : styles.span_square;
  };

  return (
    <Section id="rooms" spacing="xl" variant="white" className={styles.roomsSection} data-moon-section="true">
      <CoveLight align="center" intensity={0.85} />
      <FadeUp>
        <SectionHeader
          label="ACCOMMODATIONS"
          title="Our Room Types"
          subtitle="Comfortable villa rooms and spacious dorms designed for group stays and family retreats in Nedungulam."
          align="left"
          divider
        />
      </FadeUp>

      <FadeUp delay={120}>
        <div className={styles.bentoGrid}>
          {/* Top-Left Title Tile (from references/rooms-bento-layout.jpg) */}
          <div className={styles.titleTile}>
            <div>
              <div className={styles.titleTileLabel}>Private &amp; Shared Stays</div>
              <h3 className={styles.titleTileHeading}>Our Room Types</h3>
              <p className={styles.titleTileText}>
                Every room is designed with comfort-first essentials, private baths, and easy access to the swimming pool and open lawn spaces.
              </p>
            </div>
            <div>
              <Button href="/rooms" variant="outline" size="sm">
                View All Rooms &rarr;
              </Button>
            </div>
          </div>

          {/* Room Cards (3rd style from references/room-card-style.jpg) */}
          {rooms.map((room, index) => {
            const spanClass = getSpanClass(room, index, rooms.length);
            return (
              <Link
                key={room.id || room.slug || index}
                href={`/rooms/${room.slug}`}
                className={`${styles.roomCard} ${spanClass}`.trim()}
              >
                {room.image && (
                  <Image
                    src={room.image}
                    alt={room.name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    quality={92}
                    className={styles.roomImage}
                  />
                )}
                <div className={styles.gradientOverlay} />

                {/* Content directly on photo: no solid white bar */}
                <div className={styles.cardContent}>
                  <div className={styles.roomInfo}>
                    <span className={styles.roomName}>{room.name}</span>
                    {(room.subLabel || room.roomType) && (
                      <span className={styles.roomSubLabel}>
                        {room.subLabel || room.roomType}
                      </span>
                    )}
                  </div>
                  <div className={styles.arrowButton} aria-label={`View ${room.name} details`}>
                    <svg className={styles.arrowIcon} viewBox="0 0 24 24">
                      <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                    </svg>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </FadeUp>

      <FadeUp delay={200}>
        <div className={styles.ctaRow}>
          <Button href="/rooms" variant="outline" size="lg">
            View All Rooms &rarr;
          </Button>
        </div>
      </FadeUp>
    </Section>
  );
}
