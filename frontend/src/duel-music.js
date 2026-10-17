import SFX, { getAudioContext } from './sounds';

// Original score, "Quickstep": 108 BPM, Dm9 / Bbmaj7 / Fadd9 / Csus2.
// Eight composed bars, with a question-and-answer motif and a small turnaround.
// This uses no recordings or melody from QuizUp. Nothing plays on import.
const STEP_SECONDS = 60 / 108 / 4;
const PHRASE_STEPS = 16 * 8;
const LOOKAHEAD_SECONDS = 0.16;
const ROOTS = [38, 38, 34, 34, 41, 41, 36, 36];
const CHORDS = [
  [62, 65, 69, 76], [62, 65, 69, 76],
  [62, 65, 69, 70], [62, 65, 69, 70],
  [60, 65, 67, 69], [60, 65, 67, 69],
  [60, 62, 67, 74], [60, 62, 67, 74],
];
// One note at sixteenth positions 2, 7, 10, 14; rests leave room for reading.
const MELODY = [
  [74, 77, 76, 69], [72, 74, null, 69],
  [74, 77, 81, 77], [76, 74, null, 72],
  [72, 77, 79, 76], [72, 69, null, 67],
  [74, 79, 76, 74], [72, 67, 69, null],
];
const frequency = (midi) => 440 * Math.pow(2, (midi - 69) / 12);
const disconnect = (node) => { try { node.disconnect(); } catch { /* already released */ } };

