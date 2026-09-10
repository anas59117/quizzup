import React, { useState, useEffect, useRef, useCallback } from 'react';
import './App.css';
import SFX from './sounds';

const AVATARS = ['🐺', '🦁', '🦊', '🐼', '🦉', '🐸', '🐯', '🦄'];

const CATEGORIES = [
  { key: 'movies', label: 'Movies', icon: '🎬', grad: 'g1', tag: '🔥', desc: 'Blockbusters & classics' },
  { key: 'music', label: 'Music', icon: '🎵', grad: 'g2', desc: 'Artists, albums & lyrics' },
  { key: 'sports', label: 'Sports', icon: '⚽', grad: 'g3', desc: 'Teams & champions' },
  { key: 'geography', label: 'Geography', icon: '🌍', grad: 'g4', desc: 'Capitals & landmarks' },
  { key: 'gaming', label: 'Gaming', icon: '🎮', grad: 'g5', desc: 'Consoles & lore' },
  { key: 'science', label: 'Science', icon: '🧬', grad: 'g6', tag: '✨', desc: 'Space, bio & physics' },
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
  const [muted, setMuted] = useState(SFX.muted);
  const toggleMute = () => setMuted(SFX.toggle());
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
      setTimeLeft((t) => {
        const next = t > 0 ? t - 1 : 0;
        if (next > 0 && next <= 3) SFX.countdownBeep();
        else if (next > 3) SFX.tick(next <= 5);
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [question, stage, reveal]);

  const connect = useCallback(
    (action) => {
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '3000' ? `${window.location.hostname}:3001` : window.location.host;
      const ws = new WebSocket(`${proto}//${host}/ws`);
      wsRef.current = ws;

      ws.onopen = () => ws.send(JSON.stringify({ ...action, name, avatar }));
      ws.onmessage = (event) => {
        let data;
        try { data = JSON.parse(event.data); } catch { return; }
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
            SFX.gameStart();
            setOpponent(data.opponent);
            setTotalRounds(data.totalRounds);
            setScore(0);
            setOpponentScore(0);
            setStage('playing');
            break;
          case 'round_intro':
            if (data.isBonus) SFX.bonusIntro(); else SFX.roundIntro();
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
            if (data.yourCorrect) SFX.correct();
            else if (data.timedOut && !data.yourAnswer && data.yourAnswer !== 0) SFX.timeUp();
            else SFX.wrong();
            setReveal(data);
            setScore(data.yourScore);
            setOpponentScore(data.opponentScore);
            if (tickRef.current) clearInterval(tickRef.current);
            break;
          case 'game_end':
            if (data.won) SFX.victory();
            else if (data.tie) SFX.tie();
            else SFX.defeat();
            setResult(data);
            setScore(data.finalScore);
            setOpponentScore(data.opponentScore);
            setStage('finished');
            break;
          case 'error':
            setStage('error');
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

  // Quick match: join the shared quick pool (category null). The server pairs
  // any two quick players together and picks the category, so matchmaking
  // never fragments across categories.
  const quickMatch = () => {
    setCategory(null);
    connect({ type: 'join', category: null });
  };

  // Challenge a friend: create a private room (server picks the category).
  const createRoom = () => {
    setCategory(null);
    connect({ type: 'create_room', category: null });
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
      <button className="nav-item dimmed">
        <span className="nav-ic">🛒</span><span className="nav-lbl">Shop</span>
      </button>
      <button className="nav-bolt" onClick={quickMatch} aria-label="Quick Play">⚡</button>
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
    SFX.select();
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
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setResult(null);
    setQuestion(null);
    setIntro(null);
    setReveal(null);
    setSelected(null);
    setStage('home');
  };

  const TopControls = () => (
    <div className="top-controls">
      <button className="ctrl-btn" onClick={toggleMute} aria-label="Toggle sound" title="Toggle sound">
        {muted ? '🔇' : '🔊'}
      </button>
      <button className="ctrl-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>
    </div>
  );

  // --- Screens ------------------------------------------------------------
  if (stage === 'join') {
    return (
      <div className="app">
        <TopControls />
        <div className="container center">
          <div className="badge">⚡ THE LEGEND IS BACK</div>
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
      <div className="app app-nav app-top">
        <TopControls />
        <div className="container wide">
          <div className="home-head">
            <div>
              <div className="home-greeting">Hey {name} 👋</div>
              <div className="home-logo-sm">Quizz<span>Up</span></div>
            </div>
            <div className="home-avatar-chip" onClick={() => setStage('profile')}>{avatar}</div>
          </div>

          <button className="quick-play" onClick={quickMatch}>
            <span className="qp-left"><span className="qp-bolt">⚡</span> Quick Play</span>
            <span className="qp-sub">Random topic</span>
          </button>

          <div className="section-title">🔥 Popular Topics</div>
          <div className="topics-scroll">
            {CATEGORIES.map((c) => (
              <button key={c.key} className={`topic-card ${c.grad}`} onClick={() => startWithCategory(c.key)}>
                <span className="tc-icon">{c.icon}</span>
                <span className="tc-name">{c.label}</span>
                {c.tag && <span className="tc-tag">{c.tag}</span>}
              </button>
            ))}
          </div>

          <div className="section-title">
            <span>All Topics</span>
            <button className="see-all" onClick={() => setStage('categories')}>See all ›</button>
          </div>
          <div className="topics-grid">
            {CATEGORIES.map((c) => (
              <button key={c.key} className={`topic-tile ${c.grad}`} onClick={() => startWithCategory(c.key)}>
                <span className="tile-icon">{c.icon}</span>
                <span className="tile-label">{c.label}</span>
                <span className="tile-desc">{c.desc}</span>
              </button>
            ))}
          </div>

          <div className="social-row">
            <button className="social-btn" onClick={createRoom}>⚔️ Challenge</button>
            <button className="social-btn outline" onClick={() => { setJoinError(false); setJoinCode(''); setStage('enter_code'); }}>🔑 Join code</button>
          </div>
        </div>
        <NavBar active="home" />
      </div>
    );
  }

  if (stage === 'room_wait') {
    const copyCode = () => { try { navigator.clipboard.writeText(roomCode); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
    return (
      <div className="app"><TopControls />
        <div className="container center">
          <div className="status-label">⚔️ Challenge a friend</div>
          <div className="room-code-label">Share this code</div>
          <button className="room-code" onClick={copyCode}>{roomCode}</button>
          <div className="room-copy-hint">{copied ? '✓ Copied!' : 'Tap the code to copy'}</div>
          <div className="room-wait-status"><div className="loading-bar"><div className="loading-fill" /></div>
            <div className="room-wait-text">Waiting for your friend…</div></div>
          <button className="home-themes-link" onClick={() => { if (wsRef.current) wsRef.current.close(); setStage('home'); }}>← Cancel</button>
        </div></div>);
  }

  if (stage === 'enter_code') {
    return (
      <div className="app"><TopControls />
        <div className="container center">
          <div className="status-label">🔑 Join a friend</div>
          <div className="room-code-label">Enter their code</div>
          <input className={`input code-input ${joinError ? 'err' : ''}`} placeholder="ABC12" value={joinCode} maxLength={5}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(false); }} />
          {joinError && <div className="code-err-msg">Code not found — check and try again</div>}
          <button className="btn" disabled={joinCode.trim().length < 4} onClick={() => joinRoom(joinCode)}>Join match</button>
          <button className="home-themes-link" onClick={() => setStage('home')}>← Back</button>
        </div></div>);
  }

  if (stage === 'categories') {
    return (
      <div className="app app-nav app-top">
        <TopControls />
        <div className="container wide">
          <div className="cat-header">
            <h2>All Topics</h2>
            <button className="back-link" onClick={() => setStage('home')}>← Back</button>
          </div>
          <div className="topics-grid full">
            {CATEGORIES.map((c) => (
              <button key={c.key} className={`topic-tile tall ${c.grad}`} onClick={() => startWithCategory(c.key)}>
                <span className="tile-icon lg">{c.icon}</span>
                <span className="tile-label">{c.label}</span>
                <span className="tile-desc">{c.desc}</span>
                {c.tag && <span className="tile-tag">{c.tag}</span>}
              </button>
            ))}
          </div>
        </div>
        <NavBar active="categories" />
      </div>
    );
  }

  if (stage === 'profile') {
    const stats = [['0','Games'],['0','Wins'],['0','Streak']];
    return (
      <div className="app app-nav app-top"><TopControls />
        <div className="container">
          <div className="profile-head">
            <div className="profile-avatar">{avatar}</div>
            <div className="profile-name">{name || 'Player'}</div>
            <div className="profile-sub">Level 1 · Rookie</div>
          </div>
          <div className="profile-stats">
            {stats.map(([v,l]) => <div key={l} className="pstat"><div className="pstat-val">{v}</div><div className="pstat-lbl">{l}</div></div>)}
          </div>
          <div className="profile-soon">Friends, follow &amp; global ranking coming soon</div>
        </div><NavBar active="profile" />
      </div>);
  }

  if (stage === 'waiting') {
    return (
      <div className="app game-bg"><TopControls />
        <div className="container center">
          <div className="vs-screen">
            <div className="vs-player">
              <div className="vs-ava me">{avatar}</div>
              <div className="vs-name">{name}</div>
              <div className="vs-rank">Novice</div>
            </div>
            <div className="vs-bolt-wrap"><div className="vs-bolt">⚡</div></div>
            <div className="vs-player">
              <div className="vs-ava searching">?</div>
              <div className="vs-name dim">Searching…</div>
            </div>
          </div>
          <div className="loading-bar"><div className="loading-fill" /></div>
        </div></div>);
  }

  if (stage === 'playing' && intro && !question) {
    return (
      <div className="app game-bg"><TopControls />
        <div className="container center">
          <div className={`round-intro-icon ${intro.isBonus ? 'bonus' : ''}`}>{intro.icon}</div>
          <div className="round-intro-cat">{intro.category}</div>
          <div className="round-intro-round">{intro.isBonus ? 'BONUS ROUND' : `Round ${intro.round}`}</div>
          <div className="round-intro-sub">{intro.isBonus ? 'Double points!' : `${intro.round} of ${totalRounds}`}</div>
        </div></div>);
  }

  if (stage === 'playing' && question) {
    const sr = !!reveal;
    const pct = Math.max(0, Math.min(100, (timeLeft / question.timeLimit) * 100));
    const ansCls = (idx) => {
      if (sr) return idx === reveal.correctIndex ? 'answer correct' : idx === selected ? 'answer wrong' : 'answer dim';
      return idx === selected ? 'answer selected' : 'answer';
    };
    return (
      <div className="app game-bg"><TopControls />
        <div className="container game">
          <div className="game-hud">
            <div className="hud-side left"><div className="hud-av">{avatar}</div><span className="hud-name">{name}</span><span className="hud-score">{score}</span></div>
            <div className="hud-mid"><span className="hud-timer-label">TIME</span><span className={`hud-timer ${timeLeft <= 3 && !sr ? 'urgent' : ''}`}>{sr ? '✓' : timeLeft}</span></div>
            <div className="hud-side right"><span className="hud-score opp">{opponentScore}</span><span className="hud-name">{opponent.name}</span><div className="hud-av opp">{opponent.avatar}</div></div>
          </div>
          <div className="question">{question.question}</div>
          <div className="answers">
            {question.answers.map((a, idx) => <button key={idx} className={ansCls(idx)} onClick={() => answer(idx)} disabled={selected !== null || sr}>{a}</button>)}
          </div>
          <div className="timer-bar-bottom"><div className={`timer-bar-fill ${timeLeft <= 3 && !sr ? 'urgent' : ''}`} style={{ width: sr ? '0%' : `${pct}%` }} /></div>
          {sr && <div className="reveal-note">{reveal.yourCorrect ? `+${reveal.pointsEarned} pts` : reveal.timedOut && selected === null ? 'Time up' : 'Wrong'}</div>}
          {sr && <button className="report-btn" onClick={reportQuestion} disabled={reported}>{reported ? '✓ Reported' : '🚩 Report'}</button>}
        </div></div>);
  }

  if (stage === 'finished' && result) {
    const { won, tie } = result;
    const left = result.reason === 'opponent_disconnected' || result.reason === 'opponent_left';
    const rematch = () => { playAgain(); setTimeout(() => quickMatch(), 50); };
    return (
      <div className="app game-bg"><TopControls />
        <div className="container center">
          <div className={`result-title ${won ? 'win' : tie ? 'tie' : 'loss'}`}>{won ? 'VICTORY!' : tie ? 'DRAW!' : 'DEFEAT'}</div>
          <div className="result-avatars">
            <div className={`ra ${won ? 'winner' : ''}`}>{avatar}</div>
            <div className={`ra ${!won && !tie ? 'winner' : ''}`}>{opponent.avatar}</div>
          </div>
          <div className="result-sub">{left ? 'Opponent left' : `${result.finalScore} — ${result.opponentScore}`}</div>
          <div className="rewards-row"><span className="rw">+{result.coins} coins</span><span className="rw">+{result.xp} XP</span></div>
          <div className="result-actions">
            <button className="ra-btn rematch" onClick={rematch}>Rematch</button>
            <button className="ra-btn new-opp" onClick={playAgain}>New opponent</button>
            <button className="ra-btn see-res" onClick={playAgain}>Back to home</button>
          </div>
        </div></div>);
  }

  if (stage === 'error') {
    return (
      <div className="app"><TopControls />
        <div className="container center">
          <h2 className="logo">Connection lost</h2>
          <p className="tagline">Couldn't reach the game server.</p>
          <button className="btn" onClick={() => window.location.reload()}>Retry</button>
        </div></div>);
  }

  return null;
}
