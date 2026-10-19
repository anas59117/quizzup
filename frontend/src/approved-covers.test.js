import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CATEGORIES } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';
import { getTopicCover } from './topicCovers';

const approvedKeys = ['ligue_champions','la_liga','bundesliga','ligue_1','paris_saint_germain','liga_portugal','juventus','ac_milan','napoli','atletico_de_madrid','ballon_d_or','disney','films_pixar','films_dreamworks','films_d_horreur','science_fiction','disney_renaissance','films_cultes_2000s','arcane','lupin','marvel','harry_potter','got','dc_comics','zelda','sonic','the_witcher','the_sims','overwatch','elden_ring','roblox','genshin_impact','pokemon','drapeaux','histoire_du_maroc','histoire_de_l_algerie','histoire_de_la_tunisie','foot_fr','kaamelott','bridgerton','gossip_girl','bts'];

test.each(approvedKeys)('%s uses its approved local artwork even with legacy typography or cover data', key => {
  const category = CATEGORIES.find(c => c.key === key);
  expect(category).toBeDefined();
  const cover = getTopicCover(category);
  expect(cover.src).toMatch(/^\/images\/covers\/approved-v2\//);
  expect(cover.srcSet).toContain('320w');
  const markup = renderToStaticMarkup(<CategoryTileV4 c={category} />);
  expect(markup).toContain(cover.src);
  expect(markup).not.toContain('tile-v4__big-line');
  expect(markup).not.toContain('tile-v4__web');
});

test('real group photos preserve the complete group', () => {
  expect(getTopicCover(CATEGORIES.find(c => c.key === 'bts')).fit).toBe('contain');
});
