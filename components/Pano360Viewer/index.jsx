'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import styles from './Pano360Viewer.module.css';

const DEFAULT_PANO = 'https://res.cloudinary.com/dqaroqfr/image/upload/w_2048,c_limit,q_auto:good,f_auto/v1793208541/moonlight_resort/xczyno5zqvn9fqwzmlur.webp';

/**
 * Optimizes Cloudinary equirectangular panorama URLs:
 * 1. Enforces max 2048px width for instant mobile & desktop GPU decoding.
 * 2. Uses q_auto:good and f_auto to minimize network latency while preserving 2:1 ratio.
 */
function getWebGLSafePanoUrl(url) {
  if (!url || typeof url !== 'string') return DEFAULT_PANO;
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;
  if (cleanUrl.includes('cloudinary.com') && cleanUrl.includes('/upload/')) {
    if (!cleanUrl.includes('w_2048') && !cleanUrl.includes('w_2560')) {
      return cleanUrl.replace('/upload/', '/upload/w_2048,c_limit,q_auto:good,f_auto/');
    }
  }
  return cleanUrl;
}

export default function Pano360Viewer({
  src,
  roomName = 'Moon Light Resort Room',
  onClose,
}) {
  const containerRef = useRef(null);
  const panelRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showHint, setShowHint] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(() => getWebGLSafePanoUrl(src));

  // Auto-hide hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll and Esc key listener
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!panelRef.current) return;
    if (!document.fullscreenElement) {
      panelRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Initialize Three.js sphere projection immediately
  useEffect(() => {
    let activeSrc = currentSrc;
    if (!activeSrc) activeSrc = DEFAULT_PANO;

    let destroyed = false;
    let animId = null;
    let renderer = null;
    let scene = null;
    let camera = null;
    let geometry = null;
    let material = null;
    let texture = null;

    let lon = 0;
    let lat = 0;
    let phi = 0;
    let theta = 0;
    let isUserInteracting = false;
    let onPointerDownPointerX = 0;
    let onPointerDownPointerY = 0;
    let onPointerDownLon = 0;
    let onPointerDownLat = 0;

    setLoading(true);
    setError('');

    if (!containerRef.current) return;

    try {
      const container = containerRef.current;
      const width = container.clientWidth || window.innerWidth || 800;
      const height = container.clientHeight || window.innerHeight || 600;

      camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
      camera.target = new THREE.Vector3(0, 0, 0);

      scene = new THREE.Scene();

      geometry = new THREE.SphereGeometry(500, 60, 40);
      geometry.scale(-1, 1, 1); // Invert sphere to look from inside

      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setSize(width, height);
      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');

      const loadSuccess = (loadedTexture) => {
        if (destroyed) return;
        texture = loadedTexture;
        material = new THREE.MeshBasicMaterial({ map: texture });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        setLoading(false);
      };

      const loadFail = () => {
        if (destroyed) return;
        if (activeSrc !== DEFAULT_PANO) {
          console.warn('[Pano360Viewer] Primary panorama failed, loading resort default fallback.');
          loader.load(
            DEFAULT_PANO,
            loadSuccess,
            undefined,
            () => {
              if (!destroyed) {
                setError('Failed to load 360 panorama file.');
                setLoading(false);
              }
            }
          );
        } else {
          setError('Failed to load 360 panorama file.');
          setLoading(false);
        }
      };

      // Load texture immediately with zero waterfall delay
      loader.load(activeSrc, loadSuccess, undefined, loadFail);

      // Interaction handlers
      const onPointerDown = (event) => {
        isUserInteracting = true;
        try {
          container.setPointerCapture?.(event.pointerId);
        } catch (_) {}
        onPointerDownPointerX = event.clientX;
        onPointerDownPointerY = event.clientY;
        onPointerDownLon = lon;
        onPointerDownLat = lat;
      };

      const onPointerMove = (event) => {
        if (!isUserInteracting) return;
        lon = (onPointerDownPointerX - event.clientX) * 0.15 + onPointerDownLon;
        lat = (event.clientY - onPointerDownPointerY) * 0.15 + onPointerDownLat;
      };

      const onPointerUp = (event) => {
        isUserInteracting = false;
        try {
          container.releasePointerCapture?.(event.pointerId);
        } catch (_) {}
      };

      const onWheel = (event) => {
        event.preventDefault();
        const fov = camera.fov + event.deltaY * 0.05;
        camera.fov = Math.max(30, Math.min(95, fov));
        camera.updateProjectionMatrix();
      };

      const onResize = () => {
        if (!containerRef.current || !camera || !renderer) return;
        const w = containerRef.current.clientWidth || window.innerWidth;
        const h = containerRef.current.clientHeight || window.innerHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      container.addEventListener('pointerdown', onPointerDown);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      container.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('resize', onResize);

      // Animation loop
      const animate = () => {
        if (destroyed) return;
        animId = requestAnimationFrame(animate);

        // Slow ambient rotation when idle
        if (!isUserInteracting) {
          lon += 0.04;
        }

        lat = Math.max(-85, Math.min(85, lat));
        phi = THREE.MathUtils.degToRad(90 - lat);
        theta = THREE.MathUtils.degToRad(lon);

        const targetX = 500 * Math.sin(phi) * Math.cos(theta);
        const targetY = 500 * Math.cos(phi);
        const targetZ = 500 * Math.sin(phi) * Math.sin(theta);

        camera.lookAt(targetX, targetY, targetZ);
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        destroyed = true;
        if (animId) cancelAnimationFrame(animId);
        container.removeEventListener('pointerdown', onPointerDown);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerUp);
        container.removeEventListener('wheel', onWheel);
        window.removeEventListener('resize', onResize);
        if (renderer && renderer.domElement && containerRef.current) {
          try {
            containerRef.current.removeChild(renderer.domElement);
          } catch (_) {}
        }
        if (geometry) geometry.dispose();
        if (material) material.dispose();
        if (texture) texture.dispose();
        if (renderer) renderer.dispose();
      };
    } catch (err) {
      if (!destroyed) {
        setError(err.message || 'Error initializing 360 viewer');
        setLoading(false);
      }
    }
  }, [currentSrc]);

  return (
    <div className={styles.backdrop} onClick={onClose} role="dialog" aria-modal="true" aria-label="360 Virtual Tour">
      <div
        ref={panelRef}
        className={styles.viewerPanel}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className={styles.closeButton}
          aria-label="Close 360 View"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Fullscreen Button */}
        <button
          type="button"
          onClick={toggleFullscreen}
          className={styles.fullscreenButton}
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </svg>
          )}
        </button>

        {/* 360 Canvas Container */}
        <div ref={containerRef} className={styles.canvasContainer} />

        {/* Loading Spinner */}
        {loading && (
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner} />
            <span className={styles.spinnerText}>Loading 360° Panorama...</span>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className={styles.errorOverlay}>
            <p className={styles.errorText}>{error}</p>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                type="button"
                onClick={() => setCurrentSrc(DEFAULT_PANO)}
                className={styles.errorCloseBtn}
                style={{ background: '#d4af37', color: '#111827' }}
              >
                Load Resort 360°
              </button>
              <button type="button" onClick={onClose} className={styles.errorCloseBtn}>
                Close Viewer
              </button>
            </div>
          </div>
        )}

        {/* Hint banner */}
        {!loading && !error && showHint && (
          <div className={styles.hintBadge}>
            <span>&#8644; Drag to look around</span>
          </div>
        )}

        {/* Room Name Badge Bottom-Left */}
        <div className={styles.roomBadge}>
          <span className={styles.badgeIndicator} />
          <span>{roomName} &bull; 360&deg; View</span>
        </div>
      </div>
    </div>
  );
}
