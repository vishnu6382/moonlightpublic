'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import styles from './Pano360Viewer.module.css';

// Ultra-sharp 4K default panorama
const DEFAULT_PANO =
  'https://res.cloudinary.com/dqaroqfr/image/upload/q_auto:best,w_4096,c_limit,f_auto/v1793208541/moonlight_resort/xczyno5zqvn9fqwzmlur.webp';

/**
 * Ensures 360 panorama equirectangular photos are served in Ultra HD (4K / 4096px width)
 * with q_auto:best so textures on mobile and desktop are razor sharp with zero blurriness.
 */
function getWebGLSafePanoUrl(url) {
  if (!url || typeof url !== 'string') return DEFAULT_PANO;
  let cleanUrl = url.trim();
  if (cleanUrl.startsWith('//')) cleanUrl = 'https:' + cleanUrl;

  if (cleanUrl.includes('cloudinary.com') && cleanUrl.includes('/upload/')) {
    const parts = cleanUrl.split('/upload/');
    if (parts.length === 2) {
      let rest = parts[1];
      // Strip any old low-res transformations (w_2048, w_2560, q_auto:good, etc.)
      const segments = rest.split('/');
      const nonTransform = segments.filter(
        (s) =>
          !s.includes(',') &&
          !s.startsWith('w_') &&
          !s.startsWith('q_') &&
          !s.startsWith('c_') &&
          !s.startsWith('f_')
      );
      rest = nonTransform.join('/');
      return `${parts[0]}/upload/q_auto:best,w_4096,c_limit,f_auto/${rest}`;
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

  // Auto-hide hint after 3.5 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Lock body scroll and Esc key listener
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
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

  // Initialize Three.js sphere projection with ultra-smooth mobile swipe and damping
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

    // Camera angles & smooth inertia interpolation
    let lon = 0;
    let lat = 0;
    let targetLon = 0;
    let targetLat = 0;
    let velocityLon = 0;
    let velocityLat = 0;
    let isUserInteracting = false;

    let lastPointerX = 0;
    let lastPointerY = 0;

    // Multi-touch tracking for pinch zoom
    const activePointers = new Map();
    let initialPinchDistance = 0;
    let initialFov = 75;

    setLoading(true);
    setError('');

    if (!containerRef.current) return;

    try {
      const container = containerRef.current;
      const width = container.clientWidth || window.innerWidth || 800;
      const height = container.clientHeight || window.innerHeight || 600;

      // Camera: 75 FOV default
      camera = new THREE.PerspectiveCamera(75, width / height, 1, 1100);
      camera.target = new THREE.Vector3(0, 0, 0);

      scene = new THREE.Scene();

      // Smooth sphere geometry (64 segments for circular fidelity)
      geometry = new THREE.SphereGeometry(500, 64, 48);
      geometry.scale(-1, 1, 1); // Invert sphere to look from inside

      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: 'high-performance',
      });
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2.5));
      renderer.setSize(width, height);
      renderer.domElement.style.touchAction = 'none';
      renderer.domElement.style.userSelect = 'none';
      renderer.domElement.style.webkitUserSelect = 'none';

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const loader = new THREE.TextureLoader();
      loader.setCrossOrigin('anonymous');

      const loadSuccess = (loadedTexture) => {
        if (destroyed) return;
        texture = loadedTexture;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        if (renderer && renderer.capabilities) {
          texture.anisotropy = renderer.capabilities.getMaxAnisotropy?.() || 1;
        }

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

      // Load texture with zero delay
      loader.load(activeSrc, loadSuccess, undefined, loadFail);

      // Helper to compute pinch distance
      const getPinchDistance = () => {
        if (activePointers.size < 2) return 0;
        const pts = Array.from(activePointers.values());
        const dx = pts[0].x - pts[1].x;
        const dy = pts[0].y - pts[1].y;
        return Math.hypot(dx, dy);
      };

      // Pointer event handlers with smooth dragging and gesture handling
      const onPointerDown = (event) => {
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (activePointers.size === 1) {
          isUserInteracting = true;
          velocityLon = 0;
          velocityLat = 0;
          lastPointerX = event.clientX;
          lastPointerY = event.clientY;

          try {
            container.setPointerCapture?.(event.pointerId);
          } catch (_) {}
        } else if (activePointers.size === 2) {
          // Begin pinch to zoom
          initialPinchDistance = getPinchDistance();
          initialFov = camera.fov;
        }
      };

      const onPointerMove = (event) => {
        if (!activePointers.has(event.pointerId)) return;
        activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

        if (activePointers.size === 1 && isUserInteracting) {
          const deltaX = event.clientX - lastPointerX;
          const deltaY = event.clientY - lastPointerY;

          lastPointerX = event.clientX;
          lastPointerY = event.clientY;

          // Responsive sensitivity: feels natural and light on mobile touch screens
          const sensitivity = 0.18;
          targetLon -= deltaX * sensitivity;
          targetLat += deltaY * sensitivity;

          // Compute instantaneous velocity for gliding release
          velocityLon = deltaX * sensitivity;
          velocityLat = deltaY * sensitivity;
        } else if (activePointers.size === 2 && initialPinchDistance > 0) {
          // Pinch-to-zoom calculation
          const currentDistance = getPinchDistance();
          if (currentDistance > 0) {
            const scale = initialPinchDistance / currentDistance;
            const newFov = Math.max(35, Math.min(95, initialFov * scale));
            camera.fov = newFov;
            camera.updateProjectionMatrix();
          }
        }
      };

      const onPointerUp = (event) => {
        activePointers.delete(event.pointerId);

        try {
          container.releasePointerCapture?.(event.pointerId);
        } catch (_) {}

        if (activePointers.size === 0) {
          isUserInteracting = false;
        } else if (activePointers.size === 1) {
          // Transitioned from pinch zoom back to 1 finger
          const remaining = Array.from(activePointers.values())[0];
          lastPointerX = remaining.x;
          lastPointerY = remaining.y;
          velocityLon = 0;
          velocityLat = 0;
        }
      };

      const onWheel = (event) => {
        event.preventDefault();
        const fov = camera.fov + event.deltaY * 0.05;
        camera.fov = Math.max(35, Math.min(95, fov));
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

      // Bind interaction listeners directly on container element
      container.addEventListener('pointerdown', onPointerDown, { passive: false });
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
      container.addEventListener('wheel', onWheel, { passive: false });
      window.addEventListener('resize', onResize);

      // Animation loop with smooth inertia damping (lerp)
      const animate = () => {
        if (destroyed) return;
        animId = requestAnimationFrame(animate);

        // Apply friction inertia gliding when finger/mouse is released
        if (!isUserInteracting) {
          if (Math.abs(velocityLon) > 0.01 || Math.abs(velocityLat) > 0.01) {
            targetLon -= velocityLon;
            targetLat += velocityLat;
            velocityLon *= 0.92; // silky smooth friction deceleration
            velocityLat *= 0.92;
          } else {
            // Calm slow ambient rotation when completely idle
            targetLon += 0.035;
          }
        }

        // Smooth damping interpolation (lerp)
        lon += (targetLon - lon) * 0.18;
        lat += (targetLat - lat) * 0.18;

        // Limit vertical pitch to avoid polar singularities
        lat = Math.max(-85, Math.min(85, lat));
        targetLat = Math.max(-85, Math.min(85, targetLat));

        const phi = THREE.MathUtils.degToRad(90 - lat);
        const theta = THREE.MathUtils.degToRad(lon);

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
    <div
      className={styles.backdrop}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="360 Virtual Tour"
      data-lenis-prevent="true"
    >
      <div
        ref={panelRef}
        className={styles.viewerPanel}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
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
        <div ref={containerRef} className={styles.canvasContainer} data-lenis-prevent="true" />

        {/* Loading Spinner */}
        {loading && (
          <div className={styles.spinnerWrapper}>
            <div className={styles.spinner} />
            <span className={styles.spinnerText}>Loading 360° Ultra HD View...</span>
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
            <span>&#8644; Drag to look around &bull; Pinch to zoom</span>
          </div>
        )}

        {/* Room Name Badge Bottom-Left */}
        <div className={styles.roomBadge}>
          <span className={styles.badgeIndicator} />
          <span>{roomName} &bull; 360&deg; Ultra HD View</span>
        </div>
      </div>
    </div>
  );
}
