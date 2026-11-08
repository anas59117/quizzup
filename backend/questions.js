// QuizzUp question bank (local fallback).
// Each question: { text, answers: [4], correct: index }
// Categories match the design's category grid. Extend freely — the game
// picks a random subset per match, so more questions = better replayability.
// `correct` is the 0-based index into `answers` and must always be valid.
//
// Primary source is the Open Trivia DB (see trivia-api.js). This local bank
// is the fallback used when the API is unavailable, rate-limited, or blocked,
// so the game is always playable offline too.

const trivia = require('./trivia-api');
const reports = require('./reports');

// "Guess the player" photo questions, pre-built (image, credit, baked
// distractors) by scripts/fetch-player-photos.js + a one-off build step.
// Kept as data files rather than inline literals so this file stays short.
const playersFootFr = require('./data/players-foot-fr.json');
const footFrExtra = require('./data/foot_fr_extra.json');
const playersRapFr = require('./data/players-rap-fr.json');
const rapFrExtra = require('./data/rap_fr_extra.json');
const playersPremierLeague = require('./data/players-premier-league.json');
const playersLaLiga = require('./data/players-la-liga.json');
const playersBundesliga = require('./data/players-bundesliga.json');
const playersSerieA = require('./data/players-serie-a.json');
const playersLigue1 = require('./data/players-ligue-1.json');
const ligue1 = require('./data/ligue-1-editorial.json');
const playersBollywood = require('./data/players-bollywood.json');
const playersActorsAZ = require('./data/players-actors-az.json');
const playersActorsMZ = require('./data/players-actors-mz.json');

// Batch 1 of the 224-category content expansion (text-only, no photos).
const secondeGuerreMondiale = require('./data/seconde-guerre-mondiale.json');
const espaceAstronomie = require('./data/espace-astronomie.json');
const corpsHumain = require('./data/corps-humain.json');

// Batch 2 — Sport family (text-only, no photos).
const ligueChampions = require('./data/ligue-champions.json');
const coupeDuMondeHistoire = require('./data/coupe-du-monde-histoire.json');
const tourDeFrance = require('./data/tour-de-france.json');
const joEteHistoire = require('./data/jo-ete-histoire.json');

// Batch 3 — Sport family, suite (text-only, no photos).
const canFootAfricain = require('./data/can-foot-africain.json');
const copaAmerica = require('./data/copa-america.json');
const legendesFootAllemandAnglaisItalien = require('./data/legendes-foot-allemand-anglais-italien.json');
const eredivisie = require('./data/eredivisie.json');

// Batch 4 — Sport family, suite (text-only, no photos).
const ligaPortugal = require('./data/liga_portugal.json');
const mls = require('./data/mls.json');
const tennisAtp = require('./data/tennis_atp.json');
const tennisWta = require('./data/tennis_wta.json');
const rolandGarros = require('./data/roland_garros.json');
const wimbledon = require('./data/wimbledon.json');
const rugbyTop14 = require('./data/rugby_top_14.json');
const mmaUfc = require('./data/mma_ufc.json');
const legendesDuCyclisme = require('./data/legendes_du_cyclisme.json');
const natationOlympique = require('./data/natation_olympique.json');
const joDHiverHistoire = require('./data/jo_d_hiver_histoire.json');
const volleyball = require('./data/volleyball.json');
const skiAlpin = require('./data/ski_alpin.json');
const sportsDHiver = require('./data/sports_d_hiver.json');
const golf = require('./data/golf.json');
const nhl = require('./data/nhl.json');
const baseballMlb = require('./data/baseball_mlb.json');
const motogp = require('./data/motogp.json');
const rallyeWrc = require('./data/rallye_wrc.json');

// Batch 5 — clubs & stars populaires (text-only, no photos).
const parisSaintGermain = require('./data/paris_saint_germain.json');
const realMadrid = require('./data/real_madrid.json');
const lionelMessi = require('./data/lionel_messi.json');
const cristianoRonaldo = require('./data/cristiano_ronaldo.json');

// Batch 6 — gaming populaire (text-only, no photos).
const fortnite = require('./data/fortnite.json');
const minecraft = require('./data/minecraft.json');
const gta = require('./data/gta.json');
const leagueOfLegends = require('./data/league_of_legends.json');
const valorant = require('./data/valorant.json');

// Batch 7 — gaming populaire, suite (text-only, no photos).
const roblox = require('./data/roblox.json');
const callOfDuty = require('./data/call_of_duty.json');
const genshinImpact = require('./data/genshin_impact.json');
const zelda = require('./data/zelda.json');
const universMario = require('./data/univers_mario.json');

// Batch 8 — sports internationaux (text-only, no photos).
const rugbyCoupeDuMonde = require('./data/rugby_coupe_du_monde.json');
const xvDeFrance = require('./data/xv_de_france.json');
const boxeChampions = require('./data/boxe_champions.json');
const handball = require('./data/handball.json');
const nfl = require('./data/nfl.json');

// Batch 9 — disciplines et figures sportives (text-only, no photos).
const gymnastique = require('./data/gymnastique.json');
const patinageArtistique = require('./data/patinage_artistique.json');
const sportsExtremes = require('./data/sports_extremes.json');
const femmesDuSport = require('./data/femmes_du_sport.json');
const jeunesTalentsDuSport = require('./data/jeunes_talents_du_sport.json');

// Batch 10 — sports & groupes K-pop (text-only, no photos).
const legendesDuSportFrancais = require('./data/legendes_du_sport_francais.json');
const padel = require('./data/padel.json');
const beachVolley = require('./data/beach_volley.json');
const kPopGroupesFeminins = require('./data/k_pop_groupes_feminins.json');
const kPopGroupesMasculins = require('./data/k_pop_groupes_masculins.json');

// Batch 11 — artistes internationaux (text-only, no photos).
const bts = require('./data/bts.json');
const blackpink = require('./data/blackpink.json');
const afrobeats = require('./data/afrobeats.json');
const latinPopReggaeton = require('./data/latin_pop_reggaeton.json');
const rapUsLegendes = require('./data/rap_us_legendes.json');

// Batch 12 — R&B, chanson et rock (text-only, no photos).
const rB = require('./data/r_b.json');
const varieteFrancaise = require('./data/variete_francaise.json');
const chansonFrancaiseClassique = require('./data/chanson_francaise_classique.json');
const rockFrancais = require('./data/rock_francais.json');
const rockLegendesAngloUs = require('./data/rock_legendes_anglo_us.json');

// Batch 13 — metal, pop rock et musiques électroniques (text-only, no photos).
const metal = require('./data/metal.json');
const popRock2000s = require('./data/pop_rock_2000s.json');
const electroEdm = require('./data/electro_edm.json');
const houseTechno = require('./data/house_techno.json');
const reggaeDancehall = require('./data/reggae_dancehall.json');

// Batch 14 — patrimoine et culture musicale (text-only, no photos).
const jazzLegendes = require('./data/jazz_legendes.json');
const compositeursClassiques = require('./data/compositeurs_classiques.json');
const eurovision = require('./data/eurovision.json');
const festivalsDeMusique = require('./data/festivals_de_musique.json');
const clipsIconiques = require('./data/clips_iconiques.json');

// Batch 15 — collaborations et spectacles musicaux (text-only, no photos).
const duosCollabsCelebres = require('./data/duos_collabs_celebres.json');
const bandesOriginalesDeFilms = require('./data/bandes_originales_de_films.json');
const comediesMusicales = require('./data/comedies_musicales.json');
const girlGroupsBoysBands2000s2010s = require('./data/girl_groups_boys_bands_2000s_2010s.json');
const musiqueAnnees80 = require('./data/musique_annees_80.json');

// Batch 16 — anime, manga et comics (text-only, no photos).
const animeShonen = require('./data/anime_shonen.json');
const studioGhibli = require('./data/studio_ghibli.json');
const animeCultes = require('./data/anime_cultes.json');
const cultureManga = require('./data/culture_manga.json');
const dcComics = require('./data/dc_comics.json');

// Batch 17 — animation et cinéma populaire (text-only, no photos).
const filmsPixar = require('./data/films_pixar.json');
const filmsDreamworks = require('./data/films_dreamworks.json');
const comediesFrancaises = require('./data/comedies_francaises.json');
const comediesUsCultes = require('./data/comedies_us_cultes.json');
const filmsDHorreur = require('./data/films_d_horreur.json');

// Batch 18 — science-fiction, films cultes et récompenses (text-only, no photos).
const scienceFiction = require('./data/science_fiction.json');
const filmsCultes90s = require('./data/films_cultes_90s.json');
const filmsCultes2000s = require('./data/films_cultes_2000s.json');
const oscarsHistoire = require('./data/oscars_histoire.json');
const cesars = require('./data/cesars.json');

// Batch 19 — nouvelles scènes pop, K-pop, rap et drill (text-only, no photos).
const kPopRookies2025_26 = require('./data/k_pop_rookies_2025_26.json');
const popUsMontante = require('./data/pop_us_montante.json');
const chappellRoanPopAlternative = require('./data/chappell_roan_pop_alternative.json');
const rapUsNouvelleGeneration = require('./data/rap_us_nouvelle_generation.json');
const drillFrUk = require('./data/drill_fr_uk.json');

// Batch 20 — décennies, viralité et nouvelles scènes rap FR (text-only, no photos).
const musiqueAnnees90 = require('./data/musique_annees_90.json');
const musiqueAnnees2010 = require('./data/musique_annees_2010.json');
const sonsVirauxTiktok = require('./data/sons_viraux_tiktok.json');
const nouvelleSceneRapFr = require('./data/nouvelle_scene_rap_fr.json');

// Batch 21 — séries adolescentes et fantastiques (text-only, no photos).
const wednesday = require('./data/wednesday.json');
const strangerThings = require('./data/stranger_things.json');
const euphoria = require('./data/euphoria.json');
const heartbreakHigh = require('./data/heartbreak_high.json');
const xoKitty = require('./data/xo_kitty.json');

// Batch 22 — séries internationales et franchises cinéma (text-only, no photos).
const sexEducation = require('./data/sex_education.json');
const kDramas = require('./data/k_dramas.json');
const squidGame = require('./data/squid_game.json');
const jamesBond = require('./data/james_bond.json');
const fastFurious = require('./data/fast_furious.json');

// Batch 23 — braquages, cinéastes et interprètes (text-only, no photos).
const filmsDeBraquage = require('./data/films_de_braquage.json');
const realisateursCultes = require('./data/realisateurs_cultes.json');
const acteursHollywoodiensActuels = require('./data/acteurs_hollywoodiens_actuels.json');
const actricesHollywoodiennesActuelles = require('./data/actrices_hollywoodiennes_actuelles.json');
const starsDuCinemaCoreen = require('./data/stars_du_cinema_coreen.json');

// Batch 24 — humour, télévision et créateurs (text-only, no photos).
const sitcomsCultes = require('./data/sitcoms_cultes.json');
const teleRealiteFr = require('./data/tele_realite_fr.json');
const humoristesFrancais = require('./data/humoristes_francais.json');
const standUpUs = require('./data/stand_up_us.json');
const youtubeursFrancais = require('./data/youtubeurs_francais.json');

// Batch 25 — streamers, influence et création gaming (text-only, no photos).
const streamersTwitchFr = require('./data/streamers_twitch_fr.json');
const streamersInternationaux = require('./data/streamers_internationaux.json');
const tiktokeursCelebres = require('./data/tiktokeurs_celebres.json');
const influenceursBeaute = require('./data/influenceurs_beaute.json');
const createursGaming = require('./data/createurs_gaming.json');

// Batch 26 — réseaux sociaux, mode et jeunesse (text-only, no photos).
const celebritesReseauxSociaux = require('./data/celebrites_reseaux_sociaux.json');
const modeDefiles = require('./data/mode_defiles.json');
const iconesDeLaMode = require('./data/icones_de_la_mode.json');
const emissionsJeunesseCultes = require('./data/emissions_jeunesse_cultes.json');
const dessinsAnimes90s2000s = require('./data/dessins_animes_90s_2000s.json');

// Batch 27 — Disney, fantastique et séries de genre (text-only, no photos).
const disneyRenaissance = require('./data/disney_renaissance.json');
const sagasFantastiques = require('./data/sagas_fantastiques.json');
const sherlockHolmesEnquetes = require('./data/sherlock_holmes_enquetes.json');
const seriesPolicieres = require('./data/series_policieres.json');
const seriesMedicales = require('./data/series_medicales.json');

// Batch 28 — cinéma international, auteurs et comédiens (text-only, no photos).
const starsBollywood = require('./data/stars_bollywood.json');
const cinemaDAuteurFrancais = require('./data/cinema_d_auteur_francais.json');
const palmeDOrCannes = require('./data/palme_d_or_cannes.json');
const acteursBritanniques = require('./data/acteurs_britanniques.json');
const comediensCultes = require('./data/comediens_cultes.json');

// Batch 29 — contes, young adult, cuisine et mode (text-only, no photos).
const personnagesDeContesDeFees = require('./data/personnages_de_contes_de_fees.json');
const sagasYoungAdult = require('./data/sagas_young_adult.json');
const emissionsDeCuisine = require('./data/emissions_de_cuisine.json');
const chefsCelebres = require('./data/chefs_celebres.json');
const topModels = require('./data/top_models.json');

