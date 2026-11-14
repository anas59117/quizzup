const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'quizz-community-'));
let posts = require('./posts');
const social = require('./social');
const reports = require('./user-reports');
const { flushAllJsonWriters } = require('./json-writer');
const make = (author = 'author', category = 'marvel') =>
  posts.addPost(author, author, 'robot', category, 'A community discussion');
const comment = (id, author, text, parentId) =>
  posts.addComment(id, author, author, 'robot', text, parentId);

test('replies accept only root comments on the same visible post', () => {
  const p = make(), other = make();
  const root = comment(p.id, 'alice', 'Root').comment;
  assert.equal(root.parentId, null);
  const reply = comment(p.id, 'bob', 'Reply', root.id).comment;
  assert.equal(reply.parentId, root.id);
  for (const parentId of [reply.id, 'missing', 42, '', {}, []])
    assert.equal(comment(p.id, 'bob', 'Invalid', parentId), null);
  assert.equal(comment(other.id, 'bob', 'Cross post', root.id), null);
  assert.equal(posts.getComments(p.id, 'viewer').length, 2);
});

test('comment reactions toggle per user without leaking identities and use current profiles', () => {
  const p = make();
  const root = comment(p.id, 'alice', 'Root').comment;
  assert.deepEqual(posts.toggleCommentReaction(p.id, root.id, 'bob'), {
    postId: p.id, commentId: root.id, actorId: 'bob', reactions: 1, reacted: true,
  });
  posts.toggleCommentReaction(p.id, root.id, 'carol');
  social.updateProfile('alice', 'New Alice', 'cat');
  const viewed = posts.getComments(p.id, 'bob')[0];
  assert.equal(viewed.authorName, 'New Alice');
  assert.equal(viewed.authorAvatar, 'cat');
  assert.equal(viewed.reactions, 2);
  assert.equal(viewed.reacted, true);
  assert.equal(Object.hasOwn(viewed, 'reactedBy'), false);
  assert.equal(posts.getComments(p.id, 'other')[0].reacted, false);
  assert.equal(posts.getPost(p.id, 'bob').lastComment.reacted, true);
  assert.equal(posts.toggleCommentReaction(p.id, root.id, 'bob').reactions, 1);
  assert.equal(posts.toggleCommentReaction(p.id, root.id, null), null);
  assert.equal(posts.toggleCommentReaction(make().id, root.id, 'bob'), null);
});

test('blocked comment identities hide their reply thread and cannot receive interactions', () => {
  const p = make('post-owner');
  const root = comment(p.id, 'blocked-root', 'Root').comment;
  comment(p.id, 'other-writer', 'Reply', root.id);
  const publicComment = comment(p.id, 'public-writer', 'Visible').comment;
  reports.blockUser('blocked-root', 'private-viewer');
  assert.deepEqual(posts.getComments(p.id, 'private-viewer').map(c => c.id), [publicComment.id]);
  assert.equal(comment(p.id, 'private-viewer', 'Blocked reply', root.id), null);
  assert.equal(posts.toggleCommentReaction(p.id, root.id, 'private-viewer'), null);
  reports.blockUser('private-viewer', 'post-owner');
  assert.equal(posts.getComments(p.id, 'private-viewer'), null);
  assert.equal(comment(p.id, 'private-viewer', 'Blocked post'), null);
  assert.equal(posts.getFeed({ viewerId: 'private-viewer' }).some(x => x.id === p.id), false);
  for (const uid of ['report1', 'report2', 'report3']) posts.reportPost(p.id, uid);
  assert.equal(posts.getComments(p.id, 'other'), null);
  assert.equal(posts.toggleCommentReaction(p.id, publicComment.id, 'other'), null);
});

test('topics filters intersect category and an explicit empty selection matches nothing', () => {
  const a = make('topic-a', 'marvel'), b = make('topic-b', 'harry_potter');
  assert.deepEqual(posts.getFeed({ categories: [] }), []);
  assert.deepEqual(posts.getFeed({ categories: ['harry_potter'], category: 'marvel' }), []);
  assert.deepEqual(posts.getFeed({ categories: ['harry_potter'], authorIds: ['topic-b'] }).map(p => p.id), [b.id]);
  assert.ok(posts.getFeed({ category: 'marvel' }).some(p => p.id === a.id));
});

