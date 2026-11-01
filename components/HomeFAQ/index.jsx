'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Section from '@/components/Section';
import FadeUp from '@/components/FadeUp';
import SectionBackdrop from '@/components/SectionBackdrop';
import styles from './HomeFAQ.module.css';

export default function HomeFAQ({
  faqs = [],
  id = 'faq',
  showHeader = true,
}) {
  const [openId, setOpenId] = useState(faqs[0]?.id || null);

  // Hide cleanly if no FAQs
  if (!faqs || faqs.length === 0) {
    return null;
  }

  const toggleItem = (itemId) => {
    setOpenId((prev) => (prev === itemId ? null : itemId));
  };

  // Emit FAQPage JSON-LD when FAQs exist
  const jsonLd = faqs.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  } : null;

  return (
    <Section id={id} spacing="xl" variant="white" className={styles.faqSection} data-moon-section="true" style={{ position: 'relative', overflow: 'hidden' }}>
      <SectionBackdrop align="right" />
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}

      <FadeUp>
        <div className={styles.mainGrid}>
          {/* Left Intro Column (Desktop) */}
          <div className={styles.introCol}>
            <span className={styles.sectionLabel}>QUICK ANSWERS</span>
            <h2 className={styles.sectionTitle}>Frequently Asked Questions</h2>
            <p className={styles.introText}>
              Find clear answers to essential questions about stay arrangements, timings, and resort amenities at Moon Light Resort in Nedungulam.
            </p>
            <div className={styles.contactPrompt}>
              <span className={styles.promptLabel}>Have more questions?</span>
              <Link href="#contact" className={styles.contactLink}>
                <span>Talk to our team</span>
                <span className={styles.linkArrow}>&rarr;</span>
              </Link>
            </div>
          </div>

          {/* Right Accordion Column */}
          <div className={styles.accordionCol} role="region" aria-label="Frequently Asked Questions">
            {faqs.map((faq, idx) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id || idx}
                  className={`${styles.accordionItem} ${isOpen ? styles.itemOpen : ''}`}
                >
                  <button
                    type="button"
                    className={styles.questionBtn}
                    onClick={() => toggleItem(faq.id)}
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${faq.id}`}
                  >
                    <span className={styles.questionText}>
                      {faq.question}
                    </span>
                    <span className={`${styles.chevron} ${isOpen ? styles.chevronRotated : ''}`} aria-hidden="true">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </span>
                  </button>

                  <div
                    id={`faq-answer-${faq.id}`}
                    className={`${styles.answerWrap} ${isOpen ? styles.answerOpen : ''}`}
                    aria-hidden={!isOpen}
                  >
                    <div className={styles.answerInner}>
                      <p className={styles.answerText}>{faq.answer}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </FadeUp>
    </Section>
  );
}
