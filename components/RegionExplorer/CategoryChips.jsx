import React from 'react';
import { CATEGORY_COLORS } from '@/lib/nearbyConstants';
import { CategoryIcon } from './CategoryIcons';
import styles from './RegionExplorer.module.css';

export default function CategoryChips({
  categories = [],
  activeCategory,
  onSelectCategory,
  countsByCategory = {}
}) {
  const allList = [
    { name: 'All Categories', slug: 'all', color: '#3A352F', textColor: '#FFFFFF' },
    ...categories.map((c) => ({
      name: c.name,
      slug: c.name,
      color: c.colorInfo?.color || '#2F80ED',
      textColor: c.colorInfo?.textColor || '#FFFFFF'
    }))
  ];

  return (
    <div className={styles.categoryChipsRow} role="tablist" aria-label="Filter by Category">
      {allList.map((cat) => {
        const isActive = activeCategory === cat.slug;
        const count = cat.slug === 'all' ? undefined : countsByCategory[cat.slug];

        const activeStyle = isActive
          ? {
              backgroundColor: cat.color,
              borderColor: cat.color,
              color: cat.textColor
            }
          : {};

        return (
          <button
            key={cat.slug}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`${styles.categoryChipBtn} ${isActive ? styles.categoryChipActive : ''}`}
            style={activeStyle}
            onClick={() => onSelectCategory(cat.slug)}
          >
            {cat.slug !== 'all' && (
              <CategoryIcon
                category={cat.name}
                size={14}
                color={isActive ? cat.textColor : cat.color}
                className={styles.chipCategoryIcon}
              />
            )}
            <span className={styles.chipText}>{cat.name}</span>
            {count !== undefined && (
              <span
                className={styles.chipCountPill}
                style={{
                  backgroundColor: isActive ? 'rgba(255, 255, 255, 0.28)' : 'rgba(0, 0, 0, 0.06)',
                  color: isActive ? cat.textColor : 'var(--muted)'
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
