import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { LeagueContent } from './LeagueSystem';
import { SeasonPassPanel } from './SeasonPass';
import TournamentPage from './TournamentPage';

global.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => {
  localStorage.clear();
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
function render(component, lang = 'fr') {
  localStorage.setItem('quizzup-lang', lang);
  act(() => root.render(<I18nProvider>{component}</I18nProvider>));
}
const button = label => [...container.querySelectorAll('button')].find(el => el.textContent.includes(label));
const league = { lp: 750, wins: 3, losses: 1, streak: 2, currentSeason: 12, daysLeft: 9,
  tier: { key: 'silver', min: 500 }, next: { key: 'gold', min: 1200 }, progress: 35.7 };

test('league exposes French ranks, local storage scope and real duel navigation', () => {
  let destination = 'league';
  render(<LeagueContent league={league} onBack={() => { destination = 'profile'; }} onPlay={() => { destination = 'duel'; }} t={key => key} />);
  expect(container.textContent).toContain('Argent');
  expect(container.textContent).toContain('sur cet appareil');
  expect(container.textContent).toContain('35');
  expect(container.querySelector('[role="progressbar"]').getAttribute('aria-valuenow')).toBe('750');
  act(() => button('Jouer un duel').click());
  expect(destination).toBe('duel');
  act(() => button('Retour au profil').click());
  expect(destination).toBe('profile');
});

test('pass preview never invokes local purchase or claim and has one page heading', () => {
  let purchases = 0, claims = 0;
  render(<SeasonPassPanel pass={{ xp: 1200, currentLevel: 3, levelProgress: 40, premium: true, claimed: [], buyPremium: () => purchases++ }} onClaim={() => claims++} t={key => key} />);
  expect(container.textContent).toContain('En préparation');
  expect(container.textContent).toContain('Aucun achat');
  expect(container.querySelectorAll('h1')).toHaveLength(1);
  expect(container.querySelectorAll('.progression-level')).toHaveLength(10);
  for (const control of container.querySelectorAll('button')) act(() => control.click());
  expect(purchases).toBe(0);
  expect(claims).toBe(0);
  expect(localStorage.getItem('quizzup-pass')).toBeNull();
});

test('English tournament offers a real duel without simulated entries or rewards', () => {
  let destination = 'tournament';
  render(<TournamentPage onBack={() => { destination = 'profile'; }} onPlay={() => { destination = 'duel'; }} />, 'en');
  expect(container.textContent).toContain('In preparation');
  expect(container.textContent).not.toMatch(/\+500|\+200|bots/i);
  act(() => button('Play a duel').click());
  expect(destination).toBe('duel');
  act(() => button('Back to profile').click());
  expect(destination).toBe('profile');
});

