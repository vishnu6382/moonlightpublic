'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { siteConfig } from '@/content/site';
import { buildWhatsAppLink } from '@/lib/whatsapp';
import { fxConfig } from '@/lib/fxConfig';
import styles from './Nav.module.css';

export default function Nav({ logo: initialLogo }) {
  const [logo, setLogo] = useState(initialLogo || null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isOverIntro, setIsOverIntro] = useState(false);
  const [isIntroDone, setIsIntroDone] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [menuOrigin, setMenuOrigin] = useState({ x: '90%', y: '36px' });

  // Desktop glide moon indicator state
  const [gliderPos, setGliderPos] = useState({ left: 0, opacity: 0, phase: 1 });
  const [hoveredLink, setHoveredLink] = useState(null);

  const pathname = usePathname();
  const navContainerRef = useRef(null);
  const navLinksRef = useRef([]);
  const hamburgerRef = useRef(null);
  const lastScrollYRef = useRef(0);
  const rafIdRef = useRef(null);

  useEffect(() => {
    if (initialLogo) {
      setLogo(initialLogo);
      return;
    }
    fetch('/api/site-logo')
      .then((r) => r.json())
      .then((d) => {
        if (d?.logo) setLogo(d.logo);
      })
      .catch(() => {});
  }, [initialLogo]);

  // Check intro status
  useEffect(() => {
    const checkIntro = () => {
      if (document.documentElement.dataset.intro === 'done') {
        setIsIntroDone(true);
      }
    };
    checkIntro();
    window.addEventListener('moon:introdone', checkIntro);
    return () => window.removeEventListener('moon:introdone', checkIntro);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Check if Nav is currently positioned over Intro on Home page
  useEffect(() => {
    if (pathname !== '/') {
      setIsOverIntro(false);
      setIsIntroDone(true);
      return;
    }

    let introHeight = 0;
    const updateIntroHeight = () => {
      const introEl = document.querySelector('[data-intro-section="true"]');
      introHeight = introEl ? introEl.offsetHeight : 0;
    };
    updateIntroHeight();

    const checkIntro = () => {
      if (introHeight === 0) {
        setIsOverIntro(false);
        return;
      }
      setIsOverIntro(window.scrollY < (introHeight - 80));
    };

    checkIntro();
    window.addEventListener('scroll', checkIntro, { passive: true });
    window.addEventListener('resize', () => {
      updateIntroHeight();
      checkIntro();
    }, { passive: true });
    return () => {
      window.removeEventListener('scroll', checkIntro);
    };
  }, [pathname]);

  // Floating pill & Hide-on-scroll logic
  useEffect(() => {
    const handleScroll = () => {
      if (rafIdRef.current) return;
      rafIdRef.current = requestAnimationFrame(() => {
        rafIdRef.current = null;
        const currentY = window.scrollY;

        // Floating glass pill (scrollY > 24 after intro)
        if (fxConfig.navPill && (isIntroDone || pathname !== '/')) {
          setIsFloating(currentY > 24);
        } else {
          setIsFloating(false);
        }

        // Hide on scroll down / show on scroll up (threshold 8px, top threshold 80px)
        const diff = currentY - lastScrollYRef.current;
        if (currentY > 80 && diff > 8 && !isMenuOpen) {
          setIsHidden(true);
        } else if (diff < -8 || currentY <= 80) {
          setIsHidden(false);
        }

        lastScrollYRef.current = currentY;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, [isIntroDone, isMenuOpen, pathname]);

  // Lock body scroll and ESC listener for mobile menu
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        if (hamburgerRef.current) hamburgerRef.current.focus();
      }
    };

    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.body.dataset.menuOpen = 'true';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
      delete document.body.dataset.menuOpen;
    }
    return () => {
      document.body.style.overflow = '';
      delete document.body.dataset.menuOpen;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMenuOpen]);

  const toggleMenu = () => {
    if (!isMenuOpen && hamburgerRef.current) {
      const rect = hamburgerRef.current.getBoundingClientRect();
      const x = `${Math.round(rect.left + rect.width / 2)}px`;
      const y = `${Math.round(rect.top + rect.height / 2)}px`;
      setMenuOrigin({ x, y });
    }
    setIsMenuOpen((prev) => !prev);
  };

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const handleNavClick = (e, link) => {
    if (link.name === 'Contact') {
      const contactEl = document.getElementById('contact');
      if (contactEl) {
        e.preventDefault();
        contactEl.scrollIntoView({ behavior: 'smooth' });
        setIsMenuOpen(false);
      }
    }
  };

  // Desktop Moon-phase indicator position calculation
  const updateGlider = useCallback(() => {
    if (!fxConfig.navMoon) return;
    const targetLink = hoveredLink || siteConfig.navLinks.find((l) => isActive(l.href));
    if (!targetLink) {
      setGliderPos((p) => ({ ...p, opacity: 0 }));
      return;
    }

    const idx = siteConfig.navLinks.findIndex((l) => l.href === targetLink.href);
    const linkEl = navLinksRef.current[idx];
    const container = navContainerRef.current;

    if (linkEl && container) {
      const linkRect = linkEl.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      const center = linkRect.left - containerRect.left + linkRect.width / 2 - 4; // 8px dot center
      const phase = hoveredLink ? (hoveredLink.href === targetLink.href ? 1 : 0.4) : 1;
      setGliderPos({ left: center, opacity: 1, phase });
    }
  }, [hoveredLink, pathname]);

  useEffect(() => {
    updateGlider();
    window.addEventListener('resize', updateGlider);
    document.fonts?.ready?.then(updateGlider);
    return () => window.removeEventListener('resize', updateGlider);
  }, [updateGlider]);

  const whatsappHref = buildWhatsAppLink({
    number: siteConfig.whatsapp || siteConfig.phoneRaw,
  });

  return (
    <>
      {/* Spacer to avoid layout jump when floating pill is active */}
      {isFloating && <div className={styles.navSpacer} aria-hidden="true" />}

      <header
        className={`${styles.header} ${
          isOverIntro && !isMenuOpen && !isFloating ? styles.navOverIntro : ''
        } ${isMenuOpen ? styles.headerMenuOpen : ''} ${
          isFloating ? styles.floatingPill : ''
        } ${isHidden && !isMenuOpen ? styles.navHidden : ''}`}
      >
        <a href="#main-content" className={styles.skipToContent}>
          Skip to main content
        </a>
        <div className={styles.inner}>
          {/* Brand / Logo */}
          <Link href="/" className={styles.brand} aria-label={`${siteConfig.name} Home`}>
            <div className={styles.logoMarkWrapper}>
              <div className={styles.logoHalo} aria-hidden="true" />
              {logo?.url ? (
                <img
                  src={logo.url}
                  alt={logo.alt || siteConfig.name}
                  className={styles.customLogoImg}
                />
              ) : (
                <svg
                  className={styles.logoIcon}
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M22 4.5 C13 4.5 6 11.5 6 20.5 C6 25 8 28.5 11 30.5 C7 28.5 4 24 4 19 C4 10.7 10.7 4 19 4 C20.5 4 22 4.3 22 4.5 Z"
                    fill="currentColor"
                  />
                  <circle cx="21" cy="9" r="1.5" fill="#D4C76F" />
                </svg>
              )}
              {/* 8s Twinkle Star */}
              <span className={styles.logoStar} aria-hidden="true">✦</span>
            </div>
            {(!logo?.url || logo?.showText !== false) && (
              <span className={styles.brandText}>
                MOON <span className={styles.brandLight}>LIGHT</span> RESORT
              </span>
            )}
          </Link>

          {/* Desktop Navigation Links */}
          <nav
            ref={navContainerRef}
            className={styles.desktopNav}
            aria-label="Main Navigation"
            onMouseLeave={() => setHoveredLink(null)}
          >
            {siteConfig.navLinks.map((link, idx) => {
              const active = isActive(link.href);
              const isContact = link.name === 'Contact';
              return (
                <Link
                  key={link.href}
                  ref={(el) => (navLinksRef.current[idx] = el)}
                  href={isContact ? '#contact' : link.href}
                  prefetch={false}
                  onClick={(e) => handleNavClick(e, link)}
                  onMouseEnter={() => setHoveredLink(link)}
                  className={`${styles.navLink} ${active ? styles.activeLink : ''}`}
                  aria-current={active ? 'page' : undefined}
                >
                  {link.name}
                </Link>
              );
            })}

            {/* Moon-phase glide dot indicator */}
            {fxConfig.navMoon && (
              <span
                className={styles.moonGlider}
                style={{
                  transform: `translateX(${gliderPos.left}px)`,
                  opacity: gliderPos.opacity,
                }}
                aria-hidden="true"
              >
                <svg viewBox="0 0 8 8" className={styles.gliderSvg}>
                  <circle cx="4" cy="4" r="3.5" fill="#C9A25C" />
                  <ellipse
                    cx={4 + (1 - gliderPos.phase) * 3}
                    cy="4"
                    rx={3.5 * (1 - gliderPos.phase * 0.9)}
                    ry="3.5"
                    fill="#1F1B16"
                  />
                </svg>
              </span>
            )}

            {/* Desktop Call Us Button with gentle pulse */}
            <a
              href={`tel:${siteConfig.phoneRaw || '+919894486300'}`}
              className={styles.callButton}
              aria-label="Call Moon Light Resort"
            >
              <span>Call Us</span>
              <svg
                className={styles.phoneIcon}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
              </svg>
            </a>
          </nav>

          {/* Mobile Right Actions: Call button + Hamburger Toggle */}
          <div className={styles.mobileActions}>
            <a
              href={`tel:${siteConfig.phoneRaw || '+919894486300'}`}
              className={styles.mobileCallPill}
              aria-label="Call Moon Light Resort"
            >
              <svg
                className={styles.phoneIcon}
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
              </svg>
              <span>Call</span>
            </a>

            <button
              ref={hamburgerRef}
              type="button"
              className={styles.mobileToggle}
              onClick={toggleMenu}
              aria-expanded={isMenuOpen}
              aria-label={isMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            >
              <svg
                className={styles.hamburgerIcon}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                {isMenuOpen ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Drawer Menu (Moonrise Circular Reveal) */}
        <div
          className={`${styles.mobileMenu} ${isMenuOpen ? styles.mobileMenuOpen : ''}`}
          style={{
            '--origin-x': menuOrigin.x,
            '--origin-y': menuOrigin.y,
          }}
          aria-hidden={!isMenuOpen}
          inert={!isMenuOpen ? true : undefined}
        >
          <div className={styles.mobileLinksList}>
            {siteConfig.navLinks.map((link, idx) => {
              const active = isActive(link.href);
              const isContact = link.name === 'Contact';
              const stagger = idx * 70;
              return (
                <Link
                  key={link.href}
                  href={isContact ? '#contact' : link.href}
                  prefetch={false}
                  style={{ transitionDelay: `${stagger}ms` }}
                  className={`${styles.mobileNavLink} ${active ? styles.mobileNavActive : ''}`}
                  onClick={(e) => {
                    handleNavClick(e, link);
                    setIsMenuOpen(false);
                  }}
                >
                  {active && (
                    <span className={styles.mobileMoonDot} aria-hidden="true" />
                  )}
                  <span>{link.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Menu Action Row: Call Us + WhatsApp equal 48px buttons */}
          <div className={styles.mobileActionsRow}>
            <a
              href={`tel:${siteConfig.phoneRaw || '+919894486300'}`}
              className={styles.mobileActionCall}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 011 1V20a1 1 0 01-1 1A17 17 0 013 4a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.45.57 3.57a1 1 0 01-.24 1.02l-2.21 2.2z" />
              </svg>
              <span>Call Us</span>
            </a>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.mobileActionWhatsapp}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-5.46-4.45-9.91-9.91-9.91zm5.79 14.04c-.24.67-1.4 1.28-1.92 1.36-.51.08-1.18.11-3.41-.81-2.23-.92-3.66-3.19-3.77-3.34-.11-.15-.91-1.21-.91-2.31 0-1.1.58-1.64.78-1.87.2-.23.44-.29.58-.29.14 0 .28.01.41.01.13 0 .31-.05.48.36.18.41.61 1.49.66 1.6.05.11.09.24.02.39-.07.15-.11.24-.22.37-.11.13-.23.29-.33.39-.11.11-.23.24-.1.46.13.22.58.96 1.25 1.55.86.77 1.58 1.01 1.8 1.12.22.11.35.1.48-.05.13-.15.56-.65.71-.87.15-.22.3-.18.51-.1.21.08 1.34.63 1.57.75.23.12.38.18.44.28.06.1.06.58-.18 1.25z" />
              </svg>
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>
    </>
  );
}
