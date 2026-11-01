'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MediaUpload from '@/components/MediaUpload';
import styles from './AdminEmbedded.module.css';

export default function NearbySection() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlace, setEditingPlace] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [district, setDistrict] = useState('salem');
  const [category, setCategory] = useState('Nature');
  const [distanceKm, setDistanceKm] = useState('');
  const [travelTime, setTravelTime] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');
  const [landmarkImage, setLandmarkImage] = useState('');
  const [description, setDescription] = useState('');
  const [featuredOnHome, setFeaturedOnHome] = useState(false);

  // Image Selection Tab: 'upload' | 'library' | 'url'
  const [imageTab, setImageTab] = useState('upload');
  const [libraryItems, setLibraryItems] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const fetchPlaces = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/nearby');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load places');
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
    setName('');
    setDistrict('salem');
    setCategory('Nature');
    setDistanceKm('');
    setTravelTime('');
    setMapsUrl('');
    setLandmarkImage('');
    setDescription('');
    setFeaturedOnHome(false);
    setImageTab('upload');
    setIsModalOpen(true);
  };

  const openEditModal = (p) => {
    setEditingPlace(p);
    setName(p.name || '');
    setDistrict(p.district || 'salem');
    setCategory(p.category || 'Nature');
    setDistanceKm(p.distanceKm !== undefined && p.distanceKm !== null ? String(p.distanceKm) : '');
    setTravelTime(p.travelTime || '');
    setMapsUrl(p.mapsUrl || '');
    setLandmarkImage(p.landmarkImage || '');
    setDescription(p.description || '');
    setFeaturedOnHome(Boolean(p.featuredOnHome));
    setImageTab('upload');
    setIsModalOpen(true);
  };

  const handleToggleFeatured = async (p) => {
    try {
      const nextVal = !p.featuredOnHome;
      const res = await fetch(`/api/admin/nearby/${p._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredOnHome: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to update featured status');
      setPlaces((prev) =>
        prev.map((item) => (item._id === p._id ? { ...item, featuredOnHome: nextVal } : item))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, placeName) => {
    if (!confirm(`Delete destination "${placeName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/nearby/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete destination');
      setPlaces((prev) => prev.filter((p) => p._id !== id));
      setSuccess('Destination deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Destination name is required');
      return;
    }

    setSaving(true);
    try {
      const isNew = !editingPlace?._id;
      const url = isNew ? '/api/admin/nearby' : `/api/admin/nearby/${editingPlace._id}`;
      const method = isNew ? 'POST' : 'PUT';

      const payload = {
        name: name.trim(),
        district: (district || 'salem').trim().toLowerCase(),
        category,
        distanceKm: distanceKm ? Number(distanceKm) : 0,
        travelTime: travelTime.trim(),
        mapsUrl: mapsUrl.trim(),
        landmarkImage: landmarkImage.trim(),
        description: description.trim(),
        featuredOnHome: Boolean(featuredOnHome),
        isActive: true,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save destination');

      setIsModalOpen(false);
      setSuccess(isNew ? 'Destination added successfully!' : 'Destination updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
      fetchPlaces();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.embeddedCard}>
      <div className={styles.topBadgeRow}>
        <span className={styles.bronzeBadge}>Appears on: Home &gt; Nearby Areas (#nearby) &amp; /nearby-areas</span>
        <a href="/#nearby" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
          View live on home ↗
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 className={styles.sectionTitle}>Nearby Sightseeing Destinations</h2>
          <p className={styles.sectionDesc}>
            Manage local attractions, driving distances from Moon Light Resort, photos, and which destinations feature on the homepage.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={openAddModal}>
          + Add Destination
        </button>
      </div>

      {success && <div className={styles.successToast}>{success}</div>}
      {error && <div className={styles.errorToast}>{error}</div>}

      {loading ? (
        <p style={{ color: '#6B7280' }}>Loading destinations...</p>
      ) : places.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No nearby destinations added yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Photo</th>
                <th className={styles.th}>Destination Name</th>
                <th className={styles.th}>Category</th>
                <th className={styles.th}>Distance</th>
                <th className={styles.th}>Drive Time</th>
                <th className={styles.th}>Featured on Home</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {places.map((p) => (
                <tr key={p._id}>
                  <td className={styles.td}>
                    {p.landmarkImage ? (
                      <img
                        src={p.landmarkImage}
                        alt={p.name}
                        className={styles.tableThumbImg}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className={styles.noThumbBadge}>No Photo</div>
                    )}
                  </td>
                  <td className={styles.td} style={{ fontWeight: 600 }}>{p.name}</td>
                  <td className={styles.td}>{p.category}</td>
                  <td className={styles.td}>{p.distanceKm ? `${p.distanceKm} km` : '—'}</td>
                  <td className={styles.td}>{p.travelTime || '—'}</td>
                  <td className={styles.td}>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={Boolean(p.featuredOnHome)}
                        onChange={() => handleToggleFeatured(p)}
                      />
                      <span className={p.featuredOnHome ? styles.badgeGreen : styles.badgeGray}>
                        {p.featuredOnHome ? 'Featured on Home' : 'Page Only'}
                      </span>
                    </label>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button type="button" className={styles.smallBtn} onClick={() => openEditModal(p)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(p._id, p.name)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingPlace ? 'Edit Destination' : 'Add Nearby Destination'}
              </h3>
              <button type="button" className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className={styles.modalForm}>
              {/* Destination Photo Upload / Selector */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Destination Cover Photo</label>
                <div className={styles.imageTabRow}>
                  <button
                    type="button"
                    className={`${styles.imageTabBtn} ${imageTab === 'upload' ? styles.imageTabBtnActive : ''}`}
                    onClick={() => setImageTab('upload')}
                  >
                    Direct Upload
                  </button>
                  <button
                    type="button"
                    className={`${styles.imageTabBtn} ${imageTab === 'library' ? styles.imageTabBtnActive : ''}`}
                    onClick={() => {
                      setImageTab('library');
                      loadMediaLibrary();
                    }}
                  >
                    Media Library Picker
                  </button>
                  <button
                    type="button"
                    className={`${styles.imageTabBtn} ${imageTab === 'url' ? styles.imageTabBtnActive : ''}`}
                    onClick={() => setImageTab('url')}
                  >
                    Paste Photo URL
                  </button>
                </div>

                {imageTab === 'upload' && (
                  <div style={{ marginTop: '8px' }}>
                    <MediaUpload
                      label="Upload Destination Photo (Auto-optimizes to Cloudinary)"
                      onSuccess={(item) => {
                        const url = item?.secureUrl || item?.url || (typeof item === 'string' ? item : '');
                        if (url) setLandmarkImage(url);
                      }}
                    />
                  </div>
                )}

                {imageTab === 'library' && (
                  <div style={{ marginTop: '8px' }}>
                    {loadingLibrary ? (
                      <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>Loading media library photos...</p>
                    ) : libraryItems.length === 0 ? (
                      <p style={{ color: '#6B7280', fontSize: '0.85rem' }}>No media library photos available.</p>
                    ) : (
                      <div className={styles.mediaThumbGrid}>
                        {libraryItems.map((m) => {
                          const mUrl = m.secureUrl || m.url;
                          return (
                            <div
                              key={m._id || mUrl}
                              className={styles.mediaThumbItem}
                              style={{
                                borderColor: landmarkImage === mUrl ? '#A9793E' : '#D1D5DB',
                                borderWidth: landmarkImage === mUrl ? '2px' : '1px',
                              }}
                              onClick={() => setLandmarkImage(mUrl)}
                            >
                              <img src={mUrl} alt={m.title || 'Photo'} className={styles.mediaThumbImg} />
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {imageTab === 'url' && (
                  <div style={{ marginTop: '8px' }}>
                    <input
                      type="url"
                      className={styles.input}
                      value={landmarkImage}
                      onChange={(e) => setLandmarkImage(e.target.value)}
                      placeholder="https://res.cloudinary.com/... or image link"
                    />
                  </div>
                )}

                {/* Live Preview */}
                {landmarkImage && (
                  <div style={{ marginTop: '12px' }}>
                    <div className={styles.coverPreviewWrap}>
                      <img src={landmarkImage} alt="Destination Preview" className={styles.coverPreviewImg} />
                      <button
                        type="button"
                        className={styles.removeCoverBtn}
                        onClick={() => setLandmarkImage('')}
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Title */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>1. Attraction Title *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mettur Dam, Poolampatti Boat House"
                  required
                />
              </div>

              {/* Distance & Travel Time */}
              <div className={styles.formGroup}>
                <label className={styles.label}>3. Distance (KM)</label>
                <input
                  type="number"
                  className={styles.input}
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(e.target.value)}
                  placeholder="e.g. 26"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>4. Travel Time</label>
                <input
                  type="text"
                  className={styles.input}
                  value={travelTime}
                  onChange={(e) => setTravelTime(e.target.value)}
                  placeholder="e.g. 35 min"
                />
              </div>

              {/* Description */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>2. Short Description *</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Concise editorial description of the destination..."
                  required
                />
              </div>

              {/* Featured on Home */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={featuredOnHome}
                    onChange={(e) => setFeaturedOnHome(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Feature tile on the live homepage</span>
                </label>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className={styles.smallBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : editingPlace ? 'Update Destination' : 'Create Destination'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
