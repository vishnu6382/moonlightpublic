'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MediaUpload from '@/components/MediaUpload';
import styles from './AdminEmbedded.module.css';

export default function EventsSection() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [saving, setSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [venue, setVenue] = useState('Poolside & Lawn Grounds');
  const [color, setColor] = useState('#A9793E');
  const [coverImage, setCoverImage] = useState('');
  const [coverVideo, setCoverVideo] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Cover Image Selection Tab: 'upload' | 'library' | 'url'
  const [imageTab, setImageTab] = useState('upload');
  const [libraryItems, setLibraryItems] = useState([]);
  const [loadingLibrary, setLoadingLibrary] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/events');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load events');
      setEvents(data.events || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setSubtitle('');
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('6:00 PM onwards');
    setVenue('Poolside & Lawn Grounds');
    setColor('#A9793E');
    setCoverImage('');
    setCoverVideo('');
    setDescription('');
    setIsActive(true);
    setImageTab('upload');
    setIsModalOpen(true);
  };

  const openEditModal = (ev) => {
    setEditingEvent(ev);
    setTitle(ev.title || '');
    setSubtitle(ev.subtitle || '');
    setDate(ev.date ? ev.date.split('T')[0] : '');
    setTime(ev.time || '');
    setVenue(ev.venue || 'Poolside & Lawn Grounds');
    setColor(ev.color || '#A9793E');
    setCoverImage(ev.coverImage || '');
    setCoverVideo(ev.coverVideo || '');
    setDescription(ev.description || '');
    setIsActive(Boolean(ev.isActive));
    setImageTab('upload');
    setIsModalOpen(true);
  };

  const handleToggleActive = async (ev) => {
    try {
      const nextVal = !ev.isActive;
      const res = await fetch(`/api/admin/events/${ev._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to update event status');
      setEvents((prev) =>
        prev.map((item) => (item._id === ev._id ? { ...item, isActive: nextVal } : item))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, evTitle) => {
    if (!confirm(`Delete event "${evTitle}"?`)) return;
    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete event');
      setEvents((prev) => prev.filter((ev) => ev._id !== id));
      setSuccess('Event deleted.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Event title is required');
      return;
    }

    setSaving(true);
    try {
      const isNew = !editingEvent?._id;
      const url = isNew ? '/api/admin/events' : `/api/admin/events/${editingEvent._id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          subtitle: subtitle.trim(),
          date,
          time: time.trim(),
          venue: venue.trim(),
          color,
          coverImage: coverImage.trim(),
          coverVideo: coverVideo.trim(),
          description: description.trim(),
          isActive: Boolean(isActive),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save event');
      }
      setIsModalOpen(false);
      setSuccess(isNew ? 'Event created with cover image!' : 'Event updated with cover image!');
      setTimeout(() => setSuccess(''), 3000);
      fetchEvents();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.embeddedCard}>
      <div className={styles.topBadgeRow}>
        <span className={styles.bronzeBadge}>Appears on: Resort Events &amp; Celebrations</span>
        <a href="/" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
          View live home ↗
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 className={styles.sectionTitle}>FAQs &amp; Resort Events</h2>
          <p className={styles.sectionDesc}>
            Manage upcoming celebrations, private party dates, campfire nights, and seasonal festivities.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={openAddModal}>
          + Add Event
        </button>
      </div>

      {success && <div className={styles.successToast}>{success}</div>}
      {error && <div className={styles.errorToast}>{error}</div>}

      {loading ? (
        <p style={{ color: '#6B7280' }}>Loading events...</p>
      ) : events.length === 0 ? (
        <p style={{ color: '#6B7280' }}>No events added yet.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th} style={{ width: '60px' }}>Cover</th>
                <th className={styles.th}>Title</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Time</th>
                <th className={styles.th}>Venue</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr key={ev._id}>
                  <td className={styles.td}>
                    {ev.coverImage ? (
                      <img src={ev.coverImage} alt={ev.title} className={styles.tableThumbImg} />
                    ) : (
                      <div
                        className={styles.tableThumbImg}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.65rem' }}
                      >
                        No Img
                      </div>
                    )}
                  </td>
                  <td className={styles.td} style={{ fontWeight: 600 }}>{ev.title}</td>
                  <td className={styles.td}>{ev.date ? new Date(ev.date).toLocaleDateString() : '—'}</td>
                  <td className={styles.td}>{ev.time || '—'}</td>
                  <td className={styles.td}>{ev.venue || '—'}</td>
                  <td className={styles.td}>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(ev)}
                      className={ev.isActive ? styles.badgeGreen : styles.badgeGray}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {ev.isActive ? '● Active' : '○ Inactive'}
                    </button>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button type="button" className={styles.smallBtn} onClick={() => openEditModal(ev)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(ev._id, ev.title)}
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
                {editingEvent ? 'Edit Event' : 'Add New Event'}
              </h3>
              <button type="button" className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Event Title *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Saturday Poolside Barbecue"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Subtitle</label>
                <input
                  type="text"
                  className={styles.input}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Live music & dinner"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date *</label>
                <input
                  type="date"
                  className={styles.input}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Time</label>
                <input
                  type="text"
                  className={styles.input}
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="e.g. 6:00 PM onwards"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Venue</label>
                <input
                  type="text"
                  className={styles.input}
                  value={venue}
                  onChange={(e) => setVenue(e.target.value)}
                  placeholder="e.g. Poolside & Lawn Grounds"
                />
              </div>

              {/* COVER IMAGE UPLOAD & SELECTOR */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Event Cover Image</label>
                {coverImage ? (
                  <div className={styles.coverPreviewWrap}>
                    <img src={coverImage} alt="Event Cover" className={styles.coverPreviewImg} />
                    <button
                      type="button"
                      className={styles.removeCoverBtn}
                      onClick={() => setCoverImage('')}
                    >
                      ✕ Remove Image
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className={styles.imageTabRow}>
                      <button
                        type="button"
                        className={`${styles.imageTabBtn} ${imageTab === 'upload' ? styles.imageTabBtnActive : ''}`}
                        onClick={() => setImageTab('upload')}
                      >
                        ⬆ Upload File
                      </button>
                      <button
                        type="button"
                        className={`${styles.imageTabBtn} ${imageTab === 'library' ? styles.imageTabBtnActive : ''}`}
                        onClick={() => {
                          setImageTab('library');
                          loadMediaLibrary();
                        }}
                      >
                        🖼 Media Library
                      </button>
                      <button
                        type="button"
                        className={`${styles.imageTabBtn} ${imageTab === 'url' ? styles.imageTabBtnActive : ''}`}
                        onClick={() => setImageTab('url')}
                      >
                        🔗 Image URL
                      </button>
                    </div>

                    {imageTab === 'upload' && (
                      <MediaUpload
                        mediaType="image"
                        multiple={false}
                        onSuccess={(media) => {
                          if (media?.secureUrl) {
                            setCoverImage(media.secureUrl);
                          }
                        }}
                      />
                    )}

                    {imageTab === 'library' && (
                      <div>
                        {loadingLibrary ? (
                          <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>Loading media library...</p>
                        ) : libraryItems.length === 0 ? (
                          <p style={{ fontSize: '0.8rem', color: '#6B7280' }}>No photos found in media library.</p>
                        ) : (
                          <div className={styles.mediaThumbGrid}>
                            {libraryItems.map((item) => (
                              <button
                                key={item._id}
                                type="button"
                                className={styles.mediaThumbItem}
                                onClick={() => setCoverImage(item.secureUrl)}
                                title={item.title || 'Select photo'}
                              >
                                <img src={item.secureUrl} alt={item.title || ''} className={styles.mediaThumbImg} />
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {imageTab === 'url' && (
                      <input
                        type="url"
                        className={styles.input}
                        placeholder="Paste image URL (e.g. https://res.cloudinary.com/...)"
                        value={coverImage}
                        onChange={(e) => setCoverImage(e.target.value)}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* COVER VIDEO (OPTIONAL) */}
              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Cover Video URL (Optional background loop)</label>
                <input
                  type="url"
                  className={styles.input}
                  value={coverVideo}
                  onChange={(e) => setCoverVideo(e.target.value)}
                  placeholder="https://res.cloudinary.com/.../video.mp4"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Description</label>
                <textarea
                  className={styles.textarea}
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Join us for an evening of grilled specialties and relaxing vibes..."
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Active and visible</span>
                </label>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className={styles.smallBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
