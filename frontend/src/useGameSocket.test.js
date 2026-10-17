import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { useGameSocket } from './useGameSocket';

const photo = `/profile-photos/${'a'.repeat(24)}-${'b'.repeat(32)}.jpg`;
let root, container, transport, sockets, originalWebSocket;
const user = { uid: 'verified-owner', getIdToken: async () => 'verified-token' };
class BrowserSocket {
  constructor() { this.readyState = 0; this.messages = []; sockets.push(this); }
  send(value) { this.messages.push(JSON.parse(value)); }
  async open() { this.readyState = 1; await this.onopen(); }
  receive(message) { this.onmessage({ data: JSON.stringify(message) }); }
  close() { this.readyState = 3; this.onclose?.(); }
}
function Harness({ name = 'Old name', avatar = 'robot' }) {
  transport = useGameSocket({ name, avatar, firebaseUser: user, shouldRecover: true,
    onMessageRef: { current: () => {} }, onFatalError: jest.fn(), onPendingClear: jest.fn() });
  return null;
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.useFakeTimers(); sockets = [];
  originalWebSocket = global.WebSocket; global.WebSocket = BrowserSocket;
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container); act(() => root.render(<Harness />));
});
afterEach(() => {
  act(() => root.unmount()); container.remove();
  global.WebSocket = originalWebSocket; jest.useRealTimers();
});
async function identify(socket) {
  await act(async () => socket.open());
  act(() => socket.receive({ type: 'identified', reconnected: false, roomReconnected: false }));
}

test('identified connection transmits edited name and uploaded photo without changing authenticated client ID', async () => {
  act(() => transport.connect({ type: 'identify' }));
  await identify(sockets[0]);
  act(() => transport.connect({ type: 'profile_update', name: 'Alex', avatar: photo, clientId: 'spoofed' }));
  expect(sockets[0].messages.at(-1)).toEqual({ type: 'profile_update', name: 'Alex', avatar: photo, clientId: user.uid });
  act(() => transport.connect({ type: 'profile_update', name: 'Alex', avatar: 'fox' }));
  expect(sockets[0].messages.at(-1).avatar).toBe('fox');
});

test('queued profile mutation retains its photo and edited name through reconnect and identity rerender', async () => {
  act(() => transport.connect({ type: 'identify' }));
  await identify(sockets[0]);
  act(() => sockets[0].close());
  act(() => jest.advanceTimersByTime(250));
  expect(sockets).toHaveLength(2);
  act(() => transport.connect({ type: 'profile_update', name: 'Alex', avatar: photo }));
  act(() => root.render(<Harness name="Restored name" avatar="owl" />));
  await identify(sockets[1]);
  expect(sockets[1].messages[0]).toMatchObject({ type: 'identify', name: 'Restored name', avatar: 'owl', idToken: 'verified-token' });
  expect(sockets[1].messages[1]).toEqual({ type: 'profile_update', name: 'Alex', avatar: photo, clientId: user.uid });
});

test('gameplay actions continue using current identity defaults rather than supplied stale fields', async () => {
  act(() => transport.connect({ type: 'join', name: 'stale', avatar: 'fox', clientId: 'spoofed' }));
  await identify(sockets[0]);
  expect(sockets[0].messages.at(-1)).toEqual({ type: 'join', name: 'Old name', avatar: 'robot', clientId: user.uid });
});
