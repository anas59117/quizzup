// Short, complete pitches keep the entry into a duel concise in both languages.
const PREVIEW_SUB = {
  spider_man: { eyebrow: 'POP CULTURE · MARVEL', desc: 'De Peter Parker à Miles Morales. Le multivers n’aura plus de secrets pour toi.', en: 'From Peter Parker to Miles Morales. Discover every corner of the multiverse.' },
  harry_potter: { eyebrow: 'POP CULTURE · WIZARDING', desc: 'Poudlard, sortilèges et créatures magiques. Mets tes connaissances à l’épreuve.', en: 'Hogwarts, spells and magical creatures. Put your knowledge to the test.' },
  marvel: { eyebrow: 'POP CULTURE · MARVEL', desc: 'Avengers, X-Men et tout l’univers Marvel réuni.', en: 'Avengers, X-Men and the entire Marvel universe.' },
  dc_comics: { eyebrow: 'POP CULTURE · DC', desc: 'Justice League, Batman, Superman : explore l’univers DC Comics.', en: 'Justice League, Batman, Superman: explore the DC Comics universe.' },
  batman: { eyebrow: 'POP CULTURE · DC', desc: 'Gotham, le Chevalier Noir, Joker et toute la Bat-Famille.', en: 'Gotham, the Dark Knight, the Joker and the whole Bat-Family.' },
  star_wars: { eyebrow: 'POP CULTURE · LUCASFILM', desc: 'La Force, les Jedi et les Sith. Explore toute la saga galactique.', en: 'The Force, the Jedi and the Sith. Explore the entire galactic saga.' },
  game_of_thrones: { desc: 'Westeros, dragons, trônes et trahisons.', en: 'Westeros, dragons, thrones and betrayals.' },
  one_piece: { eyebrow: 'MANGA · SHŌNEN', desc: 'Luffy et son équipage à la recherche du One Piece.', en: 'Join Luffy and his crew on the quest for the One Piece.' },
  pokemon: { eyebrow: 'POP CULTURE · GAMING', desc: 'Pokémon, régions et évolutions : à toi de tous les reconnaître.', en: 'Pokémon, regions and evolutions: how many can you recognize?' },
  minecraft: { eyebrow: 'GAMING · SANDBOX', desc: 'Blocs, créatures, biomes et dimensions du jeu culte.', en: 'Blocks, creatures, biomes and dimensions of the iconic game.' },
  rap_fr: { desc: 'PNL, Booba, Jul, SCH et les grands noms du rap français.', en: 'PNL, Booba, Jul, SCH and the biggest names in French rap.' },
  werenoi: { desc: 'La discographie et l’univers de Werenoi.', en: 'Explore Werenoi’s discography and musical world.' },
  ligue_champions: { desc: 'Finales, légendes et records de la compétition européenne.', en: 'Finals, legends and records of European club football.' },
  foot_fr: { desc: 'Ligue 1, les Bleus et les légendes du football français.', en: 'Ligue 1, Les Bleus and the legends of French football.' },
};

export function topicDetailPresentation(category, cover) {
  const tint = cover?.detailTint || ({ spider_man: '#721027', marvel: '#721027', foot_fr: '#142e55', harry_potter: '#58401e', minecraft: '#294d36', rap_fr: '#4d192c', ligue_champions: '#142e55', liga_portugal: '#194c3c' })[category?.key]
    || ({ football: '#142e55', sport: '#183c49', music: '#4d192c', gaming: '#273c42', cinema: '#42302f', sagas: '#493326', series: '#483049', manga: '#423241', culture: '#263f54' })[category?.family] || '#4b2436';
  const preview = PREVIEW_SUB[category?.key];
  return {
    tint,
    fit: category?.key === 'foot_fr' || cover?.embeddedTitle || cover?.fit === 'contain' ? 'contain' : 'cover',
    focal: category?.key === 'spider_man' ? 'center 20%' : cover?.focal || 'center',
    eyebrow: preview?.eyebrow,
    description: preview?.desc || category?.desc,
    englishDescription: preview?.en || category?.desc,
  };
}
