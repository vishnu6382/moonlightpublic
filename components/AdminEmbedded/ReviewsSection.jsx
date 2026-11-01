'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './AdminEmbedded.module.css';

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [dateText, setDateText] = useState('1 week ago');
  const [source, setSource] = useState('Google');
  const [originalLink, setOriginalLink] = useState('');
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/admin/reviews');
      if (!res.ok) throw new Error('Failed to load reviews');
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleOpenAdd = () => {
    setEditingReview(null);
    setAuthor('');
    setRating(5);
    setText('');
    setDateText('1 week ago');
    setSource('Google');
    setOriginalLink('');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (r) => {
    setEditingReview(r);
    setAuthor(r.author || '');
    setRating(r.rating || 5);
    setText(r.text || '');
    setDateText(r.dateText || '');
    setSource(r.source || 'Google');
    setOriginalLink(r.originalLink || '');
    setIsPublished(Boolean(r.isPublished));
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!author.trim() || !text.trim()) {
      alert('Guest name and review text are required');
      return;
    }

    setSaving(true);
    try {
      const isNew = !editingReview?._id;
      const url = isNew ? '/api/admin/reviews' : `/api/admin/reviews/${editingReview._id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: author.trim(),
          rating: Number(rating) || 5,
          text: text.trim(),
          dateText: dateText.trim(),
          source: source.trim(),
          originalLink: originalLink.trim(),
          isPublished: Boolean(isPublished),
        }),
      });

      if (!res.ok) throw new Error('Failed to save review');
      setIsModalOpen(false);
      setSuccessMsg(isNew ? 'Review added successfully!' : 'Review updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async (r) => {
    try {
      const nextVal = !r.isPublished;
      const res = await fetch(`/api/admin/reviews/${r._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to toggle publish status');
      setReviews((prev) =>
        prev.map((item) => (item._id === r._id ? { ...item, isPublished: nextVal } : item))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id, authorName) => {
    if (!confirm(`Are you sure you want to delete the review by "${authorName}"?`)) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete review');
      setReviews((prev) => prev.filter((r) => r._id !== id));
      setSuccessMsg('Review deleted.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.embeddedCard}>
      <div className={styles.topBadgeRow}>
        <span className={styles.bronzeBadge}>Appears on: Home &gt; Google Reviews (#reviews)</span>
        <a href="/#reviews" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
          View live on home ↗
        </a>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
        <div>
          <h2 className={styles.sectionTitle}>Google Reviews Manager</h2>
          <p className={styles.sectionDesc}>
            Manage genuine customer testimonials shown in the marquee on the homepage.
          </p>
        </div>
        <button type="button" className={styles.primaryBtn} onClick={handleOpenAdd}>
          + Add Google Review
        </button>
      </div>

      {successMsg && <div className={styles.successToast}>{successMsg}</div>}
      {error && <div className={styles.errorToast}>{error}</div>}

      {loading ? (
        <p style={{ color: '#6B7280' }}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2.5rem', background: '#FDFBF7', border: '1px dashed #D5C9B3', borderRadius: '8px' }}>
          <p style={{ color: '#8C622D', fontWeight: 600, margin: '0 0 0.5rem' }}>No reviews added yet</p>
          <p style={{ color: '#6B7280', fontSize: '0.82rem', margin: '0 0 1rem' }}>
            When 0 published reviews exist, the Google Reviews section is automatically hidden on the homepage.
          </p>
          <button type="button" className={styles.primaryBtn} onClick={handleOpenAdd}>
            Add First Review
          </button>
        </div>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.th}>Guest Name</th>
                <th className={styles.th}>Rating</th>
                <th className={styles.th}>Review Excerpt</th>
                <th className={styles.th}>Date</th>
                <th className={styles.th}>Status</th>
                <th className={styles.th} style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((r) => (
                <tr key={r._id}>
                  <td className={styles.td} style={{ fontWeight: 600 }}>{r.author}</td>
                  <td className={styles.td}>{'★'.repeat(r.rating || 5)}</td>
                  <td className={styles.td} style={{ maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.text}
                  </td>
                  <td className={styles.td} style={{ color: '#6B7280', fontSize: '0.78rem' }}>{r.dateText || '—'}</td>
                  <td className={styles.td}>
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(r)}
                      className={r.isPublished ? styles.badgeGreen : styles.badgeGray}
                      style={{ border: 'none', cursor: 'pointer' }}
                    >
                      {r.isPublished ? '● Published' : '○ Hidden'}
                    </button>
                  </td>
                  <td className={styles.td} style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button type="button" className={styles.smallBtn} onClick={() => handleOpenEdit(r)}>
                        Edit
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => handleDelete(r._id, r.author)}
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

      {/* Add / Edit Review Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop} onClick={() => setIsModalOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingReview ? 'Edit Google Review' : 'Add Google Review'}
              </h3>
              <button type="button" className={styles.closeBtn} onClick={() => setIsModalOpen(false)}>
                &times;
              </button>
            </div>
            <form onSubmit={handleSave} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Guest Name *</label>
                <input
                  type="text"
                  className={styles.input}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Ramesh Kumar"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Rating (Stars) *</label>
                <select
                  className={styles.input}
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                </select>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label className={styles.label}>Review Text *</label>
                <textarea
                  className={styles.textarea}
                  rows={3}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste guest's real Google Maps review comment here..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Date Display</label>
                <input
                  type="text"
                  className={styles.input}
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="e.g. 2 weeks ago"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>Original Link (Optional)</label>
                <input
                  type="url"
                  className={styles.input}
                  value={originalLink}
                  onChange={(e) => setOriginalLink(e.target.value)}
                  placeholder="https://maps.google.com/..."
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>Publish review on live homepage</span>
                </label>
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                <button type="button" className={styles.smallBtn} onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={saving}>
                  {saving ? 'Saving...' : editingReview ? 'Update Review' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
