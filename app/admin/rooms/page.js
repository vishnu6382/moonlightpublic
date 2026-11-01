'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './rooms.module.css';
import MediaUpload from '@/components/MediaUpload';
import Pano360Viewer from '@/components/Pano360Viewer';
import AdminPlacementPreview, { FitBadge, OrientationBadge } from '@/components/AdminPlacementPreview';
import MediaLibraryModal from '@/components/MediaLibraryModal';
import { generateSlug } from '@/lib/slug';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';

const COMMON_FACILITIES = [
  'Air-Conditioning',
  'Attached Bathroom',
  'Complimentary Toiletries',
  'Extra long bed',
  'Fully fenced property',
  'Well-ventilated stay',
  'Hot Water',
  'Free Wi-Fi',
  'Flat-screen TV',
  'Daily Housekeeping',
  'Electric Kettle',
];

const COMMON_FEATURES = [
  'Pool Access',
  'Courtyard View',
  'Garden View',
  'Quiet Zone',
  'Balcony',
  'Family Friendly',
  'Campfire Access',
  'Spacious Living',
];

export default function AdminRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Editor state
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // 360 Viewer preview modal state
  const [previewPanoSrc, setPreviewPanoSrc] = useState(null);

  // New tag / facility input states
  const [newFeatureText, setNewFeatureText] = useState('');
  const [newFacilityText, setNewFacilityText] = useState('');

  // Media library picker target ('photos', 'videos', 'pano360')
  const [libraryModalTarget, setLibraryModalTarget] = useState(null);

  const handleLibrarySelect = (selectedItems) => {
    if (!currentRoom || !selectedItems || selectedItems.length === 0) return;

    if (libraryModalTarget === 'photos') {
      const newPhotos = selectedItems.map((m, idx) => ({
        mediaId: m._id,
        src: m.secureUrl,
        alt: m.altText || m.title || currentRoom.name,
        caption: m.caption || '',
        width: m.width || null,
        height: m.height || null,
        focus: m.focus || { x: 50, y: 50 },
        displayAs: m.displayAs || 'auto',
        order: (currentRoom.photos || []).length + idx,
        showOnHome: true,
        showInGallery: true,
      }));
      const updatedPhotos = [...(currentRoom.photos || []), ...newPhotos];
      const updatedMain = currentRoom.mainImage || updatedPhotos[0]?.src || '';
      setCurrentRoom({
        ...currentRoom,
        photos: updatedPhotos,
        mainImage: updatedMain,
      });
    } else if (libraryModalTarget === 'videos') {
      const newVideos = selectedItems.map((m, idx) => ({
        mediaId: m._id,
        src: m.secureUrl,
        poster: m.posterUrl || '',
        title: m.title || '',
        caption: m.caption || '',
        alt: m.altText || m.title || '',
        width: m.width || null,
        height: m.height || null,
        durationSec: m.durationSec || null,
        order: (currentRoom.videos || []).length + idx,
        showOnHome: false,
        showInGallery: false,
      }));
      setCurrentRoom({
        ...currentRoom,
        videos: [...(currentRoom.videos || []), ...newVideos],
      });
    } else if (libraryModalTarget === 'pano360') {
      const m = selectedItems[0];
      if (m) {
        setCurrentRoom({
          ...currentRoom,
          pano360: {
            mediaId: m._id,
            src: m.secureUrl,
            previewSrc: m.secureUrl,
            caption: m.caption || `${currentRoom.name} 360° View`,
            alt: m.altText || m.title || `${currentRoom.name} Panorama`,
            is2to1: true,
            showOnHome: true,
            showInGallery: true,
          },
        });
      }
    }
    setLibraryModalTarget(null);
  };

  // Load rooms from API
  const loadRooms = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const res = await fetch('/api/admin/rooms');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to fetch rooms.');
      }
      const data = await res.json();
      setRooms(data.rooms || []);
    } catch (err) {
      setError(err.message || 'Error fetching rooms.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRooms();
  }, [loadRooms]);

  // Open Create Form
  const handleOpenCreate = () => {
    setCurrentRoom({
      name: '',
      slug: '',
      roomType: 'Deluxe Room',
      bedType: 'Twin Bed',
      maxOccupancy: 3,
      numberOfRooms: 1,
      shortDescription: '',
      description: '',
      features: ['Pool Access', 'Courtyard View'],
      facilities: [
        { name: 'Air-Conditioning', icon: 'ac' },
        { name: 'Attached Bathroom', icon: 'bath' },
        { name: 'Complimentary Toiletries', icon: 'toiletries' },
        { name: 'Extra long bed', icon: 'bed' },
        { name: 'Fully fenced property', icon: 'fence' },
        { name: 'Well-ventilated stay', icon: 'wind' },
      ],
      mainImage: '',
      photos: [],
      videos: [],
      pano360: null,
      order: rooms.length + 1,
      isActive: true, // Default ON (Published) for new rooms
      featuredOnHome: false,
      seoTitle: '',
      seoDescription: '',
    });
    setFormError('');
    setIsEditing(true);
  };

  // Open Edit Form
  const handleOpenEdit = (room) => {
    setCurrentRoom({
      ...room,
      features: Array.isArray(room.features)
        ? room.features.map((ft) => (typeof ft === 'string' ? ft : ft?.name || String(ft))).filter(Boolean)
        : [],
      facilities: Array.isArray(room.facilities)
        ? room.facilities.map((f) => ({
            name: typeof f === 'string' ? f.trim() : (f?.name || '').trim(),
            icon: typeof f === 'object' ? (f?.icon || '') : '',
          })).filter((f) => f.name)
        : [],
      photos: Array.isArray(room.photos) ? [...room.photos] : [],
      videos: Array.isArray(room.videos) ? [...room.videos] : [],
      pano360: room.pano360 ? { ...room.pano360 } : null,
    });
    setFormError('');
    setIsEditing(true);
  };

  // Save Room (Create or Update)
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!currentRoom.name.trim()) {
      setFormError('Room name is required.');
      return;
    }

    const hasPhoto = Boolean(currentRoom.mainImage || (currentRoom.photos && currentRoom.photos.length > 0));
    if (currentRoom.isActive && !hasPhoto) {
      setFormError('A room cannot be published without at least one photo. Please upload a main image first or uncheck Published.');
      return;
    }

    setSaving(true);
    setFormError('');
    setSuccessMsg('');

    try {
      // Auto-commit pending custom facility text if typed without clicking 'Add Facility'
      let finalFacilities = Array.isArray(currentRoom.facilities) ? [...currentRoom.facilities] : [];
      if (newFacilityText && newFacilityText.trim()) {
        const parts = newFacilityText.trim().split(',').map((s) => s.trim()).filter(Boolean);
        parts.forEach((part) => {
          const exists = finalFacilities.some((f) => {
            const n = typeof f === 'string' ? f : f?.name;
            return n && n.toLowerCase() === part.toLowerCase();
          });
          if (!exists) finalFacilities.push({ name: part, icon: '' });
        });
        setNewFacilityText('');
      }

      // Auto-commit pending custom feature text if typed without clicking 'Add Tag'
      let finalFeatures = Array.isArray(currentRoom.features) ? [...currentRoom.features] : [];
      if (newFeatureText && newFeatureText.trim()) {
        const parts = newFeatureText.trim().split(',').map((s) => s.trim()).filter(Boolean);
        parts.forEach((part) => {
          const exists = finalFeatures.some((ft) => {
            const n = typeof ft === 'string' ? ft : ft?.name;
            return n && n.toLowerCase() === part.toLowerCase();
          });
          if (!exists) finalFeatures.push(part);
        });
        setNewFeatureText('');
      }

      const roomToSave = {
        ...currentRoom,
        facilities: finalFacilities,
        features: finalFeatures,
      };

      const isNew = !currentRoom._id;
      const url = isNew ? '/api/admin/rooms' : `/api/admin/rooms/${currentRoom._id}`;
      const method = isNew ? 'POST' : 'PUT';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(roomToSave),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save room.');
      }

      setSuccessMsg(isNew ? 'Room created successfully!' : 'Room updated successfully!');
      setIsEditing(false);
      setCurrentRoom(null);
      await loadRooms();
    } catch (err) {
      setFormError(err.message || 'Error saving room.');
    } finally {
      setSaving(false);
    }
  };

  // Quick Active/Hidden Toggle
  const handleToggleActive = async (room) => {
    const nextActive = !room.isActive;
    const hasPhoto = Boolean(room.mainImage || (room.photos && room.photos.length > 0));
    if (nextActive && !hasPhoto) {
      setError(`Cannot publish "${room.name}": please upload at least one photo first.`);
      return;
    }

    try {
      const res = await fetch(`/api/admin/rooms/${room._id}/visibility`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: nextActive }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update visibility.');
      }
      setRooms((prev) =>
        prev.map((r) => (r._id === room._id ? { ...r, isActive: nextActive } : r))
      );
    } catch (err) {
      setError(err.message);
    }
  };

  // Quick Reorder (Move Up / Down)
  const handleMoveOrder = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= rooms.length) return;

    const newRooms = [...rooms];
    const temp = newRooms[index];
    newRooms[index] = newRooms[targetIndex];
    newRooms[targetIndex] = temp;

    // Update local orders
    const itemsToUpdate = newRooms.map((r, idx) => ({
      id: r._id,
      order: idx + 1,
    }));

    setRooms(newRooms.map((r, idx) => ({ ...r, order: idx + 1 })));

    try {
      const res = await fetch('/api/admin/rooms/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToUpdate }),
      });
      if (!res.ok) {
        throw new Error('Failed to persist order.');
      }
    } catch (err) {
      setError(err.message);
      await loadRooms();
    }
  };

  // Delete Room
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/rooms/${deleteTarget._id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete room.');
      }
      setSuccessMsg(`Room "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      await loadRooms();
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Facility management in editor
  const toggleFacility = (facilityName) => {
    if (!currentRoom || !facilityName) return;
    const target = facilityName.trim();
    const curr = Array.isArray(currentRoom.facilities) ? [...currentRoom.facilities] : [];
    const exists = curr.some((f) => {
      const n = typeof f === 'string' ? f : f?.name;
      return n && n.toLowerCase() === target.toLowerCase();
    });
    let updated;
    if (exists) {
      updated = curr.filter((f) => {
        const n = typeof f === 'string' ? f : f?.name;
        return n && n.toLowerCase() !== target.toLowerCase();
      });
    } else {
      updated = [...curr, { name: target, icon: '' }];
    }
    setCurrentRoom({ ...currentRoom, facilities: updated });
  };

  const handleAddCustomFacility = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newFacilityText.trim() || !currentRoom) return;
    const raw = newFacilityText.trim();
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const curr = Array.isArray(currentRoom.facilities) ? [...currentRoom.facilities] : [];
    parts.forEach((part) => {
      const exists = curr.some((f) => {
        const n = typeof f === 'string' ? f : f?.name;
        return n && n.toLowerCase() === part.toLowerCase();
      });
      if (!exists) {
        curr.push({ name: part, icon: '' });
      }
    });
    setCurrentRoom({ ...currentRoom, facilities: curr });
    setNewFacilityText('');
  };

  // Features tag management in editor
  const toggleFeature = (featureName) => {
    if (!currentRoom || !featureName) return;
    const target = featureName.trim();
    const curr = Array.isArray(currentRoom.features) ? [...currentRoom.features] : [];
    const exists = curr.some((ft) => {
      const n = typeof ft === 'string' ? ft : ft?.name;
      return n && n.toLowerCase() === target.toLowerCase();
    });
    let updated;
    if (exists) {
      updated = curr.filter((ft) => {
        const n = typeof ft === 'string' ? ft : ft?.name;
        return n && n.toLowerCase() !== target.toLowerCase();
      });
    } else {
      updated = [...curr, target];
    }
    setCurrentRoom({ ...currentRoom, features: updated });
  };

  const handleAddFeature = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!newFeatureText.trim() || !currentRoom) return;
    const raw = newFeatureText.trim();
    const parts = raw.split(',').map((s) => s.trim()).filter(Boolean);
    const curr = Array.isArray(currentRoom.features) ? [...currentRoom.features] : [];
    parts.forEach((part) => {
      const exists = curr.some((ft) => {
        const n = typeof ft === 'string' ? ft : ft?.name;
        return n && n.toLowerCase() === part.toLowerCase();
      });
      if (!exists) {
        curr.push(part);
      }
    });
    setCurrentRoom({ ...currentRoom, features: curr });
    setNewFeatureText('');
  };

  const handleRemoveFeature = (idx) => {
    if (!currentRoom) return;
    const curr = Array.isArray(currentRoom.features) ? currentRoom.features : [];
    setCurrentRoom({
      ...currentRoom,
      features: curr.filter((_, i) => i !== idx),
    });
  };

  // Media association handlers
  const handlePhotoUploaded = (media) => {
    if (!media) return;
    setCurrentRoom((prev) => {
      if (!prev) return prev;
      const newPhoto = {
        mediaId: media._id,
        src: media.secureUrl,
        alt: media.title || prev.name,
        caption: media.caption || '',
        width: media.width || null,
        height: media.height || null,
        focus: media.focus || { x: 50, y: 50 },
        displayAs: media.displayAs || 'auto',
        order: (prev.photos || []).length,
        showOnHome: true,
        showInGallery: true,
      };
      const prevPhotos = prev.photos || [];
      const updatedPhotos = [...prevPhotos, newPhoto];
      const updatedMain = prev.mainImage || newPhoto.src;
      return {
        ...prev,
        photos: updatedPhotos,
        mainImage: updatedMain,
      };
    });
  };

  const handleVideoUploaded = (media) => {
    if (!media) return;
    setCurrentRoom((prev) => {
      if (!prev) return prev;
      const newVideo = {
        mediaId: media._id,
        src: media.secureUrl,
        poster: media.posterUrl || '',
        title: media.title || '',
        caption: media.caption || '',
        alt: media.title || '',
        width: media.width || null,
        height: media.height || null,
        durationSec: media.durationSec || null,
        displayAs: media.displayAs || 'auto',
        order: (prev.videos || []).length,
        showOnHome: false,
        showInGallery: false,
      };
      return {
        ...prev,
        videos: [...(prev.videos || []), newVideo],
      };
    });
  };

  const handlePanoUploaded = (media) => {
    if (!currentRoom || !media) return;
    setCurrentRoom({
      ...currentRoom,
      pano360: {
        mediaId: media._id,
        src: media.secureUrl,
        previewSrc: media.secureUrl,
        caption: media.caption || `${currentRoom.name} 360° View`,
        alt: media.title || `${currentRoom.name} Panorama`,
        is2to1: true,
        showOnHome: true,
        showInGallery: true,
      },
    });
  };

  // Filtered rooms list
  const filteredRooms = rooms.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.slug?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.roomType?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'active' && r.isActive) ||
      (statusFilter === 'hidden' && !r.isActive);

    return matchesSearch && matchesStatus;
  });

  return (
    <div className={styles.container}>
      {/* 360 Viewer Preview Modal */}
      {previewPanoSrc && (
        <Pano360Viewer
          src={previewPanoSrc}
          roomName={currentRoom?.name || 'Panorama Preview'}
          onClose={() => setPreviewPanoSrc(null)}
        />
      )}

      {/* Media Library Picker Modal */}
      <MediaLibraryModal
        isOpen={Boolean(libraryModalTarget)}
        onClose={() => setLibraryModalTarget(null)}
        multiple={libraryModalTarget === 'photos'}
        allowedTypes={
          libraryModalTarget === 'videos'
            ? ['video']
            : libraryModalTarget === 'pano360'
            ? ['pano360']
            : ['image']
        }
        title={
          libraryModalTarget === 'videos'
            ? 'Choose Video from Library'
            : libraryModalTarget === 'pano360'
            ? 'Choose 360° Panorama from Library'
            : 'Choose Photos from Library'
        }
        onSelect={handleLibrarySelect}
      />

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h3 className={styles.modalTitle}>Delete Room</h3>
            <p className={styles.modalText}>
              Are you sure you want to delete <strong>{deleteTarget.name}</strong>?
              <br />
              Associated media files will remain safely preserved in storage and will not be destroyed.
            </p>
            <div className={styles.modalActions}>
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
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.headerTitle}>Rooms Management</h2>
          <p className={styles.headerSub}>
            Manage resort rooms, specifications, cover images, photos, videos, and 360° panoramas.
          </p>
        </div>
        {!isEditing && (
          <button type="button" className={styles.primaryBtn} onClick={handleOpenCreate}>
            + Add New Room
          </button>
        )}
      </div>

      {error && <div className={styles.errorAlert} role="alert">{error}</div>}
      {successMsg && <div className={styles.successAlert} role="status">{successMsg}</div>}

      {/* ============================================================== */}
      {/* ROOM CREATE / EDIT FORM                                       */}
      {/* ============================================================== */}
      {isEditing && currentRoom && (
        <div className={styles.editorCard}>
          <div className={styles.editorHeader}>
            <h3 className={styles.editorTitle}>
              {currentRoom._id ? `Edit ${currentRoom.name}` : 'Create New Room'}
            </h3>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={() => {
                setIsEditing(false);
                setCurrentRoom(null);
              }}
            >
              Cancel
            </button>
          </div>

          {formError && <div className={styles.errorAlert}>{formError}</div>}

          <form onSubmit={handleSaveRoom}>
            {/* 1. Basic Details */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>1. Basic Details</h4>
              <p className={styles.sectionSub}>Room title, type, bed specifications, and URL path.</p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Room Name *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={currentRoom.name}
                    placeholder="e.g. Moon 1 or Executive Suite"
                    onChange={(e) => {
                      const name = e.target.value;
                      const updates = { name };
                      if (!currentRoom._id && (!currentRoom.slug || currentRoom.slug === generateSlug(currentRoom.name))) {
                        updates.slug = generateSlug(name);
                      }
                      setCurrentRoom({ ...currentRoom, ...updates });
                    }}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>URL Slug *</label>
                  <input
                    type="text"
                    required
                    className={styles.input}
                    value={currentRoom.slug}
                    placeholder="e.g. moon-1"
                    onChange={(e) => setCurrentRoom({ ...currentRoom, slug: generateSlug(e.target.value) })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Room Type</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={currentRoom.roomType}
                    placeholder="e.g. Villa Room, Dormitory, Suite"
                    onChange={(e) => setCurrentRoom({ ...currentRoom, roomType: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Bed Details</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={currentRoom.bedType}
                    placeholder="e.g. Twin Bed, King Bed, 4 Bunk Beds"
                    onChange={(e) => setCurrentRoom({ ...currentRoom, bedType: e.target.value })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Max Occupancy (Guests)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    className={styles.input}
                    value={currentRoom.maxOccupancy ?? ''}
                    placeholder="e.g. 3"
                    onChange={(e) =>
                      setCurrentRoom({
                        ...currentRoom,
                        maxOccupancy: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Available Units / Number of Rooms</label>
                  <input
                    type="number"
                    min="1"
                    className={styles.input}
                    value={currentRoom.numberOfRooms ?? ''}
                    placeholder="e.g. 1"
                    onChange={(e) =>
                      setCurrentRoom({
                        ...currentRoom,
                        numberOfRooms: e.target.value ? parseInt(e.target.value, 10) : null,
                      })
                    }
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Display Order</label>
                  <input
                    type="number"
                    min="0"
                    className={styles.input}
                    value={currentRoom.order ?? 0}
                    onChange={(e) => setCurrentRoom({ ...currentRoom, order: parseInt(e.target.value, 10) || 0 })}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Publish Status</label>
                  <label className={styles.checkboxRow} style={{ marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={currentRoom.isActive}
                      onChange={(e) => {
                        const nextVal = e.target.checked;
                        const hasCover = Boolean(currentRoom.mainImage || (currentRoom.photos && currentRoom.photos.length > 0));
                        if (nextVal && !hasCover) {
                          setFormError('A room cannot be published without at least one photo. Please upload a main image first.');
                          return;
                        }
                        setFormError('');
                        setCurrentRoom({ ...currentRoom, isActive: nextVal });
                      }}
                    />
                    <span><strong>Published</strong> (visible on public site)</span>
                  </label>
                  {!currentRoom.mainImage && (!currentRoom.photos || currentRoom.photos.length === 0) && (
                    <p style={{ fontSize: '12px', color: '#D9534F', margin: '6px 0 0', fontWeight: 600 }}>
                      ⚠️ Upload at least one photo before publishing this room.
                    </p>
                  )}
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>Home Page Feature</label>
                  <label className={styles.checkboxRow} style={{ marginTop: '0.5rem' }}>
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={Boolean(currentRoom.featuredOnHome)}
                      onChange={(e) => setCurrentRoom({ ...currentRoom, featuredOnHome: e.target.checked })}
                    />
                    <span><strong>Featured on Home</strong> (show in "Our Room Types" section)</span>
                  </label>
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Short Description</label>
                  <textarea
                    rows={2}
                    className={styles.textarea}
                    value={currentRoom.shortDescription}
                    placeholder="Brief description for room listings and cards"
                    onChange={(e) => setCurrentRoom({ ...currentRoom, shortDescription: e.target.value })}
                  />
                </div>

                <div className={styles.formGroupFull}>
                  <label className={styles.label}>Full Description</label>
                  <textarea
                    rows={4}
                    className={styles.textarea}
                    value={currentRoom.description}
                    placeholder="Detailed room description shown on the Room Details page"
                    onChange={(e) => setCurrentRoom({ ...currentRoom, description: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* 2. Features & Facilities */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>2. Features & Facilities</h4>
              <p className={styles.sectionSub}>Select available facilities and add specialty feature tags.</p>

              {/* A. Room Facilities */}
              <div className={styles.formGroup}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className={styles.label} style={{ margin: 0 }}>Room Facilities</label>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    {(currentRoom.facilities || []).length} selected
                  </span>
                </div>

                {/* Selected Facilities Pills */}
                {(currentRoom.facilities || []).length > 0 && (
                  <div className={styles.tagContainer} style={{ marginBottom: '0.75rem' }}>
                    {currentRoom.facilities.map((fac, idx) => {
                      const facName = typeof fac === 'string' ? fac : (fac?.name || '');
                      if (!facName) return null;
                      return (
                        <span key={idx} className={styles.tagPill} style={{ background: '#f0fdf4', borderColor: '#86efac', color: '#166534' }}>
                          <span>✓ {facName}</span>
                          <button
                            type="button"
                            className={styles.tagRemoveBtn}
                            onClick={() => toggleFacility(facName)}
                            aria-label={`Remove ${facName}`}
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Common Facility Quick Toggle Grid */}
                <div className={styles.facilityGrid}>
                  {COMMON_FACILITIES.map((facName) => {
                    const isSelected = (currentRoom.facilities || []).some((f) => {
                      const n = typeof f === 'string' ? f : f?.name;
                      return n && n.toLowerCase() === facName.toLowerCase();
                    });
                    return (
                      <div
                        key={facName}
                        className={`${styles.facilityChip} ${isSelected ? styles.facilityChipActive : ''}`}
                        onClick={() => toggleFacility(facName)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{facName}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Facility Input */}
                <div className={styles.addTagRow}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Add custom facility (e.g. Swimming Pool, Geyser)..."
                    value={newFacilityText}
                    onChange={(e) => setNewFacilityText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomFacility(e);
                      }
                    }}
                  />
                  <button type="button" className={styles.actionBtn} onClick={handleAddCustomFacility}>
                    Add Facility
                  </button>
                </div>
              </div>

              {/* B. Specialty Feature Tags */}
              <div className={styles.formGroup} style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                  <label className={styles.label} style={{ margin: 0 }}>Specialty Feature Tags</label>
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280' }}>
                    {(currentRoom.features || []).length} active
                  </span>
                </div>

                {/* Selected Features Pills */}
                {(currentRoom.features || []).length > 0 && (
                  <div className={styles.tagContainer} style={{ marginBottom: '0.75rem' }}>
                    {currentRoom.features.map((ft, idx) => {
                      const ftName = typeof ft === 'string' ? ft : (ft?.name || String(ft));
                      return (
                        <span key={idx} className={styles.tagPill} style={{ background: '#eff6ff', borderColor: '#bfdbfe', color: '#1e40af' }}>
                          <span>✦ {ftName}</span>
                          <button
                            type="button"
                            className={styles.tagRemoveBtn}
                            onClick={() => handleRemoveFeature(idx)}
                            aria-label={`Remove ${ftName}`}
                          >
                            &times;
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Common Feature Tag Quick Toggle Grid */}
                <div className={styles.facilityGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))' }}>
                  {COMMON_FEATURES.map((ftName) => {
                    const isSelected = (currentRoom.features || []).some((ft) => {
                      const n = typeof ft === 'string' ? ft : ft?.name;
                      return n && n.toLowerCase() === ftName.toLowerCase();
                    });
                    return (
                      <div
                        key={ftName}
                        className={`${styles.facilityChip} ${isSelected ? styles.facilityChipActive : ''}`}
                        onClick={() => toggleFeature(ftName)}
                        style={{ cursor: 'pointer' }}
                      >
                        <span>{isSelected ? '✓' : '+'}</span>
                        <span>{ftName}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Feature Tag Input */}
                <div className={styles.addTagRow}>
                  <input
                    type="text"
                    className={styles.input}
                    placeholder="Add feature tag (e.g. Garden View, Quiet Zone)..."
                    value={newFeatureText}
                    onChange={(e) => setNewFeatureText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddFeature(e);
                      }
                    }}
                  />
                  <button type="button" className={styles.actionBtn} onClick={handleAddFeature}>
                    Add Tag
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Photos & Cover Selection */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>3. Room Photos & Cover Image</h4>
              <p className={styles.sectionSub}>
                Upload photographs at original quality. Select any uploaded photo as the main cover image.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={styles.chooseLibraryBtn}
                  onClick={() => setLibraryModalTarget('photos')}
                >
                  📁 Choose from Media Library
                </button>
              </div>

              <MediaUpload
                mediaType="image"
                multiple={true}
                roomId={currentRoom._id || null}
                onSuccess={handlePhotoUploaded}
              />

              {currentRoom.photos.length > 0 && (
                <div className={styles.mediaCardsGrid}>
                  {currentRoom.photos.map((photo, pIdx) => {
                    const isCover = currentRoom.mainImage === photo.src;
                    return (
                      <div key={pIdx} className={styles.mediaCard}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photo.src} alt={photo.alt || 'Room photo'} className={styles.mediaCardThumb} />
                        <div className={styles.mediaCardBody}>
                          <div className={styles.tagRow}>
                            <OrientationBadge width={photo.width} height={photo.height} isVideo={false} />
                            <FitBadge cropPercent={0} />
                            <span style={{ fontSize: '0.7rem', color: '#6B7280', marginLeft: 'auto' }}>
                              #{pIdx + 1}
                            </span>
                          </div>
                          {isCover && <span className={styles.coverBadge}>★ Cover Image</span>}
                          <input
                            type="text"
                            placeholder="Alt text"
                            className={styles.mediaInput}
                            value={photo.alt}
                            onChange={(e) => {
                              const updated = [...currentRoom.photos];
                              updated[pIdx].alt = e.target.value;
                              setCurrentRoom({ ...currentRoom, photos: updated });
                            }}
                          />
                          <input
                            type="text"
                            placeholder="Caption"
                            className={styles.mediaInput}
                            value={photo.caption}
                            onChange={(e) => {
                              const updated = [...currentRoom.photos];
                              updated[pIdx].caption = e.target.value;
                              setCurrentRoom({ ...currentRoom, photos: updated });
                            }}
                          />
                          <div className={styles.mediaToggles}>
                            <label className={styles.checkboxRow}>
                              <input
                                type="checkbox"
                                checked={photo.showOnHome}
                                onChange={(e) => {
                                  const updated = [...currentRoom.photos];
                                  updated[pIdx].showOnHome = e.target.checked;
                                  setCurrentRoom({ ...currentRoom, photos: updated });
                                }}
                              />
                              <span>Show on Home</span>
                            </label>
                            <label className={styles.checkboxRow}>
                              <input
                                type="checkbox"
                                checked={photo.showInGallery}
                                onChange={(e) => {
                                  const updated = [...currentRoom.photos];
                                  updated[pIdx].showInGallery = e.target.checked;
                                  setCurrentRoom({ ...currentRoom, photos: updated });
                                }}
                              />
                              <span>Show in Gallery</span>
                            </label>
                          </div>
                          <div className={styles.mediaActions}>
                            {pIdx > 0 && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => {
                                  const updated = [...currentRoom.photos];
                                  const temp = updated[pIdx - 1];
                                  updated[pIdx - 1] = updated[pIdx];
                                  updated[pIdx] = temp;
                                  setCurrentRoom({ ...currentRoom, photos: updated });
                                }}
                                title="Move photo up"
                              >
                                ↑
                              </button>
                            )}
                            {pIdx < currentRoom.photos.length - 1 && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => {
                                  const updated = [...currentRoom.photos];
                                  const temp = updated[pIdx + 1];
                                  updated[pIdx + 1] = updated[pIdx];
                                  updated[pIdx] = temp;
                                  setCurrentRoom({ ...currentRoom, photos: updated });
                                }}
                                title="Move photo down"
                              >
                                ↓
                              </button>
                            )}
                            {!isCover && (
                              <button
                                type="button"
                                className={styles.actionBtn}
                                onClick={() => setCurrentRoom({ ...currentRoom, mainImage: photo.src })}
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              className={styles.dangerBtn}
                              onClick={() => {
                                const updated = currentRoom.photos.filter((_, i) => i !== pIdx);
                                const newMain = isCover ? (updated[0]?.src || '') : currentRoom.mainImage;
                                setCurrentRoom({ ...currentRoom, photos: updated, mainImage: newMain });
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 4. Videos */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>4. Room Videos</h4>
              <p className={styles.sectionSub}>Upload MP4 or WebM video under 100 MB.</p>

              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                <button
                  type="button"
                  className={styles.chooseLibraryBtn}
                  onClick={() => setLibraryModalTarget('videos')}
                >
                  📁 Choose from Media Library
                </button>
              </div>

              <MediaUpload
                mediaType="video"
                multiple={false}
                roomId={currentRoom._id || null}
                onSuccess={handleVideoUploaded}
              />

              {currentRoom.videos.length > 0 && (
                <div className={styles.mediaCardsGrid}>
                  {currentRoom.videos.map((vid, vIdx) => (
                    <div key={vIdx} className={styles.mediaCard}>
                      <video
                        src={getOptimizedVideoUrl(vid.src, { maxWidth: 640 })}
                        poster={getOptimizedPosterUrl(vid.src, vid.poster)}
                        className={styles.mediaCardThumb}
                        controls
                        preload="metadata"
                      />
                      <div className={styles.mediaCardBody}>
                        <input
                          type="text"
                          placeholder="Video Title"
                          className={styles.mediaInput}
                          value={vid.title}
                          onChange={(e) => {
                            const updated = [...currentRoom.videos];
                            updated[vIdx].title = e.target.value;
                            setCurrentRoom({ ...currentRoom, videos: updated });
                          }}
                        />
                        <div className={styles.mediaToggles}>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={vid.showOnHome}
                              onChange={(e) => {
                                const updated = [...currentRoom.videos];
                                updated[vIdx].showOnHome = e.target.checked;
                                setCurrentRoom({ ...currentRoom, videos: updated });
                              }}
                            />
                            <span>Show on Home</span>
                          </label>
                          <label className={styles.checkboxRow}>
                            <input
                              type="checkbox"
                              checked={vid.showInGallery}
                              onChange={(e) => {
                                const updated = [...currentRoom.videos];
                                updated[vIdx].showInGallery = e.target.checked;
                                setCurrentRoom({ ...currentRoom, videos: updated });
                              }}
                            />
                            <span>Show in Gallery</span>
                          </label>
                        </div>
                        <div className={styles.mediaActions}>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => {
                              const updated = currentRoom.videos.filter((_, i) => i !== vIdx);
                              setCurrentRoom({ ...currentRoom, videos: updated });
                            }}
                          >
                            Remove Video
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. 360° Panorama */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>5. 360° Equirectangular Panorama</h4>
              <p className={styles.sectionSub}>
                Upload a 2:1 ratio panorama image. Connects directly to the existing 360° interactive sphere viewer.
              </p>

              {!currentRoom.pano360?.src ? (
                <>
                  <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    <button
                      type="button"
                      className={styles.chooseLibraryBtn}
                      onClick={() => setLibraryModalTarget('pano360')}
                    >
                      📁 Choose 360° from Media Library
                    </button>
                  </div>
                  <MediaUpload
                    mediaType="pano360"
                    multiple={false}
                    roomId={currentRoom._id || null}
                    onSuccess={handlePanoUploaded}
                  />
                  <input
                    type="url"
                    className={styles.input}
                    style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}
                    placeholder="Or enter 360 image URL: https://res.cloudinary.com/..."
                    value={currentRoom.pano360?.src || ''}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      if (val) {
                        setCurrentRoom({
                          ...currentRoom,
                          pano360: {
                            mediaId: null,
                            src: val,
                            previewSrc: val,
                            caption: `${currentRoom.name} 360° View`,
                            alt: `${currentRoom.name} Panorama`,
                            is2to1: true,
                            showOnHome: true,
                            showInGallery: true,
                          },
                        });
                      }
                    }}
                  />
                </>
              ) : (
                <div className={styles.panoPreviewBox}>
                  <div className={styles.panoHeader}>
                    <div>
                      <span className={styles.badge} style={{ background: '#e0e7ff', color: '#3730a3' }}>
                        360° Panorama Active
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className={styles.actionBtn}
                        onClick={() => setPreviewPanoSrc(currentRoom.pano360.src)}
                      >
                        Preview in 360° Viewer
                      </button>
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() => setCurrentRoom({ ...currentRoom, pano360: null })}
                      >
                        Remove 360°
                      </button>
                    </div>
                  </div>

                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentRoom.pano360.src}
                    alt="Panorama equirectangular projection"
                    style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '4px' }}
                  />

                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={currentRoom.pano360.showOnHome}
                        onChange={(e) =>
                          setCurrentRoom({
                            ...currentRoom,
                            pano360: { ...currentRoom.pano360, showOnHome: e.target.checked },
                          })
                        }
                      />
                      <span>Show on Home</span>
                    </label>
                    <label className={styles.checkboxRow}>
                      <input
                        type="checkbox"
                        checked={currentRoom.pano360.showInGallery}
                        onChange={(e) =>
                          setCurrentRoom({
                            ...currentRoom,
                            pano360: { ...currentRoom.pano360, showInGallery: e.target.checked },
                          })
                        }
                      />
                      <span>Show in Gallery</span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Live Placement Preview Panel (Desktop 1440 & Mobile 390) */}
            <AdminPlacementPreview
              items={[
                ...(currentRoom.photos || []),
                ...(currentRoom.videos || []).map((v) => ({ ...v, type: 'video' })),
              ]}
              roomName={currentRoom.name || 'Room'}
              hasPano360={Boolean(currentRoom.pano360?.src)}
              panoPreviewSrc={currentRoom.pano360?.src || ''}
              onUpdateFocus={(idx, focus) => {
                if (idx < currentRoom.photos.length) {
                  const updated = [...currentRoom.photos];
                  updated[idx] = { ...updated[idx], focus };
                  setCurrentRoom({ ...currentRoom, photos: updated });
                }
              }}
              onUpdateDisplayAs={(idx, displayAs) => {
                if (idx < currentRoom.photos.length) {
                  const updated = [...currentRoom.photos];
                  updated[idx] = { ...updated[idx], displayAs };
                  setCurrentRoom({ ...currentRoom, photos: updated });
                }
              }}
            />

            {/* 6. SEO Settings */}
            <div className={styles.sectionBlock}>
              <h4 className={styles.sectionTitle}>6. SEO Settings (Optional)</h4>
              <p className={styles.sectionSub}>Custom meta title and description for search engines.</p>
              <div className={styles.formGrid}>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>SEO Page Title</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={currentRoom.seoTitle}
                    placeholder="e.g. Moon 1 | Moon Light Resort Nedungulam"
                    onChange={(e) => setCurrentRoom({ ...currentRoom, seoTitle: e.target.value })}
                  />
                </div>
                <div className={styles.formGroupFull}>
                  <label className={styles.label}>SEO Meta Description</label>
                  <textarea
                    rows={2}
                    className={styles.textarea}
                    value={currentRoom.seoDescription}
                    placeholder="Brief description for search engine results"
                    onChange={(e) => setCurrentRoom({ ...currentRoom, seoDescription: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Editor Actions */}
            <div className={styles.editorActions}>
              <button
                type="button"
                className={styles.secondaryBtn}
                onClick={() => {
                  setIsEditing(false);
                  setCurrentRoom(null);
                }}
                disabled={saving}
              >
                Cancel
              </button>
              <button type="submit" className={styles.primaryBtn} disabled={saving}>
                {saving ? 'Saving Room...' : 'Save Room'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ============================================================== */}
      {/* ROOMS TABLE LIST VIEW                                          */}
      {/* ============================================================== */}
      {!isEditing && (
        <>
          <div className={styles.controlsRow}>
            <input
              type="text"
              placeholder="Search by name, slug, or type..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Rooms ({rooms.length})</option>
              <option value="active">Active Only</option>
              <option value="hidden">Hidden Only</option>
            </select>
          </div>

          <div className={styles.tableCard}>
            {loading ? (
              <div className={styles.emptyState}>Loading rooms from database...</div>
            ) : filteredRooms.length === 0 ? (
              <div className={styles.emptyState}>
                {searchQuery || statusFilter !== 'all'
                  ? 'No rooms match your filter.'
                  : 'No rooms found in database. Click "+ Add New Room" to create one.'}
              </div>
            ) : (
              <table className={styles.roomsTable}>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Room</th>
                    <th>Type & Specs</th>
                    <th>Media Assets</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRooms.map((room, idx) => (
                    <tr key={room._id}>
                      <td style={{ width: '80px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ padding: '0.125rem 0.375rem' }}
                            disabled={idx === 0}
                            onClick={() => handleMoveOrder(idx, -1)}
                            aria-label="Move up"
                          >
                            ▲
                          </button>
                          <span style={{ fontWeight: 600, fontSize: '0.8125rem', minWidth: '16px', textAlign: 'center' }}>
                            {room.order ?? idx + 1}
                          </span>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            style={{ padding: '0.125rem 0.375rem' }}
                            disabled={idx === filteredRooms.length - 1}
                            onClick={() => handleMoveOrder(idx, 1)}
                            aria-label="Move down"
                          >
                            ▼
                          </button>
                        </div>
                      </td>
                      <td>
                        <div className={styles.roomCell}>
                          {room.mainImage ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={room.mainImage} alt={room.name} className={styles.roomThumb} />
                          ) : (
                            <div className={styles.roomThumbPlaceholder}>No Cover</div>
                          )}
                          <div>
                            <div className={styles.roomMetaName}>{room.name}</div>
                            <div className={styles.roomMetaSlug}>/{room.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8125rem', color: '#111827' }}>
                          {room.roomType || 'Standard'} • {room.bedType || 'Standard Bed'}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                          {room.maxOccupancy ? `Max ${room.maxOccupancy} guests` : 'Capacity not set'}
                          {room.numberOfRooms ? ` • ${room.numberOfRooms} units` : ''}
                        </div>
                      </td>
                      <td>
                        <span className={styles.mediaPill}>📷 {room.photos?.length || 0} Photos</span>
                        {room.videos?.length > 0 && (
                          <span className={styles.mediaPill}>🎥 {room.videos.length} Videos</span>
                        )}
                        {room.pano360?.src && (
                          <span className={styles.mediaPill} style={{ background: '#e0e7ff', color: '#3730a3' }}>
                            🌐 360° Active
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`${styles.badge} ${room.isActive ? styles.badgeActive : styles.badgeHidden}`}
                          onClick={() => handleToggleActive(room)}
                          title="Click to toggle visibility"
                          style={{ border: 'none', cursor: 'pointer' }}
                        >
                          {room.isActive ? 'Active' : 'Hidden'}
                        </button>
                      </td>
                      <td>
                        <div className={styles.tableActions}>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenEdit(room)}
                          >
                            Edit
                          </button>
                          <a
                            href={`/rooms/${room.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.actionBtn}
                          >
                            View
                          </a>
                          <button
                            type="button"
                            className={styles.dangerBtn}
                            onClick={() => setDeleteTarget(room)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
