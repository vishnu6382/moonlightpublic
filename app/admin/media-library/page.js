'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import MediaUpload from '@/components/MediaUpload';
import { getOrientationTag } from '@/lib/media';
import styles from './mediaLibrary.module.css';

export default function AdminMediaLibraryPage() {
  const [mediaList, setMediaList] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalStorageBytes, setTotalStorageBytes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // all, photo, video, 360, unused

  // Detail / Inspector drawer
  const [activeItem, setActiveItem] = useState(null);
  const [activeItemUsages, setActiveItemUsages] = useState([]);
  const [loadingUsages, setLoadingUsages] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');

  // 360 candidate review state
  const [showReview360Modal, setShowReview360Modal] = useState(false);
  const [marking360, setMarking360] = useState(false);

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState(null);
  const [confirmCascadeDelete, setConfirmCascadeDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Edit fields for active item
  const [editTitle, setEditTitle] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editAlt, setEditAlt] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editFocus, setEditFocus] = useState({ x: 50, y: 50 });
  const [editDisplayAs, setEditDisplayAs] = useState('auto');
  const [editOrder, setEditOrder] = useState(0);
  const [editShowOnHome, setEditShowOnHome] = useState(false);
  const [editShowInGallery, setEditShowInGallery] = useState(false);
  const [savingItem, setSavingItem] = useState(false);

  // Upload modal toggle
  const [showUploader, setShowUploader] = useState(false);

  // Load media items from API
  const loadMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ limit: '100' });
      if (searchQuery) params.set('q', searchQuery);
      if (typeFilter !== 'all') params.set('type', typeFilter);

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load media library');
      const data = await res.json();
      setMediaList(data.media || []);
      setTotal(data.total || 0);
      setTotalStorageBytes(data.totalStorageBytes || 0);
    } catch (err) {
      setError(err.message || 'Error loading media');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  useEffect(() => {
    loadMedia();
  }, [loadMedia]);

  // Load single item details & full usages when opened in inspector
  const openInspector = async (item) => {
    setActiveItem(item);
    setEditTitle(item.title || '');
    setEditCaption(item.caption || '');
    setEditAlt(item.altText || '');
    setEditTags((item.tags || []).join(', '));
    setEditFocus(item.focus || { x: 50, y: 50 });
    setEditDisplayAs(item.displayAs || 'auto');
    setEditOrder(item.order || 0);
    setEditShowOnHome(Boolean(item.showOnHome));
    setEditShowInGallery(Boolean(item.showInGallery));
    setSaveSuccess('');

    setLoadingUsages(true);
    try {
      const res = await fetch(`/api/admin/media/${item._id}`);
      if (res.ok) {
        const d = await res.json();
        setActiveItemUsages(d.media?.usages || []);
      }
    } catch (_) {
      setActiveItemUsages([]);
    } finally {
      setLoadingUsages(false);
    }
  };

  const closeInspector = () => {
    setActiveItem(null);
    setActiveItemUsages([]);
    setSaveSuccess('');
  };

  // Helper to detect 2:1 equirectangular panorama candidates
  const is360Candidate = useCallback((item) => {
    if (!item) return false;
    if (item.is360 || item.mediaType === 'pano360') return false;
    if (!item.width || !item.height) return false;
    const ratio = item.width / item.height;
    return ratio >= 1.9 && ratio <= 2.1;
  }, []);

  const candidates360 = useMemo(() => {
    return mediaList.filter(is360Candidate);
  }, [mediaList, is360Candidate]);

  // Mark an item as 360 or unmark
  const handleMarkAs360 = async (item, markValue = true) => {
    if (!item) return;
    setMarking360(true);
    try {
      const res = await fetch(`/api/admin/media/${item._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is360: markValue,
          mediaType: markValue ? 'pano360' : 'image',
        }),
      });
      if (!res.ok) throw new Error('Failed to update 360 status');
      const data = await res.json();
      setMediaList((prev) =>
        prev.map((m) =>
          m._id === item._id ? { ...m, is360: markValue, mediaType: markValue ? 'pano360' : 'image' } : m
        )
      );
      if (activeItem?._id === item._id) {
        setActiveItem((prev) =>
          prev ? { ...prev, is360: markValue, mediaType: markValue ? 'pano360' : 'image' } : null
        );
      }
    } catch (err) {
      alert(err.message || 'Error updating 360 status');
    } finally {
      setMarking360(false);
    }
  };

  // Bulk mark all candidates as 360
  const handleBulkMarkAll360 = async () => {
    if (candidates360.length === 0) return;
    setMarking360(true);
    try {
      const ids = candidates360.map((c) => c._id);
      const res = await fetch('/api/admin/media', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ids,
          updates: { is360: true, mediaType: 'pano360' },
        }),
      });
      if (!res.ok) throw new Error('Failed to bulk mark 360 items');
      setShowReview360Modal(false);
      loadMedia();
    } catch (err) {
      alert(err.message || 'Error updating candidates');
    } finally {
      setMarking360(false);
    }
  };

  // Focal point click handler
  const handleFocalClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    setEditFocus({ x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) });
  };

  // Save updated metadata
  const handleSaveMetadata = async () => {
    if (!activeItem) return;
    setSavingItem(true);
    setSaveSuccess('');
    try {
      const tagsArray = editTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const res = await fetch(`/api/admin/media/${activeItem._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle,
          caption: editCaption,
          altText: editAlt,
          tags: tagsArray,
          focus: editFocus,
          displayAs: editDisplayAs,
          order: Number(editOrder) || 0,
          showOnHome: Boolean(editShowOnHome),
          showInGallery: Boolean(editShowInGallery),
        }),
      });

      if (!res.ok) throw new Error('Failed to update media details');
      const data = await res.json();
      setSaveSuccess('Saved successfully! All public pages using this asset have been updated.');

      // Refresh list item in place
      setMediaList((prev) =>
        prev.map((m) => (m._id === activeItem._id ? { ...m, ...data.media } : m))
      );
    } catch (err) {
      alert(err.message || 'Error saving media');
    } finally {
      setSavingItem(false);
    }
  };

  // Delete flow
  const initiateDelete = (item) => {
    setDeleteCandidate(item);
    setConfirmCascadeDelete(false);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate) return;
    setDeleting(true);
    try {
      const url = `/api/admin/media/${deleteCandidate._id}?force=${confirmCascadeDelete ? 'true' : 'false'}`;
      const res = await fetch(url, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 409 && data.requiresConfirmation) {
          alert(
            `This file is used in ${data.usages.length} place(s). Please tick "Remove from all places and delete" to proceed.`
          );
          setDeleting(false);
          return;
        }
        throw new Error(data.error || 'Failed to delete media asset');
      }

      // Success
      setDeleteCandidate(null);
      if (activeItem?._id === deleteCandidate._id) {
        closeInspector();
      }
      loadMedia();
    } catch (err) {
      alert(err.message || 'Error during deletion');
    } finally {
      setDeleting(false);
    }
  };

  // Format bytes to MB/KB
  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className={styles.libraryPage}>
      {/* Page Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.pageTitle}>Media Library</h1>
          <p className={styles.pageSubtitle}>
            Unified asset library. Upload once, reuse across Rooms, Gallery, and Home sections.
          </p>
        </div>

        <div className={styles.headerRight}>
          {candidates360.length > 0 && (
            <button
              type="button"
              className={styles.review360Btn}
              onClick={() => setShowReview360Modal(true)}
            >
              ✨ Review 360 candidates ({candidates360.length})
            </button>
          )}

          <div className={styles.storageStatsBox}>
            <span className={styles.storageLabel}>Storage Used:</span>
            <strong className={styles.storageValue}>{formatBytes(totalStorageBytes)}</strong>
            <span className={styles.storageCount}>({total} items)</span>
          </div>

          <button
            type="button"
            className={styles.uploadNewBtn}
            onClick={() => setShowUploader(!showUploader)}
          >
            {showUploader ? 'Close Uploader' : '+ Upload New Media'}
          </button>
        </div>
      </div>

      {/* Upload Panel (Collapsible) */}
      {showUploader && (
        <div className={styles.uploaderBox}>
          <h3 className={styles.uploaderTitle}>Upload New Assets to Library</h3>
          <p className={styles.uploaderSubtitle}>
            Assets uploaded here are saved directly to the shared library without quality loss.
          </p>
          <MediaUpload
            mediaType="image"
            multiple={true}
            onSuccess={() => {
              loadMedia();
            }}
          />
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Search by title, alt text, or tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={styles.searchInput}
          />
          {searchQuery && (
            <button
              type="button"
              className={styles.clearSearch}
              onClick={() => setSearchQuery('')}
            >
              &times;
            </button>
          )}
        </div>

        <div className={styles.filterChips}>
          <button
            type="button"
            className={`${styles.filterChip} ${typeFilter === 'all' ? styles.chipActive : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            All ({total})
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${typeFilter === 'photo' ? styles.chipActive : ''}`}
            onClick={() => setTypeFilter('photo')}
          >
            Photos
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${typeFilter === 'video' ? styles.chipActive : ''}`}
            onClick={() => setTypeFilter('video')}
          >
            Videos
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${typeFilter === '360' ? styles.chipActive : ''}`}
            onClick={() => setTypeFilter('360')}
          >
            360° Panoramas
          </button>
          <button
            type="button"
            className={`${styles.filterChip} ${typeFilter === 'unused' ? styles.chipActive : ''}`}
            onClick={() => setTypeFilter('unused')}
          >
            Unused Files
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={styles.contentSplit}>
        {/* Media Grid */}
        <div className={styles.gridSection}>
          {loading && (
            <div className={styles.loadingBox}>
              <div className={styles.spinner} />
              <span>Loading media assets...</span>
            </div>
          )}

          {error && <div className={styles.errorBox}>{error}</div>}

          {!loading && !error && mediaList.length === 0 && (
            <div className={styles.emptyBox}>
              <span>📁 No media found matching your filter.</span>
            </div>
          )}

          {!loading && mediaList.length > 0 && (
            <div className={styles.mediaGrid}>
              {mediaList.map((item) => {
                const isVideo = item.mediaType === 'video' || item.resourceType === 'video';
                const is360 = Boolean(item.is360 || item.mediaType === 'pano360');
                const isCandidate = is360Candidate(item);
                const tag = is360 ? '360° Pano' : getOrientationTag(item.width, item.height, isVideo);
                const isSelected = activeItem?._id === item._id;
                const usageCount = item.usageCount || 0;

                return (
                  <div
                    key={item._id}
                    className={`${styles.assetCard} ${isSelected ? styles.cardActive : ''}`}
                    onClick={() => openInspector(item)}
                  >
                    <div className={styles.thumbWrapper}>
                      {isVideo ? (
                        <div className={styles.videoPlaceholder}>
                          <span className={styles.playIcon}>▶</span>
                          {item.posterUrl && <img src={item.posterUrl} alt={item.title || 'Video'} />}
                        </div>
                      ) : (
                        <img
                          src={item.secureUrl}
                          alt={item.altText || item.title || 'Media asset'}
                          loading="lazy"
                        />
                      )}

                      <span className={`${styles.tagBadge} ${is360 ? styles.tagBadge360 : ''}`}>{tag}</span>

                      <span
                        className={`${styles.usageBadge} ${
                          usageCount > 0 ? styles.usageHas : styles.usageNone
                        }`}
                      >
                        {usageCount > 0 ? `${usageCount} places` : 'Unused'}
                      </span>
                    </div>

                    <div className={styles.assetCardBody}>
                      <span className={styles.assetTitle} title={item.title || item.cloudinaryPublicId}>
                        {item.title || item.cloudinaryPublicId?.split('/').pop() || 'Untitled'}
                      </span>
                      <div className={styles.assetSubRow}>
                        <span className={styles.assetDim}>
                          {item.width && item.height ? `${item.width}×${item.height}` : 'Asset'}
                        </span>
                        <span className={styles.assetSize}>{formatBytes(item.sizeBytes)}</span>
                      </div>
                    </div>

                    {isCandidate && (
                      <div
                        className={styles.candidateBanner}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAs360(item, true);
                        }}
                        title="Click to mark this 2:1 image as a 360 photo"
                      >
                        <span>💡 Looks like 360</span>
                        <span className={styles.markCandidateAction}>Mark 360</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Inspector / Detail Drawer */}
        {activeItem && (
          <aside className={styles.inspectorDrawer}>
            <div className={styles.inspectorHeader}>
              <h3 className={styles.inspectorTitle}>Asset Details</h3>
              <button
                type="button"
                className={styles.closeDrawerBtn}
                onClick={closeInspector}
                aria-label="Close details"
              >
                &times;
              </button>
            </div>

            <div className={styles.inspectorBody}>
              {/* Media Preview & Focal Point Clicker */}
              <div className={styles.inspectorPreviewWrap}>
                {activeItem.mediaType === 'video' ? (
                  <video
                    src={activeItem.secureUrl}
                    poster={activeItem.posterUrl}
                    controls
                    className={styles.inspectorVideo}
                  />
                ) : (
                  <div
                    className={styles.focalClickContainer}
                    onClick={handleFocalClick}
                    title="Click anywhere on the image to set the crop focus center"
                  >
                    <img
                      src={activeItem.secureUrl}
                      alt={editAlt || 'Asset preview'}
                      className={styles.inspectorImg}
                    />
                    <span
                      className={styles.focalTarget}
                      style={{
                        left: `${editFocus.x}%`,
                        top: `${editFocus.y}%`,
                      }}
                    />
                  </div>
                )}
                {activeItem.mediaType !== 'video' && (
                  <span className={styles.focalGuide}>
                    🎯 Focus: {editFocus.x}%, {editFocus.y}% (Click image to reposition)
                  </span>
                )}
              </div>

              {saveSuccess && <div className={styles.successBanner}>{saveSuccess}</div>}

              {/* 360 Panorama Detection / Configuration */}
              {is360Candidate(activeItem) && (
                <div className={styles.candidateDrawerBox}>
                  <div className={styles.candidateDrawerText}>
                    <strong>💡 This looks like a 360 photo</strong>
                    <p>
                      Aspect ratio is 2:1 ({activeItem.width} × {activeItem.height} px). Mark as 360 to display it as an interactive round panorama instead of a flat tile.
                    </p>
                  </div>
                  <button
                    type="button"
                    className={styles.mark360Btn}
                    onClick={() => handleMarkAs360(activeItem, true)}
                    disabled={marking360}
                  >
                    {marking360 ? 'Updating...' : 'Mark as 360'}
                  </button>
                </div>
              )}

              {Boolean(activeItem.is360 || activeItem.mediaType === 'pano360') && (
                <div className={styles.is360BadgeBox}>
                  <span>🌐 Configured as 360° Equirectangular Panorama</span>
                  <button
                    type="button"
                    className={styles.unmark360Btn}
                    onClick={() => handleMarkAs360(activeItem, false)}
                    disabled={marking360}
                  >
                    Remove 360 flag
                  </button>
                </div>
              )}

              {/* Editable Fields Form */}
              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Descriptive title"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Alt Text (Accessibility)</label>
                <input
                  type="text"
                  value={editAlt}
                  onChange={(e) => setEditAlt(e.target.value)}
                  placeholder="Visual description for screen readers & SEO"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Tags (comma-separated)</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="exterior, pool, bedroom, night"
                  className={styles.formInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Preferred Slot Ratio</label>
                <select
                  value={editDisplayAs}
                  onChange={(e) => setEditDisplayAs(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="auto">Auto (Detect from image ratio)</option>
                  <option value="portrait">Portrait (Tall slot)</option>
                  <option value="landscape">Landscape (Wide slot)</option>
                  <option value="square">Square</option>
                </select>
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Display Position / Order</label>
                <input
                  type="number"
                  value={editOrder}
                  onChange={(e) => setEditOrder(e.target.value)}
                  placeholder="e.g. 1 to show first, 2, 5, etc."
                  className={styles.formInput}
                />
              </div>

              <div className={styles.fieldGroup}>
                <label className={styles.fieldLabel}>Website Placements</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '6px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editShowOnHome}
                      onChange={(e) => setEditShowOnHome(e.target.checked)}
                    />
                    <span><strong>Show on Home</strong> (Photo Showcase slot candidate)</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={editShowInGallery}
                      onChange={(e) => setEditShowInGallery(e.target.checked)}
                    />
                    <span><strong>Show in Gallery</strong> (Public gallery page)</span>
                  </label>
                </div>
              </div>

              <button
                type="button"
                className={styles.saveChangesBtn}
                onClick={handleSaveMetadata}
                disabled={savingItem}
              >
                {savingItem ? 'Saving changes...' : 'Save Details Everywhere'}
              </button>

              {/* "Appears On" Usage List */}
              <div className={styles.usageSection}>
                <h4 className={styles.usageHeader}>
                  📍 Appears on ({activeItemUsages.length})
                </h4>

                {loadingUsages && <span className={styles.loadingSmall}>Checking placements...</span>}

                {!loadingUsages && activeItemUsages.length === 0 && (
                  <p className={styles.noUsageText}>
                    This item is not currently referenced by any public sections.
                  </p>
                )}

                {!loadingUsages && activeItemUsages.length > 0 && (
                  <ul className={styles.usageList}>
                    {activeItemUsages.map((u, idx) => (
                      <li key={idx} className={styles.usageItem}>
                        <div className={styles.usageItemText}>
                          <strong>{u.page}</strong>
                          <span className={styles.usageSec}>{u.section}</span>
                        </div>
                        <div className={styles.usageLinks}>
                          {u.editUrl && (
                            <Link href={u.editUrl} className={styles.actionLink}>
                              Edit
                            </Link>
                          )}
                          {u.url && (
                            <a
                              href={u.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={styles.actionLink}
                            >
                              View ↗
                            </a>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* File Info Specs */}
              <div className={styles.fileSpecs}>
                <div>
                  <span className={styles.specLabel}>Dimensions:</span>{' '}
                  {activeItem.width && activeItem.height
                    ? `${activeItem.width} × ${activeItem.height} px`
                    : 'N/A'}
                </div>
                <div>
                  <span className={styles.specLabel}>File Size:</span> {formatBytes(activeItem.sizeBytes)}
                </div>
                <div>
                  <span className={styles.specLabel}>Format:</span> {activeItem.format || activeItem.resourceType}
                </div>
                <div>
                  <span className={styles.specLabel}>Cloudinary ID:</span>{' '}
                  <code className={styles.idCode}>{activeItem.cloudinaryPublicId}</code>
                </div>
              </div>

              {/* Danger Zone: Delete button */}
              <div className={styles.dangerZone}>
                <button
                  type="button"
                  className={styles.deleteAssetBtn}
                  onClick={() => initiateDelete(activeItem)}
                >
                  Delete from Media Library...
                </button>
              </div>
            </div>
          </aside>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <div className={styles.deleteModalBackdrop}>
          <div className={styles.deleteModalContent}>
            <h3 className={styles.deleteModalTitle}>Confirm Asset Deletion</h3>
            <p className={styles.deleteModalWarning}>
              Are you sure you want to permanently delete{' '}
              <strong>{deleteCandidate.title || deleteCandidate.cloudinaryPublicId}</strong>?
            </p>

            {deleteCandidate.usageCount > 0 ? (
              <div className={styles.activeUsageWarning}>
                <span className={styles.warningIcon}>⚠️</span>
                <div>
                  <strong>
                    This asset is currently in use in {deleteCandidate.usageCount} place(s)!
                  </strong>
                  <p>
                    Deleting this file will remove it from all rooms, gallery, or home sections where
                    it currently appears.
                  </p>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={confirmCascadeDelete}
                      onChange={(e) => setConfirmCascadeDelete(e.target.checked)}
                    />
                    <span>I understand. Remove from all places and delete permanently.</span>
                  </label>
                </div>
              </div>
            ) : (
              <p className={styles.safeDeleteNote}>
                This file is unused. It will be safely removed from Cloudinary and the database.
              </p>
            )}

            <div className={styles.deleteModalActions}>
              <button
                type="button"
                className={styles.cancelDeleteBtn}
                onClick={() => setDeleteCandidate(null)}
                disabled={deleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.confirmDeleteBtn}
                onClick={confirmDelete}
                disabled={deleting || (deleteCandidate.usageCount > 0 && !confirmCascadeDelete)}
              >
                {deleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review 360 Candidates Modal */}
      {showReview360Modal && (
        <div className={styles.reviewModalBackdrop} onClick={() => setShowReview360Modal(false)}>
          <div className={styles.reviewModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.reviewModalHeader}>
              <div>
                <h3 className={styles.reviewModalTitle}>
                  Review 360° Candidates ({candidates360.length})
                </h3>
                <p className={styles.reviewModalSubtitle}>
                  These images have an equirectangular aspect ratio (~2:1). Mark them as 360 so they
                  display as interactive round panorama portals rather than flat grid tiles.
                </p>
              </div>
              <button
                type="button"
                className={styles.closeModalBtn}
                onClick={() => setShowReview360Modal(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className={styles.reviewModalBody}>
              {candidates360.map((candidate) => (
                <div key={candidate._id} className={styles.candidateItemRow}>
                  <img
                    src={candidate.secureUrl}
                    alt={candidate.title || '360 candidate'}
                    className={styles.candidateRowThumb}
                  />
                  <div className={styles.candidateRowDetails}>
                    <strong className={styles.candidateRowTitle}>
                      {candidate.title || candidate.cloudinaryPublicId}
                    </strong>
                    <div className={styles.candidateRowMeta}>
                      {candidate.width} × {candidate.height} px • Ratio: {(candidate.width / candidate.height).toFixed(2)}:1
                    </div>
                  </div>
                  <button
                    type="button"
                    className={styles.candidateRowActionBtn}
                    onClick={() => handleMarkAs360(candidate, true)}
                    disabled={marking360}
                  >
                    Mark as 360
                  </button>
                </div>
              ))}
            </div>

            <div className={styles.reviewModalActions}>
              <button
                type="button"
                className={styles.cancelDeleteBtn}
                onClick={() => setShowReview360Modal(false)}
              >
                Done / Cancel
              </button>
              <button
                type="button"
                className={styles.markAllBtn}
                onClick={handleBulkMarkAll360}
                disabled={marking360 || candidates360.length === 0}
              >
                {marking360 ? 'Marking all...' : `Mark All (${candidates360.length}) as 360`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

