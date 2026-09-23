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
    expect(getTopicCover(premierLeague).src).toContain('Premier%20League%20Trophy');
  });

  test('league cards display their reviewed trophy images', () => {
    const ligue1 = CATEGORIES.find((category) => category.key === 'ligue_1');
    const serieA = CATEGORIES.find((category) => category.key === 'serie_a');

    expect(getTopicCover(ligue1).src).toContain('Ligue%201%20Trophy%202024');
    expect(getTopicCover(serieA).src).toContain('Coppa%20Campioni');
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

  test('the third batch of fifty reviewed topics has dedicated covers', () => {
    const reviewedKeys = [
      'science_fiction',
      'films_cultes_90s',
      'films_cultes_2000s',
      'oscars_histoire',
      'cesars',
      'k_pop_rookies_2025_26',
      'pop_us_montante',
      'chappell_roan_pop_alternative',
      'rap_us_nouvelle_generation',
      'drill_fr_uk',
      'musique_annees_90',
      'musique_annees_2010',
      'sons_viraux_tiktok',
      'rappeuses_francaises',
      'nouvelle_scene_rap_fr',
      'wednesday',
      'stranger_things',
      'euphoria',
      'heartbreak_high',
      'xo_kitty',
      'sex_education',
      'k_dramas',
      'squid_game',
      'james_bond',
      'fast_furious',
      'films_de_braquage',
      'realisateurs_cultes',
      'acteurs_hollywoodiens_actuels',
      'actrices_hollywoodiennes_actuelles',
      'stars_du_cinema_coreen',
      'sitcoms_cultes',
      'tele_realite_fr',
      'humoristes_francais',
      'stand_up_us',
      'youtubeurs_francais',
      'streamers_twitch_fr',
      'streamers_internationaux',
      'tiktokeurs_celebres',
      'influenceurs_beaute',
      'createurs_gaming',
      'celebrites_reseaux_sociaux',
      'mode_defiles',
      'icones_de_la_mode',
      'emissions_jeunesse_cultes',
      'dessins_animes_90s_2000s',
      'disney_renaissance',
      'sagas_fantastiques',
      'sherlock_holmes_enquetes',
      'series_policieres',
      'series_medicales',
    ];

    expect(reviewedKeys).toHaveLength(50);
    expect(new Set(reviewedKeys).size).toBe(50);
    expect(reviewedKeys.filter((key) => !TOPIC_COVERS[key])).toEqual([]);
  });

  test('the fourth batch of fifty reviewed topics has dedicated covers', () => {
    const reviewedKeys = [
      'stars_bollywood',
      'cinema_d_auteur_francais',
      'palme_d_or_cannes',
      'acteurs_britanniques',
      'comediens_cultes',
      'personnages_de_contes_de_fees',
      'sagas_young_adult',
      'emissions_de_cuisine',
      'chefs_celebres',
      'top_models',
      'miss_france',
      'culture_meme_internet',
      'comedies_romantiques',
      'biopics_celebres',
      'capitales_du_monde',
      'fleuves_montagnes',
      'europe_culture_histoire',
      'afrique_culture_histoire',
      'asie_culture_histoire',
      'amerique_latine',
      'etats_unis_culture_generale',
      'histoire_antique',
      'mythologie_nordique',
      'moyen_age',
      'premiere_guerre_mondiale',
      'revolutions_dans_le_monde',
      'grandes_explorations',
      'litterature_francaise_classique',
      'litterature_mondiale',
      'philosophes_celebres',
      'peintres_oeuvres_d_art',
      'sculpteurs_monuments',
      'architecture_celebre',
      'merveilles_du_monde',
      'animaux',
      'oceans',
      'dinosaures',
      'environnement_ecologie',
      'inventions_inventeurs',
      'prix_nobel',
      'langues_du_monde',
      'traditions_fetes_du_monde',
      'gastronomie_francaise',
      'gastronomie_du_monde',
      'vins_terroirs',
      'hymnes_nationaux',
      'femmes_celebres_de_l_histoire',
      'dates_cles_de_l_histoire',
      'rois_reines_d_europe',
      'presidents_francais',
    ];

    expect(reviewedKeys).toHaveLength(50);
    expect(new Set(reviewedKeys).size).toBe(50);
    expect(reviewedKeys.filter((key) => !TOPIC_COVERS[key])).toEqual([]);
  });

  test('the final thirty-seven topics have distinct, dedicated covers', () => {
    const reviewedKeys = [
      'presidents_americains',
      'grandes_villes_du_monde',
      'especes_en_voie_de_disparition',
      'histoire_du_maroc',
      'histoire_de_l_algerie',
      'histoire_de_la_tunisie',
      'islam',
      'christianisme',
      'judaisme',
      'bouddhisme',
      'hindouisme',
      'sonic',
      'fifa_ea_sports_fc',
      'assassin_s_creed',
      'the_witcher',
      'elden_ring',
      'among_us',
      'animal_crossing',
      'the_sims',
      'overwatch',
      'counter_strike',
      'world_of_warcraft',
      'streamers_gaming_fr',
      'jeux_mobile_populaires',
      'histoire_des_consoles',
      'fc_barcelone',
      'manchester_united',
      'liverpool',
      'bayern_munich',
      'manchester_city',
      'chelsea',
      'arsenal',
      'inter_milan',
      'borussia_dortmund',
      'ajax_amsterdam',
      'olympique_de_marseille',
      'musique_stars',
    ];

    expect(reviewedKeys).toHaveLength(37);
    expect(new Set(reviewedKeys).size).toBe(37);
    expect(reviewedKeys.filter((key) => !TOPIC_COVERS[key])).toEqual([]);
  });

  test('every quiz category has its own usable cover', () => {
    const uncovered = CATEGORIES.filter((category) => !getTopicCover(category));

    expect(uncovered).toEqual([]);
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
