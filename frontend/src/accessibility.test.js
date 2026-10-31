import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { HomeContent, CategoriesContent, ProfileContent, CategoryPreviewContent, LeaderboardContent, EnterCodeContent } from './screens';
import { Messenger } from './Messenger';
import { MatchHistory } from './MatchHistory';
import { SkipLink } from './SkipLink';
import { CATEGORIES } from './ui';

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem('quizzup-lang', 'fr');
  container = document.createElement('div'); document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });

test.each([
  ['Accueil', <HomeContent stats={{}} />],
  ['Thèmes', <CategoriesContent />],
  ['Profil', <ProfileContent name="Alice" avatar="robot" stats={{ level: 1, topics: [] }} social={{ friends: [], requests: [] }} />],
  ['Fiche quiz', <CategoryPreviewContent category={CATEGORIES.find(c => c.key === 'harry_potter')} />],
  ['Classement', <LeaderboardContent />],
  ['Code ami', <EnterCodeContent joinCode="" />],
  ['Historique', <MatchHistory history={{ matches: [] }} />],
  ['Messages', <Messenger social={{ friends: [], requests: [], requestConversations: () => {}, closeConversation: () => {} }} />],
  ['Conversation', <Messenger social={{ activeConversationId: 'peer', friends: [{ id: 'peer', name: 'Camille' }], requests: [], requestConversations: () => {}, requestHistory: () => {}, closeConversation: () => {} }} />],
])('%s has one named main, one primary heading, and a programmatic focus target', (_, screen) => {
  act(() => root.render(<I18nProvider>{screen}</I18nProvider>));
  const main = container.querySelector('main#main-content');
  expect(main).not.toBeNull();
  expect(container.querySelectorAll('main')).toHaveLength(1);
  expect(main.getAttribute('tabindex')).toBe('-1');
  expect(main.querySelectorAll('h1')).toHaveLength(1);
  const heading = main.querySelector('h1');
  expect(heading.textContent.trim()).not.toBe('');
  expect(heading.getAttribute('tabindex')).toBe('-1');
  expect(document.getElementById(main.getAttribute('aria-labelledby'))).toBe(heading);
});

test.each([['fr', 'Aller au contenu'], ['en', 'Skip to content']])('skip link in %s moves focus past the header without changing history', (lang, label) => {
  localStorage.setItem('quizzup-lang', lang);
  act(() => root.render(<I18nProvider><SkipLink /><HomeContent stats={{}} /></I18nProvider>));
  const heading = container.querySelector('h1');
  heading.scrollIntoView = jest.fn();
  const url = window.location.href;
  const historyLength = window.history.length;
  expect(container.querySelector('a.skip-link').textContent).toBe(label);
  act(() => container.querySelector('a.skip-link').click());
  expect(document.activeElement).toBe(heading);
  expect(window.location.href).toBe(url);
  expect(window.history.length).toBe(historyLength);
});
