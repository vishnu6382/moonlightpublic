import puppeteer from 'puppeteer-core';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function waitForServer(url) {
  return new Promise((resolve) => {
    function ping() {
      http
        .get(url, (res) => {
          if (res.statusCode >= 200 && res.statusCode < 500) resolve();
          else setTimeout(ping, 400);
        })
        .on('error', () => setTimeout(ping, 400));
    }
    ping();
  });
}

async function run() {
  const server = spawn('npx', ['next', 'start', '-p', String(PORT)], {
    shell: true,
    stdio: 'ignore',
    env: { ...process.env },
  });

  try {
    await waitForServer(BASE_URL);
    const userDataDir = path.join(process.cwd(), '.chrome-test-profile');
    const browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      userDataDir,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 1200 });

    const screenshotDir = path.join(process.cwd(), 'public', 'test-screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }

    for (const slug of ['moon-1', 'dormitory']) {
      await page.goto(`${BASE_URL}/rooms/${slug}`, { waitUntil: 'networkidle2' });
      await page.evaluate(() => {
        const el = document.querySelector('[class*="gallerySection"]');
        if (el) el.scrollIntoView();
      });
      await new Promise((r) => setTimeout(r, 800));

      const galleryEl = await page.$('[class*="gallerySection"]');
      if (galleryEl) {
        const targetPath = path.join(screenshotDir, `gallery-${slug}.png`);
        await galleryEl.screenshot({ path: targetPath });
        console.log(`Saved gallery screenshot: ${targetPath}`);
      }
    }

    await browser.close();
  } finally {
    if (process.platform === 'win32') {
      spawn('taskkill', ['/pid', String(server.pid), '/f', '/t'], { shell: true });
    } else {
      server.kill('SIGINT');
    }
  }
}

run().catch(console.error);