test('a reply at the retention cap remains stored together with its root', () => {
  const p = make();
  const root = comment(p.id, 'old-root', 'Old root').comment;
  for (let i = 0; i < 99; i++) comment(p.id, 'writer', `New root ${i}`);
  const reply = comment(p.id, 'reply-writer', 'Reply to oldest root', root.id).comment;
  const stored = posts.getComments(p.id, 'viewer');
  assert.equal(stored.length, 100);
  assert.ok(stored.some(c => c.id === root.id));
  assert.ok(stored.some(c => c.id === reply.id));
});

test('blocked and reported posts are unavailable through detail and post reactions', () => {
  const p = make('private-author');
  reports.blockUser('private-author', 'blocked-viewer');
  assert.equal(posts.getPost(p.id, 'blocked-viewer'), null);
  assert.equal(posts.toggleReaction(p.id, 'blocked-viewer'), null);
  for (const uid of ['hide1', 'hide2', 'hide3']) posts.reportPost(p.id, uid);
  assert.equal(posts.toggleReaction(p.id, 'unblocked-viewer'), null);
});

test('startup starters are opt-in, zero-interaction, trusted and idempotent across restart', async () => {
  assert.equal(posts.getFeed(100).filter(p => p.isDemo).length, 0);
  const spoof = posts.addPost('spoofer', 'Spammer', 'robot', 'marvel', 'Spoof', {
    isDemo: true, demoAvatar: 'https://evil.test/fake.jpg',
    mediaUrl: '/images/covers/approved-v2/marvel-640.webp',
  });
  assert.equal(!!spoof.isDemo, false);
  assert.equal(!!spoof.demoAvatar, false);
  assert.equal(spoof.mediaUrl, null);
  assert.equal(posts.seedStarterPosts(), 8);
  const starters = posts.getFeed(100).filter(p => p.isDemo);
  assert.equal(starters.length, 8);
  for (const p of starters) {
    assert.equal(p.authorId, null);
    assert.match(p.demoAvatar, /^https:\/\/quizzup-ten\.vercel\.app\/images\//);
    assert.equal(p.commentsCount, 0);
    assert.equal(p.reactions, 0);
    assert.equal(p.lastComment, null);
  }
  const p = starters[0];
  const root = comment(p.id, 'real-user', 'Real comment').comment;
  const reply = comment(p.id, 'another-user', 'Real reply', root.id).comment;
  posts.toggleCommentReaction(p.id, reply.id, 'real-user');
  posts.toggleReaction(p.id, 'real-user');
  await flushAllJsonWriters();
  const saved = JSON.parse(fs.readFileSync(path.join(process.env.DATA_DIR, 'posts.json')));
  assert.equal(saved.starterVersion, 1);
  delete require.cache[require.resolve('./posts')];
  posts = require('./posts');
  assert.equal(posts.seedStarterPosts(), 0);
  assert.equal(posts.getFeed(100).filter(p => p.isDemo).length, 8);
  const reloaded = posts.getPost(p.id, 'real-user');
  assert.equal(reloaded.demoAvatar, p.demoAvatar);
  assert.equal(reloaded.mediaUrl, p.mediaUrl);
  assert.equal(reloaded.reactions, 1);
  const reloadedReply = posts.getComments(p.id, 'real-user').find(c => c.id === reply.id);
  assert.equal(reloadedReply.parentId, root.id);
  assert.equal(reloadedReply.reacted, true);
  assert.equal(reloadedReply.reactions, 1);
  // A persisted one-time version also prevents removed starters from reappearing.
  saved.posts = saved.posts.filter(row => row.id !== starters[7].id);
  fs.writeFileSync(path.join(process.env.DATA_DIR, 'posts.json'), JSON.stringify(saved));
  delete require.cache[require.resolve('./posts')];
  posts = require('./posts');
  assert.equal(posts.seedStarterPosts(), 0);
  assert.equal(posts.getPost(starters[7].id, 'real-user'), null);
  assert.ok(posts.getPost(spoof.id, 'real-user'));
});

test('normalization repairs legacy comments and rejects dangling or nested reply parents', () => {
  const { normalizePostsStore } = require('./store-normalize');
  const c = (id, parentId) => ({ id, parentId, authorId: 'a', text: id, reactedBy: ['x', 'x', null] });
  const [p] = normalizePostsStore({ posts: [{ id: 'old', text: 'Legacy', comments: [
    c('root'), c('reply', 'root'), c('nested', 'reply'), c('dangling', 'absent'), c('root'),
  ] }] });
  assert.deepEqual(p.comments.map(c => c.id), ['root', 'reply']);
  assert.equal(p.comments[0].parentId, null);
  assert.equal(p.comments[1].parentId, 'root');
  assert.deepEqual(p.comments[1].reactedBy, ['x']);
});
