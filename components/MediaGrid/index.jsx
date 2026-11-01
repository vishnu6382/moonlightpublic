'use client';

import React, { useState } from 'react';
import styles from './MediaGrid.module.css';
import Pano360Viewer from '@/components/Pano360Viewer';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';

export default function MediaGrid({ mediaList = [], onRefresh }) {
  const [active360Src, setActive360Src] = useState(null);
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [actionError, setActionError] = useState('');

  const handleToggle = async (item, field) => {
    setActionError('');
    const newValue = !item[field];
    try {
      const res = await fetch(`/api/admin/media/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: newValue }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update visibility.');
      }
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteCandidate || deleting) return;
    setDeleting(true);
    setActionError('');

    try {
      const res = await fetch(`/api/admin/media/${deleteCandidate._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Deletion failed.');
      }
      setDeleteCandidate(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    if (!editItem) return;
    setActionError('');

    try {
      const res = await fetch(`/api/admin/media/${editItem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caption: editItem.caption,
          altText: editItem.altText,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update metadata.');
      }
      setEditItem(null);
      if (onRefresh) onRefresh();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (!mediaList || mediaList.length === 0) {
    return (
      <div className={styles.gridContainer}>
        <div className={styles.emptyState}>
          <p style={{ margin: 0 }}>No media files uploaded yet. Upload an image, video, or 360° panorama above.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.gridContainer}>
      <div className={styles.gridHeader}>
        <h3 className={styles.gridTitle}>Uploaded Media Library</h3>
        <span className={styles.countBadge}>{mediaList.length} item{mediaList.length > 1 ? 's' : ''}</span>
      </div>

      {actionError && (
        <div style={{ padding: '0.75rem 1rem', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '6px', fontSize: '0.8125rem', marginBottom: '1rem' }}>
          {actionError}
        </div>
      )}

      <div className={styles.cardsGrid}>
        {mediaList.map((item) => (
          <div key={item._id} className={styles.mediaCard}>
            <div className={styles.mediaPreviewWrapper}>
              <span className={styles.typeBadge}>{item.mediaType}</span>

              {item.mediaType === 'video' ? (
                <video
                  src={getOptimizedVideoUrl(item.secureUrl, { maxWidth: 960 })}
                  poster={getOptimizedPosterUrl(item.secureUrl, item.posterUrl)}
                  controls
                  preload="metadata"
                  className={styles.previewVideo}
                />
              ) : (
                <img
                  src={item.secureUrl}
                  alt={item.altText || item.title || 'Resort media'}
                  className={styles.previewImage}
                  loading="lazy"
                />
              )}

              {item.mediaType === 'pano360' && (
                <button
                  type="button"
                  className={styles.preview360Btn}
                  onClick={() => setActive360Src(item.secureUrl)}
                >
                  Preview 360°
                </button>
              )}
            </div>

            <div className={styles.cardBody}>
              <h4 className={styles.cardTitle} title={item.caption || item.title || 'Untitled'}>
                {item.caption || item.title || 'Untitled'}
              </h4>

              <div className={styles.cardMeta}>
                {item.width && item.height ? `${item.width}x${item.height} • ` : ''}
                {(item.sizeBytes / (1024 * 1024)).toFixed(2)} MB • {item.format || item.resourceType}
              </div>

              {/* Switches */}
              <div className={styles.switchRow}>
                <span className={styles.toggleLabel}>Show on Home:</span>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={!!item.showOnHome}
                  onChange={() => handleToggle(item, 'showOnHome')}
                />
              </div>

              <div className={styles.switchRow}>
                <span className={styles.toggleLabel}>Show in Gallery:</span>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={!!item.showInGallery}
                  onChange={() => handleToggle(item, 'showInGallery')}
                />
              </div>

              <div className={styles.switchRow}>
                <span className={styles.toggleLabel}>Active (Visible):</span>
                <input
                  type="checkbox"
                  className={styles.toggleInput}
                  checked={item.isActive !== false}
                  onChange={() => handleToggle(item, 'isActive')}
                />
              </div>
            </div>

            <div className={styles.cardFooter}>
              <button
                type="button"
                className={styles.editButton}
                onClick={() => setEditItem({ ...item })}
              >
                Edit Info
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={() => setDeleteCandidate(item)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 360 Viewer Modal */}
      {active360Src && (
        <Pano360Viewer
          src={active360Src}
          roomName="360° Panorama Preview"
          onClose={() => setActive360Src(null)}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h4 className={styles.modalTitle}>Confirm Permanent Delete</h4>
            <p className={styles.modalText}>
              Are you sure you want to permanently delete this media file?
              <br /><br />
              <strong>File:</strong> {deleteCandidate.title || deleteCandidate.cloudinaryPublicId}
              <br />
              This will permanently delete the file from Cloudinary and remove its record from the database. This action cannot be undone.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.modalCancelBtn}
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.modalDeleteBtn}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editItem && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <h4 className={styles.modalTitle}>Edit Media Information</h4>
            <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>
                  Caption / Title
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                  value={editItem.caption || ''}
                  onChange={(e) => setEditItem({ ...editItem, caption: e.target.value })}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.25rem', color: '#374151' }}>
                  Alt Text (for Accessibility & SEO)
                </label>
                <input
                  type="text"
                  style={{ width: '100%', padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.875rem' }}
                  value={editItem.altText || ''}
                  onChange={(e) => setEditItem({ ...editItem, altText: e.target.value })}
                />
              </div>

              <div className={styles.modalActions} style={{ marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className={styles.modalCancelBtn}
                  onClick={() => setEditItem(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '0.5rem 1rem', background: '#111827', color: '#ffffff', border: 'none', borderRadius: '6px', fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
