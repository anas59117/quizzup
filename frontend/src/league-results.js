// The server returns won/tie/solo, never a winner object. Preserve a bounded
// receipt history with the local league so reconnect/refresh cannot double-award.
export function applyLeagueOutcome(previous, result) {
  if (!result?.gameId || result.solo || result.tie || typeof result.won !== 'boolean') return previous;
  const receipts = previous.recentResults || [];
  if (receipts.some(entry => entry.gameId === result.gameId)) return previous;
  const currentLp = Math.max(0, previous.lp || 0);
  const requested = result.won ? (previous.streak >= 2 ? 35 : 25) : -20;
  const lp = Math.max(0, currentLp + requested);
  return { ...previous, lp,
    wins: (previous.wins || 0) + (result.won ? 1 : 0),
    losses: (previous.losses || 0) + (result.won ? 0 : 1),
    streak: result.won ? (previous.streak || 0) + 1 : 0,
    recentResults: [{ gameId: result.gameId, lpChange: lp - currentLp }, ...receipts].slice(0, 128) };
}
