const assert=require('assert/strict');
const path=require('path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=require('./serve.cjs');
(async()=>{
  await new Promise(r=>server.listen(4332,'127.0.0.1',r));
  const browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
  try{
    for(const width of [320,375,390]){
      const page=await browser.newPage({viewport:{width,height:844},reducedMotion:'reduce'});
      for(const mode of ['home','profile','shop']){
        await page.goto(`http://127.0.0.1:4332/?${mode}`);await page.locator('.navbar').waitFor();await page.evaluate(()=>document.fonts.ready);
        const m=await page.evaluate(()=>{
          const header=document.querySelector('.home-head,.browse-header,.shop-v4-header');
          const r=header.getBoundingClientRect();
          const controls=header.querySelector('.top-controls');
          const buttons=[...document.querySelectorAll('.solo-toggle button,.section-edit,.more-toggle,.friend-invite-actions button')].map(el=>{const b=el.getBoundingClientRect();return {label:el.textContent.trim(),width:b.width,height:b.height};});
          return {overflow:document.documentElement.scrollWidth>innerWidth,buttons,header:{left:r.left,right:r.right,top:r.top},position:getComputedStyle(controls).position,
            children:[...header.children].map(el=>{const b=el.getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom};}),coral:getComputedStyle(document.documentElement).getPropertyValue('--v4-coral').trim()};
        });
        assert(!m.overflow,`Overflow ${width} ${mode}`);
        assert(m.buttons.every(b=>b.width>=44&&b.height>=44),`Touch targets ${width} ${mode}: ${JSON.stringify(m.buttons)}`);
        assert.equal(m.position,'relative',`Floating controls ${width} ${mode}`);
        assert(m.children.every(c=>c.left>=0&&c.right<=width),`Header clipping ${width} ${mode}`);
        assert(m.children.every((c,i)=>!i||c.left>=m.children[i-1].right-1),`Header overlap ${width} ${mode}`);
        assert.equal(m.coral,'#c81e3a');
        await page.getByRole('button',{name:'Réglages',exact:true}).click();assert(await page.locator('.mobile-controls-panel').isVisible());await page.keyboard.press('Escape');
        if(width===390)await page.screenshot({path:path.resolve(__dirname,`../../.mobile-preview/audit-${mode}.png`),fullPage:true});
        console.log(`PASS audit ${width} ${mode}`);
      }
      await page.close();
    }
    for(const mode of ['','&long','&photo']){
      const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
      await page.goto(`http://127.0.0.1:4332/?timed${mode}`);await page.locator('.question').waitFor();
      await page.addStyleTag({content:':root{--safe-top:47px;--safe-bottom:34px}.app.app-question{padding-top:calc(48px + var(--safe-top))!important;padding-bottom:max(12px,var(--safe-bottom))!important}'});
      await page.locator('.answer:enabled').first().waitFor();
      const m=await page.evaluate(()=>{
        const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return{top:r.top,bottom:r.bottom,left:r.left,right:r.right};};
        return{last:rect('.answer:last-child'),footer:rect('.game-footer'),rail:rect('.duel-score-rail'),first:rect('.answer'),letters:document.querySelectorAll('.answer .letter').length,bg:getComputedStyle(document.querySelector('.answer')).backgroundColor};
      });
      assert.equal(m.letters,0,'Letter badges still visible');assert.equal(m.bg,'rgb(247, 242, 232)');
      assert(m.last.bottom<=810,`Safe-area answer clipping ${mode}: ${JSON.stringify(m)}`);
      assert(m.rail.right<m.first.left&&m.rail.bottom<=m.footer.top+1,'Rails overlap answers/footer');
      await page.screenshot({path:path.resolve(__dirname,`../../.mobile-preview/audit-safe${mode.replace('&','-')||'-text'}.png`)});
      console.log(`PASS safe-area duel ${mode||'text'}`);await page.close();
    }
    console.log('All audit/header/safe-area checks passed');
  }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
