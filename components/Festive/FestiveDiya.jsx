'use client';

import React from 'react';
import { launchCelebration, burstAt } from '@/lib/fireworks';
import styles from './FestiveDiya.module.css';

export default function FestiveDiya({ text = 'May Your Days Glow' }) {
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Immediate vibrant burst at Diya position
    burstAt(x, y, ['#FFD700', '#FF9100', '#FF1744', '#FFFFFF', '#00E676']);

    // Followed by celebratory sky fireworks
    setTimeout(() => {
      launchCelebration();
    }, 150);
  };

  return (
    <div
      className={styles.diyaWidgetWrapper}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      aria-label={`${text} - Tap to burst fireworks`}
      title="Click to celebrate with firecrackers! 💥"
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
    >
      {/* Traditional Burning Clay Diya */}
      <div className={styles.diyaCircle}>
        <div className={styles.diyaGlowAura} aria-hidden="true" />
        <svg
          viewBox="0 0 44 44"
          className={styles.diyaSvg}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Radial glow for burning oil pool */}
            <radialGradient id="oilGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFF176" />
              <stop offset="60%" stopColor="#FF9800" />
              <stop offset="100%" stopColor="#795548" />
            </radialGradient>
          </defs>

          {/* Golden Aura Ring */}
          <circle cx="22" cy="22" r="18" fill="#FFB300" opacity="0.2" className={styles.pulseAura} />

          {/* Clay Diya Body with warm terracotta gradient */}
          <path
            d="M 6,26 C 6,35 38,35 38,26 C 38,24 6,24 6,26 Z"
            fill="#B45309"
            stroke="#78350F"
            strokeWidth="1.2"
          />
          {/* Diya Rim */}
          <ellipse cx="22" cy="25" rx="14" ry="4.5" fill="#D97706" />
          <ellipse cx="22" cy="25" rx="10" ry="3" fill="url(#oilGlow)" />

          {/* Diya Spout & Wick */}
          <line x1="22" y1="24" x2="22" y2="18" stroke="#2B1808" strokeWidth="1.8" strokeLinecap="round" />

          {/* Burning Animated Flame */}
          <g className={styles.flame}>
            {/* Outer Flame (Crimson & Amber) */}
            <path
              d="M 22,6 C 17,13 17,19 22,21 C 27,19 27,13 22,6 Z"
              fill="#FF3D00"
            />
            {/* Mid Flame (Radiant Gold) */}
            <path
              d="M 22,8 C 18.5,13.5 18.5,18 22,20 C 25.5,18 25.5,13.5 22,8 Z"
              fill="#FFD600"
            />
            {/* Inner Core (White Spark) */}
            <path
              d="M 22,11 C 20,15 20,17.5 22,19 C 24,17.5 24,15 22,11 Z"
              fill="#FFFFFF"
            />
          </g>
        </svg>
      </div>

      {/* Elegant Frosted White Gold Capsule */}
      <div className={styles.diyaPill}>
        <span className={styles.sparkleIcon}>✨</span>
        <span className={styles.diyaText}>{text || 'May Your Days Glow'}</span>
        <span className={styles.burstBadge}>TAP 💥</span>
      </div>
    </div>
  );
}
