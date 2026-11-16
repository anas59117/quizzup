// Topic feed — the "Accueil" social wall from the original QuizUp: short
// posts tagged with a topic, with a lightning-bolt reaction. Persistence is
// a local JSON file (same pattern as reports.js/social.js).

const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { normalizePostsStore } = require('./store-normalize');
const { randomId } = require('./ids');
const { cleanAvatar } = require('./sanitize');
const { profileOf } = require('./social');
const { isFollowing } = require('./follows');
const { blockedPair } = require('./user-reports');
const { STARTER_VERSION, createStarterPosts } = require('./community-starters');

const STORE = getStorePath('posts.json');
const MAX_POSTS = 3000; // oldest posts drop off once this cap is hit (per-theme feeds need depth)
const MAX_TEXT_LEN = 240;
const REPORT_THRESHOLD = 3; // flags before a post is hidden from the feed (same bar as reports.js)

const saved = readJsonFileSync(
  STORE,
  { posts: [] },
  (value) => !!value && typeof value === 'object' && Array.isArray(value.posts)
);
let starterVersion = Number.isSafeInteger(saved.starterVersion) ? saved.starterVersion : 0;
let posts = normalizePostsStore(
  saved,
  { maxPosts: MAX_POSTS, maxTextLen: MAX_TEXT_LEN }
); // newest first
// Remove only the five historical fabricated demo rows, preserving real posts.
posts = posts.filter(p => p.authorId || !/^seed[1-5]$/.test(p.id));

const persist = createJsonWriter(STORE, () => ({ posts, starterVersion }));

// Called at server startup, never during module import (tests and tools remain isolated).
function seedStarterPosts() {
  if (starterVersion >= STARTER_VERSION) return 0;
  const ids = new Set(posts.map(p => p.id));
  const additions = createStarterPosts().filter(p => !ids.has(p.id));
  posts = [...posts, ...additions].slice(0, MAX_POSTS);
  starterVersion = STARTER_VERSION;
  persist();
  return additions.length;
}

function commentToClient(c, viewerId) {
  const author = profileOf(c.authorId);
  const { reactedBy = [], ...comment } = c;
  return { ...comment, authorName: author?.name || c.authorName,
    authorAvatar: author?.avatar || c.authorAvatar,
    reactions: reactedBy.length, reacted: !!viewerId && reactedBy.includes(viewerId) };
}

function commentVisible(p, c, viewerId) {
  if (![c.text, c.authorName].every(require('./content-filter').contentAllowed)) return false;
  if (!viewerId) return true;
  if (blockedPair(viewerId, c.authorId)) return false;
  const parent = c.parentId && p.comments.find(root => root.id === c.parentId);
  return !c.parentId || !!parent && !blockedPair(viewerId, parent.authorId);
}

function toClientShape(p, viewerId) {
  const author = p.authorId && profileOf(p.authorId);
  const comments = p.comments || [];
  const lastComment = comments[comments.length - 1];
  const canSeeLastComment = viewerId && lastComment &&
    !blockedPair(viewerId, p.authorId) && commentVisible(p, lastComment, viewerId);
  return {
    id: p.id, authorId: p.authorId || null, authorName: author?.name || p.authorName, authorAvatar: author?.avatar || p.authorAvatar,
    authorFollowed: !!viewerId && !!p.authorId && isFollowing(viewerId, p.authorId),
    category: p.category, text: p.text, mediaUrl: p.mediaUrl || null,
    ...(p.isDemo ? { isDemo: true, demoAvatar: p.demoAvatar } : {}),
    ...(p.isOfficial ? { isOfficial: true } : {}),
    commentsCount: comments.length, lastComment: canSeeLastComment ? commentToClient(lastComment, viewerId) : null,
    question: p.question ? {prompt:p.question.prompt,answers:p.question.answers} : null, reactions: p.reactedBy.length, reacted: !!viewerId && p.reactedBy.includes(viewerId), createdAt: p.createdAt,
  };
}

// getFeed(30) still works; getFeed({ category, authorIds }) filters to one
// theme's community or to the players someone follows.
function getFeed(options = 30) {
  const opts = typeof options === 'number' ? { limit: options } : (options || {});
  const limit = Math.max(1, Math.min(100, Math.floor(Number(opts.limit) || 30)));
  const authors = Array.isArray(opts.authorIds) ? new Set(opts.authorIds) : null;
  const categories = Array.isArray(opts.categories) ? new Set(opts.categories) : null;
  const out = [];
  for (const p of posts) {
    // Retired demos remain available by permalink so real replies are preserved.
    if (p.isDemo || !publicContentAllowed(p)) continue;
    if (p.reportedBy.length >= REPORT_THRESHOLD) continue;
    if (opts.viewerId && blockedPair(opts.viewerId, p.authorId)) continue;
    if (opts.category && p.category !== opts.category) continue;
    if (categories && !categories.has(p.category)) continue;
    if (authors && !authors.has(p.authorId)) continue;
    out.push(toClientShape(p, opts.viewerId));
    if (out.length >= limit) break;
  }
  return out;
}

