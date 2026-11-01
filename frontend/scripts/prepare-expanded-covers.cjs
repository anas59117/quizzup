// Manual asset preparation: resize sourced/generated originals without changing
// their content. Never runs during build or downloads images in the browser.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const root = path.resolve(__dirname, '..');
const categories = require('../src/catalogueExpansion.json');
const directory = path.join(root, 'public/images/covers/expanded-v1');
const rawDirectory = path.resolve(root, '../.mobile-preview/expanded-originals');
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
async function download(url) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await fetch(url, { signal: AbortSignal.timeout(30000), headers: { 'User-Agent': 'QuizzUpCoverResearch/1.0' } });
    if (response.ok && response.headers.get('content-type')?.startsWith('image/')) return Buffer.from(await response.arrayBuffer());
    if (response.status !== 429 || attempt === 3) throw Error(`Image download failed (${response.status})`);
    const seconds = Number(response.headers.get('retry-after'));
    await sleep((Number.isFinite(seconds) && seconds > 0 ? seconds : 20) * 1000);
  }
}
(async () => {
  const input = process.argv[2];
  if (!input) throw Error('Pass a local source manifest path');
  const source = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
  if (source.length !== 55 || new Set(source.map(row => row.key)).size !== 55 || categories.some(category => !source.some(row => row.key === category.key))) throw Error('Exactly the 55 expansion topics are required');
  fs.mkdirSync(directory, { recursive: true }); fs.mkdirSync(rawDirectory, { recursive: true });
  const covers = {}, credits = [], results = [];
  for (const category of categories) {
    const item = source.find(row => row.key === category.key);
    const sourceId = crypto.createHash('sha256').update(item.url || item.path).digest('hex').slice(0, 16);
    const rawFile = path.join(rawDirectory, `${item.key}-${sourceId}.image`);
    let data;
    if (item.path) data = fs.readFileSync(item.path);
    else if (fs.existsSync(rawFile)) data = fs.readFileSync(rawFile);
    else {
      data = await download(item.url); fs.writeFileSync(rawFile, data); await sleep(1100);
    }
    const metadata = await sharp(data).metadata();
    if (!metadata.width || !metadata.height || metadata.width < 320 || metadata.height < 320) throw Error(`Image too small: ${item.key}`);
    const maximum = Math.min(1024, metadata.width);
    const widths = [...new Set([320, 640, maximum].filter(width => width <= maximum))].sort((a, b) => a - b);
    const sizes = [];
    for (const width of widths) {
      const filename = `${item.key}-${width}.webp`;
      const file = path.join(directory, filename);
      await sharp(data).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 83, effort: 5 }).toFile(file);
      sizes.push({ src: `/images/covers/expanded-v1/${filename}`, width, bytes: fs.statSync(file).size });
    }
    // A changed original can produce different width variants. Retire only
    // obsolete files for this collection key after all new variants exist.
    const retained = new Set(sizes.map(size => path.basename(size.src)));
    for (const filename of fs.readdirSync(directory)) {
      if (filename.startsWith(`${item.key}-`) && /^.+-\d+\.webp$/.test(filename) && !retained.has(filename)) fs.unlinkSync(path.join(directory, filename));
    }
    const generated = item.kind === 'generated';
    const credit = generated ? 'Illustration générée pour QuizzUp' : item.credit;
    covers[item.key] = { src: sizes.at(-1).src, srcSet: sizes.map(size => `${size.src} ${size.width}w`).join(', '),
      focal: generated ? 'center' : item.focal || 'center 30%', fit: item.fit || 'cover', approved: true,
      embeddedTitle: generated || item.embeddedTitle === true, kind: item.kind, source: item.source || null, credit };
    credits.push({ key: item.key, title: category.label, kind: item.kind, source: item.source || null,
      credit, license: item.license || null, licenseUrl: item.licenseUrl || null,
      officialSource: item.officialSource || null, originalImage: item.url || null,
      preparation: 'Conversion WebP et redimensionnement ; cadrage à l’affichage',
      originalSha256: crypto.createHash('sha256').update(data).digest('hex') });
    results.push({ key: item.key, kind: item.kind, originalWidth: metadata.width, originalHeight: metadata.height, sizes });
    console.log(`PREPARED ${item.key} (${item.kind})`);
  }
  fs.writeFileSync(path.join(root, 'src/expandedTopicCovers.json'), JSON.stringify(covers, null, 2) + '\n');
  fs.writeFileSync(path.join(directory, 'credits.json'), JSON.stringify(credits, null, 2) + '\n');
  fs.writeFileSync(path.resolve(root, '../.mobile-preview/expanded-assets-report.json'), JSON.stringify(results, null, 2) + '\n');
  const escape = text => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const htmlFile = path.join(root, 'public/image-credits.html');
  const html = fs.readFileSync(htmlFile, 'utf8').replace(/<!-- expanded-v1-start -->[\s\S]*?<!-- expanded-v1-end -->\s*/g, '');
  const count = kind => credits.filter(item => item.kind === kind).length;
  const block = `<!-- expanded-v1-start --><section><h2>Les 55 nouveaux quiz</h2><p>${count('photo')} photographies, ${count('flag')} drapeau, ${count('promotional')} visuels promotionnels et ${count('generated')} illustrations générées pour QuizzUp. Les illustrations ne sont pas des photographies ni des affiches officielles.</p><ul>` + credits.map(item => `<li><strong>${escape(item.title)}</strong> — ${escape(item.credit)}${item.source ? ` · <a href="${escape(item.source)}">Source</a>` : ''}${item.license ? ` · ${item.licenseUrl ? `<a href="${escape(item.licenseUrl)}">${escape(item.license)}</a>` : escape(item.license)}` : ''} · ${escape(item.preparation)}</li>`).join('') + '</ul></section><!-- expanded-v1-end -->\n';
  fs.writeFileSync(htmlFile, html.replace('</body>', block + '</body>'));
  console.log(JSON.stringify({ topics: results.length, generated: results.filter(row => row.kind === 'generated').length, files: results.reduce((sum, row) => sum + row.sizes.length, 0), bytes: results.reduce((sum, row) => sum + row.sizes.reduce((total, size) => total + size.bytes, 0), 0) }));
})().catch(error => { console.error(error.message); process.exitCode = 1; });
