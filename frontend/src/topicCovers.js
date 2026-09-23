const commonsFile = (name) =>
  `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(name)}?width=960`;

const commonsPage = (name) =>
  `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(name)}`;

const cover = (file, focal = 'center 35%') => ({
  src: commonsFile(file),
  source: commonsPage(file),
  focal,
});

export const FAMILY_TOPIC_COVERS = {
  entertainment: cover('Debrie Parvo 35mm Movie Camera.jpg', 'center 48%'),
  music: cover('BBC Proms 31.jpg', 'center 46%'),
  sport: cover('4 sports photo.jpg', 'center 42%'),
  culture: cover('OrteliusWorldMap.jpeg', 'center 42%'),
  gaming: cover('ArcadeGames.jpg', 'center 45%'),
};

// Every entry is reviewed for immediate topic recognition at thumbnail size.
// Unreviewed categories intentionally keep their graphic tile instead of
// receiving a misleading generic family photograph.
export const TOPIC_COVERS = {
  movies: cover('Debrie Parvo 35mm Movie Camera.jpg', 'center 48%'),
  music: cover('BBC Proms 31.jpg', 'center 46%'),
  sports: cover('4 sports photo.jpg', 'center 42%'),
  geography: cover('OrteliusWorldMap.jpeg', 'center 42%'),
  gaming: cover('ArcadeGames.jpg', 'center 45%'),
  science: cover('Laboratory.jpg', 'center 38%'),
  rap_fr: cover("IAM à l'Olympia de Montréal.jpg", 'center 30%'),
  foot_fr: cover('Kylian Mbappe - France v Norway - 26 June 2026 (cropped).jpg', 'center 24%'),
  cinema_fr: cover('Famous French Actors.jpg', 'center 32%'),
  culture_fr: cover('Mont Saint-Michel France.jpg', 'center 42%'),
  premier_league: cover('Interior of Hill Dickinson Stadium.jpg', 'center 42%'),
  la_liga: cover('Lamine Yamal France v Spain 7.24.26-187.jpg', 'center 24%'),
  ligue_1: cover('PSG - Lille Ligue 1.jpg', 'center 42%'),
  netflix: cover('100 Winchester Circle.jpg', 'center 42%'),
  seconde_guerre_mondiale: cover('WW2Montage.PNG', 'center 42%'),
  fortnite: cover('Fortnite cosplay at E3 2018.jpg', 'center 25%'),
  lionel_messi: cover('Lionel Messi WC2022.jpg', 'center 22%'),
  bandes_originales_de_films: cover('Prague recording session, June 2004.jpg', 'center 42%'),
  culture_manga: cover('Japan Bookstore.jpg', 'center 42%'),
  films_pixar: cover('Pixaranimationstudios.jpg', 'center 42%'),
  mythologie_grecque: cover('Zeus Otricoli Pio-Clementino Inv257.jpg', 'center 25%'),
  mythologie_egyptienne: cover('Egypt Abou Simbel3.jpg', 'center 42%'),
  films_musicaux: cover('Gentlemen Prefer Blondes Movie Trailer Screenshot (34).jpg', 'center 25%'),
  legendes_de_l_esport: cover('Caps 2025.jpg', 'center 24%'),
  cyclisme_stars: cover('Vélo de route.jpg', 'center 42%'),
  got: cover('Iron Throne Moscow Metro (2019-05-11) 01 (cropped).jpg', 'center 38%'),
  harry_potter: cover('Wizarding World of Harry Potter Castle.jpg', 'center 44%'),
  marvel: cover('Cosplay of Tony Stark, Captain America and Iron Man at LBCC 2013 (edited homogeneous background).jpg', 'center 28%'),
  star_wars: cover('NYCC 2023 Cosplay of Darth Vader.jpg', 'center 24%'),
  disney: cover('SleepingBeautyCastle.JPG', 'center 42%'),
  pokemon: cover('Pikachu Parade (14905092432).jpg', 'center 34%'),
  f1: cover('Lewis Hamilton during Hungarian Formula 1 GP.jpg', 'center 24%'),
  nba: cover('LeBron James (31944491583).jpg', 'center 28%'),
  tv_shows: cover('Central Perk set.jpg', 'center 46%'),
  histoire_fr: cover('Eugène Delacroix - La liberté guidant le peuple - après restauration 2024.jpg', 'center 36%'),
  retro_games: cover('NES-Console-Set.jpg', 'center 48%'),
  espace_astronomie: cover('Pillars of Creation.jpeg', 'center 42%'),
  corps_humain: cover('Human Anatomy (NIH BioArt 519 - 657946).png', 'center 42%'),
  ligue_champions: cover('Champions League Trophy (52736201132).jpg', 'center 38%'),
  coupe_du_monde_histoire: cover('Kylian Mbappé World Cup Trophy.jpg', 'center 25%'),
  tour_de_france: cover('UAE Team, Tadej Pogačar - Yellow jersey peloton with crowd in Peyresourdes during stage 14 of Tour de France 2025 (cropped).jpg', 'center 30%'),
  jo_ete_histoire: cover('Olympic rings on the Eiffel Tower 2024 (11).jpg', 'center 43%'),
  can_foot_africain: cover('Trophée CAN (1).jpg', 'center 38%'),
  copa_america: cover('Copa america trofeo.jpg', 'center 38%'),
  legendes_foot_allemand_anglais_italien: cover('Cristiano Ronaldo 2018 (4x5 cropped).jpg', 'center 24%'),
  eredivisie: cover('Eredivisie Trophy.png', 'center 42%'),
  drapeaux: cover('Flag Map of The World (2026).png', 'center 45%'),
  liga_portugal: cover('The 2016-17 Primeira Liga Trophy.jpg', 'center 42%'),
  mls: cover('Lionel Messi NE Revolution Inter Miami 7.9.25-165.jpg', 'center 24%'),
  tennis_atp: cover('Carlos Alcaraz Argentina Open 2024.jpg', 'center 24%'),
  tennis_wta: cover('Iga Swiatek 2023 (cropped).jpg', 'center 24%'),
  roland_garros: cover('Rafael Nadal Roland Garros.jpg', 'center 26%'),
  wimbledon: cover('Wimbledon Centre Court (52205402762).jpg', 'center 42%'),
  rugby_top_14: cover('ST vs RCT 2012 12 Thierry Dusautoir 2.jpg', 'center 28%'),
  mma_ufc: cover('Conor McGregor 2015.jpg', 'center 24%'),
  legendes_du_cyclisme: cover('Eddy Merckx-1973.jpg', 'center 26%'),
  natation_olympique: cover('Michael Phelps conquista 20ª medalha de ouro e é ovacionado 1036417-09082016- mg 6661 01.jpg', 'center 28%'),
  jo_d_hiver_histoire: cover('Cortina d’Ampezzo Olympic Rings 2025 - XXV Giochi olimpici invernali.jpg', 'center 42%'),
  volleyball: cover('Brasil vence a França no vôlei masculino 1037983-15.08.2016 ffz-5559.jpg', 'center 30%'),
  ski_alpin: cover('Lindsey Vonn in Courchevel, 20 december 2015 09.JPG', 'center 25%'),
  sports_d_hiver: cover('Martin Fourcade au tir lors des Jeux Mondiaux Militaires 2013.JPG', 'center 30%'),
  golf: cover('Tiger Woods 20180927.jpg', 'center 25%'),
  nhl: cover('Wgretz edit2.jpg', 'center 25%'),
  baseball_mlb: cover('Shohei Ohtani on April 23, 2024 (2) 53677192000.jpg', 'center 24%'),
  motogp: cover('Valentino Rossi (15131915515).jpg', 'center 25%'),
  rallye_wrc: cover('Sébastien Loeb - 2007 Rally Portugal.jpg', 'center 34%'),
  paris_saint_germain: cover('PSG champion 2015.jpg', 'center 35%'),
  real_madrid: cover('Real Madrid celebration after winning the 2018 UEFA Champions League Final DSC 0459 (40596061330).jpg', 'center 34%'),
  cristiano_ronaldo: cover('2019-20 Serie A - Torino v Juventus - Cristiano Ronaldo (cropped).jpg', 'center 23%'),
  minecraft: cover('Gamescom 2025 Minecraft.jpg', 'center 38%'),
  gta: cover('Grand-Theft-Auto.png', 'center 45%'),
  league_of_legends: cover('Faker at Worlds 2024.jpg', 'center 24%'),
  valorant: cover('Valorant Champions Tour logo.png', 'center 50%'),
  roblox: cover('Roblox Logo.svg', 'center 50%'),
  call_of_duty: cover('Captain Price cosplay.jpg', 'center 24%'),
};

export function getTopicCover(category) {
  // Existing covers were already selected for the exact quiz and validated
  // in production. A new editorial candidate must never silently replace
  // an obvious subject such as Booba, Nadal or a league-specific montage.
  if (category.cover) {
    return {
      src: category.cover,
      source: null,
      focal: category.coverFocal || 'center 25%',
    };
  }

  if (TOPIC_COVERS[category.key]) return TOPIC_COVERS[category.key];

  // Never pretend a generic family photo represents a specific quiz.
  // Uncurated topics keep their original graphic tile until a reviewed,
  // category-specific image is available.
  return null;
}
