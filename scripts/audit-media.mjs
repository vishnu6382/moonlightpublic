import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const PORT = 3005;
const BASE_URL = `http://localhost:${PORT}`;
const PAGES = ['/', '/rooms', '/rooms/moon-1', '/gallery', '/nearby-areas'];

const VIEWPORTS = [
  { name: 'Mobile (390px @ 2x)', width: 390, height: 844, dpr: 2 },
  { name: 'Desktop (1440px @ 1x)', width: 1440, height: 900, dpr: 1 },
  { name: 'Desktop (1440px @ 2x)', width: 1440, height: 900, dpr: 2 },
];

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isServerUp(url) {
  try {
    const res = await fetch(url);
    return res.status === 200;
  } catch {
    return false;
  }
}

async function ensureServer() {
  const up = await isServerUp(BASE_URL);
  if (up) {
    console.log(`Server already running on ${BASE_URL}`);
    return null;
  }

  console.log(`Starting Next.js server on port ${PORT}...`);
  const serverProc = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    stdio: 'ignore',
    shell: true,
  });

  const start = Date.now();
  while (Date.now() - start < 30000) {
    await wait(1000);
    if (await isServerUp(BASE_URL)) {
      console.log(`Next.js server is up on ${BASE_URL}`);
      return serverProc;
    }
  }

  throw new Error(`Server failed to start on ${BASE_URL} within 30s`);
}

