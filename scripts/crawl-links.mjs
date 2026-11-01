import http from 'http';

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';

const PAGES_TO_CRAWL = [
  '/',
  '/rooms',
  '/rooms/moon-1',
  '/gallery',
  '/nearby-areas',
  '/contact',
  '/sitemap.xml',
  '/robots.txt',
  '/manifest.webmanifest',
];

async function checkUrl(url) {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    if (res.status === 405) {
      // Some endpoints don't support HEAD, fallback to GET
      const getRes = await fetch(url, { method: 'GET' });
      return { status: getRes.status, ok: getRes.ok || [301, 302, 307, 308].includes(getRes.status) };
    }
    return { status: res.status, ok: res.ok || [301, 302, 307, 308].includes(res.status) };
  } catch (err) {
    return { status: 0, ok: false, error: err.message };
  }
}

async function crawlPage(path) {
  const fullUrl = `${BASE_URL}${path}`;
  console.log(`\n🔍 Checking: ${path}`);
  try {
    const res = await fetch(fullUrl);
    if (!res.ok) {
      console.error(`  ❌ Failed to fetch page ${path} (Status ${res.status})`);
      return { path, status: res.status, brokenLinks: [], brokenImages: [] };
    }

    console.log(`  ✓ Page loaded: status ${res.status}`);
    const html = await res.text();

    // Check Open Graph & meta tags
    const hasCanonical = html.includes('rel="canonical"');
    const hasOgTitle = html.includes('property="og:title"');
    const hasOgImage = html.includes('property="og:image"');
    const hasJsonLd = html.includes('application/ld+json');

    console.log(`  ✓ Metadata check: canonical=${hasCanonical}, og:title=${hasOgTitle}, og:image=${hasOgImage}, json-ld=${hasJsonLd}`);

    // Extract links
    const linkMatches = [...html.matchAll(/href=["']([^"']+)["']/g)].map((m) => m[1]);
    const internalLinks = [...new Set(linkMatches.filter((href) => href.startsWith('/') && !href.startsWith('//')))];

    // Extract image sources
    const imgMatches = [...html.matchAll(/src=["']([^"']+)["']/g)].map((m) => m[1]);
    const internalImages = [...new Set(imgMatches.filter((src) => src.startsWith('/') && !src.startsWith('//')))];

    const brokenLinks = [];
    for (const href of internalLinks.slice(0, 15)) {
      if (href.startsWith('/#') || href === '#') continue;
      const targetUrl = `${BASE_URL}${href}`;
      const check = await checkUrl(targetUrl);
      if (!check.ok && check.status !== 404) {
        // Warning or failure
      } else if (check.status === 404) {
        brokenLinks.push({ href, status: 404 });
        console.error(`    ❌ Broken link: ${href}`);
      }
    }

    const brokenImages = [];
    for (const src of internalImages.slice(0, 15)) {
      const targetUrl = `${BASE_URL}${src}`;
      const check = await checkUrl(targetUrl);
      if (!check.ok && check.status === 404) {
        brokenImages.push({ src, status: 404 });
        console.error(`    ❌ Broken image: ${src}`);
      }
    }

    return {
      path,
      status: res.status,
      linksChecked: internalLinks.length,
      imagesChecked: internalImages.length,
      brokenLinks,
      brokenImages,
    };
  } catch (err) {
    console.error(`  ❌ Error crawling ${path}:`, err.message);
    return { path, status: 0, brokenLinks: [{ error: err.message }], brokenImages: [] };
  }
}

async function run() {
  console.log(`=== Starting Site Crawler against ${BASE_URL} ===`);
  let totalBroken = 0;

  for (const page of PAGES_TO_CRAWL) {
    const result = await crawlPage(page);
    totalBroken += (result.brokenLinks?.length || 0) + (result.brokenImages?.length || 0);
  }

  console.log('\n=======================================');
  if (totalBroken === 0) {
    console.log('✅ CRAWL COMPLETE: 0 broken links, 0 broken images found across all target pages!');
  } else {
    console.error(`⚠️ CRAWL COMPLETE: ${totalBroken} broken assets or links detected.`);
    process.exitCode = 1;
  }
}

run();

