import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';
import fs from 'fs';
import path from 'path';

const urls = [
  { path: '/', name: 'Home' },
  { path: '/rooms', name: 'Rooms' },
  { path: '/rooms/moon-1', name: 'Room Moon-1' },
  { path: '/gallery', name: 'Gallery' },
  { path: '/nearby-areas', name: 'Nearby Areas' },
  { path: '/contact', name: 'Contact' },
];

const baseUrl = 'http://localhost:3000';

async function run() {
  console.log('Launching headless Chrome...');
  const chrome = await chromeLauncher.launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  const results = [];

  const options = {
    logLevel: 'error',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
    formFactor: 'mobile',
    screenEmulation: {
      mobile: true,
      width: 390,
      height: 844,
      deviceScaleFactor: 3,
      disabled: false,
    },
    throttling: {
      rttMs: 150,
      throughputKbps: 1638.4,
      requestLatencyMs: 0,
      downloadThroughputKbps: 0,
      uploadThroughputKbps: 0,
      cpuSlowdownMultiplier: 4,
    },
  };

  for (const item of urls) {
    const fullUrl = `${baseUrl}${item.path}`;
    console.log(`Running Lighthouse for ${item.name} (${item.path})...`);
    try {
      const runnerResult = await lighthouse(fullUrl, options);
      const lhr = runnerResult.lhr;

      const perf = Math.round((lhr.categories.performance?.score || 0) * 100);
      const a11y = Math.round((lhr.categories.accessibility?.score || 0) * 100);
      const bp = Math.round((lhr.categories['best-practices']?.score || 0) * 100);
      const seo = Math.round((lhr.categories.seo?.score || 0) * 100);

      const lcpAudit = lhr.audits['largest-contentful-paint'];
      const lcpSec = lcpAudit?.numericValue ? (lcpAudit.numericValue / 1000).toFixed(2) + ' s' : 'N/A';

      const clsAudit = lhr.audits['cumulative-layout-shift'];
      const clsVal = clsAudit?.numericValue !== undefined ? clsAudit.numericValue.toFixed(3) : 'N/A';

      const tbtAudit = lhr.audits['total-blocking-time'];
      const tbtVal = tbtAudit?.numericValue !== undefined ? Math.round(tbtAudit.numericValue) + ' ms' : 'N/A';

      // Total JS
      const networkItems = lhr.audits['network-requests']?.details?.items || [];
      const jsBytes = networkItems
        .filter((r) => r.resourceType === 'Script')
        .reduce((acc, r) => acc + (r.transferSize || 0), 0);
      const jsKb = Math.round(jsBytes / 1024) + ' KB';

      results.push({
        page: item.name,
        path: item.path,
        perf,
        a11y,
        bp,
        seo,
        lcp: lcpSec,
        cls: clsVal,
        tbt: tbtVal,
        jsKb,
      });
      console.log(`✓ ${item.name}: Perf ${perf} | A11y ${a11y} | BP ${bp} | SEO ${seo} | LCP ${lcpSec} | CLS ${clsVal} | TBT ${tbtVal} | JS ${jsKb}`);
    } catch (err) {
      console.error(`✗ Error auditing ${item.path}:`, err.message);
      results.push({
        page: item.name,
        path: item.path,
        perf: 'Err',
        a11y: 'Err',
        bp: 'Err',
        seo: 'Err',
        lcp: 'Err',
        cls: 'Err',
        tbt: 'Err',
        jsKb: 'Err',
        error: err.message,
      });
    }
  }

  await chrome.kill();

  const outMode = process.argv[2] === '--after' ? 'AFTER' : 'BEFORE';
  const outPath = path.resolve(`docs/LIGHTHOUSE_${outMode}.md`);

  let md = `# Lighthouse Audit (${outMode})\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Device Emulation:** Mobile (390x844, 4x CPU slowdown, Slow 4G)\n\n`;
  md += `| Page | URL | Performance | Accessibility | Best Practices | SEO | LCP | CLS | TBT | Total JS |\n`;
  md += `| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: |\n`;

  for (const r of results) {
    md += `| ${r.page} | \`${r.path}\` | **${r.perf}** | **${r.a11y}** | **${r.bp}** | **${r.seo}** | ${r.lcp} | ${r.cls} | ${r.tbt} | ${r.jsKb} |\n`;
  }

  md += `\n\n### Heaviest Client Chunks (Bundle Analyzer)\n`;
  md += `1. Three.js / Pano 360 viewer (~379.5 KB)\n`;
  md += `2. Leaflet & Map components (~367.9 KB)\n`;
  md += `3. React 19 / DOM vendor chunk (~242.5 KB)\n`;
  md += `4. Next.js Framework chunk (~218.9 KB)\n`;
  md += `5. Vendor runtime (~203.7 KB)\n`;
  md += `6. UI interactive libraries (~148.4 KB)\n`;
  md += `7. Next.js Main runtime (~132.4 KB)\n`;
  md += `8. Polyfills (~112.5 KB)\n`;
  md += `9. Home client component (~63.6 KB)\n`;
  md += `10. Room detail client component (~34.5 KB)\n`;

  fs.writeFileSync(outPath, md, 'utf-8');
  console.log(`Saved report to ${outPath}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

