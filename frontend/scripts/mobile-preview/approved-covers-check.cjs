const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const covers = require('../../src/approvedTopicCovers.json');
const server = require('./serve.cjs');
const out = path.resolve(__dirname, '../../.mobile-preview');
const engine = process.env.COVERS_WEBKIT ? 'webkit' : 'chromium';
const port = process.env.COVERS_WEBKIT ? 4351 : 4350;
(async () => {
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  let browser;
  try {
    browser = engine === 'webkit' ? await webkit.launch() : await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const page = await context.newPage(), errors = [], seen = new Set();
    page.on('pageerror', e => errors.push(e.message));
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto(`http://127.0.0.1:${port}/?home&personal`);
      await page.locator('.home-refined').waitFor();
      await page.locator('.tile-v4 img').evaluateAll(images => Promise.all(images.filter(i => i.src.includes('approved-v2')).map(i => i.decode())));
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      const poster = page.locator('.home-discovery .tile-v4--poster');
      if (await poster.count()) assert.equal(await poster.first().evaluate(e => getComputedStyle(e).aspectRatio), '1 / 1');
      if (width === 390) await page.screenshot({ path: path.join(out, `covers-${engine}-home.png`), fullPage: true });
      for (const topic of ['harry_potter', 'ballon_d_or', 'kaamelott', 'bts']) {
        await page.goto(`http://127.0.0.1:${port}/?quiz&topic=${topic}`);
        await page.locator('.cp-artwork').evaluate(img => img.decode());
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${topic}/${width} overflow`);
        await page.locator('.cp-play').scrollIntoViewIfNeeded();
        assert(await page.locator('.cp-play').evaluate(e => {
          const r = e.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('.cp-play') === e;
        }), `${topic}/${width} play hidden`);
        await page.evaluate(() => scrollTo(0, 0));
        if (width === 390) await page.screenshot({ path: path.join(out, `covers-${engine}-${topic}.png`), fullPage: true });
      }
    }
    await page.goto(`http://127.0.0.1:${port}/?themes`);
    const families = await page.locator('.family-tile').evaluateAll(els => els.map(e => e.dataset.family));
    for (const family of families) {
      await page.goto(`http://127.0.0.1:${port}/?themes`);
      await page.locator(`.family-tile[data-family="${family}"]`).click();
      const cards = page.locator('.tile-v4--has-cover').filter({ has: page.locator('img[src*="approved-v2"]') });
      for (const card of await cards.all()) {
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(img => img.decode());
        const key = await card.getAttribute('data-topic'); seen.add(key);
        assert.equal(await card.locator('.tile-v4__big,.tile-v4__web,.tile-v4__sunburst').count(), 0, key);
        const fit = await card.locator('img').evaluate(img => getComputedStyle(img).objectFit);
        assert.equal(fit, covers[key].fit, key);
        if (covers[key].embeddedTitle) assert.equal(await card.locator('.tile-v4__caption').evaluate(e => getComputedStyle(e, '::before').display), 'none', key);
      }
    }
    assert.deepEqual([...seen].sort(), Object.keys(covers).sort());
    // Opening a real card must select that quiz, rather than the fixture default.
    await page.goto(`http://127.0.0.1:${port}/?home&personal`);
    await page.locator('.tile-v4[data-topic="harry_potter"]').click();
    await page.locator('.cp-has-artwork[data-topic="harry_potter"]').waitFor();
    await page.locator('.cp-play').click();
    await page.locator('.app-question').waitFor();
    // A broken poster restores the previous graphic and leaves navigation working.
    await page.route('**/approved-v2/harry_potter-*', route => route.abort());
    await page.goto(`http://127.0.0.1:${port}/?home&personal`);
    const fallback = page.locator('.tile-v4[data-topic="harry_potter"]');
    await fallback.locator('.tile-v4__big-line').waitFor();
    await fallback.click();
    await page.locator('.category-preview-v4[data-topic="harry_potter"]:not(.cp-has-artwork)').waitFor();
    assert.deepEqual(errors, []);
    console.log(`PASS ${engine}: 42 cartes, cadrages, affiches sans voile, fiches 320/390/430px, action Jouer, repli image manquante, aucune erreur JS`);
  } finally { if (browser) await browser.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(e => { console.error(e); process.exitCode = 1; });
