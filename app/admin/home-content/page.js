'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MediaUpload from '@/components/MediaUpload';
import ReviewsSection from '@/components/AdminEmbedded/ReviewsSection';
import NearbySection from '@/components/AdminEmbedded/NearbySection';
import EventsSection from '@/components/AdminEmbedded/EventsSection';
import SettingsSection from '@/components/AdminEmbedded/SettingsSection';
import { getOptimizedVideoUrl, getOptimizedPosterUrl } from '@/lib/videoOptimizer';
import styles from './home-content.module.css';

const DEFAULT_STAY = {
  label: 'MOON LIGHT RESORT · NEDUNGULAM, TAMIL NADU',
  title: 'Together Time in Nedungulam',
  heading: 'Where calm landscapes meet warm hospitality',
  paragraph:
    'Surrounded by open nature and tranquil breezes, Moon Light Resort is designed for families and groups who want privacy, comfort, and shared memories without rush.',
  checkInTime: '13:00',
  checkOutTime: '11:00',
  featurePills: ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
  stats: [
    {
      label: 'Villa Rooms & Dorms',
      value: '10 Rooms Available',
      icon: 'bed',
      link: '/rooms',
    },
    {
      label: 'Clean Swimming Pool',
      value: 'Family & Group Safe',
      icon: 'pool',
      link: '/gallery',
    },
  ],
  tallPhoto: {
    url: '',
    src: '',
    mediaId: null,
    alt: 'Moon Light Resort pool and villa grounds',
  },
  video: {
    src: '',
    mediaId: null,
    title: 'Watch Resort Video',
    subtitle: 'See pool, villas and open spaces',
    duration: '0:45',
    poster: '',
  },
  infoTile: {
    image: '',
    mediaId: null,
    badge: 'Timings',
    title: 'Check-in & Check-out',
    subtitle: 'Check-in 13:00 · Check-out 11:00',
  },
};

const DEFAULT_INTRO = {
  eyebrow: 'NEDUNGULAM • TAMIL NADU',
  headingLine1: 'Together Time',
  headingLine2: 'In Nedungulam',
  description:
    'A peaceful resort nestled in the countryside, welcoming families and groups for reunions, celebrations, and calm escapes.',
  ctaText: 'Explore Rooms →',
  ctaHref: '#rooms',
  welcomeSubtitle: 'PEACEFUL NATURE RETREAT',
  welcomeTitle: 'WELCOME TO MOON LIGHT',
};

const DEFAULT_FACILITIES = {
  title: 'Facilities',
  subtitle: 'Comfort-first stay essentials.',
  badge: 'Thoughtful Amenities',
  featuredTitle: 'All Essentials For A Relaxing Stay',
  featuredText:
    'From air conditioning and full power backup to a clean swimming pool and dining space.',
  image: '',
  mediaId: null,
  groups: [
    {
      id: 'comfort',
      name: 'Comfort',
      items: [
        { name: 'Air conditioning', icon: 'ac', group: 'Comfort' },
        { name: 'Power Backup', icon: 'power', group: 'Comfort' },
        { name: 'Free Wifi', icon: 'wifi', group: 'Comfort' },
      ],
    },
    {
      id: 'food',
      name: 'Food',
      items: [
        { name: 'Breakfast', icon: 'coffee', group: 'Food' },
        { name: 'Dining Area', icon: 'utensils', group: 'Food' },
        { name: 'Fully equipped Kitchen', icon: 'kitchen', group: 'Food' },
      ],
    },
    {
      id: 'space-stay',
      name: 'Space & Stay',
      items: [
        { name: 'Ample Parking', icon: 'parking', group: 'Space & Stay' },
        { name: 'Conference Hall', icon: 'hall', group: 'Space & Stay' },
        { name: 'Family-friendly', icon: 'family', group: 'Space & Stay' },
        { name: 'Luxury Camping', icon: 'tent', group: 'Space & Stay' },
      ],
    },
    {
      id: 'extras',
      name: 'Extras',
      items: [
        { name: 'Local Experiences', icon: 'compass', group: 'Extras' },
        { name: 'Long Stay Discounts', icon: 'discount', group: 'Extras' },
      ],
    },
  ],
};

const DEFAULT_SHOWCASE = {
  title: 'Captured Moments of Serenity',
  subtitle: 'Villas, pool and open spaces at Moon Light Resort.',
  pills: ['Villa rooms', 'Dorms', 'Clean pool', 'Open spaces'],
  portalItem: {
    mediaId: null,
    src: '',
    alt: 'Moon Light Resort Pool and Grounds',
    title: 'Moon Light Resort',
    is360: false,
  },
  items: [
    { slotNumber: 1, src: '', alt: 'Resort entrance', caption: 'Resort Grounds', isVideoSlot: false },
    { slotNumber: 2, src: '', alt: 'Garden walkway', caption: 'Nature Pathway', isVideoSlot: false },
    { slotNumber: 3, src: '', alt: 'Swimming pool', caption: 'Clean Pool', isVideoSlot: true },
    { slotNumber: 4, src: '', alt: 'Open outdoor spaces', caption: 'Open Spaces', isVideoSlot: false },
    { slotNumber: 5, src: '', alt: 'Villa architecture', caption: 'Villa View', isVideoSlot: true },
    { slotNumber: 6, src: '', alt: 'Evening lighting', caption: 'Night Lights', isVideoSlot: true },
    { slotNumber: 7, src: '', alt: 'Recreation area', caption: 'Recreation Area', isVideoSlot: false },
    { slotNumber: 8, src: '', alt: 'Resort amenities', caption: 'Resort Amenities', isVideoSlot: false },
  ],
};

const DEFAULT_LOGO = {
  url: '',
  mediaId: null,
  alt: 'Moon Light Resort',
  showText: true,
};

const SLOT_NAMES = [
  'Slot 1: Center Hero Tile (Top Large Photo)',
  'Slot 2: Connector Tile (Left of Portal)',
  'Slot 3: Connector Tile (Right of Portal)',
  'Slot 4: Left Side Tile (Top)',
  'Slot 5: Right Side Tile (Tall Full Column)',
  'Slot 6: Left Side Tile (Bottom)',
  'Slot 7: Right Side Tile (Center-Right)',
  'Slot 8: Additional Bento Tile (Bottom Row)',
];

