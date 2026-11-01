'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import { siteConfig } from '@/content/site';
import { introFramesConfig } from '@/content/intro-frames';
import styles from './Intro.module.css';

function FeatureIcon({ type }) {
  if (type === 'bed') {
    return (
      <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 7v11M21 7v11M3 13h18M6 10h4M3 10a2 2 0 012-2h4a2 2 0 012 2" />
      </svg>
    );
  }
  if (type === 'leaf') {
    return (
      <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M11 20A7 7 0 014 13C4 7 11 3 20 3c0 9-4 17-9 17z" />
        <path d="M4 13c5 0 9 4 9 7" />
      </svg>
    );
  }
  if (type === 'mountain') {
    return (
      <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 20l6-9 4 5 3-4 5 8H3z" />
      </svg>
    );
  }
  if (type === 'pool') {
    return (
      <svg className={styles.featureIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M2 15c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
        <path d="M2 19c2.5 0 2.5 2 5 2s2.5-2 5-2 2.5 2 5 2 2.5-2 5-2" />
        <circle cx="12" cy="7" r="2" />
        <path d="M12 9v3l3 2" />
      </svg>
    );
  }
  return null;
}

export default function Intro({ data }) {
  const sectionRef = useRef(null);
  const canvasRef = useRef(null);
  const overlayRef = useRef(null);
  const welcomeRef = useRef(null);
  const progressFillRef = useRef(null);

  const imagesRef = useRef([]);
  const targetFrameRef = useRef(0);
  const currentFrameRef = useRef(0);
  const rafIdRef = useRef(null);

  const frameCount = introFramesConfig.frameCount || 120;
  const introData = {
    ...siteConfig.intro,
    ...(data || {}),
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const markIntroDone = () => {
      if (typeof document !== 'undefined' && document.documentElement.dataset.intro !== 'done') {
        document.documentElement.dataset.intro = 'done';
        window.dispatchEvent(new CustomEvent('moon:introdone'));
      }
    };

    // Check reduced motion
    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
      markIntroDone();
    }

    // Determine directory: mobile (< 768px) vs desktop
    const isMobile = window.innerWidth < 768;
    const baseDir = isMobile ? introFramesConfig.mobileDir : introFramesConfig.desktopDir;

    // Helper to get image URL for frame index (1-based)
    const getFrameUrl = (idx) => {
      const padded = String(idx).padStart(3, '0');
      return `${baseDir}/${padded}.${introFramesConfig.extension}`;
    };

    // Cached canvas dimensions & resize handling (ZERO getBoundingClientRect in drawLoop)
    let cachedW = 0;
    let cachedH = 0;
    const updateCanvasSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(window.innerWidth * dpr);
      const h = Math.round(window.innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      cachedW = w;
      cachedH = h;
    };
    updateCanvasSize();

    // Draw image onto canvas with cover fit using cached dimensions
    const drawCover = (img) => {
      if (!img || !img.complete || img.naturalWidth === 0) return;
      if (cachedW === 0 || cachedH === 0) updateCanvasSize();

      ctx.clearRect(0, 0, cachedW, cachedH);

      const canvasRatio = cachedW / cachedH;
      const imgRatio = img.naturalWidth / img.naturalHeight;

      let drawW, drawH, drawX, drawY;

      if (canvasRatio > imgRatio) {
        drawW = cachedW;
        drawH = cachedW / imgRatio;
        drawX = 0;
        drawY = (cachedH - drawH) / 2;
      } else {
        drawH = cachedH;
        drawW = cachedH * imgRatio;
        drawX = (cachedW - drawW) / 2;
        drawY = 0;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    // Initialize images array
    const images = new Array(frameCount);
    imagesRef.current = images;

    // Reduced Motion Mode: load only the last frame
    if (prefersReducedMotion) {
      const lastImg = new Image();
      lastImg.src = getFrameUrl(frameCount);
      lastImg.onload = () => {
        images[frameCount - 1] = lastImg;
        drawCover(lastImg);
      };
      return;
    }

    // Function to load a specific frame with off-thread decode
    const loadFrame = (idx, priority = false) => {
      if (idx < 1 || idx > frameCount || images[idx - 1]) return;
      const img = new Image();
      images[idx - 1] = img;
      img.src = getFrameUrl(idx);
      if (img.decode) {
        img.decode().catch(() => {}).then(() => {
          if (Math.round(currentFrameRef.current) === idx - 1) {
            drawCover(img);
          }
        });
      } else {
        img.onload = () => {
          if (Math.round(currentFrameRef.current) === idx - 1) {
            drawCover(img);
          }
        };
      }
    };

    // Normal Mode Preloading:
    // 1. Frame 1 loaded immediately
    loadFrame(1, true);

    // 2. Preload 12 milestone anchor frames across 0..120 range immediately
    // Guarantees zero freezes/jumping even on rapid scrub!
    const milestones = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, frameCount];
    milestones.forEach((m) => loadFrame(m, true));

    // 3. Progressive background loader for the remaining in-between frames
    let bgLoadIdx = 2;
    const scheduleNextBatch = () => {
      let loaded = 0;
      while (bgLoadIdx <= frameCount && loaded < (isMobile ? 3 : 5)) {
        if (!images[bgLoadIdx - 1]) {
          loadFrame(bgLoadIdx);
          loaded++;
        }
        bgLoadIdx++;
      }
      if (bgLoadIdx <= frameCount) {
        if ('requestIdleCallback' in window) {
          window.requestIdleCallback(scheduleNextBatch, { timeout: 200 });
        } else {
          setTimeout(scheduleNextBatch, 50);
        }
      }
    };
    if (typeof window !== 'undefined') {
      setTimeout(scheduleNextBatch, 100);
    }

    // Measure total scrollable range without forced layout on scroll
    let totalScrollable = 1;
    let sectionTotalHeight = 1;
    const updateSectionMetrics = () => {
      const section = sectionRef.current;
      if (!section) return;
      sectionTotalHeight = section.offsetHeight;
      totalScrollable = Math.max(1, sectionTotalHeight - window.innerHeight);
    };
    updateSectionMetrics();

    // High-performance scroll handler (ZERO getBoundingClientRect on scroll)
    let isIntroVisible = true;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // When scrolled well past intro section, mark done and sleep RAF
      if (currentScrollY > sectionTotalHeight + 50) {
        if (isIntroVisible) {
          isIntroVisible = false;
          markIntroDone();
        }
        return;
      }

      if (!isIntroVisible) {
        isIntroVisible = true;
      }

      const progress = Math.max(0, Math.min(1, currentScrollY / totalScrollable));

      // Target frame
      const targetFrame = Math.min(frameCount - 1, Math.floor(progress * (frameCount - 1)));
      targetFrameRef.current = targetFrame;

      // Scrub buffer: load immediate vicinity of target frame
      loadFrame(targetFrame + 1, true);
      loadFrame(targetFrame + 2, true);
      loadFrame(targetFrame, true);
      loadFrame(targetFrame + 3, true);

      // Update bottom-right progress line
      if (progressFillRef.current) {
        progressFillRef.current.style.width = `${Math.round(progress * 100)}%`;
      }

      // Smoothly fade out overlay
      if (overlayRef.current) {
        const overlayOpacity = Math.max(0, 1 - progress * 4.5);
        const overlayTranslate = -progress * 60;
        overlayRef.current.style.opacity = overlayOpacity.toFixed(3);
        overlayRef.current.style.transform = `translateY(${overlayTranslate.toFixed(1)}px)`;
      }

      // Welcome ending layer
      if (welcomeRef.current) {
        if (progress >= 0.78) {
          const welcomeOpacity = Math.min(1, Math.max(0, (progress - 0.78) / 0.14));
          const welcomeTranslate = (1 - welcomeOpacity) * 20;
          welcomeRef.current.style.opacity = welcomeOpacity.toFixed(3);
          welcomeRef.current.style.transform = `translateY(${welcomeTranslate.toFixed(1)}px)`;
        } else {
          welcomeRef.current.style.opacity = '0';
          welcomeRef.current.style.transform = 'translateY(20px)';
        }
      }

      // Check if intro has reached the end
      if (progress >= 0.96) {
        markIntroDone();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', () => {
      updateCanvasSize();
      updateSectionMetrics();
      const current = imagesRef.current[Math.round(currentFrameRef.current)] || imagesRef.current[0];
      if (current) drawCover(current);
    }, { passive: true });

    // Initial check
    handleScroll();

    // Render loop: Snappy, ultra-fluid 60/120Hz tracking
    let lastDrawnFrame = -1;
    const renderLoop = () => {
      if (isIntroVisible) {
        const target = targetFrameRef.current;
        const diff = target - currentFrameRef.current;

        // Snappy lerp (0.65): instantaneous, zero sluggish drag feeling
        if (Math.abs(diff) > 0.04) {
          currentFrameRef.current += diff * 0.65;
        } else {
          currentFrameRef.current = target;
        }

        const frameToDraw = Math.round(currentFrameRef.current);

        if (frameToDraw !== lastDrawnFrame) {
          let img = imagesRef.current[frameToDraw];
          // If this frame is still decoding, find the closest available frame
          if (!img || !img.complete || img.naturalWidth === 0) {
            for (let f = frameToDraw - 1; f >= 0; f--) {
              if (imagesRef.current[f] && imagesRef.current[f].complete && imagesRef.current[f].naturalWidth > 0) {
                img = imagesRef.current[f];
                break;
              }
            }
            if (!img || !img.complete || img.naturalWidth === 0) {
              for (let f = frameToDraw + 1; f < frameCount; f++) {
                if (imagesRef.current[f] && imagesRef.current[f].complete && imagesRef.current[f].naturalWidth > 0) {
                  img = imagesRef.current[f];
                  break;
                }
              }
            }
          }

          if (img && img.complete && img.naturalWidth > 0) {
            drawCover(img);
            lastDrawnFrame = frameToDraw;
          }
        }
      }

      rafIdRef.current = requestAnimationFrame(renderLoop);
    };

    rafIdRef.current = requestAnimationFrame(renderLoop);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [frameCount]);

  // Skip Intro smoothly to the next section
  const handleSkipIntro = () => {
    if (typeof document !== 'undefined') {
      document.documentElement.dataset.intro = 'done';
      window.dispatchEvent(new CustomEvent('moon:introdone'));
    }
    const section = sectionRef.current;
    if (section) {
      const targetY = section.offsetTop + section.offsetHeight;
      window.scrollTo({ top: targetY, behavior: 'smooth' });
    }
  };

  return (
    <section
      ref={sectionRef}
      className={styles.introSection}
      data-intro-section="true"
      aria-label="Moon Light Resort Entrance"
    >
      {/* 100svh Sticky Viewport Stage */}
      <div className={styles.stage}>
        {/* Skip Intro Button */}
        <button
          type="button"
          onClick={handleSkipIntro}
          className={styles.skipButton}
          aria-label="Skip intro animation"
        >
          Skip Intro &darr;
        </button>

        {/* Full-screen Canvas */}
        <canvas ref={canvasRef} className={styles.canvas} />

        {/* 5. Color Grade & Vignette Overlays (CSS only) */}
        <div className={styles.gradeAmber} aria-hidden="true" />
        <div className={styles.gradeGradients} aria-hidden="true" />

        {/* Text & Content Overlay (Matches Golden-Hour Gate Reference) */}
        <div ref={overlayRef} className={styles.overlay}>
          {/* Middle Row: Left Hero Block + Right Feature Panel */}
          <div className={styles.middleContent}>
            {/* 2. LEFT Block */}
            <div className={styles.leftBlock}>
              {/* Eyebrow with gold line */}
              <div className={styles.eyebrowRow}>
                <span className={styles.eyebrowLine} aria-hidden="true" />
                <span className={styles.eyebrowText}>{introData.eyebrow}</span>
              </div>

              {/* 2-line Heading */}
              <div className={styles.headingWrapper}>
                <span className={styles.headingLine1}>{introData.headingLine1}</span>
                <span className={styles.headingLine2}>{introData.headingLine2}</span>
              </div>

              {/* Description Paragraph */}
              <p className={styles.description}>{introData.description}</p>

              {/* Gold Filled Pill Button */}
              <Link href={introData.ctaHref} className={styles.ctaButton}>
                {introData.ctaText}
              </Link>
            </div>

            {/* 3. RIGHT Block: Luxury Feature Panel */}
            <div className={styles.rightPanel}>
              <div className={styles.panelHeader}>
                <svg
                  className={styles.panelHeaderIcon}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 3l4 8 5-5 5 15H2L8 3z" />
                </svg>
                <span className={styles.panelHeaderTitle}>{introData.rightPanelTitle}</span>
              </div>

              <div className={styles.featureList}>
                {introData.features.map((feat) => (
                  <div key={feat.id} className={styles.featureItem}>
                    <FeatureIcon type={feat.icon} />
                    <span>{feat.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 4. BOTTOM Row: SEO Title, Scroll Down, 01-04 Progress */}
          <div className={styles.bottomRow}>
            {/* Bottom Left: Thin line + MOON LIGHT RESORT (Real <h1> for SEO) */}
            <div className={styles.bottomLeftBrand}>
              <span className={styles.bottomBrandLine} aria-hidden="true" />
              <h1 className={styles.seoTitle}>{siteConfig.name}</h1>
            </div>

            {/* Bottom Center: Scroll Down */}
            <div className={styles.scrollCenter} aria-hidden="true">
              <svg
                className={styles.mouseIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="6" y="3" width="12" height="18" rx="6" />
                <line x1="12" y1="7" x2="12" y2="10" />
              </svg>
              <span>Scroll Down</span>
              <svg
                className={styles.chevronIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Bottom Right: 01 ———— 04 Progress Line */}
            <div className={styles.bottomRightProgress} aria-hidden="true">
              <span>01</span>
              <div className={styles.progressTrack}>
                <div ref={progressFillRef} className={styles.progressFill} />
              </div>
              <span>04</span>
            </div>
          </div>
        </div>

        {/* 6. WELCOME Ending Layer (Fades in at 80%-100% and stays on last frame) */}
        <div ref={welcomeRef} className={styles.welcomeLayer} style={{ opacity: 0 }}>
          <span className={styles.welcomeSubtitle}>{introData.welcomeSubtitle}</span>
          <span className={styles.welcomeTitle}>{introData.welcomeTitle}</span>
        </div>
      </div>
    </section>
  );
}
