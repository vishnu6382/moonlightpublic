import React from 'react';

export default function FacilityIcon({ name = '', className = '', size = 20 }) {
  const norm = name.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Map normalized string to appropriate clean SVG path
  if (norm.includes('ac') || norm.includes('aircondition')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <rect x="2" y="4" width="20" height="10" rx="2" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
        <line x1="10" y1="18" x2="10.01" y2="18" />
        <path d="M6 14v2a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-2" />
        <line x1="7" y1="9" x2="17" y2="9" />
      </svg>
    );
  }

  if (norm.includes('bath')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M4 12h16a1 1 0 0 1 1 1v3a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4v-3a1 1 0 0 1 1-1Z" />
        <path d="M6 12V5a2 2 0 0 1 2-2h3v2" />
        <line x1="7" y1="20" x2="7" y2="22" />
        <line x1="17" y1="20" x2="17" y2="22" />
      </svg>
    );
  }

  if (norm.includes('toiletries')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3L12 3z" />
      </svg>
    );
  }

  if (norm.includes('bed')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M2 4v16" />
        <path d="M2 8h18a2 2 0 0 1 2 2v10" />
        <path d="M2 17h20" />
        <path d="M6 8v9" />
      </svg>
    );
  }

  if (norm.includes('fence')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M4 4v16" />
        <path d="M9 4v16" />
        <path d="M14 4v16" />
        <path d="M19 4v16" />
        <line x1="2" y1="8" x2="21" y2="8" />
        <line x1="2" y1="16" x2="21" y2="16" />
      </svg>
    );
  }

  if (norm.includes('wind') || norm.includes('ventilated')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M17.7 7.7a2.5 2.5 0 1 1 1.8 4.3H2" />
        <path d="M9.6 4.6A2 2 0 1 1 11 8H2" />
        <path d="M12.6 19.4A2 2 0 1 0 14 16H2" />
      </svg>
    );
  }

  if (norm.includes('wifi')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <path d="M5 12.55a11 11 0 0 1 14.08 0" />
        <path d="M1.42 9a16 16 0 0 1 21.16 0" />
        <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    );
  }

  if (norm.includes('parking')) {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="3" />
        <path d="M9 17V7h4a3 3 0 0 1 0 6H9" />
      </svg>
    );
  }

  // Generic fallback icon (clean geometric spark/star)
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </svg>
  );
}
