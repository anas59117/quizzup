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

// The first editorial pass focuses on the categories surfaced on Home and the
// most recognisable flagship quizzes. Remaining categories deliberately use a
// family photograph until their own reviewed cover is added: every tile gets
// a real image without relying on random-photo services.
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
};

export function getTopicCover(category) {
  return TOPIC_COVERS[category.key] || FAMILY_TOPIC_COVERS[category.family];
}
