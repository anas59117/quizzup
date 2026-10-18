import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { LeaderboardContent, ProfileContent } from './screens';
import { FriendsScreen } from './social';
import { PlayerSheet } from './players';
import { PlayerAvatar } from './PlayerAvatar';

let root, container;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = child => act(() => root.render(<I18nProvider>{child}</I18nProvider>));
const social = { requests: [], friends: [], dms: {}, outgoingRequests: new Set() };

test('ranking podium and remaining rows render illustrated identities rather than catalogue IDs', () => {
  const entries = ['fox','robot','brain','ninja'].map((avatar,i)=>({avatar,id:String(i),name:`Player ${i}`,rank:i+1,level:1,xp:10,winRate:50}));
  render(<LeaderboardContent board={{entries,total:4}} />);
  expect([...container.querySelectorAll('.player-avatar')].map(el=>el.dataset.avatar)).toEqual(['fox','robot','brain','ninja']);
  expect(container.querySelector('.podium-avatar').textContent).toBe('');
  expect(container.querySelector('.global-avatar').textContent).toBe('');
});

test('friend requests, friend rows and player sheets share the illustrated identity', () => {
  const players = { viewing: { profile: { id: 'c', name: 'Camille', avatar: 'cat', level: 1, followers: 0, following: 0, games: 0, topics: [] } }, close: () => {} };
  render(<><FriendsScreen social={{...social,requests:[{id:'a',name:'Alex',avatar:'fox'}],friends:[{id:'b',name:'Sam',avatar:'owl'}]}} />
    <PlayerSheet players={players} social={social} /></>);
  expect([...container.querySelectorAll('.player-avatar')].map(el=>el.dataset.avatar)).toEqual(['fox','owl','cat']);
  expect(container.querySelector('.friend-ava').textContent).toBe('');
  expect(container.querySelector('.profile-avatar').textContent).toBe('');
});

test('profile editor offers the free starter and server-owned avatars only', () => {
  render(<ProfileContent avatar="fox" name="Sisi" stats={{level:1,ownedItems:['fox']}} social={social} />);
  act(()=>container.querySelector('.pf-edit-dot').click());
  expect([...container.querySelectorAll('.avatar-opt .player-avatar')].map(el=>el.dataset.avatar)).toEqual(['fox','robot']);
});

const photo = `/profile-photos/${'a'.repeat(24)}-${'b'.repeat(32)}.jpg`;
test('personal photos render in ranking, friends and profile while unsafe URLs fall back', () => {
  render(<><LeaderboardContent board={{entries:[{avatar:photo,id:'a',name:'Alex',rank:1,level:1,xp:10,winRate:50}],total:1}} />
    <FriendsScreen social={{...social,friends:[{id:'b',name:'Sam',avatar:photo}]}} />
    <ProfileContent avatar={photo} name="Alex" stats={{level:1}} social={social} />
    <PlayerAvatar avatar="https://evil.test/photo.svg" /></>);
  expect(container.querySelectorAll('img.player-avatar-photo')).toHaveLength(3);
  expect(container.querySelectorAll('.player-avatar--photo')).toHaveLength(3);
  expect(container.querySelector('.pf-avatar img').getAttribute('src')).toContain(photo);
  expect(container.querySelectorAll('img[src*="evil"]')).toHaveLength(0);
});
test('photo editor can select a fallback and cancel without changing public identity', () => {
  const save = jest.fn();
  render(<ProfileContent avatar={photo} name="Alex" stats={{level:1,equippedItems:{avatars:'fox'},ownedItems:['fox']}} social={social} onSaveProfile={save} />);
  act(()=>container.querySelector('.pf-edit-dot').click());
  expect(container.querySelector('input[type=file]').accept).toBe('image/jpeg,image/png,image/webp');
  act(()=>container.querySelector('.avatar-opt').click());
  expect(container.querySelector('.pf-avatar img')).not.toBeNull();
  act(()=>container.querySelector('.profile-editor-cancel').click());
  expect(container.querySelector('.pf-avatar img')).not.toBeNull();
  expect(save).not.toHaveBeenCalled();
});
test('failed profile save retains the old personal identity and shows an accessible error', async () => {
  const save = jest.fn().mockRejectedValue(new Error('Envoi indisponible'));
  render(<ProfileContent avatar={photo} name="Alex" stats={{level:1,ownedItems:['fox']}} social={social} onSaveProfile={save} />);
  act(()=>container.querySelector('.pf-edit-dot').click());
  act(()=>container.querySelector('.avatar-opt').click());
  await act(async () => container.querySelector('.profile-editor-save').click());
  expect(save).toHaveBeenCalled();
  expect(container.querySelector('.pf-avatar img').getAttribute('src')).toContain(photo);
  expect(container.querySelector('[role=alert]').textContent).toBe('Envoi indisponible');
  expect(container.querySelector('.profile-editor-save').disabled).toBe(false);
});
