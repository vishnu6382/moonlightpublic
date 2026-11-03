'use client';

import React from 'react';
import styles from './FestiveLights.module.css';

export default function FestiveLights() {
  return (
    <div className={styles.lightsContainer} aria-hidden="true">
      <svg
        className={styles.wireSvg}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Downward Radiant Light Beams ("Light Velucham") */}
          <linearGradient id="beamGold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#FFD700" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#FFD700" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamRuby" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF1744" stopOpacity="0.55" />
            <stop offset="40%" stopColor="#FF1744" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#FF1744" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamAmber" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FF9100" stopOpacity="0.6" />
            <stop offset="40%" stopColor="#FF9100" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FF9100" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamGreen" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E676" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#00E676" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00E676" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="beamCyan" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.5" />
            <stop offset="40%" stopColor="#00E5FF" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>

          <pattern
            id="festive-swags-pattern"
            x="0"
            y="0"
            width="140"
            height="36"
            patternUnits="userSpaceOnUse"
          >
            {/* Hanging Wire Catenary */}
            <path
              d="M 0,3 Q 70,18 140,3"
              fill="none"
              stroke="#261E16"
              strokeWidth="1.6"
              strokeOpacity="0.8"
            />

            {/* Downward Light Beams ("Light Velucham") Shining down onto the header */}
            <polygon points="13,14 23,14 30,36 6,36" fill="url(#beamGold)" className={styles.beamFlow1} />
            <polygon points="39,19 49,19 58,36 30,36" fill="url(#beamRuby)" className={styles.beamFlow2} />
            <polygon points="64,23 76,23 88,36 52,36" fill="url(#beamAmber)" className={styles.beamFlow3} />
            <polygon points="91,19 101,19 110,36 82,36" fill="url(#beamGreen)" className={styles.beamFlow4} />
            <polygon points="117,14 127,14 134,36 110,36" fill="url(#beamCyan)" className={styles.beamFlow5} />

            {/* Bulb 1: Golden Sun (Flow 1) */}
            <g className={styles.bulbFlow1} style={{ color: '#FFD700' }}>
              <circle cx="18" cy="14" r="9" fill="#FFD700" opacity="0.3" />
              <line x1="18" y1="6" x2="18" y2="9" stroke="#1A1510" strokeWidth="1.5" />
              <rect x="15.5" y="8" width="5" height="2.5" fill="#3D3224" rx="0.5" />
              <ellipse cx="18" cy="14" rx="5" ry="6.8" fill="#FFD700" />
              <ellipse cx="18" cy="13.2" rx="2.8" ry="4" fill="#FFF59D" />
              <ellipse cx="16.6" cy="11.8" rx="1.3" ry="2.2" fill="#FFFFFF" opacity="0.95" />
            </g>

            {/* Bulb 2: Radiant Ruby Pink (Flow 2) */}
            <g className={styles.bulbFlow2} style={{ color: '#FF1744' }}>
              <circle cx="44" cy="19" r="9" fill="#FF1744" opacity="0.3" />
              <line x1="44" y1="11" x2="44" y2="14" stroke="#1A1510" strokeWidth="1.5" />
              <rect x="41.5" y="13" width="5" height="2.5" fill="#3D3224" rx="0.5" />
              <ellipse cx="44" cy="19" rx="5" ry="6.8" fill="#FF1744" />
              <ellipse cx="44" cy="18.2" rx="2.8" ry="4" fill="#FF80AB" />
              <ellipse cx="42.6" cy="16.8" rx="1.3" ry="2.2" fill="#FFFFFF" opacity="0.95" />
            </g>

            {/* Bulb 3: Deep Flame Amber - Center Lowest Point (Flow 3) */}
            <g className={styles.bulbFlow3} style={{ color: '#FF9100' }}>
              <circle cx="70" cy="23" r="10" fill="#FF9100" opacity="0.35" />
              <line x1="70" y1="15" x2="70" y2="18" stroke="#1A1510" strokeWidth="1.5" />
              <rect x="67.5" y="17" width="5" height="2.5" fill="#3D3224" rx="0.5" />
              <ellipse cx="70" cy="23" rx="5.5" ry="7.2" fill="#FF9100" />
              <ellipse cx="70" cy="22.2" rx="3.2" ry="4.4" fill="#FFE082" />
              <ellipse cx="68.4" cy="20.6" rx="1.4" ry="2.5" fill="#FFFFFF" opacity="0.95" />
            </g>

            {/* Bulb 4: Emerald Green (Flow 4) */}
            <g className={styles.bulbFlow4} style={{ color: '#00E676' }}>
              <circle cx="96" cy="19" r="9" fill="#00E676" opacity="0.3" />
              <line x1="96" y1="11" x2="96" y2="14" stroke="#1A1510" strokeWidth="1.5" />
              <rect x="93.5" y="13" width="5" height="2.5" fill="#3D3224" rx="0.5" />
              <ellipse cx="96" cy="19" rx="5" ry="6.8" fill="#00E676" />
              <ellipse cx="96" cy="18.2" rx="2.8" ry="4" fill="#B9F6CA" />
              <ellipse cx="94.6" cy="16.8" rx="1.3" ry="2.2" fill="#FFFFFF" opacity="0.95" />
            </g>

            {/* Bulb 5: Sapphire Sky Blue (Flow 5) */}
            <g className={styles.bulbFlow5} style={{ color: '#00E5FF' }}>
              <circle cx="122" cy="14" r="9" fill="#00E5FF" opacity="0.3" />
              <line x1="122" y1="6" x2="122" y2="9" stroke="#1A1510" strokeWidth="1.5" />
              <rect x="119.5" y="8" width="5" height="2.5" fill="#3D3224" rx="0.5" />
              <ellipse cx="122" cy="14" rx="5" ry="6.8" fill="#00E5FF" />
              <ellipse cx="122" cy="13.2" rx="2.8" ry="4" fill="#E0F7FA" />
              <ellipse cx="120.6" cy="11.8" rx="1.3" ry="2.2" fill="#FFFFFF" opacity="0.95" />
            </g>
          </pattern>
        </defs>

        <rect x="0" y="0" width="100%" height="36" fill="url(#festive-swags-pattern)" />
      </svg>
    </div>
  );
}