// Batch 30 — concours, culture internet et cinéma populaire (text-only, no photos).
const missFrance = require('./data/miss_france.json');
const cultureMemeInternet = require('./data/culture_meme_internet.json');
const comediesRomantiques = require('./data/comedies_romantiques.json');
const filmsMusicaux = require('./data/films_musicaux.json');
const biopicsCelebres = require('./data/biopics_celebres.json');
// Batch 31 — culture générale : géographie, histoire, mythologies, lettres et arts.
const capitalesDuMonde = require('./data/capitales_du_monde.json');
const fleuvesMontagnes = require('./data/fleuves_montagnes.json');
const europeCultureHistoire = require('./data/europe_culture_histoire.json');
const afriqueCultureHistoire = require('./data/afrique_culture_histoire.json');
const asieCultureHistoire = require('./data/asie_culture_histoire.json');
const ameriqueLatine = require('./data/amerique_latine.json');
const etatsUnisCultureGenerale = require('./data/etats_unis_culture_generale.json');
const histoireAntique = require('./data/histoire_antique.json');
const mythologieGrecque = require('./data/mythologie_grecque.json');
const mythologieNordique = require('./data/mythologie_nordique.json');
const mythologieEgyptienne = require('./data/mythologie_egyptienne.json');
const moyenAge = require('./data/moyen_age.json');
const premiereGuerreMondiale = require('./data/premiere_guerre_mondiale.json');
const revolutionsDansLeMonde = require('./data/revolutions_dans_le_monde.json');
const grandesExplorations = require('./data/grandes_explorations.json');
const litteratureFrancaiseClassique = require('./data/litterature_francaise_classique.json');
const litteratureMondiale = require('./data/litterature_mondiale.json');
const philosophesCelebres = require('./data/philosophes_celebres.json');
const peintresOeuvresDArt = require('./data/peintres_oeuvres_d_art.json');
const sculpteursMonuments = require('./data/sculpteurs_monuments.json');
// Batch 32 — culture générale étendue et Sonic.
const architectureCelebre = require('./data/architecture_celebre.json');
const merveillesDuMonde = require('./data/merveilles_du_monde.json');
const animaux = require('./data/animaux.json');
const oceans = require('./data/oceans.json');
const dinosaures = require('./data/dinosaures.json');
const environnementEcologie = require('./data/environnement_ecologie.json');
const inventionsInventeurs = require('./data/inventions_inventeurs.json');
const prixNobel = require('./data/prix_nobel.json');
const languesDuMonde = require('./data/langues_du_monde.json');
const traditionsFetesDuMonde = require('./data/traditions_fetes_du_monde.json');
const gastronomieFrancaise = require('./data/gastronomie_francaise.json');
const gastronomieDuMonde = require('./data/gastronomie_du_monde.json');
const vinsTerroirs = require('./data/vins_terroirs.json');
const hymnesNationaux = require('./data/hymnes_nationaux.json');
const femmesCelebresDeLHistoire = require('./data/femmes_celebres_de_l_histoire.json');
const datesClesDeLHistoire = require('./data/dates_cles_de_l_histoire.json');
const roisReinesDEurope = require('./data/rois_reines_d_europe.json');
const presidentsFrancais = require('./data/presidents_francais.json');
const presidentsAmericains = require('./data/presidents_americains.json');
const grandesVillesDuMonde = require('./data/grandes_villes_du_monde.json');
const especesEnVoieDeDisparition = require('./data/especes_en_voie_de_disparition.json');
const histoireDuMaroc = require('./data/histoire_du_maroc.json');
const histoireDeLAlgerie = require('./data/histoire_de_l_algerie.json');
const histoireDeLaTunisie = require('./data/histoire_de_la_tunisie.json');
const islam = require('./data/islam.json');
const christianisme = require('./data/christianisme.json');
const judaisme = require('./data/judaisme.json');
const bouddhisme = require('./data/bouddhisme.json');
const hindouisme = require('./data/hindouisme.json');
const sonic = require('./data/sonic.json');

// Batch 33 — lot final : gaming, grands clubs et stars.
const fifaEaSportsFc = require('./data/fifa_ea_sports_fc.json');
const assassinSCreed = require('./data/assassin_s_creed.json');
const theWitcher = require('./data/the_witcher.json');
const eldenRing = require('./data/elden_ring.json');
const animalCrossing = require('./data/animal_crossing.json');
const theSims = require('./data/the_sims.json');
const overwatch = require('./data/overwatch.json');
const counterStrike = require('./data/counter_strike.json');
const worldOfWarcraft = require('./data/world_of_warcraft.json');
const legendesDeLEsport = require('./data/legendes_de_l_esport.json');
const streamersGamingFr = require('./data/streamers_gaming_fr.json');
const jeuxMobilePopulaires = require('./data/jeux_mobile_populaires.json');
const histoireDesConsoles = require('./data/histoire_des_consoles.json');
const fcBarcelone = require('./data/fc_barcelone.json');
const manchesterUnited = require('./data/manchester_united.json');
const liverpool = require('./data/liverpool.json');
const bayernMunich = require('./data/bayern_munich.json');
const manchesterCity = require('./data/manchester_city.json');
const chelsea = require('./data/chelsea.json');
const arsenal = require('./data/arsenal.json');
const interMilan = require('./data/inter_milan.json');
const borussiaDortmund = require('./data/borussia_dortmund.json');
const olympiqueDeMarseille = require('./data/olympique_de_marseille.json');
const cyclismeStars = require('./data/cyclisme_stars.json');
const musiqueStars = require('./data/musique_stars.json');

// Catalogue expansion batch 1 — artists, anime and flagship series.
const booba = require('./data/booba.json');
const jul = require('./data/jul.json');
const pnl = require('./data/pnl.json');
const ninho = require('./data/ninho.json');
const sch = require('./data/sch.json');
const damso = require('./data/damso.json');
const orelsan = require('./data/orelsan.json');
const gims = require('./data/gims.json');
const ayaNakamura = require('./data/aya_nakamura.json');
const nekfeu = require('./data/nekfeu.json');
const gazo = require('./data/gazo.json');
const tiakola = require('./data/tiakola.json');
const lomepal = require('./data/lomepal.json');
const soprano = require('./data/soprano.json');
const drake = require('./data/drake.json');
const eminem = require('./data/eminem.json');
const kanyeWest = require('./data/kanye_west.json');
const travisScott = require('./data/travis_scott.json');
const theWeeknd = require('./data/the_weeknd.json');
const rihanna = require('./data/rihanna.json');
const beyonce = require('./data/beyonce.json');
const taylorSwift = require('./data/taylor_swift.json');
const michaelJackson = require('./data/michael_jackson.json');
const duaLipa = require('./data/dua_lipa.json');
const billieEilish = require('./data/billie_eilish.json');
const onePiece = require('./data/one_piece.json');
const naruto = require('./data/naruto.json');
const dragonBall = require('./data/dragon_ball.json');
const demonSlayer = require('./data/demon_slayer.json');
const jujutsuKaisen = require('./data/jujutsu_kaisen.json');
const attaqueDesTitans = require('./data/attaque_des_titans.json');
const hunterXHunter = require('./data/hunter_x_hunter.json');
const myHeroAcademia = require('./data/my_hero_academia.json');
const deathNote = require('./data/death_note.json');
const mangaBleach = require('./data/bleach.json');
const mangaFullmetalAlchemist = require('./data/fullmetal_alchemist.json');
const mangaChainsawMan = require('./data/chainsaw_man.json');
const mangaSpyXFamily = require('./data/spy_x_family.json');
const mangaTokyoRevengers = require('./data/tokyo_revengers.json');
const mangaHaikyu = require('./data/haikyu.json');
const mangaBlueLock = require('./data/blue_lock.json');
const mangaJojo = require('./data/jojo.json');
const mangaSaintSeiya = require('./data/saint_seiya.json');
const mangaFairyTail = require('./data/fairy_tail.json');
const mangaCaptainTsubasa = require('./data/captain_tsubasa.json');
const mangaSlamDunk = require('./data/slam_dunk.json');
const mangaBerserk = require('./data/berserk.json');
const mangaVinlandSaga = require('./data/vinland_saga.json');
const mangaTokyoGhoul = require('./data/tokyo_ghoul.json');
const mangaBlackClover = require('./data/black_clover.json');
const mangaDrStone = require('./data/dr_stone.json');
const mangaCityHunter = require('./data/city_hunter.json');
const mangaDetectiveConan = require('./data/detective_conan.json');
const mangaOnePunchMan = require('./data/one_punch_man.json');
const mangaHokutoNoKen = require('./data/hokuto_no_ken.json');
const mangaDoraemon = require('./data/doraemon.json');
const mangaGolgo13 = require('./data/golgo_13.json');
const mangaKochikame = require('./data/kochikame.json');
const mangaCrayonShinChan = require('./data/crayon_shin_chan.json');
const mangaOishinbo = require('./data/oishinbo.json');
const mangaKingdom = require('./data/kingdom.json');
const mangaAstroBoy = require('./data/astro_boy.json');
const mangaBaki = require('./data/baki.json');
const mangaHajimeNoIppo = require('./data/hajime_no_ippo.json');
const mangaKindaichi = require('./data/kindaichi.json');
const mangaTouch = require('./data/touch.json');
const breakingBad = require('./data/breaking_bad.json');
const theWalkingDead = require('./data/the_walking_dead.json');
const laCasaDePapel = require('./data/la_casa_de_papel.json');
const peakyBlinders = require('./data/peaky_blinders.json');
const theBoys = require('./data/the_boys.json');
const theLastOfUsSerie = require('./data/the_last_of_us_serie.json');
const houseOfTheDragon = require('./data/house_of_the_dragon.json');
const friends = require('./data/friends.json');
const theOffice = require('./data/the_office.json');
const vikings = require('./data/vikings.json');
const prisonBreak = require('./data/prison_break.json');
const blackMirror = require('./data/black_mirror.json');
const lesSimpson = require('./data/les_simpson.json');
const southPark = require('./data/south_park.json');
const avatarLeDernierMaitreDeLAir = require('./data/avatar_le_dernier_maitre_de_l_air.json');
const bobLEponge = require('./data/bob_l_eponge.json');
const shrek = require('./data/shrek.json');
const jurassicPark = require('./data/jurassic_park.json');
const indianaJones = require('./data/indiana_jones.json');
const leSeigneurDesAnneaux = require('./data/le_seigneur_des_anneaux.json');
const missionImpossible = require('./data/mission_impossible.json');
const gtaV = require('./data/gta_v.json');
const gtaSanAndreas = require('./data/gta_san_andreas.json');
const redDeadRedemption = require('./data/red_dead_redemption.json');
const godOfWar = require('./data/god_of_war.json');
const residentEvil = require('./data/resident_evil.json');
const finalFantasy = require('./data/final_fantasy.json');
const brawlStars = require('./data/brawl_stars.json');
const clashRoyale = require('./data/clash_royale.json');
const rocketLeague = require('./data/rocket_league.json');
const playstation = require('./data/playstation.json');
const nintendo = require('./data/nintendo.json');
const xbox = require('./data/xbox.json');
const superSmashBros = require('./data/super_smash_bros.json');
const marioKart = require('./data/mario_kart.json');
const cyberpunk_2077 = require('./data/cyberpunk_2077.json');
const theLastOfUsJeux = require('./data/the_last_of_us_jeux.json');
const uncharted = require('./data/uncharted.json');
const metalGear = require('./data/metal_gear.json');
const tombRaider = require('./data/tomb_raider.json');
const streetFighter = require('./data/street_fighter.json');
const equipeDeFranceFootball = require('./data/equipe_de_france_football.json');
const marocFootball = require('./data/maroc_football.json');
const algerieFootball = require('./data/algerie_football.json');
const portugalFootball = require('./data/portugal_football.json');
const bresilFootball = require('./data/bresil_football.json');
const argentineFootball = require('./data/argentine_football.json');
const juventus = require('./data/juventus.json');
const acMilan = require('./data/ac_milan.json');
const atleticoDeMadrid = require('./data/atletico_de_madrid.json');
const napoli = require('./data/napoli.json');
const kylianMbappe = require('./data/kylian_mbappe.json');
const zinedineZidane = require('./data/zinedine_zidane.json');
const neymar = require('./data/neymar.json');
const ronaldinho = require('./data/ronaldinho.json');
const karimBenzema = require('./data/karim_benzema.json');
const thierryHenry = require('./data/thierry_henry.json');
const erlingHaaland = require('./data/erling_haaland.json');
const mohamedSalah = require('./data/mohamed_salah.json');
const lebronJames = require('./data/lebron_james.json');
const michaelJordan = require('./data/michael_jordan.json');
const automobile = require('./data/automobile.json');
const logosGrandesMarques = require('./data/logos_grandes_marques.json');
const sneakers = require('./data/sneakers.json');
const marquesDeLuxe = require('./data/marques_de_luxe.json');
const smartphones = require('./data/smartphones.json');
const technologieGrandPublic = require('./data/technologie_grand_public.json');
const fastFood = require('./data/fast_food.json');
const annees_2000 = require('./data/annees_2000.json');
const internetReseauxSociaux = require('./data/internet_reseaux_sociaux.json');
const monumentsDeFrance = require('./data/monuments_de_france.json');
const geographieDeFrance = require('./data/geographie_de_france.json');
const ballonDOr = require('./data/ballon_d_or.json');
const kaamelottQuiz = require('./data/kaamelott.json');
const lupinQuiz = require('./data/lupin.json');
const arcaneQuiz = require('./data/arcane.json');
const bridgertonQuiz = require('./data/bridgerton.json');
const gossipGirlQuiz = require('./data/gossip_girl.json');



