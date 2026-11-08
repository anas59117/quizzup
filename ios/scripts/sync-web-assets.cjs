// Manual preparation only. Reuses the reviewed web catalogue and artwork;
// native runtime never evaluates JavaScript and adds no web dependency.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const root = path.resolve(__dirname, '../..');
const frontend = path.join(root, 'frontend');
const webpack = require(path.join(frontend, 'node_modules/webpack'));
const sharp = require(process.env.SHARP_PATH || 'sharp');
const temporary = fs.mkdtempSync(path.join(os.tmpdir(), 'quizzup-native-catalog-'));
const resources = path.join(root, 'ios/Sources/QuizzUp/Resources');
const assets = path.join(resources, 'Assets.xcassets');

async function imageSet(name, image, extension) {
  const directory = path.join(assets, name + '.imageset');
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, name + '.' + extension), image);
  fs.writeFileSync(path.join(directory, 'Contents.json'), JSON.stringify({ images: [{ idiom: 'universal', filename: name + '.' + extension }], info: { author: 'xcode', version: 1 } }, null, 2) + '\n');
}

webpack({ mode: 'production', target: 'node', context: frontend,
  entry: './scripts/native-catalog.entry.js', output: { path: temporary, filename: 'catalog.cjs', library: { type: 'commonjs2' } },
  module: { rules: [
    { test: /\.js$/, exclude: /node_modules/, use: { loader: require.resolve(path.join(frontend, 'node_modules/babel-loader')), options: { babelrc: false, configFile: false, presets: [[require.resolve(path.join(frontend, 'node_modules/@babel/preset-react')), { runtime: 'automatic' }]] } } },
    { test: /\.css$/, type: 'asset/source' }, { test: /\.png$/, type: 'asset/resource' },
  ] } }, async (error, stats) => {
    try {
      if (error || stats.hasErrors()) throw error || Error(stats.toString({ all: false, errors: true }));
      const catalogue = require(path.join(temporary, 'catalog.cjs')).default;
      const featured = ['spider_man', 'harry_potter', 'minecraft', 'rap_fr', 'ligue_champions', 'marvel', 'one_piece', 'pokemon'];
      for (const key of featured) {
        const entry = catalogue[key];
        if (entry?.src?.startsWith('/images/')) {
          const image = await sharp(path.join(frontend, 'public', entry.src)).resize(640, 640, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
          entry.assetName = 'topic-' + key;
          await imageSet(entry.assetName, image, 'jpg');
        }
      }
      fs.writeFileSync(path.join(resources, 'topic-catalog.json'), JSON.stringify(catalogue, null, 2) + '\n');
      const sprite = path.join(frontend, 'src/assets/avatars-v2.png');
      const metadata = await sharp(sprite).metadata();
      const ids = ['fox', 'robot', 'brain', 'astronaut', 'ninja', 'dragon', 'cat', 'owl', 'ghost', 'lion'];
      for (let index = 0; index < ids.length; index++) {
        const x = index % 5, y = Math.floor(index / 5);
        const left = Math.round(x * metadata.width / 5), top = Math.round(y * metadata.height / 2);
        const width = Math.round((x + 1) * metadata.width / 5) - left;
        const height = Math.round((y + 1) * metadata.height / 2) - top;
        const image = await sharp(sprite).extract({ left, top, width, height }).resize(256, 256).png().toBuffer();
        await imageSet('avatar-' + ids[index], image, 'png');
      }
      console.log(`Synced ${Object.keys(catalogue).length} topics, local featured art and ten native avatar images`);
    } catch (error) { console.error(error.message); process.exitCode = 1; }
  });
