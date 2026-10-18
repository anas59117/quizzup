import { mergeMessages, messagePeer, initialSocialData, socialDataReducer as reduce } from './social-data';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useSocial } from './social';
global.IS_REACT_ACT_ENVIRONMENT = true;
const message = (id, fromId = 'me', toId = 'peer') => ({ id, fromId, toId, kind: 'text', text: id, createdAt: `2026-10-18T12:00:0${id}Z` });
test('concurrent histories preserve live messages and dedupe IDs with canonical direction', () => {
  let state = reduce(initialSocialData, { type: 'dm', message: message('3', 'peer', 'me'), clientId: 'me' });
  for (const targetId of ['peer', 'other', 'peer']) state = reduce(state, { type: 'dm_history', targetId, messages: [message('1'), message('2')] });
  expect(state.messages.peer.map(m => m.id)).toEqual(['1', '2', '3']);
  expect(state.messages.other).toHaveLength(2);
  expect(messagePeer(message('1'), 'me')).toBe('peer');
  expect(messagePeer(message('1', 'peer', 'me'), 'me')).toBe('peer');
  expect(mergeMessages([], [message('1'), message('1')])).toHaveLength(1);
});
test('reconnect replaces authoritative unread and inbox; arrival does not invent unread', () => {
  let state = reduce(initialSocialData, { type: 'conversations_list', conversations: [{ peer: { id: 'peer' }, unread: 4 }], unreadCount: 4 });
  state = reduce(state, { type: 'dm', message: message('1', 'peer', 'me'), clientId: 'me' });
  expect(state.unreadCount).toBe(4);
  state = reduce(state, { type: 'dm_read', targetId: 'peer' }); expect(state.unreadCount).toBe(0);
  state = reduce(state, { type: 'conversations_list', conversations: [], unreadCount: 0 }); expect(state.conversations).toEqual([]);
});
test('feature errors release pending controls; retry recovers; challenge update patches cards', () => {
  let state = reduce(initialSocialData, { type: 'pending', key: 'peer' });
  state = reduce(state, { type: 'social_error', action: 'dm', code: 'not_friend' });
  expect(state.pendingActions).toEqual({}); expect(state.error.code).toBe('not_friend');
  state = reduce(state, { type: 'loading', key: 'peer' }); expect(state.error).toBeNull();
  state = reduce({ ...state, messages: { peer: [{ ...message('1'), challenge: { id: 'duel' } }] } }, { type: 'challenge_updated', challenge: { id: 'duel', status: 'accepted' } });
  expect(state.messages.peer[0].challenge.status).toBe('accepted');
});
test('hook rejects offline sends, reloads on reconnect, and reads only visible active threads', () => {
  jest.useFakeTimers();
  const container = document.createElement('div'); const root = createRoot(container);
  const ref = { current: { readyState: 3, send: jest.fn() } }; let social;
  function Fixture() { social = useSocial(ref, 'me'); return null; }
  act(() => root.render(<Fixture />)); expect(social.sendDM('peer', 'hello')).toBe(false);
  expect(ref.current.send).not.toHaveBeenCalled();
  act(() => { ref.current = { readyState: 1, send: jest.fn() }; jest.advanceTimersByTime(1000); });
  expect(ref.current.send).toHaveBeenCalledWith(JSON.stringify({ type: 'conversations_list' }));
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
  act(() => social.openConversation('peer'));
  act(() => social.handleMessage({ type: 'dm', message: message('1', 'peer', 'me') }));
  expect(ref.current.send.mock.calls.map(call => JSON.parse(call[0]).type)).not.toContain('dm_read');
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  expect(ref.current.send).toHaveBeenCalledWith(JSON.stringify({ type: 'dm_read', targetId: 'peer' }));
  act(() => social.closeConversation()); ref.current.send.mockClear();
  act(() => social.handleMessage({ type: 'dm', message: message('2', 'peer', 'me') }));
  expect(ref.current.send.mock.calls.map(call => JSON.parse(call[0]).type)).not.toContain('dm_read');
  act(() => root.unmount()); container.remove(); jest.useRealTimers();
});
