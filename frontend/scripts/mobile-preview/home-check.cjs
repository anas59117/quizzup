const assert=require('assert/strict'),fs=require('fs'),path=require('path'),{randomBytes}=require('crypto'),{spawn}=require('child_process');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server=require('./serve.cjs'),out=path.resolve(__dirname,'../../.mobile-preview');
(async()=>{
 const data=fs.mkdtempSync(path.join(out,'home-qa-'));
 const backend=spawn(process.execPath,[path.resolve(__dirname,'../../../backend/server.js')],{windowsHide:true,env:{...process.env,NODE_ENV:'test',PORT:'3003',DATA_DIR:data,CORS_ORIGIN:'http://127.0.0.1:4335',GUEST_AUTH_SECRET:randomBytes(32).toString('hex')},stdio:'ignore'});
 let browser;const errors=[],payloads=[],network=[];
 try{
 await new Promise(r=>server.listen(4335,'127.0.0.1',r));
 let ready=false;for(let i=0;i<50;i++){ready=await fetch('http://127.0.0.1:3003/health').then(r=>r.ok).catch(()=>false);if(ready)break;await new Promise(r=>setTimeout(r,200));}assert(ready);
 browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const ctx=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await ctx.addInitScript(()=>{localStorage.setItem('quizzup-onboarded','1');localStorage.setItem('quizzup-name','HomeQA');localStorage.setItem('quizzup-lang','fr');});
 const page=await ctx.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>network.push({url:r.url(),error:r.failure()}));page.on('websocket',ws=>ws.on('framesent',f=>{try{payloads.push(JSON.parse(f.payload));}catch{}}));
 let releaseIdentity;
 await page.route('**/auth/guest',async route=>{await new Promise(resolve=>{releaseIdentity=resolve;});await route.continue();});
 await page.goto('http://127.0.0.1:4335/?app',{waitUntil:'domcontentloaded'});
 await page.locator('.home-loading').waitFor();assert.equal(await page.locator('.home-loading button,.home-loading a').count(),0);
 await page.screenshot({path:path.join(out,'audit-session-loading.png')});
 while(!releaseIdentity)await new Promise(resolve=>setTimeout(resolve,20));
 releaseIdentity();await page.locator('.home-refined:not(.home-loading)').waitFor();await page.unroute('**/auth/guest');
 for(const width of [320,375,390,430]){
 await page.setViewportSize({width,height:844});
 await page.screenshot({path:path.join(out,`home-app-${width}.png`),fullPage:true});
 const dimensions=await page.locator('.topics-grid-v4 .tile-v4').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return [r.width,r.height]}));assert.equal(dimensions.length,4);assert(dimensions.every(([w,h])=>Math.abs(w-h)<1));
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 }
 console.log('PASS actual App home 320/375/390/430, four square covers and no horizontal overflow');
 await page.getByRole('button',{name:'Réglages',exact:true}).click();assert.equal(await page.locator('.mobile-controls-panel button').count(),3);await page.getByRole('button',{name:'Activer le son',exact:true}).click();await page.keyboard.press('Escape');assert.equal(await page.locator('.mobile-controls-panel').count(),0);
 await page.locator('.home-action').click();await page.locator('input[type=search]').fill('Minecraft');assert.equal(await page.getByRole('button',{name:'Minecraft',exact:true}).count(),1);assert.equal(await page.locator('input[type=search]').evaluate(e=>e===document.activeElement),true);await page.getByRole('button',{name:'Minecraft',exact:true}).click();await page.locator('.category-preview-v4').waitFor();await page.locator('.cp-back').click();await page.locator('.themes-refined').waitFor();await page.getByRole('button',{name:'Accueil',exact:true}).click();
 console.log('PASS quiz detail returns to its originating Themes screen');
 await page.getByRole('button',{name:'Messages',exact:true}).click();assert.equal(await page.locator('.navbar [aria-current=page]').textContent(),'Messages');await page.setViewportSize({width:320,height:500});await page.locator('.messenger input').fill('Personne');await page.screenshot({path:path.join(out,'home-messages-320x500.png'),fullPage:true});await page.getByRole('button',{name:'Profil',exact:true}).click();assert.equal(await page.getByRole('button',{name:/Boutique/}).count(),0);assert(await page.locator('.pf-head').count()||await page.locator('.pf-avatar').count());await page.getByRole('button',{name:'Accueil',exact:true}).click();
 await page.locator('.nav-bolt').click();await page.keyboard.press('Escape');assert.equal(await page.getByRole('dialog').count(),0);assert.equal(await page.locator('.nav-bolt').evaluate(e=>e===document.activeElement),true);
 await page.locator('.nav-bolt').click();await page.getByRole('button',{name:/J’ai un code/}).click();await page.locator('.code-input').waitFor();assert.equal(await page.locator('.code-input').count(),1);await page.locator('.home-themes-link').click();
 await page.locator('.nav-bolt').click();await page.getByRole('button',{name:/Inviter un ami/}).click();await page.locator('.room-code').first().waitFor();assert(payloads.some(p=>p.type==='create_room'));console.log('PASS settings sound, search focus/filter, Messages selected/inbox navigation, Profile no shop, Escape/focus, join-code and create_room');
 await page.locator('.home-themes-link').click();await page.locator('.home-refined').waitFor();await page.locator('.nav-bolt').click();await page.getByRole('button',{name:/Solo/}).click();await page.locator('.duel-premium,.df-faceoff').first().waitFor({timeout:20000});assert(payloads.some(p=>p.type==='solo'&&p.category===null));console.log('PASS actual Solo request and gameplay start');
 const duelContext=await browser.newContext({viewport:{width:390,height:844}});await duelContext.addInitScript(()=>{localStorage.setItem('quizzup-onboarded','1');localStorage.setItem('quizzup-name','DuelHomeQA');localStorage.setItem('quizzup-lang','fr');});const duel=await duelContext.newPage();await duel.goto('http://127.0.0.1:4335/?app');await duel.locator('.home-refined').waitFor();let joined=false;duel.on('websocket',ws=>ws.on('framesent',f=>{try{if(JSON.parse(f.payload).type==='join')joined=true;}catch{}}));await duel.reload();await duel.locator('.home-refined').waitFor();await duel.locator('.nav-bolt').click();await duel.getByRole('button',{name:/Duel rapide/}).click();await duel.locator('.wm-search').waitFor();assert(joined);console.log('PASS real multiplayer join payload');const fixture=await ctx.newPage();await fixture.goto('http://127.0.0.1:4335/?home&personal');await fixture.locator('.personal-theme-level').first().waitFor();for(const width of [320,375,390,430]){await fixture.setViewportSize({width,height:844});await fixture.screenshot({path:path.join(out,`home-personal-${width}.png`),fullPage:true});}assert.equal(await fixture.locator('.personal-theme-level').first().evaluate(e=>getComputedStyle(e).backgroundColor),'rgba(0, 0, 0, 0)');
 assert.deepEqual(errors,[]);console.log('PASS personal real-level fixture screenshots; zero page errors');
 }catch(e){fs.writeFileSync(path.join(out,'home-failure.json'),JSON.stringify({errors,network,payloads},null,2));for(const c of browser?.contexts()||[])for(const p of c.pages())await p.screenshot({path:path.join(out,'home-failure.png'),fullPage:true}).catch(()=>{});throw e;}
 finally{await browser?.close();backend.kill();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
