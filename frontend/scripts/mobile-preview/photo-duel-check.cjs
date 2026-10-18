const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const { spawn } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');
const out = path.resolve(__dirname, '../../.mobile-preview');
const wait = ms => new Promise(r=>setTimeout(r,ms));
(async () => {
  const data = fs.mkdtempSync(path.join(out,'photo-qa-'));
  const backend=spawn(process.execPath,[path.resolve(__dirname,'../../../backend/server.js')],{
    windowsHide:true,env:{...process.env,NODE_ENV:'test',PORT:'3003',DATA_DIR:data,CORS_ORIGIN:'http://127.0.0.1:4329',GUEST_AUTH_SECRET:randomBytes(32).toString('hex')},stdio:'ignore'});
  let browser;
  try {
    await new Promise(r=>server.listen(4329,'127.0.0.1',r));
    for(let i=0;i<40;i++){if(await fetch('http://127.0.0.1:3003/health').then(r=>r.ok).catch(()=>false))break;await wait(250);}
    browser=await chromium.launch({executablePath:process.env.EDGE_PATH||'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
    const pages=[],errors=[];
    for(const name of ['PhotoQA','RivalQA']) {
      const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
      await context.addInitScript(name=>{
        localStorage.setItem('quizzup-onboarded','1');localStorage.setItem('quizzup-name',name);localStorage.setItem('quizzup-avatar','robot');localStorage.setItem('quizzup-lang','fr');
        // Track connected destination buses; music owns one persistent GainNode.
        window.__audioBuses=[];
        const ramp=AudioParam.prototype.linearRampToValueAtTime;
        AudioParam.prototype.linearRampToValueAtTime=function(value,...args){if(value===0.5)this.__duelBus=true;return ramp.call(this,value,...args);};
        const connect=AudioNode.prototype.connect,disconnect=AudioNode.prototype.disconnect;
        AudioNode.prototype.connect=function(target,...args){if(this instanceof GainNode && this.gain.__duelBus && target instanceof AudioDestinationNode)window.__audioBuses.push({node:this,active:true});return connect.call(this,target,...args);};
        AudioNode.prototype.disconnect=function(...args){for(const bus of window.__audioBuses)if(bus.node===this)bus.active=false;return disconnect.apply(this,args);};
      },name);
      const page=await context.newPage();page.on('pageerror',error=>{errors.push(error.message);console.error('PAGE',error.stack);});
      page.on('websocket',socket=>socket.on('framereceived',({payload})=>{try{const d=JSON.parse(String(payload));if(['error','profile_updated','profile_update_failed','rate_limited','auth_required'].includes(d.type))console.log('WS',JSON.stringify({type:d.type,code:d.code,reason:d.reason,name:d.profile?.name}));}catch{}}));
      await page.goto('http://127.0.0.1:4329/?app');await page.locator('.home-head').waitFor();pages.push(page);
    }
    const [page,rival]=pages;
    await page.getByRole('button',{name:'Profil',exact:true}).click();
    await page.getByRole('button',{name:'Modifier le profil',exact:true}).click();
    const jpeg=await page.evaluate(()=>{const c=document.createElement('canvas');c.width=180;c.height=240;const x=c.getContext('2d');x.fillStyle='#1d8cff';x.fillRect(0,0,180,240);x.fillStyle='#ffd45b';x.fillRect(30,60,120,120);return c.toDataURL('image/jpeg').split(',')[1];});
    await page.getByLabel('Choisir ma photo',{exact:true}).setInputFiles({name:'photo-test.jpg',mimeType:'image/jpeg',buffer:Buffer.from(jpeg,'base64')});
    await page.locator('.profile-photo-preview > img').waitFor();
    assert.equal(await page.locator('.pf-avatar img').count(),0,'Draft changed public identity before save');
    await page.getByRole('textbox',{name:'Pseudo',exact:true}).fill('Photo publique');
    await page.locator('.profile-editor-save').click();
    await page.locator('.profile-editor').waitFor({state:'detached'});
    const profileName=page.locator('.pf-name');
    if(!await profileName.count())throw new Error('Profile left during save: '+(await page.locator('body').innerText()).slice(0,1200));
    assert.equal(await profileName.textContent(),'Photo publique');
    const saved=await page.evaluate(()=>localStorage.getItem('quizzup-avatar'));
    assert(saved.startsWith('/profile-photos/'),'Uploaded path not saved');
    await page.locator('.pf-avatar img').evaluate(img=>img.decode());
    await page.screenshot({path:path.join(out,'personal-photo-profile.png'),fullPage:true});
    // Cancel a removal, then refresh: the persistent photo stays authoritative.
    await page.getByRole('button',{name:'Modifier le profil',exact:true}).click();
    await page.getByRole('button',{name:'Retirer la photo',exact:true}).click();
    await page.locator('.profile-editor-cancel').click();
    assert.equal(await page.locator('.pf-avatar img').count(),1);
    await page.reload();await page.locator('.home-head').waitFor();
    assert.equal(await page.evaluate(()=>localStorage.getItem('quizzup-avatar')),saved);
    await page.getByRole('button',{name:'Activer le son',exact:true}).click();
    assert.equal(await page.evaluate(()=>window.__audioBuses.filter(b=>b.active).length),0,'Music playing on home');
    await page.getByRole('button',{name:'Inviter un ami',exact:true}).click();
    await page.locator('.room-code').waitFor();
    const roomCode=(await page.locator('.room-code').textContent()).trim();
    assert(/^[A-Z0-9]{5}$/.test(roomCode),'Room invitation has no real server code');
    assert.equal(await page.getByRole('button',{name:'Partager le code',exact:true}).count(),1);
    await rival.getByRole('button',{name:'J’ai un code',exact:true}).click();
    await rival.locator('.code-input').fill(roomCode);
    await rival.locator('.btn').filter({hasText:'Rejoindre'}).click();
    await rival.locator('.room-code').waitFor();
    assert.equal((await rival.locator('.room-code').textContent()).trim(),roomCode);
    await page.getByRole('button',{name:'Démarrer (2)',exact:true}).click();
    console.log('PASS real invitation → server room code → second player joins → host starts duel');
    await page.locator('.df-intro').waitFor({timeout:15000});
    await rival.locator('.df-intro img.player-avatar-photo').evaluate(img=>img.decode());
    await page.waitForFunction(()=>window.__audioBuses.some(b=>b.active));
    console.log('PASS photo save/cancel/refresh → opponent sees photo; music starts in duel only');
    for(let round=1;round<=6;round++){
      await Promise.all(pages.map(p=>p.locator('.game-progress-text').filter({hasText:`Question ${round} / 6`}).waitFor({timeout:20000})));
      await page.locator('.hud-chip.mine img').evaluate(img=>img.decode());
      await rival.locator('.hud-chip:not(.mine) img').evaluate(img=>img.decode());
      await Promise.all(pages.map(p=>p.waitForFunction(()=>document.querySelectorAll('.answer:enabled').length===4)));
      if(round===1){
        await page.getByRole('button',{name:'Couper le son',exact:true}).click();
        await page.waitForFunction(()=>window.__audioBuses.every(b=>!b.active));
        await page.getByRole('button',{name:'Activer le son',exact:true}).click();
        await page.waitForFunction(()=>window.__audioBuses.some(b=>b.active));
        await page.screenshot({path:path.join(out,'personal-photo-duel.png')});
      }
      await page.locator('.answer').first().click();await rival.locator('.answer').nth(1).click();
    }
    await page.locator('.res-cta').waitFor({timeout:20000});
    await page.waitForFunction(()=>window.__audioBuses.every(b=>!b.active));
    await page.locator('.res-score.me img').evaluate(img=>img.decode());
    console.log('PASS six rounds/photo identities and duel music mute/resume/stop');
    await page.getByRole('button',{name:'Voir le détail',exact:true}).click();
    await page.locator('.share-link').last().click();
    await page.locator('.share-btn.primary:enabled').waitFor();
    const card=await page.locator('.share-canvas').evaluate(canvas=>canvas.toDataURL());
    assert(card.startsWith('data:image/png'),'Photo tainted share canvas');
    await page.getByRole('button',{name:'Fermer',exact:true}).click();
    await page.getByRole('button',{name:"Retour à l'accueil",exact:true}).click();
    await page.getByRole('button',{name:'Profil',exact:true}).click();
    await page.getByRole('button',{name:'Modifier le profil',exact:true}).click();
    await page.getByRole('button',{name:'Retirer la photo',exact:true}).click();await page.locator('.profile-editor-save').click();
    await page.locator('.profile-editor').waitFor({state:'detached'});
    assert.equal(await page.locator('.pf-avatar img').count(),0,'Photo removal did not restore avatar');
    assert.equal(await page.evaluate(()=>localStorage.getItem('quizzup-avatar')),'robot');
    assert.deepEqual(errors,[]);
    console.log('PASS six rounds/photo identities → music stops at results → share export → remove photo restores avatar');
  } finally { if(browser)await browser.close();backend.kill();server.close(); }
})().catch(e=>{console.error(e);process.exitCode=1;});
