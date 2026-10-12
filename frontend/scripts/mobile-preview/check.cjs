const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
(async () => {
  await new Promise(r => server.listen(4322, '127.0.0.1', r));
  const browser = await chromium.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const out = path.resolve(__dirname, '../../.mobile-preview');
  const errors = [];
  try {
    for (const [width, height] of [[320,480],[375,550],[390,664],[430,760],[1440,900]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      page.on('pageerror', e => { errors.push(e.message); console.error('PAGE ERROR', e.message); });
      for (const mode of ['', '?long', '?photo', '?group', '?home']) {
        await page.goto('http://127.0.0.1:4322/' + mode);
        await page.locator(mode === '?home' ? '.tile-v4' : '.answers').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth, viewport: innerWidth,
          buttons: [...document.querySelectorAll('.answer')].map(el => { const r=el.getBoundingClientRect(); return {bottom:r.bottom,height:r.height} }),
        }));
        assert(metrics.width <= width, `Overflow ${width} ${mode}`);
        if (mode !== '?home') {
          assert(metrics.buttons.every(r => r.height >= 44), `Small answer ${width} ${mode}`);
          if (width <= 680 && mode !== '?group') assert(metrics.buttons.every(r => r.bottom <= height), `Answer below fold ${width}x${height} ${mode}: ${JSON.stringify(metrics.buttons)}`);
        } else {
          const overlap = await page.evaluate(() => {
            const art=document.querySelector('.tile-v4--featured .tile-v4__big').getBoundingClientRect();
            const caption=document.querySelector('.tile-v4--featured .tile-v4__caption').getBoundingClientRect();
            return art.bottom > caption.top;
          });
          assert(!overlap, `Featured overlap ${width}`);
          await page.getByRole('button',{name:'Réglages',exact:true}).click();
          assert(await page.locator('.mobile-controls-panel').isVisible());
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.mobile-controls-panel').count(),0);
        }
        if (width === 390) await page.screenshot({path:path.join(out,`mobile${mode.replace('?','-') || '-duel'}.png`),fullPage:true});
        console.log(`PASS ${width}x${height} ${mode || 'duel'}`);
      }
      await page.goto('http://127.0.0.1:4322/');
      await page.locator('.answer').nth(1).click();
      await page.getByRole('status').filter({hasText:'La bonne réponse était'}).waitFor();
      assert.equal(await page.locator('.answer:disabled').count(),4);
      if (width === 390) await page.screenshot({path:path.join(out,'mobile-result.png'),fullPage:true});
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log('All mobile browser checks passed');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode=1; });
