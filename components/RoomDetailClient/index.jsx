'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import FacilityIcon from '@/components/FacilityIcon';
import RoomTile from '@/components/RoomTile';
import RoomGallery from '@/components/RoomGallery';
import MediaLightbox from '@/components/MediaLightbox';
import SectionBackdrop from '@/components/SectionBackdrop';
import { siteConfig } from '@/content/site';
import styles from '@/app/rooms/[slug]/roomDetail.module.css';

const Pano360Viewer = dynamic(() => import('@/components/Pano360Viewer'), {
  ssr: false,
});

export default function RoomDetailClient({ room, otherRooms = [] }) {
  const [is360Open, setIs360Open] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(null);

  const enquiryMessage = `Hi, I would like to enquire about ${room.name} at Moon Light Resort.`;
  const whatsappUrl = `https://wa.me/${siteConfig.phoneRaw.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(enquiryMessage)}`;
  const callUrl = `tel:${siteConfig.phoneRaw}`;

  // Combine media for lightbox and gallery
  const allMedia = [
    ...(room.photos || []),
    ...(room.videos || []).map((v) => ({ ...v, type: 'video' })),
  ];

  const hasPano360 = Boolean(room.pano360 && (room.pano360.src || typeof room.pano360 === 'string'));
  const facilities = Array.isArray(room.facilities) ? room.facilities : [];
  const hasFacilities = facilities.length > 0;
  const features = Array.isArray(room.features) ? room.features : [];
  const hasFeatures = features.length > 0;

  // Wording helper: singular/plural for numberOfRooms
  const formatRoomsCount = (count) => {
    if (!count) return null;
    return count === 1 ? '1 room' : `${count} rooms`;
  };

  // Build facts grid boxes: TWO per row (ROOM TYPE, BED DETAILS, CAPACITY, AVAILABLE)
  const infoBoxes = [];
  if (room.roomType) {
    infoBoxes.push({
      id: 'type',
      icon: 'type',
      label: 'ROOM TYPE',
      value: room.roomType,
    });
  }
  if (room.bedType) {
    infoBoxes.push({
      id: 'bed',
      icon: 'bed',
      label: 'BED DETAILS',
      value: room.bedType,
    });
  }
  if (room.maxOccupancy) {
    infoBoxes.push({
      id: 'capacity',
      icon: 'users',
      label: 'CAPACITY',
      value: `Up to ${room.maxOccupancy} guests`,
    });
  }
  if (room.numberOfRooms) {
    infoBoxes.push({
      id: 'available',
      icon: 'key',
      label: 'AVAILABLE',
      value: formatRoomsCount(room.numberOfRooms),
    });
  }

  // Auto-scrolling infinite marquee pills (two identical halves for seamless infinite loop)
  let marqueeHalf = [...facilities];
  while (marqueeHalf.length < 10 && marqueeHalf.length > 0) {
    marqueeHalf = [...marqueeHalf, ...facilities];
  }
  const marqueeFacilities = [...marqueeHalf, ...marqueeHalf];

  return (
    <div className={styles.roomDetailPage}>
      {/* 1. HERO SECTION: Full width (100% minus 12px margin), 85svh height, radius 40px */}
      <section className={styles.heroSection} aria-label={`${room.name} Hero`}>
        {room.mainImage || room.image || room.photos?.[0]?.src ? (
          <div
            onClick={() => allMedia.length > 0 && setLightboxIndex(0)}
            style={{ cursor: allMedia.length > 0 ? 'pointer' : 'default', position: 'absolute', inset: 0 }}
            role="button"
            tabIndex={0}
            aria-label={`View full photos for ${room.name}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                if (allMedia.length > 0) setLightboxIndex(0);
              }
            }}
          >
            <Image
              src={room.mainImage || room.image || room.photos?.[0]?.src}
              alt={room.name}
              fill
              priority
              quality={95}
              sizes="100vw"
              className={styles.heroImage}
            />
          </div>
        ) : (
          <div className={styles.heroPlaceholderWrap}>
            <img src="/brand/moonlight-mark.png" alt="Moon Light Resort" className={styles.heroPlaceholderLogo} />
          </div>
        )}
        <div className={styles.heroGradient} aria-hidden="true" />

        {/* Top-Left: Room Name & RoomType Pill */}
        <div className={styles.heroTopLeft}>
          {room.roomType && (
            <span className={styles.roomTypePill}>{room.roomType}</span>
          )}
          <h1 className={styles.roomHeroTitle}>{room.name}</h1>
        </div>

        {/* Mobile Top-Right: Round Icon Buttons (WhatsApp + Call Us) */}
        <div className={styles.heroTopRight}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileRoundIconBtn}
            aria-label={`Chat on WhatsApp about ${room.name}`}
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.67 20.16 9.32 19.8 8.14 19.11L7.86 18.94L4.74 19.76L5.57 16.71L5.38 16.41C4.62 15.19 4.22 13.57 4.22 11.91C4.22 7.38 7.92 3.67 12.05 3.67Z" />
            </svg>
          </a>
          <a
            href={callUrl}
            className={styles.mobileRoundIconBtn}
            aria-label="Call Moon Light Resort"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
            </svg>
          </a>
        </div>

        {/* Desktop Bottom-Right: WhatsApp + Call Us (16px clear of notch) */}
        <div className={styles.heroBottomRight}>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.frostedBtn}
            aria-label={`Chat on WhatsApp about ${room.name}`}
          >
            <svg
              className={styles.btnIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.67 20.16 9.32 19.8 8.14 19.11L7.86 18.94L4.74 19.76L5.57 16.71L5.38 16.41C4.62 15.19 4.22 13.57 4.22 11.91C4.22 7.38 7.92 3.67 12.05 3.67Z" />
            </svg>
            <span className={styles.btnText}>WhatsApp</span>
          </a>

          <a
            href={callUrl}
            className={styles.frostedBtn}
            aria-label="Call Moon Light Resort"
          >
            <svg
              className={styles.btnIcon}
              viewBox="0 0 24 24"
              fill="currentColor"
              width="18"
              height="18"
              aria-hidden="true"
            >
              <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
            </svg>
            <span className={styles.btnText}>Call Us</span>
          </a>
        </div>

        {/* Bottom Centre: Smooth notch tab rising from the bottom edge */}
        {hasFacilities && (
          <div className={styles.heroNotchTabContainer}>
            {/* Left concave flared base (blends into image bottom edge) */}
            <svg
              className={styles.notchWingLeft}
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M0 28 A 28 28 0 0 0 28 0 L 28 28 Z" fill="var(--white, #FFFFFF)" />
            </svg>

            {/* Notch Tab Body */}
            <div className={styles.notchTabBody}>
              <div
                className={styles.notchMarqueeViewport}
                tabIndex={0}
                role="region"
                aria-label="Room facilities continuous scroll"
              >
                <div className={styles.notchMarqueeTrack}>
                  {marqueeFacilities.map((fac, idx) => (
                    <span key={idx} className={styles.notchPill}>
                      <span className={styles.notchPillIconWrap}>
                        <FacilityIcon name={fac.icon || fac.name} size={14} />
                      </span>
                      <span className={styles.notchPillText}>{fac.name}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Right concave flared base (blends into image bottom edge) */}
            <svg
              className={styles.notchWingRight}
              viewBox="0 0 28 28"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M0 0 A 28 28 0 0 0 28 28 L 0 28 Z" fill="var(--white, #FFFFFF)" />
            </svg>
          </div>
        )}
      </section>

      {/* 2. CONTENT CONTAINER (Chips, Facilities, Gallery, About, Other Rooms) */}
      <div className={styles.contentContainer}>
        {/* SPECIALTIES CHIPS: features[] only, wrap 2 per row on mobile */}
        {hasFeatures && (
          <div className={styles.chipsRow} aria-label="Room features">
            {features.map((feature, idx) => (
              <div key={idx} className={styles.chip}>
                <span className={styles.chipDot} aria-hidden="true" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        )}

        {/* ROOM FACILITIES */}
        {hasFacilities && (
          <section className={styles.facilitiesSection}>
            <div className={styles.sectionHeaderRow}>
              <h2 className={styles.sectionHeading}>Room Facilities</h2>
            </div>
            <div className={styles.facilitiesGrid}>
              {facilities.map((fac, idx) => (
                <div key={idx} className={styles.facilityCard}>
                  <span className={styles.facilityIconWrap}>
                    <FacilityIcon name={fac.icon || fac.name} size={18} />
                  </span>
                  <span className={styles.facilityName}>{fac.name}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ROOM GALLERY */}
        <RoomGallery
          room={room}
          allMedia={allMedia}
          hasPano360={hasPano360}
          onOpenPortal={() => {
            if (hasPano360) {
              setIs360Open(true);
            } else if (allMedia.length > 0) {
              setLightboxIndex(0);
            }
          }}
          onOpenLightbox={(idx) => setLightboxIndex(idx)}
        />

        {/* ABOUT CARD */}
        <section className={styles.aboutSection}>
          <SectionBackdrop align="right" />
          <div className={styles.aboutCardContainer}>
            <div className={styles.aboutLeftCol}>
              <h2 className={styles.sectionHeading}>About {room.name}</h2>
              {room.description && (
                <p className={styles.aboutDescription}>{room.description}</p>
              )}

              {/* Facts Grid: Separate boxes, TWO per row */}
              {infoBoxes.length > 0 && (
                <div className={styles.factsGrid}>
                  {infoBoxes.map((box, index) => {
                    const isLastOdd = index === infoBoxes.length - 1 && infoBoxes.length % 2 === 1;
                    return (
                      <div
                        key={box.id}
                        className={`${styles.factBox} ${isLastOdd ? styles.oddHalfWidth : ''}`.trim()}
                      >
                        <div className={styles.factIconWrap}>
                          {box.icon === 'bed' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8v4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {box.icon === 'users' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" strokeLinecap="round" strokeLinejoin="round" />
                              <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
                              <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          {box.icon === 'key' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <circle cx="7.5" cy="15.5" r="5.5" />
                              <path d="m21 2-9.6 9.6M15.5 7.5l3 3M18.5 4.5l3 3" />
                            </svg>
                          )}
                          {box.icon === 'type' && (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                              <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
                            </svg>
                          )}
                        </div>
                        <div className={styles.factContent}>
                          <span className={styles.factLabel}>{box.label}</span>
                          <span className={styles.factValue}>{box.value}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Action Buttons: WhatsApp + Call Us in ONE equal-width row */}
              <div className={styles.actionButtonsRow}>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.actionBtnWhatsApp}
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.62C8.75 21.41 10.38 21.83 12.04 21.83C17.5 21.83 21.95 17.38 21.95 11.92C21.95 9.27 20.92 6.78 19.05 4.91C17.18 3.03 14.69 2 12.04 2ZM12.05 3.67C14.25 3.67 16.31 4.53 17.87 6.09C19.42 7.65 20.28 9.72 20.28 11.92C20.28 16.46 16.58 20.16 12.04 20.16C10.67 20.16 9.32 19.8 8.14 19.11L7.86 18.94L4.74 19.76L5.57 16.71L5.38 16.41C4.62 15.19 4.22 13.57 4.22 11.91C4.22 7.38 7.92 3.67 12.05 3.67Z" />
                  </svg>
                  <span>WhatsApp</span>
                </a>

                <a href={callUrl} className={styles.actionBtnCall}>
                  <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                    <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
                  </svg>
                  <span>Call Us</span>
                </a>
              </div>
            </div>

            {/* Right Column: Tall rounded photo filling height */}
            <div className={styles.aboutRightCol}>
              <div
                className={styles.aboutTallPhotoWrap}
                onClick={() => {
                  if (allMedia.length > 0) {
                    const idx = allMedia.length > 1 ? 1 : 0;
                    setLightboxIndex(idx);
                  }
                }}
                style={{ cursor: allMedia.length > 0 ? 'pointer' : 'default' }}
                role="button"
                tabIndex={0}
                aria-label={`View photo of ${room.name}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (allMedia.length > 0) setLightboxIndex(allMedia.length > 1 ? 1 : 0);
                  }
                }}
              >
                {room.photos?.[1]?.src || room.photos?.[0]?.src || room.mainImage ? (
                  <Image
                    src={room.photos?.[1]?.src || room.photos?.[0]?.src || room.mainImage}
                    alt={`${room.name} ambiance`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 42vw"
                    className={styles.aboutTallPhoto}
                  />
                ) : (
                  <div className={styles.aboutPlaceholderWrap}>
                    <img src="/brand/moonlight-mark.png" alt="Moon Light Resort" className={styles.aboutPlaceholderLogo} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* OTHER ROOMS */}
        {otherRooms.length > 0 && (
          <section className={styles.otherRoomsSection}>
            <SectionBackdrop align="left" />
            <h2 className={styles.sectionHeading}>Other Rooms</h2>
            <div className={styles.otherRoomsGrid}>
              {otherRooms.slice(0, 4).map((r) => (
                <div key={r.id} className={styles.otherRoomTileWrapper}>
                  <RoomTile room={r} />
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 360 Viewer Modal */}
      {is360Open && hasPano360 && (
        <Pano360Viewer
          src={typeof room.pano360 === 'string' ? room.pano360 : (room.pano360?.src || '')}
          roomName={room.name}
          onClose={() => setIs360Open(false)}
        />
      )}

      {/* Media Lightbox */}
      {lightboxIndex !== null && allMedia.length > 0 && (
        <MediaLightbox
          media={allMedia}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </div>
  );
}
