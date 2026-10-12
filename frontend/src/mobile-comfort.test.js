import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { TopControls, NavBar } from './ui';
import { QuestionContent } from './enhanced-QuestionContent';

jest.mock('./GameFeelProvider', () => ({ useGameFeel: () => ({
  triggerCorrect: jest.fn(), triggerWrong: jest.fn(), triggerOpponentAnswer: jest.fn(),
  resetCombo: jest.fn(), triggerTick: jest.fn(),
}) }));
let root, container;
beforeEach(() => {
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
test('play has a visible label and preserves quick match action', () => {
  const onQuickMatch = jest.fn();
  render(<NavBar active="home" onNav={jest.fn()} onQuickMatch={onQuickMatch} />);
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
