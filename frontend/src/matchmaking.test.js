import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { useGameSocket } from './useGameSocket';
import { ensureSignedIn } from './firebase';
import { useLeague } from './LeagueSystem';
import SFX from './sounds';

jest.mock('./useGameSocket');
jest.mock('./firebase', () => ({ ensureSignedIn: jest.fn(), linkGoogleAccount: jest.fn() }));
jest.mock('./music', () => ({ play: jest.fn(), stop: jest.fn(), setMuted: jest.fn() }));
jest.mock('./sounds', () => ({ muted: true, gameStart: jest.fn(), roundIntro: jest.fn(), victory: jest.fn(), tie: jest.fn(), defeat: jest.fn(), correct: jest.fn(), wrong: jest.fn(), tick: jest.fn(), countdownBeep: jest.fn(), select: jest.fn() }));
jest.mock('./LeagueSystem', () => ({ useLeague: jest.fn(), LeagueContent: () => null }));
jest.mock('./GameFeelProvider', () => {
  const effects = { triggerCorrect: () => jest.requireMock('./sounds').correct(), triggerWrong: () => jest.requireMock('./sounds').wrong(), triggerOpponentAnswer: jest.fn(), resetCombo: jest.fn(), triggerTick: jest.fn() };
  return { useGameFeel: () => effects };
});

let root;
let container;
let messageRef;
let socket;

const click = (label) => {
  const button = [...container.querySelectorAll('button')].find(
    (el) => el.textContent === label || el.getAttribute('aria-label') === label
  );
  expect(button).toBeDefined();
  act(() => button.click());
};
const receive = (data) => act(() => messageRef.current(data));
const advance = (ms) => act(() => jest.advanceTimersByTime(ms));
const soloCalls = () => socket.connect.mock.calls.filter(([action]) => action.type === 'solo');

beforeEach(async () => {
  window.scrollTo = jest.fn();
  jest.useFakeTimers();
  window.IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState(null, '', '/');
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('quizzup-name', 'Test');
  localStorage.setItem('quizzup-lang', 'fr');
  localStorage.setItem('quizzup-onboarded', '1');
  useLeague.mockReturnValue({ streak: 0, addResult: jest.fn() });
  socket = {
    wsRef: { current: null }, connect: jest.fn(() => true), send: jest.fn(() => true),
    closeSocket: jest.fn(), scheduleRecovery: jest.fn(), reconnecting: false,
  };
  useGameSocket.mockImplementation(({ onMessageRef }) => {
    messageRef = onMessageRef;
    return socket;
  });
  ensureSignedIn.mockResolvedValue({ uid: 'guest_test', getIdToken: async () => 'token' });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => root.render(<I18nProvider><App /></I18nProvider>));
  receive({ type: 'identified', reconnected: false, roomReconnected: false });
});

function startQuestion(round = 1) {
  receive({ type: 'game_start', opponents: [{ id: 'other', name: 'Alex', avatar: 'fox' }], totalRounds: 6 });
  receive({ type: 'question', round, totalRounds: 6, question: 'Quel personnage ?', answers: ['A', 'B', 'C', 'D'], timeLimit: 10 });
}

test('a server acknowledgment updates confirmed points while the opponent remains waiting and the timer continues', () => {
  startQuestion();
  act(() => container.querySelector('.answer').click());
  receive({ type: 'answer_ack', round: 1, yourAnswer: 0, yourCorrect: true, pointsEarned: 17, yourScore: 17, correctIndex: 0 });
  expect(container.querySelector('.hud-chip.mine .hud-chip-score').textContent).toBe('17');
  expect(container.querySelector('.duel-points-ring').getAttribute('aria-valuenow')).toBe('17');
  expect(container.querySelector('.hud-chip:not(.mine)').dataset.state).toBe('waiting');
  advance(1000);
  expect(container.querySelector('.hud-timer').textContent).toBe('9');
  receive({ type: 'opponent_answered', id: 'other' });
  expect(container.querySelector('.hud-chip:not(.mine)').dataset.state).toBe('answered');
  expect(container.querySelector('.hud-chip:not(.mine)').textContent).not.toContain('Mauvaise réponse');
});

