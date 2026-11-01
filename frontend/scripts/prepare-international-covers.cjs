// Manual preparation only. Titles are rendered by React, never into the image.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(__dirname, '..');
const titles = require('../src/internationalTopicTitles.json');
(async () => {
  const manifest = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
  const expected = Object.keys(titles).filter(key=>!titles[key].imagePending);
  if (manifest.length !== expected.length || new Set(manifest.map(x => x.key)).size !== expected.length || expected.some(key => !manifest.some(x => x.key === key))) throw Error('Exactly the approved international cover keys are required');
  const directory = path.join(root, 'public/images/covers/international-v1');
  const originals = path.resolve(root, '../.mobile-preview/international-originals');
  fs.mkdirSync(directory, {recursive:true}); fs.mkdirSync(originals, {recursive:true});
  const credits = [], report = [];
  for (const item of manifest) {
    if (item.asset && !/^[a-z0-9_-]+$/.test(item.asset)) throw Error(`Invalid asset filename: ${item.key}`);
    let input;
    if (item.path) input = fs.readFileSync(item.path);
    else {
      const cached = path.join(originals, crypto.createHash('sha256').update(item.url).digest('hex') + '.image');
      if (fs.existsSync(cached)) input = fs.readFileSync(cached);
      else {
        const r = await fetch(item.url, {signal:AbortSignal.timeout(30000),headers:{'User-Agent':'QuizzUpCoverResearch/1.0'}});
        if (!r.ok || !r.headers.get('content-type')?.startsWith('image/')) throw Error(`Source unavailable: ${item.key} (${r.status})`);
        input = Buffer.from(await r.arrayBuffer()); fs.writeFileSync(cached,input);
        await new Promise(resolve=>setTimeout(resolve,1100));
      }
    }
    const meta = await sharp(input).metadata();
    if (meta.width < 1024 || meta.height < 320) throw Error(`Original too small: ${item.key} (${meta.width}x${meta.height})`);
    for (const width of [320,640,1024]) {
      const file = path.join(directory, `${item.asset || item.key}-${width}.webp`);
      await sharp(input).rotate().resize({width,withoutEnlargement:true}).webp({quality:83,effort:5}).toFile(file);
      report.push({key:item.key,width,bytes:fs.statSync(file).size});
    }
    credits.push({key:item.key,title:titles[item.key].fr,kind:item.kind,credit:item.credit,source:item.source||null,license:item.license||null,licenseUrl:item.licenseUrl||null,originalImage:item.url||null,originalSha256:crypto.createHash('sha256').update(input).digest('hex'),preparation:item.kind==='generated'?'Retouche du titre intégré, conversion WebP ; titre traduit rendu séparément par le site':'Conversion WebP ; titre traduit rendu séparément par le site'});
    console.log('PREPARED',item.key,item.kind);
  }
  fs.writeFileSync(path.join(directory,'credits.json'),JSON.stringify(credits,null,2)+'\n');
  fs.writeFileSync(path.join(root,'src/internationalCoverSources.json'),JSON.stringify(Object.fromEntries(manifest.map(item=>[item.key,{kind:item.kind,source:item.source||null,credit:item.credit,focal:item.focal||'center',...(item.asset?{asset:item.asset}:{})}])),null,2)+'\n');
  fs.writeFileSync(path.resolve(root,'../.mobile-preview/international-assets-report.json'),JSON.stringify(report,null,2));
  const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const file=path.join(root,'public/image-credits.html');
  const html=fs.readFileSync(file,'utf8').replace(/<!-- international-v1-start -->[\s\S]*?<!-- international-v1-end -->\s*/g,'');
  const section=`<!-- international-v1-start --><section><h2>Couvertures multilingues</h2><p>Ces ${credits.length} versions remplacent les couvertures dont le titre était intégré en français. Les titres sont désormais affichés séparément par le site. Les cinq affiches cinéma en attente conservent leur version originale.</p><ul>`+credits.map(x=>`<li><strong>${escape(x.title)}</strong> — ${escape(x.credit)}${x.source?` · <a href="${escape(x.source)}">Source</a>`:''}${x.license?` · ${x.licenseUrl?`<a href="${escape(x.licenseUrl)}">${escape(x.license)}</a>`:escape(x.license)}`:''} · ${escape(x.preparation)}</li>`).join('')+'</ul></section><!-- international-v1-end -->\n';
  fs.writeFileSync(file,html.replace('</body>',section+'</body>'));
  console.log('COMPLETE',credits.length,'covers',report.length,'variants',report.reduce((s,x)=>s+x.bytes,0),'bytes');
})().catch(e=>{console.error(e);process.exitCode=1;});