// "Qui est-ce ?" photo quizzes, harvested from Wikidata/Wikipedia (CC-licensed
// portraits) + flagcdn.com for Drapeaux, then manually filtered to remove
// occupation-mismatch contamination from the raw Wikidata query results.
const playersTennis = require('./data/tennis.json');
const playersBasketball = require('./data/basketball.json');
const playersRugby = require('./data/rugby.json');
const playersBoxe = require('./data/boxe.json');
const playersAthletisme = require('./data/athletisme.json');
const playersScience = require('./data/science.json');
const playersHumour = require('./data/humour.json');
const playersMode = require('./data/mode.json');
const playersKpop = require('./data/kpop.json');
const playersSeriesAdoRomance = require('./data/series_ado_romance.json');
const playersDrapeaux = require('./data/drapeaux.json');
const soloLeveling = require('./data/solo_leveling.json');
const lamineYamal = require('./data/lamine_yamal.json');
const piratesDesCaraibes = require('./data/pirates_des_caraibes.json');
const stromae = require('./data/stromae.json');
const frieren = require('./data/frieren.json');
const oshiNoKo = require('./data/oshi_no_ko.json');
const dandadan = require('./data/dandadan.json');
const kaijuNo8 = require('./data/kaiju_no_8.json');
const mashle = require('./data/mashle.json');
const sakamotoDays = require('./data/sakamoto_days.json');
const falloutSerie = require('./data/fallout_serie.json');
const duneFilm = require('./data/dune_film.json');
const inoxtag = require('./data/inoxtag.json');
const squeezie = require('./data/squeezie.json');
const michou = require('./data/michou.json');
const freezeCorleone = require('./data/freeze_corleone.json');
const werenoi = require('./data/werenoi.json');
const sdm = require('./data/sdm.json');
const niska = require('./data/niska.json');
const aminematue = require('./data/aminematue.json');

// Batch 34 — catalogue expansion: 55 new quizzes (football, music, series, gaming, culture).
const footballFeminin = require('./data/football_feminin.json');
const tottenham = require('./data/tottenham.json');
const asRoma = require('./data/as_roma.json');
const benfica = require('./data/benfica.json');
const galatasaray = require('./data/galatasaray.json');
const espagneFootball = require('./data/espagne_football.json');
const gardiensLegendaires = require('./data/gardiens_legendaires.json');
const cricket = require('./data/cricket.json');
const judo = require('./data/judo.json');
const surf = require('./data/surf.json');
const skateboard = require('./data/skateboard.json');
const escalade = require('./data/escalade.json');
const countryMusic = require('./data/country_music.json');
const punkGrunge = require('./data/punk_grunge.json');
const musiqueArabeRai = require('./data/musique_arabe_rai.json');
const arianaGrande = require('./data/ariana_grande.json');
const badBunny = require('./data/bad_bunny.json');
const brunoMars = require('./data/bruno_mars.json');
const apexLegends = require('./data/apex_legends.json');
const darkSouls = require('./data/dark_souls.json');
const diablo = require('./data/diablo.json');
const halo = require('./data/halo.json');
const tekkenMortalKombat = require('./data/tekken_mortal_kombat.json');
const vald = require('./data/vald.json');
const laylow = require('./data/laylow.json');
const plk = require('./data/plk.json');
const hamza = require('./data/hamza.json');
const rickAndMorty = require('./data/rick_and_morty.json');
const narcos = require('./data/narcos.json');
const mathematiquesLogique = require('./data/mathematiques_logique.json');
const informatiqueTechnologie = require('./data/informatique_technologie.json');
const economieFinance = require('./data/economie_finance.json');
const psychologie = require('./data/psychologie.json');
const droitJustice = require('./data/droit_justice.json');
const allemagneFootball = require('./data/allemagne_football.json');
const angleterreFootball = require('./data/angleterre_football.json');
const senegalFootball = require('./data/senegal_football.json');
const transfertsMercato = require('./data/transferts_mercato.json');
const congoRdc = require('./data/congo_rdc.json');
const entrepreneursTech = require('./data/entrepreneurs_tech.json');
const rappeursUk = require('./data/rappeurs_uk.json');
const edSheeran = require('./data/ed_sheeran.json');
const postMalone = require('./data/post_malone.json');
const kendrickLamar = require('./data/kendrick_lamar.json');
const jCole = require('./data/j_cole.json');
const betterCallSaul = require('./data/better_call_saul.json');
const suits = require('./data/suits.json');
const greySAnatomy = require('./data/grey_s_anatomy.json');
const theMandalorian = require('./data/the_mandalorian.json');
const familyGuy = require('./data/family_guy.json');
const stardewValley = require('./data/stardew_valley.json');
const recordsDuMonde = require('./data/records_du_monde.json');
const phenomenesNaturels = require('./data/phenomenes_naturels.json');
const monnaiesDuMonde = require('./data/monnaies_du_monde.json');
const ilesDuMonde = require('./data/iles_du_monde.json');
const moviesEditorial = require('./data/movies-editorial.json');
const musicEditorial = require('./data/music-editorial.json');
const sportsEditorial = require('./data/sports-editorial.json');
const gamingEditorial = require('./data/gaming-editorial.json');
const scienceEditorial = require('./data/science-editorial.json');
const geographyEditorial = require('./data/geography-editorial.json');
const histoireFrEditorial = require('./data/histoire-fr-editorial.json');
const cultureFrEditorial = require('./data/culture-fr-editorial.json');
const gotEditorial = require('./data/got-editorial.json');
const f1Editorial = require('./data/f1-editorial.json');
const tvShowsEditorial = require('./data/tv-shows-editorial.json');
const retroGamesEditorial = require('./data/retro-games-editorial.json');
const cinemaFrEditorial = require('./data/cinema-fr-editorial.json');
const bollywoodEditorial = require('./data/bollywood-editorial.json');

const premierLeagueVarietyQuestions = require('./data/premier-league-variety.json');
const laLigaVarietyQuestions = require('./data/la-liga-variety.json');
const bundesligaVarietyQuestions = require('./data/bundesliga-variety.json');
const serieAVarietyQuestions = require('./data/serie-a-variety.json');
const actorsVarietyQuestions = require('./data/actors-variety.json');
const tennisVarietyQuestions = require('./data/tennis-variety.json');
const rugbyVarietyQuestions = require('./data/rugby-variety.json');
const athletismeVarietyQuestions = require('./data/athletisme-variety.json');
const scienceStarsVarietyQuestions = require('./data/science-stars-variety.json');
const humourVarietyQuestions = require('./data/humour-variety.json');
const modeVarietyQuestions = require('./data/mode-variety.json');
const kpopVarietyQuestions = require('./data/kpop-variety.json');
const seriesAdoRomanceVarietyQuestions = require('./data/series-ado-romance-variety.json');

const GENERAL_QUIZ_VARIETY = { minAngles: 4 };
const AUDITED_QUESTION_VARIETY = { maxPerOpening: 3, mixLegacyDifficulty: true };
const AUDITED_WINNER_VARIETY = { ...AUDITED_QUESTION_VARIETY, limitedFormat: 'winner', maxPerMatch: 2 };
const AUDITED_DATE_VARIETY = { ...AUDITED_QUESTION_VARIETY, limitedFormat: 'date', maxPerMatch: 2 };
const AUDITED_ALBUM_VARIETY = { ...AUDITED_QUESTION_VARIETY, limitedFormat: 'album', maxPerMatch: 2 };
const AUDITED_ATTRIBUTION_VARIETY = { ...AUDITED_QUESTION_VARIETY, limitedFormat: 'attribution', maxPerMatch: 2 };
const PORTRAIT_QUIZ_VARIETY = { minAngles: 4, limitedFormat: 'portrait', maxPerMatch: 2 };

function withPortraits(photos, editorial, angle) {
  return [
    ...photos.map((question, index) => ({
      ...question,
      angle,
      format: 'portrait',
      fact: 'portrait:' + question.image,
      difficulty: index < photos.length / 2 ? 'easy' : 'medium',
    })),
    ...editorial,
  ];
}

