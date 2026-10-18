const assert = require('assert/strict');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const server = require('./serve.cjs');

(async () => {
  await new Promise(resolve => server.listen(4327, '127.0.0.1', resolve));
  const browser = await chromium.launch({ executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
  const errors = [];
  try {
    for (const topic of ['rap_fr','harry_potter','minecraft','marvel']) {
      for (const [width,height] of (process.env.QUIZ_QA_FAST === '1' ? [[390,844]] : [[320,568],[390,664],[390,844],[430,932],[844,390],[1440,900]])) {
        const page = await browser.newPage({ viewport: { width,height }, reducedMotion: 'reduce' });
        if (process.env.QUIZ_QA_FAST === '1') await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//,route=>route.abort());
        page.on('pageerror', error => errors.push(error.message));
        await page.goto(`http://127.0.0.1:4327/?quiz&topic=${topic}`);
        await page.locator('.cp-head').waitFor();
        await page.evaluate(() => document.fonts.ready);
        assert.equal(await page.locator('.cp-head .cp-header-bg').count(),1,'The themed background does not continue behind the quiz header');
        const headerTheme=await page.evaluate(()=>({
          page:getComputedStyle(document.querySelector('.category-preview-v4 > .cp-bg')).backgroundImage,
          header:getComputedStyle(document.querySelector('.cp-header-bg')).backgroundImage,
        }));
        assert.equal(headerTheme.header,headerTheme.page,'Quiz header uses a different background from its theme');
        const buttonContrast=await page.locator('.cp-head button').evaluateAll(buttons=>{
          const rgba=value=>value.match(/[\d.]+/g).map(Number);
          const luminance=rgb=>rgb.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
          return buttons.map(button=>{
            const css=getComputedStyle(button),bg=rgba(css.backgroundColor),fg=rgba(css.color);
            // White is the brightest possible underlying theme; an icon that
            // passes here stays legible on the darker gradients too.
            const background=bg.slice(0,3).map(v=>v*(bg[3]??1)+255*(1-(bg[3]??1)));
            const a=luminance(fg.slice(0,3)),b=luminance(background);
            return (Math.max(a,b)+.05)/(Math.min(a,b)+.05);
          });
        });
        assert(buttonContrast.every(ratio=>ratio>=3),'Quiz header icons lack contrast against the themed background');
        for (const [safeTop,safeBottom] of [[0,0],[47,34]]) {
          await page.evaluate(({safeTop,safeBottom}) => {
            document.documentElement.style.setProperty('--safe-top',`${safeTop}px`);
            document.documentElement.style.setProperty('--safe-bottom',`${safeBottom}px`);
            window.scrollTo(0,0);
          },{safeTop,safeBottom});
          await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
          for (const scrolled of [false,true]) {
            if (scrolled) await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));
            await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
            const geometry = await page.evaluate(() => {
              const bg=document.querySelector('.cp-bg').getBoundingClientRect();
              const header=document.querySelector('.cp-head').getBoundingClientRect();
              const controls=[...document.querySelectorAll('.cp-head button')].map(el=>{
                const r=el.getBoundingClientRect();
                return {x:r.x,y:r.y,right:r.right,bottom:r.bottom,width:r.width,height:r.height};
              });
              const ancestors=[]; for(let el=document.querySelector('.cp-head');el;el=el.parentElement){const css=getComputedStyle(el);ancestors.push({name:el.className||el.tagName,overflow:css.overflow,transform:css.transform,position:css.position,top:css.top});}
              return {bg:{top:bg.top,bottom:bg.bottom,left:bg.left,right:bg.right},header:{top:header.top,bottom:header.bottom},controls,width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,ancestors,rootStyle:document.documentElement.style.cssText,safe:getComputedStyle(document.querySelector('.cp-head')).getPropertyValue('--safe-top')};
            });
            assert(geometry.bg.top<=0 && geometry.bg.bottom>=height && geometry.bg.left<=0 && geometry.bg.right>=width,
              `Broken quiz background ${topic} ${width}x${height} scrolled=${scrolled}: ${JSON.stringify(geometry.bg)}`);
            assert(geometry.header.top>=safeTop-1,`Quiz header under safe area: ${topic} ${width}x${height} safe=${safeTop} scrolled=${scrolled}: ${JSON.stringify(geometry)}`);
            assert(geometry.controls.length>=5,`Quiz global controls outside its header: ${topic}`);
            assert(geometry.controls.every(r=>r.y>=safeTop && r.width>=44 && r.height>=44 && r.x>=0 && r.right<=width && r.bottom<=height),
              `Clipped quiz controls ${topic} ${width}x${height}: ${JSON.stringify(geometry.controls)}`);
            assert(geometry.scrollWidth<=width,`Horizontal overflow ${topic}`);
            if (scrolled) {
              const friends=await page.locator('.cp-friends').boundingBox();
              const nav=await page.locator('.navbar').boundingBox();
              assert(friends.y+friends.height<=nav.y,`Quiz bottom obscured ${topic} ${width}x${height}`);
            }
          }
          await page.getByRole('button',{name:'Réglages',exact:true}).click();
          const settings=await page.locator('.mobile-controls-panel').boundingBox();
          assert(settings && settings.x>=0 && settings.x+settings.width<=width && settings.y>=safeTop && settings.y+settings.height<=height,
            `Quiz settings clipped ${topic} ${width}x${height}`);
          await page.keyboard.press('Escape');
          assert.equal(await page.locator('.mobile-controls-panel').count(),0);
          await page.setViewportSize({width,height:height+90});
          const background=await page.locator('.category-preview-v4 > .cp-bg').boundingBox();
          assert(background.y<=0 && background.y+background.height>=height+90,'Background does not follow browser-toolbar resizing');
          await page.setViewportSize({width,height});
        }
        if (width===390 && height===844) {
          await page.evaluate(()=>window.scrollTo(0,0));
          await page.screenshot({path:path.resolve(__dirname,`../../.mobile-preview/quiz-fixed-${topic}.png`),fullPage:true});
        }
        console.log(`PASS ${topic} ${width}x${height} · scroll, safe insets, toolbar resize`);
        await page.close();
      }
    }
    assert.deepEqual(errors,[]);
    console.log('All quiz layout regressions passed');
  } finally { await browser.close(); server.close(); }
})().catch(error=>{console.error(error);server.close();process.exitCode=1;});
