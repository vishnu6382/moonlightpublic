'use client';

import React, { useState, useEffect } from 'react';
import styles from './AdminEmbedded.module.css';

export default function SettingsSection() {
  const [settings, setSettings] = useState({
    resortName: 'Moon Light Resort',
    phone: '+91 98944 86300',
    phoneRaw: '919894486300',
    secondaryPhone: '+91 90878 44300',
    secondaryPhoneRaw: '919087844300',
    whatsapp: '+91 98944 86300',
    email: 'contact@moonlightresortstays.com',
    instagramUrl: 'https://www.instagram.com/moonlightresortstays',
    addressShort: 'Nedungulam, Salem, Tamil Nadu',
    addressFull: 'Nedungulam, Edappadi Taluk, Salem District, Tamil Nadu 637107',
    googleMapsUrl: '',
    checkInTime: '13:00',
    checkOutTime: '11:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings) setSettings(d.settings);
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      if (!res.ok) throw new Error('Failed to save settings');
      setSuccessMsg('Settings saved successfully! Website headers, footers & contact updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.embeddedCard}>
      <div className={styles.topBadgeRow}>
        <span className={styles.bronzeBadge}>Appears on: Header, Footer, Contact page</span>
        <a href="/contact" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
          View live contact page ↗
        </a>
      </div>

      <h2 className={styles.sectionTitle}>Site Settings &amp; Contact Info</h2>
      <p className={styles.sectionDesc}>
        Manage resort contact phone numbers, WhatsApp click-to-chat, physical location, and check-in / check-out timings.
      </p>

      {successMsg && <div className={styles.successToast}>{successMsg}</div>}
      {error && <div className={styles.errorToast}>{error}</div>}

      {loading ? (
        <p style={{ color: '#6B7280' }}>Loading settings...</p>
      ) : (
        <form onSubmit={handleSave} className={styles.formGrid}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Resort Name</label>
            <input
              type="text"
              className={styles.input}
              value={settings.resortName || ''}
              onChange={(e) => setSettings({ ...settings, resortName: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone (Primary Display)</label>
            <input
              type="text"
              className={styles.input}
              value={settings.phone || ''}
              onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Secondary Phone</label>
            <input
              type="text"
              className={styles.input}
              value={settings.secondaryPhone || ''}
              placeholder="+91 90878 44300"
              onChange={(e) => setSettings({ ...settings, secondaryPhone: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Phone (Click-to-call digits)</label>
            <input
              type="text"
              className={styles.input}
              value={settings.phoneRaw || ''}
              onChange={(e) => setSettings({ ...settings, phoneRaw: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>WhatsApp Number</label>
            <input
              type="text"
              className={styles.input}
              value={settings.whatsapp || ''}
              onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value })}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Contact Email</label>
            <input
              type="email"
              className={styles.input}
              value={settings.email || ''}
              onChange={(e) => setSettings({ ...settings, email: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Short Address (Pills &amp; Header)</label>
            <input
              type="text"
              className={styles.input}
              value={settings.addressShort || ''}
              onChange={(e) => setSettings({ ...settings, addressShort: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Instagram Profile URL</label>
            <input
              type="url"
              className={styles.input}
              value={settings.instagramUrl || ''}
              onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              placeholder="https://www.instagram.com/moonlightresortstays"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Google Maps Link</label>
            <input
              type="url"
              className={styles.input}
              value={settings.googleMapsUrl || ''}
              onChange={(e) => setSettings({ ...settings, googleMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/..."
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`}>
            <label className={styles.label}>Full Physical Address (Footer)</label>
            <textarea
              className={styles.textarea}
              rows={2}
              value={settings.addressFull || ''}
              onChange={(e) => setSettings({ ...settings, addressFull: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Check-in Time</label>
            <input
              type="text"
              className={styles.input}
              value={settings.checkInTime || '13:00'}
              onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Check-out Time</label>
            <input
              type="text"
              className={styles.input}
              value={settings.checkOutTime || '11:00'}
              onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
            />
          </div>

          <div className={`${styles.formGroup} ${styles.fullWidth}`} style={{ marginTop: '0.5rem' }}>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? 'Saving Settings...' : 'Save Site Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
