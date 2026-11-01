'use client';

import React, { useEffect } from 'react';
import Section from '@/components/Section';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    // If a chunk failed to load due to code updates or new build, hard reload immediately to fetch fresh chunks
    const msg = error?.message || '';
    const name = error?.name || '';
    const isChunkError =
      name === 'ChunkLoadError' ||
      msg.includes('Loading chunk') ||
      msg.includes('Failed to load resource') ||
      msg.includes('MIME type') ||
      msg.includes('is not executable');

    if (isChunkError && typeof window !== 'undefined') {
      const reloadKey = 'chunk_reload_count';
      const count = parseInt(sessionStorage.getItem(reloadKey) || '0', 10);
      if (count < 2) {
        sessionStorage.setItem(reloadKey, String(count + 1));
        window.location.reload();
        return;
      }
    }

    // Log without leaking secrets or full internal traces
    if (process.env.NODE_ENV !== 'production') {
      console.error('App runtime error caught by boundary:', error);
    }
  }, [error]);

  const handleHardReload = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chunk_reload_count');
      window.location.reload();
    } else {
      reset();
    }
  };

  const handleReturnHome = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('chunk_reload_count');
      window.location.href = '/';
    }
  };

  return (
    <Section spacing="lg">
      <div
        style={{
          textAlign: 'center',
          padding: 'var(--space-7) 0',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-cinzel), serif',
            fontSize: 'clamp(3rem, 8vw, 5rem)',
            color: 'var(--bronze)',
            lineHeight: 1,
            fontWeight: 700,
            marginBottom: 'var(--space-2)',
          }}
        >
          Notice
        </p>
        <h1 style={{ marginBottom: 'var(--space-3)' }}>Something Went Wrong</h1>
        <p style={{ marginBottom: 'var(--space-5)', color: 'var(--muted)' }}>
          We encountered an unexpected interruption while loading this page. Please try refreshing or return to the main home page.
        </p>
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={handleHardReload}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              border: '1px solid var(--bronze)',
              background: 'transparent',
              color: 'var(--charcoal)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Try Again
          </button>
          <a
            href="/"
            onClick={handleReturnHome}
            style={{
              padding: '12px 24px',
              borderRadius: '999px',
              border: 'none',
              background: 'var(--bronze)',
              color: '#FFFFFF',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
            }}
          >
            Return Home
          </a>
        </div>
      </div>
    </Section>
  );
}

