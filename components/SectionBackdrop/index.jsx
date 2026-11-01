import React from 'react';
import styles from './SectionBackdrop.module.css';

/**
 * Reusable SectionBackdrop:
 * Large watermark featuring the logo mark, concentric ring outlines,
 * and a faint crescent moon curve in bronze/charcoal at 4-6% opacity.
 * Placed in empty side areas of alternate sections (left / right).
 */
export default function SectionBackdrop({
  align = 'left', // 'left' | 'right'
  className = '',
  hideOnMobile = false,
}) {
  return (
    <div
      className={`${styles.backdrop} ${align === 'right' ? styles.alignRight : styles.alignLeft} ${
        hideOnMobile ? styles.hideMobile : ''
      } ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        className={styles.svgBackdrop}
        viewBox="0 0 600 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Radial soft fade mask */}
          <radialGradient id="fadeMask" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#000" stopOpacity="0.06" />
            <stop offset="60%" stopColor="#000" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#000" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="bronzeLine" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A9793E" stopOpacity="0.05" />
            <stop offset="100%" stopColor="#1F1B16" stopOpacity="0.03" />
          </linearGradient>
        </defs>

        {/* Outer concentric rings */}
        <circle cx="300" cy="300" r="280" stroke="url(#bronzeLine)" strokeWidth="1" strokeDasharray="6 6" />
        <circle cx="300" cy="300" r="220" stroke="url(#bronzeLine)" strokeWidth="1" />
        <circle cx="300" cy="300" r="160" stroke="url(#bronzeLine)" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="300" cy="300" r="100" stroke="url(#bronzeLine)" strokeWidth="0.8" />

        {/* Faint crescent-moon line */}
        <path
          d="M 360,180 A 150,150 0 0,0 240,420 A 130,130 0 0,1 360,180 Z"
          fill="none"
          stroke="#A9793E"
          strokeWidth="1.2"
          strokeOpacity="0.05"
        />

        {/* Central Triangle Sunburst / Rays Emblem (Stylized Logo Mark) */}
        <g opacity="0.05" transform="translate(200, 200) scale(0.67)">
          {/* Central sun rays burst */}
          <path d="M150 30 L160 120 L150 140 L140 120 Z" fill="#A9793E" />
          <path d="M210 50 L180 125 L165 140 L175 115 Z" fill="#A9793E" />
          <path d="M255 90 L195 140 L175 145 L190 125 Z" fill="#A9793E" />
          <path d="M270 150 L195 150 L175 150 L195 150 Z" fill="#A9793E" />
          <path d="M255 210 L195 160 L175 155 L190 175 Z" fill="#A9793E" />
          <path d="M210 250 L180 175 L165 160 L175 185 Z" fill="#A9793E" />
          <path d="M150 270 L160 180 L150 160 L140 180 Z" fill="#A9793E" />
          <path d="M90 250 L120 175 L135 160 L125 185 Z" fill="#A9793E" />
          <path d="M45 210 L105 160 L125 155 L110 175 Z" fill="#A9793E" />
          <path d="M30 150 L105 150 L125 150 L105 150 Z" fill="#A9793E" />
          <path d="M45 90 L105 140 L125 145 L110 125 Z" fill="#A9793E" />
          <path d="M90 50 L120 125 L135 140 L125 115 Z" fill="#A9793E" />

          {/* Central radiating circle */}
          <circle cx="150" cy="150" r="32" stroke="#1F1B16" strokeWidth="2" fill="none" />
          <circle cx="150" cy="150" r="14" fill="#A9793E" />
        </g>
      </svg>
    </div>
  );
}
