import sharp from 'sharp';

// Create a visual diagram matching the blank white template described:
// 10 tiles around ONE round portal in the centre:
// Left column = 3 stacked tiles, Right column = 3 stacked tiles,
// 4 larger tiles in the middle (2 above, 2 below), each with concave circular notch hugging the portal.
const svg = `
<svg width="1200" height="750" viewBox="0 0 1200 750" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="750" fill="#F4F1EA" />
  
  <!-- Left column: 3 stacked tiles -->
  <rect x="50" y="50" width="240" height="195" rx="20" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />
  <rect x="50" y="275" width="240" height="195" rx="20" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />
  <rect x="50" y="500" width="240" height="195" rx="20" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />

  <!-- Right column: 3 stacked tiles -->
  <rect x="910" y="50" width="240" height="195" rx="20" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />
  <rect x="910" y="275" width="240" height="195" rx="20" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />
  <rect x="910" y="500" width="240" height="195" rx="20" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />

  <!-- Middle 4 tiles with concave circular notch at center (600, 375, r=130) -->
  <!-- Top-Left middle -->
  <path d="M 320,50 L 585,50 A 20,20 0 0 1 605,70 L 605,245 A 130,130 0 0 0 470,375 L 340,375 A 20,20 0 0 1 320,355 Z" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />
  
  <!-- Top-Right middle -->
  <path d="M 615,70 A 20,20 0 0 1 635,50 L 880,50 A 20,20 0 0 1 900,70 L 900,355 A 20,20 0 0 1 880,375 L 730,375 A 130,130 0 0 0 615,245 Z" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />

  <!-- Bottom-Left middle -->
  <path d="M 320,395 A 20,20 0 0 1 340,375 L 470,375 A 130,130 0 0 0 605,505 L 605,680 A 20,20 0 0 1 585,700 L 320,700 Z" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />

  <!-- Bottom-Right middle -->
  <path d="M 730,375 L 880,375 A 20,20 0 0 1 900,395 L 900,680 A 20,20 0 0 1 880,700 L 615,700 L 615,505 A 130,130 0 0 0 730,375 Z" fill="#FFFFFF" stroke="#E2DAC9" stroke-width="2" />

  <!-- Center Portal Circle -->
  <circle cx="600" cy="375" r="115" fill="#FFFFFF" stroke="#8C7355" stroke-width="6" />
  <circle cx="600" cy="375" r="95" fill="#FAF6EE" stroke="#E2DAC9" stroke-width="2" />
  <text x="600" y="380" font-family="sans-serif" font-size="14" font-weight="bold" fill="#8C7355" text-anchor="middle">MOON LIGHT RESORT PORTAL</text>
</svg>
`;

sharp(Buffer.from(svg))
  .jpeg({ quality: 95 })
  .toFile('references/room-gallery-portal-layout.jpg')
  .then(() => console.log('Created references/room-gallery-portal-layout.jpg'))
  .catch(err => console.error(err));
