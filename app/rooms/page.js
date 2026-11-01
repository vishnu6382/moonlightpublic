import React from 'react';
import SectionHeader from '@/components/SectionHeader';
import FadeUp from '@/components/FadeUp';
import MoonPortal from '@/components/MoonPortal';
import RoomTile from '@/components/RoomTile';
import SectionBackdrop from '@/components/SectionBackdrop';
import Button from '@/components/Button';
import { siteConfig } from '@/content/site';
import JsonLd from '@/components/JsonLd';
import { getBreadcrumbJsonLd } from '@/lib/structuredData';
import { getPublicRooms } from '@/lib/rooms';
import styles from './rooms.module.css';

export const revalidate = 60;

export const metadata = {
  title: 'Rooms & Accommodations | Moon Light Resort',
  description:
    'Explore villa rooms and dormitories at Moon Light Resort in Nedungulam, Salem, Tamil Nadu. Designed for comfortable family getaways and group retreats.',
  alternates: {
    canonical: '/rooms',
  },
  openGraph: {
    title: 'Rooms & Accommodations | Moon Light Resort',
    description:
      'Explore villa rooms and dormitories at Moon Light Resort in Nedungulam, Salem, Tamil Nadu. Designed for comfortable family getaways and group retreats.',
    url: '/rooms',
    siteName: 'Moon Light Resort',
    images: [
      {
        url: '/og-default.jpg',
        width: 1200,
        height: 630,
        alt: 'Rooms at Moon Light Resort',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rooms & Accommodations | Moon Light Resort',
    description:
      'Explore villa rooms and dormitories at Moon Light Resort in Nedungulam, Salem, Tamil Nadu.',
    images: ['/og-default.jpg'],
  },
};

/**
 * Rebalance helper:
 * Automatically calculates column spans for remaining rooms so that:
 * 1. Every row has exactly 3 column units (sum of spans = 3).
 * 2. No leftover tile ever sits alone in a row.
 */
function getDenseLayoutSpans(remainingCount) {
  const spans = [];
  let remaining = remainingCount;

  while (remaining > 0) {
    if (remaining === 1) {
      // Single leftover item spans all 3 columns
      spans.push(styles.spanFull);
      remaining -= 1;
    } else if (remaining === 2) {
      // 2 items fill row with 1 wide (2 cols) + 1 single (1 col)
      spans.push(styles.spanWide);
      spans.push(styles.spanSingle);
      remaining -= 2;
    } else if (remaining === 4) {
      // Rebalance 4 items across 2 full rows (2 + 2 with wide + single each)
      spans.push(styles.spanWide);
      spans.push(styles.spanSingle);
      spans.push(styles.spanSingle);
      spans.push(styles.spanWide);
      remaining -= 4;
    } else {
      // 3 or more: standard 3 single tiles (1 + 1 + 1 = 3)
      spans.push(styles.spanSingle);
      spans.push(styles.spanSingle);
      spans.push(styles.spanSingle);
      remaining -= 3;
    }
  }

  return spans;
}

export default async function RoomsPage() {
  const rooms = await getPublicRooms();
  const total = rooms.length;

  if (total === 0) {
    return (
      <div className={styles.roomsPageSection}>
        <JsonLd
          data={getBreadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Rooms', url: '/rooms' },
          ])}
        />
        <SectionBackdrop align="right" />
        <FadeUp>
          <div className={styles.introHeader} style={{ textAlign: 'center', maxWidth: '640px', margin: '40px auto' }}>
            <h1 className={styles.pageTitle}>Our Rooms</h1>
            <p className={styles.pageSubtitle} style={{ marginTop: '12px', fontSize: '18px', color: 'var(--muted)' }}>
              Rooms are being updated.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginTop: '28px', flexWrap: 'wrap' }}>
              <Button
                href={`https://wa.me/${(siteConfig.whatsapp || siteConfig.phoneRaw || '919894486300').replace(/[^0-9]/g, '')}?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20rooms%20at%20Moon%20Light%20Resort`}
                variant="solid"
                size="lg"
                target="_blank"
                rel="noopener noreferrer"
              >
                WhatsApp Us
              </Button>
              <Button href={`tel:${siteConfig.phoneRaw || '+919894486300'}`} variant="outline" size="lg">
                Call Us
              </Button>
            </div>
          </div>
        </FadeUp>
      </div>
    );
  }

  let leftSideRooms = [];
  let rightSideRooms = [];
  let heroRoom = null;
  let connectors = [];
  let remainingRooms = [];

  if (total <= 3) {
    // 1 to 3 rooms: Center block only (Hero on top, 0-2 connectors below)
    heroRoom = rooms[0] || null;
    connectors = rooms.slice(1);
    remainingRooms = [];
  } else if (total === 4) {
    // 4 rooms: Symmetrical center block: 1 Hero on top + 3 connectors below
    heroRoom = rooms[0];
    connectors = rooms.slice(1, 4);
    remainingRooms = [];
  } else if (total === 5) {
    // 5 rooms: Symmetrical 3-column portal: 1 Left + (Hero + 2 Connectors) + 1 Right
    leftSideRooms = [rooms[3]];
    heroRoom = rooms[0];
    connectors = [rooms[1], rooms[2]];
    rightSideRooms = [rooms[4]];
    remainingRooms = [];
  } else if (total === 6) {
    // 6 rooms: 2 Left + (Hero + 2 Connectors) + 1 Right
    leftSideRooms = [rooms[3], rooms[5]];
    heroRoom = rooms[0];
    connectors = [rooms[1], rooms[2]];
    rightSideRooms = [rooms[4]];
    remainingRooms = [];
  } else if (total === 7) {
    // 7 rooms: 4 in portal (Hero + 3 Connectors), exactly 3 remain to fill 1 row cleanly
    heroRoom = rooms[0];
    connectors = rooms.slice(1, 4);
    remainingRooms = rooms.slice(4);
  } else {
    // 8+ rooms: 5 in portal (1 left + 3 center + 1 right), remaining in denseGrid
    leftSideRooms = [rooms[3]];
    heroRoom = rooms[0];
    connectors = [rooms[1], rooms[2]];
    rightSideRooms = [rooms[4]];
    remainingRooms = rooms.slice(5);
  }

  const hasLeftSide = leftSideRooms.length > 0;
  const hasRightSide = rightSideRooms.length > 0;

  let gridColumnsClass = styles.gridCenterOnly;
  if (hasLeftSide && hasRightSide) {
    gridColumnsClass = styles.gridBothSides;
  } else if (hasLeftSide) {
    gridColumnsClass = styles.gridLeftSide;
  } else if (hasRightSide) {
    gridColumnsClass = styles.gridRightSide;
  }

  let connectorsClass = '';
  if (connectors.length === 1) {
    connectorsClass = styles.connectors1;
  } else if (connectors.length === 3) {
    connectorsClass = styles.connectors3;
  }

  const denseSpans = getDenseLayoutSpans(remainingRooms.length);

  return (
    <div className={styles.roomsPageSection}>
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: 'Home', url: '/' },
          { name: 'Rooms', url: '/rooms' },
        ])}
      />
      <SectionBackdrop align="right" />

      <FadeUp>
        <div className={styles.introHeader}>
          <h1 className={styles.pageTitle}>Our Rooms</h1>
          <p className={styles.pageSubtitle}>
            Comfortable villa rooms and spacious dorms at Moon Light Resort, Nedungulam.
          </p>
        </div>
      </FadeUp>

      {/* Featured Portal Bento Grid */}
      <FadeUp delay={100}>
        <div className={styles.portalPanel}>
          <div className={`${styles.featuredPortalGrid} ${gridColumnsClass}`.trim()}>
            {/* Left Column */}
            {hasLeftSide && (
              <div className={styles.sideColumn}>
                {leftSideRooms.map((room) => (
                  <div key={room.id} className={styles.sideTile}>
                    <RoomTile room={room} />
                  </div>
                ))}
              </div>
            )}

            {/* Center Portal Block */}
            <div className={styles.centerBlock}>
              {/* Center Hero Tile */}
              {heroRoom && (
                <div className={styles.heroTileWrapper}>
                  <RoomTile room={heroRoom} />
                </div>
              )}

              {/* Rotating Moon Portal (Resort Emblem) */}
              <div className={styles.portalAnchor}>
                <MoonPortal
                  is360={false}
                  title="Moon Light Resort"
                />
              </div>

              {/* Connectors Row Below Portal */}
              {connectors.length > 0 && (
                <div className={`${styles.connectorsRow} ${connectorsClass}`.trim()}>
                  {connectors.map((room) => (
                    <div key={room.id} className={styles.connectorTile}>
                      <RoomTile room={room} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column */}
            {hasRightSide && (
              <div className={styles.sideColumn}>
                {rightSideRooms.map((room) => (
                  <div key={room.id} className={styles.sideTile}>
                    <RoomTile room={room} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </FadeUp>

      {/* Dense Bento Grid for Remaining Rooms (every row full, no lonely tile) */}
      {remainingRooms.length > 0 && (
        <FadeUp delay={160}>
          <div className={styles.denseGrid}>
            {remainingRooms.map((room, idx) => (
              <div
                key={room.id}
                className={`${styles.denseTileWrapper} ${denseSpans[idx] || styles.spanSingle}`}
              >
                <RoomTile room={room} />
              </div>
            ))}
          </div>
        </FadeUp>
      )}
    </div>
  );
}
