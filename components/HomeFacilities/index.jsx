'use client';

import React from 'react';
import Image from 'next/image';
import Section from '@/components/Section';
import FadeUp from '@/components/FadeUp';
import SectionHeader from '@/components/SectionHeader';
import SectionBackdrop from '@/components/SectionBackdrop';
import styles from './HomeFacilities.module.css';

// Consistent thin bronze line SVG icons (one style)
function FacilityIcon({ name }) {
  switch (name) {
    case 'ac':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="2" y="5" width="20" height="9" rx="2" />
          <path d="M6 14v4M10 14v4M14 14v4M18 14v4" />
        </svg>
      );
    case 'power':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      );
    case 'wifi':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
        </svg>
      );
    case 'coffee':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    case 'utensils':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M18 2v20M2 2v20M2 7h5a3 3 0 0 1 0 6H2M18 7a3 3 0 0 1 3 3v2h-3" />
        </svg>
      );
    case 'kitchen':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M6 13.87A4 4 0 0 1 7.41 6a5.11 5.11 0 0 1 1.05-1.54 5 5 0 0 1 7.08 0A5.11 5.11 0 0 1 16.59 6 4 4 0 0 1 18 13.87V21H6Z" />
          <line x1="6" y1="17" x2="18" y2="17" />
        </svg>
      );
    case 'parking':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="4" />
          <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
        </svg>
      );
    case 'hall':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      );
    case 'family':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    case 'tent':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polygon points="12 3 2 21 22 21 12 3" />
          <line x1="12" y1="3" x2="12" y2="21" />
        </svg>
      );
    case 'compass':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'discount':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    default:
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

export default function HomeFacilities({ data }) {
  if (!data) return null;

  const {
    title,
    subtitle,
    image,
    groups = [],
    badge = 'Thoughtful Amenities',
    featuredTitle = 'All Essentials For A Relaxing Stay',
    featuredText = 'From air conditioning and full power backup to a clean swimming pool and dining space.',
  } = data;

  return (
    <Section id="facilities" spacing="xl" variant="panel" className={styles.facilitiesSection} data-moon-section="true" style={{ position: 'relative', overflow: 'hidden' }}>
      <SectionBackdrop align="left" />
      <FadeUp>
        <SectionHeader
          label="COMFORT-FIRST STAY"
          title={title}
          subtitle={subtitle}
          align="left"
          divider
        />
      </FadeUp>

      <FadeUp delay={120}>
        <div className={styles.mainGrid}>
          {/* Left Large Tile with Resort Image */}
          <div className={styles.featuredTile}>
            {image && (
              <Image
                src={image}
                alt="Moon Light Resort facilities overview"
                fill
                sizes="(max-width: 960px) 100vw, 40vw"
                className={styles.featuredImage}
              />
            )}
            <div className={styles.featuredOverlay}>
              <div className={styles.featuredBadge}>{badge}</div>
              <h3 className={styles.featuredTitle}>{featuredTitle}</h3>
              <p className={styles.featuredText}>{featuredText}</p>
            </div>
          </div>

          {/* Right Groups Grid: 4 Group Tiles */}
          <div className={styles.groupsGrid}>
            {groups.map((group) => (
              <div key={group.id} className={styles.groupTile}>
                <div className={styles.groupHeader}>
                  <span className={styles.groupDot} />
                  <h4 className={styles.groupName}>{group.name}</h4>
                </div>
                <div className={styles.itemsList}>
                  {group.items.map((item, idx) => (
                    <div key={idx} className={styles.itemRow}>
                      <div className={styles.iconWrapper} aria-hidden="true">
                        <FacilityIcon name={item.icon} />
                      </div>
                      <span className={styles.itemName}>{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}
