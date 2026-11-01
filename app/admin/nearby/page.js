'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MediaUpload from '@/components/MediaUpload';
import styles from './nearby.module.css';

export default function AdminNearbyPage() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [saving, setSaving] = useState(false);

  // Five Required Content Fields
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [distance, setDistance] = useState('');
  const [travelTime, setTravelTime] = useState('');
  const [mainImage, setMainImage] = useState('');

  // Presentation Setting
  const [featured, setFeatured] = useState(false);
  const [isActive, setIsActive] = useState(true);

  // Image tab: upload vs library
  const [imageTab, setImageTab] = useState('upload');
  const [libraryItems, setLibraryItems] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/nearby');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load attractions');
      setPlaces(data.places || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlaces();
  }, [fetchPlaces]);

  const loadMediaLibrary = async () => {
    if (libraryItems.length > 0) return;
    setLoadingLibrary(true);
    try {
      const res = await fetch('/api/admin/media?limit=40');
      const data = await res.json();
      if (res.ok && data.items) {
        setLibraryItems(data.items.filter((m) => m.mediaType !== 'video'));
      }
    } catch (_) {
    } finally {
      setLoadingLibrary(false);
    }
  };

  const openAddModal = () => {
    setEditingPlace(null);
    setTitle('');
    setDescription('');
    setDistance('');
    setTravelTime('');
    setMainImage('');
    setFeatured(false);
    setIsActive(true);
    setImageTab('upload');
    setIsModalOpen(true);
  };

  const openEditModal = (place) => {
    setEditingPlace(place);
    setTitle(place.name || place.title || '');
    setDescription(place.description || '');
    setDistance(place.distanceKm != null ? String(place.distanceKm) : '');
    setTravelTime(place.travelTime || (place.travelMinutes ? `${place.travelMinutes} min` : ''));
    setMainImage(place.landmarkImage || (place.photos && place.photos[0]?.url) || '');
    setFeatured(Boolean(place.featuredOnHome));
    setIsActive(place.isActive !== false);
    setImageTab('upload');
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      // Parse distance cleanly
      const parsedDist = parseFloat(distance.replace(/[^0-9.]/g, ''));

      const payload = {
        name: title.trim(),
        description: description.trim(),
        distanceKm: !isNaN(parsedDist) ? parsedDist : null,
        travelTime: travelTime.trim(),
        landmarkImage: mainImage.trim(),
        featuredOnHome: Boolean(featured),
        isActive: Boolean(isActive),
      };

      const url = editingPlace
        ? `/api/admin/nearby/${editingPlace._id}`
        : '/api/admin/nearby';
      const method = editingPlace ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save attraction');

      setSuccess(editingPlace ? 'Attraction updated successfully!' : 'Attraction added successfully!');
      setIsModalOpen(false);
      fetchPlaces();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, placeTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${placeTitle}"?`)) return;

    try {
      const res = await fetch(`/api/admin/nearby/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setSuccess(`Deleted "${placeTitle}".`);
      fetchPlaces();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleFeatured = async (place) => {
    try {
      const nextVal = !place.featuredOnHome;
      const res = await fetch(`/api/admin/nearby/${place._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredOnHome: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to update featured attraction');
      fetchPlaces();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>Nearby Attractions</h1>
          <p className={styles.headerSub}>
            Manage editorial destination highlights for Moon Light Resort. Showcase local spots with photography, distance, and travel time.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={openAddModal}>
          + Add Attraction
        </button>
      </div>

      {error && <div className={`${styles.alertBox} ${styles.alertError}`}>{error}</div>}
      {success && <div className={`${styles.alertBox} ${styles.alertSuccess}`}>{success}</div>}

      {loading ? (
        <p style={{ color: '#6b7280', padding: '2rem 0' }}>Loading attractions...</p>
      ) : places.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No nearby attractions added yet</h3>
          <p className={styles.emptyText}>
            Click &ldquo;+ Add Attraction&rdquo; to introduce your first local destination with title, description, distance, travel time, and photography.
          </p>
          <button className={styles.primaryBtn} onClick={openAddModal}>
            + Add Attraction
          </button>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {places.map((place) => (
            <div key={place._id} className={styles.placeCard}>
              {place.landmarkImage ? (
                <div style={{ position: 'relative', height: '180px', overflow: 'hidden' }}>
                  <img
                    src={place.landmarkImage}
                    alt={place.name}
                    className={styles.placeImage}
                  />
                  {place.featuredOnHome && (
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        background: '#D4C76F',
                        color: '#222',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        letterSpacing: '0.08em',
                        padding: '4px 8px',
                        borderRadius: '3px',
                        textTransform: 'uppercase',
                      }}
                    >
                      Featured Story
                    </span>
                  )}
                </div>
              ) : (
                <div className={styles.noImage}>No main image uploaded</div>
              )}
              <div className={styles.cardBody}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                  <h3 className={styles.cardTitle}>{place.name}</h3>
                  <button
                    type="button"
                    onClick={() => handleToggleFeatured(place)}
                    title={place.featuredOnHome ? 'Remove from Featured' : 'Set as Featured Attraction'}
                    style={{
                      background: place.featuredOnHome ? '#fef3c7' : '#f3f4f6',
                      color: place.featuredOnHome ? '#92400e' : '#6b7280',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {place.featuredOnHome ? '★ Featured' : '☆ Make Featured'}
                  </button>
                </div>

                <div className={styles.metaText} style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                  {place.distanceKm != null && (
                    <span><strong>{place.distanceKm} KM</strong></span>
                  )}
                  {(place.travelTime || place.travelTimeLabel) && (
                    <span>• {place.travelTime || place.travelTimeLabel}</span>
                  )}
                </div>

                {place.description && (
                  <p className={styles.metaText} style={{ flex: 1, marginTop: '8px', color: '#4b5563' }}>
                    {place.description.slice(0, 120)}
                    {place.description.length > 120 ? '...' : ''}
                  </p>
                )}

                <div className={styles.cardActions} style={{ marginTop: '14px' }}>
                  <button
                    className={styles.secondaryBtn}
                    onClick={() => openEditModal(place)}
                  >
                    Edit
                  </button>
                  <button
                    className={styles.dangerBtn}
                    onClick={() => handleDelete(place._id, place.name)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Modal — Strict Five Field Form */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '620px' }}>
            <h2 className={styles.modalTitle}>
              {editingPlace ? `Edit "${editingPlace.name}"` : 'Add Nearby Attraction'}
            </h2>
            <p style={{ fontSize: '0.82rem', color: '#6b7280', marginBottom: '1.25rem' }}>
              Cinematic Travel Journal attraction entry. Fill in the five fields below.
            </p>

            <form onSubmit={handleSave}>
              {/* Field 1: Title */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>1. Attraction Title *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Mettur Dam, Poolampatti Boat House"
                />
              </div>

              {/* Field 2: Description */}
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>2. Short Description *</label>
                <textarea
                  rows={3}
                  required
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="A concise, editorial introduction to this destination for resort guests..."
                />
              </div>

              {/* Fields 3 & 4: Distance & Travel Time */}
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>3. Distance (KM)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={distance}
                    onChange={(e) => setDistance(e.target.value)}
                    placeholder="e.g. 26 KM"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>4. Travel Time</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={travelTime}
                    onChange={(e) => setTravelTime(e.target.value)}
                    placeholder="e.g. 35 min"
                  />
                </div>
              </div>

              {/* Field 5: Main Image Upload */}
              <div className={styles.formGroup} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px', background: '#fafafa' }}>
                <label className={styles.formLabel} style={{ marginBottom: '8px' }}>
                  5. Main Image (Single photography upload)
                </label>

                {mainImage ? (
                  <div style={{ position: 'relative', marginBottom: '10px' }}>
                    <img
                      src={mainImage}
                      alt="Attraction preview"
                      style={{
                        width: '100%',
                        height: '180px',
                        objectFit: 'cover',
                        borderRadius: '6px',
                        border: '1px solid #d1d5db',
                      }}
                    />
                    <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => setMainImage('')}
                        style={{
                          background: '#fee2e2',
                          color: '#b91c1c',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Remove Image
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageTab('upload');
                        }}
                        style={{
                          background: '#f3f4f6',
                          color: '#374151',
                          border: 'none',
                          padding: '4px 10px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                        }}
                      >
                        Replace Image
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                      <button
                        type="button"
                        onClick={() => setImageTab('upload')}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: imageTab === 'upload' ? 600 : 400,
                          background: imageTab === 'upload' ? '#1f2937' : '#e5e7eb',
                          color: imageTab === 'upload' ? '#fff' : '#374151',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Upload Photo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setImageTab('library');
                          loadMediaLibrary();
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: imageTab === 'library' ? 600 : 400,
                          background: imageTab === 'library' ? '#1f2937' : '#e5e7eb',
                          color: imageTab === 'library' ? '#fff' : '#374151',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                      >
                        Choose from Media Library
                      </button>
                    </div>

                    {imageTab === 'upload' ? (
                      <MediaUpload
                        mediaType="image"
                        multiple={false}
                        onSuccess={(item) => {
                          const url = item?.secureUrl || item?.url || (typeof item === 'string' ? item : '');
                          if (url) {
                            setMainImage(url);
                          }
                        }}
                      />
                    ) : (
                      <div>
                        {loadingLibrary ? (
                          <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>Loading media...</p>
                        ) : libraryItems.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: '#6b7280' }}>No photos found in library.</p>
                        ) : (
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(4, 1fr)',
                              gap: '8px',
                              maxHeight: '180px',
                              overflowY: 'auto',
                            }}
                          >
                            {libraryItems.map((img) => (
                              <img
                                key={img._id || img.secureUrl || img.url}
                                src={img.secureUrl || img.url}
                                alt={img.caption || 'Library item'}
                                onClick={() => setMainImage(img.secureUrl || img.url)}
                                style={{
                                  width: '100%',
                                  height: '65px',
                                  objectFit: 'cover',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  border: '2px solid transparent',
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#D4C76F')}
                                onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'transparent')}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Presentation Setting: Featured Attraction Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 14px',
                  background: featured ? '#fffbeb' : '#f9fafb',
                  border: `1px solid ${featured ? '#fef08a' : '#e5e7eb'}`,
                  borderRadius: '6px',
                  marginBottom: '1.25rem',
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#111827' }}>
                    Featured Attraction
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                    Displays as the lead editorial story (large card) on desktop and top showcase on mobile. Only one attraction can be featured.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#D4C76F' }}
                />
              </div>

              {/* Status setting */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                <input
                  type="checkbox"
                  id="activeCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <label htmlFor="activeCheck" style={{ fontSize: '0.85rem', color: '#374151', cursor: 'pointer' }}>
                  Visible on public website
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className={styles.primaryBtn}
                >
                  {saving ? 'Saving...' : editingPlace ? 'Update Attraction' : 'Create Attraction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
