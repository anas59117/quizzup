import { CATEGORIES } from './ui';
import { FAMILY_TOPIC_COVERS, TOPIC_COVERS, getTopicCover } from './topicCovers';

describe('topic cover catalog', () => {
  test('every quiz category resolves to a stable HTTPS cover', () => {
    const missing = CATEGORIES.filter((category) => {
      const cover = getTopicCover(category);
      if (!cover || !/^(https:\/\/|\/)/.test(cover.src)) return true;
      return cover.src.startsWith('https://')
        && (!cover.source || !cover.source.startsWith('https://'));
    });

    expect(missing.map((category) => category.key)).toEqual([]);
  });

  test('existing topic-specific covers win over family fallbacks', () => {
    const tennis = CATEGORIES.find((category) => category.key === 'tennis');
    const basketball = CATEGORIES.find((category) => category.key === 'basketball');
    const kpop = CATEGORIES.find((category) => category.key === 'kpop');
    const actors = CATEGORIES.find((category) => category.key === 'actors_az');

    expect(getTopicCover(tennis).src).toContain('/quizphotos/tennis/');
    expect(getTopicCover(basketball).src).toContain('/quizphotos/basketball/');
    expect(getTopicCover(kpop).src).toContain('/quizphotos/kpop/');
    expect(getTopicCover(actors).src).toContain('/players/');
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
