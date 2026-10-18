import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { WorldMatchSearch, DuelRoundIntro } from './MatchPresentation';

let root, container;
beforeEach(() => {
  jest.useFakeTimers();
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem('quizzup-lang', 'fr');
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});
const render = child => act(() => root.render(<I18nProvider>{child}</I18nProvider>));
const button = text => [...container.querySelectorAll('button')].find(el => el.textContent.includes(text));
const waiting = { avatar: 'ninja', name: 'Sisi', level: 7, onCancel: jest.fn(), onPlaySolo: jest.fn() };
const intro = { round: 1, category: 'Cinéma', difficulty: 'medium' };

test('search displays only the actual own identity and a decorative world map', () => {
  render(<WorldMatchSearch {...waiting} />);
  expect(container.textContent).toContain('Sisi');
  expect(container.textContent).toContain('Niveau 7');
  expect(container.textContent).toContain('Thème aléatoire');
  expect([...container.querySelectorAll('.player-avatar')].map(el => el.dataset.avatar)).toEqual(['ninja']);
  expect(container.querySelector('.wm-world').getAttribute('aria-hidden')).toBe('true');
  expect(button('Jouer en solo')).toBeUndefined();
});

test('cancellation stays actionable and pending prevents duplicate actions', () => {
  let cancelled = 0;
  const props = { ...waiting, onCancel: () => { cancelled += 1; } };
  render(<WorldMatchSearch {...props} />);
  act(() => button('Annuler').click());
  expect(cancelled).toBe(1);
  render(<WorldMatchSearch {...props} pending />);
  expect(button('Sortie de la recherche').disabled).toBe(true);
  act(() => button('Sortie de la recherche').click());
  expect(cancelled).toBe(1);
});

test('solo becomes available at twelve seconds and keeps cancellation separate', () => {
  let solo = 0;
  render(<WorldMatchSearch {...waiting} onPlaySolo={() => { solo += 1; }} />);
  act(() => jest.advanceTimersByTime(11999));
  expect(button('Jouer en solo')).toBeUndefined();
  act(() => jest.advanceTimersByTime(1));
  expect(container.textContent).toContain('12 s');
  expect(container.textContent).toContain('La recherche continue');
  act(() => button('Jouer en solo').click());
  expect(solo).toBe(1);
});

test('reconnection preserves elapsed wait, explains status, and blocks solo', () => {
  render(<WorldMatchSearch {...waiting} />);
  act(() => jest.advanceTimersByTime(13000));
  render(<WorldMatchSearch {...waiting} reconnecting />);
  expect(container.querySelector('[role="status"]').textContent).toContain('Reconnexion');
  expect(container.textContent).toContain('13 s');
  expect(button('Jouer en solo').disabled).toBe(true);
  expect(button('Annuler').disabled).toBe(false);
});

test('pending also blocks the delayed solo action', () => {
  render(<WorldMatchSearch {...waiting} pending />);
  act(() => jest.advanceTimersByTime(12000));
  expect(button('Jouer en solo').disabled).toBe(true);
});

test('selected topic survives connection changes with English search chrome', () => {
  localStorage.setItem('quizzup-lang', 'en');
  render(<WorldMatchSearch {...waiting} categoryKey="ligue_champions" />);
  expect(container.querySelector('h1').textContent).toBe('Finding an opponent');
  expect(container.querySelector('.wm-topic').textContent).toBe('Ligue des Champions');
  render(<WorldMatchSearch {...waiting} categoryKey="ligue_champions" reconnecting />);
  expect(container.querySelector('.wm-topic').textContent).toBe('Ligue des Champions');
  expect(container.querySelector('h1').textContent).toContain('Reconnecting');
});

test('first one versus one introduction uses both real illustrated player identities', () => {
  render(<DuelRoundIntro intro={intro} totalRounds={6} opponents={[{ id: 'other', name: 'Alex', avatar: 'owl', level: 9 }]} {...waiting} />);
  expect(container.querySelector('.df-faceoff')).not.toBeNull();
  expect([...container.querySelectorAll('.player-avatar')].map(el => el.dataset.avatar)).toEqual(['ninja', 'owl']);
  expect(container.querySelector('section').getAttribute('aria-label')).toContain('Sisi');
  expect(container.textContent).toContain('Alex');
  expect(container.textContent).toContain('Niveau 9');
  expect(container.textContent).toContain('1 sur 6');
});

test.each([{ opponents: [] }, { opponents: [{ name: 'A', avatar: 'fox' }, { name: 'B', avatar: 'cat' }] }])('solo and group starts keep the clear round introduction', ({ opponents }) => {
  render(<DuelRoundIntro intro={intro} totalRounds={6} opponents={opponents} {...waiting} />);
  expect(container.querySelector('.df-faceoff')).toBeNull();
  expect(container.textContent).toContain('Cinéma');
  expect(container.textContent).toContain('1 sur 6');
});

test('later bonus round keeps its round and double-points meaning', () => {
  render(<DuelRoundIntro intro={{ ...intro, round: 6, isBonus: true }} totalRounds={6} opponents={[{ name: 'Alex', avatar: 'owl' }]} {...waiting} />);
  expect(container.querySelector('.df-faceoff')).toBeNull();
  expect(container.textContent).toContain('MANCHE BONUS');
  expect(container.textContent).toContain('Points doublés');
});

test('between rounds restores the topic emoji and explicit Manche heading', () => {
  render(<DuelRoundIntro intro={{ ...intro, round: 2, icon: '🏆' }} totalRounds={6} opponents={[{ name: 'Alex', avatar: 'owl' }]} {...waiting} />);
  expect(container.querySelector('.round-intro-icon').textContent).toBe('🏆');
  expect(container.querySelector('.round-intro-round').textContent).toBe('Manche 2');
  expect(container.querySelector('.df-round-number')).toBeNull();
});
