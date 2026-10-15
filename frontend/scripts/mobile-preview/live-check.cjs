// Two isolated guest sessions against the real backend. Local stores only.
const assert = require('assert/strict');
const path = require('path');
const fs = require('fs');
const { randomBytes } = require('crypto');
const { spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const out = path.resolve(__dirname, '../../.mobile-preview');
const backendFile = path.resolve(__dirname, '../../../backend/server.js');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  fs.mkdirSync(path.join(out, 'live-data'), { recursive: true });
  const backend = spawn(process.execPath, [backendFile], {
    cwd: out, windowsHide: true,
    env: { ...process.env, NODE_ENV: 'test', PORT: '3003', DATA_DIR: path.join(out, 'live-data'),
      CORS_ORIGIN: 'http://127.0.0.1:4324', GUEST_AUTH_SECRET: randomBytes(32).toString('hex'),
      NODE_PATH: process.env.BACKEND_NODE_MODULES || path.resolve(__dirname, '../../../backend/node_modules') },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let logs = '';
  backend.stdout.on('data', chunk => { logs += chunk; });
  backend.stderr.on('data', chunk => { logs += chunk; });
  let browser;
  const errors = [];
  try {
    await new Promise(resolve => server.listen(4324, '127.0.0.1', resolve));
    let ready = false;
    for (let i = 0; i < 40; i++) {
      try { const r = await fetch('http://127.0.0.1:3003/health'); ready = r.ok; } catch {}
      if (ready) break;
      await wait(250);
    }
    assert(ready, 'Isolated backend did not start: ' + logs.slice(-1800));
    browser = await chromium.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const pages = [];
    for (const [name, avatar] of [['MobileQA', 'robot'], ['DuelQA', 'fox']]) {
      const context = await browser.newContext({ viewport: { width: 390, height: 664 }, reducedMotion: 'reduce' });
      await context.addInitScript(({ name, avatar }) => {
        localStorage.setItem('quizzup-onboarded', '1');
        localStorage.setItem('quizzup-name', name);
        localStorage.setItem('quizzup-avatar', avatar);
        localStorage.setItem('quizzup-lang', 'fr');
      }, { name, avatar });
      const page = await context.newPage();
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error' && message.text().includes('[QuizzUp')) errors.push(message.text()); });
      await page.goto('http://127.0.0.1:4324/?app');
      await page.locator('.home-head').waitFor();
      pages.push(page);
    }
    console.log('PASS real app guest identities → home');
    for (const page of pages) {
      await page.locator('[data-topic="spider_man"] button').click();
      await page.locator('.cp-play').click();
    }
    for (let round = 1; round <= 6; round++) {
      await Promise.all(pages.map(page => page.locator('.game-progress-text').filter({ hasText: `Question ${round} / 6` }).waitFor({ timeout: 20000 })));
      const staged = await pages[0].evaluate(() => ({ phase: document.querySelector('.duel-premium').dataset.roundPhase,
        hidden: [...document.querySelectorAll('.answer')].filter(el => getComputedStyle(el).visibility === 'hidden').length,
        disabled: document.querySelectorAll('.answer:disabled').length,
        timer: document.querySelector('.hud-timer').textContent,
        questionY: document.querySelector('.question').getBoundingClientRect().y }));
      assert.equal(staged.phase, 'reading', 'No question-only reading stage');
      assert.equal(staged.hidden, 4, 'Answers exposed before reading ends');
      assert.equal(staged.disabled, 4, 'Input accepted during reading');
      assert(Number(staged.timer) >= 10, 'Reading consumed answer time');
      await pages[0].locator('.answer').nth(0).click();
      const stableY = await pages[0].locator('.question').evaluate(el => el.getBoundingClientRect().y);
      assert(Math.abs(stableY - staged.questionY) < 1, 'Question moved when answers arrived');
      await pages[0].locator('.mobile-answer-feedback strong').waitFor();
      await pages[1].locator('.hud-chip:not(.mine)[data-state="answered"]').waitFor();
      assert.equal(await pages[0].locator('.hud-chip:not(.mine)').getAttribute('data-state'), 'waiting');
      assert.equal(await pages[1].locator('.answer:disabled').count(), 0, 'Opponent reply disabled too soon');
      if (round === 1) await pages[0].screenshot({path:path.join(out,'live-ack-waiting.png'),fullPage:true});
      await pages[1].locator('.answer').nth(1).click();
      await Promise.all(pages.map(page => page.locator('.mobile-answer-feedback strong').waitFor()));
    }
    await Promise.all(pages.map(page => page.locator('.res-cta').waitFor({ timeout: 20000 })));
    console.log('PASS real app matchmaking → six questions → results');
    for (const page of pages) {
      assert.equal(await page.locator('.notification-toast, .toast').count(), 0, 'Floating message masks result');
      const outcome = await page.locator('.res-title').getAttribute('class');
      const league = await page.evaluate(() => JSON.parse(localStorage.getItem('quizzup-league')));
      if (outcome.includes('win')) assert.equal(league.wins, 1, 'Victory was recorded as loss');
      if (outcome.includes('loss')) assert.equal(league.losses, 1, 'Loss was not recorded');
      const identities = await page.locator('.res-score .player-avatar').evaluateAll(elements=>elements.map(el=>el.dataset.avatar));
      assert(identities.includes('robot') && identities.includes('fox'), `Lost player identity: ${identities}`);
      await page.getByRole('button', { name: 'Voir le détail', exact: true }).click();
      assert(await page.locator('#match-result-details').isVisible());
      await page.getByRole('button', { name: 'Masquer le détail', exact: true }).click();
    }
    await pages[0].screenshot({ path: path.join(out, 'live-results.png'), fullPage: true });
    await pages[0].getByRole('button', { name: 'Revanche', exact: true }).click();
    await pages[0].getByRole('button', { name: 'En attente…', exact: true }).waitFor();
    await pages[1].getByRole('button', { name: 'Revanche', exact: true }).click();
    await Promise.all(pages.map(page => page.locator('.game-progress-text').filter({ hasText: 'Question 1 / 6' }).waitFor({ timeout: 20000 })));
    console.log('PASS real app rematch request → waiting → new duel');
    assert.deepEqual(errors, []);
    console.log('All live UI checks passed');
  } catch (error) {
    if (browser) {
      for (const [index, context] of browser.contexts().entries()) {
        await context.pages()[0]?.screenshot({ path: path.join(out, `live-failure-${index}.png`), fullPage: true }).catch(() => {});
      }
    }
    console.error('Live app errors:', errors);
    throw error;
  } finally {
    if (browser) await browser.close();
    backend.kill();
    server.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
