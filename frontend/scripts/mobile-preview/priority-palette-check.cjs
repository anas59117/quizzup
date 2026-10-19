const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, webkit } = require('C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const useWebkit = !!process.env.PALETTE_WEBKIT;
const port = useWebkit ? 4353 : 4352;
const luminance = rgb => rgb.match(/[\d.]+/g).slice(0, 3).map(n => Number(n) / 255).map(n => n <= .04045 ? n / 12.92 : ((n + .055) / 1.055) ** 2.4).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
(async () => {
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  let browser;
  try {
    browser = useWebkit ? await webkit.launch() : await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' }), errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error' && /fetchpriority|fetchPriority/.test(m.text())) errors.push(m.text()); });
    await page.addInitScript(() => localStorage.setItem('quizzup-theme', 'dark'));
    const go = async url => {
      await page.goto(url);
      await page.waitForFunction(() => document.documentElement.dataset.theme === 'dark');
    };
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await go(`http://127.0.0.1:${port}/?home&personal`);
      await page.locator('.tile-v4').first().waitFor();
      const home = await page.locator('.topics-grid-v4 .tile-v4').evaluateAll(cards => cards.map((card, index) => {
        const img = card.querySelector('img'); return img ? { index, loading: img.loading, priority: img.getAttribute('fetchpriority') } : null;
      }).filter(Boolean));
      for (const image of home) { assert.equal(image.loading, 'eager'); assert.equal(image.priority, image.index < 2 ? 'high' : null); }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await go(`http://127.0.0.1:${port}/?themes`);
      const icon = await page.locator('.family-icon').first().evaluate(e => ({ ink: getComputedStyle(e).color, paper: getComputedStyle(e).backgroundColor }));
      assert.equal(icon.ink, 'rgb(237, 205, 135)'); assert(contrast(icon.ink, icon.paper) >= 4.5);
      await page.waitForFunction(() => getComputedStyle(document.querySelector('.nav-item.active')).color === 'rgb(237, 205, 135)');
      const nav = await page.locator('.nav-item.active').evaluate(e => getComputedStyle(e).color);
      assert.equal(nav, icon.ink);
      if (width === 390) await page.screenshot({ path: path.resolve(__dirname, '../../.mobile-preview/dark-gold-themes.png'), fullPage: true });
      await page.locator('.family-tile[data-family=football]').click();
      const grid = await page.locator('.tile-v4').evaluateAll(cards => cards.map((card, index) => {
        const img = card.querySelector('img'); return img ? { index, loading: img.loading } : null;
      }).filter(Boolean));
      for (const image of grid) assert.equal(image.loading, image.index < 4 ? 'eager' : 'lazy');
      await go(`http://127.0.0.1:${port}/?profile&personal`);
      assert.equal(await page.locator('.pf-xp-fill').evaluate(e => getComputedStyle(e).backgroundColor), icon.ink);
      await go(`http://127.0.0.1:${port}/?messages&populated`);
      await page.locator('.messenger-row').first().click();
      await page.locator('.messenger-challenge').click();
      const action = await page.locator('.messenger-modes button[aria-pressed=true]').evaluate(e => ({ ink: getComputedStyle(e).color, paper: getComputedStyle(e).backgroundColor }));
      assert.equal(action.paper, 'rgb(185, 31, 53)'); assert(contrast(action.ink, action.paper) >= 4.5);
      if (width === 390) await page.screenshot({ path: path.resolve(__dirname, '../../.mobile-preview/dark-red-messages.png'), fullPage: true });
    }
    assert.deepEqual(errors, []);
    console.log(`PASS ${useWebkit ? 'WebKit' : 'Chromium'} : priorité images, lazy hors première grille, sélection or, actions rouges, contrastes >=4.5:1, 320/390/430px, zéro erreur JS/React`);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
