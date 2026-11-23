import { CATEGORIES, categoriesInFamily, FAMILIES } from './ui';
import excluded from './releaseExcludedTopics.json';

test('the provisional release catalog hides all excluded topics in every browse surface', () => {
  expect(excluded).toHaveLength(33);
  expect(new Set(excluded).size).toBe(33);
  for (const key of excluded) {
    expect(CATEGORIES.some(category => category.key === key)).toBe(false);
    for (const family of FAMILIES) {
      expect(categoriesInFamily(family.key).some(category => category.key === key)).toBe(false);
    }
  }
  expect(CATEGORIES.some(category => category.key === 'nba')).toBe(true);
});
