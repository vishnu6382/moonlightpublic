'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { calculateHaversineDistance } from '@/lib/nearbyConstants';
import { getCategoryIconSvgString } from './CategoryIcons';
import PlaceDetailCard from './PlaceDetailCard';
import styles from './RegionExplorer.module.css';

export default function LeafletMap({
  resort,
  places = [],
  activeDistrict = 'all',
  selectedPlace = null,
  districtsGeoJSON = null,
  replayKey = 0,
  onSelectPlace,
  onClearSelection,
  onReplayRoute
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const geojsonLayerRef = useRef(null);
  const resortMarkerRef = useRef(null);
  const routePolylineRef = useRef(null);
  const travellingMarkerRef = useRef(null);
  const routeAnimFrameRef = useRef(null);
  const isMapVisibleRef = useRef(true);

  const [mapReady, setMapReady] = useState(false);
  const [isAnimationFinished, setIsAnimationFinished] = useState(false);
  const [currentDisplayKm, setCurrentDisplayKm] = useState(0);
  const [bouncingPlaceId, setBouncingPlaceId] = useState(null);
  const [isMapOffscreen, setIsMapOffscreen] = useState(false);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = resort ? [resort.lat, resort.lng] : [11.58, 77.85];

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 10,
      zoomControl: false,
      scrollWheelZoom: false,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    map.on('click', (e) => {
      if (
        e.originalEvent.target.classList.contains('leaflet-container') ||
        e.originalEvent.target.tagName === 'path'
      ) {
        onClearSelection?.();
      }
    });

    map.on('focus', () => {
      map.scrollWheelZoom.enable();
    });

    mapInstanceRef.current = map;
    markersLayerRef.current = L.layerGroup().addTo(map);
    setMapReady(true);

    return () => {
      if (routeAnimFrameRef.current) {
        cancelAnimationFrame(routeAnimFrameRef.current);
      }
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // IntersectionObserver to pause animation & pulses when map is offscreen
  useEffect(() => {
    if (!mapContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isMapVisibleRef.current = entry.isIntersecting;
          setIsMapOffscreen(!entry.isIntersecting);
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(mapContainerRef.current);

    return () => observer.disconnect();
  }, []);

  // Recenter helper to fit bounds to active district places + resort
  const handleRecenter = useCallback(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points = [];
    if (resort) {
      points.push([resort.lat, resort.lng]);
    }
    places.forEach((p) => {
      points.push([p.lat, p.lng]);
    });

    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, {
        padding: [35, 35],
        maxZoom: 12,
        animate: true
      });
    }
  }, [places, resort]);

  // Update District GeoJSON Polygons (Salem green, Erode orange, Namakkal purple)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !districtsGeoJSON) return;

    if (geojsonLayerRef.current) {
      geojsonLayerRef.current.remove();
    }

    const geoLayer = L.geoJSON(districtsGeoJSON, {
      style: (feature) => {
        const slug = feature.properties.slug;
        const color = feature.properties.color || '#2E9E6B';
        const isCurrent = activeDistrict === 'all' || activeDistrict === slug;

        return {
          color: color,
          weight: isCurrent ? 2.5 : 1,
          opacity: isCurrent ? 0.9 : 0.3,
          fillColor: color,
          fillOpacity: isCurrent ? 0.08 : 0.02,
          lineJoin: 'round'
        };
      }
    }).addTo(map);

    geojsonLayerRef.current = geoLayer;
  }, [mapReady, districtsGeoJSON, activeDistrict]);

  // Update Resort Marker (with pulse ring)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !resort) return;

    if (resortMarkerRef.current) {
      resortMarkerRef.current.remove();
    }

    const resortHtml = `
      <div class="${styles.resortMarkerContainer}">
        <div class="${styles.resortPulseRing}"></div>
        <div class="${styles.resortMarkerPin}">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="#2E2822">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.51 5.07-1.39-4.39-.77-7.75-4.57-7.75-9.15 0-4.58 3.36-8.38 7.75-9.15C15.58 2.51 13.85 2 12 2z"/>
          </svg>
        </div>
        <div class="${styles.resortMarkerLabel}">Moon Light Resort</div>
      </div>
    `;

    const resortIcon = L.divIcon({
      html: resortHtml,
      className: styles.resortDivIcon,
      iconSize: [44, 44],
      iconAnchor: [22, 22]
    });

    const marker = L.marker([resort.lat, resort.lng], {
      icon: resortIcon,
      zIndexOffset: 1000
    }).addTo(map);

    resortMarkerRef.current = marker;
  }, [mapReady, resort]);

  // Update Place Markers (supporting optional landmarkImage & bounce on arrival)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layer = markersLayerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();

    places.forEach((place) => {
      const isSelected = selectedPlace?.id === place.id;
      const isBouncing = bouncingPlaceId === place.id;
      const catColor = place.categoryColor?.color || '#2F80ED';
      const catTextColor = place.categoryColor?.textColor || '#FFFFFF';
      const iconSvg = getCategoryIconSvgString(place.category, catTextColor, 16);
      const hasLandmark = Boolean(place.landmarkImage);

      const markerContent = hasLandmark
        ? `<div class="${styles.landmarkMarkerBubble}">
             <img src="${place.landmarkImage}" alt="${place.name}" class="${styles.landmarkMarkerImg}" />
           </div>`
        : `<div class="${styles.markerBubble}" style="background-color: ${catColor}; color: ${catTextColor}">
             ${iconSvg}
           </div>`;

      const markerHtml = `
        <div class="${styles.markerTouchTarget} ${isSelected ? styles.markerSelected : ''} ${
        isBouncing ? styles.markerBounce : ''
      }">
          ${isSelected ? `<div class="${styles.markerHalo}" style="border-color: ${catColor}"></div>` : ''}
          ${markerContent}
          ${
            isSelected
              ? `<div class="${styles.markerSelectedBadge}">
                  <span class="${styles.badgeName}">${place.name}</span>
                  <span class="${styles.badgeDist}">${place.displayDistance}</span>
                </div>`
              : ''
          }
        </div>
      `;

      const icon = L.divIcon({
        html: markerHtml,
        className: styles.placeDivIcon,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });

      const marker = L.marker([place.lat, place.lng], {
        icon,
        zIndexOffset: isSelected ? 500 : 100
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectPlace?.(place);
      });

      layer.addLayer(marker);
    });
  }, [mapReady, places, selectedPlace, bouncingPlaceId, onSelectPlace]);

  // Fit bounds when activeDistrict changes (if no place selected)
  useEffect(() => {
    if (!mapReady || selectedPlace) return;
    handleRecenter();
  }, [activeDistrict, mapReady, handleRecenter, selectedPlace]);

  // Progressive Road Route Animation & Travelling Moon
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapReady) return;

    // Clean up any ongoing animation frame
    if (routeAnimFrameRef.current) {
      cancelAnimationFrame(routeAnimFrameRef.current);
      routeAnimFrameRef.current = null;
    }

    // Clean up existing route layers
    if (routePolylineRef.current) {
      routePolylineRef.current.remove();
      routePolylineRef.current = null;
    }
    if (travellingMarkerRef.current) {
      travellingMarkerRef.current.remove();
      travellingMarkerRef.current = null;
    }

    if (!selectedPlace || !resort) {
      setIsAnimationFinished(false);
      setCurrentDisplayKm(0);
      return;
    }

    // 1. Determine Route Coordinates [lat, lng]
    let routePoints = [];
    if (
      selectedPlace.routeGeometry &&
      Array.isArray(selectedPlace.routeGeometry.coordinates) &&
      selectedPlace.routeGeometry.coordinates.length > 1
    ) {
      // OSRM coordinates are [lng, lat] -> convert to Leaflet [lat, lng]
      routePoints = selectedPlace.routeGeometry.coordinates.map((pt) => [pt[1], pt[0]]);
      // Ensure exact connection from resort to destination
      routePoints[0] = [resort.lat, resort.lng];
      routePoints[routePoints.length - 1] = [selectedPlace.lat, selectedPlace.lng];
    } else {
      // Fallback straight/gentle interpolated line
      const steps = 15;
      for (let i = 0; i <= steps; i++) {
        const frac = i / steps;
        routePoints.push([
          resort.lat + (selectedPlace.lat - resort.lat) * frac,
          resort.lng + (selectedPlace.lng - resort.lng) * frac
        ]);
      }
    }

    // 2. Fit map bounds so resort and place are both visible
    const bounds = L.latLngBounds([
      [resort.lat, resort.lng],
      [selectedPlace.lat, selectedPlace.lng]
    ]);
    map.fitBounds(bounds, {
      padding: [60, 60],
      maxZoom: 12,
      animate: true
    });

    const catColor = selectedPlace.categoryColor?.color || '#2F80ED';
    const totalKm = selectedPlace.distanceKm || selectedPlace.approxStraightKm || 1;

    // 3. Compute Cumulative Segment Distances
    const cumDists = [0];
    let totalDistance = 0;
    for (let i = 0; i < routePoints.length - 1; i++) {
      const p1 = routePoints[i];
      const p2 = routePoints[i + 1];
      const d = calculateHaversineDistance(p1[0], p1[1], p2[0], p2[1]) || 0.05;
      totalDistance += d;
      cumDists.push(totalDistance);
    }

    // Check for reduced motion preference
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      // Instant reveal
      routePolylineRef.current = L.polyline(routePoints, {
        color: catColor,
        weight: 4.5,
        dashArray: '8, 8',
        lineCap: 'round',
        lineJoin: 'round',
        opacity: 0.95
      }).addTo(map);

      setCurrentDisplayKm(totalKm);
      setIsAnimationFinished(true);
      return;
    }

    // 4. Create Polyline & Travelling Crescent-Moon Marker
    routePolylineRef.current = L.polyline([routePoints[0]], {
      color: catColor,
      weight: 4.5,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round',
      opacity: 0.95
    }).addTo(map);

    const moonHtml = `
      <div class="${styles.travellingMoonIcon}">
        <div class="${styles.travellingMoonGlow}"></div>
        <div class="${styles.travellingMoonDisc}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.51 5.07-1.39-4.39-.77-7.75-4.57-7.75-9.15 0-4.58 3.36-8.38 7.75-9.15C15.58 2.51 13.85 2 12 2z"/>
          </svg>
        </div>
      </div>
    `;

    const moonIcon = L.divIcon({
      html: moonHtml,
      className: styles.moonDivIcon,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    travellingMarkerRef.current = L.marker(routePoints[0], {
      icon: moonIcon,
      zIndexOffset: 1200
    }).addTo(map);

    // 5. Progressive Animation Loop (~2.5 seconds ease-out)
    const duration = 2500; // ms
    const startTime = performance.now();
    setIsAnimationFinished(false);
    setCurrentDisplayKm(0);

    const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

    const step = (currentTime) => {
      // If map is offscreen, pause loop
      if (!isMapVisibleRef.current) {
        routeAnimFrameRef.current = requestAnimationFrame(step);
        return;
      }

      const elapsed = currentTime - startTime;
      const rawProgress = Math.min(1, elapsed / duration);
      const p = easeOutCubic(rawProgress);

      const targetD = p * totalDistance;

      // Find active segment index
      let segIdx = 0;
      while (segIdx < cumDists.length - 1 && cumDists[segIdx + 1] <= targetD) {
        segIdx++;
      }

      let tip = routePoints[segIdx];
      if (segIdx < routePoints.length - 1) {
        const segStartD = cumDists[segIdx];
        const segLen = cumDists[segIdx + 1] - segStartD;
        const segFrac = segLen > 0 ? (targetD - segStartD) / segLen : 0;
        const pA = routePoints[segIdx];
        const pB = routePoints[segIdx + 1];
        tip = [
          pA[0] + (pB[0] - pA[0]) * segFrac,
          pA[1] + (pB[1] - pA[1]) * segFrac
        ];
      }

      const visiblePoints = [...routePoints.slice(0, segIdx + 1), tip];
      routePolylineRef.current?.setLatLngs(visiblePoints);
      travellingMarkerRef.current?.setLatLng(tip);

      // Distance counter calculation
      const progressKm = Number((totalKm * p).toFixed(1));
      setCurrentDisplayKm(progressKm);

      if (rawProgress < 1) {
        routeAnimFrameRef.current = requestAnimationFrame(step);
      } else {
        // Finalize route and trigger destination marker bounce
        routePolylineRef.current?.setLatLngs(routePoints);
        travellingMarkerRef.current?.setLatLng(routePoints[routePoints.length - 1]);
        setCurrentDisplayKm(totalKm);
        setIsAnimationFinished(true);

        // Destination bounce
        setBouncingPlaceId(selectedPlace.id);
        setTimeout(() => setBouncingPlaceId(null), 1200);
      }
    };

    routeAnimFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (routeAnimFrameRef.current) {
        cancelAnimationFrame(routeAnimFrameRef.current);
      }
    };
  }, [selectedPlace, resort, replayKey, mapReady]);

  return (
    <div
      className={`${styles.leafletMapWrapper} ${isMapOffscreen ? styles.mapOffscreen : ''}`}
    >
      {/* Recenter Button */}
      <button
        type="button"
        className={styles.recenterBtn}
        onClick={handleRecenter}
        title="Recenter Map View"
        aria-label="Recenter map to all places"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
          <path d="M3 3v5h5" />
        </svg>
        <span>Recenter</span>
      </button>

      {/* Desktop In-Map Overlay Detail Card (Bottom-Left, 340px) */}
      {selectedPlace && (
        <div className={styles.desktopMapOverlay}>
          <PlaceDetailCard
            place={selectedPlace}
            onClearSelection={onClearSelection}
            onReplayRoute={onReplayRoute}
          />
        </div>
      )}

      {/* Touch Interaction Hint for Mobile */}
      <div className={styles.mapTouchHint}>
        Tap marker to inspect route & details
      </div>

      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className={styles.leafletMapCanvas} />
    </div>
  );
}
