// Keyboard and semantic checks against the same rendered screens as the app.
const assert = require('assert/strict');
const path = require('path');
const fs = require('fs');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const out = path.resolve(__dirname, '../../.mobile-preview');
const screens = { home: 'home&personal', themes: 'themes', profile: 'profile&personal', messages: 'messages&populated', quiz: 'quiz&topic=harry_potter' };

(async () => {
  const browsers = [];
  let cases = 0;
  try {
    await new Promise(resolve => server.listen(4360, '127.0.0.1', resolve));
    for (const engine of ['chromium', 'webkit']) {
      const browser = await (engine === 'webkit' ? webkit.launch() : chromium.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' }));
      browsers.push(browser);
      for (const width of [320, 390, 430]) {
        for (const theme of ['light', 'dark']) {
          const context = await browser.newContext({ viewport: { width, height: 844 }, reducedMotion: 'reduce' });
          await context.addInitScript(({ theme }) => {
            localStorage.setItem('quizzup-lang', 'fr');
            localStorage.setItem('quizzup-theme', theme);
          }, { theme });
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', error => errors.push(error.message));
          for (const [screen, query] of Object.entries(screens)) {
            await page.goto(`http://127.0.0.1:4360/?${query}`);
            await page.bringToFront();
            const main = page.locator('main#main-content');
            await main.waitFor();
            await page.evaluate(() => document.fonts.ready);
            assert.equal(await page.locator('main').count(), 1);
            assert.equal(await main.locator('h1').count(), 1);
            assert(await main.locator('h1').innerText());
            assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${engine}/${width}/${screen} overflow`);
            if (width === 390 && engine === 'chromium') {
              await page.locator('img').evaluateAll(images => Promise.all(images.map(img => img.decode().catch(() => {}))));
              await page.screenshot({ path: path.join(out, `a11y-after-${theme}-${screen}.png`), fullPage: true });
            }
            const url = page.url();
            const historyLength = await page.evaluate(() => history.length);
            await page.keyboard.press('Tab');
            assert(await page.locator('.skip-link').evaluate(el => el === document.activeElement), `${screen}: skip link must be first`);
            await page.waitForFunction(() => document.querySelector('.skip-link').getBoundingClientRect().y >= 0);
            const box = await page.locator('.skip-link').boundingBox();
            assert(box && box.y >= 0 && box.height >= 44, `${engine}/${width}/${theme}/${screen}: skip bounds ${JSON.stringify(box)}`);
            await page.keyboard.press('Enter');
            assert(await main.locator('h1').evaluate(el => el === document.activeElement));
            assert.equal(page.url(), url);
            assert.equal(await page.evaluate(() => history.length), historyLength);
            await page.keyboard.press('Tab');
            assert(await main.evaluate(el => el.contains(document.activeElement)), `${screen}: next Tab should enter content`);
            cases++;
          }
          assert.deepEqual(errors, []);
          await context.close();
        }
      }
      // A thread has its own heading, and a modal keeps the skip link out of its trap.
      const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await page.goto('http://127.0.0.1:4360/?messages&populated');
      await page.locator('.messenger-row').first().click();
      assert.equal(await page.locator('main h1').count(), 1);
      assert.match(await page.locator('main h1').textContent(), /Camille/);
      await page.locator('.messenger-challenge').click();
      assert.equal(await page.locator('.skip-link').isVisible(), false);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('[aria-modal="true"]').count(), 0);
      await page.goto('http://127.0.0.1:4360/?game');
      assert.equal(await page.locator('.skip-link').isVisible(), false);
      await page.close();
      console.log(`${engine}: 30 screen/theme/width combinations + thread/modal/timed-screen checks passed`);
    }
    fs.writeFileSync(path.join(out, 'accessibility-result.json'), JSON.stringify({ cases, engines: ['Chromium', 'WebKit'], widths: [320, 390, 430], themes: ['light', 'dark'], passed: true }, null, 2));
  } finally {
    for (const browser of browsers) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