test('old acknowledgments cannot overwrite a completed round or a new question', () => {
  startQuestion();
  receive({ type: 'round_result', round: 1, yourAnswer: 0, yourCorrect: true, pointsEarned: 17, yourScore: 17,
    correctIndex: 0, others: [{ id: 'other', score: 12, answered: true, correct: true }] });
  receive({ type: 'answer_ack', round: 1, yourScore: 999 });
  expect(container.querySelector('.hud-chip.mine .hud-chip-score').textContent).toBe('17');
  receive({ type: 'question', round: 2, totalRounds: 6, question: 'Deuxième ?', answers: ['A', 'B', 'C', 'D'], timeLimit: 10 });
  receive({ type: 'answer_ack', round: 1, yourScore: 999 });
  expect(container.querySelectorAll('.answer:disabled')).toHaveLength(0);
});

test.each([true,false])('answer outcome sound plays once across acknowledgment and final result (correct=%s)', (correct) => {
  startQuestion();
  const answer = { round: 1, yourAnswer: 0, yourCorrect: correct, pointsEarned: correct ? 17 : 0, yourScore: correct ? 17 : 0, correctIndex: correct ? 0 : 1 };
  receive({ ...answer, type: 'answer_ack' });
  receive({ ...answer, type: 'round_result', others: [{ id: 'other', score: 12, answered: true, correct: true }] });
  expect(correct ? SFX.correct : SFX.wrong).toHaveBeenCalledTimes(1);
});

test('only a successful avatar equipment response changes the visible public identity', () => {
  receive({ type: 'shop_result', action: 'equip', itemId: 'fox', ok: false });
  expect(container.querySelector('.profile-avatar-v4 .player-avatar').dataset.avatar).toBe('robot');
  receive({ type: 'shop_result', action: 'equip', itemId: 'fox', ok: true });
  expect(container.querySelector('.profile-avatar-v4 .player-avatar').dataset.avatar).toBe('fox');
  expect(socket.send).toHaveBeenCalledWith({ type: 'profile_update', name: 'Test', avatar: 'fox' });
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.clearAllMocks();
});

test('browser Back and Forward restore the previous QuizzUp screen', async () => {
  click('Thèmes');
  expect(window.history.state?.quizzup?.stage).toBe('categories');

  jest.useRealTimers();
  await act(async () => {
    const popped = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
    window.history.back();
    await popped;
  });
  expect(container.querySelector('.home-head')).not.toBeNull();

  await act(async () => {
    const popped = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
    window.history.forward();
    await popped;
  });
  expect(container.querySelector('.family-list')).not.toBeNull();
});

test('browser Back from a quiz family restores the themes overview', () => {
  click('Thèmes');
  const themesEntry = window.history.state;
  act(() => container.querySelector('.family-list button').click());
  expect(window.history.state?.quizzup?.family).toBe('sport');

  act(() => window.dispatchEvent(new PopStateEvent('popstate', { state: themesEntry })));
  expect(container.querySelector('.family-list')).not.toBeNull();
});

test('browser Back from matchmaking leaves the queue and returns home', async () => {
  waitForOpponent();
  expect(window.history.state?.quizzup?.stage).toBe('session');

  jest.useRealTimers();
  await act(async () => {
    const popped = new Promise((resolve) => window.addEventListener('popstate', resolve, { once: true }));
    window.history.back();
    await popped;
  });
  expect(socket.closeSocket).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.home-head')).not.toBeNull();
});

function waitForOpponent(topic = 'Partie rapide') {
  click(topic);
  receive({ type: 'waiting' });
}

test('shows both game modes and starts solo directly when selected', () => {
  const multiplayer = [...container.querySelectorAll('button')].find((el) => el.textContent === 'Multijoueur');
  const solo = [...container.querySelectorAll('button')].find((el) => el.textContent === 'Solo');
  expect(multiplayer.getAttribute('aria-pressed')).toBe('true');
  expect(solo.getAttribute('aria-pressed')).toBe('false');

  click('Solo');
  expect(multiplayer.getAttribute('aria-pressed')).toBe('false');
  expect(solo.getAttribute('aria-pressed')).toBe('true');
  click('Partie rapide');
  expect(soloCalls()).toEqual([[{ type: 'solo', category: null }]]);
});

