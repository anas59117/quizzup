export function receiveAsyncState(previous, incoming, now = Date.now()) {
  const round = incoming.question?.round ?? incoming.round ?? 0;
  const oldRound = previous?.question?.round ?? previous?.round ?? -1;
  if (previous && ((incoming.score != null && previous.score != null && incoming.score < previous.score) || round < oldRound || (previous.status === 'completed' && incoming.status !== 'completed'))) return previous;
  const question = incoming.question;
  const opensAt = question ? now + Math.max(0, question.opensInMs ?? incoming.opensInMs ?? 1500) : 0;
  const deadline = question ? opensAt + Math.max(0, question.remainingMs ?? incoming.remainingMs ?? 10000) : 0;
  const feedbackQuestion = incoming.feedback ? (previous?.question?.round === incoming.feedback.round ? previous.question : previous?.feedbackQuestion) : null;
  return { ...incoming, feedbackQuestion, feedbackUntil: incoming.feedback && incoming.feedback.round !== previous?.feedback?.round ? now + 900 : previous?.feedbackUntil || 0, receivedAt: now, opensAt: previous?.question?.round === question?.round && previous.opensAt ? Math.min(previous.opensAt, opensAt) : opensAt, deadline: previous?.question?.round === question?.round && previous.deadline ? Math.min(previous.deadline, deadline) : deadline };
}

