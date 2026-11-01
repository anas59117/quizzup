const test = require('node:test');
const assert = require('node:assert/strict');
const { send, MAX_BUFFERED_BYTES } = require('./transport');

test('slow peers cannot grow their output buffer indefinitely or affect healthy peers', () => {
  let dropped = 0;
  const slow = { readyState: 1, bufferedAmount: MAX_BUFFERED_BYTES, terminate() { dropped++; }, send() { assert.fail('do not queue more bytes'); } };
  assert.equal(send(slow, { type: 'question' }), false);
  assert.equal(dropped, 1);
  const messages = [];
  assert.equal(send({ readyState: 1, bufferedAmount: 0, send(value, callback) { messages.push(JSON.parse(value)); callback(); } }, { type: 'question' }), true);
  assert.deepEqual(messages, [{ type: 'question' }]);
});

test('closed transports and send failures do not throw through the game loop', () => {
  assert.equal(send(null, {}), false);
  assert.equal(send({ readyState: 3 }, {}), false);
  let dropped = 0;
  assert.equal(send({ readyState: 1, send() { throw new Error('connection reset'); }, terminate() { dropped++; } }, {}), false);
  assert.equal(dropped, 1);
});

test('asynchronous send errors release the failed socket', () => {
  let dropped = 0;
  send({ readyState: 1, send(_, callback) { callback(new Error('broken pipe')); }, terminate() { dropped++; } }, {});
  assert.equal(dropped, 1);
});

test('a valid large inbox snapshot is deliverable to a healthy empty transport', () => {
  let delivered = false;
  const inbox = { type: 'conversations_list', conversations: Array.from({ length: 200 }, (_, i) => ({
    peer: { id: `guest_friend_${i}_12345678901234567890`, name: '漢'.repeat(20), avatar: '/profile-photos/1234567890123456789012345678901234567890.jpg' },
    lastMessage: { id: `message_${i}_12345678901234567890`, fromId: `guest_friend_${i}_12345678901234567890`, toId: 'guest_viewer_12345678901234567890', createdAt: '2026-11-01T00:00:00Z', kind: 'text', text: '漢'.repeat(300), clientMessageId: 'x'.repeat(80) },
  })) };
  assert(Buffer.byteLength(JSON.stringify(inbox)) > MAX_BUFFERED_BYTES);
  assert.equal(send({ readyState: 1, bufferedAmount: 0, send() { delivered = true; }, terminate() { assert.fail('valid inbox should not disconnect'); } }, inbox), true);
  assert(delivered);
});
