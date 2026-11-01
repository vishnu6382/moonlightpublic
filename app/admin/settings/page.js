'use client';

import React, { useState, useEffect } from 'react';
import styles from './settings.module.css';

export default function AdminSettingsPage() {
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
      setSuccessMsg('Settings saved successfully! Website headers & footers updated.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.screenIntro}>
        <h1 className={styles.screenTitle}>Site Settings &amp; Contact Info</h1>
        <p className={styles.screenHelp}>
          What this screen does: Manage resort contact phone numbers, WhatsApp click-to-chat, physical location, and check-in / check-out timings.
        </p>
      </div>

      <div className={styles.topBadgeRow}>
        <span className={styles.bronzeBadge}>Appears on: Header, Footer, Contact page</span>
        <a href="/contact" target="_blank" rel="noopener noreferrer" className={styles.liveLink}>
          View live contact page ↗
        </a>
      </div>

      {successMsg && (
        <div style={{ background: '#D1FAE5', color: '#065F46', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', fontWeight: 600 }}>
          {successMsg}
        </div>
      )}

      {error && (
        <div style={{ background: '#FEE2E2', color: '#991B1B', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p>Loading settings...</p>
      ) : (
        <form onSubmit={handleSave} className={styles.formCard}>
          <h2 className={styles.sectionHeader}>Resort Identity &amp; Contact</h2>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Resort Name</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.resortName || ''}
                onChange={(e) => setSettings({ ...settings, resortName: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Primary Email</label>
              <input
                type="email"
                className={styles.formInput}
                value={settings.email || ''}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Display Phone (Primary)</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Secondary Phone</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.secondaryPhone || ''}
                placeholder="+91 90878 44300"
                onChange={(e) => setSettings({ ...settings, secondaryPhone: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>WhatsApp Number (with country code)</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.whatsapp || ''}
                placeholder="+91 98944 86300"
                onChange={(e) => setSettings({ ...settings, whatsapp: e.target.value, whatsappNumber: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Instagram Profile URL</label>
              <input
                type="url"
                className={styles.formInput}
                value={settings.instagramUrl || ''}
                placeholder="https://www.instagram.com/moonlightresortstays"
                onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
              />
            </div>

            <div className={styles.formGroup} style={{ gridColumn: '1 / -1' }}>
              <label className={styles.formLabel}>Default WhatsApp Message</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.whatsappMessage || ''}
                placeholder="Hi, I would like to know about rooms and availability at Moon Light Resort."
                onChange={(e) => setSettings({ ...settings, whatsappMessage: e.target.value })}
              />
            </div>
          </div>

          <h2 className={styles.sectionHeader} style={{ marginTop: '24px' }}>Location &amp; Timings</h2>

          <div className={styles.grid2}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Short Address (Nav / Footer pill)</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.addressShort || ''}
                onChange={(e) => setSettings({ ...settings, addressShort: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Full Physical Address</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.addressFull || ''}
                onChange={(e) => setSettings({ ...settings, addressFull: e.target.value })}
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Check-in Time</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.checkInTime || ''}
                onChange={(e) => setSettings({ ...settings, checkInTime: e.target.value })}
                placeholder="13:00"
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Check-out Time</label>
              <input
                type="text"
                className={styles.formInput}
                value={settings.checkOutTime || ''}
                onChange={(e) => setSettings({ ...settings, checkOutTime: e.target.value })}
                placeholder="11:00"
              />
            </div>
          </div>

          <div style={{ marginTop: '28px', display: 'flex', justifyContent: 'flex-end' }}>
            <button type="submit" className={styles.primaryBtn} disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
