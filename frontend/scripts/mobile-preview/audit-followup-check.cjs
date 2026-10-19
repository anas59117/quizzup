const assert=require('node:assert/strict'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_PATH||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const sharp=require(process.env.SHARP_PATH||'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const server=require('./serve.cjs'),out=path.resolve(__dirname,'../../.mobile-preview');
const luminance=rgb=>rgb.map(n=>n/255).map(n=>n<=.04045?n/12.92:((n+.055)/1.055)**2.4).reduce((v,n,i)=>v+n*[.2126,.7152,.0722][i],0);
(async()=>{await new Promise(r=>server.listen(4338,'127.0.0.1',r));let browser;try{
 browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const white=await sharp({create:{width:1,height:1,channels:3,background:'#fff'}}).png().toBuffer();
 for(const width of [320,390]){
 await page.setViewportSize({width,height:844});await page.goto('http://127.0.0.1:4338/?profile&personal');
 assert.equal(await page.locator('.pf-theme-name').count(),4);assert((await page.locator('.pf-theme-name').allTextContents()).includes('Rap Français'));
 const backup=page.locator('.profile-account-action');assert(await backup.isEnabled());const b=await backup.boundingBox();assert(b.y+b.height<600);
 await page.screenshot({path:path.join(out,`audit-profile-${width}.png`),fullPage:true});await backup.click();await page.locator('.profile-account-linked').waitFor();assert.equal(await backup.count(),0);
 await page.goto('http://127.0.0.1:4338/?themes');await page.locator('.family-tile[data-family=music]').click();assert.equal(await page.locator('.cat-header .back-link').count(),1);assert.equal(await page.locator('.back-to-topics').count(),0);
 for(const [query,key] of [['Booba','booba'],['Géographie','geography']]){
 await page.locator('input[type=search]').fill(query);const card=page.locator(`.tile-v4[data-topic=${key}]`);await card.waitFor();assert.equal(await card.locator('.tile-v4__badge').count(),0);
 await card.locator('img').evaluate((image,src)=>{image.src=src;},'data:image/png;base64,'+white.toString('base64'));
 await page.waitForFunction(key=>{const i=document.querySelector(`.tile-v4[data-topic=${key}] img`);return i?.complete&&i.naturalWidth===1;},key);
 const cardBox=await card.boundingBox(),label=await card.locator('.tile-v4__label').boundingBox();const png=await card.screenshot({path:path.join(out,`audit-photo-white-${key}-${width}.png`)});
 const {data,info}=await sharp(png).ensureAlpha().raw().toBuffer({resolveWithObject:true});let min=Infinity;
 for(const fraction of [.25,.5]) {const offset=(Math.floor(info.height*fraction)*info.width+10)*4;assert([...data.subarray(offset,offset+3)].every(value=>value>=245),`${key} artwork is darkened above its caption at ${fraction}`);}
 for(let y=Math.ceil(label.y-cardBox.y);y<Math.floor(label.y+label.height-cardBox.y);y++) {const offset=(y*info.width+10)*4;const ratio=1.05/(luminance([...data.subarray(offset,offset+3)])+.05);min=Math.min(min,ratio);}
 assert(min>=4.5,`${key} caption on white image contrast ${min}`);console.log(`PASS ${key} white-photo caption floor ${min.toFixed(2)}:1 at ${width}px`);
 }
 await page.locator('.cat-header .back-link').click();assert.equal(await page.locator('.family-tile').count(),9);assert.equal(await page.locator('input[type=search]').inputValue(),'');
 }
 assert.deepEqual(errors,[]);console.log('PASS named profile themes, above-fold account save callback/linked state, one parent Back, explicit global search, reliable badge removal and white-photo contrast');
 }finally{await browser?.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);process.exitCode=1;server.close();});
