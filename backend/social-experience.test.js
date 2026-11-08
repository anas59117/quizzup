const test = require('node:test'),
  assert = require('node:assert/strict'),
  fs = require('fs'),
  os = require('os'),
  path = require('path');
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'quizz-social-'));
const { createMessaging } = require('./messaging');
const { createChallenges } = require('./challenges');
const friends = (a, b) =>
  ['a', 'b'].includes(a) && ['a', 'b'].includes(b) && a !== b;
const file = (name) => path.join(process.env.DATA_DIR, name);
test('offline messages persist; histories and read cursors are private and bounded', async () => {
  const opts = {
    file: file('test-messages.json'),
    friends,
    profile: (id) => ({ id }),
  };
  const m = createMessaging(opts);
  assert.throws(() => m.send('stranger', 'a', 'no'), /NOT_FRIENDS/);
  for (let i = 0; i < 105; i++) m.send('a', 'b', 'hello ' + i);
  assert.equal(m.summaries('b').unreadCount, 100);
  m.read('b', 'a');
  assert.equal(m.summaries('b').unreadCount, 0);
  const last = m.send('a', 'b', 'offline', { clientMessageId: 'once' });
  assert.equal(
    m.send('a', 'b', 'retry', { clientMessageId: 'once' }).id,
    last.id,
  );
  await m.flush();
  const reload = createMessaging(opts);
  assert.equal(reload.summaries('b').unreadCount, 1);
  assert.equal(reload.history('b', 'a').messages.length, 40);
  assert.equal(reload.history('b', 'a').hasMore, true);
  assert.throws(() => reload.history('stranger', 'a'), /NOT_FRIENDS/);
});
test('challenge ownership, duplicate, busy and race guards; failed start remains pending', async () => {
  const c = createChallenges({ file: file('test-challenges.json'), friends });
  const first = c.create('a', 'b', 'nba');
  assert.throws(() => c.create('b', 'a', 'nba'), /PENDING/);
  await assert.rejects(c.respond('a', first.id, true, {}), /FORBIDDEN/);
  await assert.rejects(
    c.respond('b', first.id, true, { available: () => false }),
    /UNAVAILABLE/,
  );
  await assert.rejects(
    c.respond('b', first.id, true, {
      available: () => true,
      start: async () => {
        throw Error('fail');
      },
    }),
    /fail/,
  );
  assert.equal(c.get(first.id).status, 'pending');
  let resolve;
  const pending = c.respond('b', first.id, true, {
    available: () => true,
    start: () =>
      new Promise((r) => {
        resolve = r;
      }),
  });
  await assert.rejects(
    c.respond('b', first.id, true, { available: () => true }),
    /UNAVAILABLE/,
  );
  resolve({});
  await pending;
  assert.equal(c.get(first.id).status, 'accepted');
  await c.flush();
});
test('community hides correct answer until play; comments persist and are bounded', async () => {
  const posts = require('./posts');
  const p = posts.addPost('a', 'Alice', 'A', 'nba', 'Question', {
    question: {
      prompt: '2+2?',
      answers: ['1', '2', '3', '4'],
      correctIndex: 3,
    },
  });
  assert.equal(p.question.correctIndex, undefined);
  assert.equal(posts.answerQuestion(p.id, 3).correct, true);
  assert.equal(posts.answerQuestion(p.id, 8), null);
  for (let i = 0; i < 103; i++) posts.addComment(p.id, 'b', 'Bob', 'B', 'test');
  assert.equal(posts.getComments(p.id).length, 100);
  assert.equal(posts.addComment(p.id, 'b', 'Bob', 'B', ''), null);
  await require('./json-writer').flushAllJsonWriters();
  delete require.cache[require.resolve('./posts')];
  assert.equal(require('./posts').getComments(p.id).length, 100);
});
test('community previews respect the viewing player and preserve comment counts', async () => {
  const posts = require('./posts');
  const follows = require('./follows');
  const userReports = require('./user-reports');
  const post = posts.addPost('author', 'Author', 'A', 'nba', 'Community post');
  assert.equal(post.authorFollowed, false);
  assert.equal(post.lastComment, null);

  follows.follow('viewer', 'author');
  posts.addComment(post.id, 'author', 'Author', 'A', 'First comment');
  const { comment } = posts.addComment(post.id, 'commenter', 'Commenter', 'C', 'Last comment');

  const feedPost = posts.getFeed({ viewerId: 'viewer' }).find(({ id }) => id === post.id);
  assert.equal(feedPost.authorFollowed, true);
  assert.equal(feedPost.commentsCount, 2);
  assert.deepEqual(feedPost.lastComment, comment);
  assert.equal(posts.getPost(post.id, 'commenter').authorFollowed, false);
  assert.equal(posts.getPost(post.id).lastComment, null);

  userReports.blockUser('commenter', 'viewer');
  assert.equal(posts.getPost(post.id, 'viewer').lastComment, null);
  assert.equal(posts.getPost(post.id, 'viewer').commentsCount, 2);
  userReports.unblockUser('commenter', 'viewer');
  userReports.blockUser('viewer', 'author');
  assert.equal(posts.getPost(post.id, 'viewer').lastComment, null);
  await require('./json-writer').flushAllJsonWriters();
});