function getPost(postId, viewerId) {
  const post = visible(postId, viewerId);
  return post ? toClientShape(post, viewerId) : null;
}

// clientId is required — an identified poster (see server.js's handleFeed)
// keeps the public feed from being a free-for-all for anonymous connections,
// same bar as reacting to a post.
function addPost(clientId, authorName, authorAvatar, category, text, options = {}) {
  if (!clientId) return null;
  if (![text, authorName, options.question?.prompt, ...(Array.isArray(options.question?.answers) ? options.question.answers : [])].every(require('./content-filter').contentAllowed)) return null;
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
  const post = visible(postId, clientId);
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

function publicContentAllowed(p) { return [p.text, p.authorName, p.question?.prompt, ...(p.question?.answers || [])].every(require('./content-filter').contentAllowed); }
function visible(id, viewerId) {
  return posts.find(p => publicContentAllowed(p) && p.id === id && p.reportedBy.length < REPORT_THRESHOLD && (!viewerId || !blockedPair(viewerId, p.authorId)));
}
function getComments(id, viewerId) {
  const p = visible(id, viewerId);
  return p ? (p.comments || []).filter(c => commentVisible(p, c, viewerId)).map(c => commentToClient(c, viewerId)) : null;
}

function addComment(id, uid, name, avatar, text, parentId = null) {
  if (![text, name].every(require('./content-filter').contentAllowed)) return null;
  const p = visible(id, uid);
  const clean = typeof text === 'string' ? text.trim().slice(0, 300) : '';
  if (!p || !uid || !clean) return null;
  if (parentId !== null) {
    if (typeof parentId !== 'string' || !parentId) return null;
    const parent = p.comments.find(c => c.id === parentId && c.parentId === null);
    if (!parent || !commentVisible(p, parent, uid)) return null;
  }
  const comment = {
    id: randomId('c_'),
    authorId: uid,
    authorName: String(name || 'Player').slice(0, 20),
    authorAvatar: cleanAvatar(avatar),
    text: clean,
    parentId, reactedBy: [],
    createdAt: Date.now(),
  };
  const previousIds = (p.comments || []).map(c => c.id);
  p.comments = [...(p.comments || []), comment];
  while (p.comments.length > 100) {
    const index = p.comments.findIndex(c => c.id !== comment.id && c.id !== comment.parentId);
    const [removed] = p.comments.splice(index, 1);
    p.comments = p.comments.filter(c => c.parentId !== removed.id);
  }
  const retainedIds = new Set(p.comments.map(c => c.id));
  const removedCommentIds = previousIds.filter(id => !retainedIds.has(id));
  persist();
  return { postId: id, comment: commentToClient(comment, uid), commentsCount: p.comments.length,
    ...(removedCommentIds.length ? { removedCommentIds } : {}) };
}

function toggleCommentReaction(postId, commentId, uid) {
  const p = uid && visible(postId, uid);
  const comment = p && p.comments.find(c => c.id === commentId && commentVisible(p, c, uid));
  if (!comment) return null;
  const index = comment.reactedBy.indexOf(uid);
  if (index < 0) comment.reactedBy.push(uid);
  else comment.reactedBy.splice(index, 1);
  persist();
  return { postId, commentId, actorId: uid, reactions: comment.reactedBy.length, reacted: index < 0 };
}

function answerQuestion(id, index, viewerId) {
  const p = visible(id, viewerId);
  if (!p?.question || !Number.isInteger(index) || index < 0 || index > 3)
    return null;
  return {
    postId: id,
    answerIndex: index,
    correct: index === p.question.correctIndex,
    correctIndex: p.question.correctIndex,
  };
}

function deleteUser(uid) {
  posts = posts.filter(p => p.authorId !== uid);
  for (const p of posts) {
    p.reactedBy = p.reactedBy.filter(id => id !== uid);
    p.reportedBy = p.reportedBy.filter(id => id !== uid);
    const removed = new Set(p.comments.filter(c => c.authorId === uid).map(c => c.id));
    p.comments = p.comments.filter(c => !removed.has(c.id) && !removed.has(c.parentId));
    for (const c of p.comments) c.reactedBy = c.reactedBy.filter(id => id !== uid);
  }
  persist();
}
module.exports = { deleteUser, getPost, getFeed, addPost, toggleReaction, reportPost, getComments, addComment, toggleCommentReaction, seedStarterPosts, answerQuestion, normalizeQuestion };
