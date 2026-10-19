const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const out = path.resolve(__dirname, '../../.mobile-preview');
(async () => {
  await new Promise(resolve => server.listen(4336, '127.0.0.1', resolve));
  const browser = process.env.POLISH_WEBKIT ? await webkit.launch({headless:true}) : await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  try {
    const context = await browser.newContext({ viewport: {width:390,height:844}, reducedMotion:'reduce' });
    const page = await context.newPage(), errors=[];
    page.on('pageerror', error => errors.push(error.message));
    for (const screen of ['home&personal','themes','profile','messages','messages&populated']) {
      for (const width of [320,375,390,430,1440]) {
        await page.setViewportSize({width,height:width===1440?900:844});
        await page.goto(`http://127.0.0.1:4336/?${screen}${screen==='profile'?'&personal':''}`);
        await page.locator('.navbar').waitFor();
        if (['home&personal','themes','profile'].includes(screen)) {
          await page.waitForFunction(()=>{const mark=document.querySelector('.brand-lockup img');return mark?.complete&&mark.naturalWidth>0;});
          assert.equal(await page.locator('.brand-lockup').getAttribute('aria-label'),'QuizzUp');
          assert.equal(await page.locator('.brand-wordmark').evaluate(el=>getComputedStyle(el).color),'rgb(255, 255, 255)');
        }
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${screen} overflows ${width}`);
        if (screen==='themes') {
          assert.equal(await page.locator('.family-tile').count(),9);
          const symbols=await page.locator('.family-icon svg').count();assert.equal(symbols,9);
          await page.locator('.family-tile[data-family=music]').click();
          assert(await page.locator('.topics-grid-v4 .tile-v4').count()>0);
          await page.locator('.cat-header .back-link').click();
        }
        if (screen==='profile') {
          await page.locator('.pf-edit-dot').click();
          const ink=await page.locator('.profile-name-input').evaluate(el=>getComputedStyle(el).color);assert.equal(ink,'rgb(48, 39, 45)');
          const photoInk=await page.locator('.profile-photo-upload').evaluate(el=>getComputedStyle(el).color);assert.equal(photoInk,'rgb(174, 21, 54)');
          await page.screenshot({path:path.join(out,`polish-profile-editor-${width}.png`),fullPage:true});
          await page.locator('.profile-editor-cancel').click();
        }
        if (screen.startsWith('messages')) {
          const styles=await page.locator('.messenger-search input').evaluate(el=>({background:getComputedStyle(el).backgroundColor,font:getComputedStyle(el).fontSize}));
          assert.equal(styles.background,'rgba(0, 0, 0, 0)');assert.equal(styles.font,'16px');
          const box=await page.locator('.messenger').boundingBox();assert(Math.abs(box.y)<1);assert(Math.abs(box.height-page.viewportSize().height)<1);
          if(screen.includes('populated')) { await page.locator('.messenger-row').first().click();
            await page.addStyleTag({content:':root{--safe-top:47px;--safe-bottom:34px;}'});
            await page.locator('.messenger-challenge').click();
            const close=await page.locator('.messenger-sheet header button').boundingBox();assert(close.y>=47,'chooser unsafe top');
            await page.keyboard.press('Escape');
            await page.locator('.messenger-composer textarea').fill('Brouillon conservé');await page.setViewportSize({width,height:500});
            await page.waitForFunction(()=>document.querySelector('.messenger-composer').getBoundingClientRect().bottom<=innerHeight+1);
            assert(await page.locator('.messenger-composer textarea').isVisible());await page.keyboard.press('Escape');await page.setViewportSize({width,height:844}); }
          else {
            await page.locator('.messenger-search input').fill('Personne');assert.equal(await page.locator('.messenger-empty').count(),0);
            await page.locator('.messenger-search input').fill('');
            await page.locator('.messenger-inbox').evaluate(el=>el.scrollTop=el.scrollHeight);
            const actions=await page.locator('.friend-invite-actions').boundingBox(),nav=await page.locator('.navbar').boundingBox();assert(actions.y+actions.height<=nav.y,`invite under nav ${width}`);
            await page.locator('.messenger-inbox').evaluate(el=>el.scrollTop=0);
          }
        }
        if(screen.startsWith('home')) {
          await page.addStyleTag({content:':root{--safe-top:47px;--safe-bottom:34px;}'});
          await page.evaluate(()=>scrollTo(0,document.body.scrollHeight));
          const teaser=await page.locator('.home-community-teaser').boundingBox(),nav=await page.locator('.navbar').boundingBox();assert(teaser.y+teaser.height<nav.y,`home footer under nav ${width}`);
          const matte=await page.locator('.app-home').evaluate(el=>getComputedStyle(el,'::after').height);assert.equal(matte,'47px');
          await page.evaluate(()=>scrollTo(0,0));
        }
        await page.screenshot({path:path.join(out,`polish-${screen.replaceAll('&','-')}-${width}.png`),fullPage:true});
      }
    }
    await page.goto('http://127.0.0.1:4336/?messages&async');
    await page.addStyleTag({content:':root{--safe-top:47px;--safe-bottom:34px;}'});
    const back=await page.locator('.async-header button').first().boundingBox();assert(back.y>=47,'async unsafe top');
    assert.deepEqual(errors,[]);console.log('PASS 25 mobile/desktop screens, categories, continuous search, full-height Messages, composer500px, reachable bottom actions, safe-area matte, zero page errors');
  } finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;server.close();});
