import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from './i18n';
import { HomeContent } from './screens';
import { NavBar, TopControls } from './ui';
let root, container;
beforeEach(() => { global.IS_REACT_ACT_ENVIRONMENT = true; localStorage.setItem('quizzup-lang','fr'); container = document.createElement('div'); document.body.append(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const render = element => act(() => root.render(<I18nProvider>{element}</I18nProvider>));
const click = text => act(() => [...document.querySelectorAll('button')].find(b => b.textContent.includes(text)).click());
test('personal topics precede distinct discovery and expose only known topic levels', () => {
  render(<HomeContent stats={{followedThemes:['rap_fr','minecraft'],recentThemes:[{key:'harry_potter',level:3}],topics:[{key:'rap_fr',level:5}]}} />);
  expect([...container.querySelectorAll('.topics-grid-v4 .tile-v4')].map(el=>el.dataset.topic)).toEqual(['rap_fr','minecraft','harry_potter','spider_man']);
  expect([...container.querySelectorAll('.personal-theme-level')].map(el=>el.textContent)).toEqual(['Niveau 5','Niveau 3']);
  const all = [...container.querySelectorAll('.tile-v4')].map(el=>el.dataset.topic); expect(new Set(all).size).toBe(all.length);
});
test('community teaser uses real content and opens its post', () => {
  const open=jest.fn(); render(<HomeContent stats={{}} communityPost={{id:'real',authorName:'Nadia',authorAvatar:'fox',category:'rap_fr',text:'Ton meilleur concert ?',commentsCount:7}} onOpenCommunity={open} />);
  expect(container.querySelector('.home-community-teaser').textContent).toContain('Nadia');
  expect(container.querySelector('.home-community-teaser').textContent).toContain('7 réponses');
  expect(container.querySelector('.home-community-avatar .player-avatar').dataset.avatar).toBe('fox');
  click('Ton meilleur concert'); expect(open).toHaveBeenCalledWith('real');
});
test('home settings show one gear and put sound inside', () => {
  const mute=jest.fn(),theme=jest.fn(); render(<TopControls home muted toggleMute={mute} theme="dark" toggleTheme={theme} />);
  expect(container.querySelectorAll('button')).toHaveLength(1); act(()=>container.querySelector('button').click()); click('Activer le son'); click('Mode clair');
  expect(mute).toHaveBeenCalledTimes(1); expect(theme).toHaveBeenCalledTimes(1); expect(container.textContent).toContain('Switch to English');
});
test('messages has current-page state and capped unread badge; play choices call real callbacks', () => {
  const quick=jest.fn(),invite=jest.fn(),join=jest.fn(); render(<NavBar active="messages" unreadCount={123} onNav={jest.fn()} onQuickMatch={quick} onInviteFriend={invite} onJoinFriend={join} />);
  expect(container.querySelector('[aria-current=page]').textContent).toContain('Messages'); expect(container.querySelector('.nav-unread').textContent).toBe('99+');
  for (const label of ['Solo','Duel rapide','Inviter un ami','J’ai un code']) { act(()=>container.querySelector('.nav-bolt').click()); click(label); expect(document.querySelector('[role=dialog]')).toBeNull(); }
  expect(quick.mock.calls).toEqual([['solo'],['duel']]); expect(invite).toHaveBeenCalledTimes(1); expect(join).toHaveBeenCalledTimes(1);
});
test('sheet traps focus and Escape restores trigger', () => {
  render(<NavBar onNav={jest.fn()} onQuickMatch={jest.fn()} />); const trigger=container.querySelector('.nav-bolt'); trigger.focus(); act(()=>trigger.click());
  const dialog=document.querySelector('[role=dialog]'), buttons=[...dialog.querySelectorAll('button')]; expect(document.activeElement).toBe(buttons[0]);
  act(()=>buttons[0].dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',shiftKey:true,bubbles:true,cancelable:true}))); expect(document.activeElement).toBe(buttons[buttons.length-1]);
  act(()=>dialog.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))); expect(document.querySelector('[role=dialog]')).toBeNull(); expect(document.activeElement).toBe(trigger);
});

test('pending play action is disabled and sheet Back dismisses before navigation', () => {
  render(<NavBar onNav={jest.fn()} onQuickMatch={jest.fn()} pending />);
  expect(container.querySelector('.nav-bolt').disabled).toBe(true);
  render(<NavBar onNav={jest.fn()} onQuickMatch={jest.fn()} />);
  act(()=>container.querySelector('.nav-bolt').click());
  const back = new Event('quizzup-play-back',{cancelable:true});
  act(()=>window.dispatchEvent(back));
  expect(back.defaultPrevented).toBe(true); expect(document.querySelector('[role=dialog]')).toBeNull();
  act(()=>container.querySelector('.nav-bolt').click());
  act(()=>document.querySelector('.play-sheet-backdrop').click());
  expect(document.querySelector('[role=dialog]')).toBeNull();
});
