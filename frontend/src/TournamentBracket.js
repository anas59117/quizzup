/**
 * TournamentBracket — Mode tournoi 4 joueurs (bracket élimination)
 * Solo contre 3 bots, 3 rounds : quart → demi → finale
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

export function TournamentLobby({ topic, onStart, onBack }) {
  const { t } = useI18n();
  const [bots, setBots] = useState([]);

  useEffect(() => {
    const b = [];
    const used = [];
    for (let i = 0; i < 3; i++) {
      const bot = randomBot(used);
      used.push(BOT_NAMES.indexOf(bot.name));
      b.push(bot);
    }
    setBots(b);
    SFX.select();
  }, []);

  return (
    <div className="container center">
      <div className="tournament-lobby">
        <h2 className="tournament-title">🏆 {t('tournamentTitle')}</h2>
        <p className="tournament-sub">{topic ? topicLabel(topic) : t('tournamentSub')}</p>

        <div className="bracket-preview">
          <div className="bracket-round">
            <div className="bracket-match">
              <div className="bracket-player you">👤 {t('you')}</div>
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

        <button className="onb-btn primary large" onClick={() => onStart(bots)}>
          {t('startTournament')}
        </button>
        <button className="onb-btn ghost" onClick={onBack}>{t('back')}</button>
      </div>
    </div>
  );
}

export function TournamentMatch({ topic, round, opponent, onResult, playerScore = 0 }) {
  const { t } = useI18n();
  const [timer, setTimer] = useState(10);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [myScore, setMyScore] = useState(playerScore);
  const [botScore, setBotScore] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [question, setQuestion] = useState(generateQuestion(topic));

  const totalQuestions = 3;
  const roundNames = [t('roundQuarter'), t('roundSemi'), t('roundFinal')];

  useEffect(() => {
    if (revealed || selected !== null) return;
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
  }, [revealed, selected, currentQ]);

  function generateQuestion(topicKey) {
    const questions = {
      'football': [
        { q: 'Who won the 2022 World Cup?', a: ['France', 'Argentina', 'Brazil', 'Germany'], correct: 1 },
        { q: 'Which club has the most UCL titles?', a: ['Barcelona', 'Bayern', 'Real Madrid', 'Liverpool'], correct: 2 },
        { q: 'Who is the all-time UCL top scorer?', a: ['Messi', 'Ronaldo', 'Lewandowski', 'Benzema'], correct: 1 },
      ],
      'rap': [
        { q: 'Which French rapper released "Damso"?', a: ['Booba', 'Damso', 'Nekfeu', 'PNL'], correct: 1 },
        { q: 'Who is the "king of the south"?', a: ['Lil Wayne', 'T.I.', 'Jeezy', 'Gucci Mane'], correct: 1 },
      ],
    };
    const pool = questions[topicKey] || questions['football'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const handleAnswer = useCallback((idx) => {
    if (selected !== null || revealed) return;
    setSelected(idx);

    const isCorrect = idx === question.correct;
    const points = isCorrect ? Math.ceil(timer * 1.5) + 5 : 0;
    const botPoints = Math.floor(Math.random() * 15) + 5;

    setMyScore((s) => s + points);
    setBotScore((s) => s + botPoints);
    setRevealed(true);

    if (isCorrect) SFX.correct(); else SFX.wrong();

    setTimeout(() => {
      if (currentQ + 1 < totalQuestions) {
        setCurrentQ((q) => q + 1);
        setQuestion(generateQuestion(topic));
        setSelected(null);
        setRevealed(false);
        setTimer(10);
      } else {
        onResult(myScore + points, botScore + botPoints);
      }
    }, 1500);
  }, [selected, revealed, question, timer, currentQ, myScore, botScore, topic, onResult]);

  const pct = (timer / 10) * 100;

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
          {Array.from({ length: totalQuestions }).map((_, i) => (
            <div key={i} className={`tq-dot ${i === currentQ ? 'active' : i < currentQ ? 'done' : ''}`} />
          ))}
        </div>
      </div>

      <div className="question-panel">
        <div className="question">{question.q}</div>
        <div className="answers single-col">
          {question.a.map((ans, idx) => (
            <button
              key={idx}
              className={`answer ${
                revealed
                  ? idx === question.correct
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

export function TournamentResult({ results, topic, onHome, onReplay }) {
  const { t } = useI18n();
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    const won = results.won;
    if (won) {
      SFX.victory();
      setShowConfetti(true);
    } else {
      SFX.defeat();
    }
  }, [results]);

  const medals = ['🥇', '🥈', '🥉', '4️⃣'];

  return (
    <div className="container center">
      <div className="tournament-result">
        <h2 className={`result-title ${results.won ? 'win' : 'loss'}`}>
          {results.won ? '🏆 ' + t('tournamentWon') : t('tournamentLost')}
        </h2>

        {showConfetti && <div className="confetti-overlay">{'🎉'.repeat(20)}</div>}

        <div className="tournament-podium">
          {results.ranking.map((player, i) => (
            <div key={player.id} className={`podium-place place-${i + 1} ${player.isYou ? 'you' : ''}`}>
              <div className="podium-medal">{medals[i]}</div>
              <div className="podium-avatar">{player.avatar}</div>
              <div className="podium-name">{player.name}</div>
              <div className="podium-score">{player.score} pts</div>
            </div>
          ))}
        </div>

        <div className="tournament-rewards">
          <div className="treward">
            <span>💰</span>
            <span>+{results.coins} {t('coins')}</span>
          </div>
          <div className="treward">
            <span>✨</span>
            <span>+{results.xp} XP</span>
          </div>
        </div>

        <button className="onb-btn primary large" onClick={onReplay}>
          {t('playAgain')}
        </button>
        <button className="onb-btn secondary" onClick={onHome}>
          {t('backHome')}
        </button>
      </div>
    </div>
  );
}
