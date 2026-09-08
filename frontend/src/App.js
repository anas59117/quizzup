import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const AVATARS = ['🐺', '🦁', '🦊', '🐼', '🦉', '🐸', '🐯', '🦄'];

const CATEGORIES = [
  { key: 'movies', label: 'Movies', icon: '🎬', cls: 'c1', tag: '🔥 Hot' },
  { key: 'music', label: 'Music', icon: '🎵', cls: 'c2' },
  { key: 'sports', label: 'Sports', icon: '⚽', cls: 'c3' },
  { key: 'geography', label: 'Geography', icon: '🌍', cls: 'c4' },
  { key: 'gaming', label: 'Gaming', icon: '🎮', cls: 'c2' },
  { key: 'science', label: 'Science', icon: '🧬', cls: 'c1', tag: '✨ New' },
];

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('quizzup-theme') || 'dark';
    } catch {
      return 'dark';
    }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem('quizzup-theme', theme);
    } catch {
      /* storage may be unavailable (private mode) — ignore */
    }
  }, [theme]);
  const toggle = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  return [theme, toggle];
}

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [stage, setStage] = useState('join'); // join | categories | waiting | playing | finished
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [category, setCategory] = useState(null);
  const [opponent, setOpponent] = useState({ name: '', avatar: '🦁' });
  const [intro, setIntro] = useState(null); // round_intro payload (build-up screen)
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(6);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [reveal, setReveal] = useState(null); // round_result payload
  const [reported, setReported] = useState(false);
  const [result, setResult] = useState(null);
  const wsRef = useRef(null);
  const tickRef = useRef(null);

  useEffect(() => {
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, []);

  // Countdown timer, restarted on each new question.
  useEffect(() => {
    if (stage !== 'playing' || !question || reveal) return undefined;
    setTimeLeft(question.timeLimit);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [question, stage, reveal]);

  const connect = useCallback(
    (categoryKey) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, the backend runs on :3001; in prod it's same-host behind a proxy.
      const host = window.location.port === '3000' ? `${window.location.hostname}:3001` : window.location.host;
      const ws = new WebSocket(`${proto}//${host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ type: 'join', name, avatar, category: categoryKey }));
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'waiting':
            setStage('waiting');
            break;
          case 'game_start':
            setOpponent(data.opponent);
            setTotalRounds(data.totalRounds);
            setScore(0);
            setOpponentScore(0);
            setStage('playing');
            break;
          case 'round_intro':
            setIntro(data);
            setQuestion(null);
            setRound(data.round);
            setReveal(null);
            setReported(false);
            setStage('playing');
            break;
          case 'question':
            setIntro(null);
            setQuestion(data);
            setRound(data.round);
            setSelected(null);
            setReveal(null);
            break;
          case 'report_ack':
            setReported(true);
            break;
          case 'round_result':
            setReveal(data);
            setScore(data.yourScore);
            setOpponentScore(data.opponentScore);
            if (tickRef.current) clearInterval(tickRef.current);
            break;
          case 'game_end':
            setResult(data);
            setScore(data.finalScore);
            setOpponentScore(data.opponentScore);
            setStage('finished');
            break;
          default:
            break;
        }
      };
      ws.onerror = () => setStage('error');
    },
    [name, avatar]
  );

  const startWithCategory = (catKey) => {
    setCategory(catKey);
    connect(catKey);
  };

  const answer = (index) => {
    if (selected !== null || reveal) return;
    setSelected(index);
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'answer', answerIndex: index }));
    }
  };

  const reportQuestion = () => {
    if (reported) return;
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'report' }));
    }
  };

  const playAgain = () => {
    if (wsRef.current) wsRef.current.close();
    setResult(null);
    setQuestion(null);
    setStage('categories');
  };

  const ThemeToggle = () => (
    <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
      {theme === 'dark' ? '☀️' : '🌙'}
    </button>
  );

  // --- Screens ------------------------------------------------------------
  if (stage === 'join') {
    return (
      <div className="app">
        <ThemeToggle />
        <div className="glow glow-1" />
        <div className="glow glow-2" />
        <div className="container center">
          <div className="badge">⚡ The legend is back</div>
          <h1 className="logo">Quizz<span>Up</span></h1>
          <p className="tagline">Real-time trivia battles</p>
          <input
            className="input"
            placeholder="Choose your username"
            value={name}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
          />
          <div className="avatar-picker">
            {AVATARS.map((a) => (
              <button
                key={a}
                className={`avatar-opt ${avatar === a ? 'active' : ''}`}
                onClick={() => setAvatar(a)}
              >
                {a}
              </button>
            ))}
          </div>
          <button className="btn" disabled={!name.trim()} onClick={() => setStage('categories')}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'categories') {
    return (
      <div className="app app-top">
        <ThemeToggle />
        <div className="container wide">
          <div className="cat-header">
            <h2>Choose a category</h2>
            <div className="you-chip">{avatar} {name}</div>
          </div>
          <div className="cat-grid">
            {CATEGORIES.map((c) => (
              <button key={c.key} className={`cat ${c.cls}`} onClick={() => startWithCategory(c.key)}>
                {c.tag && <span className="cat-tag-badge">{c.tag}</span>}
                <span className="cat-ic">{c.icon}</span>
                <span className="cat-nm">{c.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div className="app">
        <ThemeToggle />
        <div className="glow glow-1" />
        <div className="container center">
          <div className="status-label">⚡ Finding opponent</div>
          <div className="versus">
            <div className="fighter">
              <div className="f-ava me">{avatar}</div>
              <div className="f-lbl">{name}</div>
            </div>
            <div className="vs-badge">VS</div>
            <div className="fighter">
              <div className="f-ava searching">?</div>
              <div className="f-lbl dim">Searching…</div>
            </div>
          </div>
          <div className="loading-bar"><div className="loading-fill" /></div>
        </div>
      </div>
    );
  }

  if (stage === 'playing' && intro && !question) {
    return (
      <div className="app">
        <ThemeToggle />
        <div className="glow glow-1" />
        <div className="container center">
          <div className={`round-intro-icon ${intro.isBonus ? 'bonus' : ''}`}>{intro.icon}</div>
          <div className="round-intro-cat">{intro.category}</div>
          <div className="round-intro-round">
            {intro.isBonus ? '⭐ BONUS ROUND' : `Round ${intro.round}`}
          </div>
          <div className="round-intro-sub">{intro.isBonus ? 'Double points — get ready!' : 'Get ready!'}</div>
        </div>
      </div>
    );
  }

  if (stage === 'playing' && question) {
    const showReveal = !!reveal;
    const timerPct = Math.max(0, Math.min(100, (timeLeft / question.timeLimit) * 100));
    return (
      <div className="app app-top">
        <ThemeToggle />
        <div className="container game">
          <div className="players">
            <div className="pl me">
              <div className="pl-av a1">{avatar}</div>
              <div>
                <div className="pl-nm">You</div>
                <div className="pl-sc">{score}</div>
              </div>
            </div>
            <div className="vs">VS</div>
            <div className="pl">
              <div className="pl-av a2">{opponent.avatar}</div>
              <div>
                <div className="pl-nm">{opponent.name}</div>
                <div className="pl-sc opp">{opponentScore}</div>
              </div>
            </div>
          </div>

          <div className="round-label">
            Round {round} of {totalRounds}{question.isBonus ? ' · ⭐ BONUS (x2)' : ''}
          </div>

          <div className="timer-bar-wrap">
            <div
              className={`timer-bar-fill ${timeLeft <= 3 && !showReveal ? 'urgent' : ''}`}
              style={{ width: showReveal ? '100%' : `${timerPct}%` }}
            />
            <span className="timer-bar-num">{showReveal ? '✓' : `${timeLeft}s`}</span>
          </div>

          <div className="cat-tag">{question.icon} {question.category}</div>
          <div className="question">{question.question}</div>

          <div className="answers">
            {question.answers.map((a, idx) => {
              let cls = 'answer';
              if (showReveal) {
                if (idx === reveal.correctIndex) cls += ' correct';
                else if (idx === selected) cls += ' wrong';
                else cls += ' dim';
              } else if (idx === selected) {
                cls += ' selected';
              }
              return (
                <button key={idx} className={cls} onClick={() => answer(idx)} disabled={selected !== null || showReveal}>
                  {a}
                </button>
              );
            })}
          </div>

          {showReveal && (
            <div className="reveal-note">
              {reveal.yourCorrect ? `✅ +${reveal.pointsEarned} points` : reveal.timedOut && selected === null ? '⏱️ Time up' : '❌ Wrong'}
            </div>
          )}

          {showReveal && (
            <button className="report-btn" onClick={reportQuestion} disabled={reported}>
              {reported ? '✓ Reported, thanks' : '🚩 Report this question'}
            </button>
          )}
        </div>
      </div>
    );
  }

  if (stage === 'finished' && result) {
    const won = result.won;
    const tie = result.tie;
    return (
      <div className="app">
        <ThemeToggle />
        <div className="glow glow-win" />
        <div className="container center">
          <div className="crown">{won ? '👑' : tie ? '🤝' : '💪'}</div>
          <h1 className="win-text">{won ? 'Victory!' : tie ? "It's a tie!" : 'Good game!'}</h1>
          <p className="win-sub">
            {result.reason === 'opponent_disconnected' ? 'Opponent disconnected' : `Final score ${result.finalScore} – ${result.opponentScore}`}
          </p>

          <div className="scoreboard">
            <div className={`final ${won ? 'winner' : ''}`}>
              <div className="f-av a1">{avatar}</div>
              <div className="f-nm">You</div>
              <div className="f-score">{result.finalScore}</div>
            </div>
            <div className="final">
              <div className="f-av a2">{opponent.avatar}</div>
              <div className="f-nm">{opponent.name}</div>
              <div className="f-score opp">{result.opponentScore}</div>
            </div>
          </div>

          <div className="rewards">
            <div className="reward"><div className="reward-val">+{result.coins} 🪙</div><div className="reward-label">Coins</div></div>
            <div className="reward"><div className="reward-val">+{result.xp} XP</div><div className="reward-label">Experience</div></div>
          </div>

          <button className="btn" onClick={playAgain}>Play Again</button>
        </div>
      </div>
    );
  }

  if (stage === 'error') {
    return (
      <div className="app">
        <ThemeToggle />
        <div className="container center">
          <h2 className="logo">Connection lost</h2>
          <p className="tagline">Couldn't reach the game server.</p>
          <button className="btn" onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return null;
}