const CATEGORIES = {
  movies: {
    label: 'Cinéma',
    icon: '🎬',
    variety: GENERAL_QUIZ_VARIETY,
    questions: moviesEditorial,
  },
  music: {
    label: 'Musique',
    icon: '🎵',
    variety: GENERAL_QUIZ_VARIETY,
    questions: musicEditorial,
  },
  sports: {
    label: 'Sports',
    icon: '⚽',
    variety: GENERAL_QUIZ_VARIETY,
    questions: sportsEditorial,
  },
  geography: {
    label: 'Géographie',
    icon: '🌍',
    variety: GENERAL_QUIZ_VARIETY,
    questions: geographyEditorial,
  },
  gaming: {
    label: 'Gaming',
    icon: '🎮',
    variety: GENERAL_QUIZ_VARIETY,
    questions: gamingEditorial,
  },
  science: {
    label: 'Science',
    icon: '🧬',
    variety: GENERAL_QUIZ_VARIETY,
    questions: scienceEditorial,
  },
  rap_fr: {
    label: 'Rap Français',
    icon: '🎤',
    questions: [
      { text: 'Quel est le vrai nom de Booba ?', answers: ['Elie Yaffa', 'Karim Zenoud', 'Laurent Mekhazni', 'Sofiane Zermani'], correct: 0 },
      { text: 'PNL est un groupe composé de deux...', answers: ['Cousins', 'Frères', 'Amis d’enfance', 'Voisins'], correct: 1 },
      { text: 'De quelle ville vient Jul ?', answers: ['Paris', 'Lyon', 'Marseille', 'Toulouse'], correct: 2 },
      { text: 'Booba a débuté sa carrière au sein de quel groupe ?', answers: ['Lunatic', 'Sexion d’Assaut', 'NTM', 'IAM'], correct: 0 },
      { text: 'Quel rappeur a sorti l’album "Nero Nemesis" ?', answers: ['Gazo', 'Booba', 'Freeze Corleone', 'Damso'], correct: 1 },
      { text: 'Quel est le titre du premier album studio de Jul ?', answers: ['La Zone', 'Dans ma paranoïa', 'Extra Terrestre', 'D’or et de platine'], correct: 1 },
      { text: 'Gradur est originaire de quelle ville ?', answers: ['Sarcelles', 'Grigny', 'Roubaix', 'Vitry'], correct: 2 },
      { text: 'En août 2018, une bagarre médiatisée entre Booba et Kaaris a éclaté dans quel aéroport ?', answers: ['Roissy CDG', 'Orly', 'Marseille Provence', 'Nice'], correct: 1 },
      { text: 'Bigflo et Oli sont originaires de quelle ville ?', answers: ['Bordeaux', 'Lyon', 'Toulouse', 'Nantes'], correct: 2 },
      { text: 'Dans quelle ville SCH a-t-il grandi ?', answers: ['Paris', 'Aubagne', 'Aix-en-Provence', 'Toulon'], correct: 1 },
      ...playersRapFr,
      { text: 'Sur quel label indépendant Lunatic a-t-il publié l’album Mauvais Œil ?', answers: ['Secteur Ä', '45 Scientific', 'Time Bomb', 'Hostile Records'], correct: 1, difficulty: 'expert' },
      ...rapFrExtra,
    ],
  },
  foot_fr: {
    label: 'Foot Français',
    icon: '⚽',
    questions: [
      { text: 'Zidane a marqué combien de buts en finale de la Coupe du Monde 1998 ?', answers: ['1', '2', '3', '0'], correct: 1 },
      { text: 'Quel club joue au Parc des Princes ?', answers: ['Olympique de Marseille', 'AS Monaco', 'Paris Saint-Germain', 'Olympique Lyonnais'], correct: 2 },
      { text: 'L’AS Saint-Étienne est surnommée...', answers: ['Les Rouges', 'Les Verts', 'Les Bleus', 'Les Girondins'], correct: 1 },
      { text: 'L’Olympique de Marseille joue dans quel stade ?', answers: ['Parc des Princes', 'Stade Vélodrome', 'Groupama Stadium', 'Stade Louis II'], correct: 1 },
      { text: 'Qui a remporté le Ballon d’Or en 1998, année où la France a gagné la Coupe du Monde ?', answers: ['Thierry Henry', 'Michel Platini', 'Zinedine Zidane', 'Just Fontaine'], correct: 2 },
      { text: 'En quelle année la France a-t-elle remporté sa première Coupe du Monde ?', answers: ['1994', '1998', '2000', '2006'], correct: 1 },
      { text: 'Quel joueur français détient le record de buts en une seule Coupe du Monde (13 buts en 1958) ?', answers: ['Just Fontaine', 'Michel Platini', 'Thierry Henry', 'Kylian Mbappé'], correct: 0 },
      { text: 'L’Olympique Lyonnais joue dans quel stade depuis 2016 ?', answers: ['Stade Vélodrome', 'Parc des Princes', 'Groupama Stadium', 'Allianz Riviera'], correct: 2 },
      { text: 'Quel est le principal club de la ville de Monaco en Ligue 1 ?', answers: ['AS Monaco', 'OGC Nice', 'SC Toulon', 'AS Cannes'], correct: 0 },
      { text: 'Michel Platini a remporté combien de Ballons d’Or consécutifs (1983-1985) ?', answers: ['1', '2', '3', '4'], correct: 2 },
      ...playersFootFr,
      { text: 'Qui a inscrit le quatrième but français contre la Belgique lors du match pour la troisième place du Mondial 1986 ?', answers: ['Jean-Marc Ferreri', 'Jean-Pierre Papin', 'Bernard Genghini', 'Manuel Amoros'], correct: 3, difficulty: 'expert' },
      { text: 'Quel défenseur inscrit un doublé pour les Bleus contre le Portugal en demi-finale de l’Euro 1984 ?', answers: ['Jean-François Domergue', 'Manuel Amoros', 'Maxime Bossis', 'Marius Trésor'], correct: 0, difficulty: 'expert' },
      { text: 'Qui inscrit le troisième but français lors de la finale mondiale 1998 contre le Brésil ?', answers: ['Youri Djorkaeff', 'Emmanuel Petit', 'Christophe Dugarry', 'Lilian Thuram'], correct: 1, difficulty: 'expert' },
      { text: 'Qui égalise pour la France contre l’Italie dans les arrêts de jeu de la finale de l’Euro 2000 ?', answers: ['David Trezeguet', 'Thierry Henry', 'Sylvain Wiltord', 'Robert Pirès'], correct: 2, difficulty: 'expert' },
      { text: 'Quel joueur français reprend le coup franc de Zidane pour marquer contre le Brésil en quart de finale du Mondial 2006 ?', answers: ['Patrick Vieira', 'Franck Ribéry', 'Florent Malouda', 'Thierry Henry'], correct: 3, difficulty: 'expert' },
      ...footFrExtra,
    ],
  },
  premier_league: {
    label: 'Premier League',
    icon: '🦁',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersPremierLeague.filter(question => question.image), premierLeagueVarietyQuestions, 'joueurs'),
  },
  la_liga: {
    label: 'La Liga',
    icon: '🐂',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersLaLiga, laLigaVarietyQuestions, 'joueurs'),
  },
  bundesliga: {
    label: 'Bundesliga',
    icon: '🦅',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersBundesliga, bundesligaVarietyQuestions, 'joueurs'),
  },
  serie_a: {
    label: 'Serie A',
    icon: '👢',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersSerieA, serieAVarietyQuestions, 'joueurs'),
  },
  ligue_1: {
    label: 'Ligue 1',
    icon: '🐓',
    variety: { minAngles: 4, limitedFormat: 'portrait', maxPerMatch: 2 },
    questions: [
      ...playersLigue1.map(question => ({
        ...question,
        angle: 'joueurs',
        format: 'portrait',
        fact: 'portrait:' + question.answers[question.correct],
      })),
      ...ligue1,
    ],
  },
  bollywood: {
    label: 'Bollywood',
    icon: '🇮🇳',
    variety: { minAngles: 4, limitedFormat: 'portrait', maxPerMatch: 2 },
    questions: [
      ...playersBollywood.map((question, index) => ({
        ...question,
        angle: 'personnages',
        format: 'portrait',
        fact: 'portrait:' + question.image,
        difficulty: index < 7 ? 'easy' : 'medium',
      })),
      ...bollywoodEditorial,
    ],
  },
  actors: {
    label: 'Acteurs',
    icon: '⭐',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits([...playersActorsAZ, ...playersActorsMZ], actorsVarietyQuestions, 'personnes'),
  },
  netflix: {
    label: 'Netflix',
    icon: '🎬',
    questions: [...require('./data/netflix.json')],
  },
  got: {
    label: 'Game of Thrones',
    icon: '🐉',
    variety: GENERAL_QUIZ_VARIETY,
    questions: gotEditorial,
  },
  harry_potter: {
    label: 'Harry Potter',
    icon: '🪄',
    questions: [...require('./data/harry_potter.json')],
  },
  marvel: {
    label: 'Marvel',
    icon: '🦸',
    questions: [...require('./data/marvel.json')],
  },
  spider_man: {
    label: 'Spider-Man',
    icon: '🕷️',
    questions: [...require('./data/spider_man.json')],
  },
  batman: {
    label: 'Batman',
    icon: '🦇',
    questions: [...require('./data/batman.json')],
  },
  star_wars: {
    label: 'Star Wars',
    icon: '⚔️',
    questions: [...require('./data/star_wars.json')],
  },
  disney: {
    label: 'Classiques Disney',
    icon: '🏰',
    questions: [...require('./data/disney.json')],
  },
  pokemon: {
    label: 'Pokémon',
    icon: '⚡',
    questions: [...require('./data/pokemon.json')],
  },
  f1: {
    label: 'Formule 1',
    icon: '🏎️',
    variety: GENERAL_QUIZ_VARIETY,
    questions: f1Editorial,
  },
  nba: {
    label: 'Basket NBA',
    icon: '🏀',
    questions: [...require('./data/nba.json')],
  },
  tv_shows: {
    label: 'Séries Cultes',
    icon: '📺',
    variety: GENERAL_QUIZ_VARIETY,
    questions: tvShowsEditorial,
  },
  histoire_fr: {
    label: 'Histoire de France',
    icon: '⚜️',
    variety: GENERAL_QUIZ_VARIETY,
    questions: histoireFrEditorial,
  },
  seconde_guerre_mondiale: {
    label: 'Seconde Guerre Mondiale',
    icon: '⚔️',
    questions: [...secondeGuerreMondiale],
  },
  espace_astronomie: {
    label: 'Espace & Astronomie',
    icon: '🚀',
    questions: [...espaceAstronomie],
  },
  corps_humain: {
    label: 'Corps Humain',
    icon: '🫀',
    questions: [...corpsHumain],
  },
  ligue_champions: {
    label: 'Ligue des Champions',
    icon: '🏆',
    questions: [...ligueChampions],
  },
  coupe_du_monde_histoire: {
    label: 'Coupe du Monde (Histoire)',
    icon: '🌍',
    questions: [...coupeDuMondeHistoire],
  },
  tour_de_france: {
    label: 'Tour de France',
    icon: '🚴',
    variety: AUDITED_WINNER_VARIETY,
    questions: [...tourDeFrance],
  },
  jo_ete_histoire: {
    label: "JO d'Été (Histoire)",
    icon: '🥇',
    questions: [...joEteHistoire],
  },
  can_foot_africain: {
    label: "CAN (Foot Africain)",
    icon: '🌍',
    questions: [...canFootAfricain],
  },
  copa_america: {
    label: 'Copa América',
    icon: '🏆',
    questions: [...copaAmerica],
  },
  legendes_foot_allemand_anglais_italien: {
    label: 'Légendes Foot ALL/ANG/ITA',
    icon: '⭐',
    questions: [...legendesFootAllemandAnglaisItalien],
  },
  eredivisie: {
    label: 'Eredivisie',
    icon: '🇳🇱',
    questions: [...eredivisie],
  },
  retro_games: {
    label: 'Jeux Vidéo Rétro',
    icon: '👾',
    variety: GENERAL_QUIZ_VARIETY,
    questions: retroGamesEditorial,
  },
  cinema_fr: {
    label: 'Cinéma Français',
    icon: '🎭',
    variety: { minAngles: 4, limitedFormat: 'portrait', maxPerMatch: 2 },
    questions: cinemaFrEditorial,
  },
  culture_fr: {
    label: 'Culture Générale FR',
    icon: '🇫🇷',
    variety: GENERAL_QUIZ_VARIETY,
    questions: cultureFrEditorial,
  },
  tennis: {
    label: 'Tennis',
    icon: '🎾',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersTennis, tennisVarietyQuestions, 'joueurs'),
  },
  basketball: {
    label: 'Basketteurs en photo',
    icon: '🏀',
    questions: [...playersBasketball],
  },
  rugby: {
    label: 'Rugby',
    icon: '🏉',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersRugby, rugbyVarietyQuestions, 'joueurs'),
  },
  boxe: {
    label: 'Boxeurs en photo',
    icon: '🥊',
    questions: [...playersBoxe],
  },
  athletisme: {
    label: 'Athlétisme',
    icon: '🏃',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersAthletisme, athletismeVarietyQuestions, 'sportifs'),
  },
  science_stars: {
    label: 'Savants Célèbres',
    icon: '🔬',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersScience, scienceStarsVarietyQuestions, 'scientifiques'),
  },
  humour: {
    label: 'Humour',
    icon: '😂',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersHumour, humourVarietyQuestions, 'personnes'),
  },
  mode: {
    label: 'Mode',
    icon: '💃',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersMode, modeVarietyQuestions, 'personnes'),
  },
  kpop: {
    label: 'K-pop',
    icon: '🇰🇷',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersKpop, kpopVarietyQuestions, 'personnes'),
  },
  series_ado_romance: {
    label: 'Séries Ado & Romance',
    icon: '💕',
    variety: PORTRAIT_QUIZ_VARIETY,
    questions: withPortraits(playersSeriesAdoRomance, seriesAdoRomanceVarietyQuestions, 'personnes'),
  },
  drapeaux: {
    label: 'Drapeaux',
    icon: '🚩',
    questions: [...playersDrapeaux],
  },
  liga_portugal: { label: 'Liga Portugal', icon: '🇵🇹', questions: [...ligaPortugal] },
  mls: { label: 'MLS', icon: '🇺🇸', questions: [...mls] },
  tennis_atp: { label: 'Tennis ATP', icon: '🎾', questions: [...tennisAtp] },
  tennis_wta: { label: 'Tennis WTA', icon: '🎾', questions: [...tennisWta] },
  roland_garros: { label: 'Roland-Garros', icon: '🎾', questions: [...rolandGarros] },
  wimbledon: { label: 'Wimbledon', icon: '🎾', questions: [...wimbledon] },
  rugby_top_14: { label: 'Rugby Top 14', icon: '🏉', questions: [...rugbyTop14] },
  mma_ufc: { label: 'MMA/UFC', icon: '🥋', questions: [...mmaUfc] },
  legendes_du_cyclisme: { label: 'Légendes du cyclisme', icon: '🚴', questions: [...legendesDuCyclisme] },
  natation_olympique: { label: 'Natation olympique', icon: '🏊', questions: [...natationOlympique] },
  jo_d_hiver_histoire: { label: "JO d'hiver (histoire)", icon: '⛄', questions: [...joDHiverHistoire] },
  volleyball: { label: 'Volleyball', icon: '🏐', questions: [...volleyball] },
  ski_alpin: { label: 'Ski alpin', icon: '⛷️', questions: [...skiAlpin] },
  sports_d_hiver: { label: "Sports d'hiver", icon: '🥌', questions: [...sportsDHiver] },
  golf: { label: 'Golf', icon: '⛳', questions: [...golf] },
  nhl: { label: 'NHL', icon: '🏒', questions: [...nhl] },
  baseball_mlb: { label: 'Baseball MLB', icon: '⚾', questions: [...baseballMlb] },
  motogp: { label: 'MotoGP', icon: '🏍️', questions: [...motogp] },
  rallye_wrc: { label: 'Rallye WRC', icon: '🚗', questions: [...rallyeWrc] },
  paris_saint_germain: { label: 'Paris Saint-Germain', icon: '🔴', questions: [...parisSaintGermain] },
  real_madrid: { label: 'Real Madrid', icon: '⚪', questions: [...realMadrid] },
  lionel_messi: { label: 'Lionel Messi', icon: '🐐', questions: [...lionelMessi] },
  cristiano_ronaldo: { label: 'Cristiano Ronaldo', icon: '🐐', questions: [...cristianoRonaldo] },
  fortnite: { label: 'Fortnite', icon: '🪂', questions: [...fortnite] },
  minecraft: { label: 'Minecraft', icon: '⛏️', questions: [...minecraft] },
  gta: { label: 'GTA', icon: '🚘', questions: [...gta] },
  league_of_legends: { label: 'League of Legends', icon: '⚔️', questions: [...leagueOfLegends] },
  valorant: { label: 'VALORANT', icon: '🎯', questions: [...valorant] },
  roblox: { label: 'Roblox', icon: '🧱', questions: [...roblox] },
  call_of_duty: { label: 'Call of Duty', icon: '🎖️', questions: [...callOfDuty] },
  genshin_impact: { label: 'Genshin Impact', icon: '✨', questions: [...genshinImpact] },
  zelda: { label: 'Zelda', icon: '🛡️', questions: [...zelda] },
  univers_mario: { label: 'Univers Mario', icon: '🍄', questions: [...universMario] },
  rugby_coupe_du_monde: { label: 'Rugby Coupe du Monde', icon: '🏉', questions: [...rugbyCoupeDuMonde] },
  xv_de_france: { label: 'XV de France', icon: '🐓', questions: [...xvDeFrance] },
  boxe_champions: { label: 'Boxe : champions & combats', icon: '🥊', questions: [...boxeChampions] },
  handball: { label: 'Handball', icon: '🤾', questions: [...handball] },
  nfl: { label: 'NFL', icon: '🏈', questions: [...nfl] },
  gymnastique: { label: 'Gymnastique', icon: '🤸', questions: [...gymnastique] },
  patinage_artistique: { label: 'Patinage artistique', icon: '⛸️', questions: [...patinageArtistique] },
  sports_extremes: { label: 'Sports extrêmes', icon: '🪂', questions: [...sportsExtremes] },
  femmes_du_sport: { label: 'Femmes du sport', icon: '🏅', questions: [...femmesDuSport] },
  jeunes_talents_du_sport: { label: 'Jeunes talents du sport', icon: '🌟', questions: [...jeunesTalentsDuSport] },
  legendes_du_sport_francais: { label: 'Légendes du sport français', icon: '🇫🇷', questions: [...legendesDuSportFrancais] },
  padel: { label: 'Padel', icon: '🎾', questions: [...padel] },
  beach_volley: { label: 'Beach-volley', icon: '🏐', questions: [...beachVolley] },
  k_pop_groupes_feminins: { label: 'K-pop groupes féminins', icon: '🎤', questions: [...kPopGroupesFeminins] },
  k_pop_groupes_masculins: { label: 'K-pop groupes masculins', icon: '🎶', questions: [...kPopGroupesMasculins] },
  bts: { label: 'BTS', icon: '💜', questions: [...bts] },
  blackpink: { label: 'BLACKPINK', icon: '🖤', questions: [...blackpink] },
  afrobeats: { label: 'Afrobeats', icon: '🌍', questions: [...afrobeats] },
  latin_pop_reggaeton: { label: 'Latin pop & reggaeton', icon: '🔥', questions: [...latinPopReggaeton] },
  rap_us_legendes: { label: 'Rap US légendes', icon: '🎙️', questions: [...rapUsLegendes] },
  r_b: { label: 'R&B', icon: '🎙️', questions: [...rB] },
  variete_francaise: { label: 'Variété française', icon: '🇫🇷', questions: [...varieteFrancaise] },
  chanson_francaise_classique: { label: 'Chanson française classique', icon: '🎼', questions: [...chansonFrancaiseClassique] },
  rock_francais: { label: 'Rock français', icon: '🎸', questions: [...rockFrancais] },
  rock_legendes_anglo_us: { label: 'Rock légendes anglo-US', icon: '🤘', questions: [...rockLegendesAngloUs] },
  metal: { label: 'Metal', icon: '🤘', questions: [...metal] },
  pop_rock_2000s: { label: 'Pop rock 2000s', icon: '🎸', questions: [...popRock2000s] },
  electro_edm: { label: 'Electro/EDM', icon: '🎛️', questions: [...electroEdm] },
  house_techno: { label: 'House & techno', icon: '🎚️', questions: [...houseTechno] },
  reggae_dancehall: { label: 'Reggae & dancehall', icon: '🇯🇲', questions: [...reggaeDancehall] },
  jazz_legendes: { label: 'Jazz légendes', icon: '🎷', questions: [...jazzLegendes] },
  compositeurs_classiques: { label: 'Compositeurs classiques', icon: '🎼', questions: [...compositeursClassiques] },
  eurovision: { label: 'Eurovision', icon: '🎤', questions: [...eurovision] },
  festivals_de_musique: { label: 'Festivals de musique', icon: '🎪', questions: [...festivalsDeMusique] },
  clips_iconiques: { label: 'Clips iconiques', icon: '🎬', questions: [...clipsIconiques] },
  duos_collabs_celebres: { label: 'Duos & collabs célèbres', icon: '🤝', questions: [...duosCollabsCelebres] },
  bandes_originales_de_films: { label: 'Bandes originales de films', icon: '🎞️', questions: [...bandesOriginalesDeFilms] },
  comedies_musicales: { label: 'Comédies musicales', icon: '🎭', questions: [...comediesMusicales] },
  girl_groups_boys_bands_2000s_2010s: { label: 'Girl groups & boys bands 2000s-2010s', icon: '🎤', questions: [...girlGroupsBoysBands2000s2010s] },
  musique_annees_80: { label: 'Musique années 80', icon: '📼', questions: [...musiqueAnnees80] },
  anime_shonen: { label: 'Anime shōnen', icon: '⚔️', questions: [...animeShonen] },
  studio_ghibli: { label: 'Studio Ghibli', icon: '🌱', variety: AUDITED_QUESTION_VARIETY, questions: [...studioGhibli] },
  anime_cultes: { label: 'Anime cultes', icon: '📺', questions: [...animeCultes] },
  culture_manga: { label: 'Culture manga', icon: '📚', questions: [...cultureManga] },
  dc_comics: { label: 'DC Comics', icon: '🦸', questions: [...dcComics] },
  films_pixar: { label: 'Films Pixar', icon: '💡', questions: [...filmsPixar] },
  films_dreamworks: { label: 'Films DreamWorks', icon: '🌙', questions: [...filmsDreamworks] },
  comedies_francaises: { label: 'Comédies françaises', icon: '🇫🇷', questions: [...comediesFrancaises] },
  comedies_us_cultes: { label: 'Comédies US cultes', icon: '😂', questions: [...comediesUsCultes] },
  films_d_horreur: { label: "Films d'horreur", icon: '👻', questions: [...filmsDHorreur] },
  science_fiction: { label: 'Science-fiction', icon: '🚀', questions: [...scienceFiction] },
  films_cultes_90s: { label: 'Films cultes 90s', icon: '📼', questions: [...filmsCultes90s] },
  films_cultes_2000s: { label: 'Films cultes 2000s', icon: '💿', questions: [...filmsCultes2000s] },
  oscars_histoire: { label: 'Oscars — histoire', icon: '🏆', questions: [...oscarsHistoire] },
  cesars: { label: 'Césars', icon: '🎬', questions: [...cesars] },
  k_pop_rookies_2025_26: { label: 'K-pop rookies 2025-26', icon: '🌟', questions: [...kPopRookies2025_26] },
  pop_us_montante: { label: 'Pop US montante', icon: '🎙️', questions: [...popUsMontante] },
  chappell_roan_pop_alternative: { label: 'Chappell Roan & pop alternative', icon: '💖', questions: [...chappellRoanPopAlternative] },
  rap_us_nouvelle_generation: { label: 'Rap US nouvelle génération', icon: '🔥', questions: [...rapUsNouvelleGeneration] },
  drill_fr_uk: { label: 'Drill FR/UK', icon: '🎧', questions: [...drillFrUk] },
  musique_annees_90: { label: 'Musique années 90', icon: '📀', questions: [...musiqueAnnees90] },
  musique_annees_2010: { label: 'Musique années 2010', icon: '🎵', questions: [...musiqueAnnees2010] },
  sons_viraux_tiktok: { label: 'Sons viraux TikTok', icon: '📱', questions: [...sonsVirauxTiktok] },
  nouvelle_scene_rap_fr: { label: 'Nouvelle scène rap FR', icon: '🚀', questions: [...nouvelleSceneRapFr] },
  wednesday: { label: 'Wednesday', icon: '🖤', questions: [...wednesday] },
  stranger_things: { label: 'Stranger Things', icon: '🚲', questions: [...strangerThings] },
  euphoria: { label: 'Euphoria', icon: '✨', questions: [...euphoria] },
  heartbreak_high: { label: 'Heartbreak High', icon: '💔', questions: [...heartbreakHigh] },
  xo_kitty: { label: 'XO, Kitty', icon: '💌', questions: [...xoKitty] },
  sex_education: { label: 'Sex Education', icon: '🌼', questions: [...sexEducation] },
  k_dramas: { label: 'K-dramas', icon: '🇰🇷', questions: [...kDramas] },
  squid_game: { label: 'Squid Game', icon: '🔺', questions: [...squidGame] },
  james_bond: { label: 'James Bond', icon: '🍸', questions: [...jamesBond] },
  fast_furious: { label: 'Fast & Furious', icon: '🏎️', questions: [...fastFurious] },
  films_de_braquage: { label: 'Films de braquage', icon: '💰', questions: [...filmsDeBraquage] },
  realisateurs_cultes: { label: 'Réalisateurs cultes', icon: '🎥', questions: [...realisateursCultes] },
  acteurs_hollywoodiens_actuels: { label: 'Acteurs hollywoodiens actuels', icon: '🎭', questions: [...acteursHollywoodiensActuels] },
  actrices_hollywoodiennes_actuelles: { label: 'Actrices hollywoodiennes actuelles', icon: '🌟', questions: [...actricesHollywoodiennesActuelles] },
  stars_du_cinema_coreen: { label: 'Stars du cinéma coréen', icon: '🎬', questions: [...starsDuCinemaCoreen] },
  sitcoms_cultes: { label: 'Sitcoms cultes', icon: '📺', questions: [...sitcomsCultes] },
  tele_realite_fr: { label: 'Télé-réalité FR', icon: '🎦', questions: [...teleRealiteFr] },
  humoristes_francais: { label: 'Humoristes français', icon: '😂', questions: [...humoristesFrancais] },
  stand_up_us: { label: 'Stand-up US', icon: '🎙️', questions: [...standUpUs] },
  youtubeurs_francais: { label: 'YouTubeurs français', icon: '▶️', questions: [...youtubeursFrancais] },
  streamers_twitch_fr: { label: 'Streamers Twitch FR', icon: '🟣', questions: [...streamersTwitchFr] },
  inoxtag: { label: "Inoxtag", icon: "▶️", questions: [...inoxtag] },
  squeezie: { label: "Squeezie", icon: "▶️", questions: [...squeezie] },
  michou: { label: "Michou", icon: "▶️", questions: [...michou] },
  aminematue: { label: "AmineMaTue", icon: "▶️", questions: [...aminematue] },
  streamers_internationaux: { label: 'Streamers internationaux', icon: '🌍', questions: [...streamersInternationaux] },
  tiktokeurs_celebres: { label: 'TikTokeurs célèbres', icon: '📱', questions: [...tiktokeursCelebres] },
  influenceurs_beaute: { label: 'Influenceurs beauté', icon: '💄', questions: [...influenceursBeaute] },
  createurs_gaming: { label: 'Créateurs gaming', icon: '🎮', questions: [...createursGaming] },
  celebrites_reseaux_sociaux: { label: 'Célébrités réseaux sociaux', icon: '📲', questions: [...celebritesReseauxSociaux] },
  mode_defiles: { label: 'Mode & défilés', icon: '👗', questions: [...modeDefiles] },
  icones_de_la_mode: { label: 'Icônes de la mode', icon: '✨', questions: [...iconesDeLaMode] },
  emissions_jeunesse_cultes: { label: 'Émissions jeunesse cultes', icon: '📺', questions: [...emissionsJeunesseCultes] },
  dessins_animes_90s_2000s: { label: 'Dessins animés 90s-2000s', icon: '🖍️', questions: [...dessinsAnimes90s2000s] },
  disney_renaissance: { label: 'Disney Renaissance', icon: '🏰', questions: [...disneyRenaissance] },
  sagas_fantastiques: { label: 'Sagas fantastiques', icon: '🐉', questions: [...sagasFantastiques] },
  sherlock_holmes_enquetes: { label: 'Sherlock Holmes & enquêtes', icon: '🔎', questions: [...sherlockHolmesEnquetes] },
  series_policieres: { label: 'Séries policières', icon: '🚔', questions: [...seriesPolicieres] },
  series_medicales: { label: 'Séries médicales', icon: '🩺', questions: [...seriesMedicales] },
  stars_bollywood: { label: 'Stars Bollywood', icon: '🎞️', questions: [...starsBollywood] },
  cinema_d_auteur_francais: { label: "Cinéma d’auteur français", icon: '🇫🇷', questions: [...cinemaDAuteurFrancais] },
  palme_d_or_cannes: { label: "Palme d’Or Cannes", icon: '🌿', questions: [...palmeDOrCannes] },
  acteurs_britanniques: { label: 'Acteurs britanniques', icon: '🇬🇧', questions: [...acteursBritanniques] },
  comediens_cultes: { label: 'Comédiens cultes', icon: '🎭', questions: [...comediensCultes] },
  personnages_de_contes_de_fees: { label: 'Personnages de contes de fées', icon: '🧚', questions: [...personnagesDeContesDeFees] },
  sagas_young_adult: { label: 'Sagas young adult', icon: '📚', questions: [...sagasYoungAdult] },
  emissions_de_cuisine: { label: 'Émissions de cuisine', icon: '📺', questions: [...emissionsDeCuisine] },
  chefs_celebres: { label: 'Chefs célèbres', icon: '👨‍🍳', questions: [...chefsCelebres] },
  top_models: { label: 'Top models', icon: '📸', questions: [...topModels] },
  miss_france: { label: 'Miss France', icon: '👑', questions: [...missFrance] },
  culture_meme_internet: { label: 'Culture mème & Internet', icon: '🧠', questions: [...cultureMemeInternet] },
  comedies_romantiques: { label: 'Comédies romantiques', icon: '💞', questions: [...comediesRomantiques] },
  films_musicaux: { label: 'Films musicaux', icon: '🎶', questions: [...filmsMusicaux] },
  biopics_celebres: { label: 'Biopics célèbres', icon: '🎬', questions: [...biopicsCelebres] },
  capitales_du_monde: { label: 'Capitales du monde', icon: '🌍', questions: [...capitalesDuMonde] },
  fleuves_montagnes: { label: 'Fleuves & montagnes', icon: '🏔️', variety: AUDITED_QUESTION_VARIETY, questions: [...fleuvesMontagnes] },
  europe_culture_histoire: { label: 'Europe (culture/histoire)', icon: '🏰', variety: AUDITED_QUESTION_VARIETY, questions: [...europeCultureHistoire] },
  afrique_culture_histoire: { label: 'Afrique (culture/histoire)', icon: '🌍', questions: [...afriqueCultureHistoire] },
  asie_culture_histoire: { label: 'Asie (culture/histoire)', icon: '🏯', questions: [...asieCultureHistoire] },
  amerique_latine: { label: 'Amérique latine', icon: '🌎', questions: [...ameriqueLatine] },
  etats_unis_culture_generale: { label: 'États-Unis (culture générale)', icon: '🗽', variety: AUDITED_DATE_VARIETY, questions: [...etatsUnisCultureGenerale] },
  histoire_antique: { label: 'Histoire antique', icon: '🏛️', variety: AUDITED_QUESTION_VARIETY, questions: [...histoireAntique] },
  mythologie_grecque: { label: 'Mythologie grecque', icon: '⚡', variety: AUDITED_QUESTION_VARIETY, questions: [...mythologieGrecque] },
  mythologie_nordique: { label: 'Mythologie nordique', icon: '🔨', variety: AUDITED_QUESTION_VARIETY, questions: [...mythologieNordique] },
  mythologie_egyptienne: { label: 'Mythologie égyptienne', icon: '𓂀', variety: AUDITED_QUESTION_VARIETY, questions: [...mythologieEgyptienne] },
  moyen_age: { label: 'Moyen Âge', icon: '⚔️', variety: AUDITED_DATE_VARIETY, questions: [...moyenAge] },
  premiere_guerre_mondiale: {
    label: 'Première Guerre mondiale',
    icon: '🪖',
    variety: { minAngles: 4, limitedFormat: 'date', maxPerMatch: 2 },
    questions: [...premiereGuerreMondiale],
  },
  revolutions_dans_le_monde: { label: 'Révolutions dans le monde', icon: '✊', variety: AUDITED_DATE_VARIETY, questions: [...revolutionsDansLeMonde] },
  grandes_explorations: { label: 'Grandes explorations', icon: '🧭', variety: AUDITED_DATE_VARIETY, questions: [...grandesExplorations] },
  litterature_francaise_classique: { label: 'Littérature française classique', icon: '📖', variety: AUDITED_QUESTION_VARIETY, questions: [...litteratureFrancaiseClassique] },
  litterature_mondiale: { label: 'Littérature mondiale', icon: '📚', variety: AUDITED_QUESTION_VARIETY, questions: [...litteratureMondiale] },
  philosophes_celebres: { label: 'Philosophes célèbres', icon: '💭', variety: AUDITED_QUESTION_VARIETY, questions: [...philosophesCelebres] },
  peintres_oeuvres_d_art: { label: 'Peintres & œuvres d\'art', icon: '🎨', variety: AUDITED_QUESTION_VARIETY, questions: [...peintresOeuvresDArt] },
  sculpteurs_monuments: { label: 'Sculpteurs & monuments', icon: '🗿', variety: AUDITED_QUESTION_VARIETY, questions: [...sculpteursMonuments] },
  architecture_celebre: { label: "Architecture célèbre", icon: "🏛️", questions: [...architectureCelebre] },
  merveilles_du_monde: { label: "Merveilles du monde", icon: "🌐", questions: [...merveillesDuMonde] },
  animaux: { label: "Animaux", icon: "🐾", questions: [...animaux] },
  oceans: { label: "Océans", icon: "🌊", questions: [...oceans] },
  dinosaures: { label: "Dinosaures", icon: "🦖", questions: [...dinosaures] },
  environnement_ecologie: { label: "Environnement & écologie", icon: "🌱", questions: [...environnementEcologie] },
  inventions_inventeurs: { label: "Inventions & inventeurs", icon: "💡", questions: [...inventionsInventeurs] },
  prix_nobel: { label: "Prix Nobel", icon: "🏅", variety: AUDITED_QUESTION_VARIETY, questions: [...prixNobel] },
  langues_du_monde: { label: "Langues du monde", icon: "🗣️", variety: AUDITED_QUESTION_VARIETY, questions: [...languesDuMonde] },
  traditions_fetes_du_monde: { label: "Traditions & fêtes du monde", icon: "🎊", variety: AUDITED_QUESTION_VARIETY, questions: [...traditionsFetesDuMonde] },
  gastronomie_francaise: { label: "Gastronomie française", icon: "🥐", variety: AUDITED_QUESTION_VARIETY, questions: [...gastronomieFrancaise] },
  gastronomie_du_monde: { label: "Gastronomie du monde", icon: "🍜", variety: AUDITED_QUESTION_VARIETY, questions: [...gastronomieDuMonde] },
  vins_terroirs: { label: "Vins & terroirs", icon: "🍇", variety: AUDITED_QUESTION_VARIETY, questions: [...vinsTerroirs] },
  hymnes_nationaux: { label: "Hymnes nationaux", icon: "🎼", variety: AUDITED_QUESTION_VARIETY, questions: [...hymnesNationaux] },
  femmes_celebres_de_l_histoire: { label: "Femmes célèbres de l'histoire", icon: "👩‍🏫", variety: AUDITED_QUESTION_VARIETY, questions: [...femmesCelebresDeLHistoire] },
  dates_cles_de_l_histoire: { label: "Dates clés de l'histoire", icon: "📅", questions: [...datesClesDeLHistoire] },
  rois_reines_d_europe: { label: "Rois & reines d'Europe", icon: "👑", variety: AUDITED_QUESTION_VARIETY, questions: [...roisReinesDEurope] },
  presidents_francais: { label: "Présidents français", icon: "🇫🇷", variety: AUDITED_QUESTION_VARIETY, questions: [...presidentsFrancais] },
  presidents_americains: { label: "Présidents américains", icon: "🇺🇸", variety: AUDITED_QUESTION_VARIETY, questions: [...presidentsAmericains] },
  grandes_villes_du_monde: { label: "Grandes villes du monde", icon: "🏙️", questions: [...grandesVillesDuMonde] },
  especes_en_voie_de_disparition: { label: "Espèces en voie de disparition", icon: "🐼", variety: AUDITED_QUESTION_VARIETY, questions: [...especesEnVoieDeDisparition] },
  histoire_du_maroc: { label: "Histoire du Maroc", icon: "🇲🇦", variety: AUDITED_DATE_VARIETY, questions: [...histoireDuMaroc] },
  histoire_de_l_algerie: { label: "Histoire de l'Algérie", icon: "🇩🇿", variety: AUDITED_DATE_VARIETY, questions: [...histoireDeLAlgerie] },
  histoire_de_la_tunisie: { label: "Histoire de la Tunisie", icon: "🇹🇳", variety: AUDITED_DATE_VARIETY, questions: [...histoireDeLaTunisie] },
  islam: { label: "Islam", icon: "☪️", variety: AUDITED_QUESTION_VARIETY, questions: [...islam] },
  christianisme: { label: "Christianisme", icon: "✝️", questions: [...christianisme] },
  judaisme: { label: "Judaïsme", icon: "✡️", variety: AUDITED_QUESTION_VARIETY, questions: [...judaisme] },
  bouddhisme: { label: "Bouddhisme", icon: "☸️", questions: [...bouddhisme] },
  hindouisme: { label: "Hindouisme", icon: "🕉️", questions: [...hindouisme] },
  sonic: { label: "Sonic", icon: "💨", questions: [...sonic] },
  fifa_ea_sports_fc: { label: "FIFA/EA Sports FC", icon: "⚽", questions: [...fifaEaSportsFc] },
  assassin_s_creed: { label: "Assassin's Creed", icon: "🗡️", questions: [...assassinSCreed] },
  the_witcher: { label: "The Witcher", icon: "🐺", variety: AUDITED_QUESTION_VARIETY, questions: [...theWitcher] },
  elden_ring: { label: "Elden Ring", icon: "💍", variety: AUDITED_QUESTION_VARIETY, questions: [...eldenRing] },
  animal_crossing: { label: "Animal Crossing", icon: "🏝️", questions: [...animalCrossing] },
  the_sims: { label: "The Sims", icon: "💚", variety: AUDITED_QUESTION_VARIETY, questions: [...theSims] },
  overwatch: { label: "Overwatch", icon: "🦸", variety: AUDITED_QUESTION_VARIETY, questions: [...overwatch] },
  counter_strike: { label: "Counter-Strike", icon: "🎯", variety: AUDITED_QUESTION_VARIETY, questions: [...counterStrike] },
  world_of_warcraft: { label: "World of Warcraft", icon: "⚔️", variety: AUDITED_QUESTION_VARIETY, questions: [...worldOfWarcraft] },
  legendes_de_l_esport: { label: "Légendes de l'esport", icon: "🏆", variety: AUDITED_ATTRIBUTION_VARIETY, questions: [...legendesDeLEsport] },
  streamers_gaming_fr: { label: "Streamers gaming FR", icon: "🎙️", variety: AUDITED_QUESTION_VARIETY, questions: [...streamersGamingFr] },
  jeux_mobile_populaires: { label: "Jeux mobile populaires", icon: "📱", variety: AUDITED_ATTRIBUTION_VARIETY, questions: [...jeuxMobilePopulaires] },
  histoire_des_consoles: { label: "Histoire des consoles", icon: "🎮", questions: [...histoireDesConsoles] },
  fc_barcelone: { label: "FC Barcelone", icon: "🔵", questions: [...fcBarcelone] },
  manchester_united: { label: "Manchester United", icon: "🔴", questions: [...manchesterUnited] },
  liverpool: { label: "Liverpool", icon: "🔴", questions: [...liverpool] },
  bayern_munich: { label: "Bayern Munich", icon: "🔴", questions: [...bayernMunich] },
  manchester_city: { label: "Manchester City", icon: "🔵", questions: [...manchesterCity] },
  chelsea: { label: "Chelsea", icon: "🔵", questions: [...chelsea] },
  arsenal: { label: "Arsenal", icon: "🔴", questions: [...arsenal] },
  inter_milan: { label: "Inter Milan", icon: "🔵", questions: [...interMilan] },
  borussia_dortmund: { label: "Borussia Dortmund", icon: "🟡", questions: [...borussiaDortmund] },
  olympique_de_marseille: { label: "Olympique de Marseille", icon: "⚪", questions: [...olympiqueDeMarseille] },
  cyclisme_stars: { label: "Cyclisme (Stars)", icon: "🚴", variety: AUDITED_QUESTION_VARIETY, questions: [...cyclismeStars] },
  musique_stars: { label: "Musique (Stars)", icon: "🎤", variety: AUDITED_QUESTION_VARIETY, questions: [...musiqueStars] },

  // Catalogue expansion batch 1.
  booba: { label: "Booba", icon: "🎤", questions: [...booba] },
  jul: { label: "JUL", icon: "🎤", questions: [...jul] },
  pnl: { label: "PNL", icon: "🎤", questions: [...pnl] },
  ninho: { label: "Ninho", icon: "🎤", questions: [...ninho] },
  sch: { label: "SCH", icon: "🎤", questions: [...sch] },
  damso: { label: "Damso", icon: "🎤", variety: AUDITED_ALBUM_VARIETY, questions: [...damso] },
  orelsan: { label: "Orelsan", icon: "🎤", variety: AUDITED_ALBUM_VARIETY, questions: [...orelsan] },
  gims: { label: "Gims", icon: "🎤", questions: [...gims] },
  aya_nakamura: { label: "Aya Nakamura", icon: "🎤", questions: [...ayaNakamura] },
  nekfeu: { label: "Nekfeu", icon: "🎤", questions: [...nekfeu] },
  gazo: { label: "Gazo", icon: "🎤", questions: [...gazo] },
  tiakola: { label: "Tiakola", icon: "🎤", questions: [...tiakola] },
  lomepal: { label: "Lomepal", icon: "🎤", questions: [...lomepal] },
  soprano: { label: "Soprano", icon: "🎤", questions: [...soprano] },
  drake: { label: "Drake", icon: "🎤", questions: [...drake] },
  eminem: { label: "Eminem", icon: "🎤", variety: AUDITED_ALBUM_VARIETY, questions: [...eminem] },
  kanye_west: { label: "Kanye West", icon: "🎤", variety: AUDITED_ALBUM_VARIETY, questions: [...kanyeWest] },
  travis_scott: { label: "Travis Scott", icon: "🎤", variety: AUDITED_ALBUM_VARIETY, questions: [...travisScott] },
  the_weeknd: { label: "The Weeknd", icon: "🎤", questions: [...theWeeknd] },
  rihanna: { label: "Rihanna", icon: "🎤", questions: [...rihanna] },
  beyonce: { label: "Beyoncé", icon: "🎤", questions: [...beyonce] },
  taylor_swift: { label: "Taylor Swift", icon: "🎤", questions: [...taylorSwift] },
  michael_jackson: { label: "Michael Jackson", icon: "🎤", questions: [...michaelJackson] },
  dua_lipa: { label: "Dua Lipa", icon: "🎤", variety: AUDITED_ALBUM_VARIETY, questions: [...duaLipa] },
  billie_eilish: { label: "Billie Eilish", icon: "🎤", variety: AUDITED_ALBUM_VARIETY, questions: [...billieEilish] },
  stromae: { label: "Stromae", icon: "🎤", questions: [...stromae] },
  freeze_corleone: { label: "Freeze Corleone", icon: "🎤", questions: [...freezeCorleone] },
  werenoi: { label: "Werenoi", icon: "🎤", questions: [...werenoi] },
  sdm: { label: "SDM", icon: "🎤", questions: [...sdm] },
  niska: { label: "Niska", icon: "🎤", questions: [...niska] },
  one_piece: { label: "One Piece", icon: "📺", questions: [...onePiece] },
  naruto: { label: "Naruto", icon: "📺", questions: [...naruto] },
  dragon_ball: { label: "Dragon Ball", icon: "📺", questions: [...dragonBall] },
  demon_slayer: { label: "Demon Slayer", icon: "📺", questions: [...demonSlayer] },
  jujutsu_kaisen: { label: "Jujutsu Kaisen", icon: "📺", questions: [...jujutsuKaisen] },
  attaque_des_titans: { label: "L’Attaque des Titans", icon: "📺", questions: [...attaqueDesTitans] },
  hunter_x_hunter: { label: "Hunter × Hunter", icon: "📺", questions: [...hunterXHunter] },
  my_hero_academia: { label: "My Hero Academia", icon: "📺", questions: [...myHeroAcademia] },
  death_note: { label: "Death Note", icon: "📺", questions: [...deathNote] },
  bleach: { label: "Bleach", icon: "📖", questions: [...mangaBleach] },
  fullmetal_alchemist: { label: "Fullmetal Alchemist", icon: "📖", questions: [...mangaFullmetalAlchemist] },
  chainsaw_man: { label: "Chainsaw Man", icon: "📖", questions: [...mangaChainsawMan] },
  spy_x_family: { label: "Spy×Family", icon: "📖", questions: [...mangaSpyXFamily] },
  tokyo_revengers: { label: "Tokyo Revengers", icon: "📖", questions: [...mangaTokyoRevengers] },
  haikyu: { label: "Haikyū!!", icon: "📖", questions: [...mangaHaikyu] },
  blue_lock: { label: "Blue Lock", icon: "📖", questions: [...mangaBlueLock] },
  jojo: { label: "JoJo's Bizarre Adventure", icon: "📖", questions: [...mangaJojo] },
  saint_seiya: { label: "Saint Seiya (Chevaliers du Zodiaque)", icon: "📖", questions: [...mangaSaintSeiya] },
  fairy_tail: { label: "Fairy Tail", icon: "📖", questions: [...mangaFairyTail] },
  captain_tsubasa: { label: "Captain Tsubasa (Olive et Tom)", icon: "📖", questions: [...mangaCaptainTsubasa] },
  slam_dunk: { label: "Slam Dunk", icon: "📖", questions: [...mangaSlamDunk] },
  berserk: { label: "Berserk", icon: "📖", questions: [...mangaBerserk] },
  vinland_saga: { label: "Vinland Saga", icon: "📖", questions: [...mangaVinlandSaga] },
  tokyo_ghoul: { label: "Tokyo Ghoul", icon: "📖", questions: [...mangaTokyoGhoul] },
  black_clover: { label: "Black Clover", icon: "📖", questions: [...mangaBlackClover] },
  dr_stone: { label: "Dr. Stone", icon: "📖", questions: [...mangaDrStone] },
  city_hunter: { label: "City Hunter (Nicky Larson)", icon: "📖", questions: [...mangaCityHunter] },
  detective_conan: { label: "Détective Conan", icon: "📖", questions: [...mangaDetectiveConan] },
  one_punch_man: { label: "One-Punch Man", icon: "📖", questions: [...mangaOnePunchMan] },
  hokuto_no_ken: { label: "Ken le Survivant (Hokuto no Ken)", icon: "📖", questions: [...mangaHokutoNoKen] },
  doraemon: { label: "Doraemon", icon: "📖", questions: [...mangaDoraemon] },
  golgo_13: { label: "Golgo 13", icon: "📖", questions: [...mangaGolgo13] },
  kochikame: { label: "KochiKame", icon: "📖", questions: [...mangaKochikame] },
  crayon_shin_chan: { label: "Crayon Shin-chan", icon: "📖", questions: [...mangaCrayonShinChan] },
  oishinbo: { label: "Oishinbo", icon: "📖", questions: [...mangaOishinbo] },
  kingdom: { label: "Kingdom", icon: "📖", questions: [...mangaKingdom] },
  astro_boy: { label: "Astro Boy", icon: "📖", questions: [...mangaAstroBoy] },
  baki: { label: "Baki", icon: "📖", questions: [...mangaBaki] },
  hajime_no_ippo: { label: "Hajime no Ippo", icon: "📖", questions: [...mangaHajimeNoIppo] },
  kindaichi: { label: "Les Enquêtes de Kindaichi", icon: "📖", questions: [...mangaKindaichi] },
  touch: { label: "Touch", icon: "📖", questions: [...mangaTouch] },
  solo_leveling: { label: "Solo Leveling", icon: "📖", questions: [...soloLeveling] },
  frieren: { label: "Frieren", icon: "📖", questions: [...frieren] },
  oshi_no_ko: { label: "Oshi no Ko", icon: "📖", questions: [...oshiNoKo] },
  dandadan: { label: "Dandadan", icon: "📖", questions: [...dandadan] },
  kaiju_no_8: { label: "Kaiju No. 8", icon: "📖", variety: AUDITED_QUESTION_VARIETY, questions: [...kaijuNo8] },
  mashle: { label: "Mashle", icon: "📖", questions: [...mashle] },
  sakamoto_days: { label: "Sakamoto Days", icon: "📖", variety: AUDITED_QUESTION_VARIETY, questions: [...sakamotoDays] },
  breaking_bad: { label: "Breaking Bad", icon: "🎬", questions: [...breakingBad] },
  the_walking_dead: { label: "The Walking Dead", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...theWalkingDead] },
  la_casa_de_papel: { label: "La Casa de Papel", icon: "🎬", questions: [...laCasaDePapel] },
  peaky_blinders: { label: "Peaky Blinders", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...peakyBlinders] },
  the_boys: { label: "The Boys", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...theBoys] },
  the_last_of_us_serie: { label: "The Last of Us (série)", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...theLastOfUsSerie] },
  house_of_the_dragon: { label: "House of the Dragon", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...houseOfTheDragon] },
  friends: { label: "Friends", icon: "🎬", questions: [...friends] },
  the_office: { label: "The Office", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...theOffice] },
  vikings: { label: "Vikings", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...vikings] },
  prison_break: { label: "Prison Break", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...prisonBreak] },
  black_mirror: { label: "Black Mirror", icon: "🎬", questions: [...blackMirror] },
  les_simpson: { label: "Les Simpson", icon: "🎬", questions: [...lesSimpson] },
  south_park: { label: "South Park", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...southPark] },
  avatar_le_dernier_maitre_de_l_air: { label: "Avatar : le dernier maître de l’air", icon: "🎬", questions: [...avatarLeDernierMaitreDeLAir] },
  bob_l_eponge: { label: "Bob l’éponge", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...bobLEponge] },
  shrek: { label: "Shrek", icon: "🎬", questions: [...shrek] },
  jurassic_park: { label: "Jurassic Park", icon: "🎬", questions: [...jurassicPark] },
  indiana_jones: { label: "Indiana Jones", icon: "🎬", questions: [...indianaJones] },
  le_seigneur_des_anneaux: { label: "Le Seigneur des anneaux", icon: "🎬", variety: AUDITED_QUESTION_VARIETY, questions: [...leSeigneurDesAnneaux] },
  mission_impossible: { label: "Mission: Impossible", icon: "🎬", questions: [...missionImpossible] },
  pirates_des_caraibes: { label: "Pirates des Caraïbes", icon: "🎬", questions: [...piratesDesCaraibes] },
  fallout_serie: { label: "Fallout", icon: "🎬", questions: [...falloutSerie] },
  dune_film: { label: "Dune", icon: "🎬", questions: [...duneFilm] },
  gta_v: { label: "GTA V", icon: "🎮", questions: [...gtaV] },
  gta_san_andreas: { label: "GTA: San Andreas", icon: "🎮", questions: [...gtaSanAndreas] },
  red_dead_redemption: { label: "Red Dead Redemption", icon: "🎮", variety: AUDITED_QUESTION_VARIETY, questions: [...redDeadRedemption] },
  god_of_war: { label: "God of War", icon: "🎮", questions: [...godOfWar] },
  resident_evil: { label: "Resident Evil", icon: "🎮", questions: [...residentEvil] },
  final_fantasy: { label: "Final Fantasy", icon: "🎮", questions: [...finalFantasy] },
  brawl_stars: { label: "Brawl Stars", icon: "🎮", questions: [...brawlStars] },
  clash_royale: { label: "Clash Royale", icon: "🎮", variety: AUDITED_QUESTION_VARIETY, questions: [...clashRoyale] },
  rocket_league: { label: "Rocket League", icon: "🎮", variety: AUDITED_QUESTION_VARIETY, questions: [...rocketLeague] },
  playstation: { label: "PlayStation", icon: "🎮", questions: [...playstation] },
  nintendo: { label: "Nintendo", icon: "🎮", questions: [...nintendo] },
  xbox: { label: "Xbox", icon: "🎮", questions: [...xbox] },
  super_smash_bros: { label: "Super Smash Bros.", icon: "🎮", questions: [...superSmashBros] },
  mario_kart: { label: "Mario Kart", icon: "🎮", questions: [...marioKart] },
  cyberpunk_2077: { label: "Cyberpunk 2077", icon: "🎮", questions: [...cyberpunk_2077] },
  the_last_of_us_jeux: { label: "The Last of Us (jeux)", icon: "🎮", variety: AUDITED_QUESTION_VARIETY, questions: [...theLastOfUsJeux] },
  uncharted: { label: "Uncharted", icon: "🎮", questions: [...uncharted] },
  metal_gear: { label: "Metal Gear", icon: "🎮", questions: [...metalGear] },
  tomb_raider: { label: "Tomb Raider", icon: "🎮", questions: [...tombRaider] },
  street_fighter: { label: "Street Fighter", icon: "🎮", questions: [...streetFighter] },
  equipe_de_france_football: { label: "Équipe de France de football", icon: "⚽", questions: [...equipeDeFranceFootball] },
  maroc_football: { label: "Maroc — Lions de l’Atlas", icon: "⚽", questions: [...marocFootball] },
  algerie_football: { label: "Algérie — Fennecs", icon: "⚽", questions: [...algerieFootball] },
  portugal_football: { label: "Portugal — Seleção", icon: "⚽", questions: [...portugalFootball] },
  bresil_football: { label: "Brésil — Seleção", icon: "⚽", questions: [...bresilFootball] },
  argentine_football: { label: "Argentine — Albiceleste", icon: "⚽", questions: [...argentineFootball] },
  juventus: { label: "Juventus", icon: "⚽", questions: [...juventus] },
  ac_milan: { label: "AC Milan", icon: "⚽", questions: [...acMilan] },
  atletico_de_madrid: { label: "Atlético de Madrid", icon: "⚽", questions: [...atleticoDeMadrid] },
  napoli: { label: "Napoli", icon: "⚽", questions: [...napoli] },
  kylian_mbappe: { label: "Kylian Mbappé", icon: "⚽", questions: [...kylianMbappe] },
  zinedine_zidane: { label: "Zinédine Zidane", icon: "⚽", questions: [...zinedineZidane] },
  neymar: { label: "Neymar", icon: "⚽", questions: [...neymar] },
  ronaldinho: { label: "Ronaldinho", icon: "⚽", questions: [...ronaldinho] },
  karim_benzema: { label: "Karim Benzema", icon: "⚽", questions: [...karimBenzema] },
  thierry_henry: { label: "Thierry Henry", icon: "⚽", questions: [...thierryHenry] },
  erling_haaland: { label: "Erling Haaland", icon: "⚽", questions: [...erlingHaaland] },
  mohamed_salah: { label: "Mohamed Salah", icon: "⚽", questions: [...mohamedSalah] },
  lebron_james: { label: "LeBron James", icon: "⚽", questions: [...lebronJames] },
  michael_jordan: { label: "Michael Jordan", icon: "⚽", questions: [...michaelJordan] },
  lamine_yamal: { label: "Lamine Yamal", icon: "⚽", questions: [...lamineYamal] },
  automobile: { label: "Automobile", icon: "✨", questions: [...automobile] },
  logos_grandes_marques: { label: "Logos et grandes marques", icon: "✨", variety: AUDITED_QUESTION_VARIETY, questions: [...logosGrandesMarques] },
  sneakers: { label: "Sneakers", icon: "✨", questions: [...sneakers] },
  marques_de_luxe: { label: "Marques de luxe", icon: "✨", questions: [...marquesDeLuxe] },
  smartphones: { label: "Smartphones", icon: "✨", questions: [...smartphones] },
  technologie_grand_public: { label: "Technologie grand public", icon: "✨", questions: [...technologieGrandPublic] },
  fast_food: { label: "Fast-food", icon: "✨", questions: [...fastFood] },
  annees_2000: { label: "Années 2000", icon: "✨", questions: [...annees_2000] },
  internet_reseaux_sociaux: { label: "Internet et réseaux sociaux", icon: "✨", questions: [...internetReseauxSociaux] },
  monuments_de_france: { label: "Monuments de France", icon: "✨", questions: [...monumentsDeFrance] },
  geographie_de_france: { label: "Géographie de France", icon: "🗺️", questions: [...geographieDeFrance] },
  ballon_d_or: { label: "Ballon d’Or", icon: "⚽", questions: [...ballonDOr] },
  kaamelott: { label: "Kaamelott", icon: "🛡️", questions: [...kaamelottQuiz] },
  lupin: { label: "Lupin", icon: "🎩", questions: [...lupinQuiz] },
  arcane: { label: "Arcane", icon: "⚡", questions: [...arcaneQuiz] },
  bridgerton: { label: "Bridgerton", icon: "👑", questions: [...bridgertonQuiz] },
  gossip_girl: { label: "Gossip Girl", icon: "📱", questions: [...gossipGirlQuiz] },

  // ── New quizzes: Football ──
  football_feminin: { label: "Football Féminin", icon: "⚽", questions: [...footballFeminin] },
  tottenham: { label: "Tottenham Hotspur", icon: "⚽", questions: [...tottenham] },
  as_roma: { label: "AS Roma", icon: "⚽", questions: [...asRoma] },
  benfica: { label: "SL Benfica", icon: "⚽", questions: [...benfica] },
  galatasaray: { label: "Galatasaray", icon: "⚽", questions: [...galatasaray] },
  espagne_football: { label: "Espagne (Football)", icon: "⚽", questions: [...espagneFootball] },
  gardiens_legendaires: { label: "Gardiens Légendaires", icon: "🧤", questions: [...gardiensLegendaires] },
  allemagne_football: { label: "Allemagne (Football)", icon: "⚽", questions: [...allemagneFootball] },
  angleterre_football: { label: "Angleterre (Football)", icon: "⚽", questions: [...angleterreFootball] },
  senegal_football: { label: "Sénégal (Football)", icon: "⚽", questions: [...senegalFootball] },
  transferts_mercato: { label: "Transferts & Mercato", icon: "💰", questions: [...transfertsMercato] },

  // ── New quizzes: Sports ──
  cricket: { label: "Cricket", icon: "🏏", questions: [...cricket] },
  judo: { label: "Judo", icon: "🥋", questions: [...judo] },
  surf: { label: "Surf", icon: "🏄", questions: [...surf] },
  skateboard: { label: "Skateboard", icon: "🛹", questions: [...skateboard] },
  escalade: { label: "Escalade", icon: "🧗", questions: [...escalade] },

  // ── New quizzes: Musique ──
  country_music: { label: "Country Music", icon: "🤠", questions: [...countryMusic] },
  punk_grunge: { label: "Punk & Grunge", icon: "🎸", questions: [...punkGrunge] },
  musique_arabe_rai: { label: "Musique Arabe & Raï", icon: "🎵", questions: [...musiqueArabeRai] },
  ariana_grande: { label: "Ariana Grande", icon: "🎤", questions: [...arianaGrande] },
  bad_bunny: { label: "Bad Bunny", icon: "🐰", questions: [...badBunny] },
  bruno_mars: { label: "Bruno Mars", icon: "🎤", questions: [...brunoMars] },
  rappeurs_uk: { label: "Rappeurs UK", icon: "🇬🇧", questions: [...rappeursUk] },
  ed_sheeran: { label: "Ed Sheeran", icon: "🎸", questions: [...edSheeran] },
  post_malone: { label: "Post Malone", icon: "🎤", questions: [...postMalone] },
  kendrick_lamar: { label: "Kendrick Lamar", icon: "🎤", questions: [...kendrickLamar] },
  j_cole: { label: "J. Cole", icon: "🎤", questions: [...jCole] },
  vald: { label: "Vald", icon: "🎤", questions: [...vald] },
  laylow: { label: "Laylow", icon: "🎤", questions: [...laylow] },
  plk: { label: "PLK", icon: "🎤", questions: [...plk] },
  hamza: { label: "Hamza", icon: "🎤", questions: [...hamza] },

  // ── New quizzes: Jeux Vidéo ──
  apex_legends: { label: "Apex Legends", icon: "🎮", questions: [...apexLegends] },
  dark_souls: { label: "Dark Souls", icon: "⚔️", questions: [...darkSouls] },
  diablo: { label: "Diablo", icon: "😈", questions: [...diablo] },
  halo: { label: "Halo", icon: "🎮", questions: [...halo] },
  tekken_mortal_kombat: { label: "Tekken & Mortal Kombat", icon: "👊", questions: [...tekkenMortalKombat] },
  stardew_valley: { label: "Stardew Valley", icon: "🌾", questions: [...stardewValley] },

  // ── New quizzes: Séries & Films ──
  rick_and_morty: { label: "Rick and Morty", icon: "🧪", questions: [...rickAndMorty] },
  narcos: { label: "Narcos", icon: "📺", questions: [...narcos] },
  better_call_saul: { label: "Better Call Saul", icon: "⚖️", questions: [...betterCallSaul] },
  suits: { label: "Suits", icon: "👔", questions: [...suits] },
  grey_s_anatomy: { label: "Grey's Anatomy", icon: "🏥", questions: [...greySAnatomy] },
  the_mandalorian: { label: "The Mandalorian", icon: "🪖", questions: [...theMandalorian] },
  family_guy: { label: "Family Guy", icon: "📺", questions: [...familyGuy] },

  // ── New quizzes: Culture Générale ──
  mathematiques_logique: { label: "Mathématiques & Logique", icon: "🔢", questions: [...mathematiquesLogique] },
  informatique_technologie: { label: "Informatique & Technologie", icon: "💻", questions: [...informatiqueTechnologie] },
  economie_finance: { label: "Économie & Finance", icon: "📊", questions: [...economieFinance] },
  psychologie: { label: "Psychologie", icon: "🧠", questions: [...psychologie] },
  droit_justice: { label: "Droit & Justice", icon: "⚖️", variety: AUDITED_QUESTION_VARIETY, questions: [...droitJustice] },
  congo_rdc: { label: "Congo RDC", icon: "🇨🇩", questions: [...congoRdc] },
  entrepreneurs_tech: { label: "Entrepreneurs Tech", icon: "💡", questions: [...entrepreneursTech] },
  records_du_monde: { label: "Records du Monde", icon: "🏆", questions: [...recordsDuMonde] },
  phenomenes_naturels: { label: "Phénomènes Naturels", icon: "🌋", questions: [...phenomenesNaturels] },
  monnaies_du_monde: { label: "Monnaies du Monde", icon: "💱", questions: [...monnaiesDuMonde] },
  iles_du_monde: { label: "Îles du Monde", icon: "🏝️", questions: [...ilesDuMonde] },
};

