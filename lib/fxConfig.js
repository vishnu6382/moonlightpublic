/**
 * Feature flags for Home Page Moonlight Effects (TASK 09b)
 * Any single effect can be toggled on/off by setting its flag.
 */
export const fxConfig = {
  sectionLight: true,
  coveLight: true,
  coveSweep: true,
  logoGlow: true,
  scrollLine: true,
  photoParallax: false,
  headingUnderline: true,
  bentoAssemble: false,
  textReveal: false,
  photoRise: false,
  eventsArc: true,
  navMoon: true,
  navPill: true,
  mobileMenuMoonrise: true,
  bottomBar: true,
  bloom: true,
  cursorFx: true,
  nearbyCards: true,
};

/**
 * Routes where cursor / touch FX should be active.
 * "*" enables all pages; currently Home only.
 */
export const cursorFxRoutes = ['/'];
