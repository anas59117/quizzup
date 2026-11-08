// Manual release step: use the website's approved circular lightning symbol.
// SHARP_PATH can point to an existing tool runtime; no app dependency is added.
const fs = require('node:fs');
const path = require('node:path');
const sharp = require(process.env.SHARP_PATH || 'sharp');
const { validatePng } = require('./store-assets.cjs');

(async () => {
  const root = path.resolve(__dirname, '../..');
  const source = path.join(root, 'frontend/public/brand-app-icon.svg');
  const target = path.join(root, 'ios/Sources/QuizzUp/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png');
  // The SVG has rounded transparent outer corners for the web. Filling them
  // with the same brand red gives iOS its required opaque square source.
  const image = await sharp(fs.readFileSync(source)).resize(1024, 1024)
    .flatten({ background: '#bd1235' }).removeAlpha().png().toBuffer();
  validatePng(image, 1024, 1024, true);
  fs.writeFileSync(target, image);
  console.log('Generated opaque RGB 1024x1024 iOS icon from the approved web brand asset');
})().catch(error => { console.error(error.message); process.exitCode = 1; });
