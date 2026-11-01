# Moon Light Resort

Official website and content management system for Moon Light Resort in Nedungulam, Salem District, Tamil Nadu.

## Features

- **Next.js App Router** with Static Generation (SSG) & Incremental Static Regeneration (ISR).
- **Zero-Credit Image & Media Delivery**: Direct Cloudinary delivery bypassing serverless image transformation pipelines.
- **Embedded Admin Portal**: Secure resort management for Rooms, Media, Events, Reviews, and Site Settings.
- **Interactive 360° Panorama Viewer**: Virtual room tours powered by Three.js and Photo Sphere Viewer.
- **SEO & Social Optimization**: Schema.org Resort / LodgingBusiness JSON-LD, automated sitemap, and OpenGraph cards.

## Getting Started Locally

### Prerequisites

- Node.js `20.x` or later
- npm `10.x` or later
- MongoDB Atlas cluster (or local MongoDB database)
- Cloudinary media account

### Installation

1. Clone repository:
   ```bash
   git clone <repo-url>
   cd moonlight-resort
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Copy `.env.example` to `.env.local` and populate the required configuration values:
   ```bash
   cp .env.example .env.local
   ```

4. Build and run:
   ```bash
   # Development server
   npm run dev

   # Production build and start (recommended for testing true speed)
   npm run build
   npm start
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Required Environment Variables

All secrets are managed through environment variables and must NEVER be committed to Git. See `.env.example` for reference names:

| Variable Name | Description | Required For |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas replica set / SRV connection string | Public Site & Admin |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud identifier | Media uploads & rendering |
| `CLOUDINARY_API_KEY` | Cloudinary public API key | Media upload signing |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | Media management API |
| `ADMIN_EMAIL` | Admin login account email | Admin portal |
| `ADMIN_PASSWORD_HASH` | Bcrypt password hash for admin | Admin authentication |
| `AUTH_SECRET` | 32+ character key for JWT session encryption | Admin session tokens |
| `SITE_URL` | Canonical URL (e.g., https://your-site.netlify.app) | SEO, Sitemap, Canonical tags |
| `NEXT_PUBLIC_SITE_URL` | Public site URL reference | Client fallback URLs |
| `NEXT_PUBLIC_SITE_ENV` | Environment mode (`production`, `staging`, `preview`) | Staging robots control |
| `GOOGLE_SITE_VERIFICATION` | Optional Google Search Console verification token | Search indexing verification |

## Available Scripts

- `npm run dev`: Starts local development server on port 3000.
- `npm run build`: Executes demo verification, prepares panoramic previews, and creates production build.
- `npm start`: Starts production Node.js server.
- `npm run check:demo`: Scans source files and build output to verify zero demo or placeholder paths exist.
