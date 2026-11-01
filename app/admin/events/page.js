'use client';

import React, { useState, useEffect, useCallback } from 'react';
import MediaUpload from '@/components/MediaUpload';
import styles from './events.module.css';

const PRESET_COLORS = [
  { name: 'Moonlight Bronze', hex: '#A9793E' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Sunburst Orange', hex: '#EA580C' },
  { name: 'Coral Red', hex: '#E11D48' },
  { name: 'Crimson Rose', hex: '#BE123C' },
  { name: 'Burgundy Wine', hex: '#9F1239' },
  { name: 'Emerald Green', hex: '#10B981' },
  { name: 'Forest Moss', hex: '#047857' },
  { name: 'Deep Teal', hex: '#0F766E' },
  { name: 'Royal Indigo', hex: '#4338CA' },
  { name: 'Sapphire Blue', hex: '#2563EB' },
  { name: 'Twilight Purple', hex: '#7C3AED' },
  { name: 'Night Charcoal', hex: '#1E1B18' },
];

export default function AdminEventsPage() {
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
  const [photos, setPhotos] = useState([]);
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [order, setOrder] = useState('0');

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

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const openAddModal = () => {
    setEditingEvent(null);
    setTitle('');
    setSubtitle('');
    // Default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setDate(tomorrow.toISOString().split('T')[0]);
    setTime('6:00 PM onwards');
    setVenue('Poolside & Lawn Grounds');
    setColor('#A9793E');
    setCoverImage('');
    setCoverVideo('');
    setPhotos([]);
    setDescription('');
    setIsActive(true);
    setOrder('0');
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
    setPhotos(Array.isArray(ev.photos) ? ev.photos : []);
    setDescription(ev.description || '');
    setIsActive(Boolean(ev.isActive));
    setOrder(String(ev.order || 0));
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        title,
        subtitle,
        date,
        time,
        venue,
        color,
        coverImage,
        coverVideo,
        photos,
        description,
        isActive,
        order: parseInt(order, 10) || 0,
      };

      const url = editingEvent
        ? `/api/admin/events/${editingEvent._id}`
        : '/api/admin/events';
      const method = editingEvent ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save event');

      setSuccess(editingEvent ? 'Event updated successfully!' : 'Event created and published to homepage!');
      setIsModalOpen(false);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, eventTitle) => {
    if (!window.confirm(`Are you sure you want to delete event "${eventTitle}"?`)) return;

    try {
      const res = await fetch(`/api/admin/events/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      setSuccess(`Deleted event "${eventTitle}".`);
      fetchEvents();
    } catch (err) {
      setError(err.message);
    }
  };

  const isUpcoming = (d) => {
    if (!d) return false;
    return new Date(d) >= new Date();
  };

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>Resort Events</h1>
          <p className={styles.headerSub}>
            Create, upload, and manage events, parties, celebrations, and gatherings for the Moon Light Resort homepage.
          </p>
        </div>
        <button className={styles.primaryBtn} onClick={openAddModal}>
          + Add New Event
        </button>
      </div>

      {error && <div className={`${styles.alertBox} ${styles.alertError}`}>{error}</div>}
      {success && <div className={`${styles.alertBox} ${styles.alertSuccess}`}>{success}</div>}

      {loading ? (
        <p style={{ color: '#6b7280' }}>Loading events...</p>
      ) : events.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 className={styles.emptyTitle}>No events published yet</h3>
          <p className={styles.emptyText}>
            Click &ldquo;+ Add New Event&rdquo; to post a new gathering, live acoustic night, campfire, or celebration.
          </p>
          <button className={styles.primaryBtn} onClick={openAddModal}>
            + Add New Event
          </button>
        </div>
      ) : (
        <div className={styles.cardGrid}>
          {events.map((ev) => {
            const upcoming = isUpcoming(ev.date);
            return (
              <div key={ev._id} className={styles.eventCard}>
                {ev.coverImage ? (
                  <img
                    src={ev.coverImage}
                    alt={ev.title}
                    className={styles.eventCover}
                  />
                ) : (
                  <div
                    className={styles.noCover}
                    style={{ background: ev.color || '#A9793E' }}
                  >
                    {ev.title}
                  </div>
                )}
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{ev.title}</h3>
                  {ev.subtitle && <p className={styles.cardSubtitle}>{ev.subtitle}</p>}
                  
                  <div className={styles.pillRow}>
                    <span className={`${styles.pill} ${upcoming ? styles.pillUpcoming : styles.pillPast}`}>
                      {upcoming ? 'UPCOMING' : 'PAST EVENT'}
                    </span>
                    {!ev.isActive && (
                      <span className={styles.pill} style={{ background: '#fee2e2', color: '#991b1b' }}>
                        Hidden
                      </span>
                    )}
                  </div>

                  <div className={styles.metaText}>
                    <span>📅 {ev.date ? new Date(ev.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No date'}</span>
                    {ev.time && <span>• {ev.time}</span>}
                  </div>

                  {ev.venue && (
                    <div className={styles.metaText}>
                      <span>📍 {ev.venue}</span>
                    </div>
                  )}

                  {ev.description && (
                    <p className={styles.descriptionSnippet}>
                      {ev.description.slice(0, 110)}...
                    </p>
                  )}

                  <div className={styles.cardActions}>
                    <button
                      className={styles.secondaryBtn}
                      onClick={() => openEditModal(ev)}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.dangerBtn}
                      onClick={() => handleDelete(ev._id, ev.title)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingEvent ? `Edit "${editingEvent.title}"` : 'Add New Event'}
            </h2>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Title *</label>
                <input
                  type="text"
                  required
                  className={styles.formInput}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. New Year Poolside Party, Acoustic Live Campfire"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Short Subtitle / Tagline</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="e.g. Music, Barbeque & Live Poolside Gathering"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Event Date *</label>
                  <input
                    type="date"
                    required
                    className={styles.formInput}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Time</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    placeholder="e.g. 6:30 PM onwards"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Venue / Area</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="e.g. Poolside & Lawn Grounds"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Order</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={order}
                    onChange={(e) => setOrder(e.target.value)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cover Image</label>
                {coverImage ? (
                  <div className={styles.mediaPreviewBox}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={coverImage} alt="Event Cover" className={styles.mediaPreviewImg} />
                    <button
                      type="button"
                      className={styles.mediaRemoveBtn}
                      onClick={() => setCoverImage('')}
                    >
                      ✕ Remove Cover
                    </button>
                  </div>
                ) : (
                  <MediaUpload
                    mediaType="image"
                    multiple={false}
                    onSuccess={(media) => setCoverImage(media.secureUrl)}
                  />
                )}
                <input
                  type="url"
                  className={styles.formInput}
                  style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="Or enter image URL: https://res.cloudinary.com/..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Cover Video (Optional background video)</label>
                {coverVideo ? (
                  <div className={styles.mediaPreviewBox}>
                    <video src={coverVideo} controls className={styles.mediaPreviewVideo} />
                    <button
                      type="button"
                      className={styles.mediaRemoveBtn}
                      onClick={() => setCoverVideo('')}
                    >
                      ✕ Remove Video
                    </button>
                  </div>
                ) : (
                  <MediaUpload
                    mediaType="video"
                    multiple={false}
                    onSuccess={(media) => setCoverVideo(media.secureUrl)}
                  />
                )}
                <input
                  type="url"
                  className={styles.formInput}
                  style={{ marginTop: '0.5rem', fontSize: '0.8125rem' }}
                  value={coverVideo}
                  onChange={(e) => setCoverVideo(e.target.value)}
                  placeholder="Or enter video URL: https://res.cloudinary.com/.../video.mp4"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Gallery Photos (Optional modal photos)</label>
                <MediaUpload
                  mediaType="image"
                  multiple={true}
                  onSuccess={(media) => {
                    setPhotos((prev) => [
                      ...prev,
                      {
                        src: media.secureUrl,
                        alt: media.title || title || 'Event photo',
                        caption: media.caption || '',
                      },
                    ]);
                  }}
                />

                {photos.length > 0 && (
                  <div className={styles.eventPhotosGrid}>
                    {photos.map((ph, idx) => (
                      <div key={idx} className={styles.eventPhotoCard}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={ph.src} alt={ph.alt} className={styles.eventPhotoThumb} />
                        <button
                          type="button"
                          className={styles.mediaRemoveBtn}
                          onClick={() => setPhotos((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          ✕
                        </button>
                        <input
                          type="text"
                          className={styles.eventPhotoInput}
                          placeholder="Caption..."
                          value={ph.caption || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPhotos((prev) => {
                              const next = [...prev];
                              next[idx] = { ...next[idx], caption: val };
                              return next;
                            });
                          }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Theme Accent Color</label>
                <div className={styles.colorPickerContainer}>
                  <div className={styles.colorSwatchesGrid}>
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={`${styles.colorDot} ${color.toLowerCase() === c.hex.toLowerCase() ? styles.colorDotActive : ''}`}
                        style={{ background: c.hex }}
                        onClick={() => setColor(c.hex)}
                        title={`${c.name} (${c.hex})`}
                      />
                    ))}
                  </div>

                  <div className={styles.customColorRow}>
                    <div className={styles.colorInputWrapper}>
                      <input
                        type="color"
                        className={styles.colorInputNative}
                        value={color.startsWith('#') && color.length === 7 ? color : '#A9793E'}
                        onChange={(e) => setColor(e.target.value)}
                        title="Click to open color wheel"
                      />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#4B5563' }}>Pick Any Color:</span>
                    </div>

                    <input
                      type="text"
                      className={styles.hexInput}
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      placeholder="#A9793E"
                      maxLength={7}
                    />

                    <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                      Hex: <strong>{color}</strong>
                    </span>
                  </div>

                  <div
                    className={styles.cardPreviewBanner}
                    style={{
                      background: `linear-gradient(135deg, ${color}DD 0%, ${color} 100%)`,
                    }}
                  >
                    <span>Card Preview: {title || 'Event Name'}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.9 }}>{venue || 'Resort Venue'}</span>
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Event Description & Details</label>
                <textarea
                  rows={4}
                  className={styles.formTextarea}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the event, attractions, special buffet, live performances, booking instructions..."
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                  />
                  Published / Visible on Home Page
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
                  {saving ? 'Saving...' : 'Save Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

