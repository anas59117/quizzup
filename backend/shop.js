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

// Rewarded ads can double a game's coins at most this many times per day, so
// a scripted client cannot farm coins by faking "ad watched" messages.
const MAX_AD_REWARDS_PER_DAY = 5;

module.exports = { FRAMES, getFrame, MAX_AD_REWARDS_PER_DAY };
