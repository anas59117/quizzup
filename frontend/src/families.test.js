import { CATEGORIES, FAMILIES, categoriesInFamily } from './ui';

test('every quiz appears in exactly one of the nine displayed families', () => {
  const keys = FAMILIES.map((family) => family.key);
  expect(new Set(keys).size).toBe(9);
  expect(new Set(CATEGORIES.map((quiz) => quiz.key)).size).toBe(CATEGORIES.length);
  expect(CATEGORIES.filter((quiz) => !keys.includes(quiz.family))).toEqual([]);

  const grouped = FAMILIES.flatMap((family) => categoriesInFamily(family.key));
  expect(grouped).toHaveLength(CATEGORIES.length);
  expect(new Set(grouped.map((quiz) => quiz.key)).size).toBe(CATEGORIES.length);
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
