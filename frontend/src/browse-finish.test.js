import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useTheme } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';
import fs from 'fs';
import path from 'path';

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
  document.documentElement.style.removeProperty('color-scheme');
});
function ThemeHarness() {
  const [theme, toggle] = useTheme();
  return <button onClick={toggle}>{theme}</button>;
}
test('explicit automatic appearance stays live until the player makes a manual choice', () => {
  localStorage.setItem('quizzup-theme', 'system');
  act(() => root.render(<ThemeHarness />));
  expect(container.textContent).toBe('light');
  expect(localStorage.getItem('quizzup-theme')).toBe('system');
  act(() => { media.matches = true; listeners.forEach(fn => fn({ matches: true })); });
  expect(container.textContent).toBe('dark');
  act(() => container.querySelector('button').click());
  expect(localStorage.getItem('quizzup-theme')).toBe('light');
  act(() => { media.matches = false; listeners.forEach(fn => fn({ matches: false })); });
  act(() => { media.matches = true; listeners.forEach(fn => fn({ matches: true })); });
  expect(container.textContent).toBe('light');
});
test('a first visit stays light on a dark device until the player chooses dark', () => {
  media.matches = true;
  act(() => root.render(<ThemeHarness />));
  expect(container.textContent).toBe('light');
  expect(localStorage.getItem('quizzup-theme')).toBeNull();
  act(() => container.querySelector('button').click());
  expect(container.textContent).toBe('dark');
  expect(localStorage.getItem('quizzup-theme')).toBe('dark');
  act(() => { media.matches = false; listeners.forEach(fn => fn({ matches: false })); });
  expect(container.textContent).toBe('dark');
});

test('invalid saved appearance falls back to light', () => {
  localStorage.setItem('quizzup-theme', 'broken');
  media.matches = true;
  act(() => root.render(<ThemeHarness />));
  expect(document.documentElement.getAttribute('data-theme')).toBe('light');
});

test.each([[null, 'light'], ['light', 'light'], ['dark', 'dark'], ['system', 'dark'], ['broken', 'light']])(
  'the HTML bootstrap respects stored choice %s before React mounts', (saved, expected) => {
    media.matches = true;
    if (saved !== null) localStorage.setItem('quizzup-theme', saved);
    const html = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
    const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
    const run = new Function('window', 'document', 'localStorage', script);
    run(window, document, localStorage);
    expect(document.documentElement.dataset.theme).toBe(expected);
    expect(document.documentElement.style.colorScheme).toBe(expected);
    expect(localStorage.getItem('quizzup-theme')).toBe(saved);
  },
);
test('the HTML bootstrap stays light when browser storage is unavailable', () => {
  media.matches = true;
  document.documentElement.dataset.theme = 'light';
  const html = fs.readFileSync(path.resolve(__dirname, '../public/index.html'), 'utf8');
  const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
  const run = new Function('window', 'document', 'localStorage', script);
  expect(() => run(window, document, { getItem() { throw new Error('Storage blocked'); } })).not.toThrow();
  expect(document.documentElement.dataset.theme).toBe('light');
  expect(document.documentElement.style.colorScheme).toBe('light');
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
