import { applyLeagueOutcome } from './league-results';
const initial = { lp: 10, wins: 2, losses: 3, streak: 0 };
test('server won flag awards a victory without a winner field', () => {
  const next = applyLeagueOutcome(initial, { gameId: 'g1', won: true, tie: false, solo: false });
  expect(next).toMatchObject({ lp: 35, wins: 3, losses: 3, streak: 1 });
  expect(next.recentResults[0]).toMatchObject({ gameId: 'g1', lpChange: 25 });
  expect(applyLeagueOutcome(next, { gameId: 'g1', won: true })).toBe(next);
});
test('solo, ties, malformed results do not become losses', () => {
  for (const result of [{ gameId: 'solo', won: true, solo: true }, { gameId: 'tie', won: false, tie: true }, { gameId: 'bad' }, { won: false }]) {
    expect(applyLeagueOutcome(initial, result)).toBe(initial);
  }
});
test('loss cannot display a deduction larger than the available points', () => {
  const next = applyLeagueOutcome(initial, { gameId: 'loss', won: false });
  expect(next).toMatchObject({ lp: 0, wins: 2, losses: 4, streak: 0 });
  expect(next.recentResults[0].lpChange).toBe(-10);
});
