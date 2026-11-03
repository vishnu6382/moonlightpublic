'use client';

import React, { useState, useEffect } from 'react';
import { FESTIVAL_PRESETS } from '@/lib/festiveHelper';
import { launchCelebration } from '@/lib/fireworks';
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
    festive: {
      enabled: true,
      festivalType: 'diwali',
      festivalTitle: 'Diwali Celebration',
      startDate: '',
      endDate: '',
      banner: {
        enabled: true,
        text: '✨ Diwali Special Offer: Book your stay today and get access to our exclusive festive celebration. Limited slots!',
        ctaText: 'Book Now',
        ctaLink: '/contact',
        bgColor: '#58111A',
        textColor: '#FFFFFF',
        accentColor: '#FCD34D',
      },
      decorations: {
        showLights: true,
        showFloatingDiya: true,
        diyaText: 'May Your Days Glow',
        enableFireworks: true,
        fireworksOnLoad: true,
      },
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        if (d?.settings) {
          setSettings((prev) => ({
            ...prev,
            ...d.settings,
            festive: {
              ...prev.festive,
              ...(d.settings.festive || {}),
              banner: {
                ...prev.festive.banner,
                ...(d.settings.festive?.banner || {}),
              },
              decorations: {
                ...prev.festive.decorations,
                ...(d.settings.festive?.decorations || {}),
              },
            },
          }));
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleFestiveChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      festive: {
        ...(prev.festive || {}),
        [field]: value,
      },
    }));
  };

  const handleBannerChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      festive: {
        ...(prev.festive || {}),
        banner: {
          ...(prev.festive?.banner || {}),
          [field]: value,
        },
      },
    }));
  };

  const handleDecorationsChange = (field, value) => {
    setSettings((prev) => ({
      ...prev,
      festive: {
        ...(prev.festive || {}),
        decorations: {
          ...(prev.festive?.decorations || {}),
          [field]: value,
        },
      },
    }));
  };

  const applyPreset = (presetKey) => {
    const preset = FESTIVAL_PRESETS[presetKey];
    if (!preset) return;
    setSettings((prev) => ({
      ...prev,
      festive: {
        ...(prev.festive || {}),
        festivalType: presetKey,
        festivalTitle: preset.title,
        banner: {
          ...(prev.festive?.banner || {}),
          enabled: true,
          text: preset.bannerText,
          ctaText: preset.ctaText,
          ctaLink: preset.ctaLink,
          bgColor: preset.bgColor,
          textColor: preset.textColor,
          accentColor: preset.accentColor,
        },
        decorations: {
          ...(prev.festive?.decorations || {}),
          showLights: preset.showLights,
          showFloatingDiya: preset.showFloatingDiya,
          diyaText: preset.diyaText,
          enableFireworks: preset.enableFireworks,
          fireworksOnLoad: true,
        },
      },
    }));
  };

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
        <form onSubmit={handleSave}>
          {/* FESTIVE THEME & OFFERS CARD */}
          <div className={styles.festiveCard}>
            <div className={styles.festiveHeaderRow}>
              <div className={styles.festiveTitleWrap}>
                <span style={{ fontSize: '1.6rem' }}>🪔</span>
                <div>
                  <h2 className={styles.festiveTitle}>Festive Theme &amp; Special Offers</h2>
                  <p className={styles.festiveSubtitle}>
                    Automatic lighting thoranam, crackers burst animation, floating Diya widget, and top offer banner.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => launchCelebration()}
                  className={styles.testCrackersBtn}
                  title="Click to test the firecracker particle burst directly on this screen!"
                >
                  <span>💥</span> Test Crackers Animation
                </button>
              </div>
            </div>

            {/* Quick Festival Presets */}
            <div style={{ marginBottom: '14px' }}>
              <span className={styles.formLabel}>Choose Festival Preset:</span>
              <div className={styles.presetBar}>
                {[
                  { key: 'diwali', label: '🪔 Diwali (Deepavali)' },
                  { key: 'pongal', label: '🌾 Pongal Thirunaal' },
                  { key: 'newyear', label: '🎉 New Year 2027' },
                  { key: 'christmas', label: '🎄 Christmas' },
                  { key: 'custom', label: '✨ Custom Celebration' },
                ].map((p) => {
                  const isActive = settings.festive?.festivalType === p.key;
                  return (
                    <button
                      key={p.key}
                      type="button"
                      onClick={() => applyPreset(p.key)}
                      className={`${styles.presetBtn} ${isActive ? styles.presetBtnActive : ''}`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Master Toggle */}
            <div className={styles.switchRow}>
              <input
                type="checkbox"
                id="festiveEnabled"
                checked={Boolean(settings.festive?.enabled)}
                onChange={(e) => handleFestiveChange('enabled', e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="festiveEnabled" className={styles.switchLabel} style={{ cursor: 'pointer' }}>
                Enable Festive Mode on Website
                <span className={styles.switchSubtext}>
                  When active, lighting thoranam, floating Diya, and offer banner will appear on the public resort website.
                </span>
              </label>
            </div>

            {/* Date Range: How Many Days (Start Date & End Date) */}
            <div className={styles.grid2} style={{ marginTop: '16px', marginBottom: '16px' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Active From (Start Date)</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={settings.festive?.startDate || ''}
                  onChange={(e) => handleFestiveChange('startDate', e.target.value)}
                />
                <span className={styles.switchSubtext}>Leave empty to activate immediately.</span>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Active Until (End Date - "Ethana Naal")</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={settings.festive?.endDate || ''}
                  onChange={(e) => handleFestiveChange('endDate', e.target.value)}
                />
                <span className={styles.switchSubtext}>Automatic expiry: reverts to normal website after this date.</span>
              </div>
            </div>

            {/* TOP OFFER BANNER CONFIGURATION */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #F3EDE0', paddingTop: '16px' }}>
              <div className={styles.switchRow}>
                <input
                  type="checkbox"
                  id="bannerEnabled"
                  checked={Boolean(settings.festive?.banner?.enabled)}
                  onChange={(e) => handleBannerChange('enabled', e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <label htmlFor="bannerEnabled" className={styles.switchLabel} style={{ cursor: 'pointer' }}>
                  Show Top Offer / Announcement Banner
                  <span className={styles.switchSubtext}>
                    Displays an announcement banner across the very top of the website.
                  </span>
                </label>
              </div>

              {settings.festive?.banner?.enabled && (
                <>
                  {/* Live Visual Preview */}
                  <div className={styles.bannerPreviewBox}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#8C622D', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Live Banner Preview:
                    </div>
                    <div
                      style={{
                        backgroundColor: settings.festive?.banner?.bgColor || '#58111A',
                        color: settings.festive?.banner?.textColor || '#FFFFFF',
                        padding: '10px 18px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>✨</span>
                        <span>{settings.festive?.banner?.text || 'Diwali Special Offer!'}</span>
                      </div>
                      <span
                        style={{
                          backgroundColor: settings.festive?.banner?.accentColor || '#FCD34D',
                          color: '#1A1005',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          padding: '4px 12px',
                          borderRadius: '9999px',
                        }}
                      >
                        {settings.festive?.banner?.ctaText || 'Book Now'} &rarr;
                      </span>
                    </div>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.formLabel}>Banner Offer Message Text</label>
                    <input
                      type="text"
                      className={styles.formInput}
                      value={settings.festive?.banner?.text || ''}
                      onChange={(e) => handleBannerChange('text', e.target.value)}
                      placeholder="e.g. ✨ Diwali Special Offer: Book your stay today and unlock 10% instant discount!"
                    />
                  </div>

                  <div className={styles.grid2}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Button Text (CTA)</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={settings.festive?.banner?.ctaText || ''}
                        onChange={(e) => handleBannerChange('ctaText', e.target.value)}
                        placeholder="Book Now"
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Button Link</label>
                      <input
                        type="text"
                        className={styles.formInput}
                        value={settings.festive?.banner?.ctaLink || ''}
                        onChange={(e) => handleBannerChange('ctaLink', e.target.value)}
                        placeholder="/contact or #enquire or WhatsApp"
                      />
                    </div>
                  </div>

                  {/* Color Customization */}
                  <div className={styles.grid2} style={{ marginTop: '10px' }}>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Banner Background Color ("Colour epadi vena change pannikkalam")</label>
                      <div className={styles.colorPickerRow}>
                        <input
                          type="color"
                          className={styles.colorInput}
                          value={settings.festive?.banner?.bgColor || '#58111A'}
                          onChange={(e) => handleBannerChange('bgColor', e.target.value)}
                        />
                        <div className={styles.colorSwatches}>
                          {[
                            { color: '#58111A', title: 'Deep Wine (Diwali)' },
                            { color: '#78350F', title: 'Terracotta (Pongal)' },
                            { color: '#0F172A', title: 'Midnight Navy (New Year)' },
                            { color: '#143828', title: 'Evergreen (Christmas)' },
                            { color: '#4C1D95', title: 'Royal Purple' },
                            { color: '#8B0000', title: 'Crimson Red' },
                          ].map((sw) => (
                            <button
                              key={sw.color}
                              type="button"
                              title={sw.title}
                              onClick={() => handleBannerChange('bgColor', sw.color)}
                              className={styles.swatchBtn}
                              style={{ backgroundColor: sw.color }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className={styles.formGroup}>
                      <label className={styles.formLabel}>Button Accent Color</label>
                      <div className={styles.colorPickerRow}>
                        <input
                          type="color"
                          className={styles.colorInput}
                          value={settings.festive?.banner?.accentColor || '#FCD34D'}
                          onChange={(e) => handleBannerChange('accentColor', e.target.value)}
                        />
                        <div className={styles.colorSwatches}>
                          {['#FCD34D', '#FFD700', '#FDE047', '#38BDF8', '#F472B6', '#FFFFFF'].map((hex) => (
                            <button
                              key={hex}
                              type="button"
                              onClick={() => handleBannerChange('accentColor', hex)}
                              className={styles.swatchBtn}
                              style={{ backgroundColor: hex }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* DECORATIONS CONFIGURATION */}
            <div style={{ marginTop: '20px', borderTop: '1px solid #F3EDE0', paddingTop: '16px' }}>
              <h3 style={{ fontSize: '0.98rem', fontWeight: 700, color: '#120F0C', margin: '0 0 12px 0' }}>
                Festive Visual Effects &amp; Animations:
              </h3>

              <div className={styles.grid2}>
                <div className={styles.switchRow}>
                  <input
                    type="checkbox"
                    id="showLights"
                    checked={Boolean(settings.festive?.decorations?.showLights)}
                    onChange={(e) => handleDecorationsChange('showLights', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="showLights" className={styles.switchLabel} style={{ cursor: 'pointer' }}>
                    💡 Hanging Fairy Lights (Lighting Thoranam)
                    <span className={styles.switchSubtext}>
                      Glowing festival bulbs garland hanging across the top header.
                    </span>
                  </label>
                </div>

                <div className={styles.switchRow}>
                  <input
                    type="checkbox"
                    id="showFloatingDiya"
                    checked={Boolean(settings.festive?.decorations?.showFloatingDiya)}
                    onChange={(e) => handleDecorationsChange('showFloatingDiya', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="showFloatingDiya" className={styles.switchLabel} style={{ cursor: 'pointer' }}>
                    🪔 Floating Corner Diya Widget
                    <span className={styles.switchSubtext}>
                      Glowing oil lamp widget in bottom-left corner with click-to-burst crackers.
                    </span>
                  </label>
                </div>
              </div>

              <div className={styles.grid2} style={{ marginTop: '10px' }}>
                <div className={styles.switchRow}>
                  <input
                    type="checkbox"
                    id="fireworksOnLoad"
                    checked={Boolean(settings.festive?.decorations?.fireworksOnLoad)}
                    onChange={(e) => handleDecorationsChange('fireworksOnLoad', e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="fireworksOnLoad" className={styles.switchLabel} style={{ cursor: 'pointer' }}>
                    💥 Crackers Burst On Landing ("Website Kulla Vantha Pattasu Vedikuthu")
                    <span className={styles.switchSubtext}>
                      Celebratory fireworks automatically burst when visitors open the site.
                    </span>
                  </label>
                </div>

                <div className={styles.formGroup} style={{ alignSelf: 'center' }}>
                  <label className={styles.formLabel}>Floating Diya Text</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={settings.festive?.decorations?.diyaText || ''}
                    onChange={(e) => handleDecorationsChange('diyaText', e.target.value)}
                    placeholder="May Your Days Glow"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formCard}>
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
          </div>
        </form>
      )}
    </div>
  );
}
