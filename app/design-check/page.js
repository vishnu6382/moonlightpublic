'use client';

import { useState } from 'react';
import Section from '@/components/Section';
import Button from '@/components/Button';
import Tile from '@/components/Tile';
import BentoGrid, { BentoItem } from '@/components/BentoGrid';
import FadeUp from '@/components/FadeUp';

// Palette definitions
const PALETTE = [
  { name: 'White', variable: '--white', hex: '#FFFFFF', border: true },
  { name: 'Tile Warm', variable: '--tile', hex: '#FBF9F4', border: true },
  { name: 'Border', variable: '--border', hex: '#EAE3D3', border: false },
  { name: 'Bronze Accent', variable: '--bronze', hex: '#A9793E', border: false },
  { name: 'Champagne Gold', variable: '--gold', hex: '#D4C76F', border: false },
  { name: 'Bright Gold', variable: '--gold-bright', hex: '#F6C90E', border: false },
  { name: 'Charcoal Text', variable: '--text', hex: '#1B1B1B', border: false, textLight: true },
  { name: 'Muted Text', variable: '--muted', hex: '#5B5B5B', border: false, textLight: true },
  { name: 'Footer Card BG', variable: '--footer-bg', hex: '#F4F1EA', border: true },
];

export default function DesignCheckPage() {
  const [bentoTileCount, setBentoTileCount] = useState(5);

  const tileCounts = [1, 3, 5, 10, 20];

  return (
    <Section spacing="lg">
      {/* Temporary Notice */}
      <div
        style={{
          backgroundColor: '#FFFBEB',
          border: '1px solid #FDE68A',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: '12px',
          marginBottom: 'var(--space-6)',
          fontSize: '0.9rem',
          color: '#92400E',
        }}
      >
        <strong>TEMPORARY ROUTE:</strong> This page (/design-check) tests the design system, colours, fonts, buttons, tiles, and BentoGrid with 1, 3, 5, 10, and 20 items. Marked for deletion later.
      </div>

      {/* 1. Header */}
      <FadeUp>
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <p style={{ textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--bronze)', fontSize: '0.85rem', fontWeight: 600 }}>
            Foundation &amp; Tokens
          </p>
          <h1>Design System Check</h1>
          <p style={{ maxWidth: '650px', marginTop: 'var(--space-2)' }}>
            Pure white background (#FFFFFF), bronze and gold accents, Cinzel and Poppins typography, and resilient Bento Grid layouts.
          </p>
        </div>
      </FadeUp>

      {/* 2. Colour Palette */}
      <section style={{ marginBottom: 'var(--space-7)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>1. Curated Palette</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 'var(--space-3)',
          }}
        >
          {PALETTE.map((c) => (
            <div
              key={c.variable}
              style={{
                backgroundColor: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: '16px',
                padding: 'var(--space-3)',
                boxShadow: 'var(--shadow-soft)',
              }}
            >
              <div
                style={{
                  height: '70px',
                  borderRadius: '10px',
                  backgroundColor: `var(${c.variable})`,
                  border: c.border ? '1px solid var(--border)' : 'none',
                  marginBottom: 'var(--space-2)',
                  display: 'flex',
                  alignItems: 'flex-end',
                  padding: '8px',
                }}
              >
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontFamily: 'monospace',
                    color: c.textLight ? '#FFFFFF' : 'var(--text)',
                    background: c.textLight ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.7)',
                    padding: '2px 6px',
                    borderRadius: '4px',
                  }}
                >
                  {c.hex}
                </span>
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.name}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--muted)', fontFamily: 'monospace' }}>
                {c.variable}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Typography */}
      <section style={{ marginBottom: 'var(--space-7)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>2. Typography Scale</h2>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            backgroundColor: 'var(--tile)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-tile)',
            padding: 'var(--space-5)',
          }}
        >
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', textTransform: 'uppercase' }}>H1 (Cinzel)</span>
            <h1>Moon Light Resort Haven</h1>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', textTransform: 'uppercase' }}>H2 (Cinzel)</span>
            <h2>Villa Rooms &amp; Dorms</h2>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', textTransform: 'uppercase' }}>H3 (Cinzel)</span>
            <h3>Together Time in Nedungulam</h3>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', textTransform: 'uppercase' }}>H4 (Cinzel)</span>
            <h4>Comfort-First Stay Essentials</h4>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', textTransform: 'uppercase' }}>Body Text (Poppins)</span>
            <p>
              Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a clean pool, and open spaces for families and group stays.
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', textTransform: 'uppercase' }}>Accent Welcome (Cormorant Garamond Italic)</span>
            <p style={{ fontFamily: 'var(--font-cormorant), serif', fontStyle: 'italic', fontSize: '1.4rem', color: 'var(--text)' }}>
              "Together Time in Nedungulam"
            </p>
          </div>
        </div>
      </section>

      {/* 4. Buttons */}
      <section style={{ marginBottom: 'var(--space-7)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>3. Buttons (Pill &amp; Bronze Accent)</h2>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button variant="outline" size="sm">Outline Sm</Button>
          <Button variant="outline" size="md">Outline Md (Default)</Button>
          <Button variant="outline" size="lg">Outline Lg</Button>
          <Button variant="solid" size="md">Solid Bronze</Button>
          <Button variant="ghost" size="md">Ghost Button</Button>
        </div>
      </section>

      {/* 5. Tile Component */}
      <section style={{ marginBottom: 'var(--space-7)' }}>
        <h2 style={{ marginBottom: 'var(--space-4)' }}>4. Tile Component (Zoom On Hover)</h2>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 'var(--space-4)',
          }}
        >
          <Tile
            aspectRatio="16/9"
            media={
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '200px',
                  background: 'linear-gradient(135deg, #d4c76f 0%, #a9793e 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  letterSpacing: '0.05em',
                  fontFamily: 'var(--font-cinzel), serif',
                }}
              >
                Sample Image Placeholder
              </div>
            }
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--bronze)', fontWeight: 600 }}>Villa Room</span>
            <h3 style={{ fontSize: '1.2rem' }}>Moon 1</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Comfortable stay with private bath, pool access, and tranquil open grounds.
            </p>
            <div style={{ marginTop: 'var(--space-2)' }}>
              <Button href="/rooms" variant="outline" size="sm">
                Explore Room
              </Button>
            </div>
          </Tile>

          <Tile>
            <span style={{ fontSize: '0.8rem', color: 'var(--bronze)', fontWeight: 600 }}>Activity</span>
            <h3 style={{ fontSize: '1.2rem' }}>Swimming Pool &amp; Lawn</h3>
            <p style={{ fontSize: '0.9rem' }}>
              Spacious outdoor relaxation area with clean swimming pool and dining space.
            </p>
          </Tile>
        </div>
      </section>

      {/* 6. Bento Grid Tests */}
      <section style={{ marginBottom: 'var(--space-7)' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 'var(--space-3)',
            marginBottom: 'var(--space-4)',
          }}
        >
          <div>
            <h2>5. Bento Grid Resiliency Test</h2>
            <p style={{ fontSize: '0.9rem' }}>
              Test dense flow with 1, 3, 5, 10, or 20 dummy tiles. Notice equal gaps and zero orphan holes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {tileCounts.map((count) => (
              <button
                key={count}
                type="button"
                onClick={() => setBentoTileCount(count)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-pill)',
                  border: `1.5px solid ${bentoTileCount === count ? 'var(--bronze)' : 'var(--border)'}`,
                  backgroundColor: bentoTileCount === count ? 'var(--bronze)' : 'var(--white)',
                  color: bentoTileCount === count ? 'var(--white)' : 'var(--text)',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {count} {count === 1 ? 'Tile' : 'Tiles'}
              </button>
            ))}
          </div>
        </div>

        {/* The Live Bento Grid */}
        <div style={{ backgroundColor: 'var(--white)', padding: 'var(--space-2)', borderRadius: '28px' }}>
          <BentoGrid itemCount={bentoTileCount}>
            {Array.from({ length: bentoTileCount }).map((_, i) => (
              <Tile
                key={i}
                style={{ height: '100%' }}
                media={
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      minHeight: i % 3 === 0 ? '220px' : '150px',
                      background: `linear-gradient(${120 + i * 25}deg, #eae3d3 0%, #fbf9f4 100%)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--muted)',
                      fontFamily: 'var(--font-cinzel), serif',
                      fontSize: '0.9rem',
                    }}
                  >
                    Bento Photo #{i + 1}
                  </div>
                }
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontSize: '1.05rem' }}>Tile {i + 1}</h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--bronze)', fontWeight: 600 }}>
                    Index {i}
                  </span>
                </div>
                <p style={{ fontSize: '0.85rem' }}>
                  Auto-sized tile fitting dense CSS Grid without layout gaps.
                </p>
              </Tile>
            ))}
          </BentoGrid>
        </div>
      </section>
    </Section>
  );
}
