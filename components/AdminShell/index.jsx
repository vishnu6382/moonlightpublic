'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import styles from './AdminShell.module.css';

export default function AdminShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');
  const [unreadEnquiries, setUnreadEnquiries] = useState(0);

  const isLoginPage = pathname === '/admin/login';

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/admin/auth/logout', { method: 'POST' });
    } catch (_) {
      // Ignore network errors on logout
    } finally {
      router.push('/admin/login');
      router.refresh();
    }
  };

  useEffect(() => {
    if (isLoginPage) return;

    fetch('/api/site-logo')
      .then((r) => r.json())
      .then((d) => {
        if (d?.logo?.url) setLogoUrl(d.logo.url);
      })
      .catch(() => {});

    fetch('/api/admin/enquiries')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (typeof d?.unreadCount === 'number') {
          setUnreadEnquiries(d.unreadCount);
        }
      })
      .catch(() => {});
  }, [isLoginPage]);

  // If on login page, render plain content without top bar (called after all hooks)
  if (isLoginPage) {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Home Content', href: '/admin/home-content' },
    { label: 'Rooms', href: '/admin/rooms' },
    { label: 'Gallery', href: '/admin/gallery' },
    { label: 'Nearby Areas', href: '/admin/nearby' },
    { label: 'Media Library', href: '/admin/media-library' },
  ];

  return (
    <div className={styles.adminLayout}>
      <header className={styles.topBar}>
        <div className={styles.brandGroup}>
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              style={{ height: '28px', width: 'auto', objectFit: 'contain' }}
            />
          )}
          <h1 className={styles.brandTitle}>Moon Light Resort</h1>
          <span className={styles.badge}>Admin</span>
        </div>

        <nav className={styles.navGroup} aria-label="Admin Navigation">
          {navItems.map((item) => {
            const isActive = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.navLinkActive : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className={styles.logoutButton}
            disabled={loggingOut}
          >
            {loggingOut ? 'Logging out...' : 'Logout'}
          </button>
        </nav>
      </header>

      <main className={styles.mainContent}>{children}</main>
    </div>
  );
}
