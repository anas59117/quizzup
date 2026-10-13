import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { LeaderboardContent, ProfileContent } from './screens';
import { FriendsScreen } from './social';
import { PlayerSheet } from './players';

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
