// Explicit demonstration content. These accounts are never represented as players;
// all reactions and comments are created by real authenticated users.
const STARTER_VERSION = 2;
const cover = slug => `/images/covers/approved-v2/${slug}-640.webp`;
const origin = 'https://quizzup-ten.vercel.app';
const legacyStarters = [
  ['spidey', 'SpideyVerse', 'spider_man', 'Votre Spider-Man préféré ?\nTobey, Andrew ou Tom ? Je défends Andrew.', cover('spider_man')],
  ['avengers', 'AvengersHQ', 'marvel', 'Infinity War ou Endgame ?\nJe préfère la tension d’Infinity War. Vous en pensez quoi ?', cover('marvel')],
  ['hogwarts', 'PotterHead', 'harry_potter', 'Gryffondor ou Serpentard ?\nVous choisissez votre maison pour ses valeurs ou pour ses personnages ?', cover('harry_potter')],
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

// Launch prompts are published by QuizzUp itself, never by invented players.
const starters = [
  ['welcome', null, 'La communauté QuizzUp ouvre ses portes. Votre thème préféré et celui sur lequel vous êtes imbattable ? Présentez-vous !'],
  ['avengers', 'marvel', 'Infinity War ou Endgame ? On ouvre le débat : lequel vous a le plus marqué, et pourquoi ?'],
  ['football', 'equipe_de_france_football', 'Le joueur qui vous a donné envie d’aimer le foot ? Racontez le match ou le moment qui a tout déclenché.'],
].map(([key, category, text]) => ({
  id: `community-official-v2-${key}`, authorId: null, authorName: 'QuizzUp',
  authorAvatar: 'robot', category, text, mediaUrl: null, isOfficial: true,
}));

function trustedStarter(raw) {
  if (raw?.authorId != null) return null;
  if (raw?.isOfficial === true) return starters.find(p => p.id === raw.id) || null;
  if (raw?.isDemo === true) return legacyStarters.find(p => p.id === raw.id) || null;
  return null;
}

function createStarterPosts(now = Date.now()) {
  return starters.map(p => ({
    ...p, createdAt: now, comments: [],
    reactedBy: [], reportedBy: [], question: null,
  }));
}

module.exports = { STARTER_VERSION, trustedStarter, createStarterPosts };
