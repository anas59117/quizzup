const assert = require('assert/strict');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');

(async () => {
  await new Promise(resolve => server.listen(4328, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    for (const [width, height] of [[320,480], [375,667], [390,844], [430,932]]) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      for (const mode of ['timed', 'timed&long', 'timed&photo', 'timed&group']) {
        await page.goto(`http://127.0.0.1:4328/?${mode}`);
        await page.locator('.question').waitFor();
        await page.evaluate(() => document.fonts.ready);
        const positions = () => page.evaluate(() => {
          const rect = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { top:r.top, bottom:r.bottom, left:r.left, right:r.right, height:r.height }; };
          return { question:rect('.question'), lastContent:rect(document.querySelector('.player-photo-wrap') ? '.player-photo-wrap' : '.question'),
            answers:[...document.querySelectorAll('.answer')].map(el => { const r=el.getBoundingClientRect(); return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,height:r.height}; }), width:document.documentElement.scrollWidth };
        });
        const before = await positions();
        await page.locator('.answer:enabled').first().waitFor();
        const after = await positions();
        assert(after.width <= width, `Horizontal overflow ${width} ${mode}`);
        assert(after.answers.every(r => r.height >=44 && r.left >=12 && r.right <= width-12), `Answer frame ${width} ${mode}`);
        assert(Math.abs(before.question.top-after.question.top)<1, `Question moves on arrival ${width} ${mode}`);
        assert(before.answers.every((r,i) => Math.abs(r.top-after.answers[i].top)<1), `Answers move on arrival ${width} ${mode}`);
        const gap=after.answers[0].top-after.lastContent.bottom;
        assert(gap>=10 && gap<=44, `Question/answer gap ${gap}px at ${width}x${height} ${mode}`);
        if (!mode.includes('group')) assert(after.answers.every(r=>r.bottom<=height), `Answers below fold ${width} ${mode}`);
        if (width===390) await page.screenshot({path:path.resolve(__dirname, `../../.mobile-preview/framing-${mode.replaceAll('&','-')}.png`)});
        console.log(`PASS framing ${width}x${height} ${mode} gap=${Math.round(gap)}`);
      }
      await page.close();
    }
    console.log('Duel framing and staged-arrival checks passed');
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode=1; });
