'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './reviews.module.css';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Editor Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [author, setAuthor] = useState('');
  const [rating, setRating] = useState(5);
  const [text, setText] = useState('');
  const [dateText, setDateText] = useState('');
  const [source, setSource] = useState('Google');
  const [originalLink, setOriginalLink] = useState('');
  const [order, setOrder] = useState(0);
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
    setOrder(reviews.length + 1);
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
    setOrder(r.order || 0);
    setIsPublished(Boolean(r.isPublished));
    setIsModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!author.trim()) {
      alert('Guest name is required');
      return;
    }
    if (!text.trim()) {
      alert('Review text is required');
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
          order: Number(order) || 0,
          isPublished: Boolean(isPublished),
        }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to save review');
      }

      setSuccessMsg(isNew ? 'Review published successfully!' : 'Review updated!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsModalOpen(false);
      loadReviews();
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublished = async (r) => {
    try {
      const res = await fetch(`/api/admin/reviews/${r._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !r.isPublished }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      setReviews((prev) =>
        prev.map((item) => (item._id === r._id ? { ...item, isPublished: !r.isPublished } : item))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (r) => {
    if (!window.confirm(`Delete review from "${r.author}"?`)) return;
    try {
      const res = await fetch(`/api/admin/reviews/${r._id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setSuccessMsg('Review deleted');
      setTimeout(() => setSuccessMsg(''), 3000);
      loadReviews();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className={styles.container}>
      {/* Top line: "What this screen does" */}
      <div className={styles.screenIntro}>
        <h1 className={styles.screenTitle}>Guest Reviews (Google)</h1>
        <p className={styles.screenHelp}>
          What this screen does: Manage verified guest reviews shown on the Home page. Real reviews only — paste exactly as written by guests.
        </p>
      </div>

      <div className={styles.noteBox}>
        <strong>⚠️ Real Reviews Only:</strong> Paste only genuine guest reviews exactly as written on Google. If 0 reviews are published, the Reviews section on the website is completely hidden.
      </div>

      {successMsg && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '10px 14px', borderRadius: '8px', marginBottom: '16px', fontSize: '0.85rem' }}>
          {error}
        </div>
      )}

      <div className={styles.topBar}>
        <div className={styles.badgeRow}>
          <span className={styles.bronzeBadge}>Appears on: Home &gt; Google Reviews marquee</span>
          <a href="/#reviews" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
            View live ↗
          </a>
        </div>

        <button type="button" className={styles.primaryBtn} onClick={handleOpenAdd}>
          + Add Real Review
        </button>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid #EAE3D3', borderRadius: '12px', padding: '48px', textAlign: 'center', color: '#6B7280' }}>
          <h3>No Reviews Added Yet</h3>
          <p>The Reviews section on the public Home page is currently hidden. Click &ldquo;+ Add Real Review&rdquo; to paste guest feedback from Google.</p>
        </div>
      ) : (
        <div className={styles.reviewsGrid}>
          {reviews.map((r) => (
            <div key={r._id} className={styles.reviewCard}>
              <div className={styles.cardTop}>
                <div className={styles.authorRow}>
                  <span className={styles.authorName}>{r.author}</span>
                  {r.dateText && <span className={styles.dateText}>{r.dateText}</span>}
                </div>
                <div className={styles.starsRow}>
                  {'★'.repeat(r.rating || 5)}{'☆'.repeat(5 - (r.rating || 5))}
                </div>
                <p className={styles.reviewText}>&ldquo;{r.text}&rdquo;</p>
              </div>

              <div className={styles.cardFooter}>
                <label className={styles.statusToggle}>
                  <input
                    type="checkbox"
                    checked={r.isPublished}
                    onChange={() => handleTogglePublished(r)}
                  />
                  <span style={{ color: r.isPublished ? '#065F46' : '#6B7280' }}>
                    {r.isPublished ? 'Published' : 'Hidden'}
                  </span>
                </label>

                <div className={styles.actionsGroup}>
                  <button type="button" className={styles.editBtn} onClick={() => handleOpenEdit(r)}>
                    Edit
                  </button>
                  <button type="button" className={styles.deleteBtn} onClick={() => handleDelete(r)}>
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Editor Modal */}
      {isModalOpen && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modal}>
            <h2 className={styles.modalTitle}>{editingReview ? 'Edit Guest Review' : 'Add Real Review'}</h2>
            <form onSubmit={handleSave}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Guest Name *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="e.g. Ramesh K."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Rating (Stars)</label>
                <select
                  className={styles.formSelect}
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                >
                  <option value={5}>★★★★★ (5 Stars)</option>
                  <option value={4}>★★★★☆ (4 Stars)</option>
                  <option value={3}>★★★☆☆ (3 Stars)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Review Text * (Paste exactly as written)</label>
                <textarea
                  className={styles.formTextarea}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste guest's exact words from Google..."
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Date Text</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={dateText}
                  onChange={(e) => setDateText(e.target.value)}
                  placeholder="e.g. 2 weeks ago / March 2026"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Source</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="Google"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Original Link (Optional)</label>
                <input
                  type="url"
                  className={styles.formInput}
                  value={originalLink}
                  onChange={(e) => setOriginalLink(e.target.value)}
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.statusToggle}>
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                  />
                  <span>Published on Website</span>
                </label>
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={styles.primaryBtn}
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
