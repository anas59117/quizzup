import { createDuelMusic } from './duel-music';

// Web Audio is not implemented by jsdom. This small clocked fake keeps source
// lifetimes and connections so these tests can catch audible leaks and stacking.
function audioHarness(initialState = 'running') {
  const listeners = new Map();
  const parameter = () => ({ value: 0, setValueAtTime(value) { this.value = value; }, linearRampToValueAtTime() {},
    exponentialRampToValueAtTime() {}, cancelScheduledValues() {}, setTargetAtTime() {} });
  const nodes = [];
  const context = {
    state: initialState, currentTime: 0, sampleRate: 24000, destination: {},
    resume: jest.fn(() => Promise.resolve()),
    addEventListener(event, fn) { listeners.set(event, fn); },
    removeEventListener(event, fn) { if (listeners.get(event) === fn) listeners.delete(event); },
    createGain() { return node({ gain: parameter() }); },
    createBiquadFilter() { return node({ frequency: parameter(), Q: parameter() }); },
    createOscillator() { return source({ frequency: parameter(), detune: parameter() }); },
    createBufferSource() { return source({ playbackRate: parameter() }); },
    createBuffer(channels, length) { return { getChannelData: () => new Float32Array(length) }; },
  };
  function node(extra) {
    const result = { ...extra, connected: false,
      connect(target) { this.connected = true; return target; },
      disconnect() { this.connected = false; } };
    nodes.push(result);
    return result;
  }
  function source(extra) {
    return node({ ...extra, start(at) { this.startedAt = at; },
      stop(at) { this.stoppedAt = at; }, onended: null });
  }
  const documentTarget = new EventTarget();
  documentTarget.hidden = false;
  const timers = new Map();
  let id = 0;
  const engine = createDuelMusic({ getContext: () => context, documentTarget,
    gestureTarget: documentTarget, initialMuted: false,
    setIntervalFn: (fn) => { timers.set(++id, fn); return id; },
    clearIntervalFn: (timer) => timers.delete(timer),
  });
  function advance(seconds) {
    const finish = context.currentTime + seconds;
    while (context.currentTime < finish) {
      context.currentTime = Math.min(finish, context.currentTime + 0.025);
      nodes.filter(n => n.onended && n.stoppedAt <= context.currentTime)
        .forEach(n => { const ended = n.onended; n.onended = null; ended(); });
      [...timers.values()].forEach(fn => fn());
    }
  }
  return { engine, context, documentTarget, timers, nodes, advance,
    sources: () => nodes.filter(n => n.startedAt !== undefined),
    statechange: (state) => { context.state = state; listeners.get('statechange')?.(); },
  };
}

test('starts only for an active unmuted duel, with one scheduler across repeated activation', () => {
  const h = audioHarness();
  expect(h.sources()).toHaveLength(0);
  h.engine.setMuted(true);
  h.engine.setActive(true);
  expect(h.sources()).toHaveLength(0);
  h.engine.setMuted(false);
  expect(h.sources().length).toBeGreaterThan(0);
  const count = h.sources().length;
  h.engine.setActive(true);
  h.engine.setMuted(false);
  expect(h.sources()).toHaveLength(count);
  expect(h.timers.size).toBe(1);
  h.engine.dispose();
});

test.each(['setActive', 'setMuted', 'setPaused'])('%s cancels queued notes and disconnects every voice', (method) => {
  const h = audioHarness();
  h.engine.setActive(true);
  h.advance(0.5);
  const staleTick = [...h.timers.values()][0];
  h.engine[method](method === 'setActive' ? false : true);
  const count = h.sources().length;
  staleTick();
  h.advance(1);
  expect(h.sources()).toHaveLength(count);
  expect(h.nodes.filter(n => n.connected)).toHaveLength(0);
  expect(h.sources().every(n => n.stoppedAt <= h.context.currentTime)).toBe(true);
  expect(h.timers.size).toBe(0);
  h.engine.dispose();
});

