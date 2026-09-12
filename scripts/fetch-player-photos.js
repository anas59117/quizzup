#!/usr/bin/env node
// Bulk-fetches "guess the player" photos for QuizzUp.
//
// For each name below, it grabs the lead photo from the French Wikipedia
// article plus its author/license metadata from Wikimedia Commons. Wikipedia
// policy forbids non-free photos of living people, so any lead image found
// this way is already CC-licensed or public domain — this script just
// records the exact license/author so QuizzUp can display proper credit.
//
// Requires Node.js 18+ (built-in fetch). No npm install needed.
// Run locally (this fetches from the real internet, not from inside the
// Claude sandbox): `node fetch-player-photos.js`
// Then zip the generated `player-photos/` folder and send it back.

const fs = require('fs');
const path = require('path');

const CATEGORIES = {
  foot_fr: [
    'Zinédine Zidane', 'Kylian Mbappé', 'Antoine Griezmann', 'Karim Benzema',
    'Paul Pogba', "N'Golo Kanté", 'Didier Deschamps', 'Hugo Lloris',
    'Michel Platini', 'Just Fontaine', 'Thierry Henry', 'Franck Ribéry',
    'Olivier Giroud', 'Ousmane Dembélé', 'Kingsley Coman',
    'Aurélien Tchouaméni', 'Eduardo Camavinga', 'Lucas Hernandez',
    'Raphaël Varane', 'Presnel Kimpembe',
  ],
  rap_fr: [
    'Booba', 'Jul (rappeur)', 'Ninho (rappeur)', 'Nekfeu', 'Bigflo et Oli',
    'Orelsan', 'Gims', 'Dadju', 'Soprano (rappeur)', 'Kaaris', 'Lacrim',
    'Kalash Criminel', 'Alonzo (rappeur)', 'PLK (rappeur)', 'Naps (rappeur)',
  ],
};

const OUT_DIR = path.join(__dirname, '..', 'player-photos');
const USER_AGENT = 'QuizzUpPhotoFetcher/1.0 (personal hobby trivia game)';

function apiGet(host, params) {
  const url = `https://${host}/w/api.php?${new URLSearchParams({ ...params, format: 'json' })}`;
  return fetch(url, { headers: { 'User-Agent': USER_AGENT } }).then((r) => r.json());
}

function stripTags(html) {
  return (html || '').replace(/<[^>]+>/g, '').trim();
}

function slugify(title) {
  return title.normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase().replace(/^_+|_+$/g, '');
}

async function fetchOne(title) {
  const page = await apiGet('fr.wikipedia.org', {
    action: 'query', titles: title, prop: 'pageimages', piprop: 'original',
  });
  const pages = page.query && page.query.pages;
  const first = pages && Object.values(pages)[0];
  const imgUrl = first && first.original && first.original.source;
  if (!imgUrl) return { title, skipped: 'no free lead image on Wikipedia' };

  const filename = decodeURIComponent(imgUrl.split('/').pop());
  const meta = await apiGet('commons.wikimedia.org', {
    action: 'query', titles: `File:${filename}`, prop: 'imageinfo',
    iiprop: 'extmetadata|url',
  });
  const mpages = meta.query && meta.query.pages;
  const mfirst = mpages && Object.values(mpages)[0];
  const info = mfirst && mfirst.imageinfo && mfirst.imageinfo[0];
  const ext = (info && info.extmetadata) || {};

  return {
    title,
    filename,
    imgUrl,
    author: stripTags(ext.Artist && ext.Artist.value) || 'unknown',
    license: (ext.LicenseShortName && ext.LicenseShortName.value) || 'unknown',
    licenseUrl: (ext.LicenseUrl && ext.LicenseUrl.value) || '',
    commonsPage: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(filename)}`,
  };
}

async function download(url, destPath) {
  const res = await fetch(url, { headers: { 'User-Agent': USER_AGENT } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  fs.writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const manifest = [];
  for (const [category, names] of Object.entries(CATEGORIES)) {
    const dir = path.join(OUT_DIR, category);
    fs.mkdirSync(dir, { recursive: true });
    for (const title of names) {
      process.stdout.write(`Fetching ${title}... `);
      try {
        const result = await fetchOne(title);
        if (result.skipped) {
          console.log(`SKIPPED (${result.skipped})`);
          manifest.push({ category, title, skipped: result.skipped });
        } else {
          const ext = path.extname(result.filename) || '.jpg';
          const localFile = `${slugify(title)}${ext}`;
          await download(result.imgUrl, path.join(dir, localFile));
          manifest.push({ category, title, file: localFile, ...result });
          console.log('OK');
        }
      } catch (e) {
        console.log(`ERROR (${e.message})`);
        manifest.push({ category, title, error: e.message });
      }
      await new Promise((r) => setTimeout(r, 300)); // be polite to Wikimedia
    }
  }
  fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`\nDone. Photos + manifest.json are in: ${OUT_DIR}`);
  console.log('Zip that whole folder and send it back.');
}

main();
