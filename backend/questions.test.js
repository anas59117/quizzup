const test = require('node:test');
const assert = require('node:assert/strict');
const { CATEGORIES, getQuestions, shuffleQuestions, difficultyForRound, selectProgressiveQuestions } = require('./questions');

test('question shuffle does not mutate the source array', () => {
  const source = [1, 2, 3, 4];
  const original = source.slice();
  shuffleQuestions(source, () => 0);
  assert.deepEqual(source, original);
});

test('question shuffle follows Fisher-Yates swaps deterministically', () => {
  const values = [0, 0, 0];
  let i = 0;
  const result = shuffleQuestions([1, 2, 3, 4], () => values[i++]);
  assert.deepEqual(result, [2, 3, 4, 1]);
});


test('six-round matches follow the intended difficulty curve', () => {
  assert.deepEqual(
    Array.from({ length: 6 }, (_, index) => difficultyForRound(index, 6)),
    ['easy', 'easy', 'medium', 'medium', 'hard', 'expert']
  );
});

test('progressive selection keeps approachable questions first and expert question last', () => {
  const source = Array.from({ length: 20 }, (_, index) => ({
    text: `Question ${index}`,
    answers: [`Correct ${index}`, 'B', 'C', 'D'],
    correct: 0,
    _difficultyScore: index / 19,
  }));
  const selected = selectProgressiveQuestions(source, 6, () => 0);
  assert.deepEqual(selected.map((q) => q.difficulty), [
    'easy', 'easy', 'medium', 'medium', 'hard', 'expert',
  ]);
  assert.ok(selected[0].text === 'Question 0');
  assert.ok(selected[1].text.startsWith('Question '));
  assert.ok(Number(selected[1].text.split(' ')[1]) <= 6);
  assert.ok(Number(selected[4].text.split(' ')[1]) >= 12);
  assert.ok(Number(selected[5].text.split(' ')[1]) >= 16);
});

