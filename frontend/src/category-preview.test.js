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
function choose(label) {
  act(() => [...document.querySelectorAll('.play-sheet > button')].find(button => button.textContent.startsWith(label)).click());
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
  expect(onPlay).not.toHaveBeenCalled();
  choose('Duel rapide');
  expect(onPlay).toHaveBeenCalledTimes(1);
});

test('real progress and existing play, friend, follow and navigation callbacks remain wired', () => {
  const onPlay = jest.fn(), onChallenge = jest.fn(), onToggleFollow = jest.fn(), onBack = jest.fn();
  render('foot_fr', { stats: { topics: [{ key: 'foot_fr', completion: 60, bestStreak: 8, level: 3 }] }, onPlay, onChallenge, onToggleFollow, onBack, following: true });
  expect(container.querySelector('.cp-stats').textContent).toContain('60%');
  expect(container.querySelector('.cp-stats').textContent).toContain('Niveau 3');
  act(() => container.querySelector('.cp-play').click());
  choose('Duel rapide');
  for (const selector of ['.cp-ghost', '.cp-icon-btn[aria-pressed]', '.cp-back']) act(() => container.querySelector(selector).click());
  for (const callback of [onPlay, onChallenge, onToggleFollow, onBack]) expect(callback).toHaveBeenCalledTimes(1);
});

test.each([['Duel rapide', 'duel'], ['Solo', 'solo']])('quiz play waits for %s and keeps the selected topic', (label, mode) => {
  const onPlay = jest.fn();
  render('ligue_champions', { onPlay });
  act(() => container.querySelector('.cp-play').click());
  expect(onPlay).not.toHaveBeenCalled();
  expect(document.querySelector('[role=dialog]')).not.toBeNull();
  choose(label);
  expect(onPlay).toHaveBeenCalledWith(mode);
  expect(container.querySelector('main').dataset.topic).toBe('ligue_champions');
  expect(document.querySelector('[role=dialog]')).toBeNull();
});

test('closing the quiz mode chooser starts nothing and restores focus', () => {
  const onPlay = jest.fn();
  render('spider_man', { onPlay });
  const play = container.querySelector('.cp-play');
  play.focus();
  act(() => play.click());
  act(() => document.querySelector('[role=dialog]').dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })));
  expect(onPlay).not.toHaveBeenCalled();
  expect(document.querySelector('[role=dialog]')).toBeNull();
  expect(document.activeElement).toBe(play);
});

test.each([['Inviter un ami', 'onInvite'], ['J’ai un code', 'onJoin']])('quiz chooser routes %s without starting matchmaking', (label, callback) => {
  const onPlay = jest.fn(), action = jest.fn();
  render('spider_man', { onPlay, [callback]: action });
  act(() => container.querySelector('.cp-play').click());
  choose(label);
  expect(action).toHaveBeenCalledTimes(1);
  expect(onPlay).not.toHaveBeenCalled();
  expect(document.querySelector('[role=dialog]')).toBeNull();
});

test('English actions are translated and pending prevents duplicate play or challenges', () => {
  localStorage.setItem('quizzup-lang', 'en');
  render('spider_man', { pending: true });
  expect(container.querySelector('.cp-play').textContent).toContain('Play now');
  expect(container.querySelector('.cp-play').disabled).toBe(true);
  expect(container.querySelector('.cp-ghost').disabled).toBe(true);
});

test('approved pitch is complete and no duplicate about accordion remains', () => {
  render();
  expect(container.querySelector('.cp-info').textContent).toBe('De Peter Parker à Miles Morales. Le multivers n’aura plus de secrets pour toi.');
  expect(container.querySelector('.cp-eyebrow').textContent).toBe('POP CULTURE · MARVEL');
  expect(container.querySelector('.cp-about')).toBeNull();
});

test('compact friend invitation and secondary actions preserve their callbacks', () => {
  const onChallenge = jest.fn(), onCommunity = jest.fn(), onLeaderboard = jest.fn();
  render('spider_man', { onChallenge, onCommunity, onLeaderboard });
  act(() => container.querySelector('.cp-friend-invite').click());
  act(() => container.querySelectorAll('.social-entry-row button')[0].click());
  act(() => container.querySelectorAll('.social-entry-row button')[1].click());
  for (const fn of [onChallenge, onCommunity, onLeaderboard]) expect(fn).toHaveBeenCalledTimes(1);
});

test('English featured pitch and compact progress do not retain French labels', () => {
  localStorage.setItem('quizzup-lang', 'en');
  render();
  expect(container.querySelector('.cp-info').textContent).toContain('From Peter Parker to Miles Morales.');
  expect(container.querySelector('.cp-stats').textContent).toContain('Level 1');
  expect(container.querySelector('.cp-friends').textContent).toContain('Challenge your friends');
});

test('theme canvas follows the quiz and restores browser chrome when leaving', () => {
  container.className = 'app-category-preview';
  const theme = document.createElement('meta');
  theme.name = 'theme-color'; theme.content = '#0b0b0c'; document.head.append(theme);
  try {
    render('foot_fr');
    expect(container.style.getPropertyValue('--cp-canvas')).toBe('#142e55');
    expect(theme.content).toBe('#142e55');
    act(() => root.render(<I18nProvider><CategoryPreviewContent category={null} /></I18nProvider>));
    expect(container.style.getPropertyValue('--cp-canvas')).toBe('');
    expect(theme.content).toBe('#0b0b0c');
  } finally { theme.remove(); }
});
