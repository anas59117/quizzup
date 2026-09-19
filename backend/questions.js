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
    questions: [...playersLigue1],
  },
  bollywood: {
    label: 'Bollywood',
    icon: '🇮🇳',
    questions: [...playersBollywood],
  },
  actors_az: {
    label: 'Acteurs (A-L)',
    icon: '⭐',
    questions: [...playersActorsAZ],
  },
  actors_mz: {
    label: 'Acteurs (M-Z)',
    icon: '🌟',
    questions: [...playersActorsMZ],
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
// rate-limited, or blocked. De-duplicates by `questionKey` (see below).
// Always resolves to `count` questions with stable per-match ids. Never
// rejects.
//
// Photo questions (guess-the-player) all share the same generic prompt text
// ("Qui est ce joueur ?"), so keying dedup on `text` alone would treat every
// one of them as a duplicate of the first and cap a match at 1 real question.
// `image` is unique per photo question, so it's used as the key when present.
const questionKey = (q) => q.image || q.text;

async function getMixedQuestions(count, categoryKey) {
  const questions = [];
  const seen = new Set();

  const accept = (q) => !seen.has(questionKey(q)) && !reports.isQuarantined(questionKey(q));

  // 1) API first — huge pool, maximum variety. Pull extra to absorb any
  //    quarantined/duplicate questions we skip.
  if (categoryKey && CATEGORIES[categoryKey] && trivia.isSupported(categoryKey)) {
    const cat = CATEGORIES[categoryKey];
    for (const q of trivia.takeFromCache(count * 2, categoryKey, cat.label, cat.icon)) {
      if (questions.length >= count) break;
      if (accept(q)) {
        questions.push(q);
        seen.add(questionKey(q));
      }
    }
  }

  // 2) Fill the rest from the verified local bank (also the offline fallback).
  if (questions.length < count) {
    for (const q of getQuestions(count, categoryKey)) {
      if (questions.length >= count) break;
      if (accept(q)) {
        questions.push(q);
        seen.add(questionKey(q));
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

module.exports = { CATEGORIES, getQuestions, getMixedQuestions, warmCache, listCategories, questionKey };
