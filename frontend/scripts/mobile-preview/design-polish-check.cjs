const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const root = path.resolve(__dirname, '../..');
const output = path.join(root, '.mobile-preview/design-polish-2026-11-06');
const engine = process.env.POLISH_WEBKIT ? 'webkit' : 'chromium';
const port = process.env.POLISH_WEBKIT ? 4376 : 4375;
const report = [];
const luminance = color => color.match(/[\d.]+/g).slice(0, 3).map(Number).map(n => {
  const v = n / 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4;
}).reduce((sum, n, i) => sum + n * [.2126, .7152, .0722][i], 0);
const contrast = (a, b) => { const x = luminance(a), y = luminance(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
async function rect(locator) { return locator.boundingBox(); }
async function ready(page) {
  await page.locator('.navbar').waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.locator('img').evaluateAll(images => Promise.all(images.filter(img => img.getBoundingClientRect().top < innerHeight).map(img => img.decode().catch(() => {}))));
}
async function screenshot(page, name) { await page.screenshot({ path: path.join(output, `${engine}-${name}.png`), fullPage: true }); }
(async () => {
  fs.mkdirSync(output, { recursive: true });
  await new Promise(resolve => server.listen(port, '127.0.0.1', resolve));
  let browser;
  try {
    browser = process.env.POLISH_WEBKIT ? await webkit.launch() : await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(value => localStorage.setItem('quizzup-theme', value), theme);
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      for (const width of [320, 390, 768, 999, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 });
        for (const language of ['fr', 'en']) {
          const suffix = language === 'en' ? '&en' : '';
          for (const screen of ['home&personal', 'themes', 'profile&personal']) {
            await page.goto(`http://127.0.0.1:${port}/?${screen}${suffix}`);
            await ready(page);
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${screen}/${width}/${language}/${theme}: horizontal overflow`);
            const main = await rect(page.locator('main'));
            const nav = await rect(page.locator('.navbar'));
            assert(main.x >= -1 && main.x + main.width <= width + 1, 'main outside viewport');
            assert(nav.y >= 0 && nav.y + nav.height <= 900, 'navigation outside viewport');
            if (width >= 1024) assert(main.width >= 900, `${screen}: desktop remains a phone column`);
            if (screen === 'themes') {
              for (const card of await page.locator('.family-tile').all()) {
                const box = await rect(card);
                assert(box.height >= 100 && box.height <= 140, `category has excessive height: ${box.height}`);
                const content = await card.locator('.family-label').boundingBox();
                assert(content.y + content.height <= box.y + box.height, 'category label clipped');
              }
              if (width >= 1024) {
                const first = await rect(page.locator('.family-tile').nth(0));
                const fourth = await rect(page.locator('.family-tile').nth(3));
                assert(Math.abs(first.y - fourth.y) < 2, 'desktop category row does not use four columns');
              }
              const search = page.locator('.search-bar input');
              await search.fill('Minecraft');
              const card = page.locator('.tile-v4[data-topic="minecraft"]');
              await card.waitFor();
              assert((await card.getAttribute('aria-label')).toLowerCase().includes('minecraft'));
              await card.click();
              await page.locator('.category-preview-v4').waitFor();
              assert(await page.locator('.cp-title').isVisible(), 'search result does not open quiz');
            }
            if (screen.startsWith('home')) {
              for (const key of ['minecraft', 'rap_fr']) {
                const card = page.locator(`.tile-v4[data-topic="${key}"]`);
                const img = card.locator('img');
                await img.evaluate(image => image.decode());
                assert((await img.getAttribute('src')).startsWith('/images/covers/approved-v2/'));
                assert(await card.locator('.tile-v4__label').isVisible(), `${key}: missing bottom title`);
                assert.equal(await card.locator('.tile-v4__big').count(), 0, `${key}: old typography still visible`);
              }
              if (width >= 1024) {
                const personal = await rect(page.locator('[aria-labelledby="home-my-themes"]'));
                const discovery = await rect(page.locator('[aria-labelledby="home-discover"]'));
                const community = await rect(page.locator('.home-community-section'));
                assert(discovery.x >= personal.x + personal.width, 'desktop discovery is not beside personal themes');
                assert(community.y >= discovery.y + discovery.height - 1, 'community overlaps discovery');
                const cover = await rect(page.locator('.home-discovery .tile-v4').first());
                assert(cover.width / cover.height >= 1.5, 'desktop poster override forces discovery back into oversized squares');
              }
            }
            if (screen.startsWith('profile')) {
              await page.locator('.pf-edit-dot').click();
              const editor = await rect(page.locator('.profile-editor'));
              assert(editor.width >= 260 && editor.x >= 0 && editor.x + editor.width <= width, 'profile editor clipped');
              await page.locator('.profile-name-input').fill('Un nom assez long');
              if (width >= 1024) {
                const overview = await rect(page.locator('.profile-overview'));
                const activity = await rect(page.locator('.profile-activity'));
                assert(activity.x >= overview.x + overview.width, 'desktop profile columns overlap');
              }
            }
            if (language === 'fr' && [390, 1440].includes(width)) {
              if (screen.startsWith('profile')) await page.locator('.profile-editor-cancel').click();
              // Return from the search/detail exercise before capturing themes.
              if (screen === 'themes') { await page.goto(`http://127.0.0.1:${port}/?themes`); await ready(page); }
              await screenshot(page, `${theme}-${screen.replace('&', '-')}-${width}`);
            }
            report.push({ theme, language, width, screen, mainWidth: main.width });
          }
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto(`http://127.0.0.1:${port}/?messages&populated`); await ready(page);
      await page.locator('.messenger-row').first().click();
      const text = await page.locator('.messenger-date,.messenger-message>time').evaluateAll(elements => elements.map(e => ({ font: parseFloat(getComputedStyle(e).fontSize), line: parseFloat(getComputedStyle(e).lineHeight) })));
      assert(text.length >= 2 && text.every(s => s.font >= 12 && s.line >= 16), 'message metadata too small');
      await screenshot(page, `${theme}-message-thread`);
      await page.setViewportSize({ width: 390, height: 500 });
      await page.locator('.messenger-composer textarea').fill('Une revanche ?');
      const composer = await rect(page.locator('.messenger-composer'));
      assert(composer.y + composer.height <= 500, 'composer hidden in short viewport');
      await page.goto(`http://127.0.0.1:${port}/?home&personal`); await ready(page);
      await page.locator('.navbar button').first().focus(); await page.keyboard.press('Tab');
      const focus = await page.locator(':focus').evaluate(e => { const s = getComputedStyle(e); return { outline: s.outlineColor, width: parseFloat(s.outlineWidth), paper: getComputedStyle(e.closest('.navbar')).backgroundColor }; });
      assert(focus.width >= 2 && contrast(focus.outline, focus.paper) >= 3, `navigation focus insufficient in ${theme}`);
      await screenshot(page, `${theme}-nav-focus`);
      await page.goto(`http://127.0.0.1:${port}/?quiz&topic=spider_man`); await ready(page);
      await page.locator('.cp-artwork').evaluate(img => img.decode());
      assert.equal((await page.locator('.cp-title').innerText()).toLowerCase(), 'spider-man');
      assert.deepEqual(errors, []);
      await context.close();
    }
    fs.writeFileSync(path.join(output, `${engine}-checks.json`), JSON.stringify(report, null, 2));
    console.log(`PASS ${engine}: ${report.length} responsive/light/dark/FR/EN states, real search navigation, profile editing, decoded local covers, message text, short composer and keyboard focus.`);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
})().catch(error => { console.error(error); process.exitCode = 1; });
