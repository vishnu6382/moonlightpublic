'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import Section from '@/components/Section';
import FadeUp from '@/components/FadeUp';
import SectionHeader from '@/components/SectionHeader';
import CoveLight from '@/components/CoveLight/CoveLight';
import { getOptimizedVideoUrl } from '@/lib/videoOptimizer';
import styles from './HomeStay.module.css';

// Thin bronze icons matching design system
function StayIcon({ name }) {
  switch (name) {
    case 'bed':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v4" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'rooms':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <rect x="3" y="3" width="18" height="18" rx="3" strokeWidth="1.8" />
          <path d="M9 3v18M14 12h2" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    case 'dorms':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeWidth="1.8" />
          <circle cx="9" cy="7" r="4" strokeWidth="1.8" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeWidth="1.8" />
        </svg>
      );
    case 'pool':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M2 12c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M2 17c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" strokeWidth="1.8" strokeLinecap="round" />
          <circle cx="12" cy="6" r="2.5" strokeWidth="1.8" />
        </svg>
      );
    case 'trees':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M12 3L4 15h5v6h6v-6h5L12 3z" strokeWidth="1.8" strokeLinejoin="round" />
        </svg>
      );
    case 'pin':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeWidth="1.8" />
          <circle cx="12" cy="10" r="3" strokeWidth="1.8" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="10" strokeWidth="1.8" />
          <polyline points="12 6 12 12 16 14" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={styles.iconSvg} viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <circle cx="12" cy="12" r="9" strokeWidth="1.8" />
        </svg>
      );
  }
}

