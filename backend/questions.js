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
    label: 'Geography',
    icon: '🌍',
    questions: [
      { text: 'What is the capital of France?', answers: ['Paris', 'Lyon', 'Marseille', 'Nice'], correct: 0 },
      { text: 'Which is the largest ocean on Earth?', answers: ['Atlantic', 'Pacific', 'Indian', 'Arctic'], correct: 1 },
      { text: 'Mount Everest is located in which mountain range?', answers: ['Andes', 'Alps', 'Himalayas', 'Rockies'], correct: 2 },
      { text: 'Which country has the most people?', answers: ['China', 'USA', 'Indonesia', 'India'], correct: 3 },
      { text: 'What is the capital of Australia?', answers: ['Canberra', 'Sydney', 'Melbourne', 'Perth'], correct: 0 },
      { text: 'Which desert is the largest hot desert?', answers: ['Gobi', 'Sahara', 'Kalahari', 'Mojave'], correct: 1 },
      { text: 'What is the capital of Japan?', answers: ['Osaka', 'Kyoto', 'Tokyo', 'Nagoya'], correct: 2 },
      { text: 'On which continent is the Amazon rainforest?', answers: ['Africa', 'Asia', 'Australia', 'South America'], correct: 3 },
      { text: 'Which country is both in Europe and Asia?', answers: ['Turkey', 'Greece', 'Egypt', 'Italy'], correct: 0 },
      { text: 'What is the smallest country in the world?', answers: ['Monaco', 'Vatican City', 'San Marino', 'Liechtenstein'], correct: 1 },
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
};

// Return `count` questions from a category (or mixed if no category), each
// tagged with its category label + icon and a stable per-match id.
function getQuestions(count, categoryKey) {
  let pool = [];
  if (categoryKey && CATEGORIES[categoryKey]) {
    const cat = CATEGORIES[categoryKey];
    pool = cat.questions.map((q) => ({ ...q, category: cat.label, icon: cat.icon }));
  } else {
    for (const key of Object.keys(CATEGORIES)) {
      const cat = CATEGORIES[key];
      pool.push(...cat.questions.map((q) => ({ ...q, category: cat.label, icon: cat.icon })));
    }
  }
  const shuffled = pool.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, pool.length)).map((q, i) => ({ ...q, id: i }));
}

// Preferred entry point. Maximizes VOLUME/variety: the Open Trivia DB cache
// (~4000 questions) is used first, and the 60 verified local questions top up
// the remainder — and act as the safety net when the API is unavailable,
// rate-limited, or blocked. De-duplicates by text. Always resolves to `count`
// questions with stable per-match ids. Never rejects.
async function getMixedQuestions(count, categoryKey) {
  const questions = [];
  const seen = new Set();

  const accept = (q) => !seen.has(q.text) && !reports.isQuarantined(q.text);

  // 1) API first — huge pool, maximum variety. Pull extra to absorb any
  //    quarantined/duplicate questions we skip.
  if (categoryKey && CATEGORIES[categoryKey] && trivia.isSupported(categoryKey)) {
    const cat = CATEGORIES[categoryKey];
    for (const q of trivia.takeFromCache(count * 2, categoryKey, cat.label, cat.icon)) {
      if (questions.length >= count) break;
      if (accept(q)) {
        questions.push(q);
        seen.add(q.text);
      }
    }
  }

  // 2) Fill the rest from the verified local bank (also the offline fallback).
  if (questions.length < count) {
    for (const q of getQuestions(count, categoryKey)) {
      if (questions.length >= count) break;
      if (accept(q)) {
        questions.push(q);
        seen.add(q.text);
      }
    }
  }

  return questions
    .sort(() => 0.5 - Math.random())
    .slice(0, count)
    .map((q, i) => ({ ...q, id: i }));
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

module.exports = { CATEGORIES, getQuestions, getMixedQuestions, warmCache, listCategories };
