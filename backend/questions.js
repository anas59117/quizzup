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
const playersRapFr = require('./data/players-rap-fr.json');
const playersPremierLeague = require('./data/players-premier-league.json');
const playersLaLiga = require('./data/players-la-liga.json');
const playersBundesliga = require('./data/players-bundesliga.json');
const playersSerieA = require('./data/players-serie-a.json');
const playersLigue1 = require('./data/players-ligue-1.json');
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

const CATEGORIES = {
  movies: {
    label: 'Movies',
    icon: '🎬',
    questions: [
      { text: 'Which film won Best Picture at the 2023 Oscars?', answers: ['Everything Everywhere All at Once', 'The Fabelmans', 'Top Gun: Maverick', 'Tár'], correct: 0 },
      { text: 'Who directed "Inception"?', answers: ['Denis Villeneuve', 'Christopher Nolan', 'Ridley Scott', 'James Cameron'], correct: 1 },
      { text: 'In "The Matrix", what color pill does Neo take?', answers: ['Blue', 'Green', 'Red', 'Yellow'], correct: 2 },
      { text: 'Which actor plays Iron Man in the MCU?', answers: ['Chris Evans', 'Mark Ruffalo', 'Chris Hemsworth', 'Robert Downey Jr.'], correct: 3 },
      { text: 'What is the highest-grossing film of all time (nominal)?', answers: ['Avatar', 'Avengers: Endgame', 'Titanic', 'Star Wars: The Force Awakens'], correct: 0 },
      { text: 'Which animated studio created "Toy Story"?', answers: ['DreamWorks', 'Pixar', 'Illumination', 'Studio Ghibli'], correct: 1 },
      { text: 'Who played the Joker in "The Dark Knight"?', answers: ['Joaquin Phoenix', 'Jared Leto', 'Heath Ledger', 'Jack Nicholson'], correct: 2 },
      { text: 'What year was the first "Jurassic Park" released?', answers: ['1990', '1991', '1992', '1993'], correct: 3 },
      { text: 'Which movie features the quote "May the Force be with you"?', answers: ['Star Wars', 'Star Trek', 'Guardians of the Galaxy', 'Dune'], correct: 0 },
      { text: 'Who directed "Parasite"?', answers: ['Park Chan-wook', 'Bong Joon-ho', 'Wong Kar-wai', 'Hirokazu Kore-eda'], correct: 1 },
    ],
  },
  music: {
    label: 'Music',
    icon: '🎵',
    questions: [
      { text: 'Which artist released the album "1989"?', answers: ['Adele', 'Katy Perry', 'Taylor Swift', 'Lorde'], correct: 2 },
      { text: 'How many members were in The Beatles?', answers: ['3', '4', '5', '6'], correct: 1 },
      { text: 'Who is known as the "King of Pop"?', answers: ['Elvis Presley', 'Prince', 'Michael Jackson', 'James Brown'], correct: 2 },
      { text: 'Which instrument has 88 keys?', answers: ['Organ', 'Harpsichord', 'Accordion', 'Piano'], correct: 3 },
      { text: 'What genre is Bob Marley most associated with?', answers: ['Reggae', 'Ska', 'Blues', 'Soul'], correct: 0 },
      { text: 'Which band performed "Bohemian Rhapsody"?', answers: ['Led Zeppelin', 'Queen', 'The Who', 'Pink Floyd'], correct: 1 },
      { text: 'Who sang "Rolling in the Deep"?', answers: ['Beyoncé', 'Rihanna', 'Adele', 'Sia'], correct: 2 },
      { text: 'How many strings does a standard guitar have?', answers: ['4', '5', '7', '6'], correct: 3 },
      { text: 'Which rapper released "The Marshall Mathers LP"?', answers: ['Eminem', 'Jay-Z', 'Nas', 'Dr. Dre'], correct: 0 },
      { text: 'What does "BPM" stand for in music?', answers: ['Bars Per Minute', 'Beats Per Minute', 'Bass Per Measure', 'Bells Per Minute'], correct: 1 },
    ],
  },
  sports: {
    label: 'Sports',
    icon: '⚽',
    questions: [
      { text: 'How many players are on a soccer team on the field?', answers: ['11', '10', '9', '12'], correct: 0 },
      { text: 'Which country won the 2022 FIFA World Cup?', answers: ['France', 'Argentina', 'Brazil', 'Germany'], correct: 1 },
      { text: 'In basketball, how many points is a free throw worth?', answers: ['3', '2', '1', '4'], correct: 2 },
      { text: 'Which sport uses a shuttlecock?', answers: ['Tennis', 'Squash', 'Table tennis', 'Badminton'], correct: 3 },
      { text: 'How often are the Summer Olympics held?', answers: ['Every 4 years', 'Every 2 years', 'Every 3 years', 'Every 5 years'], correct: 0 },
      { text: 'Who holds the record for most Grand Slam tennis titles (men)?', answers: ['Roger Federer', 'Novak Djokovic', 'Rafael Nadal', 'Pete Sampras'], correct: 1 },
      { text: 'In which sport would you perform a "slam dunk"?', answers: ['Volleyball', 'Handball', 'Basketball', 'Netball'], correct: 2 },
      { text: 'How many rings are on the Olympic flag?', answers: ['4', '6', '7', '5'], correct: 3 },
      { text: 'Which country is famous for inventing rugby?', answers: ['England', 'Wales', 'Scotland', 'Ireland'], correct: 0 },
      { text: 'What is the maximum score in a single frame of ten-pin bowling?', answers: ['20', '30', '25', '15'], correct: 1 },
    ],
  },
  geography: {
    label: 'Géographie',
    icon: '🌍',
    questions: [
      { text: 'Quelle est la capitale de la France ?', answers: ['Paris', 'Lyon', 'Marseille', 'Nice'], correct: 0 },
      { text: 'Quel est le plus grand océan de la planète ?', answers: ['Atlantique', 'Pacifique', 'Indien', 'Arctique'], correct: 1 },
      { text: 'Dans quelle chaîne de montagnes se trouve l’Everest ?', answers: ['Andes', 'Alpes', 'Himalaya', 'Rocheuses'], correct: 2 },
      { text: 'Dans quel pays d’Asie du Sud se trouve l’État du Kerala ?', answers: ['Pakistan', 'Bangladesh', 'Sri Lanka', 'Inde'], correct: 3 },
      { text: 'Quelle est la capitale de l’Australie ?', answers: ['Canberra', 'Sydney', 'Melbourne', 'Perth'], correct: 0 },
      { text: 'Quel est le plus vaste désert chaud du monde ?', answers: ['Gobi', 'Sahara', 'Kalahari', 'Mojave'], correct: 1 },
      { text: 'Quelle est la capitale du Japon ?', answers: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], correct: 2 },
      { text: 'Sur quel continent se trouve la forêt amazonienne ?', answers: ['Afrique', 'Asie', 'Océanie', 'Amérique du Sud'], correct: 3 },
      { text: 'Quel pays se situe à la fois en Europe et en Asie ?', answers: ['Turquie', 'Grèce', 'Égypte', 'Italie'], correct: 0 },
      { text: 'Quel est le plus petit État souverain du monde ?', answers: ['Monaco', 'Vatican', 'Saint-Marin', 'Liechtenstein'], correct: 1 },
      { text: 'À quel pays appartient l’enclave de Cabinda ?', answers: ['Namibie', 'République du Congo', 'République démocratique du Congo', 'Angola'], correct: 3, difficulty: 'expert' },
    ],
  },
  gaming: {
    label: 'Gaming',
    icon: '🎮',
    questions: [
      { text: 'Which company created "Mario"?', answers: ['Nintendo', 'Sega', 'Sony', 'Atari'], correct: 0 },
      { text: 'In "Minecraft", what material do you need to make a pickaxe first?', answers: ['Iron', 'Wood', 'Stone', 'Diamond'], correct: 1 },
      { text: 'What is the best-selling video game of all time?', answers: ['Tetris', 'GTA V', 'Minecraft', 'Wii Sports'], correct: 2 },
      { text: 'Which game features a battle royale on an island with 100 players?', answers: ['Valorant', 'Overwatch', 'League of Legends', 'Fortnite'], correct: 3 },
      { text: 'What does "FPS" stand for in gaming?', answers: ['First-Person Shooter', 'Fast Play Speed', 'Final Player Standing', 'Frame Per Second only'], correct: 0 },
      { text: 'Who is the main character of "The Legend of Zelda"?', answers: ['Zelda', 'Link', 'Ganon', 'Navi'], correct: 1 },
      { text: 'Which console was released by Sony in 2020?', answers: ['Xbox Series X', 'Switch', 'PlayStation 5', 'Steam Deck'], correct: 2 },
      { text: 'In "Pokémon", what type is Pikachu?', answers: ['Fire', 'Water', 'Grass', 'Electric'], correct: 3 },
      { text: 'Which game popularized the "MOBA" genre alongside Dota?', answers: ['League of Legends', 'Counter-Strike', 'World of Warcraft', 'Starcraft'], correct: 0 },
      { text: 'What color is Sonic the Hedgehog?', answers: ['Green', 'Blue', 'Red', 'Yellow'], correct: 1 },
    ],
  },
  science: {
    label: 'Science',
    icon: '🧬',
    questions: [
      { text: 'What is the chemical symbol for water?', answers: ['H2O', 'CO2', 'O2', 'NaCl'], correct: 0 },
      { text: 'How many planets are in our solar system?', answers: ['7', '8', '9', '10'], correct: 1 },
      { text: 'What gas do plants absorb from the atmosphere?', answers: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'], correct: 2 },
      { text: 'What is the largest planet in our solar system?', answers: ['Saturn', 'Neptune', 'Earth', 'Jupiter'], correct: 3 },
      { text: 'What is the powerhouse of the cell?', answers: ['Mitochondria', 'Nucleus', 'Ribosome', 'Golgi apparatus'], correct: 0 },
      { text: 'At what temperature does water boil at sea level (Celsius)?', answers: ['90°C', '100°C', '110°C', '120°C'], correct: 1 },
      { text: 'What is the speed of light approximately?', answers: ['300 km/s', '30,000 km/s', '300,000 km/s', '3,000 km/s'], correct: 2 },
      { text: 'Which element has the atomic number 1?', answers: ['Helium', 'Oxygen', 'Carbon', 'Hydrogen'], correct: 3 },
      { text: 'What force keeps us on the ground?', answers: ['Gravity', 'Magnetism', 'Friction', 'Inertia'], correct: 0 },
      { text: 'How many bones are in the adult human body?', answers: ['186', '206', '226', '246'], correct: 1 },
    ],
  },
  rap_fr: {
    label: 'Rap Français',
    icon: '🎤',
    questions: [
      { text: 'Quel est le vrai nom de Booba ?', answers: ['Elie Yaffa', 'Karim Zenoud', 'Laurent Mekhazni', 'Sofiane Zermani'], correct: 0 },
      { text: 'PNL est un groupe composé de deux...', answers: ['Cousins', 'Frères', 'Amis d’enfance', 'Voisins'], correct: 1 },
      { text: 'De quelle ville vient Jul ?', answers: ['Paris', 'Lyon', 'Marseille', 'Toulouse'], correct: 2 },
      { text: 'Booba a débuté sa carrière au sein de quel groupe ?', answers: ['Lunatic', 'Sexion d’Assaut', 'NTM', 'IAM'], correct: 0 },
      { text: 'Quel rappeur a sorti l’album "Nero Nemesis" ?', answers: ['Gazo', 'Ninho', 'Freeze Corleone', 'Damso'], correct: 1 },
      { text: 'Quel est le titre du premier album studio de Jul ?', answers: ['La Zone', 'Dans ma paranoïa', 'Extra Terrestre', 'D’or et de platine'], correct: 1 },
      { text: 'Gradur est originaire de quelle ville ?', answers: ['Sarcelles', 'Grigny', 'Argenteuil', 'Vitry'], correct: 2 },
      { text: 'En août 2018, une bagarre médiatisée entre Booba et Kaaris a éclaté dans quel aéroport ?', answers: ['Roissy CDG', 'Orly', 'Marseille Provence', 'Nice'], correct: 1 },
      { text: 'Bigflo et Oli sont originaires de quelle ville ?', answers: ['Bordeaux', 'Lyon', 'Toulouse', 'Nantes'], correct: 2 },
      { text: 'SCH est originaire de quelle ville ?', answers: ['Paris', 'Marseille', 'Aix-en-Provence', 'Toulon'], correct: 1 },
      ...playersRapFr,
      { text: 'Sur quel label indépendant Lunatic a-t-il publié l’album Mauvais Œil ?', answers: ['Secteur Ä', '45 Scientific', 'Time Bomb', 'Hostile Records'], correct: 1, difficulty: 'expert' },
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
    ],
  },
  premier_league: {
    label: 'Premier League',
    icon: '🦁',
    questions: [...playersPremierLeague],
  },
  la_liga: {
    label: 'La Liga',
    icon: '🐂',
    questions: [...playersLaLiga],
  },
  bundesliga: {
    label: 'Bundesliga',
    icon: '🦅',
    questions: [...playersBundesliga],
  },
  serie_a: {
    label: 'Serie A',
    icon: '👢',
    questions: [...playersSerieA],
  },
  ligue_1: {
    label: 'Ligue 1',
    icon: '🐓',
    questions: [
      ...playersLigue1,
      { text: 'Quel entraîneur a conduit le RC Lens au titre de champion de France en 1997-1998 ?', answers: ['Élie Baup', 'Guy Roux', 'Daniel Leclercq', 'Claude Puel'], correct: 2, difficulty: 'expert' },
      { text: 'Quel entraîneur conduit Montpellier à son premier titre de champion de France en 2011-2012 ?', answers: ['René Girard', 'Rolland Courbis', 'Laurent Blanc', 'Christophe Galtier'], correct: 0, difficulty: 'expert' },
      { text: 'Quel club réalise le doublé championnat et Coupe de France sous Guy Roux en 1995-1996 ?', answers: ['FC Nantes', 'AJ Auxerre', 'RC Lens', 'FC Metz'], correct: 1, difficulty: 'expert' },
      { text: 'Quel club met fin aux sept sacres consécutifs de l’OL en remportant le championnat 2008-2009 ?', answers: ['Olympique de Marseille', 'LOSC Lille', 'Girondins de Bordeaux', 'AS Monaco'], correct: 2, difficulty: 'expert' },
      { text: 'Quel entraîneur conduit Monaco au titre de champion de France en 2016-2017 ?', answers: ['Claudio Ranieri', 'Niko Kovač', 'Lucien Favre', 'Leonardo Jardim'], correct: 3, difficulty: 'expert' },
    ],
  },
  bollywood: {
    label: 'Bollywood',
    icon: '🇮🇳',
    questions: [...playersBollywood],
  },
  actors: {
    label: 'Acteurs',
    icon: '⭐',
    questions: [...playersActorsAZ, ...playersActorsMZ],
  },
  netflix: {
    label: 'Netflix',
    icon: '🎬',
    questions: [
      { text: 'En quelle année Netflix a-t-il été fondé ?', answers: ['1995', '1997', '2000', '2004'], correct: 1 },
      { text: 'À l’origine, comment fonctionnait Netflix ?', answers: ['Streaming direct', 'Location de DVD par correspondance', 'Chaîne câblée', 'Jeu vidéo'], correct: 1 },
      { text: 'Quelle série met en scène des enfants affrontant des créatures du "Monde à l’Envers" à Hawkins ?', answers: ['Dark', 'Stranger Things', 'The Umbrella Academy', 'Wednesday'], correct: 1 },
      { text: 'Quelle série sur un casse de la Fabrique Nationale de la Monnaie espagnole a connu un succès mondial ?', answers: ['Elite', 'Vis a vis', 'La Casa de Papel', 'Sky Rojo'], correct: 2 },
      { text: 'Dans "Squid Game", quel est le premier jeu auquel participent les candidats ?', answers: ['Le tir à la corde', '1, 2, 3 Soleil', 'Les billes', 'Le pont de verre'], correct: 1 },
      { text: 'Quelle série retrace le règne de la reine Elizabeth II ?', answers: ['The Crown', 'Victoria', 'Downton Abbey', 'Bridgerton'], correct: 0 },
      { text: 'Dans quelle ville se déroule la série "Emily in Paris" ?', answers: ['Londres', 'Milan', 'Paris', 'New York'], correct: 2 },
      { text: 'Quel est le nom de famille du "Professeur", cerveau du casse dans "La Casa de Papel" ?', answers: ['Marquina', 'Vargas', 'Serrano', 'Palermo'], correct: 0 },
      { text: 'Quelle série documentaire sur un propriétaire de zoo américain excentrique a connu un énorme succès en 2020 ?', answers: ['Making a Murderer', 'Tiger King', 'Wild Wild Country', 'The Social Dilemma'], correct: 1 },
      { text: 'Quelle série d’animation Netflix suit un cheval anthropomorphe, acteur has-been à Hollywood ?', answers: ['BoJack Horseman', 'Big Mouth', 'F is for Family', 'Disenchantment'], correct: 0 },
    ],
  },
  got: {
    label: 'Game of Thrones',
    icon: '🐉',
    questions: [
      { text: 'Sur quels romans est basée la série "Game of Thrones" ?', answers: ['Le Seigneur des Anneaux', 'Le Trône de Fer (A Song of Ice and Fire)', 'La Roue du Temps', 'Les Chroniques de Narnia'], correct: 1 },
      { text: 'Quelle est la devise de la Maison Stark ?', answers: ['Le feu et le sang', 'L’hiver vient', 'Ouïe-nous rugir', 'Un Lannister paie toujours ses dettes'], correct: 1 },
      { text: 'Quel est le symbole animal de la Maison Lannister ?', answers: ['Un loup', 'Un cerf', 'Un lion', 'Un dragon'], correct: 2 },
      { text: 'Qui est surnommé "le Lutin" dans la série ?', answers: ['Jon Snow', 'Tyrion Lannister', 'Bran Stark', 'Samwell Tarly'], correct: 1 },
      { text: 'Comment s’appelle le trône convoité, forgé à partir d’épées fondues ?', answers: ['Le Trône de Fer', 'Le Trône d’Or', 'Le Siège des Rois', 'Le Trône des Dragons'], correct: 0 },
      { text: 'Quelle actrice interprète Daenerys Targaryen ?', answers: ['Sophie Turner', 'Emilia Clarke', 'Maisie Williams', 'Natalie Dormer'], correct: 1 },
      { text: 'Comment s’appelle l’immense mur de glace au nord de Westeros ?', answers: ['La Barrière', 'Le Rempart', 'Le Mur', 'La Frontière'], correct: 2 },
      { text: 'Quel chef de la Maison Stark est exécuté publiquement à la fin de la saison 1 ?', answers: ['Robb Stark', 'Ned Stark', 'Bran Stark', 'Rickon Stark'], correct: 1 },
      { text: 'Quel est le nom du continent où se déroule la majeure partie de l’histoire ?', answers: ['Essos', 'Westeros', 'Sothoryos', 'Ulthos'], correct: 1 },
      { text: 'Comment s’appelle l’épée en acier valyrien de la Maison Stark ?', answers: ['Glace', 'Torche', 'Grand-Griffe', 'Dents-de-Lion'], correct: 0 },
    ],
  },
  harry_potter: {
    label: 'Harry Potter',
    icon: '🪄',
    questions: [
      { text: 'Comment s’appelle l’école de sorcellerie fréquentée par Harry Potter ?', answers: ['Durmstrang', 'Poudlard', 'Beauxbâtons', 'Ilvermorny'], correct: 1 },
      { text: 'Quelle maison de Poudlard est associée au courage ?', answers: ['Serpentard', 'Poufsouffle', 'Gryffondor', 'Serdaigle'], correct: 2 },
      { text: 'Quel est le nom du meilleur ami de Harry Potter ?', answers: ['Neville Londubat', 'Ron Weasley', 'Seamus Finnigan', 'Dean Thomas'], correct: 1 },
      { text: 'Quel objet rend Harry invisible lorsqu’il s’en couvre ?', answers: ['La Cape d’invisibilité', 'La Baguette de Sureau', 'Le Retourneur de Temps', 'Le Choixpeau'], correct: 0 },
      { text: 'Qui est le principal antagoniste de la saga ?', answers: ['Drago Malefoy', 'Voldemort', 'Bellatrix Lestrange', 'Lucius Malefoy'], correct: 1 },
      { text: 'Quel sport se joue sur des balais volants dans l’univers de Harry Potter ?', answers: ['Le Quidditch', 'Le Souaffle', 'Le Vif d’Or', 'Le Cognard'], correct: 0 },
      { text: 'Quel animal est le symbole de la maison Serpentard ?', answers: ['Un blaireau', 'Un aigle', 'Un serpent', 'Un lion'], correct: 2 },
      { text: 'Qui enseigne les potions à Poudlard durant la majeure partie de la saga ?', answers: ['Minerva McGonagall', 'Severus Rogue', 'Albus Dumbledore', 'Remus Lupin'], correct: 1 },
      { text: 'Quelle est la meilleure amie d’Harry, brillante élève de Gryffondor ?', answers: ['Luna Lovegood', 'Cho Chang', 'Hermione Granger', 'Ginny Weasley'], correct: 2 },
      { text: 'Quel est le nom de l’elfe de maison libéré par Harry ?', answers: ['Kreattur', 'Winky', 'Dobby', 'Krokdur'], correct: 2 },
    ],
  },
  marvel: {
    label: 'Marvel',
    icon: '🦸',
    questions: [
      { text: 'Quel est le vrai nom d’Iron Man ?', answers: ['Steve Rogers', 'Tony Stark', 'Bruce Banner', 'Peter Parker'], correct: 1 },
      { text: 'De quel royaume Thor est-il originaire ?', answers: ['Midgard', 'Asgard', 'Jotunheim', 'Vanaheim'], correct: 1 },
      { text: 'Quel métal recouvre le squelette de Wolverine ?', answers: ['Le vibranium', 'Le titane', 'L’adamantium', 'Le carbonadium'], correct: 2 },
      { text: 'Qui est le principal antagoniste du film "Avengers: Infinity War" ?', answers: ['Loki', 'Thanos', 'Ultron', 'Le Bouffon Vert'], correct: 1 },
      { text: 'Quel super-héros se transforme en géant vert sous le coup de la colère ?', answers: ['Hulk', 'Namor', 'Abomination', 'Juggernaut'], correct: 0 },
      { text: 'Quelle organisation emploie Nick Fury ?', answers: ['Le S.H.I.E.L.D.', 'La CIA', 'Le S.W.O.R.D.', 'Hydra'], correct: 0 },
      { text: 'En quel métal fictif est fait le bouclier de Captain America ?', answers: ['L’adamantium', 'Le vibranium', 'L’uru', 'Le titane'], correct: 1 },
      { text: 'Quelle actrice interprète Black Widow au cinéma ?', answers: ['Elizabeth Olsen', 'Brie Larson', 'Scarlett Johansson', 'Zoe Saldana'], correct: 2 },
      { text: 'Quel est le surnom de Peter Quill dans "Les Gardiens de la Galaxie" ?', answers: ['Star-Lord', 'Nova', 'Rocket', 'Drax'], correct: 0 },
      { text: 'Quelle maison d’édition a créé les personnages Marvel ?', answers: ['DC Comics', 'Marvel Comics', 'Image Comics', 'Dark Horse'], correct: 1 },
    ],
  },
  star_wars: {
    label: 'Star Wars',
    icon: '⚔️',
    questions: [
      { text: 'Qui est le père de Luke Skywalker ?', answers: ['Obi-Wan Kenobi', 'L’Empereur Palpatine', 'Dark Vador', 'Yoda'], correct: 2 },
      { text: 'Quel est le nom du vaisseau de Han Solo ?', answers: ['L’Étoile Noire', 'Le Faucon Millenium', 'Le Destroyer Stellaire', 'La Navette Impériale'], correct: 1 },
      { text: 'À quelle espèce Chewbacca appartient-il ?', answers: ['Wookiee', 'Ewok', 'Rodien', 'Gungan'], correct: 0 },
      { text: 'Quel petit droïde bleu et blanc accompagne C-3PO ?', answers: ['BB-8', 'R2-D2', 'K-2SO', 'IG-11'], correct: 1 },
      { text: 'Quelle célèbre réplique résume la philosophie Jedi sur l’énergie universelle ?', answers: ['"Que la Force soit avec toi"', '"Vive la Résistance"', '"Il y a toujours de l’espoir"', '"La galaxie t’appelle"'], correct: 0 },
      { text: 'Quelle est la planète natale de Luke Skywalker ?', answers: ['Naboo', 'Coruscant', 'Tatooine', 'Hoth'], correct: 2 },
      { text: 'Qui forme initialement Luke Skywalker au maniement du sabre laser ?', answers: ['Yoda', 'Obi-Wan Kenobi', 'Mace Windu', 'Qui-Gon Jinn'], correct: 1 },
      { text: 'Quelle organisation Dark Vador sert-il ?', answers: ['La Rébellion', 'L’Empire galactique', 'L’Ordre Jedi', 'Le Sénat'], correct: 1 },
      { text: 'Quel est le nom de la princesse jouée par Carrie Fisher ?', answers: ['Princesse Padmé', 'Princesse Leia', 'Princesse Amidala', 'Princesse Jyn'], correct: 1 },
      { text: 'Quel réalisateur a créé la saga Star Wars ?', answers: ['Steven Spielberg', 'James Cameron', 'George Lucas', 'Ridley Scott'], correct: 2 },
    ],
  },
  disney: {
    label: 'Disney Classics',
    icon: '🏰',
    questions: [
      { text: 'Quel film Disney met en scène une sirène nommée Ariel ?', answers: ['La Petite Sirène', 'Vaiana', 'Pocahontas', 'Raiponce'], correct: 0 },
      { text: 'Dans "Le Roi Lion", quel est le nom du jeune lionceau héros ?', answers: ['Mufasa', 'Simba', 'Scar', 'Kovu'], correct: 1 },
      { text: 'Quelle princesse Disney s’endort après avoir touché un rouet ?', answers: ['Blanche-Neige', 'Cendrillon', 'La Belle au Bois Dormant', 'Belle'], correct: 2 },
      { text: 'Quel personnage Disney a le nez qui s’allonge quand il ment ?', answers: ['Pinocchio', 'Dumbo', 'Bambi', 'Le Roi Lion'], correct: 0 },
      { text: 'Dans "La Belle et la Bête", quel personnage est un chandelier ?', answers: ['Big Ben', 'Lumière', 'Zip', 'Monsieur Dindon'], correct: 1 },
      { text: 'À quelle heure précise le charme de Cendrillon se rompt-il ?', answers: ['Minuit', '23h', '1h du matin', 'Minuit et demi'], correct: 0 },
      { text: 'Quel est le nom du père de Nemo dans "Le Monde de Nemo" ?', answers: ['Bruce', 'Crush', 'Marin', 'Gill'], correct: 2 },
      { text: 'Quel personnage exauce les vœux dans "Aladdin" ?', answers: ['Le Sultan', 'Le Génie', 'Jafar', 'Le Tapis magique'], correct: 1 },
      { text: 'En quelle année Walt Disney a-t-il fondé son studio d’animation ?', answers: ['1923', '1937', '1955', '1901'], correct: 0 },
      { text: 'Dans "Toy Story", quel est le jouet cow-boy, meilleur ami d’Andy ?', answers: ['Buzz l’Éclair', 'Woody', 'Rex', 'Monsieur Patate'], correct: 1 },
    ],
  },
  pokemon: {
    label: 'Pokémon',
    icon: '⚡',
    questions: [
      { text: 'Quel est le tout premier Pokémon du Pokédex national ?', answers: ['Pikachu', 'Bulbizarre', 'Salamèche', 'Carapuce'], correct: 1 },
      { text: 'Quel type de Pokémon est Pikachu ?', answers: ['Feu', 'Eau', 'Électrique', 'Plante'], correct: 2 },
      { text: 'Quel objet permet de capturer un Pokémon sauvage ?', answers: ['Une Poké Ball', 'Un filet', 'Une cage', 'Un piège'], correct: 0 },
      { text: 'Quelle entreprise a créé les jeux vidéo Pokémon ?', answers: ['Nintendo seul', 'Game Freak', 'Sega', 'Capcom'], correct: 1 },
      { text: 'Quel Pokémon de type feu orne la boîte de "Pokémon Rouge" ?', answers: ['Dracaufeu', 'Ronflex', 'Mewtwo', 'Léviator'], correct: 0 },
      { text: 'Quelle ville est le point de départ du voyage de Sacha dans le dessin animé ?', answers: ['Jadielle', 'Bourg Palette', 'Argenta', 'Céladopole'], correct: 1 },
      { text: 'Combien de badges d’arène faut-il collecter pour défier la Ligue Pokémon dans les jeux classiques ?', answers: ['6', '8', '10', '4'], correct: 1 },
      { text: 'Quel cri caractéristique pousse Pikachu ?', answers: ['"Rio Rio"', '"Pika Pika"', '"Dracau Dracau"', '"Salamèche"'], correct: 1 },
      { text: 'Comment se nomme l’organisation criminelle antagoniste des premiers jeux Pokémon ?', answers: ['La Team Rocket', 'La Team Aqua', 'La Team Magma', 'La Team Plasma'], correct: 0 },
      { text: 'Quel est le nom du rival principal de Sacha dans les premières générations ?', answers: ['Régis', 'Paul', 'Barry', 'Silver'], correct: 0 },
    ],
  },
  f1: {
    label: 'Formule 1',
    icon: '🏎️',
    questions: [
      { text: 'Combien de fois Michael Schumacher a-t-il été champion du monde de F1 ?', answers: ['5', '6', '7', '8'], correct: 2 },
      { text: 'Quelle écurie de F1 est associée à la couleur rouge et au cheval cabré ?', answers: ['McLaren', 'Ferrari', 'Red Bull', 'Williams'], correct: 1 },
      { text: 'Quel pilote a égalé le record de 7 titres mondiaux de Schumacher ?', answers: ['Sebastian Vettel', 'Max Verstappen', 'Lewis Hamilton', 'Fernando Alonso'], correct: 2 },
      { text: 'Dans quel pays se déroule le Grand Prix de Monaco ?', answers: ['France', 'Italie', 'Monaco', 'Espagne'], correct: 2 },
      { text: 'Combien de points rapporte une victoire en Grand Prix depuis 2010 ?', answers: ['10', '20', '25', '30'], correct: 2 },
      { text: 'Quel pilote français a été champion du monde en 1985 et 1986 ?', answers: ['Alain Prost', 'René Arnoux', 'Jean Alesi', 'Olivier Panis'], correct: 0 },
      { text: 'Quel drapeau signale la fin d’une course de F1 ?', answers: ['Un drapeau rouge', 'Un drapeau à damier', 'Un drapeau jaune', 'Un drapeau bleu'], correct: 1 },
      { text: 'Quelle écurie britannique a été fondée par Frank Williams ?', answers: ['Williams', 'McLaren', 'Force India', 'Brawn GP'], correct: 0 },
      { text: 'Quel circuit français historique est connu pour sa ligne droite du Mistral ?', answers: ['Magny-Cours', 'Paul Ricard', 'Charade', 'Reims-Gueux'], correct: 1 },
      { text: 'Combien de roues compte une monoplace de Formule 1 ?', answers: ['3', '4', '6', '2'], correct: 1 },
    ],
  },
  nba: {
    label: 'Basket NBA',
    icon: '🏀',
    questions: [
      { text: 'Combien de joueurs sont sur le terrain par équipe au basketball ?', answers: ['4', '5', '6', '7'], correct: 1 },
      { text: 'Quel joueur surnommé "His Airness" a remporté 6 titres NBA avec Chicago ?', answers: ['Magic Johnson', 'Michael Jordan', 'Larry Bird', 'Kobe Bryant'], correct: 1 },
      { text: 'Quelle franchise LeBron James a-t-il rejointe en 2018 ?', answers: ['Les Warriors', 'Les Lakers de Los Angeles', 'Les Celtics', 'Les Knicks'], correct: 1 },
      { text: 'Combien de points vaut un panier marqué derrière la ligne à 3 points ?', answers: ['2', '3', '1', '4'], correct: 1 },
      { text: 'Quelle franchise NBA est basée à Boston ?', answers: ['Les Nets', 'Les Celtics', 'Les Sixers', 'Les Bulls'], correct: 1 },
      { text: 'Quel joueur a dépassé Kareem Abdul-Jabbar au classement des meilleurs marqueurs de l’histoire de la NBA en 2023 ?', answers: ['Kevin Durant', 'LeBron James', 'Stephen Curry', 'James Harden'], correct: 1 },
      { text: 'Combien de quart-temps compte un match de NBA ?', answers: ['2', '3', '4', '5'], correct: 2 },
      { text: 'Quel pays a remporté la majorité des tournois olympiques de basketball depuis 1992 ?', answers: ['L’Espagne', 'Les États-Unis', 'L’Argentine', 'La Serbie'], correct: 1 },
      { text: 'Quelle légende du basket est surnommée "The Black Mamba" ?', answers: ['Kobe Bryant', 'Allen Iverson', 'Tim Duncan', 'Vince Carter'], correct: 0 },
      { text: 'Quelle est la durée réglementaire d’un quart-temps en NBA, en minutes ?', answers: ['10', '12', '15', '8'], correct: 1 },
    ],
  },
  tv_shows: {
    label: 'Séries Cultes',
    icon: '📺',
    questions: [
      { text: 'Dans quelle ville se déroule la série "Friends" ?', answers: ['Los Angeles', 'New York', 'Chicago', 'Boston'], correct: 1 },
      { text: 'Quel est le nom du café où se retrouvent les personnages de "Friends" ?', answers: ['Central Perk', 'Coffee Bean', 'The Grind', 'Java House'], correct: 0 },
      { text: 'Quelle série met en scène un professeur de chimie devenu fabricant de drogue ?', answers: ['Breaking Bad', 'Dexter', 'Ozark', 'The Wire'], correct: 0 },
      { text: 'Quel est le prénom du personnage principal de "Dr House" ?', answers: ['Gregory', 'James', 'Robert', 'Eric'], correct: 0 },
      { text: 'Quelle série britannique culte met en scène un détective au 221B Baker Street ?', answers: ['Sherlock', 'Luther', 'Broadchurch', 'Peaky Blinders'], correct: 0 },
      { text: 'Combien d’amis composent le groupe principal de la série "Friends" ?', answers: ['4', '5', '6', '7'], correct: 2 },
      { text: 'Quelle série américaine se déroule dans un bureau de vente de papier à Scranton ?', answers: ['The Office', 'Parks and Recreation', '30 Rock', 'Community'], correct: 0 },
      { text: 'Quel est le nom de famille de Walter White dans "Breaking Bad" ?', answers: ['White', 'Pinkman', 'Schrader', 'Fring'], correct: 0 },
      { text: 'Quelle chaîne américaine a diffusé "Friends" à l’origine ?', answers: ['CBS', 'ABC', 'NBC', 'Fox'], correct: 2 },
      { text: 'De quelle addiction souffre le Dr House tout au long de la série ?', answers: ['L’alcool', 'La Vicodin', 'La morphine', 'La cocaïne'], correct: 1 },
    ],
  },
  histoire_fr: {
    label: 'Histoire de France',
    icon: '⚜️',
    questions: [
      { text: 'Quel roi de France est surnommé le "Roi Soleil" ?', answers: ['Louis XIII', 'Louis XIV', 'Louis XV', 'Louis XVI'], correct: 1 },
      { text: 'En quelle année Napoléon Bonaparte a-t-il été sacré empereur ?', answers: ['1799', '1804', '1812', '1815'], correct: 1 },
      { text: 'Quelle bataille de 1815 marque la défaite finale de Napoléon ?', answers: ['Austerlitz', 'Waterloo', 'Trafalgar', 'Iéna'], correct: 1 },
      { text: 'Qui était Jeanne d’Arc ?', answers: ['Une reine de France', 'Une héroïne militaire pendant la guerre de Cent Ans', 'Une philosophe des Lumières', 'Une impératrice romaine'], correct: 1 },
      { text: 'En quelle année la France a-t-elle aboli la peine de mort ?', answers: ['1969', '1981', '1995', '2000'], correct: 1 },
      { text: 'Quel monument parisien a été construit pour l’Exposition universelle de 1889 ?', answers: ['L’Arc de Triomphe', 'La Tour Eiffel', 'Le Sacré-Cœur', 'Le Grand Palais'], correct: 1 },
      { text: 'Qui était le premier président de la Ve République française ?', answers: ['Georges Pompidou', 'Charles de Gaulle', 'François Mitterrand', 'René Coty'], correct: 1 },
      { text: 'Quelle guerre a opposé la France et l’Angleterre de 1337 à 1453 ?', answers: ['La Guerre de Cent Ans', 'La Guerre de Sept Ans', 'Les Guerres de Religion', 'La Fronde'], correct: 0 },
      { text: 'Quel traité a officiellement mis fin à la Première Guerre mondiale en 1919 ?', answers: ['Le Traité de Vienne', 'Le Traité de Versailles', 'Le Traité de Westphalie', 'Le Traité de Rome'], correct: 1 },
      { text: 'Quel palais royal Louis XIV a-t-il fait construire près de Paris ?', answers: ['Le Louvre', 'Le Château de Versailles', 'Fontainebleau', 'Le Château de Chambord'], correct: 1 },
    ],
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
    questions: [
      { text: 'Quel plombier italien est le héros des jeux Nintendo créés par Shigeru Miyamoto ?', answers: ['Luigi', 'Mario', 'Wario', 'Yoshi'], correct: 1 },
      { text: 'Quelle console a lancé la série "Sonic the Hedgehog" en 1991 ?', answers: ['La Super Nintendo', 'La Sega Mega Drive', 'La PlayStation', 'La Game Boy'], correct: 1 },
      { text: 'Quel jeu d’arcade de 1980 met en scène un personnage jaune mangeant des pac-gommes ?', answers: ['Pac-Man', 'Donkey Kong', 'Space Invaders', 'Galaga'], correct: 0 },
      { text: 'Quelle entreprise a créé la console portable Game Boy ?', answers: ['Sega', 'Sony', 'Nintendo', 'Atari'], correct: 2 },
      { text: 'Quel est le nom de la princesse que Mario doit régulièrement sauver ?', answers: ['La Princesse Zelda', 'La Princesse Peach', 'La Princesse Daisy', 'La Princesse Rosalina'], correct: 1 },
      { text: 'Quel est le but principal du jeu Tetris ?', answers: ['Aligner des lignes de blocs pour les faire disparaître', 'Collecter des pièces', 'Battre un boss final', 'Résoudre des énigmes'], correct: 0 },
      { text: 'Quelle console de Sony est sortie en 1994, rivalisant avec la Nintendo 64 ?', answers: ['La PlayStation', 'La Xbox', 'La Dreamcast', 'La PlayStation 2'], correct: 0 },
      { text: 'Quel héros vêtu de vert doit sauver la princesse Zelda ?', answers: ['Link', 'Kirby', 'Fox McCloud', 'Ness'], correct: 0 },
      { text: 'Quel jeu de combat oppose des personnages comme Ryu et Ken ?', answers: ['Mortal Kombat', 'Street Fighter', 'Tekken', 'Virtua Fighter'], correct: 1 },
      { text: 'Quelle entreprise japonaise a créé la console Sega Mega Drive ?', answers: ['Sega', 'Namco', 'Konami', 'Capcom'], correct: 0 },
    ],
  },
  cinema_fr: {
    label: 'Cinéma Français',
    icon: '🎭',
    questions: [
      { text: 'Qui a réalisé "Le Fabuleux Destin d’Amélie Poulain" ?', answers: ['Luc Besson', 'Jean-Pierre Jeunet', 'Michel Gondry', 'Claude Lelouch'], correct: 1 },
      { text: 'Quel acteur incarne OSS 117 dans la saga de films comiques ?', answers: ['Jean Dujardin', 'Gad Elmaleh', 'Dany Boon', 'Omar Sy'], correct: 0 },
      { text: 'Quel film muet français a remporté l’Oscar du meilleur film en 2012 ?', answers: ['Intouchables', 'The Artist', 'La Môme', 'Amour'], correct: 1 },
      { text: 'Quel duo de réalisateurs a fait "Intouchables" ?', answers: ['Nakache et Toledano', 'Dardenne et Dardenne', 'Besson et Kassovitz', 'Ozon et Audiard'], correct: 0 },
      { text: 'Dans "Intouchables", quel acteur interprète Philippe ?', answers: ['Omar Sy', 'François Cluzet', 'Vincent Cassel', 'Daniel Auteuil'], correct: 1 },
      { text: 'Quelle série française met en scène un braqueur inspiré d’Arsène Lupin ?', answers: ['Dix pour cent', 'Lupin', 'Le Bureau des Légendes', 'Engrenages'], correct: 1 },
      { text: 'Qui interprète le rôle principal dans la série "Lupin" ?', answers: ['Omar Sy', 'Jean Dujardin', 'Tahar Rahim', 'Eric Judor'], correct: 0 },
      { text: 'Quel acteur a incarné Astérix face à Gérard Depardieu (Obélix) dans les premiers films ?', answers: ['Christian Clavier', 'Édouard Baer', 'Guillaume Gallienne', 'Franck Dubosc'], correct: 0 },
      { text: 'Gérard Depardieu incarne quel personnage de bande dessinée au cinéma ?', answers: ['Astérix', 'Obélix', 'Panoramix', 'Abraracourcix'], correct: 1 },
      { text: 'Quelle actrice a remporté l’Oscar de la meilleure actrice pour son rôle d’Édith Piaf dans "La Môme" ?', answers: ['Juliette Binoche', 'Marion Cotillard', 'Audrey Tautou', 'Léa Seydoux'], correct: 1 },
      { text: 'Qui est cet acteur ?', image: '/images/players/gerard_depardieu.jpg', credit: 'Photo : Siebbi (CC BY 3.0)', answers: ['Gérard Depardieu', 'Catherine Deneuve', 'Isabelle Adjani', 'Juliette Binoche'], correct: 0 },
      { text: 'Qui est cette actrice ?', image: '/images/players/catherine_deneuve.jpg', credit: 'Photo : Martin Kraft (CC BY-SA 3.0)', answers: ['Juliette Binoche', 'Gérard Depardieu', 'Catherine Deneuve', 'Isabelle Adjani'], correct: 2 },
      { text: 'Qui est cette actrice ?', image: '/images/players/isabelle_adjani.jpg', credit: 'Photo : Georges Biard (CC BY-SA 4.0)', answers: ['Isabelle Adjani', 'Gérard Depardieu', 'Juliette Binoche', 'Catherine Deneuve'], correct: 0 },
      { text: 'Qui est cette actrice ?', image: '/images/players/juliette_binoche.jpg', credit: 'Photo : Elena Ternovaja (CC BY-SA 3.0)', answers: ['Isabelle Adjani', 'Gérard Depardieu', 'Catherine Deneuve', 'Juliette Binoche'], correct: 3 },
    ],
  },
  culture_fr: {
    label: 'Culture Générale FR',
    icon: '🇫🇷',
    questions: [
      { text: 'Quelle est la capitale de la France ?', answers: ['Lyon', 'Marseille', 'Paris', 'Toulouse'], correct: 2 },
      { text: 'En quelle année a eu lieu la prise de la Bastille ?', answers: ['1789', '1799', '1804', '1815'], correct: 0 },
      { text: 'Quel roi de France a été exécuté pendant la Révolution française ?', answers: ['Louis XIV', 'Louis XV', 'Louis XVI', 'Charles X'], correct: 2 },
      { text: 'Quel plat traditionnel de Bourgogne est à base de bœuf mijoté au vin rouge ?', answers: ['Cassoulet', 'Bœuf bourguignon', 'Pot-au-feu', 'Blanquette'], correct: 1 },
      { text: 'Combien de régions administratives compte la France métropolitaine depuis 2016 ?', answers: ['11', '13', '18', '22'], correct: 1 },
      { text: 'Quel fleuve traverse la ville de Paris ?', answers: ['La Loire', 'Le Rhône', 'La Seine', 'La Garonne'], correct: 2 },
      { text: 'Quel est le point culminant de la France ?', answers: ['Le Mont Blanc', 'Le Pic du Midi', 'Le Mont Ventoux', 'Le Puy de Dôme'], correct: 0 },
      { text: 'Quelle est la devise nationale de la France ?', answers: ['Unité, Travail, Progrès', 'Liberté, Égalité, Fraternité', 'Honneur et Patrie', 'Paix et Prospérité'], correct: 1 },
      { text: 'Qui a écrit "Les Misérables" ?', answers: ['Victor Hugo', 'Émile Zola', 'Honoré de Balzac', 'Gustave Flaubert'], correct: 0 },
      { text: 'Quelle ville française est surnommée "la Ville Lumière" ?', answers: ['Lyon', 'Nice', 'Paris', 'Bordeaux'], correct: 2 },
    ],
  },
  tennis: {
    label: 'Tennis',
    icon: '🎾',
    questions: [...playersTennis],
  },
  basketball: {
    label: 'Basketball',
    icon: '🏀',
    questions: [...playersBasketball],
  },
  rugby: {
    label: 'Rugby',
    icon: '🏉',
    questions: [...playersRugby],
  },
  boxe: {
    label: 'Boxe',
    icon: '🥊',
    questions: [...playersBoxe],
  },
  athletisme: {
    label: 'Athlétisme',
    icon: '🏃',
    questions: [...playersAthletisme],
  },
  science_stars: {
    label: 'Savants Célèbres',
    icon: '🔬',
    questions: [...playersScience],
  },
  humour: {
    label: 'Humour',
    icon: '😂',
    questions: [...playersHumour],
  },
  mode: {
    label: 'Mode',
    icon: '💃',
    questions: [...playersMode],
  },
  kpop: {
    label: 'K-pop',
    icon: '🇰🇷',
    questions: [...playersKpop],
  },
  series_ado_romance: {
    label: 'Séries Ado & Romance',
    icon: '💕',
    questions: [...playersSeriesAdoRomance],
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
  boxe_champions: { label: 'Boxe (champions)', icon: '🥊', questions: [...boxeChampions] },
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
  studio_ghibli: { label: 'Studio Ghibli', icon: '🌱', questions: [...studioGhibli] },
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
  fleuves_montagnes: { label: 'Fleuves & montagnes', icon: '🏔️', questions: [...fleuvesMontagnes] },
  europe_culture_histoire: { label: 'Europe (culture/histoire)', icon: '🏰', questions: [...europeCultureHistoire] },
  afrique_culture_histoire: { label: 'Afrique (culture/histoire)', icon: '🌍', questions: [...afriqueCultureHistoire] },
  asie_culture_histoire: { label: 'Asie (culture/histoire)', icon: '🏯', questions: [...asieCultureHistoire] },
  amerique_latine: { label: 'Amérique latine', icon: '🌎', questions: [...ameriqueLatine] },
  etats_unis_culture_generale: { label: 'États-Unis (culture générale)', icon: '🗽', questions: [...etatsUnisCultureGenerale] },
  histoire_antique: { label: 'Histoire antique', icon: '🏛️', questions: [...histoireAntique] },
  mythologie_grecque: { label: 'Mythologie grecque', icon: '⚡', questions: [...mythologieGrecque] },
  mythologie_nordique: { label: 'Mythologie nordique', icon: '🔨', questions: [...mythologieNordique] },
  mythologie_egyptienne: { label: 'Mythologie égyptienne', icon: '𓂀', questions: [...mythologieEgyptienne] },
  moyen_age: { label: 'Moyen Âge', icon: '⚔️', questions: [...moyenAge] },
  premiere_guerre_mondiale: { label: 'Première Guerre mondiale', icon: '🪖', questions: [...premiereGuerreMondiale] },
  revolutions_dans_le_monde: { label: 'Révolutions dans le monde', icon: '✊', questions: [...revolutionsDansLeMonde] },
  grandes_explorations: { label: 'Grandes explorations', icon: '🧭', questions: [...grandesExplorations] },
  litterature_francaise_classique: { label: 'Littérature française classique', icon: '📖', questions: [...litteratureFrancaiseClassique] },
  litterature_mondiale: { label: 'Littérature mondiale', icon: '📚', questions: [...litteratureMondiale] },
  philosophes_celebres: { label: 'Philosophes célèbres', icon: '💭', questions: [...philosophesCelebres] },
  peintres_oeuvres_d_art: { label: 'Peintres & œuvres d\'art', icon: '🎨', questions: [...peintresOeuvresDArt] },
  sculpteurs_monuments: { label: 'Sculpteurs & monuments', icon: '🗿', questions: [...sculpteursMonuments] },
  architecture_celebre: { label: "Architecture célèbre", icon: "🏛️", questions: [...architectureCelebre] },
  merveilles_du_monde: { label: "Merveilles du monde", icon: "🌐", questions: [...merveillesDuMonde] },
  animaux: { label: "Animaux", icon: "🐾", questions: [...animaux] },
  oceans: { label: "Océans", icon: "🌊", questions: [...oceans] },
  dinosaures: { label: "Dinosaures", icon: "🦖", questions: [...dinosaures] },
  environnement_ecologie: { label: "Environnement & écologie", icon: "🌱", questions: [...environnementEcologie] },
  inventions_inventeurs: { label: "Inventions & inventeurs", icon: "💡", questions: [...inventionsInventeurs] },
  prix_nobel: { label: "Prix Nobel", icon: "🏅", questions: [...prixNobel] },
  langues_du_monde: { label: "Langues du monde", icon: "🗣️", questions: [...languesDuMonde] },
  traditions_fetes_du_monde: { label: "Traditions & fêtes du monde", icon: "🎊", questions: [...traditionsFetesDuMonde] },
  gastronomie_francaise: { label: "Gastronomie française", icon: "🥐", questions: [...gastronomieFrancaise] },
  gastronomie_du_monde: { label: "Gastronomie du monde", icon: "🍜", questions: [...gastronomieDuMonde] },
  vins_terroirs: { label: "Vins & terroirs", icon: "🍇", questions: [...vinsTerroirs] },
  hymnes_nationaux: { label: "Hymnes nationaux", icon: "🎼", questions: [...hymnesNationaux] },
  femmes_celebres_de_l_histoire: { label: "Femmes célèbres de l'histoire", icon: "👩‍🏫", questions: [...femmesCelebresDeLHistoire] },
  dates_cles_de_l_histoire: { label: "Dates clés de l'histoire", icon: "📅", questions: [...datesClesDeLHistoire] },
  rois_reines_d_europe: { label: "Rois & reines d'Europe", icon: "👑", questions: [...roisReinesDEurope] },
  presidents_francais: { label: "Présidents français", icon: "🇫🇷", questions: [...presidentsFrancais] },
  presidents_americains: { label: "Présidents américains", icon: "🇺🇸", questions: [...presidentsAmericains] },
  grandes_villes_du_monde: { label: "Grandes villes du monde", icon: "🏙️", questions: [...grandesVillesDuMonde] },
  especes_en_voie_de_disparition: { label: "Espèces en voie de disparition", icon: "🐼", questions: [...especesEnVoieDeDisparition] },
  histoire_du_maroc: { label: "Histoire du Maroc", icon: "🇲🇦", questions: [...histoireDuMaroc] },
  histoire_de_l_algerie: { label: "Histoire de l'Algérie", icon: "🇩🇿", questions: [...histoireDeLAlgerie] },
  histoire_de_la_tunisie: { label: "Histoire de la Tunisie", icon: "🇹🇳", questions: [...histoireDeLaTunisie] },
  islam: { label: "Islam", icon: "☪️", questions: [...islam] },
  christianisme: { label: "Christianisme", icon: "✝️", questions: [...christianisme] },
  judaisme: { label: "Judaïsme", icon: "✡️", questions: [...judaisme] },
  bouddhisme: { label: "Bouddhisme", icon: "☸️", questions: [...bouddhisme] },
  hindouisme: { label: "Hindouisme", icon: "🕉️", questions: [...hindouisme] },
  sonic: { label: "Sonic", icon: "💨", questions: [...sonic] },
  fifa_ea_sports_fc: { label: "FIFA/EA Sports FC", icon: "⚽", questions: [...fifaEaSportsFc] },
  assassin_s_creed: { label: "Assassin's Creed", icon: "🗡️", questions: [...assassinSCreed] },
  the_witcher: { label: "The Witcher", icon: "🐺", questions: [...theWitcher] },
  elden_ring: { label: "Elden Ring", icon: "💍", questions: [...eldenRing] },
  animal_crossing: { label: "Animal Crossing", icon: "🏝️", questions: [...animalCrossing] },
  the_sims: { label: "The Sims", icon: "💚", questions: [...theSims] },
  overwatch: { label: "Overwatch", icon: "🦸", questions: [...overwatch] },
  counter_strike: { label: "Counter-Strike", icon: "🎯", questions: [...counterStrike] },
  world_of_warcraft: { label: "World of Warcraft", icon: "⚔️", questions: [...worldOfWarcraft] },
  legendes_de_l_esport: { label: "Légendes de l'esport", icon: "🏆", questions: [...legendesDeLEsport] },
  streamers_gaming_fr: { label: "Streamers gaming FR", icon: "🎙️", questions: [...streamersGamingFr] },
  jeux_mobile_populaires: { label: "Jeux mobile populaires", icon: "📱", questions: [...jeuxMobilePopulaires] },
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
  cyclisme_stars: { label: "Cyclisme (Stars)", icon: "🚴", questions: [...cyclismeStars] },
  musique_stars: { label: "Musique (Stars)", icon: "🎤", questions: [...musiqueStars] },

  // Catalogue expansion batch 1.
  booba: { label: "Booba", icon: "🎤", questions: [...booba] },
  jul: { label: "JUL", icon: "🎤", questions: [...jul] },
  pnl: { label: "PNL", icon: "🎤", questions: [...pnl] },
  ninho: { label: "Ninho", icon: "🎤", questions: [...ninho] },
  sch: { label: "SCH", icon: "🎤", questions: [...sch] },
  damso: { label: "Damso", icon: "🎤", questions: [...damso] },
  orelsan: { label: "Orelsan", icon: "🎤", questions: [...orelsan] },
  gims: { label: "Gims", icon: "🎤", questions: [...gims] },
  aya_nakamura: { label: "Aya Nakamura", icon: "🎤", questions: [...ayaNakamura] },
  nekfeu: { label: "Nekfeu", icon: "🎤", questions: [...nekfeu] },
  gazo: { label: "Gazo", icon: "🎤", questions: [...gazo] },
  tiakola: { label: "Tiakola", icon: "🎤", questions: [...tiakola] },
  lomepal: { label: "Lomepal", icon: "🎤", questions: [...lomepal] },
  soprano: { label: "Soprano", icon: "🎤", questions: [...soprano] },
  drake: { label: "Drake", icon: "🎤", questions: [...drake] },
  eminem: { label: "Eminem", icon: "🎤", questions: [...eminem] },
  kanye_west: { label: "Kanye West", icon: "🎤", questions: [...kanyeWest] },
  travis_scott: { label: "Travis Scott", icon: "🎤", questions: [...travisScott] },
  the_weeknd: { label: "The Weeknd", icon: "🎤", questions: [...theWeeknd] },
  rihanna: { label: "Rihanna", icon: "🎤", questions: [...rihanna] },
  beyonce: { label: "Beyoncé", icon: "🎤", questions: [...beyonce] },
  taylor_swift: { label: "Taylor Swift", icon: "🎤", questions: [...taylorSwift] },
  michael_jackson: { label: "Michael Jackson", icon: "🎤", questions: [...michaelJackson] },
  dua_lipa: { label: "Dua Lipa", icon: "🎤", questions: [...duaLipa] },
  billie_eilish: { label: "Billie Eilish", icon: "🎤", questions: [...billieEilish] },
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
  breaking_bad: { label: "Breaking Bad", icon: "🎬", questions: [...breakingBad] },
  the_walking_dead: { label: "The Walking Dead", icon: "🎬", questions: [...theWalkingDead] },
  la_casa_de_papel: { label: "La Casa de Papel", icon: "🎬", questions: [...laCasaDePapel] },
  peaky_blinders: { label: "Peaky Blinders", icon: "🎬", questions: [...peakyBlinders] },
  the_boys: { label: "The Boys", icon: "🎬", questions: [...theBoys] },
  the_last_of_us_serie: { label: "The Last of Us (série)", icon: "🎬", questions: [...theLastOfUsSerie] },
  house_of_the_dragon: { label: "House of the Dragon", icon: "🎬", questions: [...houseOfTheDragon] },
  friends: { label: "Friends", icon: "🎬", questions: [...friends] },
  the_office: { label: "The Office", icon: "🎬", questions: [...theOffice] },
  vikings: { label: "Vikings", icon: "🎬", questions: [...vikings] },
  prison_break: { label: "Prison Break", icon: "🎬", questions: [...prisonBreak] },
  black_mirror: { label: "Black Mirror", icon: "🎬", questions: [...blackMirror] },
  les_simpson: { label: "Les Simpson", icon: "🎬", questions: [...lesSimpson] },
  south_park: { label: "South Park", icon: "🎬", questions: [...southPark] },
  avatar_le_dernier_maitre_de_l_air: { label: "Avatar : le dernier maître de l’air", icon: "🎬", questions: [...avatarLeDernierMaitreDeLAir] },
  bob_l_eponge: { label: "Bob l’éponge", icon: "🎬", questions: [...bobLEponge] },
  shrek: { label: "Shrek", icon: "🎬", questions: [...shrek] },
  jurassic_park: { label: "Jurassic Park", icon: "🎬", questions: [...jurassicPark] },
  indiana_jones: { label: "Indiana Jones", icon: "🎬", questions: [...indianaJones] },
  le_seigneur_des_anneaux: { label: "Le Seigneur des anneaux", icon: "🎬", questions: [...leSeigneurDesAnneaux] },
  mission_impossible: { label: "Mission: Impossible", icon: "🎬", questions: [...missionImpossible] },
  gta_v: { label: "GTA V", icon: "🎮", questions: [...gtaV] },
  gta_san_andreas: { label: "GTA: San Andreas", icon: "🎮", questions: [...gtaSanAndreas] },
  red_dead_redemption: { label: "Red Dead Redemption", icon: "🎮", questions: [...redDeadRedemption] },
  god_of_war: { label: "God of War", icon: "🎮", questions: [...godOfWar] },
  resident_evil: { label: "Resident Evil", icon: "🎮", questions: [...residentEvil] },
  final_fantasy: { label: "Final Fantasy", icon: "🎮", questions: [...finalFantasy] },
  brawl_stars: { label: "Brawl Stars", icon: "🎮", questions: [...brawlStars] },
  clash_royale: { label: "Clash Royale", icon: "🎮", questions: [...clashRoyale] },
  rocket_league: { label: "Rocket League", icon: "🎮", questions: [...rocketLeague] },
  playstation: { label: "PlayStation", icon: "🎮", questions: [...playstation] },
  nintendo: { label: "Nintendo", icon: "🎮", questions: [...nintendo] },
  xbox: { label: "Xbox", icon: "🎮", questions: [...xbox] },
  super_smash_bros: { label: "Super Smash Bros.", icon: "🎮", questions: [...superSmashBros] },
  mario_kart: { label: "Mario Kart", icon: "🎮", questions: [...marioKart] },
  cyberpunk_2077: { label: "Cyberpunk 2077", icon: "🎮", questions: [...cyberpunk_2077] },
  the_last_of_us_jeux: { label: "The Last of Us (jeux)", icon: "🎮", questions: [...theLastOfUsJeux] },
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
  automobile: { label: "Automobile", icon: "✨", questions: [...automobile] },
  logos_grandes_marques: { label: "Logos et grandes marques", icon: "✨", questions: [...logosGrandesMarques] },
  sneakers: { label: "Sneakers", icon: "✨", questions: [...sneakers] },
  marques_de_luxe: { label: "Marques de luxe", icon: "✨", questions: [...marquesDeLuxe] },
  smartphones: { label: "Smartphones", icon: "✨", questions: [...smartphones] },
  technologie_grand_public: { label: "Technologie grand public", icon: "✨", questions: [...technologieGrandPublic] },
  fast_food: { label: "Fast-food", icon: "✨", questions: [...fastFood] },
  annees_2000: { label: "Années 2000", icon: "✨", questions: [...annees_2000] },
  internet_reseaux_sociaux: { label: "Internet et réseaux sociaux", icon: "✨", questions: [...internetReseauxSociaux] },
  monuments_de_france: { label: "Monuments de France", icon: "✨", questions: [...monumentsDeFrance] },
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
    cat.questions.forEach((question, index) => {
      pool.push({
        ...question,
        category: cat.label,
        icon: cat.icon,
        _categoryKey: key,
        _difficultyScore: difficultyScore(question, index, total),
      });
    });
  }
  return pool;
}

