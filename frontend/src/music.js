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

let current = null; // { key, audio }

function fadeTo(audio, target, ms) {
  const start = audio.volume;
  const startTime = performance.now();
  function step(now) {
    const t = Math.min(1, (now - startTime) / ms);
    // Clamp: overlapping fades on the same element (rapid track switches)
    // can compound floating-point drift past 0/1, which throws a RangeError.
    audio.volume = Math.max(0, Math.min(1, start + (target - start) * t));
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// Browsers block audio.play() until a user gesture. The screen-switch that
// first calls play() is usually itself gesture-driven (e.g. tapping
// Continue), but if that attempt is still rejected, retry once on the next
// tap/click anywhere on the page instead of staying silent for the session.
function retryOnNextGesture(audio) {
  const retry = () => {
    audio.play().catch(() => {});
    document.removeEventListener('pointerdown', retry, true);
  };
  document.addEventListener('pointerdown', retry, { capture: true, once: true });
}

function play(key, { loop = true } = {}) {
  if (!TRACKS[key]) return;
  if (current && current.key === key) return; // already playing

  const prev = current;
  const audio = new Audio(TRACKS[key]);
  audio.loop = loop;
  audio.volume = 0;
  audio.muted = SFX.muted;
  current = { key, audio };
  audio.play().catch(() => retryOnNextGesture(audio));
  fadeTo(audio, VOLUME, FADE_MS);

  if (prev) {
    fadeTo(prev.audio, 0, FADE_MS);
    setTimeout(() => { prev.audio.pause(); prev.audio.src = ''; }, FADE_MS + 50);
  }
}

function stop() {
  if (!current) return;
  const { audio } = current;
  fadeTo(audio, 0, FADE_MS);
  setTimeout(() => { audio.pause(); audio.src = ''; }, FADE_MS + 50);
  current = null;
}

function setMuted(muted) {
  if (current) current.audio.muted = muted;
}

export default { play, stop, setMuted };
