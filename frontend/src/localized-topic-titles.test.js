import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CATEGORIES } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';
import { CategoryPreviewContent } from './screens';
import { I18nProvider } from './i18n';

const topics = ['ligue_champions','disney','films_d_horreur','science_fiction','disney_renaissance','films_cultes_2000s','drapeaux','histoire_du_maroc','histoire_de_l_algerie','histoire_de_la_tunisie','foot_fr','football_feminin','espagne_football','gardiens_legendaires','allemagne_football','angleterre_football','senegal_football','transferts_mercato','mathematiques_logique','informatique_technologie','economie_finance','psychologie','droit_justice','entrepreneurs_tech','records_du_monde','monnaies_du_monde'];
function render(lang, node) {
  localStorage.setItem('quizzup-lang', lang);
  return renderToStaticMarkup(<I18nProvider>{node}</I18nProvider>);
}
const pending = ['disney','films_d_horreur','science_fiction','disney_renaissance','films_cultes_2000s'];
test.each(topics.filter(key=>!pending.includes(key)))('%s keeps its text-free artwork and uses the standard bottom caption', key => {
  const category = CATEGORIES.find(c => c.key === key);
  const html = render('en', <CategoryTileV4 c={category} />);
  expect(html).toContain('/images/covers/international-v1/');
  expect(html).not.toContain('tile-v4__poster-title');
  const card = document.createElement('div');
  card.innerHTML = html;
  expect(card.querySelector('.tile-v4__caption .tile-v4__label').textContent)
    .toBe(card.querySelector('button').getAttribute('aria-label'));
  expect(html).not.toContain('tile-v4--poster ');
});
test.each(pending)('%s keeps its original poster as requested while its image edit is deferred', key => {
  const category = CATEGORIES.find(c=>c.key===key);
  const html=render('fr',<CategoryTileV4 c={category}/>);
  expect(html).toContain(`/approved-v2/${key}-`);
  expect(html).not.toContain('tile-v4__poster-title');
});
test('card and quiz detail show the current UI language, including accessible names', () => {
  const category = CATEGORIES.find(c => c.key === 'gardiens_legendaires');
  const english = render('en', <CategoryTileV4 c={category} />);
  expect(english).toContain('Legendary Goalkeepers');
  expect(english).toContain('aria-label="Legendary Goalkeepers"');
  expect(english).not.toContain('Gardiens Légendaires');
  const french = render('fr', <CategoryTileV4 c={category} />);
  expect(french).toContain('Gardiens légendaires');
  const preview = render('en', <CategoryPreviewContent category={category} stats={{}} />);
  expect(preview).toContain('Legendary Goalkeepers');
});
test('franchise wordmarks and standalone card rendering retain existing behavior', () => {
  const category = CATEGORIES.find(c => c.key === 'harry_potter');
  expect(render('en', <CategoryTileV4 c={category} />)).toContain('/approved-v2/harry_potter');
  expect(renderToStaticMarkup(<CategoryTileV4 c={category} />)).toContain('Harry Potter');
});
