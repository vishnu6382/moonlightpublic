import React from 'react';
import styles from './SectionHeader.module.css';

export default function SectionHeader({
  label,
  title,
  subtitle,
  align = 'center', // 'center' | 'left'
  divider = true,
  className = '',
}) {
  return (
    <div className={`${styles.header} ${styles[align] || styles.center} ${className}`.trim()}>
      {label && <span className={styles.label}>{label}</span>}
      {title && <h2 className={styles.title}>{title}</h2>}
      {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      {divider && <div className={styles.divider} aria-hidden="true" />}
    </div>
  );
}
