// Browser proof and optional audition; no network, backend or audio assets used.
// node scripts/duel-music-check.cjs [output.wav]
const assert = require('assert/strict');
const fs = require('fs');
const path = require('path');
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'C:/Users/User/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: process.env.EDGE_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    headless: true,
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.route('https://duel-audio.invalid/**', route => {
      const name = new URL(route.request().url()).pathname;
      if (name === '/') return route.fulfill({ contentType: 'text/html', body:
        '<script type="module">import music, {createDuelMusic} from "./duel-music.js"; window.music=music; window.createDuelMusic=createDuelMusic;</script>' });
      const source = fs.readFileSync(path.resolve(__dirname, '../src', name.slice(1)), 'utf8');
      return route.fulfill({ contentType: 'text/javascript', body: source.replace("from './sounds'", "from './sounds.js'") });
    });
    await page.goto('https://duel-audio.invalid/');
    await page.waitForFunction(() => typeof window.createDuelMusic === 'function');
    const result = await page.evaluate(async () => {
      const sampleRate = 24000;
      const phraseSeconds = 60 / 108 * 32;
      const duration = phraseSeconds * 3 + 0.25;
      const offline = new OfflineAudioContext(1, Math.ceil(sampleRate * duration), sampleRate);
      let cursor = 0;
      let tick;
      const proxy = new Proxy(offline, { get(target, property) {
        if (property === 'currentTime') return cursor;
        if (property === 'state') return 'running';
        const value = target[property];
        return typeof value === 'function' ? value.bind(target) : value;
      } });
      const engine = window.createDuelMusic({ getContext: () => proxy, initialMuted: false,
        documentTarget: null, gestureTarget: null,
        setIntervalFn: fn => { tick = fn; return 1; }, clearIntervalFn: () => {},
      });
      engine.setActive(true);
      while (cursor < duration) { cursor += 0.04; tick(); }
      const buffer = await offline.startRendering();
      engine.dispose();
      const samples = buffer.getChannelData(0);
      let peak = 0;
      let energy = 0;
      let minBlockRms = 1;
      let minBlockAt = 0;
      let maxBoundaryJump = 0;
      for (let i = 0; i < samples.length; i++) {
        peak = Math.max(peak, Math.abs(samples[i]));
        energy += samples[i] * samples[i];
      }
      for (let start = sampleRate; start < samples.length - 2400; start += 2400) {
        let power = 0;
        for (let i = start; i < start + 2400; i++) power += samples[i] * samples[i];
        const blockRms = Math.sqrt(power / 2400);
        if (blockRms < minBlockRms) { minBlockRms = blockRms; minBlockAt = start / sampleRate; }
      }
      // Check the join itself for clicks. Fractional sample starts and filtered
      // noise need not be bit-identical across musically identical phrases.
      for (const loop of [1, 2]) {
        const boundary = Math.round((0.025 + phraseSeconds * loop) * sampleRate);
        for (let i = boundary - 120; i < boundary + 120; i++) {
          maxBoundaryJump = Math.max(maxBoundaryJump, Math.abs(samples[i] - samples[i - 1]));
        }
      }
      const pcm = new Int16Array(samples.length);
      for (let i = 0; i < samples.length; i++) pcm[i] = Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767);
      const bytes = new Uint8Array(pcm.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      return { sampleRate, duration, peak, rms: Math.sqrt(energy / samples.length), minBlockRms, minBlockAt,
        maxBoundaryJump, pcmBase64: btoa(binary) };
    });
    const { pcmBase64, ...metrics } = result;
    console.log('Original duel score browser metrics', JSON.stringify(metrics));
    assert.deepEqual(errors, [], 'Browser audio graph errors');
    assert(result.peak > 0.03 && result.peak < 0.5, `Unexpected mix peak ${result.peak}`);
    assert(result.rms > 0.008 && result.rms < 0.12, `Unexpected mix loudness ${result.rms}`);
    assert(result.minBlockRms > 0.0005, `Gap in looping score ${result.minBlockRms}`);
    assert(result.maxBoundaryJump < 0.03, `Click at phrase wrap ${result.maxBoundaryJump}`);
    if (process.argv[2]) {
      const pcm = Buffer.from(pcmBase64, 'base64');
      const header = Buffer.alloc(44);
      header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
      header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
      header.writeUInt32LE(result.sampleRate, 24); header.writeUInt32LE(result.sampleRate * 2, 28);
      header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36);
      header.writeUInt32LE(pcm.length, 40);
      fs.mkdirSync(path.dirname(path.resolve(process.argv[2])), { recursive: true });
      fs.writeFileSync(process.argv[2], Buffer.concat([header, pcm]));
    }
    console.log('PASS original duel score browser render', JSON.stringify(metrics));
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
