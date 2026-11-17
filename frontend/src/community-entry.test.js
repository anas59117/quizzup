import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { TopControls, NavBar } from './ui';

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  localStorage.setItem('quizzup-lang', 'fr');
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = element => act(() => root.render(<I18nProvider>{element}</I18nProvider>));

test('browsing controls provide a direct community entry without opening settings', () => {
  const open = jest.fn();
  render(<TopControls home onCommunity={open} />);
  const button = container.querySelector('button[aria-label="Communauté"]');
  expect(button).not.toBeNull();
  act(() => button.click());
  expect(open).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.mobile-controls-panel')).toBeNull();
});

test('live question controls never offer navigation away to the community', () => {
  render(<TopControls playing onCommunity={jest.fn()} />);
  expect(container.querySelector('button[aria-label="Communauté"]')).toBeNull();
});

test('community does not incorrectly mark Home as the current page', () => {
  render(<NavBar active="feed" onNav={jest.fn()} />);
  expect(container.querySelector('[aria-current="page"]')).toBeNull();
  expect(container.querySelectorAll('.navbar > button')).toHaveLength(5);
});
