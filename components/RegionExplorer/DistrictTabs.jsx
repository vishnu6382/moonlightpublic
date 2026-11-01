import React from 'react';
import { DISTRICT_COLORS } from '@/lib/nearbyConstants';
import styles from './RegionExplorer.module.css';

export default function DistrictTabs({ activeDistrict, onSelectDistrict, countsByDistrict = {} }) {
  const tabs = [
    {
      slug: 'all',
      name: 'All Districts',
      color: '#4A4339',
      count:
        (countsByDistrict.salem || 0) +
        (countsByDistrict.erode || 0) +
        (countsByDistrict.namakkal || 0)
    },
    {
      slug: 'salem',
      name: 'Salem',
      color: DISTRICT_COLORS.salem.color,
      badge: 'Home',
      count: countsByDistrict.salem || 0
    },
    {
      slug: 'erode',
      name: 'Erode',
      color: DISTRICT_COLORS.erode.color,
      count: countsByDistrict.erode || 0
    },
    {
      slug: 'namakkal',
      name: 'Namakkal',
      color: DISTRICT_COLORS.namakkal.color,
      count: countsByDistrict.namakkal || 0
    }
  ];

  return (
    <div className={styles.districtTabsRow} role="tablist" aria-label="Filter by District">
      {tabs.map((tab) => {
        const isActive = activeDistrict === tab.slug;
        const activeStyle = isActive
          ? {
              backgroundColor: tab.color,
              borderColor: tab.color,
              color: '#FFFFFF'
            }
          : {};

        return (
          <button
            key={tab.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.districtTabBtn} ${isActive ? styles.districtTabActive : ''}`}
            style={activeStyle}
            onClick={() => onSelectDistrict(tab.slug)}
          >
            <span
              className={styles.districtDot}
              style={{ backgroundColor: isActive ? '#FFFFFF' : tab.color }}
            />
            <span className={styles.tabNameText}>{tab.name}</span>
            {tab.badge && (
              <span
                className={styles.homeMiniBadge}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(46, 158, 107, 0.12)',
                  color: isActive ? '#FFFFFF' : DISTRICT_COLORS.salem.color
                }}
              >
                {tab.badge}
              </span>
            )}
            <span
              className={styles.tabCountPill}
              style={{
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.06)',
                color: isActive ? '#FFFFFF' : 'var(--muted)'
              }}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
