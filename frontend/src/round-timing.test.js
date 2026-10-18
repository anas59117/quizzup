import { anchorQuestion, roundTiming } from './round-timing';

const packet = { timeLimit: 10, readingMs: 1500, answerStaggerMs: 100, answerEnterMs: 250,
  presentationElapsedMs: 0, answerOpensInMs: 2050, remainingMs: 10000 };
test('reading and answer arrival consume none of the answer countdown', () => {
  const q = anchorQuestion(packet, 100);
  expect(roundTiming(q, 1500)).toMatchObject({ phase: 'reading', canAnswer: false, timeLeft: 10 });
  expect(roundTiming(q, 1700)).toMatchObject({ phase: 'arriving', canAnswer: false, timeLeft: 10 });
  expect(roundTiming(q, 2150)).toMatchObject({ phase: 'answering', canAnswer: true, timeLeft: 10 });
  expect(roundTiming(q, 3151).timeLeft).toBe(9);
});
test('reconnect uses elapsed presentation and remaining answer time', () => {
  const reading = anchorQuestion({ ...packet, presentationElapsedMs: 1000, answerOpensInMs: 1050 }, 100);
  expect(roundTiming(reading, 100).answerDelaysMs).toEqual([500, 600, 700, 800]);
  const active = anchorQuestion({ ...packet, presentationElapsedMs: 5050, answerOpensInMs: 0, remainingMs: 7000 }, 100);
  expect(roundTiming(active, 1100)).toMatchObject({ canAnswer: true, timeLeft: 6, answerDelaysMs: [0, 0, 0, 0] });
  expect(roundTiming(active, 7100)).toMatchObject({ canAnswer: false, timeLeft: 0 });
});
test('legacy servers and already expired questions stay usable without a new pause', () => {
  expect(roundTiming(anchorQuestion({ timeLimit: 10 }, 0), 0).canAnswer).toBe(true);
  expect(roundTiming(anchorQuestion({ ...packet, expired: true }, 0), 3000).canAnswer).toBe(false);
});
