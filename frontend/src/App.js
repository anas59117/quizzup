import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';

const AVATARS = ['🐺', '🦁', '🦊', '🐼', '🦉', '🐸', '🐯', '🦄'];

const CATEGORIES = [
  { key: 'movies', label: 'Movies', icon: '🎬', cls: 'c1', tag: '🔥 Hot', desc: 'Blockbusters, directors & classics' },
  { key: 'music', label: 'Music', icon: '🎵', cls: 'c2', desc: 'Artists, albums & lyrics' },
  { key: 'sports', label: 'Sports', icon: '⚽', cls: 'c3', desc: 'Teams, records & champions' },
  { key: 'geography', label: 'Geography', icon: '🌍', cls: 'c4', desc: 'Capitals, countries & landmarks' },
  { key: 'gaming', label: 'Gaming', icon: '🎮', cls: 'c2', desc: 'Consoles, franchises & lore' },
  { key: 'science', label: 'Science', icon: '🧬', cls: 'c1', tag: '✨ New', desc: 'Space, biology & physics' },
];

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('quizzup-theme') || 'light';
    } catch {
      return 'light';
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
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState(false);
  const [copied, setCopied] = useState(false);
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
    (action) => {
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In dev, the backend runs on :3001; in prod it's same-host behind a proxy.
      const host = window.location.port === '3000' ? `${window.location.hostname}:3001` : window.location.host;
      const ws = new WebSocket(`${proto}//${host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ ...action, name, avatar }));
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        switch (data.type) {
          case 'waiting':
            setStage('waiting');
            break;
          case 'room_created':
            setRoomCode(data.code);
            setStage('room_wait');
            break;
          case 'room_not_found':
            setJoinError(true);
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
    connect({ type: 'join', category: catKey });
  };

  // Quick match from the home screen: pick a random category so the API pool
  // (and variety) is still used, then jump straight into matchmaking.
  const quickMatch = () => {
    const random = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setCategory(random.key);
    connect({ type: 'join', category: random.key });
  };

  // Challenge a friend: create a private room, get a shareable code.
  const createRoom = () => {
    const random = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];
    setCategory(random.key);
    connect({ type: 'create_room', category: random.key });
  };

  // Join a friend's room by code.
  const joinRoom = (code) => {
    if (!code || code.trim().length < 4) return;
    setJoinError(false);
    connect({ type: 'join_room', code: code.trim().toUpperCase() });
  };

  const NavBar = ({ active }) => (
    <nav className="navbar">
      <button className={`nav-item ${active === 'home' ? 'active' : ''}`} onClick={() => setStage('home')}>
        <span className="nav-ic">🏠</span><span className="nav-lbl">Home</span>
      </button>
      <button className={`nav-item ${active === 'categories' ? 'active' : ''}`} onClick={() => setStage('categories')}>
        <span className="nav-ic">🗂️</span><span className="nav-lbl">Themes</span>
      </button>
      <button className={`nav-item ${active === 'profile' ? 'active' : ''}`} onClick={() => setStage('profile')}>
        <span className="nav-ic">👤</span><span className="nav-lbl">Profile</span>
      </button>
    </nav>
  );

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
          <button className="btn" disabled={!name.trim()} onClick={() => setStage('home')}>
            Continue →
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'home') {
    return (
      <div className="app app-nav">
        <ThemeToggle />
        <div className="home-hero">
          <div className="home-logo">Quizz<span>Up</span></div>
          <div className="home-tagline">Real-time trivia battles</div>
          <button className="home-play" onClick={quickMatch}>
            <span className="home-play-bolt">⚡</span>
            <span>Play now</span>
          </button>
          <div className="home-hint">Quick match against a random player</div>
          <div className="home-actions">
            <button className="home-action" onClick={createRoom}>⚔️ Challenge a friend</button>
            <button className="home-action ghost" onClick={() => { setJoinError(false); setJoinCode(''); setStage('enter_code'); }}>
              🔑 Enter a code
            </button>
          </div>
          <button className="home-themes-link" onClick={() => setStage('categories')}>
            or pick a theme →
          </button>
        </div>
        <NavBar active="home" />
      </div>
    );
  }

  if (stage === 'room_wait') {
    const copyCode = () => {
      try {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {
        /* clipboard may be blocked — the code is shown on screen anyway */
      }
    };
    return (
      <div className="app">
        <ThemeToggle />
        <div className="glow glow-1" />
        <div className="container center">
          <div className="status-label">⚔️ Challenge a friend</div>
          <div className="room-code-label">Share this code</div>
          <button className="room-code" onClick={copyCode}>{roomCode}</button>
          <div className="room-copy-hint">{copied ? '✓ Copied!' : 'Tap the code to copy'}</div>
          <div className="room-wait-status">
            <div className="loading-bar"><div className="loading-fill" /></div>
            <div className="room-wait-text">Waiting for your friend to join…</div>
          </div>
          <button className="home-themes-link" onClick={() => { if (wsRef.current) wsRef.current.close(); setStage('home'); }}>
            ← Cancel
          </button>
        </div>
      </div>
    );
  }

  if (stage === 'enter_code') {
    return (
      <div className="app">
        <ThemeToggle />
        <div className="glow glow-1" />
        <div className="container center">
          <div className="status-label">🔑 Join a friend</div>
          <div className="room-code-label">Enter their code</div>
          <input
            className={`input code-input ${joinError ? 'err' : ''}`}
            placeholder="ABC12"
            value={joinCode}
            maxLength={5}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(false); }}
          />
          {joinError && <div className="code-err-msg">Code not found — check and try again</div>}
          <button className="btn" disabled={joinCode.trim().length < 4} onClick={() => joinRoom(joinCode)}>
            Join match
          </button>
          <button className="home-themes-link" onClick={() => setStage('home')}>← Back</button>
        </div>
      </div>
    );
  }

  if (stage === 'categories') {
    return (
      <div className="app app-nav app-top">
        <ThemeToggle />
        <div className="container wide">
          <div className="cat-header">
            <h2>Themes</h2>
            <div className="you-chip">{avatar} {name}</div>
          </div>
          <div className="cat-list">
            {CATEGORIES.map((c) => (
              <button key={c.key} className="cat-row" onClick={() => startWithCategory(c.key)}>
                <span className={`cat-row-ic ${c.cls}`}>{c.icon}</span>
                <span className="cat-row-text">
                  <span className="cat-row-name">
                    {c.label}
                    {c.tag && <span className="cat-row-tag">{c.tag}</span>}
                  </span>
                  <span className="cat-row-desc">{c.desc}</span>
                </span>
                <span className="cat-row-arrow">›</span>
              </button>
            ))}
          </div>
        </div>
        <NavBar active="categories" />
      </div>
    );
  }

  if (stage === 'profile') {
    return (
      <div className="app app-nav app-top">
        <ThemeToggle />
        <div className="container">
          <div className="profile-head">
            <div className="profile-avatar">{avatar}</div>
            <div className="profile-name">{name || 'Player'}</div>
            <div className="profile-sub">Level 1 · Rookie</div>
          </div>
          <div className="profile-stats">
            <div className="pstat"><div className="pstat-val">0</div><div className="pstat-lbl">Games</div></div>
            <div className="pstat"><div className="pstat-val">0</div><div className="pstat-lbl">Wins</div></div>
            <div className="pstat"><div className="pstat-val">0</div><div className="pstat-lbl">Streak</div></div>
          </div>
          <div className="profile-soon">🚧 Friends, follow &amp; global ranking coming soon</div>
        </div>
        <NavBar active="profile" />
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
