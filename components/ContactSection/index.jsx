'use client';

import React, { useState, useEffect } from 'react';
import Section from '@/components/Section';
import FadeUp from '@/components/FadeUp';
import CoveLight from '@/components/CoveLight/CoveLight';
import { useEnquiry } from '@/context/EnquiryContext';
import styles from './ContactSection.module.css';

export default function ContactSection({ data, prefilledMessage = '' }) {
  const { prefilledMessage: contextMessage } = useEnquiry();
  const effectivePrefill = prefilledMessage || contextMessage || '';

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: effectivePrefill,
    botField: '', // Honeypot
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [serverError, setServerError] = useState('');

  // Update message field if prefilled message arrives from route or button
  useEffect(() => {
    if (effectivePrefill) {
      setFormData((prev) => ({
        ...prev,
        message: effectivePrefill,
      }));
    }
  }, [effectivePrefill]);

  if (!data) return null;

  const {
    title = 'Contact us',
    address,
    googleMapsUrl,
    mapEmbedUrl,
    whatsappNumber = '919894486300',
  } = data;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = 'Please enter your name';
    if (!formData.email.trim() || !formData.email.includes('@')) {
      errs.email = 'Please enter a valid email address';
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 8) {
      errs.phone = 'Please enter a valid phone number';
    }
    if (!formData.message.trim()) errs.message = 'Please enter a message';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to submit enquiry');
      }

      setIsSubmitted(true);

      // Open WhatsApp click-to-chat with prefilled message
      const cleanWaNum = whatsappNumber.replace(/[^0-9]/g, '');
      const waMessage = `Hi, I would like to enquire about a stay at Moon Light Resort.\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nMessage: ${formData.message}`;
      const waUrl = `https://wa.me/${cleanWaNum}?text=${encodeURIComponent(waMessage)}`;

      if (typeof window !== 'undefined') {
        window.open(waUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Section id="contact" spacing="xl" variant="white" className={styles.contactWrapper} data-moon-section="true">
      <FadeUp>
        {/* Giant Bold Title across full width */}
        <h2 className={styles.giantTitle}>{title}</h2>

        {/* Two Columns: Left Map, Right Underline Form */}
        <div className={styles.gridTwoCols}>
          {/* Left Column: Google Map */}
          <div className={styles.mapBox}>
            {mapEmbedUrl ? (
              <div className={styles.mapFrameWrapper}>
                <iframe
                  src={mapEmbedUrl}
                  title="Moon Light Resort Location Map"
                  loading="lazy"
                  className={styles.mapIframe}
                  allowFullScreen
                />
              </div>
            ) : (
              <div className={styles.mapFallback}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--bronze)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span style={{ fontFamily: 'var(--font-cinzel), serif', fontWeight: 600, fontSize: '0.95rem', color: 'var(--foreground)', letterSpacing: '0.05em' }}>
                    RESORT LOCATION
                  </span>
                </div>
                <p style={{ color: 'var(--muted)', fontSize: '0.925rem', lineHeight: 1.6, marginBottom: '16px' }}>{address}</p>
              </div>
            )}

            {googleMapsUrl && (
              <a
                href={googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.mapLink}
              >
                <span>Get Directions on Google Maps</span>
                <span>&rarr;</span>
              </a>
            )}
          </div>

          {/* Right Column: Underline-Only Form */}
          <div className={styles.formBox}>
            {isSubmitted ? (
              <div className={styles.thankYouCard}>
                <div className={styles.thankYouIcon}>&#10003;</div>
                <h3 className={styles.thankYouTitle}>Thank You!</h3>
                <p className={styles.thankYouText}>
                  Your enquiry has been received and WhatsApp chat has been initiated. Our team will assist you shortly.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className={styles.enquiryForm} noValidate>
                {/* Honeypot field for bot spam prevention */}
                <input
                  type="text"
                  name="botField"
                  value={formData.botField}
                  onChange={handleChange}
                  tabIndex={-1}
                  autoComplete="off"
                  className={styles.honeypot}
                  aria-hidden="true"
                />

                {/* Name Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="contact-name" className={styles.formLabel}>
                    Your Name <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contact-name"
                    type="text"
                    name="name"
                    placeholder="Enter your name"
                    value={formData.name}
                    onChange={handleChange}
                    className={styles.underlineInput}
                    required
                  />
                  {errors.name && <span className={styles.errorMessage}>{errors.name}</span>}
                </div>

                {/* Email Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="contact-email" className={styles.formLabel}>
                    Email <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contact-email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    className={styles.underlineInput}
                    required
                  />
                  {errors.email && <span className={styles.errorMessage}>{errors.email}</span>}
                </div>

                {/* Phone Number Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="contact-phone" className={styles.formLabel}>
                    Phone Number <span className={styles.requiredStar}>*</span>
                  </label>
                  <input
                    id="contact-phone"
                    type="tel"
                    name="phone"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={handleChange}
                    className={styles.underlineInput}
                    required
                  />
                  {errors.phone && <span className={styles.errorMessage}>{errors.phone}</span>}
                </div>

                {/* Message Field */}
                <div className={styles.formGroup}>
                  <label htmlFor="contact-message" className={styles.formLabel}>
                    Message <span className={styles.requiredStar}>*</span>
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={3}
                    placeholder="Tell us about your stay dates and guests..."
                    value={formData.message}
                    onChange={handleChange}
                    className={styles.underlineTextarea}
                    required
                  />
                  {errors.message && <span className={styles.errorMessage}>{errors.message}</span>}
                </div>

                {serverError && <div className={styles.errorMessage}>{serverError}</div>}

                {/* Submit Row */}
                <div className={styles.submitRow}>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={styles.submitButton}
                  >
                    <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
                    <span>&rarr;</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}
