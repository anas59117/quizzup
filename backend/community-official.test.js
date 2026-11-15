const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

test('launch discussions are three text posts from QuizzUp with no invented engagement', () => {
  const { createStarterPosts } = require('./community-starters');
  const rows = createStarterPosts(123456);
  assert.equal(rows.length, 3);
  for (const row of rows) {
    assert.equal(row.authorName, 'QuizzUp');
    assert.equal(row.authorId, null);
    assert.equal(row.isOfficial, true);
    assert.equal(!!row.isDemo, false);
    assert.equal(row.mediaUrl, null);
    assert.equal(row.createdAt, 123456);
    assert.deepEqual(row.comments, []);
    assert.deepEqual(row.reactedBy, []);
  }
});

test('upgrading the demo feed preserves old discussions and real players through restart', async () => {
  process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'quizz-official-'));
  const legacy = {
    id: 'community-starter-v1-avengers', authorId: null, authorName: 'AvengersHQ',
    authorAvatar: 'robot', category: 'marvel', text: 'Infinity War ou Endgame ?',
    isDemo: true, createdAt: 1000, reactedBy: ['alice'], reportedBy: [],
    comments: [{ id: 'old-comment', authorId: 'alice', authorName: 'Alice',
      authorAvatar: 'fox', text: 'Infinity War', createdAt: 1001, reactedBy: ['bob'] }],
  };
  const real = { ...legacy, id: 'real-post', authorId: 'bob', authorName: 'Bob', isDemo: false, comments: [] };
  fs.writeFileSync(path.join(process.env.DATA_DIR, 'posts.json'), JSON.stringify({starterVersion: 1, posts: [legacy, real]}));
  let posts = require('./posts');
  assert.equal(posts.seedStarterPosts(), 3);
  assert.equal(posts.getFeed(100).some(p => p.id === legacy.id), false);
  assert.ok(posts.getFeed(100).some(p => p.id === real.id));
  assert.equal(posts.getFeed(100).filter(p => p.isOfficial).length, 3);
  assert.equal(posts.getPost(legacy.id, 'alice').reactions, 1);
  assert.equal(posts.getComments(legacy.id, 'bob')[0].reacted, true);
  const spoof = posts.addPost('spoof', 'QuizzUp', 'robot', 'marvel', 'Not official', {isOfficial: true});
  assert.equal(!!spoof.isOfficial, false);
  await require('./json-writer').flushAllJsonWriters();
  delete require.cache[require.resolve('./posts')];
  posts = require('./posts');
  assert.equal(posts.seedStarterPosts(), 0);
  assert.equal(posts.getFeed(100).filter(p => p.isOfficial).length, 3);
  assert.equal(posts.getFeed(100).some(p => p.isDemo), false);
  assert.equal(posts.getComments(legacy.id, 'bob')[0].id, 'old-comment');
  assert.equal(posts.getPost(legacy.id, 'alice').reactions, 1);
});
