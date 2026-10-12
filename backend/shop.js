// Cosmetic shop catalogue. Prices are in in-game coins (earned by playing or
// doubled with a rewarded ad). The server is the only authority on prices and
// ownership; the frontend keeps a copy only to render the shop.

const FRAMES = Object.freeze([
  { id: 'none', price: 0 },
  { id: 'bronze', price: 150 },
  { id: 'argent', price: 400 },
  { id: 'or', price: 900 },
  { id: 'neon', price: 1200 },
  { id: 'flamme', price: 2000 },
  { id: 'glace', price: 2000 },
  { id: 'arcenciel', price: 3500 },
  { id: 'diamant', price: 6000 },
]);

const FRAME_BY_ID = new Map(FRAMES.map((f) => [f.id, f]));

function getFrame(id) {
  return typeof id === 'string' ? FRAME_BY_ID.get(id) || null : null;
}

// Boutique v4: cosmetics grouped by category. One item can be equipped per
// category. Prices must stay in sync with the catalogue in frontend/src/screens.js
// (the client renders them, the server is the only authority).
const ITEM_CATEGORIES = Object.freeze(['avatars', 'entries', 'reactions', 'celebrations']);

// 'robot' is the free starter avatar: owned by everyone, never purchasable.
const FREE_ITEMS = Object.freeze(['robot']);

const ITEMS = Object.freeze([
  { id: 'fox', category: 'avatars', price: 350 },
  { id: 'robot', category: 'avatars', price: 0 },
  { id: 'brain', category: 'avatars', price: 500 },
  { id: 'astronaut', category: 'avatars', price: 450 },
  { id: 'ninja', category: 'avatars', price: 500 },
  { id: 'dragon', category: 'avatars', price: 600 },
  { id: 'cat', category: 'avatars', price: 400 },
  { id: 'owl', category: 'avatars', price: 450 },
  { id: 'ghost', category: 'avatars', price: 350 },
  { id: 'lion', category: 'avatars', price: 650 },
  { id: 'lightning', category: 'entries', price: 600 },
  { id: 'smoke', category: 'entries', price: 600 },
  { id: 'pixels', category: 'entries', price: 750 },
  { id: 'portal', category: 'entries', price: 700 },
  { id: 'flames', category: 'entries', price: 650 },
  { id: 'glitch', category: 'entries', price: 600 },
  { id: 'tornado', category: 'entries', price: 750 },
  { id: 'meteor', category: 'entries', price: 850 },
  { id: 'clap', category: 'reactions', price: 200 },
  { id: 'sweat', category: 'reactions', price: 250 },
  { id: 'cool', category: 'reactions', price: 300 },
  { id: 'heart', category: 'reactions', price: 200 },
  { id: 'angry', category: 'reactions', price: 250 },
  { id: 'laugh', category: 'reactions', price: 250 },
  { id: 'shock', category: 'reactions', price: 300 },
  { id: 'thumbsup', category: 'reactions', price: 200 },
  { id: 'dance', category: 'celebrations', price: 700 },
  { id: 'throne', category: 'celebrations', price: 900 },
  { id: 'fireworks', category: 'celebrations', price: 800 },
  { id: 'disco', category: 'celebrations', price: 750 },
  { id: 'micdrop', category: 'celebrations', price: 700 },
  { id: 'rocket', category: 'celebrations', price: 850 },
  { id: 'spotlight', category: 'celebrations', price: 750 },
]);

const ITEM_BY_ID = new Map(ITEMS.map((i) => [i.id, i]));

function getItem(id) {
  return typeof id === 'string' ? ITEM_BY_ID.get(id) || null : null;
}

function isFreeItem(id) {
  return FREE_ITEMS.includes(id);
}

// Rewarded ads can double a game's coins at most this many times per day, so
// a scripted client cannot farm coins by faking "ad watched" messages.
const MAX_AD_REWARDS_PER_DAY = 5;

module.exports = {
  FRAMES, getFrame,
  ITEMS, ITEM_CATEGORIES, FREE_ITEMS, getItem, isFreeItem,
  MAX_AD_REWARDS_PER_DAY,
};
