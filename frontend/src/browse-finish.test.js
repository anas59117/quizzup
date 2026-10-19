import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';

let root, container, listeners, media, previousMatchMedia;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.removeItem('quizzup-theme');
  previousMatchMedia = window.matchMedia;
  listeners = new Set();
  media = { matches: false, addEventListener: (_, fn) => listeners.add(fn), removeEventListener: (_, fn) => listeners.delete(fn) };
  window.matchMedia = () => media;
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  window.matchMedia = previousMatchMedia;
  document.documentElement.removeAttribute('data-theme');
});
function ThemeHarness() {
  const [theme, toggle] = useTheme();
  return <button onClick={toggle}>{theme}</button>;
}
test('system appearance stays live until the player makes a manual choice', () => {
  act(() => root.render(<ThemeHarness />));
  expect(container.textContent).toBe('light');
  expect(localStorage.getItem('quizzup-theme')).toBeNull();
  act(() => { media.matches = true; listeners.forEach(fn => fn({ matches: true })); });
  expect(container.textContent).toBe('dark');
  act(() => container.querySelector('button').click());
  expect(localStorage.getItem('quizzup-theme')).toBe('light');
  act(() => { media.matches = false; listeners.forEach(fn => fn({ matches: false })); });
  act(() => { media.matches = true; listeners.forEach(fn => fn({ matches: true })); });
  expect(container.textContent).toBe('light');
});
test('invalid saved appearance falls back to the system preference', () => {
  localStorage.setItem('quizzup-theme', 'broken');
  media.matches = true;
  act(() => root.render(<ThemeHarness />));
  expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
});
test('a failed cover keeps a recognisable graphic and working quiz action', () => {
  const open = jest.fn();
  act(() => root.render(<CategoryTileV4 c={{ key: 'example_quiz', label: 'Quiz Spatial', cover: '/missing.webp' }} onClick={open} />));
  act(() => container.querySelector('img').dispatchEvent(new Event('error')));
  expect(container.querySelector('.tile-v4__cover-placeholder').textContent).toBe('QS');
  expect(container.querySelector('img')).toBeNull();
  act(() => container.querySelector('button').click());
  expect(open).toHaveBeenCalledTimes(1);
});
