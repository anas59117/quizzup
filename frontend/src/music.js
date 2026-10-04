import SFX from './sounds';

// Original royalty-free tracks (Pixabay content license), not the copyrighted
// soundtrack from the original QuizUp — see project notes. One per game
// context, cross-faded on switch so changes never feel abrupt.
const TRACKS = {
  menu: '/audio/menu-quiz-master.mp3',
  lobby: '/audio/lobby-tv-show.mp3',
  thinking: '/audio/question-thinking-timer.mp3',
  urgent: '/audio/question-urgent-loop.mp3',
  transition: '/audio/round-transition.mp3',
};

const VOLUME = 0.35;
const FADE_MS = 450;

// One <audio> element per track, created on first use and reused for the
// whole session. Re-creating the element (or clearing its src) on every
// switch made the browser download the same file again each round.
const elements = new Map(); // key -> HTMLAudioElement
const fades = new Map(); // audio -> fade token (latest fade wins)
const pauseTimers = new Map(); // audio -> pending pause timeout

let current = null; // { key, audio }

function getAudio(key) {
  let audio = elements.get(key);
  if (!audio) {
    audio = new Audio();
    audio.preload = key === 'menu' ? 'auto' : 'none';
    audio.src = TRACKS[key];
    elements.set(key, audio);
  }
  return audio;
}

function fadeTo(audio, target, ms) {
  const token = {};
  fades.set(audio, token);
  const start = audio.volume;
  const startTime = performance.now();
  function step(now) {
    if (fades.get(audio) !== token) return; // a newer fade took over
    const t = Math.min(1, (now - startTime) / ms);
    // Clamp: floating-point drift past 0/1 throws a RangeError.
    audio.volume = Math.max(0, Math.min(1, start + (target - start) * t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function cancelPause(audio) {
  const timer = pauseTimers.get(audio);
  if (timer) {
    clearTimeout(timer);
    pauseTimers.delete(audio);
  }
}

function fadeOutAndPause(audio) {
  fadeTo(audio, 0, FADE_MS);
  cancelPause(audio);
  pauseTimers.set(audio, setTimeout(() => {
    pauseTimers.delete(audio);
    audio.pause();
  }, FADE_MS + 50));
}

// Browsers block audio.play() until a user gesture. The screen-switch that
// first calls play() is usually itself gesture-driven (e.g. tapping
// Continue), but if that attempt is still rejected, retry once on the next
// tap/click anywhere on the page instead of staying silent for the session.
function retryOnNextGesture(audio) {
  const retry = () => {
    if (current && current.audio === audio) audio.play().catch(() => {});
    document.removeEventListener('pointerdown', retry, true);
  };
  document.addEventListener('pointerdown', retry, { capture: true, once: true });
}

function play(key, { loop = true } = {}) {
  if (!TRACKS[key]) return;
  if (current && current.key === key) return; // already playing

  const prev = current;
  const audio = getAudio(key);
  cancelPause(audio);
  audio.loop = loop;
  audio.muted = SFX.muted;
  audio.volume = 0;
  try { audio.currentTime = 0; } catch (e) { /* not seekable yet */ }
  current = { key, audio };
  audio.play().catch(() => retryOnNextGesture(audio));
  fadeTo(audio, VOLUME, FADE_MS);

  if (prev && prev.audio !== audio) fadeOutAndPause(prev.audio);
}

function stop() {
  if (!current) return;
  fadeOutAndPause(current.audio);
  current = null;
}

function setMuted(muted) {
  elements.forEach((audio) => { audio.muted = muted; });
}

export default { play, stop, setMuted };
