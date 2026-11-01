import fs from 'fs';
import path from 'path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CATEGORIES, categoriesInFamily } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';
import { getTopicCover } from './topicCovers';

const added = `football_feminin tottenham as_roma benfica galatasaray espagne_football gardiens_legendaires allemagne_football angleterre_football senegal_football transferts_mercato cricket judo surf skateboard escalade country_music punk_grunge musique_arabe_rai ariana_grande bad_bunny bruno_mars rappeurs_uk ed_sheeran post_malone kendrick_lamar j_cole vald laylow plk hamza apex_legends dark_souls diablo halo tekken_mortal_kombat stardew_valley rick_and_morty narcos better_call_saul suits grey_s_anatomy the_mandalorian family_guy mathematiques_logique informatique_technologie economie_finance psychologie droit_justice congo_rdc entrepreneurs_tech records_du_monde phenomenes_naturels monnaies_du_monde iles_du_monde`.split(' ');

test.each(added)('%s is browsable once, with a local responsive cover and working card', key => {
  const matches = CATEGORIES.filter(c => c.key === key);
  expect(matches).toHaveLength(1);
  const category = matches[0];
  expect(categoriesInFamily(category.family)).toContain(category);
  const cover = getTopicCover(category);
  expect(cover).toEqual(expect.objectContaining({ approved: true }));
  expect(cover.src).toMatch(/^\/images\/covers\/expanded-v1\//);
  for (const candidate of cover.srcSet.split(', ')) {
    const [src] = candidate.split(' ');
    expect(fs.existsSync(path.join(__dirname, '../public', src))).toBe(true);
  }
  const markup = renderToStaticMarkup(<CategoryTileV4 c={category} />);
  expect(markup).toContain(`data-topic="${key}"`);
  expect(markup).toContain(cover.src);
  expect(markup).not.toContain('tile-v4__big-line');
});

test('all eleven artist covers use real sourced photographs', () => {
  for (const key of ['ariana_grande', 'bad_bunny', 'bruno_mars', 'ed_sheeran', 'post_malone', 'kendrick_lamar', 'j_cole', 'vald', 'laylow', 'plk', 'hamza']) {
    const category = CATEGORIES.find(c => c.key === key);
    expect(category).toBeDefined();
    const cover = getTopicCover(category);
    expect(cover.kind).toBe('photo');
    expect(cover.source).toMatch(/^https:\/\//);
    expect(cover.credit).toBeTruthy();
  }
});