test('shows the real level and truthful wait feedback with a delayed solo option', () => {
  receive({ type: 'stats', stats: { level: 7 } });
  waitForOpponent();
  expect(container.textContent).toContain('Niveau 7');
  expect(container.textContent).toContain('Thème aléatoire');
  expect(container.textContent).not.toContain('Jouer en solo');
  advance(12000);
  expect(container.textContent).toContain('La recherche continue');
  expect(container.textContent).not.toContain('On élargit');
  expect(container.textContent).toContain('Jouer en solo');
});

test('starts solo only after cancellation is acknowledged, retaining the selected topic', () => {
  const topic = container.querySelector('[data-topic="ligue_champions"] button');
  act(() => topic.click());
  click('Jouer maintenant');
  const category = socket.connect.mock.calls.find(([action]) => action.type === 'join')[0].category;
  expect(category).toBe('ligue_champions');
  receive({ type: 'waiting' });
  const topicLabel = container.querySelector('.matchmaking-topic').textContent;
  advance(12000);
  click('Jouer en solo');
  expect(socket.connect).toHaveBeenLastCalledWith({ type: 'cancel_queue' });
  expect(soloCalls()).toHaveLength(0);
  expect(container.querySelector('.matchmaking-topic').textContent).toBe(topicLabel);
  click('Jouer en solo');
  expect(socket.connect.mock.calls.filter(([a]) => a.type === 'cancel_queue')).toHaveLength(1);
  receive({ type: 'queue_cancelled' });
  expect(soloCalls()).toEqual([[{ type: 'solo', category }]]);
  receive({ type: 'queue_cancelled' });
  expect(soloCalls()).toHaveLength(1);
});

test('a completed duel records the league reward once, even after a rerender', () => {
  receive({ type: 'game_start', gameId: 'reward-once', you: { id: 'me' }, opponents: [{ id: 'other', name: 'Other', avatar: '🐼', score: 5 }], totalRounds: 6 });
  receive({ type: 'game_end', gameId: 'reward-once', won: true, winner: { id: 'me' }, finalScore: 20, xp: 60, coins: 10, others: [{ id: 'other', score: 5 }], leaderboard: [] });
  expect(useLeague().addResult).toHaveBeenCalledTimes(1);
  expect(container.querySelectorAll('.notification-toast')).toHaveLength(1);
  receive({ type: 'stats', stats: { level: 2 } });
  expect(useLeague().addResult).toHaveBeenCalledTimes(1);
});

test('normal cancellation returns home without starting another game', () => {
  waitForOpponent();
  click('← Annuler');
  expect(container.textContent).toContain('Sortie de la recherche');
  receive({ type: 'queue_cancelled' });
  expect(container.querySelector('.quick-play')).not.toBeNull();
  expect(soloCalls()).toHaveLength(0);
});

test.each(['queue_cancel_failed', 'game_start', 'game_reconnected', 'match_aborted', 'error'])(
  'does not start solo if %s wins the cancellation race', (type) => {
    waitForOpponent();
    advance(12000);
    click('Jouer en solo');
    receive({ type, opponents: [], totalRounds: 6 });
    receive({ type: 'queue_cancelled' });
    expect(soloCalls()).toHaveLength(0);
  }
);

test('reconnect retries cancellation, never the original join or solo action', () => {
  waitForOpponent();
  advance(12000);
  click('Jouer en solo');
  socket.connect.mockClear();
  receive({ type: 'identified', queuedActionFlushed: false });
  expect(socket.send).toHaveBeenLastCalledWith({ type: 'cancel_queue' });
  expect(socket.connect).not.toHaveBeenCalled();
  socket.send.mockClear();
  receive({ type: 'identified', queuedActionFlushed: true });
  expect(socket.send).not.toHaveBeenCalled();
  receive({ type: 'queue_cancelled' });
  expect(soloCalls()).toEqual([[{ type: 'solo', category: null }]]);
});

test('a failed cancellation connection does not start solo or claim success', () => {
  waitForOpponent();
  advance(12000);
  socket.connect.mockReturnValue(false);
  click('Jouer en solo');
  expect(soloCalls()).toHaveLength(0);
  expect(socket.closeSocket).toHaveBeenCalled();
  expect(container.textContent).toContain('Impossible de lancer la partie');
});
