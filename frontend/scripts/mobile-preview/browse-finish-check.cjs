const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium, webkit } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const out = path.resolve(__dirname, '../../.mobile-preview');
const port = process.env.BROWSE_WEBKIT ? 4341 : 4340;
const engine = process.env.BROWSE_WEBKIT ? 'webkit' : 'chromium';
const pilots = ['blue_lock','jojo','saint_seiya','fairy_tail','haikyu'];
const rgb = value => value.match(/[\d.]+/g).slice(0,3).map(Number);
const luminance = color => rgb(color).map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
const contrast = (a,b) => {const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
(async()=>{
  await new Promise(r=>server.listen(port,'127.0.0.1',r));
  let browser;
  try {
    browser = process.env.BROWSE_WEBKIT ? await webkit.launch() : await chromium.launch({ executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe' });
    const context = await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'reduce'});
    const page = await context.newPage(), errors=[];
    page.on('pageerror', e=>errors.push(e.message));
    await page.goto(`http://127.0.0.1:${port}/?home`);
    for (const theme of ['light','dark']) {
      await page.evaluate(theme=>localStorage.setItem('quizzup-theme',theme),theme);
      for (const screen of ['home&personal','themes','profile&personal','messages&populated']) {
        for (const width of [320,390,430]) {
          await page.setViewportSize({width,height:844});
          await page.goto(`http://127.0.0.1:${port}/?${screen}`);
          await page.locator('.navbar').waitFor();
          await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme,theme);
          assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${theme}/${screen}/${width} overflow`);
          await page.evaluate(()=>scrollTo(0,document.documentElement.scrollHeight));
          const nav=await page.locator('.navbar').evaluate(e=>{const r=e.getBoundingClientRect();return {position:getComputedStyle(e).position,y:r.y,bottom:r.bottom,viewport:innerHeight,hit:document.elementFromPoint(r.x+20,r.y+20)?.closest('.navbar')===e};});
          assert.equal(nav.position,'fixed');assert(nav.y>=0&&nav.bottom<=nav.viewport&&nav.hit,`${screen} navigation hidden`);
          if(screen==='themes') {
            const colors=await page.locator('.family-label').first().evaluate(e=>({ink:getComputedStyle(e).color,paper:getComputedStyle(e.closest('button')).backgroundColor}));
            assert(contrast(colors.ink,colors.paper)>=4.5);
            assert.equal(colors.paper,theme==='dark'?'rgb(36, 33, 40)':'rgb(255, 250, 242)');
          }
          if(screen.startsWith('profile')) {
            const gap=await page.evaluate(()=>{const themes=document.querySelector('.pf-themes').getBoundingClientRect();const next=document.querySelector('.pf-themes').nextElementSibling.getBoundingClientRect();return next.top-themes.bottom;});
            assert(gap>=0&&gap<=60,`profile gap ${gap}`);
            await page.evaluate(()=>scrollTo(0,0));await page.locator('.pf-edit-dot').click();
            const colors=await page.locator('.profile-name-input').evaluate(e=>({ink:getComputedStyle(e).color,paper:getComputedStyle(e).backgroundColor}));
            assert(contrast(colors.ink,colors.paper)>=4.5);
          }
          await page.evaluate(()=>scrollTo(0,0));
          if(width===390) await page.screenshot({path:path.join(out,`browse-${engine}-${theme}-${screen.replace('&','-')}.png`),fullPage:true});
        }
      }
    }
    // Exercise CSS states that are absent on an empty/new account, without
    // adding fabricated people, requests or rewards to production data.
    const stateColors = await page.evaluate(()=>{
      const probe=document.createElement('section');
      probe.className='app-profile app-messenger community-screen';
      probe.innerHTML='<div class="pf-v4"><div class="streak-day played"><span class="streak-day-label">Lun</span></div><div class="streak-reward unlocked"><span class="sr-bonus">+50 XP</span></div></div><div class="messenger"><div class="messenger-request"><button>Accepter</button></div><div class="messenger-duel"><button class="quiet">Refuser</button></div><div class="friend-invite-actions"><button>Inviter</button><button>Code</button></div></div><div class="community-question"><button class="correct" disabled>Bonne réponse</button></div><button aria-pressed="true">Filtre actif</button><button aria-pressed="false">Filtre inactif</button>';
      document.body.append(probe);
      const styles=[...probe.querySelectorAll('.streak-day-label,.sr-bonus,.messenger-request button,.quiet,.friend-invite-actions button + button,.correct,[aria-pressed=true]')].map(e=>{
        const ink=getComputedStyle(e).color;let parent=e,paper=getComputedStyle(e).backgroundColor;
        while(paper==='rgba(0, 0, 0, 0)'&&parent.parentElement){parent=parent.parentElement;paper=getComputedStyle(parent).backgroundColor;}
        return {name:e.textContent,ink,paper};
      });
      const pressed=getComputedStyle(probe.querySelector('[aria-pressed=true]')).backgroundColor;
      const unpressed=getComputedStyle(probe.querySelector('[aria-pressed=false]')).backgroundColor;
      probe.remove();return {styles,pressed,unpressed};
    });
    for(const colors of stateColors.styles) assert(contrast(colors.ink,colors.paper)>=4.5,`${colors.name} dark state contrast`);
    assert.notEqual(stateColors.pressed,stateColors.unpressed);
    // All five real cards use local, decoded artwork and preserve their labels.
    await page.goto(`http://127.0.0.1:${port}/?themes`);
    await page.locator('.family-tile[data-family=manga]').click();
    await page.locator('.tile-v4').evaluateAll((cards,keys)=>cards.forEach(card=>{card.closest('.topic-tile-wrap').hidden=!keys.includes(card.dataset.topic);if(keys.includes(card.dataset.topic)) card.querySelector('img').loading='eager';}),pilots);
    for(const key of pilots) {
      const card=page.locator(`.tile-v4[data-topic=${key}]`);
      await card.scrollIntoViewIfNeeded();
      await card.locator('img').evaluate(img=>img.decode());
      assert((await card.locator('img').getAttribute('src')).startsWith('/images/covers/editorial-v1/'));
      const box=await card.boundingBox();assert(Math.abs(box.width-box.height)<2);
    }
    await page.setViewportSize({width:390,height:1100});await page.evaluate(()=>scrollTo(0,0));
    await page.screenshot({path:path.join(out,`browse-${engine}-pilot-covers.png`),fullPage:true});
    // Real reduced viewport, safe-area padding, then live system/manual preference.
    await page.goto(`http://127.0.0.1:${port}/?messages&populated`);
    await page.locator('.messenger-row').first().click();await page.setViewportSize({width:390,height:500});
    const composer=page.locator('.messenger-composer textarea');await composer.fill('Une revanche ?');
    assert((await composer.boundingBox()).y+(await composer.boundingBox()).height<=500);
    await page.goto(`http://127.0.0.1:${port}/?home&personal`);
    await page.evaluate(()=>localStorage.removeItem('quizzup-theme')); // No further init scripts in a fresh context.
    const systemContext=await browser.newContext({viewport:{width:390,height:844},colorScheme:'light',reducedMotion:'no-preference'});
    const system=await systemContext.newPage();await system.goto(`http://127.0.0.1:${port}/?home&personal`);
    await system.locator('.home-refined').waitFor();await system.emulateMedia({colorScheme:'dark'});
    await system.waitForFunction(()=>document.documentElement.dataset.theme==='dark');
    await system.getByRole('button',{name:'Réglages',exact:true}).click();await system.getByRole('button',{name:'Mode clair',exact:true}).click();
    await system.waitForFunction(()=>document.documentElement.dataset.theme==='light');await system.emulateMedia({colorScheme:'light'});await system.emulateMedia({colorScheme:'dark'});
    assert.equal(await system.evaluate(()=>document.documentElement.dataset.theme),'light');
    await system.keyboard.press('Escape');await system.getByRole('button',{name:'Thèmes',exact:true}).click();
    const before=await system.locator('.navbar').boundingBox();await system.locator('.family-tile[data-family=manga]').click();
    const after=await system.locator('.navbar').boundingBox();assert.equal(before.y,after.y);
    assert.equal(await system.locator('.app').evaluate(e=>getComputedStyle(e).transform),'none');
    await systemContext.close();assert.deepEqual(errors,[]);
    console.log(`PASS ${engine}: 24 light/dark layouts, fixed navigation after scroll, profile contrast/spacing, five local covers, 500px composer, system/manual preference, content-only motion; zero page errors`);
  } finally { await browser?.close();await new Promise(r=>server.close(r)); }
})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
