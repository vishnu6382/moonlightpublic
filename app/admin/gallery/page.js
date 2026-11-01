'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import styles from './gallery.module.css';
import MediaUpload from '@/components/MediaUpload';
import MediaLibraryModal from '@/components/MediaLibraryModal';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';

export default function AdminGalleryPage() {
  const [activeTab, setActiveTab] = useState('media'); // 'media' | 'categories'
  const [categories, setCategories] = useState([]);
  const [mediaItems, setMediaItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filtering
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  // Category Modal
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [catSlug, setCatSlug] = useState('');
  const [catCover, setCatCover] = useState('');
  const [catOrder, setCatOrder] = useState(0);
  const [catSaving, setCatSaving] = useState(false);

  // Delete Modal
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Library Modal
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  const handleLibrarySelect = async (selectedItems) => {
    try {
      for (const item of selectedItems) {
        await fetch(`/api/admin/media/${item._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            showInGallery: true,
            categoryId:
              selectedCategory !== 'all' && selectedCategory !== 'uncategorized'
                ? selectedCategory
                : item.categoryId || null,
          }),
        });
      }
      setSuccessMsg(`Added ${selectedItems.length} item(s) from library to Gallery!`);
      fetchData();
    } catch (e) {
      setError(e.message || 'Error updating gallery items');
    }
  };

  // Load Categories & Media
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const [catRes, mediaRes] = await Promise.all([
        fetch('/api/admin/gallery/categories'),
        fetch('/api/admin/media?limit=100'),
      ]);

      if (!catRes.ok) throw new Error('Failed to load categories.');
      if (!mediaRes.ok) throw new Error('Failed to load media.');

      const catData = await catRes.json();
      const mediaData = await mediaRes.json();

      setCategories(catData.categories || []);
      setMediaItems(mediaData.media || []);
    } catch (err) {
      setError(err.message || 'Error fetching gallery data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Category Creation or Update
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) {
      setError('Category name is required.');
      return;
    }

    try {
      setCatSaving(true);
      setError('');

      const url = editingCategory
        ? `/api/admin/gallery/categories/${editingCategory._id}`
        : '/api/admin/gallery/categories';
      const method = editingCategory ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: catName.trim(),
          slug: catSlug.trim() || undefined,
          coverImage: catCover.trim(),
          order: Number(catOrder) || 0,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save category.');

      setSuccessMsg(
        editingCategory ? 'Category updated successfully!' : 'Category created successfully!'
      );
      setCategoryModalOpen(false);
      setEditingCategory(null);
      setCatName('');
      setCatSlug('');
      setCatCover('');
      setCatOrder(0);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCatSaving(false);
    }
  };

  // Quick add suggestion category
  const quickAddCategory = async (name) => {
    try {
      setCatSaving(true);
      setError('');
      const res = await fetch('/api/admin/gallery/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          order: categories.length + 1,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add category');
      setSuccessMsg(`Added category "${name}"!`);
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to add category');
    } finally {
      setCatSaving(false);
    }
  };

  // Open Edit Category Modal
  const openEditCategory = (cat) => {
    setEditingCategory(cat);
    setCatName(cat.name || '');
    setCatSlug(cat.slug || '');
    setCatCover(cat.coverImage || '');
    setCatOrder(cat.order || 0);
    setCategoryModalOpen(true);
  };

  // Toggle Media Attributes (showInGallery / showOnHome)
  const handleToggleMedia = async (mediaId, field, currentValue) => {
    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: !currentValue }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update media status.');
      }

      setMediaItems((prev) =>
        prev.map((item) =>
          item._id === mediaId ? { ...item, [field]: !currentValue } : item
        )
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Update Media Display Order
  const handleUpdateMediaOrder = async (mediaId, newOrder) => {
    try {
      const orderNum = parseInt(newOrder, 10);
      if (isNaN(orderNum)) return;
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderNum }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update media order.');
      }
      setMediaItems((prev) =>
        prev.map((item) => (item._id === mediaId ? { ...item, order: orderNum } : item))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Reassign Media Category
  const handleCategoryChange = async (mediaId, newCatId) => {
    try {
      const res = await fetch(`/api/admin/media/${mediaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ categoryId: newCatId || null }),
      });

      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to update category.');
      }

      setMediaItems((prev) =>
        prev.map((item) =>
          item._id === mediaId ? { ...item, categoryId: newCatId || null } : item
        )
      );
      setSuccessMsg('Media category updated.');
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete Action
  const confirmDelete = async () => {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError('');

      if (deleteTarget.type === 'category') {
        const res = await fetch(`/api/admin/gallery/categories/${deleteTarget.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Failed to delete category.');
        }
        setSuccessMsg('Category deleted.');
      } else if (deleteTarget.type === 'media') {
        const res = await fetch(`/api/admin/media/${deleteTarget.id}`, {
          method: 'DELETE',
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          throw new Error(d.error || 'Failed to delete media item.');
        }
        setSuccessMsg('Media item deleted permanently from database and Cloudinary.');
      }

      setDeleteTarget(null);
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Filtered Media
  const filteredMedia = mediaItems.filter((m) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'uncategorized') return !m.categoryId;
    return m.categoryId === selectedCategory || (m.categoryId?._id === selectedCategory);
  });

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>Gallery & Media Management</h1>
          <p className={styles.headerSub}>
            Organize resort categories, upload high-res photos & videos, and control showcase displays.
          </p>
        </div>

        <div className={styles.actionsRow}>
          {activeTab === 'media' && (
            <>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setLibraryModalOpen(true)}
                style={{ marginRight: '8px' }}
              >
                📁 Choose from Media Library
              </button>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setShowUpload(!showUpload)}
              >
                {showUpload ? 'Close Upload' : '+ Upload Media'}
              </button>
            </>
          )}

          {activeTab === 'categories' && (
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => {
                setEditingCategory(null);
                setCatName('');
                setCatSlug('');
                setCatCover('');
                setCatOrder(categories.length + 1);
                setCategoryModalOpen(true);
              }}
            >
              + Add Category
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabsRow}>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'media' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('media')}
        >
          Gallery Media ({mediaItems.length})
        </button>
        <button
          type="button"
          className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.tabBtnActive : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          Categories ({categories.length})
        </button>
      </div>

      {/* Messages */}
      {error && <div className={`${styles.alertBox} ${styles.errorBox}`}>{error}</div>}
      {successMsg && <div className={`${styles.alertBox} ${styles.successBox}`}>{successMsg}</div>}

      {/* Upload Box (Collapsible) */}
      {showUpload && activeTab === 'media' && (
        <div className={styles.uploadCard}>
          <div className={styles.uploadHeader}>
            <h2 className={styles.uploadTitle}>Upload New Media</h2>
            <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
              Photos (up to 40MB) • Videos (up to 100MB)
            </span>
          </div>

          <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>
              Assign to Category:
            </label>
            <select
              value={selectedCategory === 'all' || selectedCategory === 'uncategorized' ? '' : selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value || 'all')}
              style={{
                padding: '0.4rem 0.75rem',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '0.85rem',
              }}
            >
              <option value="">General (No Category)</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <MediaUpload
            mediaType="all"
            multiple={true}
            categoryId={
              selectedCategory !== 'all' && selectedCategory !== 'uncategorized'
                ? selectedCategory
                : null
            }
            showInGalleryDefault={true}
            onSuccess={() => {
              setSuccessMsg('Media uploaded and added to gallery successfully!');
              fetchData();
            }}
          />
        </div>
      )}

      {/* Tab 1: Media List */}
      {activeTab === 'media' && (
        <div>
          {/* Category Filter Pills */}
          <div className={styles.filtersBar}>
            <button
              type="button"
              className={`${styles.categoryPill} ${selectedCategory === 'all' ? styles.categoryPillActive : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All ({mediaItems.length})
            </button>
            {categories.map((c) => {
              const count = mediaItems.filter(
                (m) => m.categoryId === c._id || m.categoryId?._id === c._id
              ).length;
              return (
                <button
                  key={c._id}
                  type="button"
                  className={`${styles.categoryPill} ${selectedCategory === c._id ? styles.categoryPillActive : ''}`}
                  onClick={() => setSelectedCategory(c._id)}
                >
                  {c.name} ({count})
                </button>
              );
            })}
            <button
              type="button"
              className={`${styles.categoryPill} ${selectedCategory === 'uncategorized' ? styles.categoryPillActive : ''}`}
              onClick={() => setSelectedCategory('uncategorized')}
            >
              Uncategorized ({mediaItems.filter((m) => !m.categoryId).length})
            </button>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              Loading media items...
            </div>
          ) : filteredMedia.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '3.5rem 1rem',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#6b7280',
              }}
            >
              <p style={{ fontWeight: 600, color: '#111827', margin: '0 0 0.5rem 0' }}>
                No media items in this category.
              </p>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Click <strong>+ Upload Media</strong> above to upload photos or videos.
              </p>
            </div>
          ) : (
            <>
              <div className={styles.mediaGrid}>
              {filteredMedia.map((m) => {
                const currentCatId = m.categoryId?._id || m.categoryId || '';
                return (
                  <div key={m._id} className={styles.mediaCard}>
                    <div className={styles.mediaPreview}>
                      {m.mediaType === 'video' ? (
                        <video
                          src={getOptimizedVideoUrl(m.secureUrl, { maxWidth: 640 })}
                          poster={getOptimizedPosterUrl(m.secureUrl, m.posterUrl)}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          muted
                          playsInline
                          preload="metadata"
                        />
                      ) : (
                        <img
                          src={m.secureUrl}
                          alt={m.altText || m.title || 'Media item'}
                          className={styles.mediaImg}
                          loading="lazy"
                        />
                      )}
                      <span className={styles.mediaBadge}>
                        {m.mediaType === 'pano360' ? '360°' : m.mediaType}
                      </span>
                    </div>

                    <div className={styles.mediaBody}>
                      <h4 className={styles.mediaTitle} title={m.title || 'Untitled'}>
                        {m.title || 'Untitled Asset'}
                      </h4>

                      <div className={styles.mediaMetaRow}>
                        <span>{(m.sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                        <span>{m.width ? `${m.width}x${m.height}` : m.format}</span>
                      </div>

                      {/* Category Selection */}
                      <div>
                        <select
                          className={styles.selectInput}
                          value={currentCatId}
                          onChange={(e) => handleCategoryChange(m._id, e.target.value)}
                        >
                          <option value="">No Category</option>
                          {categories.map((c) => (
                            <option key={c._id} value={c._id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Display Order */}
                      <div className={styles.toggleRow} style={{ marginTop: '0.25rem' }}>
                        <span style={{ fontSize: '0.78rem', color: '#4B4237', fontWeight: 600 }}>
                          Display Order:
                        </span>
                        <input
                          type="number"
                          style={{
                            width: '60px',
                            padding: '2px 6px',
                            border: '1px solid #D5C9B3',
                            borderRadius: '4px',
                            fontSize: '0.78rem',
                            textAlign: 'center',
                          }}
                          defaultValue={m.order || 0}
                          onBlur={(e) => handleUpdateMediaOrder(m._id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          title="Set position order (e.g. 1 to show first, 2, 5, etc.)"
                        />
                      </div>

                      {/* Gallery Toggle */}
                      <div className={styles.toggleRow}>
                        <span>Show in Gallery</span>
                        <label className={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={Boolean(m.showInGallery)}
                            onChange={() => handleToggleMedia(m._id, 'showInGallery', m.showInGallery)}
                          />
                          <span className={styles.slider} />
                        </label>
                      </div>

                      {/* Home Toggle */}
                      <div className={styles.toggleRow}>
                        <span>Show on Home</span>
                        <label className={styles.toggleSwitch}>
                          <input
                            type="checkbox"
                            checked={Boolean(m.showOnHome)}
                            onChange={() => handleToggleMedia(m._id, 'showOnHome', m.showOnHome)}
                          />
                          <span className={styles.slider} />
                        </label>
                      </div>

                      {/* Actions */}
                      <div className={styles.cardActions}>
                        <a
                          href={m.secureUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ fontSize: '0.75rem', color: '#4b5563', textDecoration: 'none' }}
                        >
                          View Full ↗
                        </a>
                        <button
                          type="button"
                          className={styles.deleteIconBtn}
                          onClick={() =>
                            setDeleteTarget({
                              type: 'media',
                              id: m._id,
                              name: m.title || 'this media item',
                            })
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            </>
          )}
        </div>
      )}

      {/* Tab 2: Categories List */}
      {activeTab === 'categories' && (
        <div>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: '#6b7280' }}>
              Loading categories...
            </div>
          ) : categories.length === 0 ? (
            <div className={styles.emptyCatContainer}>
              <div className={styles.emptyCatIcon}>📁</div>
              <h3 className={styles.emptyCatTitle}>No Categories Added Yet</h3>
              <p className={styles.emptyCatDesc}>
                Create categories to organize your resort gallery photos and videos.
              </p>
              <div className={styles.emptyCatActions}>
                <button
                  type="button"
                  className={styles.primaryBtn}
                  onClick={() => {
                    setEditingCategory(null);
                    setCatName('');
                    setCatSlug('');
                    setCatCover('');
                    setCatOrder(1);
                    setCategoryModalOpen(true);
                  }}
                >
                  + Add Category
                </button>
              </div>
              <div className={styles.quickAddSection}>
                <span className={styles.quickAddLabel}>Quick add common categories:</span>
                <div className={styles.quickAddPills}>
                  {['Swimming Pool', 'Turf', 'Theatre', 'Indoor Games', 'Outdoor Games'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      className={styles.quickAddPill}
                      onClick={() => quickAddCategory(name)}
                      disabled={catSaving}
                    >
                      + {name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <table className={styles.catTable}>
              <thead>
                <tr>
                  <th style={{ width: '70px' }}>Cover</th>
                  <th>Name</th>
                  <th>Slug</th>
                  <th>Order</th>
                  <th>Items</th>
                  <th>Special</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => {
                  const count = mediaItems.filter(
                    (m) => m.categoryId === c._id || m.categoryId?._id === c._id
                  ).length;
                  return (
                    <tr key={c._id}>
                      <td>
                        {c.coverImage ? (
                          <img src={c.coverImage} alt={c.name} className={styles.catCoverImg} />
                        ) : (
                          <div
                            className={styles.catCoverImg}
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          >
                            📁
                          </div>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{c.name}</td>
                      <td style={{ color: '#6b7280', fontSize: '0.8rem' }}>{c.slug}</td>
                      <td>{c.order}</td>
                      <td>
                        <span
                          style={{
                            background: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                          }}
                        >
                          {count}
                        </span>
                      </td>
                      <td>
                        {c.isSpecial ? (
                          <span style={{ color: '#10b981', fontWeight: 600, fontSize: '0.8rem' }}>
                            ✓ Active
                          </span>
                        ) : (
                          <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>Standard</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className={styles.secondaryBtn}
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', marginRight: '0.5rem' }}
                          onClick={() => openEditCategory(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className={styles.deleteIconBtn}
                          onClick={() =>
                            setDeleteTarget({
                              type: 'category',
                              id: c._id,
                              name: c.name,
                            })
                          }
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Category Modal */}
      {categoryModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Create New Category'}
              </h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setCategoryModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
              <div className={styles.modalBody}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Category Name *</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="e.g. Swimming Pool"
                    value={catName}
                    onChange={(e) => setCatName(e.target.value)}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>URL Slug (optional)</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="auto-generated from name"
                    value={catSlug}
                    onChange={(e) => setCatSlug(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Cover Image URL</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="https://res.cloudinary.com/... or /photos/..."
                    value={catCover}
                    onChange={(e) => setCatCover(e.target.value)}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Display Order</label>
                  <input
                    type="number"
                    className={styles.formInput}
                    value={catOrder}
                    onChange={(e) => setCatOrder(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <button
                  type="button"
                  className={styles.secondaryBtn}
                  onClick={() => setCategoryModalOpen(false)}
                  disabled={catSaving}
                >
                  Cancel
                </button>
                <button type="submit" className={styles.primaryBtn} disabled={catSaving}>
                  {catSaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Confirm Deletion</h3>
              <button
                type="button"
                className={styles.modalClose}
                onClick={() => setDeleteTarget(null)}
              >
                ✕
              </button>
            </div>
            <div className={styles.modalBody}>
              <p style={{ margin: 0, color: '#374151', fontSize: '0.95rem' }}>
                Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              </p>
              {deleteTarget.type === 'media' && (
                <p style={{ margin: 0, color: '#dc2626', fontSize: '0.825rem' }}>
                  This will permanently delete the file from Cloudinary and remove it from the database.
                </p>
              )}
            </div>
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.dangerBtn}
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Media Library Picker Modal */}
      <MediaLibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        multiple={true}
        allowedTypes={['image', 'video', 'pano360']}
        title="Add to Gallery from Media Library"
        onSelect={handleLibrarySelect}
      />
    </div>
  );
}
