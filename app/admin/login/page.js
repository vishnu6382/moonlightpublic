'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutInfo, setLockoutInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLockoutInfo(null);
    setLoading(true);

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setLockoutInfo(data);
          setError(data.error || 'Account temporarily locked. Please try again later.');
        } else {
          setError(data.error || 'Invalid email or password.');
        }
        setLoading(false);
        return;
      }

      // Success: redirect directly to Rooms management
      router.push('/admin/rooms');
      router.refresh();
    } catch (err) {
      setError('A network error occurred. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <span className={styles.brandBadge}>Moon Light Resort</span>
          <h1 className={styles.title}>Admin Portal</h1>
          <p className={styles.subtitle}>Sign in with your administrator credentials</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && (
            <div className={lockoutInfo ? styles.lockoutWarning : styles.errorMessage} role="alert">
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="admin-email">
              Email Address
            </label>
            <input
              id="admin-email"
              type="email"
              required
              autoComplete="email"
              className={styles.input}
              placeholder="admin@moonlightresort.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading || !!lockoutInfo?.isLocked}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="admin-password">
              Password
            </label>
            <div className={styles.inputWrapper}>
              <input
                id="admin-password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                className={styles.input}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading || !!lockoutInfo?.isLocked}
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading || !!lockoutInfo?.isLocked}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.footerNote}>
          Authorized personnel only • Moon Light Resort
        </div>
      </div>
    </div>
  );
}
