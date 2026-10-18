import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Messenger } from './Messenger';
import { I18nProvider } from './i18n';
global.IS_REACT_ACT_ENVIRONMENT = true;
let root, container;
beforeEach(() => { localStorage.setItem('quizzup-lang', 'en'); container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container); });
afterEach(() => { act(() => root.unmount()); container.remove(); });
const base = () => ({ friends: [{id:'peer',name:'Camille',online:true}], requests: [], conversations: [], messages: {}, connected: true, clientId:'me', openConversation:jest.fn(),closeConversation:jest.fn(),requestConversations:jest.fn(),sendDM:jest.fn(() => false),createChallenge:jest.fn(() => true),respondChallenge:jest.fn(),requestHistory:jest.fn() });
const render = social => act(() => root.render(<I18nProvider><Messenger social={social}/></I18nProvider>));
test('inbox uses real peers and server unread then opens a thread', () => {
 const social=base(); social.conversations=[{peer:social.friends[0],unread:3,lastMessage:{text:'Hello',kind:'text',createdAt:'2026-10-18'}}]; social.unreadCount=3;
 render(social); expect(container.querySelector('.messenger-row').textContent).toContain('Hello'); expect(container.querySelector('.messenger-row-meta b').textContent).toBe('3');
 act(() => container.querySelector('.messenger-row').click()); expect(social.openConversation).toHaveBeenCalledWith('peer');
});
test('thread actions send selected theme; Escape closes chooser then thread', () => {
 const social={...base(),activeConversationId:'peer'};render(social);
 act(() => container.querySelector('.messenger-challenge').click());
 expect(container.querySelector('[role="dialog"]')).not.toBeNull();
 act(() => container.querySelector('.messenger-themes button').click()); expect(social.createChallenge).toHaveBeenCalledWith('peer','movies','live');
 act(() => window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape'}))); expect(social.closeConversation).toHaveBeenCalled();
});
test('challenge acceptance uses canonical recipient identity and disables duplicate pending actions', () => {
 const social={...base(),activeConversationId:'peer',messages:{peer:[{id:'a',fromId:'peer',toId:'me',kind:'challenge',createdAt:'2026-10-18',challenge:{id:'challenge',fromId:'peer',toId:'me',category:'music',status:'pending',expiresAt:'2099-01-01'}}]}};
 render(social); const accept=container.querySelector('.messenger-actions button');act(() => accept.click());expect(social.respondChallenge).toHaveBeenCalledWith('challenge',true);
 render({...social,pendingActions:{challenge:true}});expect(container.querySelector('.messenger-actions button').disabled).toBe(true);
});
test('draft survives a failed send and clears only after a canonical acknowledgement', () => {
 const social={...base(),activeConversationId:'peer'};render(social);
 const textarea=container.querySelector('textarea');
 act(() => { Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set.call(textarea,'Hello'); textarea.dispatchEvent(new Event('input',{bubbles:true})); });
 act(() => container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(social.sendDM).toHaveBeenCalledWith('peer','Hello'); expect(textarea.value).toBe('Hello'); expect(container.querySelector('[role="alert"]').textContent).toContain('draft');
 social.sendDM.mockReturnValue(true);
 act(() => container.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})));
 expect(textarea.value).toBe('Hello');
 render({...social,messages:{peer:[{id:'ack',fromId:'me',toId:'peer',kind:'text',text:'Hello',createdAt:'2026-10-18'}]}});
 expect(textarea.value).toBe('');
});
test('take turns chooser sends async mode while recipient cannot play before accepting', () => {
 const social={...base(),activeConversationId:'peer',playAsyncChallenge:jest.fn(),messages:{peer:[{id:'async',fromId:'peer',toId:'me',kind:'challenge',createdAt:'2026-10-18',challenge:{id:'c',mode:'async',fromId:'peer',toId:'me',category:'music',status:'pending',expiresAt:'2099-01-01'}}]}};
 render(social);expect(container.querySelector('.messenger-duel').textContent).not.toContain('Play my');
 act(()=>container.querySelector('.messenger-challenge').click());expect(container.querySelector('.messenger-modes button').getAttribute('aria-pressed')).toBe('true');
 act(()=>container.querySelectorAll('.messenger-modes button')[1].click());act(()=>container.querySelector('.messenger-themes button').click());expect(social.createChallenge).toHaveBeenCalledWith('peer','movies','async');
});
