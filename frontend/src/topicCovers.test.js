import { CATEGORIES } from './ui';
import { FAMILY_TOPIC_COVERS, TOPIC_COVERS, getTopicCover } from './topicCovers';

describe('topic cover catalog', () => {
  test('every quiz category resolves to a stable HTTPS cover', () => {
    const missing = CATEGORIES.filter((category) => {
      const cover = getTopicCover(category);
      return !cover || !cover.src.startsWith('https://') || !cover.source.startsWith('https://');
    });

    expect(missing.map((category) => category.key)).toEqual([]);
  });

  test('every family fallback is available', () => {
    expect(Object.keys(FAMILY_TOPIC_COVERS).sort()).toEqual(
      ['culture', 'entertainment', 'gaming', 'music', 'sport']
    );
  });

  test('the first editorial batch contains only known category keys', () => {
    const categoryKeys = new Set(CATEGORIES.map((category) => category.key));
    const unknown = Object.keys(TOPIC_COVERS).filter((key) => !categoryKeys.has(key));

    expect(unknown).toEqual([]);
  });
});
