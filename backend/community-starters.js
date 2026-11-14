// Explicit demonstration content. These accounts are never represented as players;
// all reactions and comments are created by real authenticated users.
const STARTER_VERSION = 1;
const cover = slug => `/images/covers/approved-v2/${slug}-640.webp`;
const origin = 'https://quizzup-ten.vercel.app';
const starters = [
  ['spidey', 'SpideyVerse', 'spider_man', 'Votre Spider-Man préféré au cinéma ? Je lance le débat : Miles Morales !', cover('spider_man')],
  ['avengers', 'AvengersHQ', 'marvel', 'Quel héros mérite le prochain grand quiz Marvel ?', cover('marvel')],
  ['hogwarts', 'PotterHead', 'harry_potter', 'Une seule maison pour toute la vie : laquelle choisiriez-vous ?', cover('harry_potter')],
  ['madrid', 'Madridista', 'real_madrid', 'Le match du Real que vous pourriez revoir sans jamais vous lasser ?', cover('real_madrid')],
  ['yamal', 'YamalFan', 'fc_barcelone', 'Quel geste de Lamine Yamal vous a le plus marqué ?', '/images/players/lamine_yamal.jpg'],
  ['multiverse', 'MultiverseClub', 'marvel', 'Votre équipe de trois héros pour sauver le multivers ?', cover('marvel')],
  ['magic', 'LumosClub', 'harry_potter', 'Quel sort utiliseriez-vous en premier dans la vraie vie ?', cover('harry_potter')],
  ['webhead', 'WebHeadClub', 'spider_man', 'Le meilleur méchant de Spider-Man, selon vous ?', cover('spider_man')],
].map(([key, authorName, category, text, mediaUrl]) => ({
  id: `community-starter-v1-${key}`, authorId: null, authorName,
  authorAvatar: 'robot', category, text, mediaUrl, isDemo: true,
  demoAvatar: origin + mediaUrl,
}));

function trustedStarter(raw) {
  if (raw?.isDemo !== true || raw.authorId != null) return null;
  return starters.find(p => p.id === raw.id) || null;
}

function createStarterPosts(now = Date.now()) {
  return starters.map((p, index) => ({
    ...p, createdAt: now - index * 60_000, comments: [],
    reactedBy: [], reportedBy: [], question: null,
  }));
}

module.exports = { STARTER_VERSION, trustedStarter, createStarterPosts };
