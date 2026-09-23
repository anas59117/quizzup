import { CATEGORIES } from './ui';
import { FAMILY_TOPIC_COVERS, TOPIC_COVERS, getTopicCover } from './topicCovers';

describe('topic cover catalog', () => {
  test('all remote editorial covers have a stable image and source', () => {
    const invalid = Object.entries(TOPIC_COVERS).filter(([, cover]) => (
      !cover.src.startsWith('https://') || !cover.source.startsWith('https://')
    ));

    expect(invalid.map(([key]) => key)).toEqual([]);
  });

  test('existing topic-specific covers win over family fallbacks', () => {
    const tennis = CATEGORIES.find((category) => category.key === 'tennis');
    const basketball = CATEGORIES.find((category) => category.key === 'basketball');
    const kpop = CATEGORIES.find((category) => category.key === 'kpop');
    const actors = CATEGORIES.find((category) => category.key === 'actors_az');
    const rapFr = CATEGORIES.find((category) => category.key === 'rap_fr');
    const premierLeague = CATEGORIES.find((category) => category.key === 'premier_league');

    expect(getTopicCover(tennis).src).toContain('/quizphotos/tennis/');
    expect(getTopicCover(basketball).src).toContain('/quizphotos/basketball/');
    expect(getTopicCover(kpop).src).toContain('/quizphotos/kpop/');
    expect(getTopicCover(actors).src).toContain('/players/');
    expect(getTopicCover(rapFr).src).toBe('/images/players/booba.jpg');
    expect(getTopicCover(premierLeague).src).toBe('/images/covers/premier_league.jpg');
  });

  test('uncurated topics never receive a misleading family photo', () => {
    const uncurated = CATEGORIES.find((category) => category.key === 'jo_ete_histoire');

    expect(getTopicCover(uncurated)).toBeNull();
  });

  test('every family fallback remains available for future explicit use', () => {
    expect(Object.keys(FAMILY_TOPIC_COVERS).sort()).toEqual(
      ['culture', 'entertainment', 'gaming', 'music', 'sport']
    );
  });

  test('the editorial catalog contains only known category keys', () => {
    const categoryKeys = new Set(CATEGORIES.map((category) => category.key));
    const unknown = Object.keys(TOPIC_COVERS).filter((key) => !categoryKeys.has(key));

    expect(unknown).toEqual([]);
  });
});