test('hides and resumes a duel without allowing visibility to restart a departed duel', () => {
  const h = audioHarness();
  h.engine.setActive(true);
  h.documentTarget.hidden = true;
  h.documentTarget.dispatchEvent(new Event('visibilitychange'));
  expect(h.timers.size).toBe(0);
  expect(h.nodes.filter(n => n.connected)).toHaveLength(0);
  h.documentTarget.hidden = false;
  h.documentTarget.dispatchEvent(new Event('visibilitychange'));
  expect(h.timers.size).toBe(1);
  h.engine.setActive(false);
  h.documentTarget.dispatchEvent(new Event('visibilitychange'));
  expect(h.timers.size).toBe(0);
  h.engine.dispose();
});

test.each(['leave', 'mute', 'ad', 'dispose'])('an autoplay resume that resolves after %s cannot resurrect playback', async (reason) => {
  const h = audioHarness('suspended');
  let resolve;
  h.context.resume.mockImplementation(() => new Promise(r => { resolve = r; }));
  h.engine.setActive(true);
  expect(h.sources()).toHaveLength(0);
  if (reason === 'leave') h.engine.setActive(false);
  if (reason === 'mute') h.engine.setMuted(true);
  if (reason === 'ad') h.engine.setPaused(true);
  if (reason === 'dispose') h.engine.dispose();
  h.context.state = 'running';
  resolve();
  await Promise.resolve();
  expect(h.sources()).toHaveLength(0);
  expect(h.timers.size).toBe(0);
  h.engine.dispose();
});

test('a gesture retries rejected autoplay and context interruption recovers only while active', async () => {
  const h = audioHarness('suspended');
  h.context.resume.mockRejectedValueOnce(new Error('gesture required'));
  h.engine.setActive(true);
  await Promise.resolve();
  await Promise.resolve();
  h.context.resume.mockImplementation(() => { h.context.state = 'running'; return Promise.resolve(); });
  h.documentTarget.dispatchEvent(new Event('pointerdown'));
  await Promise.resolve();
  expect(h.timers.size).toBe(1);
  h.statechange('interrupted');
  expect(h.nodes.filter(n => n.connected)).toHaveLength(0);
  h.statechange('running');
  expect(h.timers.size).toBe(1);
  h.engine.dispose();
  h.documentTarget.dispatchEvent(new Event('pointerdown'));
  h.engine.setActive(true);
  h.statechange('running');
  expect(h.timers.size).toBe(0);
});

test('loops a complete phrase without a growing graph or a catch-up burst after a delayed tick', () => {
  const h = audioHarness();
  h.engine.setActive(true);
  h.advance(70);
  expect(h.sources().length).toBeGreaterThan(300);
  expect(h.nodes.filter(n => n.connected).length).toBeLessThan(80);
  const count = h.sources().length;
  h.context.currentTime += 120;
  [...h.timers.values()].forEach(fn => fn());
  expect(h.sources().length - count).toBeLessThan(20);
  expect(h.sources().slice(count).every(n => n.startedAt >= h.context.currentTime)).toBe(true);
  h.engine.dispose();
  expect(h.nodes.filter(n => n.connected)).toHaveLength(0);
});

test('the next eight-bar phrase repeats the musical events at the same cadence', () => {
  const h = audioHarness();
  h.engine.setActive(true);
  h.advance(36);
  const phrase = 160 / 9; // 32 beats at 108 BPM, in seconds.
  const events = loop => h.sources().filter(n => n.startedAt >= 0.025 + loop * phrase - 0.00001
      && n.startedAt < 0.025 + (loop + 1) * phrase - 0.00001)
    .map(n => [Math.round((n.startedAt - 0.025 - loop * phrase) * 1000), n.type || 'noise', n.frequency?.value]);
  expect(events(0).length).toBeGreaterThan(150);
  expect(events(1)).toEqual(events(0));
  h.engine.dispose();
});

test('missing Web Audio support and a closed context remain silent without throwing', () => {
  const engine = createDuelMusic({ getContext: () => null });
  expect(() => { engine.setActive(true); engine.setMuted(false); engine.dispose(); }).not.toThrow();
  const h = audioHarness('closed');
  h.engine.setActive(true);
  expect(h.sources()).toHaveLength(0);
  expect(h.context.resume).not.toHaveBeenCalled();
  h.engine.dispose();
});
