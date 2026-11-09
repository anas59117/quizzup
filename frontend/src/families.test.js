import { CATEGORIES, FAMILIES, categoriesInFamily } from './ui';
import topicPopularity from './topicPopularity.json';

test('every quiz appears in exactly one of the nine displayed families', () => {
  const keys = FAMILIES.map((family) => family.key);
  expect(new Set(keys).size).toBe(9);
  expect(new Set(CATEGORIES.map((quiz) => quiz.key)).size).toBe(CATEGORIES.length);
  expect(CATEGORIES.filter((quiz) => !keys.includes(quiz.family))).toEqual([]);

  const grouped = FAMILIES.flatMap((family) => categoriesInFamily(family.key));
  expect(grouped).toHaveLength(CATEGORIES.length);
  expect(new Set(grouped.map((quiz) => quiz.key)).size).toBe(CATEGORIES.length);
  for (const key of keys) {
    expect(categoriesInFamily(key).map((quiz) => quiz.key)).toEqual(topicPopularity[key]);
  }
});

test('football, films, series and narrative franchises browse separately', () => {
  const familyOf = (key) => CATEGORIES.find((quiz) => quiz.key === key)?.family;
  expect(familyOf('foot_fr')).toBe('football');
  expect(familyOf('nba')).toBe('sport');
  expect(familyOf('movies')).toBe('cinema');
  expect(familyOf('friends')).toBe('series');
  for (const key of ['marvel', 'dc_comics', 'harry_potter', 'star_wars', 'got', 'le_seigneur_des_anneaux', 'james_bond']) {
    expect(familyOf(key)).toBe('sagas');
  }
  expect(familyOf('pokemon')).toBe('gaming');
  expect(familyOf('one_piece')).toBe('manga');
});

test('Themes shows widely recognised quizzes before specialist topics in each family', () => {
  const firstQuizzes = {
    sport: ['f1', 'nba', 'tennis'],
    football: ['coupe_du_monde_histoire', 'ligue_champions', 'ligue_1'],
    cinema: ['movies', 'disney', 'films_pixar'],
    series: ['stranger_things', 'squid_game', 'friends'],
    music: ['rap_fr', 'music', 'michael_jackson'],
    sagas: ['harry_potter', 'marvel', 'star_wars'],
    manga: ['dragon_ball', 'one_piece', 'naruto'],
    gaming: ['minecraft', 'fortnite', 'pokemon'],
    culture: ['culture_fr', 'drapeaux', 'capitales_du_monde'],
  };
  for (const [family, keys] of Object.entries(firstQuizzes)) {
    expect(categoriesInFamily(family).slice(0, keys.length).map((quiz) => quiz.key)).toEqual(keys);
  }
});
