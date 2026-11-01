'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ExplorerList from './ExplorerList';
import PhoneCarousel from './PhoneCarousel';
import PlaceCard from './PlaceCard';
import BottomSheet from './BottomSheet';
import StayBand from './StayBand';
import StickyPhoneBar from './StickyPhoneBar';
import styles from './RegionExplorer.module.css';

// Dynamically import LeafletMap with SSR disabled (Leaflet requires window/DOM)
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className={styles.mapLoadingPlaceholder}>
      <div className={styles.mapLoadingSpinner} />
      <span>Loading interactive map...</span>
    </div>
  )
});

export default function RegionExplorer({ initialData }) {
  const { resort, districts = [], places = [], districtsGeoJSON } = initialData;

  const [selectedPlaceId, setSelectedPlaceId] = useState(null);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [replayKey, setReplayKey] = useState(0);

  const explorerRef = useRef(null);

  // Selected place object
  const selectedPlace = useMemo(() => {
    return places.find((p) => p.id === selectedPlaceId) || null;
  }, [places, selectedPlaceId]);

  // Support URL Hash #<place-slug> on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const hash = window.location.hash.replace('#', '').trim();
    if (hash) {
      const match = places.find((p) => p.slug === hash);
      if (match) {
        setSelectedPlaceId(match.id);
        if (window.innerWidth < 1024) {
          setIsBottomSheetOpen(true);
        }
      }
    }
  }, [places]);

  const handleSelectPlace = (place) => {
    if (!place) return;
    setSelectedPlaceId(place.id);
  };

  const handleCardSelectAndScroll = (place) => {
    if (!place) return;
    setSelectedPlaceId(place.id);

    // Scroll smoothly to explorer stage
    if (explorerRef.current) {
      explorerRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setIsBottomSheetOpen(true);
    }
  };

  const handleOpenDetails = (place) => {
    setSelectedPlaceId(place.id);
    setIsBottomSheetOpen(true);
  };

  const handleClearSelection = () => {
    setSelectedPlaceId(null);
    setIsBottomSheetOpen(false);
  };

  const handleReplayRoute = () => {
    setReplayKey((k) => k + 1);
  };

  // Group all places by district for the "All places" section below the explorer
  const districtGroups = useMemo(() => {
    return districts.map((d) => {
      const dPlaces = places.filter((p) => p.district === d.slug);
      return {
        district: d,
        places: dPlaces
      };
    }).filter((g) => g.places.length > 0);
  }, [districts, places]);

  return (
    <div className={styles.regionExplorerWrapper}>
      {/* 1. Header Area: 12-16px under nav, bold Poppins title, one neutral line */}
      <header className={styles.pageHeader}>
        <h1 className={styles.pageMainTitle}>Nearby Areas</h1>
        <p className={styles.pageSubtitle}>
          Places to visit around Moon Light Resort in Salem, Erode and Namakkal.
        </p>
      </header>

      {/* 2. Explorer Section: Desktop List (Left 36%) + Sticky Map (Right 64%), Phone Map + Snap Carousel */}
      <section className={styles.explorerSection} ref={explorerRef} aria-label="Regional Map Explorer">
        <div className={styles.explorerContainer}>
          {/* Desktop Left Column: Scrollable Places List */}
          <div className={styles.desktopListColumn}>
            <ExplorerList
              places={places}
              districts={districts}
              selectedPlace={selectedPlace}
              onSelectPlace={handleSelectPlace}
            />
          </div>

          {/* Map Column (Desktop Right 64%, Phone Full Width) */}
          <div className={styles.mapColumn}>
            <LeafletMap
              resort={resort}
              places={places}
              selectedPlace={selectedPlace}
              districtsGeoJSON={districtsGeoJSON}
              replayKey={replayKey}
              onSelectPlace={handleSelectPlace}
              onClearSelection={handleClearSelection}
              onReplayRoute={handleReplayRoute}
            />
          </div>
        </div>

        {/* Phone Snap Carousel under the map */}
        <PhoneCarousel
          places={places}
          selectedPlace={selectedPlace}
          onSelectPlace={handleSelectPlace}
          onOpenDetails={handleOpenDetails}
        />
      </section>

      {/* 3. Mobile Bottom Sheet Drawer for selected place */}
      <BottomSheet
        isOpen={isBottomSheetOpen}
        place={selectedPlace}
        onClose={() => setIsBottomSheetOpen(false)}
        onReplayRoute={handleReplayRoute}
      />

      {/* 4. "All Places" Premium Cards Section Grouped by District */}
      {places.length > 0 && (
        <section className={styles.allPlacesSection} aria-label="All places directory">
          <div className={styles.allPlacesHeader}>
            <h2 className={styles.allPlacesTitle}>All Places</h2>
            <span className={styles.allPlacesTotalCount}>
              {places.length} places across 3 districts
            </span>
          </div>

          {districtGroups.map(({ district, places: dPlaces }) => {
            const districtColor = district.colorInfo?.color || '#2E9E6B';

            return (
              <div key={district.slug} className={styles.districtCardsBlock}>
                <div className={styles.districtBlockHeader}>
                  <h3 className={styles.districtBlockTitle} style={{ color: districtColor }}>
                    {district.name}
                  </h3>
                  <span className={styles.districtBlockPill}>
                    {dPlaces.length} {dPlaces.length === 1 ? 'place' : 'places'}
                  </span>
                </div>

                {/* 3 cards per row desktop, 2 per row phone */}
                <div className={styles.premiumCardsGrid}>
                  {dPlaces.map((place, idx) => (
                    <PlaceCard
                      key={place.id}
                      place={place}
                      index={idx}
                      onSelect={handleCardSelectAndScroll}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* 5. Stay Band: "Stay near all of this" panel */}
      <StayBand />

      {/* 6. Slim Sticky Bottom Bar on phones (52px high, auto-hiding near Contact) */}
      <StickyPhoneBar />

      {/* 7. Open Data Attribution Credit Line */}
      <footer className={styles.pageFooterCredits}>
        <p>
          Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors.
          {' '}Driving distances calculated via OSRM.
        </p>
      </footer>
    </div>
  );
}
