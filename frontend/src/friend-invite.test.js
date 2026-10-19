import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { HomeContent, ProfileContent } from './screens';
import { FriendsScreen } from './social';
import { I18nProvider } from './i18n';

global.IS_REACT_ACT_ENVIRONMENT = true;
let container, root;
beforeEach(() => { localStorage.setItem('quizzup-lang', 'fr'); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = (element) => act(() => root.render(<I18nProvider>{element}</I18nProvider>));
const social = { friends: [], requests: [], dms: {} };

test('home leads with four starter suggestions without profile card or fabricated levels', () => {
  render(<HomeContent name="Alex" stats={{ level: 7 }} />);
  expect(container.querySelector('.profile-card-v4')).toBeNull();
  expect(container.querySelectorAll('.topics-grid-v4 .tile-v4')).toHaveLength(4);
  expect(container.querySelectorAll('.personal-theme-level')).toHaveLength(0);
  expect(container.textContent).toContain('Quelques idées pour commencer');
});

test('empty friends explains the real room invitation and calls actions only on click', () => {
  const invite = jest.fn(), join = jest.fn();
  render(<FriendsScreen social={social} onInviteFriend={invite} onJoinFriend={join} />);
  const buttons = [...container.querySelectorAll('.friend-invite-actions button')];
  expect(buttons.map(b => b.textContent)).toEqual(['Inviter un ami', 'J’ai un code']);
  expect(container.textContent).toContain('salon privé');
  expect(invite).not.toHaveBeenCalled(); expect(join).not.toHaveBeenCalled();
  act(() => buttons[0].click()); act(() => buttons[1].click());
  expect(invite).toHaveBeenCalledTimes(1); expect(join).toHaveBeenCalledTimes(1);
});

test('populated list retains real friends and pending invitation actions are disabled', () => {
  render(<FriendsScreen social={{ ...social, friends: [{ id: 'real', name: 'Camille', avatar: 'robot', online: true }] }} pending onInviteFriend={jest.fn()} onJoinFriend={jest.fn()} />);
  expect(container.querySelector('.friend-name').textContent).toBe('Camille');
  expect(container.querySelector('.friends-empty')).toBeNull();
  const buttons = [...container.querySelectorAll('.friend-invite-actions button')];
  expect(buttons).toHaveLength(2);
  expect(buttons.every(b => b.disabled)).toBe(true);
});

test('home has no invitation toolbar; profile retains the real invitation actions', () => {
  render(<HomeContent stats={{}} />);
  expect(container.querySelector('.friend-invite-actions')).toBeNull();
});

test('profile forwards room actions and localizes social counts in English', () => {
  localStorage.setItem('quizzup-lang', 'en');
  const invite = jest.fn(), join = jest.fn();
  render(<ProfileContent name="Alex" avatar="robot" stats={{ level: 7, following: 2 }} social={social} onInviteFriend={invite} onJoinFriend={join} />);
  expect(container.querySelector('.pf-social').textContent).toBe('0 games · 0 friends · 2 players followed');
  const buttons = container.querySelectorAll('.friend-invite-actions button');
  expect(buttons[0].textContent).toBe('Invite a friend');
  expect(buttons[1].textContent).toBe('I have a code');
  act(() => buttons[0].click()); act(() => buttons[1].click());
  expect(invite).toHaveBeenCalledTimes(1); expect(join).toHaveBeenCalledTimes(1);
});
