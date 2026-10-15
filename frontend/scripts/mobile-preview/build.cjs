const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const root = path.resolve(__dirname, '../..');
const out = path.join(root, '.mobile-preview');
webpack({ mode: 'development', context: root, entry: './scripts/mobile-preview/entry.js',
  output: { path: out, filename: 'preview.js' }, devtool: false,
  plugins: [new webpack.DefinePlugin({
    'process.env': JSON.stringify({ NODE_ENV: 'development', REACT_APP_API_URL: 'http://127.0.0.1:3003', REACT_APP_WS_URL: 'ws://127.0.0.1:3003/ws' }),
  })],
  module: { rules: [{ test: /\.js$/, exclude: /node_modules/, use: {
    loader: require.resolve('babel-loader'), options: { babelrc: false, configFile: false, presets: [[require.resolve('@babel/preset-react'), { runtime: 'automatic' }]] }
  } }, { test: /\.png$/, type: 'asset/resource' }, { test: /\.css$/, type: 'asset/source' }] },
}, (err, stats) => {
  if (err || stats.hasErrors()) { console.error(err || stats.toString({ all: false, errors: true })); process.exitCode = 1; return; }
  fs.writeFileSync(path.join(out, 'index.html'), '<!doctype html><html lang="fr"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"><title>QuizzUp — aperçu des corrections mobiles</title>' +
    ['design-tokens.css','App.css','design-system.css','design-v4.css','mobile-comfort.css','player-avatar.css','shop-art.css','duel-premium.css','match-presentation.css'].map(f => `<link rel="stylesheet" href="/src/${f}">`).join('') + '<body><div id="root"></div><script src="/preview.js"></script></body></html>');
  console.log('Mobile preview built');
});
