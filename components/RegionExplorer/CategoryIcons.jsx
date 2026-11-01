import React from 'react';

// Pure SVG string generator for Leaflet DivIcon
export function getCategoryIconSvgString(category = '', color = '#FFFFFF', size = 16) {
  const norm = (category || '').toLowerCase();

  if (norm.includes('temple')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v3"/><path d="M10 5h4"/><path d="M7 9l5-4 5 4"/><path d="M5 14h14"/><path d="M6 9v5"/><path d="M18 9v5"/><path d="M4 21h16"/><path d="M6 14v7"/><path d="M18 14v7"/><path d="M10 21v-4a2 2 0 0 1 4 0v4"/></svg>`;
  }
  if (norm.includes('dam') || norm.includes('lake')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12h18"/><path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6"/><path d="M2 17c2 1 3-1 5 0s3 1 5 0 3-1 5 0 3-1 5 0"/><path d="M2 20c2 1 3-1 5 0s3 1 5 0 3-1 5 0 3-1 5 0"/></svg>`;
  }
  if (norm.includes('waterfall')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 5h6v14"/><path d="M9 5h6v14"/><path d="M15 5h6v14"/><path d="M3 19c2 1.5 4 0 6 1s4-1 6 0 4-1 6 0"/></svg>`;
  }
  if (norm.includes('hill') || norm.includes('nature')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20l7-12 5 8 6-10 3 14H3z"/><path d="M9 13l2-3 2 3"/></svg>`;
  }
  if (norm.includes('heritage') || norm.includes('museum') || norm.includes('fort')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 21V9l2-2h12l2 2v12H4z"/><path d="M4 6V3h3v3h4V3h2v3h4V3h3v3"/><path d="M9 21v-5a3 3 0 0 1 6 0v5"/></svg>`;
  }
  if (norm.includes('wildlife')) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12s2-4 4-4 4 4 4 4"/><path d="M12 8v8"/></svg>`;
  }
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z"/></svg>`;
}

// React CategoryIcon component
export function CategoryIcon({ category, size = 18, color = 'currentColor', className = '' }) {
  const norm = (category || '').toLowerCase();

  if (norm.includes('temple')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M12 2v3" />
        <path d="M10 5h4" />
        <path d="M7 9l5-4 5 4" />
        <path d="M5 14h14" />
        <path d="M6 9v5" />
        <path d="M18 9v5" />
        <path d="M4 21h16" />
        <path d="M6 14v7" />
        <path d="M18 14v7" />
        <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
      </svg>
    );
  }

  if (norm.includes('dam') || norm.includes('lake')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M3 12h18" />
        <path d="M6 12V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v6" />
        <path d="M2 17c2 1 3-1 5 0s3 1 5 0 3-1 5 0 3-1 5 0" />
        <path d="M2 20c2 1 3-1 5 0s3 1 5 0 3-1 5 0 3-1 5 0" />
      </svg>
    );
  }

  if (norm.includes('waterfall')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M3 5h6v14" />
        <path d="M9 5h6v14" />
        <path d="M15 5h6v14" />
        <path d="M3 19c2 1.5 4 0 6 1s4-1 6 0 4-1 6 0" />
      </svg>
    );
  }

  if (norm.includes('hill') || norm.includes('nature')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M3 20l7-12 5 8 6-10 3 14H3z" />
        <path d="M9 13l2-3 2 3" />
      </svg>
    );
  }

  if (norm.includes('heritage') || norm.includes('museum') || norm.includes('fort')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <path d="M4 21V9l2-2h12l2 2v12H4z" />
        <path d="M4 6V3h3v3h4V3h2v3h4V3h3v3" />
        <path d="M9 21v-5a3 3 0 0 1 6 0v5" />
      </svg>
    );
  }

  if (norm.includes('wildlife')) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M8 12s2-4 4-4 4 4 4 4" />
        <path d="M12 8v8" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <circle cx="12" cy="10" r="3" />
      <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
    </svg>
  );
}

// Crescent Moon Logo Icon for Resort Marker
export function CrescentMoonIcon({ size = 18, color = 'currentColor', className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c1.85 0 3.58-.51 5.07-1.39-4.39-.77-7.75-4.57-7.75-9.15 0-4.58 3.36-8.38 7.75-9.15C15.58 2.51 13.85 2 12 2z" />
    </svg>
  );
}
