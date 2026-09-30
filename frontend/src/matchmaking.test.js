import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { I18nProvider } from './i18n';
import { useGameSocket } from './useGameSocket';
import { ensureSignedIn } from './firebase';

jest.mock('./useGameSocket');
jest.mock('./firebase', () => ({ ensureSignedIn: jest.fn(), linkGoogleAccount: jest.fn() }));
jest.mock('./music', () => ({ play: jest.fn(), stop: jest.fn(), setMuted: jest.fn() }));
jest.mock('./sounds', () => ({ muted: true, gameStart: jest.fn(), roundIntro: jest.fn() }));

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
  jest.useFakeTimers();
  window.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.clear();
  sessionStorage.clear();
  localStorage.setItem('quizzup-name', 'Test');
  localStorage.setItem('quizzup-lang', 'fr');
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

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
  jest.clearAllMocks();
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
  const topic = container.querySelector('.topics-scroll button');
  act(() => topic.click());
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
