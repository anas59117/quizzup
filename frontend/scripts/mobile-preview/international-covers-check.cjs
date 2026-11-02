const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {chromium,webkit}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=require('./serve.cjs');
const titles=require('../../src/internationalTopicTitles.json');
const active=Object.entries(titles).filter(([,v])=>!v.imagePending);
const output=path.resolve(__dirname,'../../../.mobile-preview/international-qa');
(async()=>{
 fs.mkdirSync(output,{recursive:true});await new Promise(r=>server.listen(4359,'127.0.0.1',r));
 let browser;
 try{
  const engine=process.env.COVERS_WEBKIT?'WebKit':'Chromium';
  browser=process.env.COVERS_WEBKIT?await webkit.launch({headless:true}):await chromium.launch({headless:true,executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'});
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const width of [320,390,430]){
   await page.setViewportSize({width,height:844});
   await page.goto('http://127.0.0.1:4359/?new-covers&international');
   await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('.tile-v4--localized').count(),21);
   for(const lang of ['fr','en']){
    if(lang==='en')await page.getByRole('button',{name:'Change preview language'}).click();
    for(const [key,value] of active){
     const card=page.locator(`.tile-v4[data-topic="${key}"]`);await card.evaluate(x=>x.scrollIntoView({block:'center'}));
     const img=card.locator('img');await img.evaluate(x=>x.decode());
     assert((await img.getAttribute('src')).includes('/international-v1/'));
     assert.equal(await card.getAttribute('aria-label'),value[lang]);
     assert.equal(await card.locator('.tile-v4__poster-title').count(),0);
     assert.equal(await card.locator('.tile-v4__label').textContent(),value[lang]);
     const fit=await card.evaluate(c=>{const a=c.getBoundingClientRect(),label=c.querySelector('.tile-v4__label'),b=label.getBoundingClientRect(),s=getComputedStyle(label);return s.visibility==='visible'&&s.clipPath==='none'&&b.width>1&&b.height>1&&b.top>=a.top+a.height*.6&&b.bottom<=a.bottom+1&&b.left>=a.left-1&&b.right<=a.right+1;});
     assert(fit,`Title overflows: ${key}/${lang}/${width}`);
     assert(await card.locator('.tile-v4__label').evaluate(x=>x.scrollWidth<=x.clientWidth+1),`Title word is clipped: ${key}/${lang}/${width}`);
     if(width===390&&engine==='Chromium')await card.screenshot({path:path.join(output,`${key}-${lang}.png`)});
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Page overflow: ${lang}/${width}`);
   }
   for(const [key,value]of Object.entries(titles).filter(([,v])=>v.imagePending)){
    const card=page.locator(`.tile-v4[data-topic="${key}"]`);assert((await card.locator('img').getAttribute('src')).includes('/approved-v2/'));
    assert.equal(await card.locator('.tile-v4__poster-title').count(),0);
   }
   for(const key of ['ligue_champions','gardiens_legendaires','mathematiques_logique']){
    await page.goto(`http://127.0.0.1:4359/?quiz&topic=${key}&en`);
    await page.locator('.cp-artwork').evaluate(x=>x.decode());
    assert.equal(await page.locator('#quiz-title').textContent(),titles[key].en);
    const button=page.locator('.cp-play');await button.scrollIntoViewIfNeeded();
    assert(await button.evaluate(x=>{const r=x.getBoundingClientRect();return document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('.cp-play')===x;}),`Play hidden: ${key}/${width}`);
   }
  }
  await page.goto('http://127.0.0.1:4359/?themes&en');
  await page.locator('.search-input').fill('Goalkeepers');
  await page.locator('.tile-v4[data-topic="gardiens_legendaires"]').click();
  assert.equal(await page.locator('#quiz-title').textContent(),titles.gardiens_legendaires.en);
  assert.deepEqual(errors,[]);
  console.log(`PASS ${engine}: 21 covers FR/EN at 320/390/430, live language switch, 5 original posters retained, detail titles, Play targets, English search; no JS errors`);
 }finally{await browser?.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