/** A single duel-only transport. Muting, ads and hiding cancel all queued audio. */
export function createDuelMusic({
  getContext = getAudioContext,
  documentTarget = typeof document !== 'undefined' ? document : null,
  gestureTarget = typeof document !== 'undefined' ? document : null,
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  initialMuted = SFX.muted,
} = {}) {
  let active = false;
  let muted = initialMuted;
  let paused = false;
  let disposed = false;
  let listening = false;
  let context = null;
  let master = null;
  let timer = null;
  let generation = 0;
  let step = 0;
  let nextTime = 0;
  let noiseBuffer = null;
  let noiseContext = null;
  const voices = new Map();
  const gestureEvents = ['pointerdown', 'touchend', 'keydown'];
  const wanted = () => !disposed && active && !muted && !paused && !documentTarget?.hidden;

  function release(source) {
    const nodes = voices.get(source);
    if (!nodes) return;
    source.onended = null;
    nodes.forEach(disconnect);
    voices.delete(source);
  }

  function halt(keepContext = false) {
    generation += 1;
    if (timer !== null) clearIntervalFn(timer);
    timer = null;
    // Disconnect the bus first: future-start notes and release tails go silent
    // immediately, without suspending the shared SFX context.
    if (master) disconnect(master);
    master = null;
    voices.forEach((nodes, source) => {
      try { source.stop(context?.currentTime || 0); } catch { /* already ended */ }
      release(source);
    });
    if (!keepContext && context) {
      context.removeEventListener('statechange', onStateChange);
      context = null;
    }
  }

  function track(source, nodes, at, duration) {
    voices.set(source, nodes);
    source.onended = () => release(source);
    source.start(at);
    source.stop(at + duration + 0.015);
  }

  function synth(midi, at, duration, level, type = 'triangle', cutoff = 1800, attack = 0.008, sustain = 0) {
    const source = context.createOscillator();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    source.type = type;
    source.frequency.setValueAtTime(frequency(midi), at);
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, at);
    filter.frequency.exponentialRampToValueAtTime(Math.max(300, cutoff * 0.4), at + duration);
    filter.Q.value = 0.5;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(level, at + attack);
    if (sustain > attack) envelope.gain.setValueAtTime(level, at + sustain);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    envelope.gain.linearRampToValueAtTime(0, at + duration + 0.01);
    source.connect(filter).connect(envelope).connect(master);
    track(source, [source, filter, envelope], at, duration);
  }

  function kick(at) {
    const source = context.createOscillator();
    const envelope = context.createGain();
    source.frequency.setValueAtTime(125, at);
    source.frequency.exponentialRampToValueAtTime(48, at + 0.105);
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime(0.16, at + 0.004);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + 0.19);
    source.connect(envelope).connect(master);
    track(source, [source, envelope], at, 0.2);
  }

  function percussion(at, hat = false, soft = false) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    const envelope = context.createGain();
    const duration = hat ? 0.045 : 0.095;
    source.buffer = noiseBuffer;
    filter.type = hat ? 'highpass' : 'bandpass';
    filter.frequency.value = hat ? 6500 : 1700;
    filter.Q.value = hat ? 0.6 : 0.8;
    envelope.gain.setValueAtTime(0, at);
    envelope.gain.linearRampToValueAtTime((hat ? 0.026 : 0.065) * (soft ? 0.55 : 1), at + 0.003);
    envelope.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    source.connect(filter).connect(envelope).connect(master);
    track(source, [source, filter, envelope], at, duration);
  }

  function score(position, at) {
    const bar = Math.floor(position / 16);
    const beat = position % 16;
    const chord = CHORDS[bar];
    if (beat === 0) {
      // A soft chord bloom joins bar boundaries; the root pulse stays dry.
      chord.slice(0, 3).forEach(note => synth(note - 12, at, 2.45, 0.022, 'sine', 1100, 0.18, 1.5));
    }
    if ([0, 6, 8, 14].includes(beat)) {
      const note = ROOTS[bar] + (beat === 14 ? 12 : 0);
      synth(note, at, beat === 6 ? 0.2 : 0.34, 0.12, 'triangle', 500, 0.012);
    }
    const arp = [0, 3, 6, 9, 12].indexOf(beat);
    if (arp >= 0) {
      const note = chord[(arp + (bar % 2)) % 4];
      synth(note, at, 0.29, arp === 0 ? 0.055 : 0.043, 'triangle', 2200);
    }
    const motif = [2, 7, 10, 14].indexOf(beat);
    const melody = motif >= 0 ? MELODY[bar][motif] : null;
    if (melody !== null) {
      synth(melody, at, 0.42, 0.075, 'sine', 2600, 0.008, 0.045);
      // A quiet octave harmonic gives the lead a glassy edge without a buzzer.
      synth(melody + 12, at + 0.002, 0.19, 0.009, 'sine', 3200);
    }
    if (beat === 0 || beat === 8 || (bar % 2 === 1 && beat === 11)) kick(at);
    if (beat === 4 || beat === 12) {
      percussion(at);
      synth(54, at, 0.085, 0.037, 'sine', 800, 0.003);
    }
    if (beat % 4 === 2 || (bar === 7 && beat === 15)) percussion(at, true, beat === 6);
  }

  function begin() {
    if (timer !== null || !wanted() || context?.state !== 'running') return;
    master = context.createGain();
    master.gain.setValueAtTime(0, context.currentTime);
    master.gain.linearRampToValueAtTime(0.5, context.currentTime + 0.35);
    master.connect(context.destination);
    if (noiseContext !== context) {
      noiseContext = context;
      noiseBuffer = context.createBuffer(1, Math.ceil(context.sampleRate * 0.13), context.sampleRate);
      const samples = noiseBuffer.getChannelData(0);
      let seed = 9031;
      for (let i = 0; i < samples.length; i++) {
        seed = (seed * 16807) % 2147483647;
        samples[i] = (seed / 2147483647) * 2 - 1;
      }
    }
    step = 0;
    nextTime = context.currentTime + 0.025;
    const token = generation;
    const tick = () => {
      if (token !== generation || !wanted() || context?.state !== 'running') return;
      // A stalled tab never replays a backlog of percussion all at once.
      if (nextTime < context.currentTime) {
        const missed = Math.ceil((context.currentTime - nextTime) / STEP_SECONDS);
        nextTime += missed * STEP_SECONDS;
        step = (step + missed) % PHRASE_STEPS;
      }
      while (nextTime < context.currentTime + LOOKAHEAD_SECONDS) {
        score(step, nextTime);
        step = (step + 1) % PHRASE_STEPS;
        nextTime += STEP_SECONDS;
      }
    };
    tick();
    timer = setIntervalFn(tick, 40);
  }

  function reconcile() {
    if (!wanted()) { halt(); return; }
    if (timer !== null) return;
    let candidate;
    try { candidate = getContext(); } catch { return; }
    if (!candidate || candidate.state === 'closed') return;
    if (candidate !== context) {
      halt();
      context = candidate;
      context.addEventListener('statechange', onStateChange);
    }
    if (context.state === 'running') { begin(); return; }
    const token = generation;
    // Invoke resume synchronously in the gesture handler for iOS. A pending or
    // rejected resume has no authority to start a later/abandoned duel.
    try {
      context.resume().then(() => {
        if (token === generation && wanted() && candidate === context) begin();
      }).catch(() => {});
    } catch { /* unsupported or gesture blocked; retry on the next gesture */ }
  }

  function onStateChange() {
    if (context?.state === 'running') reconcile();
    else halt(true);
  }

  function updateListeners() {
    const shouldListen = active && !disposed;
    if (listening === shouldListen) return;
    listening = shouldListen;
    const method = listening ? 'addEventListener' : 'removeEventListener';
    documentTarget?.[method]('visibilitychange', reconcile);
    gestureEvents.forEach(event => gestureTarget?.[method](event, reconcile, true));
  }

  return {
    setActive(value) {
      if (disposed) return;
      active = Boolean(value);
      updateListeners();
      reconcile();
    },
    setMuted(value) { if (!disposed) { muted = Boolean(value); reconcile(); } },
    setPaused(value) { if (!disposed) { paused = Boolean(value); reconcile(); } },
    dispose() {
      disposed = true;
      active = false;
      updateListeners();
      halt();
      noiseBuffer = null;
      noiseContext = null;
    },
  };
}

const DuelMusic = createDuelMusic();
export default DuelMusic;
