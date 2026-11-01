'use client';

import React, { useState, useEffect } from 'react';
import MediaUpload from '@/components/MediaUpload';
import MediaGrid from '@/components/MediaGrid';

export default function AdminMediaTestPage() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' | 'video' | 'pano360' | 'all'
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = async () => {
    try {
      const res = await fetch('/api/admin/media');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch (e) {
      // Ignore fetch error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, []);

  return (
    <div>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0 0 0.25rem 0', color: '#111827' }}>
          Media Upload & Pipeline Test Surface
        </h2>
        <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>
          Authenticated test harness for verifying direct Cloudinary uploads, image compression, 360° aspect-ratio validation, and safe deletion.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={() => setActiveTab('image')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'image' ? '#111827' : '#ffffff',
            color: activeTab === 'image' ? '#ffffff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Photos (Images)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('video')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'video' ? '#111827' : '#ffffff',
            color: activeTab === 'video' ? '#ffffff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Videos (under 100MB)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('pano360')}
          style={{
            padding: '0.5rem 1rem',
            background: activeTab === 'pano360' ? '#111827' : '#ffffff',
            color: activeTab === 'pano360' ? '#ffffff' : '#374151',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            fontSize: '0.875rem',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          360° Panoramas (2:1)
        </button>
      </div>

      {/* Upload Component */}
      <MediaUpload
        key={activeTab}
        mediaType={activeTab}
        multiple={activeTab === 'image'}
        onSuccess={() => fetchMedia()}
      />

      {/* Media Grid */}
      {loading ? (
        <p style={{ marginTop: '2rem', color: '#6b7280', fontSize: '0.875rem' }}>Loading media items...</p>
      ) : (
        <MediaGrid mediaList={mediaList} onRefresh={fetchMedia} />
      )}
    </div>
  );
}
