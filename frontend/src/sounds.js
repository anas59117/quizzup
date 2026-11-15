let _ctx = null;
let _muted = false;
let _unlocked = false;

try {
  _muted = localStorage.getItem('quizzup-muted') === '1';
} catch { /* ignore */ }

const ctx = () => {
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch { return null; }
  }
  // Mobile Safari and Chrome require a user gesture to unlock audio.
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
};

// The duel score shares the gesture-unlocked SFX context on mobile browsers.
export { ctx as getAudioContext };

// Unlock AudioContext on the first user interaction (tap/click/key). Mobile
// browsers block audio until a gesture-driven resume — this one-time handler
// ensures it fires even if the player taps before any SFX function runs.
function unlockAudio() {
  if (_unlocked) return;
  const ac = ctx();
  if (!ac) return;
  if (ac.state === 'running') { _unlocked = true; return; }
  ac.resume().then(() => { _unlocked = true; }).catch(() => {});
}

if (typeof window !== 'undefined') {
  const events = ['touchstart', 'touchend', 'mousedown', 'keydown'];
  const handler = () => {
    unlockAudio();
    if (_unlocked) events.forEach((e) => document.removeEventListener(e, handler, true));
  };
  events.forEach((e) => document.addEventListener(e, handler, { capture: true, passive: true }));
}

function tone(freq, duration, type = 'sine', gain = 0.15, ramp = 0.02) {
  const ac = ctx();
  if (!ac || _muted) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + ramp);
  g.gain.linearRampToValueAtTime(0, ac.currentTime + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime);
  osc.stop(ac.currentTime + duration + 0.01);
}

let wrongBuffer = null;
function wrongAnswerTone() {
  const ac = ctx();
  if (!ac || _muted) return;
  if (!wrongBuffer) {
    const rate = 44100;
    wrongBuffer = ac.createBuffer(1, Math.round(rate * 0.26), rate);
    const data = wrongBuffer.getChannelData(0);
    let peak = 0;
    for (let i = 0; i < data.length; i++) {
      const t = i / rate;
      let value = 0;
      for (const [start, frequency, amplitude] of [[0, 587.33, 1], [0.105, 493.88, 0.9]]) {
        const u = t - start, length = 0.155;
        if (u < 0 || u >= length) continue;
        const envelope = (1 - Math.exp(-u / 0.004)) ** 2 * Math.exp(-u / 0.055) * Math.min(1, (length - u) / 0.025) ** 2;
        const phase = 2 * Math.PI * frequency * u;
        value += amplitude * envelope * (Math.sin(phase) + 0.14 * Math.sin(2 * phase));
      }
      data[i] = value;
      peak = Math.max(peak, Math.abs(value));
    }
    for (let i = 0; i < data.length; i++) data[i] *= 0.23 / peak;
  }
  const src = ac.createBufferSource();
  src.buffer = wrongBuffer;
  src.connect(ac.destination);
  src.start();
}

const SFX = {
  tap() { tone(800, 0.06, 'sine', 0.1, 0.005); },
  select() {
    tone(520, 0.08, 'sine', 0.12, 0.005);
    setTimeout(() => tone(780, 0.08, 'sine', 0.12, 0.005), 50);
  },
  tick(urgent) {
    if (urgent) tone(880, 0.05, 'square', 0.06, 0.003);
    else tone(600, 0.04, 'sine', 0.04, 0.003);
  },
  countdownBeep() { tone(1000, 0.12, 'square', 0.1, 0.005); },
  correct() {
    tone(523, 0.12, 'sine', 0.15, 0.01);
    setTimeout(() => tone(659, 0.12, 'sine', 0.15, 0.01), 80);
    setTimeout(() => tone(784, 0.18, 'sine', 0.18, 0.01), 160);
  },
  wrong() {
    wrongAnswerTone();
  },
  timeUp() {
    tone(440, 0.15, 'triangle', 0.1, 0.01);
    setTimeout(() => tone(330, 0.25, 'triangle', 0.1, 0.01), 150);
  },
  roundIntro() {
    if (!ctx() || _muted) return;
    [392, 440, 494, 523].forEach((f, i) => {
      setTimeout(() => tone(f, 0.1, 'sine', 0.08, 0.01), i * 90);
    });
  },
  bonusIntro() {
    if (!ctx() || _muted) return;
    [523, 587, 659, 784, 880].forEach((f, i) => {
      setTimeout(() => tone(f, 0.12, 'triangle', 0.1, 0.01), i * 70);
    });
  },
  victory() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => setTimeout(() => tone(f, 0.2, 'sine', 0.15, 0.01), i * 120));
    setTimeout(() => {
      tone(784, 0.3, 'sine', 0.12, 0.01);
      tone(1047, 0.4, 'sine', 0.15, 0.01);
    }, notes.length * 120 + 100);
  },
  defeat() {
    [392, 370, 330, 294].forEach((f, i) => {
      setTimeout(() => tone(f, 0.22, 'sine', 0.1, 0.015), i * 150);
    });
  },
  tie() {
    [440, 523, 440, 523].forEach((f, i) => {
      setTimeout(() => tone(f, 0.15, 'triangle', 0.1, 0.01), i * 120);
    });
  },
  gameStart() {
    [262, 330, 392, 523].forEach((f, i) => {
      setTimeout(() => tone(f, 0.1, 'sine', 0.12, 0.008), i * 80);
    });
  },
  get muted() { return _muted; },
  toggle() {
    _muted = !_muted;
    try { localStorage.setItem('quizzup-muted', _muted ? '1' : '0'); } catch { /* ignore */ }
    return _muted;
  },
};

export default SFX;