export default function HomeStay({ content }) {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  if (!content) return null;

  const {
    label,
    title,
    heading,
    paragraph,
    stats = [],
    video,
    infoTile,
    tallPhoto,
    avatarPhotos = [],
    pills = [],
  } = content;

  const hasRealVideo = Boolean(video && video.src);

  const defaultStats = [
    {
      label: 'Villa Rooms & Dorms',
      value: '10 Rooms Available',
      icon: 'bed',
      link: '/rooms',
    },
    {
      label: 'Clean Swimming Pool',
      value: 'Family & Group Safe',
      icon: 'pool',
      link: '/gallery',
    },
  ];

  const effectiveStats = (Array.isArray(stats) && stats.length > 0 && stats[0]?.label)
    ? stats
    : defaultStats;

  return (
    <Section id="stay" spacing="xl" variant="white" className={styles.staySection} data-moon-section="true">
      <CoveLight align="right" intensity={0.75} />

      {/* Luxury Ambient Moonlight Side-Flank Animations (Left & Right margins) */}
      <div className={styles.ambientSideContainer} aria-hidden="true">
        {/* Left Side Ambient Flank */}
        <div className={styles.flankLeft}>
          <div className={styles.ambientOrbLeft} />
          <div className={styles.ambientConcentricLeft}>
            <svg viewBox="0 0 240 600" className={styles.contourSvg} fill="none">
              <circle cx="-30" cy="300" r="140" stroke="rgba(201,162,92,0.18)" strokeWidth="1.5" strokeDasharray="4 8" />
              <circle cx="-30" cy="300" r="220" stroke="rgba(201,162,92,0.12)" strokeWidth="1" />
              <circle cx="-30" cy="300" r="290" stroke="rgba(201,162,92,0.07)" strokeWidth="1" strokeDasharray="6 12" />
            </svg>
          </div>
          <div className={`${styles.sparkle} ${styles.sp1}`} />
          <div className={`${styles.sparkle} ${styles.sp2}`} />
          <div className={`${styles.sparkle} ${styles.sp3}`} />
        </div>

        {/* Right Side Ambient Flank */}
        <div className={styles.flankRight}>
          <div className={styles.ambientOrbRight} />
          <div className={styles.ambientConcentricRight}>
            <svg viewBox="0 0 240 600" className={styles.contourSvg} fill="none">
              <circle cx="270" cy="300" r="140" stroke="rgba(201,162,92,0.18)" strokeWidth="1.5" strokeDasharray="4 8" />
              <circle cx="270" cy="300" r="220" stroke="rgba(201,162,92,0.12)" strokeWidth="1" />
              <circle cx="270" cy="300" r="290" stroke="rgba(201,162,92,0.07)" strokeWidth="1" strokeDasharray="6 12" />
            </svg>
          </div>
          <div className={`${styles.sparkle} ${styles.sp4}`} />
          <div className={`${styles.sparkle} ${styles.sp5}`} />
          <div className={`${styles.sparkle} ${styles.sp6}`} />
        </div>
      </div>

      {/* Section Header: Label + Title + Thin Divider */}
      <FadeUp>
        <div className={styles.headerWrap}>
          <SectionHeader
            label={label}
            title={title}
            align="left"
            divider
          />
        </div>
      </FadeUp>

      {/* ONE Big Rounded White Card that fills ~90% width (max 1500px) */}
      <FadeUp delay={120}>
        <div className={styles.cardContainer}>
          <div className={styles.mainGrid}>
            
            {/* ROW 1, COL 1 (~30%): Rounded light panel with 2 stacked stat tiles */}
            <div className={styles.statPanel}>
              {effectiveStats.map((stat, idx) => {
                const isClickable = Boolean(stat.link);
                const TileTag = isClickable ? Link : 'div';
                const tileProps = isClickable ? { href: stat.link } : {};

                return (
                  <TileTag
                    key={idx}
                    className={`${styles.statTile} ${isClickable ? styles.clickableTile : ''}`}
                    {...tileProps}
                  >
                    <div className={styles.statIconBadge}>
                      <StayIcon name={stat.icon || (idx === 0 ? 'bed' : 'pool')} />
                    </div>
                    <div className={styles.statTextWrap}>
                      <span className={styles.statLabel}>{stat.label}</span>
                      <span className={styles.statValue}>{stat.value}</span>
                    </div>
                    {isClickable && (
                      <span className={styles.roundArrowBtn} aria-label={`View ${stat.label}`}>
                        &rarr;
                      </span>
                    )}
                  </TileTag>
                );
              })}
            </div>

            {/* ROW 1, COL 2 (~30%): Middle Tile - "Watch Resort Video" (or Info tile if no real video) */}
            {hasRealVideo ? (
              <div
                className={styles.videoTile}
                onClick={() => setIsVideoModalOpen(true)}
                role="button"
                tabIndex={0}
                aria-label="Watch Resort Video"
              >
                <div className={styles.videoLeft}>
                  {video.duration && (
                    <span className={styles.durationPill}>{video.duration}</span>
                  )}
                  <div className={styles.videoInfo}>
                    <h4 className={styles.videoTitle}>{video.title || 'Watch Resort Video'}</h4>
                    <p className={styles.videoSubtitle}>
                      {video.subtitle || 'See pool, villas and open spaces'}
                    </p>
                  </div>
                </div>
                <div className={styles.videoThumbWrap}>
                  <video
                    src={getOptimizedVideoUrl(video.src)}
                    poster={video.poster}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                    className={styles.videoThumbVideo}
                  />
                  <div className={styles.playBadge} aria-hidden="true">&#9654;</div>
                </div>
              </div>
            ) : (
              <div className={styles.infoTile}>
                <div className={styles.infoLeft}>
                  <span className={styles.durationPill}>{infoTile?.badge || 'Timings'}</span>
                  <div className={styles.infoTextGroup}>
                    <h4 className={styles.infoTitle}>{infoTile?.title || 'Check-in & Check-out'}</h4>
                    <p className={styles.infoSubtitle}>
                      {infoTile?.subtitle || 'Check-in 13:00 · Check-out 11:00'}
                    </p>
                  </div>
                </div>
                <div className={styles.infoThumbWrap}>
                  {infoTile?.image && (
                    <Image
                      src={infoTile.image}
                      alt="Moon Light Resort pathway"
                      fill
                      sizes="300px"
                      className={styles.infoThumbImage}
                    />
                  )}
                  <div className={styles.infoClockBadge} aria-hidden="true">
                    <StayIcon name="clock" />
                  </div>
                </div>
              </div>
            )}

            {/* COL 3 (~40%): ONE Tall Rounded Photo spanning FULL height (Row 1 + Heading area) */}
            {tallPhoto && tallPhoto.src && (
              <div className={styles.tallPhotoCol}>
                <Image
                  src={tallPhoto.src}
                  alt={tallPhoto.alt || 'Moon Light Resort pool and villa grounds'}
                  fill
                  sizes="(max-width: 1024px) 100vw, 42vw"
                  className={styles.tallImage}
                />
                
                {/* Frosted-glass card at bottom */}
                <div className={styles.frostedGlassCard}>
                  <div className={styles.glassTextGroup}>
                    <span className={styles.glassTitle}>
                      {hasRealVideo
                        ? tallPhoto.glassCard?.checkInOutFallback || 'Check-in 13:00 · Check-out 11:00'
                        : tallPhoto.glassCard?.title || 'Book your stay'}
                    </span>
                    <span className={styles.glassSubtitle}>
                      {hasRealVideo
                        ? 'Timings'
                        : tallPhoto.glassCard?.subtitle || 'Reserve rooms & dorms for your group'}
                    </span>
                  </div>
                  <Link
                    href={tallPhoto.glassCard?.link || '/contact'}
                    className={styles.glassActionBtn}
                    aria-label="Book your stay"
                  >
                    &rarr;
                  </Link>
                </div>
              </div>
            )}

            {/* ROW 2, COL 1 & 2: Big heading with INLINE button + avatar circles, then paragraph */}
            <div className={styles.headingBlock}>
              <h3 className={styles.mainHeading}>
                <span>{heading}</span>{' '}
                <span className={styles.inlineActionWrap}>
                  <Link href="/rooms" className={styles.inlineButton}>
                    <span>View Rooms</span>
                    <span className={styles.inlineArrow}>&rarr;</span>
                  </Link>

                  {/* 2-3 small round photo circles after inline button */}
                  {avatarPhotos && avatarPhotos.filter(Boolean).length > 0 && (
                    <span className={styles.avatarGroup} aria-hidden="true">
                      {avatarPhotos.filter(Boolean).map((photo, idx) => (
                        <span key={idx} className={styles.avatarCircle}>
                          <Image
                            src={photo}
                            alt=""
                            fill
                            sizes="36px"
                            className={styles.avatarImg}
                          />
                        </span>
                      ))}
                    </span>
                  )}
                </span>
              </h3>

              <p className={styles.paragraph}>{paragraph}</p>
            </div>

            {/* ROW 3, FULL WIDTH (Col 1 to 3): Pills spread across with small icons */}
            <div className={styles.pillsRow}>
              {pills.map((item, idx) => {
                const name = typeof item === 'string' ? item : item.name;
                const icon = typeof item === 'object' && item.icon ? item.icon : 'bed';
                const isAddress = typeof item === 'object' && item.isAddress;

                return (
                  <span
                    key={idx}
                    className={`${styles.pillItem} ${isAddress ? styles.addressPill : ''}`.trim()}
                  >
                    <span className={styles.pillIconWrap}>
                      <StayIcon name={isAddress ? 'pin' : icon} />
                    </span>
                    <span className={styles.pillText}>{name}</span>
                  </span>
                );
              })}
            </div>

          </div>
        </div>
      </FadeUp>

      {/* Video Lightbox Modal (if real video is provided) */}
      {isVideoModalOpen && hasRealVideo && (
        <div
          className={styles.lightboxBackdrop}
          onClick={() => setIsVideoModalOpen(false)}
        >
          <div
            className={styles.lightboxContent}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.closeButton}
              onClick={() => setIsVideoModalOpen(false)}
              aria-label="Close video"
            >
              &times;
            </button>
            <video
              src={getOptimizedVideoUrl(video.src, { maxWidth: 1920 })}
              controls
              autoPlay
              playsInline
              preload="metadata"
              style={{ width: '100%', height: '100%' }}
            />
          </div>
        </div>
      )}
    </Section>
  );
}