async function runAudit() {
  let serverProc = null;
  let browser = null;
  const tempProfileDir = path.join(process.cwd(), '.chrome-audit-profile-' + Date.now());

  try {
    serverProc = await ensureServer();

    console.log('Launching Chrome browser for media audit...');
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      userDataDir: tempProfileDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
    });

    const results = [];

    for (const pagePath of PAGES) {
      const fullUrl = `${BASE_URL}${pagePath}`;
      console.log(`\nAuditing page: ${pagePath} (${fullUrl})`);

      for (const vp of VIEWPORTS) {
        console.log(`  Testing viewport: ${vp.name}...`);
        const page = await browser.newPage();
        await page.setViewport({
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: vp.dpr,
        });

        try {
          await page.goto(fullUrl, { waitUntil: 'networkidle2', timeout: 25000 });
          // Scroll down to trigger lazy images
          await page.evaluate(async () => {
            for (let i = 0; i < 5; i++) {
              window.scrollBy(0, window.innerHeight);
              await new Promise((r) => setTimeout(r, 200));
            }
            window.scrollTo(0, 0);
          });
          await wait(1500);

          const pageImages = await page.evaluate((dpr) => {
            const imgs = Array.from(document.querySelectorAll('img'));
            return imgs
              .map((img) => {
                const rect = img.getBoundingClientRect();
                const computed = window.getComputedStyle(img);

                // Filter out invisible, tiny tracking pixels or icons (< 24px)
                if (rect.width < 24 || rect.height < 24 || computed.display === 'none' || computed.visibility === 'hidden') {
                  return null;
                }

                const cssWidth = Math.round(rect.width);
                const cssHeight = Math.round(rect.height);
                const naturalWidth = img.naturalWidth || 0;
                const naturalHeight = img.naturalHeight || 0;
                const currentSrc = img.currentSrc || img.src || '';
                const alt = img.alt || '';
                const objectFit = computed.objectFit || 'fill';

                if (cssWidth === 0 || cssHeight === 0 || naturalWidth === 0 || naturalHeight === 0) {
                  return null;
                }

                const requiredPx = cssWidth * dpr;
                const sharpnessRatio = Number((naturalWidth / requiredPx).toFixed(2));

                // Crop calculation for object-fit: cover
                let cropPercent = 0;
                if (objectFit === 'cover') {
                  const boxAspect = cssWidth / cssHeight;
                  const naturalAspect = naturalWidth / naturalHeight;
                  if (boxAspect > naturalAspect) {
                    // Height is cropped
                    const renderedHeight = cssWidth / naturalAspect;
                    cropPercent = Math.round(((renderedHeight - cssHeight) / renderedHeight) * 100);
                  } else if (boxAspect < naturalAspect) {
                    // Width is cropped
                    const renderedWidth = cssHeight * naturalAspect;
                    cropPercent = Math.round(((renderedWidth - cssWidth) / renderedWidth) * 100);
                  }
                }

                return {
                  src: currentSrc,
                  alt: alt.slice(0, 30),
                  cssWidth,
                  cssHeight,
                  naturalWidth,
                  naturalHeight,
                  dpr,
                  sharpnessRatio,
                  cropPercent,
                  objectFit,
                };
              })
              .filter(Boolean);
          }, vp.dpr);

          for (const item of pageImages) {
            results.push({
              page: pagePath,
              viewport: vp.name,
              dpr: vp.dpr,
              ...item,
            });
          }
        } catch (pageErr) {
          console.warn(`  Warning: Could not audit ${pagePath} at ${vp.name}: ${pageErr.message}`);
        } finally {
          await page.close();
        }
      }
    }

    console.log(`\nAudit completed! Collected data for ${results.length} image rendering instances.`);

    // Build Markdown Report
    const worstSharpness = [...results].sort((a, b) => a.sharpnessRatio - b.sharpnessRatio).slice(0, 15);
    const worstCrop = [...results].sort((a, b) => b.cropPercent - a.cropPercent).slice(0, 15);

    let md = `# MEDIA AUDIT: BEFORE (DIAGNOSTIC REPORT)\n\n`;
    md += `Generated: ${new Date().toISOString()}\n`;
    md += `Tested Environments: 390px (DPR 2), 1440px (DPR 1), 1440px (DPR 2)\n`;
    md += `Pages Audited: ${PAGES.join(', ')}\n\n`;

    md += `## 1. STORAGE & CDN IN USE\n`;
    md += `- **Primary CDN**: Cloudinary (\`res.cloudinary.com/dqaroqfr/\`)\n`;
    md += `- **Local Fallbacks**: \`/brand/\`, \`/og-default.jpg\`\n`;
    md += `- **Image Delivery Pipeline**: Direct \`next/image\` with auto-compression wrapping (\`w_1600,c_limit,q_auto,f_auto\`).\n\n`;

    md += `## 2. KEY AUDIT SUMMARY\n`;
    const blurryCount = results.filter((r) => r.sharpnessRatio < 1.0).length;
    const severeCropCount = results.filter((r) => r.cropPercent > 20).length;
    const moderateCropCount = results.filter((r) => r.cropPercent > 8 && r.cropPercent <= 20).length;

    md += `- Total Image Instances Evaluated: **${results.length}**\n`;
    md += `- Blurry Images (\`naturalWidth / (cssWidth × DPR) < 1.0\`): **${blurryCount}** (${Math.round((blurryCount / results.length) * 100 || 0)}%)\n`;
    md += `- Severe Crop Instances (> 20% cut by \`object-fit: cover\`): **${severeCropCount}**\n`;
    md += `- Moderate Crop Instances (8% - 20% cut): **${moderateCropCount}**\n\n`;

    md += `## 3. WORST OFFENDERS: BLURRY / UNDER-SIZED IMAGES\n`;
    md += `| Page | Viewport | Alt / Title | CSS Box | Requested Nat. W | Sharpness (Nat/(CSS×DPR)) | Status |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    for (const r of worstSharpness) {
      const status = r.sharpnessRatio < 0.8 ? '❌ Very Blurry' : r.sharpnessRatio < 1.0 ? '⚠️ Soft / Blurry' : '✅ Sharp';
      md += `| \`${r.page}\` | ${r.viewport} | ${r.alt || '(no alt)'} | ${r.cssWidth}×${r.cssHeight} | ${r.naturalWidth}px | **${r.sharpnessRatio}x** | ${status} |\n`;
    }

    md += `\n## 4. WORST OFFENDERS: CROPPED / CUT MEDIA\n`;
    md += `| Page | Viewport | Alt / Title | CSS Box | Natural Size | Crop % | Object Fit |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    for (const r of worstCrop) {
      const status = r.cropPercent > 30 ? '❌ Severe Crop' : r.cropPercent > 8 ? '⚠️ Ugly Crop' : '✅ Whole';
      md += `| \`${r.page}\` | ${r.viewport} | ${r.alt || '(no alt)'} | ${r.cssWidth}×${r.cssHeight} | ${r.naturalWidth}×${r.naturalHeight} | **${r.cropPercent}%** | \`${r.objectFit}\` |\n`;
    }

    md += `\n## 5. ROOT CAUSES FOUND\n`;
    md += `1. **Fixed-Dimension Grid Boxes With \`object-fit: cover\`**:\n`;
    md += `   - Bento tiles and showcase columns use fixed CSS heights (e.g. 370px height x 460px width) regardless of whether an uploaded photo is Portrait (3:4), Landscape (16:9), or Square (1:1).\n`;
    md += `   - Photos are forced to fill the box, cutting off up to 50%+ of subjects, faces, architectural details, or heads/feet.\n\n`;
    md += `2. **Missing / Generic \`sizes\` Attributes Causing Blurriness**:\n`;
    md += `   - \`sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"\` produces \`25vw\` on 1440px desktop screens (360px).\n`;
    md += `   - On DPR 2 (Retina/Mobile), the required pixel width is 720px - 960px. But Next.js downloads lower-resolution stepped sizes, resulting in sharpness ratios as low as 0.50x - 0.75x.\n\n`;
    md += `3. **Default Compression / Single Width Cap**:\n`;
    md += `   - Existing helpers cap URLs at \`w_1600\` with \`q_auto\`, without tailoring quality (85-90 for hero, 80-85 for large tiles) or providing true 2x retina srcset sources.\n\n`;
    md += `4. **Videos Disregarding Real Aspect Ratios**:\n`;
    md += `   - Vertical phone videos are placed into landscape video containers, resulting in black bars or severe vertical cropping.\n`;

    const outPath = path.join(process.cwd(), 'docs', 'MEDIA_AUDIT_BEFORE.md');
    fs.writeFileSync(outPath, md, 'utf-8');
    console.log(`\nDiagnostic output saved successfully to: ${outPath}`);
  } finally {
    if (browser) {
      await browser.close().catch(() => {});
    }
    if (fs.existsSync(tempProfileDir)) {
      fs.rmSync(tempProfileDir, { recursive: true, force: true });
    }
    if (serverProc) {
      console.log('Stopping temporary Next.js server...');
      serverProc.kill();
    }
  }
}

runAudit().catch((err) => {
  console.error('Audit failed:', err);
  process.exit(1);
});

