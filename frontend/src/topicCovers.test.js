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

  test('the first batch of fifty reviewed topics has dedicated covers', () => {
    const reviewedKeys = [
      'got',
      'harry_potter',
      'marvel',
      'star_wars',
      'disney',
      'pokemon',
      'f1',
      'nba',
      'tv_shows',
      'histoire_fr',
      'retro_games',
      'espace_astronomie',
      'corps_humain',
      'ligue_champions',
      'coupe_du_monde_histoire',
      'tour_de_france',
      'jo_ete_histoire',
      'can_foot_africain',
      'copa_america',
      'legendes_foot_allemand_anglais_italien',
      'eredivisie',
      'drapeaux',
      'liga_portugal',
      'mls',
      'tennis_atp',
      'tennis_wta',
      'roland_garros',
      'wimbledon',
      'rugby_top_14',
      'mma_ufc',
      'legendes_du_cyclisme',
      'natation_olympique',
      'jo_d_hiver_histoire',
      'volleyball',
      'ski_alpin',
      'sports_d_hiver',
      'golf',
      'nhl',
      'baseball_mlb',
      'motogp',
      'rallye_wrc',
      'paris_saint_germain',
      'real_madrid',
      'cristiano_ronaldo',
      'minecraft',
      'gta',
      'league_of_legends',
      'valorant',
      'roblox',
      'call_of_duty',
    ];

    expect(reviewedKeys).toHaveLength(50);
    expect(reviewedKeys.filter((key) => !TOPIC_COVERS[key])).toEqual([]);
  });

  test('the second batch of fifty reviewed topics has dedicated covers', () => {
    const reviewedKeys = [
      'genshin_impact',
      'zelda',
      'univers_mario',
      'rugby_coupe_du_monde',
      'xv_de_france',
      'boxe_champions',
      'handball',
      'nfl',
      'gymnastique',
      'patinage_artistique',
      'sports_extremes',
      'femmes_du_sport',
      'jeunes_talents_du_sport',
      'legendes_du_sport_francais',
      'padel',
      'beach_volley',
      'k_pop_groupes_feminins',
      'k_pop_groupes_masculins',
      'bts',
      'blackpink',
      'afrobeats',
      'latin_pop_reggaeton',
      'rap_us_legendes',
      'r_b',
      'variete_francaise',
      'chanson_francaise_classique',
      'rock_francais',
      'rock_legendes_anglo_us',
      'metal',
      'pop_rock_2000s',
      'electro_edm',
      'house_techno',
      'reggae_dancehall',
      'jazz_legendes',
      'compositeurs_classiques',
      'eurovision',
      'festivals_de_musique',
      'clips_iconiques',
      'duos_collabs_celebres',
      'comedies_musicales',
      'girl_groups_boys_bands_2000s_2010s',
      'musique_annees_80',
      'anime_shonen',
      'studio_ghibli',
      'anime_cultes',
      'dc_comics',
      'films_dreamworks',
      'comedies_francaises',
      'comedies_us_cultes',
      'films_d_horreur',
    ];

    expect(reviewedKeys).toHaveLength(50);
    expect(new Set(reviewedKeys).size).toBe(50);
    expect(reviewedKeys.filter((key) => !TOPIC_COVERS[key])).toEqual([]);
  });

  test('uncurated topics never receive a misleading family photo', () => {
    const uncurated = CATEGORIES.find((category) => !category.cover && !TOPIC_COVERS[category.key]);

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