test('expert round prioritizes editorially tagged questions', () => {
  const source = [
    { text: 'easy 1', answers: ['A', 'B', 'C', 'D'], correct: 0, _difficultyScore: 0.1 },
    { text: 'easy 2', answers: ['B', 'A', 'C', 'D'], correct: 0, _difficultyScore: 0.2 },
    { text: 'medium 1', answers: ['C', 'A', 'B', 'D'], correct: 0, _difficultyScore: 0.45 },
    { text: 'medium 2', answers: ['D', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.55 },
    { text: 'hard', answers: ['E', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.75 },
    { text: 'position only', answers: ['F', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.95 },
    { text: 'reviewed expert', answers: ['G', 'A', 'B', 'C'], correct: 0, difficulty: 'expert', _difficultyScore: 0.95 },
  ];
  const selected = selectProgressiveQuestions(source, 6, () => 0);
  assert.equal(selected.length, 6);
  assert.equal(selected[5].text, 'reviewed expert');
  assert.equal(selected[5].difficulty, 'expert');
});

test('progressive selection avoids repeated correct answers when alternatives exist', () => {
  const source = [
    { text: 'A1', answers: ['A', 'B', 'C', 'D'], correct: 0, _difficultyScore: 0.1 },
    { text: 'A2', answers: ['A', 'E', 'F', 'G'], correct: 0, _difficultyScore: 0.2 },
    { text: 'B1', answers: ['B', 'A', 'C', 'D'], correct: 0, _difficultyScore: 0.3 },
    { text: 'C1', answers: ['C', 'A', 'B', 'D'], correct: 0, _difficultyScore: 0.5 },
    { text: 'D1', answers: ['D', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.7 },
    { text: 'E1', answers: ['E', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.85 },
    { text: 'F1', answers: ['F', 'A', 'B', 'C'], correct: 0, _difficultyScore: 0.95 },
  ];
  const selected = selectProgressiveQuestions(source, 6, () => 0);
  const correctAnswers = selected.map((q) => q.answers[q.correct]);
  assert.equal(new Set(correctAnswers).size, correctAnswers.length);
});


test('every quiz category produces a complete progressive six-round match', () => {
  const expected = ['easy', 'easy', 'medium', 'medium', 'hard', 'expert'];
  for (const key of Object.keys(CATEGORIES)) {
    const selected = getQuestions(6, key, () => 0);
    assert.equal(selected.length, 6, `${key} must provide six questions`);
    assert.deepEqual(
      selected.map((q) => q.difficulty),
      expected,
      `${key} must follow the global difficulty curve`
    );
    assert.equal(
      new Set(selected.map((q) => q.image || q.text)).size,
      6,
      `${key} must not repeat a question in one match`
    );
  }
});

test('expanded quizzes draw four or more angles from banks of at least 50 questions', async () => {
  const { getMixedQuestions } = require('./questions');
  const difficulties = ['easy', 'easy', 'medium', 'medium', 'hard', 'expert'];
  let seed = 0x717;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };

  const portraitKeys = [
    'bollywood', 'cinema_fr', 'premier_league', 'la_liga', 'bundesliga', 'serie_a',
    'actors', 'tennis', 'rugby', 'athletisme', 'science_stars', 'humour', 'mode', 'kpop',
    'series_ado_romance',
  ];
  const keys = [
    'movies', 'music', 'sports', 'gaming', 'science',
    'geography', 'histoire_fr', 'culture_fr', 'f1', 'retro_games',
    'got', 'tv_shows', ...portraitKeys,
  ];
  for (const key of keys) {
    const bank = CATEGORIES[key].questions;
    assert.ok(bank.length >= 50, key + ' has at least 50 questions');
    assert.equal(new Set(bank.map(question => question.fact)).size, bank.length, key + ' covers unique facts');
    assert.ok(bank.every(question => question.angle && question.fact && question.difficulty), key + ' classifies every question');

    const checkMatch = (questions) => {
      assert.deepEqual(questions.map(question => question.difficulty), difficulties);
      assert.ok(new Set(questions.map(question => question.angle)).size >= 4, key + ' covers four angles');
      if (portraitKeys.includes(key)) {
        assert.ok(questions.filter(question => question.image).length <= 2, key + ' draws at most two portraits');
      }
    };
    const seen = new Set();
    for (let i = 0; i < 100; i++) {
      const questions = getQuestions(6, key, random);
      checkMatch(questions);
      for (const question of questions) seen.add(question.fact);
    }
    assert.ok(seen.size >= 40, key + ' draws broadly from the expanded bank');
    checkMatch(await getMixedQuestions(6, key));
  }
});

test('audited banks skip repeated facts and limit dominant formats in six-question matches', () => {
  const formats = {
    revolutions_dans_le_monde: 'date',
    histoire_de_l_algerie: 'date',
    histoire_du_maroc: 'date',
    histoire_de_la_tunisie: 'date',
    grandes_explorations: 'date',
    moyen_age: 'date',
    etats_unis_culture_generale: 'date',
    kanye_west: 'album',
    travis_scott: 'album',
    dua_lipa: 'album',
    billie_eilish: 'album',
    legendes_de_l_esport: 'attribution',
    jeux_mobile_populaires: 'attribution',
  };
  const keys = Object.keys(CATEGORIES).filter(key => CATEGORIES[key].variety?.maxPerOpening);
  assert.ok(keys.length >= 39);
  for (const key of Object.keys(formats)) assert.ok(keys.includes(key), key);
  let seed = 0x272;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (const key of keys) {
    const finals = new Set();
    for (let i = 0; i < 200; i++) {
      const rounds = getQuestions(6, key, random);
      assert.equal(rounds.length, 6, key);
      assert.ok(rounds.every(question => question.fact), key + ' identifies facts');
      assert.equal(new Set(rounds.map(question => question.fact)).size, 6, key + ' keeps facts distinct');
      const limited = formats[key];
      if (limited) assert.ok(rounds.filter(question => question.format === limited).length <= 2, key + ' mixes formats');
      finals.add(rounds.at(-1).fact);
    }
    assert.ok(finals.size >= 4, key + ' varies the final question');
  }
});

test('answers are shuffled at serve time and the correct index follows the right answer', () => {
  const { shuffleAnswers } = require('./questions');
  const q = { text: 'Q', answers: ['A', 'B', 'C', 'D'], correct: 1 };
  const seen = new Set();
  for (let i = 0; i < 40; i++) {
    const s = shuffleAnswers(q);
    assert.equal(s.answers[s.correct], 'B');
    assert.deepEqual([...s.answers].sort(), ['A', 'B', 'C', 'D']);
    seen.add(s.correct);
  }
  assert.ok(seen.size > 1);
  assert.deepEqual(q.answers, ['A', 'B', 'C', 'D']);
  const fixed = { text: 'Q', answers: ['X', 'Y', 'Z', 'Toutes les réponses'], correct: 3 };
  assert.deepEqual(shuffleAnswers(fixed), fixed);
});

test('the two rebuilt quizzes deliver varied six-question matches through both draw paths', async () => {
  const { getMixedQuestions } = require('./questions');
  const formats = { ligue_1: 'portrait', premiere_guerre_mondiale: 'date' };
  let seed = 0x1eaf;
  const random = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
  for (const [key, limitedFormat] of Object.entries(formats)) {
    const assertVariety = (rounds) => {
      assert.deepEqual(rounds.map(q => q.difficulty), ['easy', 'easy', 'medium', 'medium', 'hard', 'expert']);
      assert.ok(rounds.every(q => q.angle), key + ' assigns an editorial angle to every question');
      assert.ok(new Set(rounds.map(q => q.angle)).size >= 4, key + ' includes at least four angles');
      assert.ok(rounds.filter(q => (q.image ? 'portrait' : q.format) === limitedFormat).length <= 2, key + ' respects its format limit');
      assert.equal(new Set(rounds.map(q => q.fact || q.image || q.text)).size, 6, key + ' does not repeat a fact');
    };
    const seenLimitedFormat = new Set();
    for (let i = 0; i < 500; i++) {
      const match = getQuestions(6, key, random);
      assertVariety(match);
      for (const q of match) if ((q.image ? 'portrait' : q.format) === limitedFormat) seenLimitedFormat.add(q.image || q.text);
    }
    assert.ok(seenLimitedFormat.size >= 5, key + ' still draws a variety of questions in the limited format');
    for (let i = 0; i < 30; i++) assertVariety(await getMixedQuestions(6, key));
  }
});
