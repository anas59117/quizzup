import { useEffect, useMemo, useState } from 'react';

const positive = (value, fallback = 0) => Number.isFinite(value) ? Math.max(0, value) : fallback;

// Anchor once to a monotonic client clock. Neither acknowledgments nor React
// rerenders are allowed to restart the server's presentation/answer budget.
export function anchorQuestion(packet, now = performance.now()) {
  return { ...packet, receivedAt: now };
}

export function roundTiming(question, now = performance.now()) {
  const sinceReceipt = positive(now - question.receivedAt);
  const opening = positive(question.answerOpensInMs);
  const presentationElapsed = positive(question.presentationElapsedMs) + sinceReceipt;
  const remaining = positive(question.remainingMs, positive(question.timeLimit, 10) * 1000)
    - Math.max(0, sinceReceipt - opening);
  const opensIn = Math.max(0, opening - sinceReceipt);
  const readingMs = positive(question.readingMs);
  const answerDelaysMs = Array.from({ length: question.answers?.length || 4 }, (_, index) =>
    Math.max(0, readingMs + index * positive(question.answerStaggerMs) - presentationElapsed));
  return { opensIn, presentationElapsed, answerDelaysMs,
    timeLeft: Math.max(0, Math.ceil(remaining / 1000)),
    canAnswer: !question.expired && opensIn === 0 && remaining > 0,
    phase: presentationElapsed < readingMs ? 'reading' : opensIn > 0 ? 'arriving' : 'answering' };
}

export function useRoundTiming(question, running = true) {
  const anchored = useMemo(() => question
    ? Number.isFinite(question.receivedAt) ? question : anchorQuestion(question)
    : null, [question]);
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    setNow(performance.now());
    if (!anchored || !running) return undefined;
    const timer = setInterval(() => setNow(performance.now()), 50);
    return () => clearInterval(timer);
  }, [anchored, running]);
  return anchored ? { ...roundTiming(anchored, Math.max(now, anchored.receivedAt)), anchored }
    : { timeLeft: 10, canAnswer: false, phase: 'reading', answerDelaysMs: [] };
}