function selectProgressiveQuestions(items, count, random = Math.random) {
  const available = items.slice();
  const selected = [];
  const usedQuestions = new Set();
  const usedAnswers = new Set();

  for (let round = 0; round < Math.min(count, available.length); round++) {
    const difficulty = difficultyForRound(round, count);
    const [min, max] = DIFFICULTY_BANDS[difficulty];
    const unused = available.filter((q) => !usedQuestions.has(questionKey(q)));
    let candidates = unused.filter((q) => q._difficultyScore >= min && q._difficultyScore <= max);

    // Prefer questions whose expert level was checked editorially over the
    // positional estimate when an expert round can offer one.
    if (difficulty === 'expert') {
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
      candidates = unused
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
    usedAnswers.add(answerKey(chosen));
  }

  return selected.map(({ _categoryKey, _difficultyScore, ...question }, id) => ({ ...question, id }));
}

// Return a progressive sequence: two approachable openers, two intermediate
// rounds, one difficult round and an expert bonus for the standard six-round
// match.
function getQuestions(count, categoryKey, random = Math.random) {
  return selectProgressiveQuestions(categoryPool(categoryKey), count, random);
}

// Curated French content is authoritative now that every category contains at
// least 50 reviewed local questions. OpenTDB remains an emergency fallback for
// an unexpectedly undersized bank, but it no longer overrides the difficulty
// curve or injects random English questions into normal matches.
async function getMixedQuestions(count, categoryKey) {
  const localPool = categoryPool(categoryKey)
    .filter((q) => !reports.isQuarantined(questionKey(q)));
  const questions = selectProgressiveQuestions(localPool, count);

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

  return questions.slice(0, count).map((question, id) => ({ ...question, id }));
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


