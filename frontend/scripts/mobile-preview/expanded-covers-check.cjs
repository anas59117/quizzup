const assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const topics = require('../../src/catalogueExpansion.json');
const covers = require('../../src/expandedTopicCovers.json');
const out = path.resolve(__dirname, '../../../.mobile-preview/expanded-qa');
(async () => {
  fs.mkdirSync(out, { recursive: true });
  await new Promise(resolve => server.listen(4358, '127.0.0.1', resolve));
  let browser;
  try {
    browser = process.env.COVERS_WEBKIT ? await webkit.launch({ headless: true }) : await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
    const errors = [], failed = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('response', response => { if (response.url().includes('/expanded-v1/') && response.status() >= 400) failed.push(response.url()); });
    await page.route('**/*', route => new URL(route.request().url()).hostname === '127.0.0.1' ? route.continue() : route.abort());
    for (const width of [320, 390, 430]) {
      await page.setViewportSize({ width, height: 844 });
      await page.goto('http://127.0.0.1:4358/?new-covers');
      assert.equal(await page.locator('.tile-v4').count(), 55);
      for (const topic of topics) {
        const card = page.locator(`.tile-v4[data-topic="${topic.key}"]`);
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(img => img.decode());
        assert.equal(await card.locator('img').evaluate(img => img.naturalWidth > 0), true);
        assert.equal(await card.locator('.tile-v4__big-line').count(), 0);
        assert.equal(await card.locator('img').evaluate(img => getComputedStyle(img).objectFit), covers[topic.key].fit);
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `gallery overflow ${width}`);
      if (width === 390) {
        for (const family of ['football','sport','music','gaming','series','culture']) {
          await page.locator(`.expanded-cover-group[data-family="${family}"]`).screenshot({ path: path.join(out, `${family}.png`) });
        }
      }
      for (const key of ['ariana_grande','tottenham','mathematiques_logique','the_mandalorian','dark_souls','surf']) {
        await page.goto(`http://127.0.0.1:4358/?quiz&topic=${key}`);
        await page.locator('.cp-artwork').evaluate(img => img.decode());
        assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
        await page.locator('.cp-play').scrollIntoViewIfNeeded();
        const reachable = await page.locator('.cp-play').evaluate(element => { const r = element.getBoundingClientRect(); return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.cp-play') === element; });
        if (!reachable) await page.screenshot({ path: path.join(out, `${key}-${width}-blocked.png`), fullPage: true });
        assert(reachable, `${key}/${width} Play is covered`);
        if (width === 390) await page.screenshot({ path: path.join(out, `${key}-detail.png`), fullPage: true });
      }
    }
    await page.goto('http://127.0.0.1:4358/?themes');
    await page.getByRole('searchbox').fill('Kendrick');
    await page.locator('.tile-v4[data-topic="kendrick_lamar"]').click();
    await page.locator('.cp-has-artwork[data-topic="kendrick_lamar"]').waitFor();
    await page.locator('.cp-play').click(); await page.locator('.app-question').waitFor();
    await page.route('**/expanded-v1/ariana_grande-*', route => route.abort());
    await page.goto('http://127.0.0.1:4358/?quiz&topic=ariana_grande');
    await page.locator('.category-preview-v4:not(.cp-has-artwork)').waitFor();
    assert.deepEqual(errors, []); assert.deepEqual(failed, []);
    console.log(`PASS ${process.env.COVERS_WEBKIT ? 'WebKit' : 'Chromium'}: 55 images, mobile widths 320/390/430, six detail pages, search → quiz → Play, missing-image fallback, zero runtime errors`);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
