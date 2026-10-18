// Topic feed — the "Accueil" social wall from the original QuizUp: short
// posts tagged with a topic, with a lightning-bolt reaction. Persistence is
// a local JSON file (same pattern as reports.js/social.js).

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { normalizePostsStore } = require('./store-normalize');
const { randomId } = require('./ids');
const { cleanAvatar } = require('./sanitize');
const { profileOf } = require('./social');

const STORE = getStorePath('posts.json');
const MAX_POSTS = 3000; // oldest posts drop off once this cap is hit (per-theme feeds need depth)
const MAX_TEXT_LEN = 240;
const REPORT_THRESHOLD = 3; // flags before a post is hidden from the feed (same bar as reports.js)

let posts = normalizePostsStore(
  readJsonFileSync(
    STORE,
    { posts: [] },
    (value) => !!value && typeof value === 'object' && Array.isArray(value.posts)
  ),
  { maxPosts: MAX_POSTS, maxTextLen: MAX_TEXT_LEN }
); // newest first
// Remove only the five historical fabricated demo rows, preserving real posts.
posts = posts.filter(p => p.authorId || !/^seed[1-5]$/.test(p.id));

const persist = createJsonWriter(STORE, () => ({ posts }));

function toClientShape(p, viewerId) {
  const author = p.authorId && profileOf(p.authorId);
  return {
    id: p.id, authorId: p.authorId || null, authorName: author?.name || p.authorName, authorAvatar: author?.avatar || p.authorAvatar,
    category: p.category, text: p.text, mediaUrl: p.mediaUrl || null, commentsCount: (p.comments || []).length, question: p.question ? {prompt:p.question.prompt,answers:p.question.answers} : null, reactions: p.reactedBy.length, reacted: !!viewerId && p.reactedBy.includes(viewerId), createdAt: p.createdAt,
  };
}

// getFeed(30) still works; getFeed({ category, authorIds }) filters to one
// theme's community or to the players someone follows.
function getFeed(options = 30) {
  const opts = typeof options === 'number' ? { limit: options } : (options || {});
  const limit = Math.max(1, Math.min(100, Math.floor(Number(opts.limit) || 30)));
  const authors = Array.isArray(opts.authorIds) ? new Set(opts.authorIds) : null;
  const out = [];
  for (const p of posts) {
    if (p.reportedBy.length >= REPORT_THRESHOLD) continue;
    if (opts.category && p.category !== opts.category) continue;
    if (authors && !authors.has(p.authorId)) continue;
    out.push(toClientShape(p, opts.viewerId));
    if (out.length >= limit) break;
  }
  return out;
}

// clientId is required — an identified poster (see server.js's handleFeed)
// keeps the public feed from being a free-for-all for anonymous connections,
// same bar as reacting to a post.
function addPost(clientId, authorName, authorAvatar, category, text, options = {}) {
  if (!clientId) return null;
  const clean = String(text || '').trim().slice(0, MAX_TEXT_LEN);
  if (!clean) return null;
  const question = normalizeQuestion(options.question);
  if (options.question && !question) return null;
  const mediaUrl = require('./community-media').isMediaPath(options.mediaUrl) ? options.mediaUrl : null;
  const post = {
    id: randomId('p_'),
    authorId: clientId,
    authorName: String(authorName || 'Player').slice(0, 20),
    authorAvatar: cleanAvatar(authorAvatar),
    category: typeof category === 'string' ? category.slice(0, 40) : null,
    text: clean,
    mediaUrl, question, comments: [],
    reactedBy: [],
    reportedBy: [],
    createdAt: Date.now(),
  };
  posts.unshift(post);
  if (posts.length > MAX_POSTS) posts.length = MAX_POSTS;
  persist();
  return toClientShape(post);
}

function toggleReaction(postId, clientId) {
  if (!clientId) return null;
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  const idx = post.reactedBy.indexOf(clientId);
  if (idx === -1) post.reactedBy.push(clientId);
  else post.reactedBy.splice(idx, 1);
  persist();
  return { id: post.id, reactions: post.reactedBy.length, actorId: clientId, reacted: idx === -1 };
}

// Returns { id, hidden } on success — hidden tells the caller whether this
// report just crossed the threshold, so it can be pulled from other
// clients' feeds immediately instead of waiting for their next refresh.
function reportPost(postId, clientId) {
  if (!clientId) return null;
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;

  const wasHidden = post.reportedBy.length >= REPORT_THRESHOLD;
  if (wasHidden) {
    return { id: post.id, accepted: false, hidden: false };
  }

  if (post.reportedBy.includes(clientId)) {
    return { id: post.id, accepted: true, duplicate: true, hidden: false };
  }

  post.reportedBy.push(clientId);
  persist();
  const isHidden = post.reportedBy.length >= REPORT_THRESHOLD;
  return {
    id: post.id,
    accepted: true,
    duplicate: false,
    hidden: !wasHidden && isHidden,
  };
}

function normalizeQuestion(q) {
  if (
    !q ||
    typeof q.prompt !== 'string' ||
    !q.prompt.trim() ||
    !Array.isArray(q.answers) ||
    q.answers.length !== 4 ||
    !q.answers.every(
      (a) => typeof a === 'string' && a.trim() && a.length <= 120,
    ) ||
    !Number.isInteger(q.correctIndex) ||
    q.correctIndex < 0 ||
    q.correctIndex > 3
  )
    return null;
  return {
    prompt: q.prompt.trim().slice(0, 240),
    answers: q.answers.map((a) => a.trim()),
    correctIndex: q.correctIndex,
  };
}

function visible(id) { return posts.find(p=>p.id===id && p.reportedBy.length<REPORT_THRESHOLD); }
function getComments(id) {
  const p = visible(id);
  return p ? p.comments || [] : null;
}

function addComment(id, uid, name, avatar, text) {
  const p = visible(id);
  const clean = typeof text === 'string' ? text.trim().slice(0, 300) : '';
  if (!p || !uid || !clean) return null;
  const comment = {
    id: randomId('c_'),
    authorId: uid,
    authorName: String(name || 'Player').slice(0, 20),
    authorAvatar: cleanAvatar(avatar),
    text: clean,
    createdAt: Date.now(),
  };
  p.comments = [...(p.comments || []), comment].slice(-100);
  persist();
  return { postId: id, comment, commentsCount: p.comments.length };
}

function answerQuestion(id, index) {
  const p = visible(id);
  if (!p?.question || !Number.isInteger(index) || index < 0 || index > 3)
    return null;
  return {
    postId: id,
    answerIndex: index,
    correct: index === p.question.correctIndex,
    correctIndex: p.question.correctIndex,
  };
}

module.exports = { getFeed, addPost, toggleReaction, reportPost, getComments, addComment, answerQuestion, normalizeQuestion };