export default function HomeContentPage() {
  const [activeTab, setActiveTab] = useState('stay'); // 'stay' | 'intro' | 'facilities' | 'showcase' | 'rooms' | 'reviews' | 'nearby' | 'events' | 'logo' | 'settings'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // State
  const [logo, setLogo] = useState(DEFAULT_LOGO);
  const [stay, setStay] = useState(DEFAULT_STAY);
  const [intro, setIntro] = useState(DEFAULT_INTRO);
  const [showcase, setShowcase] = useState(DEFAULT_SHOWCASE);
  const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);

  // New pill input state
  const [newStayPill, setNewStayPill] = useState('');
  const [newShowcasePill, setNewShowcasePill] = useState('');

  // Media Picker Modal State
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerTarget, setPickerTarget] = useState(null); // 'portal' or { slotIdx: number }
  const [pickerTab, setPickerTab] = useState('library'); // 'library' | 'upload' | 'url'
  const [mediaList, setMediaList] = useState([]);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [customUrlInput, setCustomUrlInput] = useState('');

  // Fetch Home Content on mount
  useEffect(() => {
    fetchHomeContent();
    fetch('/api/admin/rooms')
      .then((r) => r.json())
      .then((d) => setRoomsList(d.rooms || []))
      .catch(() => {});
  }, []);

  const [roomsList, setRoomsList] = useState([]);

  const handleToggleRoomFeatured = async (room) => {
    try {
      const nextVal = !room.featuredOnHome;
      const res = await fetch(`/api/admin/rooms/${room._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ featuredOnHome: nextVal }),
      });
      if (!res.ok) throw new Error('Failed to update room featured status');
      setRoomsList((prev) =>
        prev.map((r) => (r._id === room._id ? { ...r, featuredOnHome: nextVal } : r))
      );
      setStatusMsg({ text: `"${room.name}" featured on home updated!`, type: 'success' });
      setTimeout(() => setStatusMsg({ text: '', type: '' }), 3000);
    } catch (err) {
      alert(err.message);
    }
  };

  const fetchHomeContent = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/home-content');
      if (!res.ok) throw new Error('Failed to load home content.');
      const data = await res.json();
      if (data.homeContent) {
        if (data.homeContent.logo) {
          const l = data.homeContent.logo;
          const media = l.mediaId;
          setLogo({
            mediaId: media?._id || l.mediaId || null,
            url: media?.secureUrl || l.url || '',
            alt: media?.altText || l.alt || 'Moon Light Resort',
            showText: l.showText !== false,
          });
        }
        if (data.homeContent.stay) {
          const s = data.homeContent.stay;
          const tallMedia = s.tallPhoto?.mediaId;
          const vidMedia = s.video?.mediaId;
          const infoMedia = s.infoTile?.mediaId;
          setStay((prev) => ({
            ...prev,
            ...s,
            tallPhoto: {
              mediaId: tallMedia?._id || s.tallPhoto?.mediaId || null,
              url: tallMedia?.secureUrl || s.tallPhoto?.url || s.tallPhoto?.src || '',
              src: tallMedia?.secureUrl || s.tallPhoto?.url || s.tallPhoto?.src || '',
              alt: tallMedia?.altText || s.tallPhoto?.alt || 'Moon Light Resort pool and villa grounds',
            },
            video: {
              mediaId: vidMedia?._id || s.video?.mediaId || null,
              src: vidMedia?.secureUrl || s.video?.src || '',
              title: s.video?.title || 'Watch Resort Video',
              subtitle: s.video?.subtitle || 'See pool, villas and open spaces',
              duration: s.video?.duration || '0:45',
              poster: s.video?.poster || vidMedia?.posterUrl || '',
            },
            infoTile: {
              mediaId: infoMedia?._id || s.infoTile?.mediaId || null,
              image: infoMedia?.secureUrl || s.infoTile?.image || '',
              badge: s.infoTile?.badge || 'Timings',
              title: s.infoTile?.title || 'Check-in & Check-out',
              subtitle: s.infoTile?.subtitle || `Check-in ${s.checkInTime || '13:00'} · Check-out ${s.checkOutTime || '11:00'}`,
            },
          }));
        }
        if (data.homeContent.intro) {
          setIntro((prev) => ({ ...prev, ...data.homeContent.intro }));
        }
        if (data.homeContent.showcase) {
          const sc = data.homeContent.showcase;
          // Ensure 8 slots exist
          const existingSlots = Array.isArray(sc.items) ? sc.items : [];
          const completeSlots = [];
          for (let i = 0; i < 8; i++) {
            const current = existingSlots[i] || DEFAULT_SHOWCASE.items[i];
            const media = current.mediaId;
            completeSlots.push({
              slotNumber: i + 1,
              mediaId: media?._id || current.mediaId || null,
              src: media?.secureUrl || current.src || '',
              alt: media?.altText || current.alt || '',
              caption: media?.caption || current.caption || '',
              isVideoSlot: Boolean(media ? media.mediaType === 'video' : current.isVideoSlot),
              type: (media?.mediaType === 'video' || current.isVideoSlot) ? 'video' : 'image',
            });
          }

          const portalMedia = sc.portalItem?.mediaId;
          setShowcase({
            title: sc.title || DEFAULT_SHOWCASE.title,
            subtitle: sc.subtitle || DEFAULT_SHOWCASE.subtitle,
            pills: sc.pills?.length > 0 ? sc.pills : DEFAULT_SHOWCASE.pills,
            portalItem: {
              mediaId: portalMedia?._id || sc.portalItem?.mediaId || null,
              src: portalMedia?.secureUrl || sc.portalItem?.src || DEFAULT_SHOWCASE.portalItem.src,
              alt: portalMedia?.altText || sc.portalItem?.alt || DEFAULT_SHOWCASE.portalItem.alt,
              title: portalMedia?.title || sc.portalItem?.title || DEFAULT_SHOWCASE.portalItem.title,
              is360: Boolean(portalMedia?.is360 || portalMedia?.mediaType === 'pano360' || sc.portalItem?.is360),
            },
            items: completeSlots,
          });
        }
        if (data.homeContent.facilities) {
          const f = data.homeContent.facilities;
          const fMedia = f.mediaId;
          setFacilities({
            title: f.title || DEFAULT_FACILITIES.title,
            subtitle: f.subtitle || DEFAULT_FACILITIES.subtitle,
            badge: f.badge || DEFAULT_FACILITIES.badge,
            featuredTitle: f.featuredTitle || DEFAULT_FACILITIES.featuredTitle,
            featuredText: f.featuredText || DEFAULT_FACILITIES.featuredText,
            image: fMedia?.secureUrl || f.image || '',
            mediaId: fMedia?._id || f.mediaId || null,
            groups: (Array.isArray(f.groups) && f.groups.length > 0) ? f.groups : DEFAULT_FACILITIES.groups,
          });
        }
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Open Media Picker
  const openMediaPicker = (target) => {
    setPickerTarget(target);
    setPickerOpen(true);
    setPickerTab('library');
    setCustomUrlInput('');
    loadMediaLibrary();
  };

  const loadMediaLibrary = async () => {
    setLoadingMedia(true);
    try {
      const res = await fetch('/api/admin/media?limit=50');
      if (res.ok) {
        const data = await res.json();
        setMediaList(data.media || []);
      }
    } catch (err) {
      console.error('Failed to load media items:', err);
    } finally {
      setLoadingMedia(false);
    }
  };

  // Select Media Item from Picker
  const handleSelectMedia = (item) => {
    const src = item.secureUrl || item.src;
    const isVideo = item.mediaType === 'video';
    const alt = item.altText || item.title || '';
    const caption = item.caption || item.title || '';

    if (pickerTarget === 'logo') {
      setLogo((prev) => ({
        ...prev,
        mediaId: item._id || null,
        url: src,
        alt: alt || prev.alt,
      }));
    } else if (pickerTarget === 'portal') {
      const is360 = Boolean(item.is360 || item.mediaType === 'pano360');
      setShowcase((prev) => ({
        ...prev,
        portalItem: {
          mediaId: item._id || null,
          src,
          alt: alt || 'Moon Light Resort',
          title: item.title || prev.portalItem?.title || 'Moon Light Resort',
          is360,
        },
      }));
    } else if (pickerTarget === 'stay-tallPhoto') {
      setStay((prev) => ({
        ...prev,
        tallPhoto: {
          mediaId: item._id || null,
          url: src,
          src,
          alt: alt || prev.tallPhoto?.alt || 'Moon Light Resort pool and grounds',
        },
      }));
    } else if (pickerTarget === 'stay-video') {
      setStay((prev) => ({
        ...prev,
        video: {
          ...prev.video,
          mediaId: item._id || null,
          src,
          poster: prev.video?.poster || item.posterUrl || '',
        },
      }));
    } else if (pickerTarget === 'stay-video-poster') {
      setStay((prev) => ({
        ...prev,
        video: {
          ...prev.video,
          poster: src,
        },
      }));
    } else if (pickerTarget === 'stay-infoTile') {
      setStay((prev) => ({
        ...prev,
        infoTile: {
          ...prev.infoTile,
          mediaId: item._id || null,
          image: src,
        },
      }));
    } else if (pickerTarget === 'facilities-image') {
      setFacilities((prev) => ({
        ...prev,
        mediaId: item._id || null,
        image: src,
      }));
    } else if (pickerTarget && typeof pickerTarget.slotIdx === 'number') {
      const idx = pickerTarget.slotIdx;
      setShowcase((prev) => {
        const nextItems = [...prev.items];
        nextItems[idx] = {
          ...nextItems[idx],
          mediaId: item._id || null,
          src,
          alt: alt || nextItems[idx].alt,
          caption: caption || nextItems[idx].caption,
          isVideoSlot: isVideo,
          type: isVideo ? 'video' : 'image',
        };
        return { ...prev, items: nextItems };
      });
    }

    setPickerOpen(false);
  };

  // Set Custom URL
  const handleApplyCustomUrl = () => {
    if (!customUrlInput.trim()) return;
    const url = customUrlInput.trim();
    const isVideo = url.endsWith('.mp4') || url.endsWith('.webm') || url.endsWith('.mov');

    if (pickerTarget === 'logo') {
      setLogo((prev) => ({
        ...prev,
        mediaId: null,
        url,
      }));
    } else if (pickerTarget === 'portal') {
      setShowcase((prev) => ({
        ...prev,
        portalItem: {
          ...prev.portalItem,
          mediaId: null,
          src: url,
        },
      }));
    } else if (pickerTarget === 'facilities-image') {
      setFacilities((prev) => ({
        ...prev,
        mediaId: null,
        image: url,
      }));
    } else if (pickerTarget && typeof pickerTarget.slotIdx === 'number') {
      const idx = pickerTarget.slotIdx;
      setShowcase((prev) => {
        const nextItems = [...prev.items];
        nextItems[idx] = {
          ...nextItems[idx],
          mediaId: null,
          src: url,
          isVideoSlot: isVideo,
          type: isVideo ? 'video' : 'image',
        };
        return { ...prev, items: nextItems };
      });
    }

    setPickerOpen(false);
  };

  // Save changes to DB
  const handleSave = async () => {
    setSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const payload = {
        logo,
        stay,
        intro,
        showcase,
        facilities,
      };

      const res = await fetch('/api/admin/home-content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save changes.');

      setStatusMsg({ text: 'Home content updated successfully!', type: 'success' });
      setTimeout(() => setStatusMsg({ text: '', type: '' }), 4000);
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: err.message, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  // Add Stay feature pill
  const handleAddStayPill = () => {
    if (!newStayPill.trim()) return;
    setStay((prev) => ({
      ...prev,
      featurePills: [...prev.featurePills, newStayPill.trim()],
    }));
    setNewStayPill('');
  };

  // Remove Stay feature pill
  const handleRemoveStayPill = (idx) => {
    setStay((prev) => ({
      ...prev,
      featurePills: prev.featurePills.filter((_, i) => i !== idx),
    }));
  };

  // Add Showcase pill
  const handleAddShowcasePill = () => {
    if (!newShowcasePill.trim()) return;
    setShowcase((prev) => ({
      ...prev,
      pills: [...prev.pills, newShowcasePill.trim()],
    }));
    setNewShowcasePill('');
  };

  // Remove Showcase pill
  const handleRemoveShowcasePill = (idx) => {
    setShowcase((prev) => ({
      ...prev,
      pills: prev.pills.filter((_, i) => i !== idx),
    }));
  };

  // Facilities Handlers
  const [newFacilityInputs, setNewFacilityInputs] = useState({});

  const handleFacilityInputChange = (groupIdx, field, val) => {
    setNewFacilityInputs((prev) => ({
      ...prev,
      [groupIdx]: { ...(prev[groupIdx] || { name: '', icon: 'check' }), [field]: val },
    }));
  };

  const handleAddFacilityItem = (groupIdx) => {
    const current = newFacilityInputs[groupIdx] || {};
    const name = (current.name || '').trim();
    const icon = current.icon || 'check';
    if (!name) return;

    setFacilities((prev) => {
      const nextGroups = [...prev.groups];
      const target = nextGroups[groupIdx];
      nextGroups[groupIdx] = {
        ...target,
        items: [...(target.items || []), { name, icon, group: target.name }],
      };
      return { ...prev, groups: nextGroups };
    });

    setNewFacilityInputs((prev) => ({
      ...prev,
      [groupIdx]: { name: '', icon: 'check' },
    }));
  };

  const handleDeleteFacilityItem = (groupIdx, itemIdx) => {
    setFacilities((prev) => {
      const nextGroups = [...prev.groups];
      const target = nextGroups[groupIdx];
      nextGroups[groupIdx] = {
        ...target,
        items: target.items.filter((_, i) => i !== itemIdx),
      };
      return { ...prev, groups: nextGroups };
    });
  };

  const handleUpdateGroupName = (groupIdx, newName) => {
    setFacilities((prev) => {
      const nextGroups = [...prev.groups];
      nextGroups[groupIdx] = { ...nextGroups[groupIdx], name: newName };
      return { ...prev, groups: nextGroups };
    });
  };

  const handleAddFacilityGroup = () => {
    const name = prompt('Enter new facility group name (e.g. Wellness, Kids Play Area):');
    if (!name || !name.trim()) return;
    setFacilities((prev) => ({
      ...prev,
      groups: [
        ...(prev.groups || []),
        {
          id: name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          name: name.trim(),
          items: [],
        },
      ],
    }));
  };

  const handleDeleteFacilityGroup = (groupIdx) => {
    if (!confirm('Are you sure you want to delete this facility group?')) return;
    setFacilities((prev) => ({
      ...prev,
      groups: prev.groups.filter((_, i) => i !== groupIdx),
    }));
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
          Loading home content...
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Top Header */}
      <div className={styles.headerRow}>
        <div>
          <h1 className={styles.headerTitle}>Home Content Management</h1>
          <p className={styles.headerSub}>
            Customize live headings, timings, and the 8-slot photo showcase on the homepage.
          </p>
        </div>

        <div className={styles.actionsRow}>
          <Link href="/" target="_blank" className={styles.secondaryBtn}>
            <span>Preview Home</span>
            <span>&nearr;</span>
          </Link>
          <button
            type="button"
            className={styles.primaryBtn}
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>

      {/* Status Toast */}
      {statusMsg.text && (
        <div
          className={`${styles.statusToast} ${
            statusMsg.type === 'success' ? styles.statusSuccess : styles.statusError
          }`}
          role="status"
        >
          {statusMsg.text}
        </div>
      )}

      {/* Clickable Page Map */}
      <nav className={styles.pageMapContainer} aria-label="Home Sections Map">
        <div className={styles.pageMapHeader}>
          <span className={styles.pageMapTitle}>🗺️ Home Page Sections Map (Click to Jump &amp; Edit)</span>
          <span style={{ fontSize: '0.75rem', color: '#6B7280' }}>
            Sections appear in this order on the live homepage
          </span>
        </div>
        <div className={styles.pageMapButtons}>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'intro' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('intro')}
          >
            1. Intro Gate
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'stay' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('stay')}
          >
            2. Stay (About)
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'facilities' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('facilities')}
          >
            3. Facilities
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'showcase' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('showcase')}
          >
            4. Photo Showcase
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'rooms' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('rooms')}
          >
            5. Our Room Types
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'reviews' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            6. Google Reviews
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'nearby' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('nearby')}
          >
            7. Nearby Areas
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'events' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('events')}
          >
            8. FAQs &amp; Events
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'logo' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('logo')}
          >
            9. Resort Logo
          </button>
          <button
            type="button"
            className={`${styles.pageMapBtn} ${activeTab === 'settings' ? styles.pageMapBtnActive : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            10. Settings (Contact &amp; Footer)
          </button>
        </div>
      </nav>

      {/* TAB 0: RESORT LOGO & BRANDING */}
      {activeTab === 'logo' && (
        <div className={styles.logoSectionCard}>
          <h2 className={styles.cardTitle}>Resort Logo & Header Branding</h2>
          <p className={styles.cardDesc}>
            Upload a custom resort logo to replace the default crescent moon icon across the website navigation bar and headers.
          </p>

          {/* Live Dual Preview */}
          <div className={styles.logoPreviewWrapper}>
            {/* 1. Day / Scrolled Navbar Preview */}
            <div className={`${styles.logoPreviewBox} ${styles.logoPreviewLight}`}>
              <span className={styles.previewLabel}>Navbar Preview (Standard Light Mode)</span>
              <div className={styles.previewBrandRow}>
                {logo.url ? (
                  <img
                    src={logo.url}
                    alt={logo.alt || 'Moon Light Resort Logo'}
                    className={styles.previewLogoImg}
                  />
                ) : (
                  <svg
                    className={styles.previewDefaultSvg}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 4.5 C13 4.5 6 11.5 6 20.5 C6 25 8 28.5 11 30.5 C7 28.5 4 24 4 19 C4 10.7 10.7 4 19 4 C20.5 4 22 4.3 22 4.5 Z"
                      fill="#8b6b43"
                    />
                    <circle cx="21" cy="9" r="1.5" fill="#D4C76F" />
                  </svg>
                )}
                {logo.showText && (
                  <span className={styles.previewBrandText}>Moon Light Resort</span>
                )}
              </div>
            </div>

            {/* 2. Intro Stage / Dark Golden-Hour Preview */}
            <div className={`${styles.logoPreviewBox} ${styles.logoPreviewDark}`}>
              <span className={styles.previewLabel}>Intro Gate Preview (Over Video / Dark Mode)</span>
              <div className={styles.previewBrandRow}>
                {logo.url ? (
                  <img
                    src={logo.url}
                    alt={logo.alt || 'Moon Light Resort Logo'}
                    className={styles.previewLogoImg}
                  />
                ) : (
                  <svg
                    className={styles.previewDefaultSvg}
                    viewBox="0 0 32 32"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M22 4.5 C13 4.5 6 11.5 6 20.5 C6 25 8 28.5 11 30.5 C7 28.5 4 24 4 19 C4 10.7 10.7 4 19 4 C20.5 4 22 4.3 22 4.5 Z"
                      fill="#D4C76F"
                    />
                    <circle cx="21" cy="9" r="1.5" fill="#FFFFFF" />
                  </svg>
                )}
                {logo.showText && (
                  <span className={styles.previewBrandText}>Moon Light Resort</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className={styles.logoActionsRow}>
            <button
              type="button"
              className={styles.primaryBtn}
              onClick={() => openMediaPicker('logo')}
            >
              {logo.url ? 'Change Logo Image' : 'Upload / Select Custom Logo'}
            </button>

            {logo.url && (
              <button
                type="button"
                className={styles.resetLogoBtn}
                onClick={() =>
                  setLogo({
                    url: '',
                    mediaId: null,
                    alt: 'Moon Light Resort',
                    showText: true,
                  })
                }
              >
                Reset to Default Crescent Moon Icon
              </button>
            )}
          </div>

          {/* Settings Fields */}
          <div className={styles.formGrid} style={{ marginTop: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Logo Alt Text</label>
              <input
                type="text"
                className={styles.input}
                value={logo.alt}
                onChange={(e) => setLogo({ ...logo, alt: e.target.value })}
                placeholder="Moon Light Resort Logo"
              />
              <span className={styles.helperText}>Used for accessibility and SEO image tags</span>
            </div>

            <div className={styles.formGroup} style={{ justifyContent: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem', color: '#1f2937', fontWeight: '500' }}>
                <input
                  type="checkbox"
                  checked={logo.showText}
                  onChange={(e) => setLogo({ ...logo, showText: e.target.checked })}
                />
                Show &quot;Moon Light Resort&quot; text next to the logo
              </label>
              <span className={styles.helperText}>
                Uncheck this if your uploaded logo already contains the resort name in the image.
              </span>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '0.825rem', color: '#64748b' }}>
            <strong>Pro Tip:</strong> For best visual results, upload a PNG, WebP, or SVG logo with a transparent background. Recommended height is 36px to 50px.
          </div>
        </div>
      )}

      {/* TAB 1: STAY (ABOUT) */}
      {activeTab === 'stay' && (
        <div className={styles.sectionCard}>
          <h2 className={styles.cardTitle}>Stay Section Content</h2>
          <p className={styles.cardDesc}>
            Appears right after the Intro Gate animation. Controls the primary resort identity, timings, and feature highlights.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Eyebrow / Sub-label</label>
              <input
                type="text"
                className={styles.input}
                value={stay.label}
                onChange={(e) => setStay({ ...stay, label: e.target.value })}
                placeholder="MOON LIGHT RESORT · NEDUNGULAM, TAMIL NADU"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Section Title</label>
              <input
                type="text"
                className={styles.input}
                value={stay.title}
                onChange={(e) => setStay({ ...stay, title: e.target.value })}
                placeholder="Together Time in Nedungulam"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Main Heading</label>
              <input
                type="text"
                className={styles.input}
                value={stay.heading}
                onChange={(e) => setStay({ ...stay, heading: e.target.value })}
                placeholder="Where calm landscapes meet warm hospitality"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Story / Description Paragraph</label>
              <textarea
                className={styles.textarea}
                value={stay.paragraph}
                onChange={(e) => setStay({ ...stay, paragraph: e.target.value })}
                placeholder="Surrounded by open nature and tranquil breezes..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Check-in Time</label>
              <input
                type="text"
                className={styles.input}
                value={stay.checkInTime}
                onChange={(e) => setStay({ ...stay, checkInTime: e.target.value })}
                placeholder="13:00"
              />
              <span className={styles.helperText}>Shown on timing cards and booking buttons</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Check-out Time</label>
              <input
                type="text"
                className={styles.input}
                value={stay.checkOutTime}
                onChange={(e) => setStay({ ...stay, checkOutTime: e.target.value })}
                placeholder="11:00"
              />
              <span className={styles.helperText}>Shown on timing cards and booking buttons</span>
            </div>

            {/* Top-Left Highlight Cards (Stats) */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <h3 style={{ fontSize: '1rem', color: '#111827', margin: '1rem 0 0.5rem', fontWeight: 700 }}>
                Top-Left Highlight Cards (2 Tiles)
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 1rem' }}>
                These appear as the two stacked feature cards in the top-left of the Stay section.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                {[0, 1].map((idx) => {
                  const stat = stay.stats?.[idx] || { label: '', value: '', icon: 'bed', link: '/rooms' };
                  return (
                    <div key={idx} style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: '12px', padding: '14px' }}>
                      <h4 style={{ margin: '0 0 10px 0', fontSize: '0.9rem', color: '#374151' }}>
                        Highlight Card #{idx + 1}
                      </h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563' }}>Label / Title</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={stat.label || ''}
                            placeholder={idx === 0 ? 'Villa Rooms & Dorms' : 'Clean Swimming Pool'}
                            onChange={(e) => {
                              const newStats = [...(stay.stats || [{}, {}])];
                              newStats[idx] = { ...newStats[idx], label: e.target.value };
                              setStay({ ...stay, stats: newStats });
                            }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563' }}>Value / Tag</label>
                          <input
                            type="text"
                            className={styles.input}
                            value={stat.value || ''}
                            placeholder={idx === 0 ? '10 Rooms Available' : 'Family & Group Safe'}
                            onChange={(e) => {
                              const newStats = [...(stay.stats || [{}, {}])];
                              newStats[idx] = { ...newStats[idx], value: e.target.value };
                              setStay({ ...stay, stats: newStats });
                            }}
                          />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563' }}>Icon</label>
                            <select
                              className={styles.input}
                              value={stat.icon || 'bed'}
                              onChange={(e) => {
                                const newStats = [...(stay.stats || [{}, {}])];
                                newStats[idx] = { ...newStats[idx], icon: e.target.value };
                                setStay({ ...stay, stats: newStats });
                              }}
                            >
                              <option value="bed">Bed (Rooms)</option>
                              <option value="rooms">Rooms</option>
                              <option value="dorms">Dorms</option>
                              <option value="pool">Pool</option>
                              <option value="trees">Nature / Trees</option>
                              <option value="clock">Clock</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#4B5563' }}>Link</label>
                            <input
                              type="text"
                              className={styles.input}
                              value={stat.link || ''}
                              placeholder="/rooms"
                              onChange={(e) => {
                                const newStats = [...(stay.stats || [{}, {}])];
                                newStats[idx] = { ...newStats[idx], link: e.target.value };
                                setStay({ ...stay, stats: newStats });
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Feature Pills */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Feature Tags (Pills Row)</label>
              <div className={styles.pillsWrap}>
                {stay.featurePills.map((pill, idx) => (
                  <span key={idx} className={styles.pillTag}>
                    <span>{pill}</span>
                    <button
                      type="button"
                      className={styles.pillDeleteBtn}
                      onClick={() => handleRemoveStayPill(idx)}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className={styles.addPillRow}>
                <input
                  type="text"
                  className={styles.input}
                  value={newStayPill}
                  onChange={(e) => setNewStayPill(e.target.value)}
                  placeholder="e.g. Clean pool"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddStayPill();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.addPillBtn}
                  onClick={handleAddStayPill}
                >
                  + Add Tag
                </button>
              </div>
            </div>

            {/* Stay Section Photos & Video */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <h3 style={{ fontSize: '1rem', color: '#111827', margin: '1.5rem 0 0.5rem', fontWeight: 700 }}>
                Stay Section Photos &amp; Video
              </h3>
              <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 1rem' }}>
                Upload or select the tall feature photo, the &quot;Watch Resort Video&quot; tile, and the check-in timings thumbnail.
              </p>

              <div className={styles.stayMediaCardsGrid}>
                {/* 1. Tall Feature Photo Card */}
                <div className={styles.stayMediaCard}>
                  <div>
                    <h4 className={styles.stayCardTitle}>1. Tall Feature Photo</h4>
                    <p className={styles.stayCardDesc}>
                      The large tall photo displayed on the right side of the Stay section card.
                    </p>
                  </div>

                  <div className={styles.stayMediaPreviewBox}>
                    {(stay.tallPhoto?.url || stay.tallPhoto?.src) ? (
                      <img
                        src={stay.tallPhoto.url || stay.tallPhoto.src}
                        alt={stay.tallPhoto.alt || 'Tall Feature Photo'}
                        className={styles.stayMediaThumb}
                      />
                    ) : (
                      <div className={styles.stayEmptyPlaceholder}>
                        No custom photo (shows auto library fallback)
                      </div>
                    )}
                  </div>

                  <div className={styles.stayCardBtnRow}>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      onClick={() => openMediaPicker('stay-tallPhoto')}
                    >
                      Choose / Upload Photo
                    </button>
                    {(stay.tallPhoto?.url || stay.tallPhoto?.src) && (
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() =>
                          setStay((prev) => ({
                            ...prev,
                            tallPhoto: { mediaId: null, url: '', src: '', alt: '' },
                          }))
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  <div style={{ marginTop: '4px' }}>
                    <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block', marginBottom: '2px' }}>
                      Image Alt Text
                    </label>
                    <input
                      type="text"
                      className={styles.input}
                      style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                      value={stay.tallPhoto?.alt || ''}
                      onChange={(e) =>
                        setStay((prev) => ({
                          ...prev,
                          tallPhoto: { ...(prev.tallPhoto || {}), alt: e.target.value },
                        }))
                      }
                      placeholder="Moon Light Resort pool and grounds"
                    />
                  </div>
                </div>

                {/* 2. Resort Video Card */}
                <div className={styles.stayMediaCard}>
                  <div>
                    <h4 className={styles.stayCardTitle}>2. Watch Resort Video Tile</h4>
                    <p className={styles.stayCardDesc}>
                      Resort video tile. When added, visitors can click &quot;Watch Resort Video&quot; to play the video.
                    </p>
                  </div>

                  <div className={styles.stayMediaPreviewBox}>
                    {stay.video?.src ? (
                      <video
                        src={getOptimizedVideoUrl(stay.video.src, { maxWidth: 480 })}
                        poster={getOptimizedPosterUrl(stay.video.src, stay.video.poster)}
                        className={styles.stayMediaVideo}
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <div className={styles.stayEmptyPlaceholder}>
                        No video configured (shows Check-in Timings tile instead)
                      </div>
                    )}
                  </div>

                  <div className={styles.stayCardBtnRow}>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      onClick={() => openMediaPicker('stay-video')}
                    >
                      Choose / Upload Video
                    </button>
                    {stay.video?.src && (
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() =>
                          setStay((prev) => ({
                            ...prev,
                            video: { mediaId: null, src: '', title: '', subtitle: '', duration: '', poster: '' },
                          }))
                        }
                      >
                        Remove Video
                      </button>
                    )}
                  </div>

                  {stay.video?.src && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Video Title</label>
                        <input
                          type="text"
                          className={styles.input}
                          style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                          value={stay.video.title || ''}
                          onChange={(e) =>
                            setStay((prev) => ({
                              ...prev,
                              video: { ...prev.video, title: e.target.value },
                            }))
                          }
                          placeholder="Watch Resort Video"
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Subtitle</label>
                        <input
                          type="text"
                          className={styles.input}
                          style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                          value={stay.video.subtitle || ''}
                          onChange={(e) =>
                            setStay((prev) => ({
                              ...prev,
                              video: { ...prev.video, subtitle: e.target.value },
                            }))
                          }
                          placeholder="See pool, villas and open spaces"
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Duration Badge</label>
                          <input
                            type="text"
                            className={styles.input}
                            style={{ fontSize: '0.78rem', padding: '6px 10px' }}
                            value={stay.video.duration || ''}
                            onChange={(e) =>
                              setStay((prev) => ({
                                ...prev,
                                video: { ...prev.video, duration: e.target.value },
                              }))
                            }
                            placeholder="0:45"
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#6B7280', display: 'block' }}>Poster Frame</label>
                          <button
                            type="button"
                            className={styles.smallBtn}
                            style={{ width: '100%', padding: '6px 10px', marginTop: '1px' }}
                            onClick={() => openMediaPicker('stay-video-poster')}
                          >
                            {stay.video.poster ? 'Change Poster' : 'Choose Poster'}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Timings Card Photo */}
                <div className={styles.stayMediaCard}>
                  <div>
                    <h4 className={styles.stayCardTitle}>3. Timings Card Photo</h4>
                    <p className={styles.stayCardDesc}>
                      Thumbnail photo displayed on the Check-in &amp; Check-out timing panel.
                    </p>
                  </div>

                  <div className={styles.stayMediaPreviewBox}>
                    {stay.infoTile?.image ? (
                      <img
                        src={stay.infoTile.image}
                        alt="Timings Card"
                        className={styles.stayMediaThumb}
                      />
                    ) : (
                      <div className={styles.stayEmptyPlaceholder}>
                        Default resort grounds photo
                      </div>
                    )}
                  </div>

                  <div className={styles.stayCardBtnRow}>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      onClick={() => openMediaPicker('stay-infoTile')}
                    >
                      Choose / Upload Photo
                    </button>
                    {stay.infoTile?.image && (
                      <button
                        type="button"
                        className={styles.dangerBtn}
                        onClick={() =>
                          setStay((prev) => ({
                            ...prev,
                            infoTile: { ...(prev.infoTile || {}), mediaId: null, image: '' },
                          }))
                        }
                      >
                        Reset to Default
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PHOTO SHOWCASE (8 SLOTS) */}
      {activeTab === 'showcase' && (
        <div className={styles.sectionCard}>
          <h2 className={styles.cardTitle}>Photo Showcase & Center Portal</h2>
          <p className={styles.cardDesc}>
            Manage the circular crossroads Moon Portal and the 8 bento-grid slots shown on the homepage.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Showcase Heading</label>
              <input
                type="text"
                className={styles.input}
                value={showcase.title}
                onChange={(e) => setShowcase({ ...showcase, title: e.target.value })}
                placeholder="Captured Moments of Serenity"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Showcase Subtitle</label>
              <input
                type="text"
                className={styles.input}
                value={showcase.subtitle}
                onChange={(e) => setShowcase({ ...showcase, subtitle: e.target.value })}
                placeholder="Villas, pool and open spaces at Moon Light Resort."
              />
            </div>

            {/* Showcase Category Pills */}
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Category Filter Pills</label>
              <div className={styles.pillsWrap}>
                {showcase.pills.map((pill, idx) => (
                  <span key={idx} className={styles.pillTag}>
                    <span>{pill}</span>
                    <button
                      type="button"
                      className={styles.pillDeleteBtn}
                      onClick={() => handleRemoveShowcasePill(idx)}
                      title="Remove"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>

              <div className={styles.addPillRow}>
                <input
                  type="text"
                  className={styles.input}
                  value={newShowcasePill}
                  onChange={(e) => setNewShowcasePill(e.target.value)}
                  placeholder="e.g. Villa rooms"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddShowcasePill();
                    }
                  }}
                />
                <button
                  type="button"
                  className={styles.addPillBtn}
                  onClick={handleAddShowcasePill}
                >
                  + Add Pill
                </button>
              </div>
            </div>
          </div>

          {/* Center Moon Portal Card */}
          <div style={{ marginTop: '2rem', padding: '1.25rem', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e293b', margin: '0 0 0.5rem 0' }}>
              Center Circular Portal (MoonPortal)
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '0 0 1rem 0' }}>
              The circular crossroads portal item centered between the connector tiles.
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ width: '90px', height: '90px', borderRadius: '50%', overflow: 'hidden', border: '3px solid #111827', flexShrink: 0, background: '#e2e8f0' }}>
                {showcase.portalItem.src ? (
                  <img
                    src={showcase.portalItem.src}
                    alt={showcase.portalItem.alt}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', color: '#64748b', textAlign: 'center', padding: '4px' }}>
                    Default Logo
                  </div>
                )}
              </div>

              <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={styles.slotBtn}
                    onClick={() => openMediaPicker('portal')}
                  >
                    {showcase.portalItem.src ? 'Change Portal Media' : 'Choose / Upload Media'}
                  </button>
                  {showcase.portalItem.src && (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      style={{ padding: '0.45rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() =>
                        setShowcase((prev) => ({
                          ...prev,
                          portalItem: {
                            ...prev.portalItem,
                            src: '',
                            mediaId: null,
                            alt: '',
                            is360: false,
                          },
                        }))
                      }
                    >
                      Remove Media
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  className={styles.input}
                  value={showcase.portalItem.title}
                  onChange={(e) =>
                    setShowcase({
                      ...showcase,
                      portalItem: { ...showcase.portalItem, title: e.target.value },
                    })
                  }
                  placeholder="Portal Title (e.g. Moon Light Resort)"
                />

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: '#4b5563', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={Boolean(showcase.portalItem.is360)}
                    onChange={(e) => {
                      const is360 = e.target.checked;
                      setShowcase((prev) => ({
                        ...prev,
                        portalItem: { ...prev.portalItem, is360 },
                      }));
                    }}
                  />
                  <span>Mark as 360° Panorama View</span>
                </label>
              </div>
            </div>
          </div>

          {/* 8 Bento Grid Slots */}
          <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#111827', marginTop: '2.5rem', marginBottom: '0.25rem' }}>
            Showcase Bento Grid Slots (1 to 8)
          </h3>
          <p style={{ fontSize: '0.825rem', color: '#6b7280', margin: '0 0 1rem 0' }}>
            Click &apos;Select Media&apos; to pick from your uploaded gallery, or enter details directly.
          </p>

          <div className={styles.slotsGrid}>
            {showcase.items.map((slot, idx) => (
              <div key={idx} className={styles.slotCard}>
                <div className={styles.slotHeader}>
                  <span className={styles.slotNumber}>Slot {slot.slotNumber}</span>
                  <span className={styles.slotBadge}>
                    {slot.isVideoSlot ? 'Video' : 'Photo'}
                  </span>
                </div>

                <div className={styles.slotMediaPreview}>
                  {slot.src ? (
                    slot.isVideoSlot || slot.type === 'video' ? (
                      <video
                        src={getOptimizedVideoUrl(slot.src, { maxWidth: 640 })}
                        poster={getOptimizedPosterUrl(slot.src, slot.poster)}
                        className={styles.previewVideo}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={slot.src}
                        alt={slot.alt || ''}
                        className={styles.previewImg}
                      />
                    )
                  ) : (
                    <div className={styles.emptySlotPlaceholder}>No Media Selected</div>
                  )}
                </div>

                <div className={styles.slotActions} style={{ display: 'flex', gap: '0.4rem' }}>
                  <button
                    type="button"
                    className={styles.slotBtn}
                    onClick={() => openMediaPicker({ slotIdx: idx })}
                  >
                    Select / Upload Media
                  </button>
                  {slot.src && (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                      onClick={() => {
                        setShowcase((prev) => {
                          const items = [...prev.items];
                          items[idx] = {
                            ...items[idx],
                            mediaId: null,
                            src: '',
                            poster: '',
                            alt: '',
                            caption: '',
                          };
                          return { ...prev, items };
                        });
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className={styles.slotForm}>
                  <div style={{ fontSize: '0.725rem', color: '#6b7280', fontWeight: '600' }}>
                    {SLOT_NAMES[idx] || `Slot ${idx + 1}`}
                  </div>

                  <input
                    type="text"
                    className={styles.input}
                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.6rem' }}
                    value={slot.caption}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShowcase((prev) => {
                        const items = [...prev.items];
                        items[idx] = { ...items[idx], caption: val };
                        return { ...prev, items };
                      });
                    }}
                    placeholder="Tile Caption (e.g. Resort Grounds)"
                  />

                  <input
                    type="text"
                    className={styles.input}
                    style={{ fontSize: '0.825rem', padding: '0.4rem 0.6rem' }}
                    value={slot.alt}
                    onChange={(e) => {
                      const val = e.target.value;
                      setShowcase((prev) => {
                        const items = [...prev.items];
                        items[idx] = { ...items[idx], alt: val };
                        return { ...prev, items };
                      });
                    }}
                    placeholder="Alt Text for SEO"
                  />

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.775rem', color: '#4b5563', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={slot.isVideoSlot}
                      onChange={(e) => {
                        const isVideo = e.target.checked;
                        setShowcase((prev) => {
                          const items = [...prev.items];
                          items[idx] = {
                            ...items[idx],
                            isVideoSlot: isVideo,
                            type: isVideo ? 'video' : 'image',
                          };
                          return { ...prev, items };
                        });
                      }}
                    />
                    Mark as Video Tile
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: INTRO GATE & TAGLINES */}
      {activeTab === 'intro' && (
        <div className={styles.sectionCard}>
          <h2 className={styles.cardTitle}>Intro Gate & Taglines</h2>
          <p className={styles.cardDesc}>
            Control the text overlays rendered during the 120-frame scroll-scrub intro gate animation.
          </p>

          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Eyebrow Location Text</label>
              <input
                type="text"
                className={styles.input}
                value={intro.eyebrow}
                onChange={(e) => setIntro({ ...intro, eyebrow: e.target.value })}
                placeholder="NEDUNGULAM • TAMIL NADU"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Heading Line 1</label>
              <input
                type="text"
                className={styles.input}
                value={intro.headingLine1}
                onChange={(e) => setIntro({ ...intro, headingLine1: e.target.value })}
                placeholder="Together Time"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Heading Line 2</label>
              <input
                type="text"
                className={styles.input}
                value={intro.headingLine2}
                onChange={(e) => setIntro({ ...intro, headingLine2: e.target.value })}
                placeholder="In Nedungulam"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>CTA Button Text</label>
              <input
                type="text"
                className={styles.input}
                value={intro.ctaText}
                onChange={(e) => setIntro({ ...intro, ctaText: e.target.value })}
                placeholder="Explore Rooms →"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label className={styles.label}>Intro Description</label>
              <textarea
                className={styles.textarea}
                value={intro.description}
                onChange={(e) => setIntro({ ...intro, description: e.target.value })}
                placeholder="A peaceful resort nestled in the countryside..."
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Welcome Ending Subtitle</label>
              <input
                type="text"
                className={styles.input}
                value={intro.welcomeSubtitle}
                onChange={(e) => setIntro({ ...intro, welcomeSubtitle: e.target.value })}
                placeholder="PEACEFUL NATURE RETREAT"
              />
              <span className={styles.helperText}>Fades in at the end of the scroll scrub</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Welcome Ending Title</label>
              <input
                type="text"
                className={styles.input}
                value={intro.welcomeTitle}
                onChange={(e) => setIntro({ ...intro, welcomeTitle: e.target.value })}
                placeholder="WELCOME TO MOON LIGHT"
              />
              <span className={styles.helperText}>Fades in at the end of the scroll scrub</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FACILITIES */}
      {activeTab === 'facilities' && (
        <div className={styles.sectionCard}>
          <div className={styles.sectionBadgeRow}>
            <span className={styles.bronzeBadge}>Appears on: Home &gt; Facilities (#facilities)</span>
            <a href="/#facilities" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
              View live ↗
            </a>
          </div>
          <h2 className={styles.cardTitle}>Resort Facilities &amp; Amenities</h2>
          <p className={styles.cardDesc}>
            Manage the featured photo tile, headlines, and the facility groups displayed on the homepage.
          </p>

          {/* 1. Left Featured Photo & Overlay Controls */}
          <div style={{ marginTop: '1.25rem', padding: '1.25rem', background: '#FDFBF7', border: '1px solid #D5C9B3', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1rem', color: '#8C622D', margin: '0 0 0.5rem', fontWeight: 700 }}>
              Facilities Featured Photo &amp; Left Tile Card
            </h3>
            <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 1rem' }}>
              Upload or select the large background image shown on the left side of the Facilities section on the homepage.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div>
                <div className={styles.stayMediaPreviewBox} style={{ height: '220px' }}>
                  {facilities.image ? (
                    <img
                      src={facilities.image}
                      alt="Facilities featured"
                      className={styles.stayMediaThumb}
                    />
                  ) : (
                    <div className={styles.stayEmptyPlaceholder}>
                      No featured photo selected (shows neutral background)
                    </div>
                  )}
                </div>

                <div className={styles.stayCardBtnRow} style={{ marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={() => openMediaPicker('facilities-image')}
                  >
                    Choose / Upload Photo
                  </button>
                  {facilities.image && (
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      onClick={() => setFacilities((prev) => ({ ...prev, image: '', mediaId: null }))}
                    >
                      Remove Photo
                    </button>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Featured Overlay Badge</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={facilities.badge || ''}
                    onChange={(e) => setFacilities({ ...facilities, badge: e.target.value })}
                    placeholder="Thoughtful Amenities"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Featured Title</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={facilities.featuredTitle || ''}
                    onChange={(e) => setFacilities({ ...facilities, featuredTitle: e.target.value })}
                    placeholder="All Essentials For A Relaxing Stay"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Featured Description</label>
                  <textarea
                    className={styles.textarea}
                    rows={2}
                    value={facilities.featuredText || ''}
                    onChange={(e) => setFacilities({ ...facilities, featuredText: e.target.value })}
                    placeholder="From air conditioning and full power backup..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 2. Section Title & Subtitle */}
          <div className={styles.formGrid} style={{ marginTop: '1.5rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Section Title</label>
              <input
                type="text"
                className={styles.input}
                value={facilities.title || ''}
                onChange={(e) => setFacilities({ ...facilities, title: e.target.value })}
                placeholder="Facilities"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Section Subtitle</label>
              <input
                type="text"
                className={styles.input}
                value={facilities.subtitle || ''}
                onChange={(e) => setFacilities({ ...facilities, subtitle: e.target.value })}
                placeholder="Comfort-first stay essentials."
              />
            </div>
          </div>

          {/* 3. Facility Groups & Items (Add, Edit, Update, Remove) */}
          <div style={{ marginTop: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.05rem', color: '#111827', margin: 0, fontWeight: 700 }}>
                Facility Groups &amp; Items (Home Bento Grid)
              </h3>
              <button
                type="button"
                className={styles.smallBtn}
                onClick={handleAddFacilityGroup}
              >
                + Add New Group
              </button>
            </div>

            <div className={styles.facilityGroupsGrid}>
              {(facilities.groups || []).map((group, groupIdx) => (
                <div key={group.id || groupIdx} className={styles.facilityGroupCard}>
                  <div className={styles.facilityGroupHeader}>
                    <input
                      type="text"
                      className={styles.input}
                      style={{ fontWeight: 700, fontSize: '0.9rem', padding: '4px 8px' }}
                      value={group.name}
                      onChange={(e) => handleUpdateGroupName(groupIdx, e.target.value)}
                    />
                    <button
                      type="button"
                      className={styles.dangerBtn}
                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                      onClick={() => handleDeleteFacilityGroup(groupIdx)}
                      title="Delete Group"
                    >
                      Delete
                    </button>
                  </div>

                  <div className={styles.facilityItemsList}>
                    {(group.items || []).map((item, itemIdx) => (
                      <div key={itemIdx} className={styles.facilityItemRow}>
                        <div className={styles.facilityItemLeft}>
                          <span className={styles.facilityItemBadge}>{item.icon || 'check'}</span>
                          <span>{item.name}</span>
                        </div>
                        <button
                          type="button"
                          className={styles.facilityDeleteBtn}
                          onClick={() => handleDeleteFacilityItem(groupIdx, itemIdx)}
                          title="Remove Item"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Item row */}
                  <div className={styles.facilityAddRow}>
                    <input
                      type="text"
                      className={styles.input}
                      style={{ flex: 1, padding: '5px 8px', fontSize: '0.78rem' }}
                      placeholder="Add item (e.g. Campfire)"
                      value={newFacilityInputs[groupIdx]?.name || ''}
                      onChange={(e) => handleFacilityInputChange(groupIdx, 'name', e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddFacilityItem(groupIdx);
                        }
                      }}
                    />
                    <select
                      className={styles.input}
                      style={{ padding: '5px 6px', fontSize: '0.75rem', width: '90px' }}
                      value={newFacilityInputs[groupIdx]?.icon || 'check'}
                      onChange={(e) => handleFacilityInputChange(groupIdx, 'icon', e.target.value)}
                    >
                      <option value="ac">AC</option>
                      <option value="power">Power</option>
                      <option value="wifi">WiFi</option>
                      <option value="coffee">Coffee</option>
                      <option value="utensils">Food</option>
                      <option value="kitchen">Kitchen</option>
                      <option value="parking">Parking</option>
                      <option value="hall">Hall</option>
                      <option value="family">Family</option>
                      <option value="tent">Camping</option>
                      <option value="compass">Explore</option>
                      <option value="discount">Discount</option>
                      <option value="check">Check</option>
                    </select>
                    <button
                      type="button"
                      className={styles.smallBtn}
                      style={{ padding: '5px 8px' }}
                      onClick={() => handleAddFacilityItem(groupIdx)}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: OUR ROOM TYPES */}
      {activeTab === 'rooms' && (
        <div className={styles.logoSectionCard}>
          <div className={styles.sectionBadgeRow}>
            <span className={styles.bronzeBadge}>Appears on: Home &gt; Our Room Types (#rooms)</span>
            <a href="/#rooms" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
              View live ↗
            </a>
          </div>
          <h2 className={styles.cardTitle}>Our Room Types (Featured on Home)</h2>
          <p className={styles.cardDesc}>
            Rooms with <strong>&ldquo;Featured on Home&rdquo;</strong> enabled appear in the Home bento grid. Uses each room&apos;s main cover image.
          </p>

          <div style={{ marginTop: '20px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', background: '#FFFFFF', border: '1px solid #EAE3D3', borderRadius: '8px' }}>
              <thead>
                <tr style={{ background: '#FDFBF7', borderBottom: '1px solid #EAE3D3' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', textTransform: 'uppercase' }}>Room Name</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', textTransform: 'uppercase' }}>Cover</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', textTransform: 'uppercase' }}>Featured on Home</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.78rem', textTransform: 'uppercase' }}>Order</th>
                </tr>
              </thead>
              <tbody>
                {roomsList.map((r) => (
                  <tr key={r._id} style={{ borderBottom: '1px solid #F3F0E8' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600 }}>{r.name}</td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#6B7280' }}>{r.roomType || 'Standard'}</td>
                    <td style={{ padding: '12px 14px' }}>
                      {r.mainImage ? (
                        <img src={r.mainImage} alt={r.name} style={{ width: '48px', height: '36px', objectFit: 'cover', borderRadius: '4px' }} />
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#991B1B' }}>No photo</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>
                        <input
                          type="checkbox"
                          checked={Boolean(r.featuredOnHome)}
                          onChange={() => handleToggleRoomFeatured(r)}
                        />
                        <span style={{ color: r.featuredOnHome ? '#065F46' : '#6B7280', fontWeight: r.featuredOnHome ? 700 : 400 }}>
                          {r.featuredOnHome ? 'Featured (Visible)' : 'Not Featured'}
                        </span>
                      </label>
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: '0.82rem' }}>{r.order ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: GOOGLE REVIEWS */}
      {activeTab === 'reviews' && <ReviewsSection />}

      {/* TAB 7: NEARBY AREAS */}
      {activeTab === 'nearby' && <NearbySection />}

      {/* TAB 8: FAQS & EVENTS */}
      {activeTab === 'events' && <EventsSection />}

      {/* TAB 10: SITE SETTINGS & CONTACT */}
      {activeTab === 'settings' && <SettingsSection />}

      {/* Media Picker Modal */}
      {pickerOpen && (
        <div className={styles.modalBackdrop} onClick={() => setPickerOpen(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {pickerTarget === 'logo'
                  ? 'Select / Upload Resort Logo'
                  : pickerTarget === 'portal'
                  ? 'Select Media for Center Moon Portal'
                  : pickerTarget === 'stay-tallPhoto'
                  ? 'Select Tall Feature Photo for Stay Section'
                  : pickerTarget === 'stay-video'
                  ? 'Select Resort Video for Stay Section'
                  : pickerTarget === 'stay-video-poster'
                  ? 'Select Poster Image for Video'
                  : pickerTarget === 'stay-infoTile'
                  ? 'Select Photo for Timings Card'
                  : pickerTarget === 'facilities-image'
                  ? 'Select Featured Photo for Facilities Section'
                  : `Select Media for Slot ${pickerTarget?.slotIdx + 1}`}
              </h3>
              <button
                type="button"
                className={styles.modalCloseBtn}
                onClick={() => setPickerOpen(false)}
                aria-label="Close"
              >
                &times;
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.mediaPickerTabs}>
                <button
                  type="button"
                  className={`${styles.mediaPickerTab} ${
                    pickerTab === 'library' ? styles.mediaPickerTabActive : ''
                  }`}
                  onClick={() => setPickerTab('library')}
                >
                  Media Library
                </button>
                <button
                  type="button"
                  className={`${styles.mediaPickerTab} ${
                    pickerTab === 'upload' ? styles.mediaPickerTabActive : ''
                  }`}
                  onClick={() => setPickerTab('upload')}
                >
                  Upload New
                </button>
                <button
                  type="button"
                  className={`${styles.mediaPickerTab} ${
                    pickerTab === 'url' ? styles.mediaPickerTabActive : ''
                  }`}
                  onClick={() => setPickerTab('url')}
                >
                  Direct URL
                </button>
              </div>

              {/* Tab 1: Library */}
              {pickerTab === 'library' && (
                <div>
                  {loadingMedia ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      Loading media assets...
                    </div>
                  ) : mediaList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No uploaded media found yet. Click &apos;Upload New&apos; tab above to upload.
                    </div>
                  ) : (
                    <div className={styles.mediaGrid}>
                      {mediaList.map((item) => (
                        <div
                          key={item._id}
                          className={styles.mediaItemCard}
                          onClick={() => handleSelectMedia(item)}
                          title={item.title || 'Click to select'}
                        >
                          {item.mediaType === 'video' ? (
                            <video
                              src={getOptimizedVideoUrl(item.secureUrl, { maxWidth: 360 })}
                              poster={getOptimizedPosterUrl(item.secureUrl, item.posterUrl)}
                              className={styles.mediaItemThumb}
                              muted
                              playsInline
                              preload="metadata"
                            />
                          ) : (
                            <img
                              src={item.secureUrl}
                              alt={item.altText || item.title || ''}
                              className={styles.mediaItemThumb}
                            />
                          )}
                          <span className={styles.mediaItemBadge}>
                            {item.mediaType}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Upload */}
              {pickerTab === 'upload' && (
                <div style={{ padding: '0.5rem 0' }}>
                  <MediaUpload
                    mediaType="all"
                    showOnHomeDefault={true}
                    onSuccess={(newMedia) => {
                      if (newMedia) {
                        handleSelectMedia(newMedia);
                      }
                    }}
                  />
                </div>
              )}

              {/* Tab 3: Direct URL */}
              {pickerTab === 'url' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem 0' }}>
                  <label className={styles.label}>Paste Image or Video URL</label>
                  <input
                    type="text"
                    className={styles.input}
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://res.cloudinary.com/..."
                  />
                  <button
                    type="button"
                    className={styles.primaryBtn}
                    onClick={handleApplyCustomUrl}
                    style={{ alignSelf: 'flex-start' }}
                  >
                    Apply URL
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
