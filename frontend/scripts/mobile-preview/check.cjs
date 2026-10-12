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
      page.on('console', message => { if (message.type() === 'error' && message.text().includes('[QuizzUp')) errors.push(message.text()); });
      for (const mode of ['', '?long', '?photo', '?group', '?home', '?profile', '?waiting', '?shop', '?themes', '?result', '?result&loss', '?result&tie', '?result&solo', '?result&group', '?result&en']) {
        await page.goto('http://127.0.0.1:4322/' + mode);
        const game = ['', '?long', '?photo', '?group'].includes(mode);
        await page.locator(game ? '.answers' : mode.includes('result') ? '.res-cta' : mode === '?home' ? '.tile-v4' : mode === '?profile' ? '.pf-name' : mode === '?waiting' ? '.matchmaking-topic' : mode === '?themes' ? '.family-tile' : '.shop-v4-root').first().waitFor();
        await page.evaluate(() => document.fonts.ready);
        const metrics = await page.evaluate(() => ({
          width: document.documentElement.scrollWidth, viewport: innerWidth,
          buttons: [...document.querySelectorAll('.answer')].map(el => { const r=el.getBoundingClientRect(); return {bottom:r.bottom,height:r.height} }),
        }));
        assert(metrics.width <= width, `Overflow ${width} ${mode}`);
        if (game) {
          assert(metrics.buttons.every(r => r.height >= 44), `Small answer ${width} ${mode}`);
          if (width <= 680 && mode !== '?group') assert(metrics.buttons.every(r => r.bottom <= height), `Answer below fold ${width}x${height} ${mode}: ${JSON.stringify(metrics.buttons)}`);
          const collision = await page.evaluate(() => {
            const counter = document.querySelector('.game-progress-text').getBoundingClientRect();
            const tag = document.querySelector('.game-cattag').getBoundingClientRect();
            return counter.bottom > tag.top;
          });
          assert(!collision, `Round/tag collision ${width}`);
        } else if (mode === '?home') {
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
          const header = await page.evaluate(() => [...document.querySelectorAll('.home-actions button')].filter(el => !el.closest('.mobile-controls-panel')).map(el => { const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}; }));
          assert(header.every(r => r.width >= 44 && r.height >= 44), `Small header target ${width}`);
          assert(Math.max(...header.map(r=>r.y)) - Math.min(...header.map(r=>r.y)) < 5, `Header wraps ${width}`);
        } else if (mode.includes('result')) {
          if (!mode.includes('solo')) {
            const colours = await page.locator('.notification-msg').evaluate(el => ({ text: getComputedStyle(el).color, bg: getComputedStyle(el.parentElement).backgroundColor }));
            assert.notEqual(colours.text, colours.bg, 'LP notification invisible');
          }
          if (!mode.includes('solo') && !mode.includes('group')) {
            assert((await page.locator('.res-score.me .av').textContent()).includes('🦁'));
            assert((await page.locator('.res-score.op .av').textContent()).includes('🐼'));
          }
          await page.getByRole('button', { name: mode.includes('en') ? 'Show details' : 'Voir le détail', exact: true }).click();
          assert(await page.locator('#match-result-details').isVisible());
          await page.getByRole('button', { name: mode.includes('en') ? 'Hide details' : 'Masquer le détail', exact: true }).click();
          await page.getByRole('button', { name: mode.includes('en') ? 'Back to home' : 'Retour à l\'accueil', exact: true }).scrollIntoViewIfNeeded();
          await page.getByRole('button', { name: mode.includes('en') ? 'Back to home' : 'Retour à l\'accueil', exact: true }).click();
          await page.locator('.home-head').waitFor();
          await page.goto('http://127.0.0.1:4322/' + mode);
        } else if (mode === '?profile') {
          assert((await page.locator('.pf-v4').textContent()).includes('1 jour de suite'));
          await page.getByRole('button', { name: 'Modifier le profil', exact: true }).click();
          assert(await page.getByRole('textbox', { name: 'Pseudo' }).isVisible());
        } else if (mode === '?shop') {
          for (const label of ['Avatars','Entrées','Réactions','Célébrations']) {
            const tab = page.getByRole('button', { name: label, exact: true });
            const visibleText = await tab.evaluate(el => el.scrollWidth <= el.clientWidth);
            assert(visibleText, `Clipped shop tab ${width} ${label}`);
            const tabBounds = await tab.boundingBox();
            assert(tabBounds.x >= 0 && tabBounds.x + tabBounds.width <= width, `Shop category outside viewport ${width} ${label}`);
          }
        }
        if (width === 390) await page.screenshot({path:path.join(out,`mobile${mode.replace('?','-') || '-duel'}.png`),fullPage:true});
        console.log(`PASS ${width}x${height} ${mode || 'duel'}`);
      }
      await page.goto('http://127.0.0.1:4322/');
      await page.locator('.answer').nth(1).click();
      await page.getByRole('status').filter({hasText:'La bonne réponse était'}).waitFor();
      assert.equal(await page.locator('.answer:disabled').count(),4);
      if (width === 390) await page.screenshot({path:path.join(out,'mobile-answer-reveal.png'),fullPage:true});
      await page.close();
    }
    assert.deepEqual(errors, []);
    console.log('All mobile browser checks passed');
  } finally { await browser.close(); server.close(); }
})().catch(e => { console.error(e); server.close(); process.exitCode=1; });
