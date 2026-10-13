import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { TopControls, NavBar } from './ui';
import { QuestionContent } from './enhanced-QuestionContent';
import { FinishedContent } from './screens';
import { StreakCalendar } from './DailyStreak';
import { NotificationContainer } from './NotificationSystem';

const mockGameFeel = {
  triggerCorrect: jest.fn(), triggerWrong: jest.fn(), triggerOpponentAnswer: jest.fn(),
  resetCombo: jest.fn(), triggerTick: jest.fn(),
};
jest.mock('./GameFeelProvider', () => ({ useGameFeel: () => mockGameFeel }));
let root, container;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.setItem('quizzup-lang', 'fr');
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(child) { act(() => root.render(<I18nProvider>{child}</I18nProvider>)); }
test('settings are collapsed, keyboard dismissible, and hidden during play', () => {
  const props = { muted: true, toggleMute: jest.fn(), theme: 'dark', toggleTheme: jest.fn() };
  render(<TopControls {...props} />);
  const trigger = container.querySelector('[aria-expanded]');
  expect(container.querySelector('.mobile-controls-panel')).toBeNull();
  act(() => trigger.click());
  expect(trigger.getAttribute('aria-expanded')).toBe('true');
  act(() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
  expect(document.activeElement).toBe(trigger);
  expect(container.querySelector('.mobile-controls-panel')).toBeNull();
  render(<TopControls {...props} playing />);
  expect(container.querySelectorAll('button')).toHaveLength(1);
  act(() => container.querySelector('button').click());
  expect(props.toggleMute).toHaveBeenCalledTimes(1);
});
test('four destinations surround a central play action and preserve navigation', () => {
  const onQuickMatch = jest.fn();
  const onNav = jest.fn();
  render(<NavBar active="categories" onNav={onNav} onQuickMatch={onQuickMatch} />);
  const buttons = [...container.querySelectorAll('nav button')];
  expect(buttons.map(button => button.textContent)).toEqual(['Accueil', 'Thèmes', 'Jouer', 'Boutique', 'Profil']);
  expect(container.querySelector('.nav-item.active').textContent).toBe('Thèmes');
  for (const index of [0, 1, 3, 4]) act(() => buttons[index].click());
  expect(onNav.mock.calls).toEqual([['home'], ['categories'], ['shop'], ['profile']]);
  expect(container.querySelector('.nav-play-label').textContent).toBe('Jouer');
  act(() => container.querySelector('.nav-bolt').click());
  expect(onQuickMatch).toHaveBeenCalledTimes(1);
});
test('answer acknowledgments never leak the correct answer before full reveal', () => {
  const props = {
    question: { question: 'Qui est Peter ?', answers: ['May', 'Peter', 'Ben', 'MJ'], timeLimit: 10 },
    timeLeft: 4, selected: 0, answer: jest.fn(), opponents: [], avatar: '🦊', name: 'Sisi', score: 0,
    reportQuestion: jest.fn(), GameChat: () => null,
  };
  render(<QuestionContent {...props} reveal={{ yourCorrect: false, correctIndex: 1 }} />);
  expect(container.querySelector('.mobile-answer-feedback').textContent).toBe('Mauvaise réponse');
  expect(container.querySelectorAll('.answer.correct')).toHaveLength(0);
  expect([...container.querySelectorAll('.answer')].every(b => b.disabled)).toBe(true);
  render(<QuestionContent {...props} reveal={{ yourCorrect: false, correctIndex: 1, others: [] }} />);
  expect(container.querySelector('.mobile-answer-feedback').textContent).toContain('La bonne réponse était : Peter');
  expect(container.querySelectorAll('.answer.correct')).toHaveLength(1);
  expect(container.querySelector('.answer.correct .answer-result-icon').textContent).toBe('✓');
});
test('an active answer calls the existing action and expired questions remain disabled', () => {
  const props = { question: { question: 'Test', answers: ['A', 'B', 'C', 'D'], timeLimit: 10 },
    timeLeft: 8, selected: null, answer: jest.fn(), opponents: [], GameChat: () => null };
  render(<QuestionContent {...props} />);
  act(() => container.querySelector('.answer').click());
  expect(props.answer).toHaveBeenCalledWith(0);
  render(<QuestionContent {...props} question={{ ...props.question, expired: true }} />);
  expect([...container.querySelectorAll('.answer')].every(b => b.disabled)).toBe(true);
});

test('profile labels resolve and a one-day streak uses the singular', () => {
  function Labels() {
    const { t } = require('./i18n').useI18n();
    return <div>{['statistics', 'overallProgress', 'beforeNextLevel'].map(key => <span key={key}>{t(key)}</span>)}</div>;
  }
  render(<><Labels /><StreakCalendar streak={1} calendar={[]} /></>);
  expect(container.textContent).toContain('Statistiques');
  expect(container.textContent).toContain('Progression générale');
  expect(container.textContent).toContain('1 jour de suite');
  expect(container.textContent).not.toContain('1 jours');
});

test('match results preserve both avatars and the replay actions', () => {
  const rematch = jest.fn();
  render(<FinishedContent result={{ won: true, finalScore: 84, xp: 224, coins: 50 }}
    opponents={[{ id: 'other', name: 'titi12', avatar: '🐼', score: 55 }]}
    avatar="🦊" name="Sisi" social={{ friends: [], outgoingRequests: new Set() }}
    rematch={rematch} newMatch={jest.fn()} playAgain={jest.fn()} />);
  expect(container.querySelector('.res-score.me .player-avatar').dataset.avatar).toBe('fox');
  expect(container.querySelector('.res-score.op .player-avatar').dataset.avatar).toBe('robot');
  act(() => container.querySelector('.res-btn-primary').click());
  expect(rematch).toHaveBeenCalledTimes(1);
});

test('an acknowledgment followed by a round result plays answer effects once', () => {
  const props = { question: { question: 'Test', answers: ['A', 'B', 'C', 'D'], timeLimit: 10, round: 1 },
    timeLeft: 8, selected: 0, answer: jest.fn(), opponents: [], GameChat: () => null };
  render(<QuestionContent {...props} reveal={{ yourCorrect: true, pointsEarned: 12 }} />);
  render(<QuestionContent {...props} reveal={{ yourCorrect: true, pointsEarned: 12, correctIndex: 0, others: [] }} />);
  expect(mockGameFeel.triggerCorrect).toHaveBeenCalledTimes(1);
});

test('a notification can be dismissed with its labeled button', () => {
  const onDismiss = jest.fn();
  render(<NotificationContainer notifications={[{ id: 1, type: 'success', message: '+20 LP' }]} onDismiss={onDismiss} />);
  const button = container.querySelector('button');
  expect(button.getAttribute('aria-label')).toBe('Fermer la notification');
  act(() => button.click());
  expect(onDismiss).toHaveBeenCalledWith(1);
});
