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

  // 1) API first — huge pool, maximum variety.
  if (categoryKey && CATEGORIES[categoryKey] && trivia.isSupported(categoryKey)) {
    const cat = CATEGORIES[categoryKey];
    for (const q of trivia.takeFromCache(count, categoryKey, cat.label, cat.icon)) {
      if (questions.length >= count) break;
      if (!seen.has(q.text)) {
        questions.push(q);
        seen.add(q.text);
      }
    }
  }

  // 2) Fill the rest from the verified local bank (also the offline fallback).
  if (questions.length < count) {
    for (const q of getQuestions(count, categoryKey)) {
      if (questions.length >= count) break;
      if (!seen.has(q.text)) {
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
