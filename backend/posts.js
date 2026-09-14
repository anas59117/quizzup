// Topic feed — the "Accueil" social wall from the original QuizUp: short
// posts tagged with a topic, with a lightning-bolt reaction. Persistence is
// a local JSON file (same pattern as reports.js/social.js).

const fs = require('fs');
const path = require('path');

const STORE = path.join(__dirname, 'posts.json');
const MAX_POSTS = 500; // oldest posts drop off once this cap is hit
const MAX_TEXT_LEN = 240;
const REPORT_THRESHOLD = 3; // flags before a post is hidden from the feed (same bar as reports.js)

let posts = []; // newest first: { id, authorId, authorName, authorAvatar, category, text, reactedBy: [clientId], reportedBy: [clientId], createdAt }

try {
  const saved = JSON.parse(fs.readFileSync(STORE, 'utf8'));
  if (Array.isArray(saved.posts)) posts = saved.posts;
} catch {
  /* no store yet or unreadable — seed with starter posts below */
}

if (posts.length === 0) {
  posts = [
    { id: 'seed1', authorId: null, authorName: 'bnrt', authorAvatar: '\u{1F9D9}', category: 'harry_potter', text: "Dimanche soir il y a Harry Potter et l'école des sorciers ⚡⚡", reactedBy: [], reportedBy: [], createdAt: Date.now() - 1000 * 60 * 27 },
    { id: 'seed2', authorId: null, authorName: 'Romane Clarke', authorAvatar: '\u{1F409}', category: 'got', text: "Alllleez Jorah il pèse dans l'game \u{1F62D}", reactedBy: [], reportedBy: [], createdAt: Date.now() - 1000 * 60 * 26 },
    { id: 'seed3', authorId: null, authorName: 'Mehdi', authorAvatar: '⚽', category: 'foot_fr', text: 'Qui savait que Zidane avait fait ses débuts pro à Cannes ? \u{1F440}', reactedBy: [], reportedBy: [], createdAt: Date.now() - 1000 * 60 * 55 },
    { id: 'seed4', authorId: null, authorName: 'Sarah', authorAvatar: '\u{1F3AC}', category: 'netflix', text: 'La nouvelle saison est incroyable, personne ne me spoil svp \u{1F64F}', reactedBy: [], reportedBy: [], createdAt: Date.now() - 1000 * 60 * 90 },
    { id: 'seed5', authorId: null, authorName: 'Yanis', authorAvatar: '\u{1F3A4}', category: 'rap_fr', text: 'Débat: meilleur album de Booba ?', reactedBy: [], reportedBy: [], createdAt: Date.now() - 1000 * 60 * 140 },
  ];
}

let writeScheduled = false;
function persist() {
  if (writeScheduled) return;
  writeScheduled = true;
  setTimeout(() => {
    writeScheduled = false;
    try {
      fs.writeFileSync(STORE, JSON.stringify({ posts }));
    } catch {
      /* disk may be read-only/full — feed still works in memory */
    }
  }, 1000);
}

function toClientShape(p) {
  return {
    id: p.id, authorName: p.authorName, authorAvatar: p.authorAvatar,
    category: p.category, text: p.text, reactions: p.reactedBy.length, createdAt: p.createdAt,
  };
}

function getFeed(limit = 30) {
  return posts
    .filter((p) => p.reportedBy.length < REPORT_THRESHOLD)
    .slice(0, limit)
    .map(toClientShape);
}

// clientId is required — an identified poster (see server.js's handleFeed)
// keeps the public feed from being a free-for-all for anonymous connections,
// same bar as reacting to a post.
function addPost(clientId, authorName, authorAvatar, category, text) {
  if (!clientId) return null;
  const clean = String(text || '').trim().slice(0, MAX_TEXT_LEN);
  if (!clean) return null;
  const post = {
    id: `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    authorId: clientId,
    authorName: String(authorName || 'Player').slice(0, 20),
    authorAvatar: String(authorAvatar || '\u{1F43A}').slice(0, 4),
    category: typeof category === 'string' ? category.slice(0, 40) : null,
    text: clean,
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
  return { id: post.id, reactions: post.reactedBy.length };
}

// Returns { id, hidden } on success — hidden tells the caller whether this
// report just crossed the threshold, so it can be pulled from other
// clients' feeds immediately instead of waiting for their next refresh.
function reportPost(postId, clientId) {
  if (!clientId) return null;
  const post = posts.find((p) => p.id === postId);
  if (!post) return null;
  if (!post.reportedBy.includes(clientId)) post.reportedBy.push(clientId);
  persist();
  return { id: post.id, hidden: post.reportedBy.length >= REPORT_THRESHOLD };
}

module.exports = { getFeed, addPost, toggleReaction, reportPost };
