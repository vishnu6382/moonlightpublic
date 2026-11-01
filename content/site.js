// SITE CONFIGURATION (Editable in Admin later)
// Rule: No About page, no invented facts.
// Real location: Nedungulam, Tamil Nadu.

export const siteConfig = {
  name: 'Moon Light Resort',
  tagline: 'Together Time in Nedungulam',
  phone: '+91 98944 86300',
  phoneRaw: '+919894486300',
  secondaryPhone: '+91 90878 44300',
  secondaryPhoneRaw: '+919087844300',
  whatsapp: '919894486300',
  email: '', // Hidden if empty
  address: 'Thambagoundanoor to Idappadi main Road, Koneripatti, Nedungulam, Tamil Nadu',
  googleMapsUrl: 'https://maps.app.goo.gl/88PESuxyaya3imxYA',
  metaDescription:
    'Moon Light Resort in Nedungulam, Tamil Nadu offers villa rooms, dorms, a clean pool, and open spaces for families and group stays.',
  socialLinks: [
    { name: 'Instagram', url: 'https://www.instagram.com/moonlightresortstays' },
    { name: 'Facebook', url: '' }, // Empty URL hidden automatically
  ],
  // NO ABOUT LINK: Only Home, Rooms, Gallery, Contact, Nearby Areas
  navLinks: [
    { name: 'Home', href: '/' },
    { name: 'Rooms', href: '/rooms' },
    { name: 'Gallery', href: '/gallery' },
    { name: 'Contact', href: '/contact' },
    { name: 'Nearby Areas', href: '/nearby-areas' },
  ],
  intro: {
    eyebrow: 'NEDUNGULAM • TAMIL NADU',
    headingLine1: 'Villa Rooms & Dorms',
    headingLine2: 'Together Time in Nedungulam',
    description:
      'A simple, comfortable base for families and groups with private villa rooms, convenient dorms, a clean pool, and open spaces.',
    ctaText: 'Explore Rooms →',
    ctaHref: '/rooms',
    rightPanelTitle: 'RESORT AT A GLANCE',
    features: [
      { id: 'rooms', title: 'Villa Rooms & Dorms', icon: 'bed' },
      { id: 'spaces', title: 'Open Spaces', icon: 'leaf' },
      { id: 'pool', title: 'Clean Swimming Pool', icon: 'pool' },
      { id: 'scale', title: '10 Comfortable Rooms', icon: 'sparkles' },
    ],
    welcomeSubtitle: 'WELCOME TO',
    welcomeTitle: 'Moon Light Resort',
  },
};