function shuffleQuestions(items, random = Math.random) {
  const shuffled = items.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Return `count` questions from a category (or mixed if no category), each
// tagged with its category label + icon and a stable per-match id.
const DIFFICULTY_SEQUENCE = ['easy', 'easy', 'medium', 'medium', 'hard', 'expert'];
const DIFFICULTY_SCORE = { easy: 0.15, medium: 0.5, hard: 0.75, expert: 0.95 };
const DIFFICULTY_BANDS = {
  easy: [0, 0.36],
  medium: [0.24, 0.7],
  hard: [0.58, 0.9],
  expert: [0.8, 1],
};

// Photo questions share a generic prompt, so the image remains their stable
// identity. Text questions use the prompt itself.
const questionKey = (q) => q.image || q.text;
const answerKey = (q) => String(q.answers?.[q.correct] ?? '').trim().toLocaleLowerCase('fr');

function difficultyForRound(index, count) {
  if (index < 2) return 'easy';
  if (index === count - 1) return 'expert';
  if (index < Math.ceil((count * 2) / 3)) return 'medium';
  return 'hard';
}

function difficultyScore(question, index, total) {
  const explicit = question.difficulty;
  if (typeof explicit === 'number' && Number.isFinite(explicit)) {
    return Math.max(0, Math.min(1, explicit));
  }
  if (DIFFICULTY_SCORE[explicit] != null) return DIFFICULTY_SCORE[explicit];
  // Every curated bank is editorially ordered from broadly recognizable
  // material toward specialist details. Preserve that signal instead of
  // destroying it with a global shuffle.
  return total <= 1 ? 0.5 : index / (total - 1);
}

function categoryPool(categoryKey) {
  const categories = categoryKey && CATEGORIES[categoryKey]
    ? [[categoryKey, CATEGORIES[categoryKey]]]
    : Object.entries(CATEGORIES);

  const pool = [];
  for (const [key, cat] of categories) {
    const total = cat.questions.length;
    // Appending questions with explicit levels should not flatten the existing
    // progression or leave a single authored question as the only expert.
    const legacyCount = cat.variety?.mixLegacyDifficulty
      ? cat.questions.filter(question => question.difficulty == null).length
      : 0;
    let legacyIndex = 0;
    cat.questions.forEach((question, index) => {
      const rankAmongLegacyQuestions = legacyCount && question.difficulty == null;
      pool.push({
        ...question,
        category: cat.label,
        icon: cat.icon,
        _categoryKey: key,
        _difficultyScore: rankAmongLegacyQuestions
          ? difficultyScore(question, legacyIndex++, legacyCount)
          : difficultyScore(question, index, total),
      });
    });
  }
  return pool;
}

function questionOpening(question) {
  return question.text.toLocaleLowerCase('fr').match(/[\p{L}\p{N}]+/gu)?.slice(0, 5).join(' ');
}

function preferDifferentOpenings(candidates, selected, limit) {
  const openings = new Map();
  for (const question of selected) {
    const opening = questionOpening(question);
    openings.set(opening, (openings.get(opening) || 0) + 1);
  }
  const varied = candidates.filter(question => (openings.get(questionOpening(question)) || 0) < limit);
  return varied.length ? varied : candidates;
}

function preferVariety(unused, selected, variety) {
  const atFormatLimit = variety.limitedFormat &&
    selected.filter(question => question.format === variety.limitedFormat).length >= variety.maxPerMatch;
  const underLimit = atFormatLimit
    ? unused.filter(question => question.format !== variety.limitedFormat)
    : unused;
  // Reports can shrink a bank. Keep a full match when the remaining pool
  // cannot satisfy the cap or offer another angle.
  let eligible = underLimit.length ? underLimit : unused;
  if (variety.maxPerOpening) {
    eligible = preferDifferentOpenings(eligible, selected, variety.maxPerOpening);
  }
  if (!variety.minAngles) return eligible;
  const angles = new Set(selected.map(question => question.angle).filter(Boolean));
  if (angles.size >= variety.minAngles) return eligible;
  const newAngles = eligible.filter(question => question.angle && !angles.has(question.angle));
  return newAngles.length ? newAngles : eligible;
}

function selectProgressiveQuestions(items, count, random = Math.random, variety) {
  const available = items.slice();
  const selected = [];
  const usedQuestions = new Set();
  const usedAnswers = new Set();
  const usedFacts = new Set();

  for (let round = 0; round < Math.min(count, available.length); round++) {
    const difficulty = difficultyForRound(round, count);
    const [min, max] = DIFFICULTY_BANDS[difficulty];
    const unused = available.filter(q =>
      !usedQuestions.has(questionKey(q)) && (!variety || !q.fact || !usedFacts.has(q.fact))
    );
    const eligible = variety ? preferVariety(unused, selected, variety) : unused;
    let candidates = eligible.filter(q => q._difficultyScore >= min && q._difficultyScore <= max);

    if (difficulty === 'expert' && variety?.mixLegacyDifficulty && candidates.length < 4) {
      candidates = eligible.filter(q => q._difficultyScore >= DIFFICULTY_SCORE.hard);
    }

    // Prefer questions whose expert level was checked editorially over the
    // positional estimate when an expert round can offer one.
    if (difficulty === 'expert' && !variety?.mixLegacyDifficulty) {
      const editorialExperts = candidates.filter((q) => q.difficulty === 'expert');
      if (editorialExperts.length) candidates = editorialExperts;
    }

    // Avoid asking two paraphrases whose correct answer is identical whenever
    // the bank offers enough variety. This notably removes repeated fact-pairs
    // from the same six-question match.
    const diverse = candidates.filter((q) => !usedAnswers.has(answerKey(q)));
    if (diverse.length) candidates = diverse;

    // A small or heavily quarantined bank may not fill every ideal band.
    // Pick the closest remaining question rather than shortening the match.
    if (!candidates.length) {
      const target = DIFFICULTY_SCORE[difficulty];
      candidates = eligible
        .slice()
        .sort((a, b) => Math.abs(a._difficultyScore - target) - Math.abs(b._difficultyScore - target));
      const closestDistance = candidates.length
        ? Math.abs(candidates[0]._difficultyScore - target)
        : Infinity;
      candidates = candidates.filter((q) =>
        Math.abs(Math.abs(q._difficultyScore - target) - closestDistance) < 1e-9
      );
    }

    if (!candidates.length) break;
    const chosen = candidates[Math.floor(random() * candidates.length)];
    selected.push({ ...chosen, difficulty });
    usedQuestions.add(questionKey(chosen));
    if (variety && chosen.fact) usedFacts.add(chosen.fact);
    usedAnswers.add(answerKey(chosen));
  }

  return selected.map(({ _categoryKey, _difficultyScore, ...question }, id) => ({ ...question, id }));
}

// Return a progressive sequence: two approachable openers, two intermediate
// rounds, one difficult round and an expert bonus for the standard six-round
// match.
// Shuffle the 4 answers at serve time so the correct answer's position in the
// data file never leaks (some quizzes put most correct answers in slot B).
// Questions whose options depend on their order ("Toutes les réponses",
// "Aucune", ...) keep their original order.
const ORDER_DEPENDENT_ANSWER = /^(toutes?|tous|aucune?|les deux|both|all|none)\b/i;
function shuffleAnswers(question, random = Math.random) {
  const answers = question.answers;
  if (!Array.isArray(answers) || answers.length < 2 || !Number.isInteger(question.correct)) return question;
  if (answers.some((answer) => ORDER_DEPENDENT_ANSWER.test(String(answer).trim()))) return question;
  const order = shuffleQuestions(answers.map((_, index) => index), random);
  return { ...question, answers: order.map((index) => answers[index]), correct: order.indexOf(question.correct) };
}

function getQuestions(count, categoryKey, random = Math.random) {
  return selectProgressiveQuestions(categoryPool(categoryKey), count, random, CATEGORIES[categoryKey]?.variety)
    .map((question) => shuffleAnswers(question, random));
}

// Curated French content is authoritative. OpenTDB remains an emergency fallback for
// an unexpectedly undersized bank, but it no longer overrides the difficulty
// curve or injects random English questions into normal matches.
async function getMixedQuestions(count, categoryKey) {
  const localPool = categoryPool(categoryKey)
    .filter((q) => !reports.isQuarantined(questionKey(q)));
  const questions = selectProgressiveQuestions(localPool, count, Math.random, CATEGORIES[categoryKey]?.variety);

  if (questions.length < count && categoryKey && CATEGORIES[categoryKey] && trivia.isSupported(categoryKey)) {
    const cat = CATEGORIES[categoryKey];
    const seen = new Set(questions.map(questionKey));
    for (const q of trivia.takeFromCache((count - questions.length) * 2, categoryKey, cat.label, cat.icon)) {
      if (questions.length >= count) break;
      if (!seen.has(questionKey(q)) && !reports.isQuarantined(questionKey(q))) {
        questions.push({ ...q, difficulty: difficultyForRound(questions.length, count), id: questions.length });
        seen.add(questionKey(q));
      }
    }
  }

  return questions.slice(0, count).map((question, id) => ({ ...shuffleAnswers(question), id }));
}

// Warm the API cache for every supported category (best-effort, non-blocking).
function warmCache() {
  for (const [key, c] of Object.entries(CATEGORIES)) {
    if (trivia.isSupported(key)) trivia.refill(key, c.label, c.icon);
  }
}

function listCategories() {
  return Object.entries(CATEGORIES).map(([key, c]) => ({
    key,
    label: c.label,
    icon: c.icon,
    count: c.questions.length,
  }));
}

module.exports = {
  shuffleAnswers,
  CATEGORIES,
  getQuestions,
  getMixedQuestions,
  warmCache,
  listCategories,
  questionKey,
  difficultyForRound,
  selectProgressiveQuestions,
  shuffleQuestions,
};


