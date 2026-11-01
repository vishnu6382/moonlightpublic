'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './contentMap.module.css';

export default function AdminContentMapPage() {
  const [rooms, setRooms] = useState([]);
  const [galleryCategories, setGalleryCategories] = useState([]);
  const [homeCounts, setHomeCounts] = useState({
    stay: 1,
    facilities: 0,
    showcase: 0,
    featuredRooms: 0,
    events: 0,
    nearby: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [roomsRes, galleryRes, homeRes] = await Promise.all([
          fetch('/api/admin/rooms').then((r) => r.json()).catch(() => ({ rooms: [] })),
          fetch('/api/admin/gallery/categories').then((r) => r.json()).catch(() => ({ categories: [] })),
          fetch('/api/admin/home-content').then((r) => r.json()).catch(() => ({ content: {} })),
        ]);

        setRooms(roomsRes.rooms || []);
        setGalleryCategories(galleryRes.categories || []);

        const hc = homeRes.content || {};
        setHomeCounts({
          stay: hc.stay?.image ? 1 : 0,
          facilities: hc.facilities?.items?.length || 0,
          showcase: hc.photoShowcase?.items?.length || 0,
          featuredRooms: (roomsRes.rooms || []).filter((r) => r.featuredOnHome).length,
          events: hc.events?.items?.length || 0,
          nearby: hc.nearby?.places?.length || 0,
        });
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const sections = [
    {
      group: 'Home Page (/)',
      items: [
        {
          name: 'Hero Banner',
          desc: 'Main landing visual with resort headline & quick booking pills',
          count: '1 background image',
          editUrl: '/admin/home-content#hero',
          liveUrl: '/#hero',
        },
        {
          name: 'Our Room Types (Framed Bento)',
          desc: 'Featured rooms panel with central spinning emblem',
          count: `${homeCounts.featuredRooms} rooms featured`,
          editUrl: '/admin/rooms',
          liveUrl: '/#rooms',
        },
        {
          name: 'Stay Section',
          desc: 'Resort introduction and primary exterior showcase photo',
          count: `${homeCounts.stay} feature photo`,
          editUrl: '/admin/home-content#stay',
          liveUrl: '/#stay',
        },
        {
          name: 'Facilities Grid',
          desc: 'Highlights of swimming pool, lawn, and amenities',
          count: `${homeCounts.facilities} facilities listed`,
          editUrl: '/admin/home-content#facilities',
          liveUrl: '/#facilities',
        },
        {
          name: 'Photo Showcase',
          desc: 'Justified media rows showing guest experiences & pool',
          count: `${homeCounts.showcase} media tiles`,
          editUrl: '/admin/home-content#showcase',
          liveUrl: '/#showcase',
        },
        {
          name: 'Events & Functions',
          desc: 'Open lawn event celebrations and family gatherings',
          count: `${homeCounts.events} event types`,
          editUrl: '/admin/events',
          liveUrl: '/#events',
        },
        {
          name: 'Nearby Attractions',
          desc: 'Local tourism highlights around Poolampatti & Nedungulam',
          count: `${homeCounts.nearby} nearby spots`,
          editUrl: '/admin/nearby',
          liveUrl: '/#nearby',
        },
      ],
    },
    {
      group: 'Rooms & Accommodations (/rooms)',
      items: [
        {
          name: 'All Rooms Listing',
          desc: 'Ratio-true room cards with pricing and details link',
          count: `${rooms.length} active rooms`,
          editUrl: '/admin/rooms',
          liveUrl: '/rooms',
        },
        ...rooms.map((r) => ({
          name: `Room: ${r.name}`,
          desc: `${r.roomType || 'Accommodation'} • ${r.bedType || 'Comfort beds'}`,
          count: `${(r.photos?.length || 0) + (r.videos?.length || 0)} media items${
            r.pano360?.src ? ' + 360° Portal' : ''
          }`,
          editUrl: `/admin/rooms?id=${r._id}`,
          liveUrl: `/rooms/${r.slug}`,
        })),
      ],
    },
    {
      group: 'Gallery Page (/gallery)',
      items: [
        {
          name: 'Full Media Gallery',
          desc: 'Category tabs with justified rows & round portals at junctions',
          count: `${galleryCategories.length} categories active`,
          editUrl: '/admin/gallery',
          liveUrl: '/gallery',
        },
      ],
    },
    {
      group: 'Nearby Areas (/nearby-areas)',
      items: [
        {
          name: 'Local Tourism Explorer',
          desc: 'Curated spots, distances, and travel directions',
          count: `${homeCounts.nearby} locations`,
          editUrl: '/admin/nearby',
          liveUrl: '/nearby-areas',
        },
      ],
    },
    {
      group: 'Contact & Booking (/contact)',
      items: [
        {
          name: 'Contact & Route Guidance',
          desc: 'Interactive map, phone numbers, and WhatsApp booking',
          count: 'Direct Booking info',
          editUrl: '/admin/home-content',
          liveUrl: '/contact',
        },
      ],
    },
  ];

  return (
    <div className={styles.contentMapPage}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Website Content Map</h1>
          <p className={styles.subtitle}>
            A complete visual guide to every page and section on Moon Light Resort. Jump directly
            to edit content or open the live section.
          </p>
        </div>
      </div>

      {loading ? (
        <div className={styles.loadingBox}>
          <div className={styles.spinner} />
          <span>Building content map...</span>
        </div>
      ) : (
        <div className={styles.groupsContainer}>
          {sections.map((group, gIdx) => (
            <div key={gIdx} className={styles.groupCard}>
              <h2 className={styles.groupTitle}>{group.group}</h2>
              <div className={styles.tableWrap}>
                <table className={styles.sectionTable}>
                  <thead>
                    <tr>
                      <th>Section Name</th>
                      <th>Description</th>
                      <th>Items Count</th>
                      <th className={styles.actionCol}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.items.map((it, idx) => (
                      <tr key={idx} className={styles.tableRow}>
                        <td className={styles.nameCell}>
                          <strong>{it.name}</strong>
                        </td>
                        <td className={styles.descCell}>{it.desc}</td>
                        <td className={styles.countCell}>
                          <span className={styles.countPill}>{it.count}</span>
                        </td>
                        <td className={styles.actionCell}>
                          <Link href={it.editUrl} className={styles.editBtn}>
                            Edit
                          </Link>
                          <a
                            href={it.liveUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.viewBtn}
                          >
                            Open on site ↗
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

