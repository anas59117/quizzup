// Frame verified native captures in the approved continuous marketing artwork.
// Usage: node export-store-posters.cjs <native-captures-directory> <new-output-directory>
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
const { profiles } = require('./store-assets.cjs');
const source = path.resolve(process.argv[2] || 'ios/AppStoreMetadata/screenshots');
const output = path.resolve(process.argv[3] || 'ios/AppStoreMetadata/posters');
const manifest = JSON.parse(fs.readFileSync(path.join(source, 'manifest.json'), 'utf8'));
if (manifest.nativeViews !== true) throw Error('Real native simulator captures are required');
if (fs.existsSync(output)) throw Error('Preserve existing exports; choose a new output directory');
const template = fs.readFileSync(path.join(__dirname, '../AppStoreMetadata/store-panorama-template.html'), 'utf8');
const english = [
  ['Le grand retour', 'The big comeback'], ['LE GRAND<br><span>RETOUR.</span>', 'THE BIG<br><span>COMEBACK.</span>'],
  ['Les duels de quiz<br>reprennent.', 'Quiz duels<br>are back.'], ['Tes passions. Tes amis. Ta revanche.', 'Your passions. Your friends. Your rematch.'],
  ['LE PLAISIR DE SAVOIR. ENSEMBLE.', 'THE JOY OF KNOWING. TOGETHER.'], ['01 / LE FACE-À-FACE', '01 / FACE TO FACE'],
  ['Retrouve la compétition', 'The competition is back'], ['LE DUEL<br><em>REPREND.</em>', 'THE DUEL<br><em>IS BACK.</em>'],
  ['02 / LA QUESTION', '02 / THE QUESTION'], ['Fais parler tes connaissances', 'Put your knowledge to the test'],
  ['10 SECONDES.<br><em>À TOI DE JOUER.</em>', '10 SECONDS.<br><em>YOUR MOVE.</em>'],
  ['03 / LE DÉCLIC', '03 / THE MOMENT'], ['La bonne réponse. Le bon réflexe.', 'The right answer. The right instinct.'],
  ['CHAQUE<br>RÉPONSE <em>COMPTE.</em>', 'EVERY<br>ANSWER <em>COUNTS.</em>'],
  ['04 / LA REVANCHE', '04 / THE REMATCH'], ['La rivalité continue', 'The rivalry continues'], ['ENCORE<br><em>UNE PARTIE ?</em>', 'ONE MORE<br><em>ROUND?</em>'],
];

(async () => {
  fs.mkdirSync(output, { recursive: true });
  const browser = await chromium.launch({ headless: true, ...(process.env.EDGE_PATH ? { executablePath: process.env.EDGE_PATH } : {}) });
  const files = [];
  try {
    for (const language of ['fr', 'en']) {
      let html = template;
      if (language === 'en') for (const [before, after] of english) html = html.replaceAll(before, after);
      for (const screen of ['faceoff', 'question', 'answer', 'result']) {
        const capture = manifest.captures.find(c => c.language === language && c.profile === profiles[0].key && c.screen === screen);
        if (!capture) throw Error(`Missing native capture ${language}/${screen}`);
        const image = fs.readFileSync(path.join(source, capture.path));
        if (crypto.createHash('sha256').update(image).digest('hex') !== capture.sha256) throw Error(`Changed capture ${capture.path}`);
        html = html.replace(`__CAPTURE_${screen}__`, 'data:image/jpeg;base64,' + image.toString('base64'));
      }
      const page = await browser.newPage({ viewport: { width: 6450, height: 2796 }, deviceScaleFactor: 1 });
      await page.setContent(html, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const panorama = await page.screenshot();
      await page.close();
      await sharp(panorama).resize(2150, 932).png().toFile(path.join(output, `${language}-preview.png`));
      for (const profile of profiles.slice(0, 2)) {
        for (let index = 0; index < 5; index++) {
          const relative = `${language}/${profile.width}x${profile.height}/${String(index + 1).padStart(2, '0')}.png`;
          const filename = path.join(output, relative);
          fs.mkdirSync(path.dirname(filename), { recursive: true });
          await sharp(panorama).extract({ left: index * 1290, top: 0, width: 1290, height: 2796 })
            .resize(profile.width, profile.height).flatten({ background: '#bd1235' }).removeAlpha().png().toFile(filename);
          const meta = await sharp(filename).metadata();
          if (meta.width !== profile.width || meta.height !== profile.height || meta.hasAlpha) throw Error('Invalid export ' + relative);
          files.push({ path: relative, width: meta.width, height: meta.height, alpha: meta.hasAlpha });
        }
      }
    }
  } finally { await browser.close(); }
  fs.writeFileSync(path.join(output, 'verification.json'), JSON.stringify({ nativeCommit: manifest.commit, nativeCaptureDate: manifest.capturedAt, marketingFraming: true, submittedToApple: false, files }, null, 2));
  console.log(`Verified ${files.length} French/English posters from genuine native captures: ${output}`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
