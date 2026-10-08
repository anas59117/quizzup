/**
 * TournamentPage — Mode tournoi autonome (4 joueurs, bracket)
 * Gère tout en interne : lobby → matchs → résultat
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from './i18n';
import SFX from './sounds';

const BOT_NAMES = ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Fox'];
const BOT_AVATARS = ['🤖', '👾', '🎮', '🕹️', '👽', '🤡'];

function randomBot(exclude = []) {
  const available = BOT_NAMES.filter((_, i) => !exclude.includes(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  const nameIdx = BOT_NAMES.indexOf(idx);
  return { name: BOT_NAMES[nameIdx], avatar: BOT_AVATARS[nameIdx], id: `bot-${nameIdx}` };
}

const QUESTION_POOLS = {
  football: [
    { q: 'Who won the 2022 World Cup?', a: ['France', 'Argentina', 'Brazil', 'Germany'], correct: 1 },
    { q: 'Which club has the most UCL titles?', a: ['Barcelona', 'Bayern', 'Real Madrid', 'Liverpool'], correct: 2 },
    { q: 'Who is the all-time UCL top scorer?', a: ['Messi', 'Ronaldo', 'Lewandowski', 'Benzema'], correct: 1 },
    { q: 'Which country hosted the 2010 World Cup?', a: ['Germany', 'Brazil', 'South Africa', 'Russia'], correct: 2 },
    { q: 'Who is known as "El Pibe de Oro"?', a: ['Maradona', 'Messi', 'Pelé', 'Cruyff'], correct: 0 },
  ],
  rap: [
    { q: 'Which French rapper released "Lithopédion"?', a: ['Booba', 'Damso', 'Nekfeu', 'PNL'], correct: 1 },
    { q: 'Who is the "king of the south" in US rap?', a: ['Lil Wayne', 'T.I.', 'Jeezy', 'Gucci Mane'], correct: 1 },
    { q: 'Which group released "Dans la légende"?', a: ['1995', 'PNL', 'Sexion d\'Assaut', 'Migos'], correct: 1 },
  ],
  general: [
    { q: 'What is the capital of Japan?', a: ['Beijing', 'Seoul', 'Tokyo', 'Bangkok'], correct: 2 },
    { q: 'Who painted the Mona Lisa?', a: ['Van Gogh', 'Picasso', 'Da Vinci', 'Michelangelo'], correct: 2 },
    { q: 'What is the largest planet?', a: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correct: 2 },
    { q: 'In which year did WW2 end?', a: ['1943', '1945', '1950', '1939'], correct: 1 },
    { q: 'What is the chemical symbol for gold?', a: ['Au', 'Ag', 'Fe', 'Pb'], correct: 0 },
  ],
};

function getQuestions(topicKey) {
  const pool = QUESTION_POOLS[topicKey] || QUESTION_POOLS.general;
  return pool.sort(() => Math.random() - 0.5);
}

export default function TournamentPage({ topic, myName, myAvatar, onHome }) {
  const { t } = useI18n();
  const [view, setView] = useState('lobby'); // lobby | match | result
  const [bots, setBots] = useState([]);
  const [round, setRound] = useState(0);
  const [results, setResults] = useState([]);
  const [myScore, setMyScore] = useState(0);
  const [botScore, setBotScore] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [timer, setTimer] = useState(10);
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const b = [];
    const used = [];
    for (let i = 0; i < 3; i++) {
      const bot = randomBot(used);
      used.push(BOT_NAMES.indexOf(bot.name));
      b.push(bot);
    }
    setBots(b);
    setQuestions(getQuestions(topic?.key || 'general'));
    SFX.select();
  }, [topic]);

  // Timer
  useEffect(() => {
    if (view !== 'match' || revealed || selected !== null) return;
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          handleAnswer(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, revealed, selected, currentQ]);

  const [tournamentResult, setTournamentResult] = useState(null);

  const handleAnswer = useCallback((idx) => {
    if (selected !== null || revealed || view !== 'match') return;
    setSelected(idx);
    const q = questions[currentQ];
    if (!q) return;

    const isCorrect = idx === q.correct;
    const points = isCorrect ? Math.ceil(timer * 1.5) + 5 : 0;
    const botPts = Math.floor(Math.random() * 12) + 3;

    setMyScore((s) => s + points);
    setBotScore((s) => s + botPts);
    setRevealed(true);
    if (isCorrect) SFX.correct(); else SFX.wrong();

    setTimeout(() => {
      if (currentQ + 1 < 3) {
        setCurrentQ((q) => q + 1);
        setSelected(null);
        setRevealed(false);
        setTimer(10);
      } else {
        const won = (myScore + points) > (botScore + botPts);
        const newRes = [...results, { won, myScore: myScore + points, botScore: botScore + botPts }];
        setResults(newRes);
        const totalWins = newRes.filter(r => r.won).length;

        if (round >= 2 || !won) {
          // End tournament
          const finalWon = totalWins === 3;
          const ranking = [
            { id: 'you', name: myName, avatar: myAvatar, score: myScore + points, isYou: true },
            ...bots.map((b, i) => ({
              id: b.id, name: b.name, avatar: b.avatar,
              score: i <= round ? (i === round ? botScore + botPts : newRes[i].botScore) : 0
            })),
          ].sort((a, b) => b.score - a.score);
          setTournamentResult({ won: finalWon, ranking, coins: finalWon ? 500 : totalWins * 100, xp: finalWon ? 200 : totalWins * 50 });
          setView('result');
          if (finalWon) SFX.victory(); else SFX.defeat();
        } else {
          // Next round
          setResults(newRes);
          setRound((r) => r + 1);
          setCurrentQ(0);
          setSelected(null);
          setRevealed(false);
          setTimer(10);
          setMyScore(0);
          setBotScore(0);
          setQuestions(getQuestions(topic?.key || 'general'));
        }
      }
    }, 1200);
  }, [selected, revealed, view, currentQ, timer, questions, myScore, botScore, results, round, bots, myName, myAvatar, topic]);


  const pct = (timer / 10) * 100;
  const roundNames = [t('roundQuarter'), t('roundSemi'), t('roundFinal')];
  const currentQuestion = questions[currentQ];

  if (view === 'lobby') {
    return (
      <div className="container center">
        <div className="tournament-lobby">
          <h2 className="tournament-title">🏆 {t('tournamentTitle')}</h2>
          <p className="tournament-sub">{topic?.label || t('tournamentSub')}</p>
          <div className="bracket-preview">
            <div className="bracket-round">
              <div className="bracket-match">
                <div className="bracket-player you">{myAvatar} {myName || t('you')}</div>
                <div className="bracket-vs">VS</div>
                <div className="bracket-player">{bots[0]?.avatar} {bots[0]?.name}</div>
              </div>
            </div>
            <div className="bracket-connector" />
            <div className="bracket-round">
              <div className="bracket-match dim">
                <div className="bracket-player">{bots[1]?.avatar} {bots[1]?.name}</div>
                <div className="bracket-vs">VS</div>
                <div className="bracket-player">{bots[2]?.avatar} {bots[2]?.name}</div>
              </div>
            </div>
          </div>
          <div className="tournament-prizes">
            <div className="tprize">🥇 <span>+500 {t('coins')}</span></div>
            <div className="tprize">🥈 <span>+200 {t('coins')}</span></div>
          </div>
          <button className="onb-btn primary large" onClick={() => { SFX.select(); setView('match'); }}>
            {t('startTournament')}
          </button>
          <button className="onb-btn ghost" onClick={onHome}>{t('back')}</button>
        </div>
      </div>
    );
  }

  if (view === 'match' && currentQuestion) {
    return (
      <div className="container game">
        <div className="tournament-hud">
          <div className="tournament-round-badge">{roundNames[round]}</div>
          <div className="tournament-scores">
            <span className="tscore you">{myScore}</span>
            <span className="tvs">VS</span>
            <span className="tscore">{botScore}</span>
          </div>
          <div className="tournament-progress">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={`tq-dot ${i === currentQ ? 'active' : i < currentQ ? 'done' : ''}`} />
            ))}
          </div>
        </div>
        <div className="question-panel">
          <div className="question">{currentQuestion.q}</div>
          <div className="answers single-col">
            {currentQuestion.a.map((ans, idx) => (
              <button
                key={idx}
                className={`answer ${
                  revealed
                    ? idx === currentQuestion.correct
                      ? 'correct'
                      : idx === selected
                        ? 'wrong'
                        : 'dim'
                    : idx === selected
                      ? 'selected'
                      : ''
                }`}
                onClick={() => handleAnswer(idx)}
                disabled={revealed || selected !== null}
              >
                {ans}
              </button>
            ))}
          </div>
          <div className="timer-bar-bottom">
            <div className="timer-bar-fill" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
    );
  }

  if (view === 'result' && tournamentResult) {
    const medals = ['🥇', '🥈', '🥉', '4️⃣'];
    return (
      <div className="container center">
        <div className="tournament-result">
          <h2 className={`result-title ${tournamentResult.won ? 'win' : 'loss'}`}>
            {tournamentResult.won ? '🏆 ' + t('tournamentWon') : t('tournamentLost')}
          </h2>
          {tournamentResult.won && <div className="confetti-overlay">{'🎉'.repeat(20)}</div>}
          <div className="tournament-podium">
            {tournamentResult.ranking.map((player, i) => (
              <div key={player.id} className={`podium-place place-${i + 1} ${player.isYou ? 'you' : ''}`}>
                <div className="podium-medal">{medals[i]}</div>
                <div className="podium-avatar">{player.avatar}</div>
                <div className="podium-name">{player.name}</div>
                <div className="podium-score">{player.score} pts</div>
              </div>
            ))}
          </div>
          <div className="tournament-rewards">
            <div className="treward"><span>💰</span><span>+{tournamentResult.coins} {t('coins')}</span></div>
            <div className="treward"><span>✨</span><span>+{tournamentResult.xp} XP</span></div>
          </div>
          <button className="onb-btn primary large" onClick={() => {
            setView('lobby'); setRound(0); setResults([]); setMyScore(0); setBotScore(0);
            setCurrentQ(0); setSelected(null); setRevealed(false); setTimer(10);
            setQuestions(getQuestions(topic?.key || 'general'));
          }}>
            {t('playAgain')}
          </button>
          <button className="onb-btn secondary" onClick={onHome}>{t('backHome')}</button>
        </div>
      </div>
    );
  }

  return null;
}
