const test = require('node:test');
const assert = require('node:assert/strict');
test('public content filters obvious French/English abuse with normalized whole words', () => {
  const { contentAllowed } = require('./content-filter');
  for (const text of ['fuck you', 'FUCK\u200b YOU', 'va te faire foutre', 'sale connard', 'n1gger']) assert.equal(contentAllowed(text), false, text);
  for (const text of ['Bonjour !', 'The assassin in this film', 'Scunthorpe', 'Un bon match', 'Classical music']) assert.equal(contentAllowed(text), true, text);
});
test('WebSocket public mutations reject objectionable text with stable codes', { timeout: 15000 }, async () => {
  const { isolatedServer } = require('./test-support/isolated-server.cjs');
  const WebSocket = require('ws');
  const server = await isolatedServer(); let ws;
  try {
    const guest = await (await fetch(`http://127.0.0.1:${server.port}/auth/guest`, { method: 'POST' })).json();
    const events = []; ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`); ws.on('message', raw => events.push(JSON.parse(raw)));
    await new Promise((resolve, reject) => { ws.once('open', resolve); ws.once('error', reject); });
    const send = data => ws.send(JSON.stringify(data));
    const wait = async type => { for (let i = 0; i < 100; i++) { const index = events.findIndex(e => e.type === type); if (index >= 0) return events.splice(index, 1)[0]; await new Promise(r => setTimeout(r, 20)); } throw Error(`Missing ${type}`); };
    send({ type: 'identify', idToken: guest.token, name: 'Review Player', avatar: 'robot' }); await wait('identified');
    send({ type: 'profile_update', name: 'sale connard', avatar: 'robot' }); assert.equal((await wait('profile_update_failed')).code, 'CONTENT_NOT_ALLOWED');
    send({ type: 'post_create', text: 'fuck you', category: 'harry_potter' }); assert.equal((await wait('community_error')).code, 'CONTENT_NOT_ALLOWED');
    send({ type: 'post_create', text: 'Who is your favourite character?', category: 'harry_potter' }); const post = (await wait('post_created')).post;
    send({ type: 'post_comment', postId: post.id, text: 'va te faire foutre' }); assert.equal((await wait('community_error')).code, 'CONTENT_NOT_ALLOWED');
    send({ type: 'post_comments', postId: post.id }); assert.deepEqual((await wait('post_comments')).comments, []);
  } finally { ws?.terminate(); await server.close(); }
});
