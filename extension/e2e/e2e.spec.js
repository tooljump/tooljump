// npm i -D playwright expect
// run with: node e2e-extension.spec.js
import process from 'process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
import { expect } from '@playwright/test';

(async () => {
  // Node ESM doesn't provide __dirname; derive it from import.meta.url
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  // 1) Start Chromium with the extension loaded
  const extensionPath = path.resolve(__dirname, '../'); // unpacked folder with manifest.json
  if (!fs.existsSync(path.join(extensionPath, 'manifest.json'))) {
    throw new Error('Extension folder missing manifest.json');
  }

  // Use a persistent context so the extension can run background SW and storage persists
  const userDataDir = path.join(__dirname, '.tmp-user-data');
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false, // true headless usually won't load extensions. Use Xvfb in CI if you need “headless”.
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      // In CI you can *try* the newer headless mode:
      // '--headless=new',
    ],
  });

  try {
    // Wait for the extension’s background service worker to register (MV3) or background page (MV2)
    let extensionId;
    // MV3: service workers
    const sw = await new Promise((resolve) => {
      const existing = context.serviceWorkers();
      if (existing.length) return resolve(existing[0]);
      context.once('serviceworker', resolve);
    });
    extensionId = sw.url().split('/')[2]; // chrome-extension://<ID>/...

    // Fallback (MV2): background page
    if (!extensionId && context.backgroundPages().length) {
      const bg = context.backgroundPages()[0];
      extensionId = bg.url().split('/')[2];
    }

    if (!extensionId) throw new Error('Could not determine extension ID');

    // 2) Set settings in the extension via the background service worker (use storage.sync)
    const secureToken = process.env.TOOLJUMP_SECRET_TOKEN || '';
    if (!secureToken) {
      throw new Error('TOOLJUMP_SECRET_TOKEN is not set');
    }
    await sw.evaluate(async (token) => {
      await new Promise((resolve, reject) => {
        try {
          chrome.storage.local.set(
            { host: 'http://localhost:3000', secureToken: token, demoMode: false },
            () => resolve()
          );
        } catch (e) { reject(e); }
      });
    }, secureToken);

    // Optionally verify storage was written (read from service worker too)
    const stored = await sw.evaluate(() =>
      new Promise((resolve, reject) => {
        try {
          chrome.storage.local.get(null, resolve);
        } catch (e) { reject(e); }
      })
    );

    // 3) Navigate to a website
    const page = await context.newPage();
    await page.goto('https://github.com/tooljump/tooljump', { waitUntil: 'domcontentloaded' });
    
    await new Promise((r) => {
        setTimeout(r, 5000);
    });

    const el = page.locator('#tooljump-bar-container');
    await expect(el).toHaveCount(1);

    const fullHtml = await page.content();
    expect(fullHtml).toContain('3 alerts active');
    expect(fullHtml).toContain('#my-service-channel');

    console.log('✅ Element exists and extension storage set.');
  } finally {
    await context.close();
  }
})();
