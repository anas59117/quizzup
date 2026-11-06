import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { CategoryPreviewContent } from './screens';
import { CATEGORIES } from './ui';

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem('quizzup-lang', 'fr');
  container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(key = 'spider_man', props = {}) {
  act(() => root.render(<I18nProvider><CategoryPreviewContent category={CATEGORIES.find(c => c.key === key)} stats={{}} {...props} /></I18nProvider>));
}

test('cover leads the page and playing is offered before secondary statistics', () => {
  render();
  const image = container.querySelector('.cp-artwork');
  const title = container.querySelector('#quiz-title');
  const play = container.querySelector('.cp-play');
  expect(image.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(play.compareDocumentPosition(container.querySelector('.cp-stats')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('existing editorial photographs also appear on the quiz detail', () => {
  render('booba');
  expect(container.querySelector('.cp-artwork')).not.toBeNull();
});

test('an unavailable cover preserves the themed hero, title and working play action', () => {
  const onPlay = jest.fn();
  render('spider_man', { onPlay });
  act(() => container.querySelector('.cp-artwork').dispatchEvent(new Event('error')));
  expect(container.querySelector('.cp-cover-fallback')).not.toBeNull();
  expect(container.querySelector('#quiz-title').textContent).toContain('Spider-Man');
  act(() => container.querySelector('.cp-play').click());
  expect(onPlay).toHaveBeenCalledTimes(1);
});

test('real progress and existing play, friend, follow and navigation callbacks remain wired', () => {
  const onPlay = jest.fn(), onChallenge = jest.fn(), onToggleFollow = jest.fn(), onBack = jest.fn();
  render('foot_fr', { stats: { topics: [{ key: 'foot_fr', completion: 60, bestStreak: 8, level: 3 }] }, onPlay, onChallenge, onToggleFollow, onBack, following: true });
  expect(container.querySelector('.cp-stats').textContent).toContain('60%');
  expect(container.querySelector('.cp-stats').textContent).toContain('N3');
  for (const selector of ['.cp-play', '.cp-ghost', '.cp-icon-btn[aria-pressed]', '.cp-back']) act(() => container.querySelector(selector).click());
  for (const callback of [onPlay, onChallenge, onToggleFollow, onBack]) expect(callback).toHaveBeenCalledTimes(1);
});

test('English actions are translated and pending prevents duplicate play or challenges', () => {
  localStorage.setItem('quizzup-lang', 'en');
  render('spider_man', { pending: true });
  expect(container.querySelector('.cp-play').textContent).toContain('Play now');
  expect(container.querySelector('.cp-play').disabled).toBe(true);
  expect(container.querySelector('.cp-ghost').disabled).toBe(true);
});
