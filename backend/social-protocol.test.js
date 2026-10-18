const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const WebSocket = require('ws');
const jpeg = Buffer.from(
  'ffd8ffc00011080020002003011100021100031100ffda000c03010002000300003f00112233ffd9',
  'hex',
);

test(
  'offline DM, friend-only privacy, community answers/media and live challenge work over authenticated WS',
  { timeout: 30000 },
  async () => {
    const dir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'quizzup-photo-identity-'),
    );
    const probe = net.createServer().listen(0, '127.0.0.1');
    await new Promise((resolve) => probe.once('listening', resolve));
    const port = probe.address().port;
    await new Promise((resolve) => probe.close(resolve));
    const origin = `http://127.0.0.1:${port}`;
    let child;
    const sockets = [];
    const start = async () => {
      child = spawn(process.execPath, ['server.js'], {
        cwd: __dirname,
        windowsHide: true,
        env: {
          ...process.env,
          PORT: String(port),
          DATA_DIR: dir,
          CORS_ORIGIN: '*',
          GUEST_AUTH_SECRET:
            'photo-integration-secret-with-thirty-two-characters',
        },
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      await new Promise((resolve, reject) => {
        const timer = setTimeout(
          () => reject(new Error('Backend did not start')),
          8000,
        );
        child.once('error', reject);
        child.once('exit', (code) => {
          clearTimeout(timer);
          reject(new Error(`Backend exited ${code}`));
        });
        child.stdout.on('data', (data) => {
          if (String(data).includes('backend on http')) {
            clearTimeout(timer);
            resolve();
          }
        });
      });
    };
    const stop = async () => {
      sockets.splice(0).forEach((ws) => ws.terminate());
      if (!child || child.exitCode !== null) return;
      await new Promise((resolve) => {
        child.once('exit', resolve);
        child.kill('SIGTERM');
      });
    };
    const socket = async (token) => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
      sockets.push(ws);
      const messages = [];
      ws.on('message', (data) => messages.push(JSON.parse(data)));
      await new Promise((resolve, reject) => {
        ws.once('open', resolve);
        ws.once('error', reject);
      });
      const wait = (type) =>
        new Promise((resolve, reject) => {
          const started = Date.now();
          const timer = setInterval(() => {
            const index = messages.findIndex(
              (message) => message.type === type,
            );
            if (index !== -1) {
              clearInterval(timer);
              resolve(messages.splice(index, 1)[0]);
            } else if (Date.now() - started > 4000) {
              clearInterval(timer);
              reject(new Error(`Missing ${type}: ${JSON.stringify(messages)}`));
            }
          }, 10);
        });
      ws.send(
        JSON.stringify({
          type: 'identify',
          idToken: token,
          name: 'Stale',
          avatar: 'robot',
          presentationVersion: 1,
        }),
      );
      return { ws, wait, identified: await wait('identified') };
    };
    try {
      await start();
      const identity = await (
        await fetch(`${origin}/auth/guest`, { method: 'POST' })
      ).json();
      const other = await (
        await fetch(`${origin}/auth/guest`, { method: 'POST' })
      ).json();
      let first = await socket(identity.token),
        second = await socket(other.token);
      const send = (peer, data) => peer.ws.send(JSON.stringify(data));
      send(first, { type: 'dm', targetId: other.uid, text: 'stranger' });
      assert.equal((await first.wait('social_error')).code, 'NOT_FRIENDS');
      send(first, { type: 'friend_request', targetId: other.uid });
      await second.wait('friend_request_received');
      send(second, { type: 'friend_accept', requesterId: identity.uid });
      await first.wait('friend_added');
      await second.wait('friend_added');
      second.ws.close();
      await new Promise((r) => second.ws.once('close', r));
      send(first, {
        type: 'dm',
        targetId: other.uid,
        text: 'offline',
        clientMessageId: 'one',
      });
      const sent = (await first.wait('dm_sent')).message;
      assert.equal(sent.fromId, identity.uid);
      await new Promise((r) => setTimeout(r, 1100));
      await stop();
      await start();
      first = await socket(identity.token);
      second = await socket(other.token);
      assert.equal((await second.wait('conversations_list')).unreadCount, 1);
      send(second, { type: 'dm_history', targetId: identity.uid });
      assert.equal((await second.wait('dm_history')).messages[0].id, sent.id);
      send(second, { type: 'dm_read', targetId: identity.uid });
      await second.wait('dm_read');
      assert.equal((await second.wait('conversations_list')).unreadCount, 0);
      const uploaded = await fetch(`${origin}/community-media`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${identity.token}`,
          'Content-Type': 'image/jpeg',
        },
        body: jpeg,
      });
      assert.equal(uploaded.status, 200);
      const { mediaUrl } = await uploaded.json();
      assert.equal((await fetch(origin + mediaUrl)).status, 200);
      send(second, { type: 'post_create', text: 'stolen image', mediaUrl });
      assert.equal(
        (await second.wait('community_error')).code,
        'INVALID_MEDIA',
      );
      send(first, {
        type: 'post_create',
        text: 'Question',
        category: 'nba',
        mediaUrl,
        question: {
          prompt: '2+2',
          answers: ['1', '2', '3', '4'],
          correctIndex: 3,
        },
      });
      const post = (await first.wait('post_created')).post;
      assert.equal(post.question.correctIndex, undefined);
      send(first, {
        type: 'post_question_answer',
        postId: post.id,
        answerIndex: 3,
      });
      assert.equal((await first.wait('post_question_result')).correct, true);
      send(first, {
        type: 'challenge_create',
        targetId: other.uid,
        category: 'nba',
      });
      const challenge = (await first.wait('challenge_updated')).challenge;
      await second.wait('challenge_updated');
      send(second, {
        type: 'challenge_respond',
        challengeId: challenge.id,
        accept: true,
      });
      await first.wait('game_start');
      await second.wait('game_start');
      assert.equal(
        (await second.wait('challenge_updated')).challenge.status,
        'accepted',
      );
    } finally {
      await stop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  },
);
