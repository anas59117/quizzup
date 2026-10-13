import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { PlayerHud, RoomLobby, Leaderboard } from './multiplayer';
import { QuestionContent } from './enhanced-QuestionContent';
import { GameFeelProvider } from './GameFeelProvider';

// Audio is external to the DOM; keep the real provider and its feedback state.
jest.mock('./sounds', () => ({ correct: jest.fn(), wrong: jest.fn(), tick: jest.fn() }));
let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem('quizzup-lang', 'en');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(child) { act(() => root.render(<I18nProvider>{child}</I18nProvider>)); }

test('an answered opponent stays neutral until the complete round result', () => {
  const me = { name: 'Alice', avatar: 'fox', score: 20 };
  const others = [{ id: 'bob', name: 'Bob', avatar: 'robot', score: 10, answered: true }];
  render(<PlayerHud me={me} others={others} />);
  const opponent = container.querySelector('.hud-chip:not(.mine)');
  expect(opponent.textContent).toContain('Answer submitted');
  expect(opponent.querySelector('.wrong, .correct')).toBeNull();
  render(<PlayerHud me={me} others={[{ ...others[0], correct: false }]} revealing />);
  expect(container.querySelector('.hud-chip:not(.mine)').textContent).toContain('Incorrect answer');
});

test('an unanswered opponent is waiting during an acknowledgment and timed out only at full reveal', () => {
  const props = { me: { avatar: 'fox', score: 40, answered: true, correct: true, pointsEarned: 12 },
    others: [{ id: 'bob', name: 'Bob', avatar: 'robot', score: 28, answered: false }] };
  render(<PlayerHud {...props} />);
  expect(container.querySelector('.hud-chip:not(.mine)').textContent).toContain('Waiting');
  expect(container.querySelector('.hud-chip:not(.mine) .wrong')).toBeNull();
  render(<PlayerHud {...props} revealing />);
  expect(container.querySelector('.hud-chip:not(.mine)').textContent).toContain('Time up');
});

const questionProps = {
  question: { question: 'Who?', answers: ['A', 'B', 'C', 'D', 'E'], timeLimit: 10, round: 1, totalRounds: 6 },
  timeLeft: 7, selected: 0, answer: jest.fn(), avatar: 'fox', name: 'Alice', score: 28,
  opponents: [{ id: 'bob', name: 'Bob', avatar: 'robot', score: 15, answered: false }],
  reportQuestion: jest.fn(), GameChat: () => null,
};
function question(props = {}) { render(<GameFeelProvider><QuestionContent {...questionProps} {...props} /></GameFeelProvider>); }

test('acknowledgment shows confirmed score and points without exposing other choices', () => {
  question();
  expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('0');
  expect(container.querySelector('.hud-chip.mine .hud-chip-score').textContent).toBe('28');
  question({ reveal: { round: 1, yourCorrect: false, pointsEarned: 0, yourScore: 28, yourAnswer: 0, correctIndex: 3 } });
  expect(container.querySelectorAll('.answer.correct')).toHaveLength(0);
  expect(container.querySelector('.answer.wrong .answer-text').textContent).toBe('A');
  expect(container.querySelector('.hud-chip:not(.mine)').textContent).toContain('Waiting');
  question({ reveal: { round: 1, yourCorrect: true, pointsEarned: 12, yourScore: 40, yourAnswer: 0, correctIndex: 0 } });
  expect(container.querySelector('.hud-chip.mine .hud-chip-score').textContent).toBe('40');
  expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('12');
  expect(container.querySelectorAll('.answer.correct')).toHaveLength(1);
});

test('a repeated ack and its full result award one feedback event, then a new round can award again', () => {
  const ack = { round: 1, yourCorrect: true, pointsEarned: 12, yourScore: 40, yourAnswer: 0, correctIndex: 0 };
  question({ reveal: ack });
  question({ reveal: { ...ack } });
  question({ reveal: { ...ack, others: [] } });
  expect(container.querySelectorAll('.qu-float-point-global')).toHaveLength(1);
  question({ question: { ...questionProps.question, round: 2 }, reveal: null, selected: null });
  question({ question: { ...questionProps.question, round: 2 }, reveal: { ...ack, round: 2 } });
  expect(container.querySelectorAll('.qu-float-point-global')).toHaveLength(2);
});

test('reconnect uses the acknowledged answer even before selected state recovers', () => {
  question({ selected: null, reveal: { round: 1, yourCorrect: false, pointsEarned: 0, yourScore: 28, yourAnswer: 2, correctIndex: 3 } });
  expect(container.querySelector('.answer.wrong .answer-text').textContent).toBe('C');
  expect(container.querySelectorAll('.answer.correct')).toHaveLength(0);
});

test('a previous-round ack cannot disable a new round or replace its score', () => {
  question({ selected: null, question: { ...questionProps.question, round: 2 },
    reveal: { round: 1, yourCorrect: true, pointsEarned: 12, yourScore: 99, yourAnswer: 0, correctIndex: 0 } });
  expect([...container.querySelectorAll('.answer')].every(button => !button.disabled)).toBe(true);
  expect(container.querySelector('.hud-chip.mine .hud-chip-score').textContent).toBe('28');
  expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('0');
  expect(container.querySelectorAll('.qu-float-point-global')).toHaveLength(0);
});

test('an unanswered timeout is labeled as time up and reveals the final correct choice', () => {
  question({ selected: null, reveal: { round: 1, yourCorrect: false, pointsEarned: 0, yourScore: 28,
    yourAnswer: null, correctIndex: 3, others: [], timedOut: true } });
  expect(container.querySelector('.hud-chip.mine').textContent).toContain('Time up');
  expect(container.querySelector('.mobile-answer-feedback').textContent).toContain('Time up');
  expect(container.querySelector('.answer.correct .answer-text').textContent).toBe('D');
  expect(container.querySelector('.answer.wrong')).toBeNull();
});

test('duel, lobby and results display illustrated avatars and preserve custom identity metadata', () => {
  render(<><PlayerHud me={{ avatar: 'fox', frame: 'neon', score: 0 }} others={[]} />
    <RoomLobby code="ABCDE" players={[{ id: 'a', name: 'Alice', avatar: 'lion' }]} />
    <Leaderboard leaderboard={[{ id: 'a', name: 'Alice', avatar: 'lion', frame: 'neon', score: 12 }]} myId="a" /></>);
  expect(container.querySelector('.hud-chip .player-avatar').getAttribute('data-avatar')).toBe('fox');
  expect(container.querySelector('.lobby-ava .player-avatar').getAttribute('data-avatar')).toBe('lion');
  expect(container.querySelector('.lb-ava .player-avatar').getAttribute('data-avatar')).toBe('lion');
  expect(container.querySelector('.hud-chip').getAttribute('data-identity')).toBe('neon');
  expect(container.querySelector('.identity-emblem-mini')).toBeNull();
});
