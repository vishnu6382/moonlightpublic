'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { getOrientationTag } from '@/lib/media';
import styles from './MediaLibraryModal.module.css';

/**
 * MediaLibraryModal
 * Reusable modal for picking existing assets from the shared Media Library
 * without duplicating files. Supports search, type filters, unused filter,
 * single & multi-selection, and shows usage counts.
 */
export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelect, // (selectedItems: Array<MediaItem>) => void
  multiple = false,
  allowedTypes = ['image', 'video', 'pano360'],
  title = 'Choose from Media Library',
  currentRoomId = null,
}) {
  const isPanoOnly = allowedTypes.length === 1 && allowedTypes[0] === 'pano360';
  const [mediaList, setMediaList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState(isPanoOnly ? '360' : 'all');
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [error, setError] = useState('');

  // Fetch media items from library
  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const activeFilter = isPanoOnly ? '360' : typeFilter;
      const params = new URLSearchParams({ limit: '100' });
      if (searchQuery) params.set('q', searchQuery);
      if (activeFilter !== 'all') params.set('type', activeFilter);

      const res = await fetch(`/api/admin/media?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to load media library');
      const data = await res.json();
      let list = data.media || [];
      if (isPanoOnly) {
        list = list.filter((m) => m.is360 === true || m.mediaType === 'pano360');
      }
      setMediaList(list);
    } catch (err) {
      setError(err.message || 'Error fetching media');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter, isPanoOnly]);

  useEffect(() => {
    if (isOpen) {
      setTypeFilter(isPanoOnly ? '360' : 'all');
      setSelectedIds(new Set());
    }
  }, [isOpen, isPanoOnly]);

  if (!isOpen) return null;

  const toggleSelect = (item) => {
    const id = item._id;
    if (!multiple) {
      // Single select: immediate select or set selected
      setSelectedIds(new Set([id]));
      return;
    }

    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleConfirm = () => {
    const selectedItems = mediaList.filter((m) => selectedIds.has(m._id));
    if (selectedItems.length > 0) {
      onSelect(selectedItems);
    }
    onClose();
  };

  return (
    <div className={styles.modalBackdrop} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className={styles.modalHeader}>
          <div>
            <h3 className={styles.modalTitle}>{title}</h3>
            <p className={styles.modalSubtitle}>
              Reuse existing uploaded media without taking extra storage space.
            </p>
          </div>
          <button type="button" className={styles.closeBtn} onClick={onClose} aria-label="Close modal">
            &times;
          </button>
        </div>

        {/* Toolbar: Search & Type Filters */}
        <div className={styles.toolbar}>
          <div className={styles.searchBox}>
            <span className={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search by title, alt text, or tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.clearSearchBtn}
                onClick={() => setSearchQuery('')}
              >
                &times;
              </button>
            )}
          </div>

          <div className={styles.typeFilterGroup}>
            {!isPanoOnly && (
              <button
                type="button"
                className={`${styles.filterChip} ${typeFilter === 'all' ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter('all')}
              >
                All
              </button>
            )}
            {!isPanoOnly && allowedTypes.includes('image') && (
              <button
                type="button"
                className={`${styles.filterChip} ${typeFilter === 'photo' ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter('photo')}
              >
                Photos
              </button>
            )}
            {!isPanoOnly && allowedTypes.includes('video') && (
              <button
                type="button"
                className={`${styles.filterChip} ${typeFilter === 'video' ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter('video')}
              >
                Videos
              </button>
            )}
            {allowedTypes.includes('pano360') && (
              <button
                type="button"
                className={`${styles.filterChip} ${isPanoOnly || typeFilter === '360' ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter('360')}
              >
                360° Panoramas
              </button>
            )}
            {!isPanoOnly && (
              <button
                type="button"
                className={`${styles.filterChip} ${typeFilter === 'unused' ? styles.chipActive : ''}`}
                onClick={() => setTypeFilter('unused')}
              >
                Unused Only
              </button>
            )}
          </div>
        </div>

        {/* Body Grid */}
        <div className={styles.gridContainer}>
          {loading && (
            <div className={styles.statusBox}>
              <div className={styles.spinner} />
              <span>Loading media library...</span>
            </div>
          )}

          {error && <div className={styles.errorBanner}>{error}</div>}

          {!loading && !error && mediaList.length === 0 && (
            <div className={styles.emptyBox}>
              <span>📁 No media items match the current search or filter.</span>
            </div>
          )}

          {!loading && mediaList.length > 0 && (
            <div className={styles.mediaGrid}>
              {mediaList.map((item) => {
                const isSelected = selectedIds.has(item._id);
                const isVideo = item.mediaType === 'video' || item.resourceType === 'video';
                const tag = getOrientationTag(item.width, item.height, isVideo);
                const usageCount = item.usageCount || 0;

                return (
                  <div
                    key={item._id}
                    className={`${styles.mediaCard} ${isSelected ? styles.cardSelected : ''}`}
                    onClick={() => toggleSelect(item)}
                    role="checkbox"
                    aria-checked={isSelected}
                    tabIndex={0}
                  >
                    {/* Media thumbnail */}
                    <div className={styles.thumbWrap}>
                      {isVideo ? (
                        <div className={styles.videoThumb}>
                          <span className={styles.playIcon}>▶</span>
                          {item.posterUrl && <img src={item.posterUrl} alt={item.title || 'Video'} />}
                        </div>
                      ) : (
                        <img
                          src={item.secureUrl}
                          alt={item.altText || item.title || 'Library item'}
                          loading="lazy"
                        />
                      )}

                      {/* Orientation tag badge */}
                      <span className={styles.orientationTag}>{tag}</span>

                      {/* Selection indicator checkmark */}
                      <div className={styles.checkIndicator}>
                        {isSelected && <span>✓</span>}
                      </div>

                      {/* Usage counter pill */}
                      <span
                        className={`${styles.usagePill} ${
                          usageCount === 0 ? styles.usageZero : styles.usageActive
                        }`}
                        title={
                          usageCount > 0
                            ? `Used in ${usageCount} places across the site`
                            : 'Not used in any active sections yet'
                        }
                      >
                        {usageCount > 0 ? `Used in ${usageCount}` : 'Unused'}
                      </span>
                    </div>

                    {/* Meta info footer */}
                    <div className={styles.cardFooter}>
                      <span className={styles.cardTitle} title={item.title || item.cloudinaryPublicId}>
                        {item.title || item.cloudinaryPublicId?.split('/').pop() || 'Untitled'}
                      </span>
                      {item.width && item.height && (
                        <span className={styles.cardDim}>
                          {item.width}×{item.height}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className={styles.modalFooter}>
          <div className={styles.footerInfo}>
            <span>
              {selectedIds.size} {selectedIds.size === 1 ? 'item' : 'items'} selected
            </span>
          </div>

          <div className={styles.footerActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button
              type="button"
              className={styles.confirmBtn}
              onClick={handleConfirm}
              disabled={selectedIds.size === 0}
            >
              {multiple ? `Add Selected (${selectedIds.size})` : 'Choose Item'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

