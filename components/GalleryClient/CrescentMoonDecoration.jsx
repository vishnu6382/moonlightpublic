import React from 'react';

/**
 * Crescent Moon Decoration
 * Inspired by references/gallery-moon-shape-decoration.jpg
 * Built from small squares arranged in a crescent arc.
 * Used at 5-6% opacity in bronze/charcoal beside the header on desktop.
 */
export default function CrescentMoonDecoration({ className = '' }) {
  // Pre-calculated squares forming a crescent moon shape
  const squares = [
    // Top tip
    { x: 130, y: 15, size: 18 },
    { x: 100, y: 22, size: 22 },
    { x: 75, y: 32, size: 18 },
    // Upper arc
    { x: 55, y: 48, size: 24 },
    { x: 88, y: 46, size: 26 },
    { x: 42, y: 78, size: 26 },
    { x: 74, y: 76, size: 28 },
    // Middle outer curve
    { x: 22, y: 92, size: 15 },
    { x: 20, y: 115, size: 26 },
    { x: 54, y: 112, size: 28 },
    { x: 88, y: 110, size: 22 },
    // Lower arc
    { x: 28, y: 148, size: 28 },
    { x: 62, y: 146, size: 26 },
    { x: 96, y: 138, size: 20 },
    { x: 45, y: 180, size: 22 },
    { x: 74, y: 178, size: 26 },
    { x: 106, y: 165, size: 28 },
    // Bottom horn
    { x: 88, y: 210, size: 17 },
    { x: 105, y: 216, size: 24 },
    { x: 135, y: 198, size: 28 },
    { x: 138, y: 232, size: 16 },
    { x: 168, y: 205, size: 22 },
  ];

  return (
    <svg
      className={className}
      viewBox="0 0 220 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    >
      <g fill="var(--bronze, #A9793E)" opacity="0.055">
        {squares.map((sq, i) => (
          <rect
            key={i}
            x={sq.x}
            y={sq.y}
            width={sq.size}
            height={sq.size}
            rx={3}
          />
        ))}
      </g>
    </svg>
  );
}
