import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import SFX from './sounds';
import music from './music';
import { getClientId, useSocial, FriendsScreen, GameChat } from './social';
import { ensureSignedIn, linkGoogleAccount } from './firebase';
import { useStats, ProfileStats } from './stats';
import { useFeed, FeedScreen } from './feed';
import { RoomLobby, PlayerHud, Leaderboard } from './multiplayer';
import { AVATARS, CATEGORIES, useTheme, TopControls, NavBar, PlayerPhoto, SoloToggle, CategoryTile, LevelRing, JoinScreen, ErrorScreen } from './ui';

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [muted, setMuted] = useState(SFX.muted);
  const toggleMute = useCallback(() => setMuted(SFX.toggle()), []);
  useEffect(() => { music.setMuted(muted); }, [muted]);
  const [stage, setStage] = useState('join');
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState(AVATARS[0]);
  const [myId, setMyId] = useState(null);
  const [opponents, setOpponents] = useState([]); // [{id,name,avatar,clientId,score,answered,correct}]
  const [room, setRoom] = useState(null); // { code, players, isHost, canStart }
  const [intro, setIntro] = useState(null);
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [totalRounds, setTotalRounds] = useState(6);
  const [selected, setSelected] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [reveal, setReveal] = useState(null);
  const [reported, setReported] = useState(false);
  const [result, setResult] = useState(null);
  const [friendRequestSent, setFriendRequestSent] = useState({});
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [linking, setLinking] = useState(false);
  const wsRef = useRef(null);
  const tickRef = useRef(null);
  const social = useSocial(wsRef);
  const statsHook = useStats();
  const feed = useFeed(wsRef);
  const clientId = firebaseUser?.uid || null;

  useEffect(() => () => {
    if (wsRef.current) wsRef.current.close();
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  // Sign in (anonymously, at first) so every player has a stable Firebase
  // uid — this replaces the old localStorage clientId as the persistent
  // identity behind friends/presence. Falls back to the old local id if
  // Firebase is unreachable so the app never gets stuck on a blank screen.
  useEffect(() => {
    let cancelled = false;
    ensureSignedIn()
      .then((user) => { if (!cancelled) setFirebaseUser(user); })
      .catch(() => { if (!cancelled) setFirebaseUser({ uid: getClientId(), isAnonymous: true }); });
    return () => { cancelled = true; };
  }, []);

  const linkGoogle = useCallback(async () => {
    setLinking(true);
    try {
      const result = await linkGoogleAccount();
      setFirebaseUser(result.user);
    } catch (err) {
      console.error('Google link failed', err);
    } finally {
      setLinking(false);
    }
  }, []);

  useEffect(() => {
    if (stage !== 'playing' || !question || reveal) return undefined;
    setTimeLeft(question.timeLimit);
    if (tickRef.current) clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        const next = t > 0 ? t - 1 : 0;
        if (next > 0 && next <= 3) SFX.countdownBeep(); else if (next > 3) SFX.tick(next <= 5);
        return next;
      });
    }, 1000);
    return () => clearInterval(tickRef.current);
  }, [question, stage, reveal]);

  // Background music per screen — one track per context, cross-faded on
  // switch. During the reveal pause we keep whatever was already playing
  // rather than interrupting it for the ~2.5s pause between rounds.
  useEffect(() => {
    if (stage === 'home' || stage === 'categories' || stage === 'profile' || stage === 'enter_code') {
      music.play('menu');
    } else if (stage === 'waiting' || stage === 'room_wait') {
      music.play('lobby');
    } else if (stage === 'playing' && intro && !question) {
      music.play('transition', { loop: false });
    } else if (stage === 'playing' && question && !reveal) {
      music.play(timeLeft <= 3 ? 'urgent' : 'thinking');
    } else if (stage === 'join' || stage === 'finished' || stage === 'error') {
      music.stop();
    }
  }, [stage, intro, question, reveal, timeLeft]);

  const connect = useCallback((action) => {
    const send = (payload) => {
      if (wsRef.current && wsRef.current.readyState === 1) { wsRef.current.send(JSON.stringify(payload)); return; }
      if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
      // In production the frontend (Vercel) and backend (Railway) are on
      // different hosts, so the URL must be explicit via env var. Falls back
      // to same-host logic for local dev, where frontend:3000 talks to
      // backend:3001 on localhost.
      const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.port === '3000' ? `${window.location.hostname}:3001` : window.location.host;
      const wsUrl = process.env.REACT_APP_WS_URL || `${proto}//${host}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      ws.onopen = () => ws.send(JSON.stringify(payload));
      attachHandlers(ws);
    };

    // The server verifies clientId from a Firebase ID token rather than
    // trusting the value directly — a raw clientId would let anyone claim
    // to be someone else. Only the identify message needs the token; other
    // actions ride on the identity that identify already established.
    if (action.type === 'identify' && firebaseUser && typeof firebaseUser.getIdToken === 'function') {
      firebaseUser.getIdToken()
        .then((idToken) => send({ ...action, name, avatar, clientId, idToken }))
        .catch(() => send({ ...action, name, avatar, clientId }));
      return;
    }
    send({ ...action, name, avatar, clientId });
  }, [name, avatar, social, clientId, firebaseUser]);

  function attachHandlers(ws) {
    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      switch (data.type) {
        case 'session': setMyId(data.playerId); break;
        case 'waiting': setStage('waiting'); break;
        case 'room_created':
        case 'room_update':
          setRoom({ code: data.code, players: data.players, isHost: data.isHost, canStart: data.canStart });
          setJoinError(false);
          setStage('room_wait');
          break;
        case 'room_not_found': setJoinError(true); break;
        case 'room_full': setJoinError(true); break;
        case 'room_closed': setRoom(null); setStage('home'); break;
        case 'game_start':
          SFX.gameStart();
          setOpponents(data.opponents.map((o) => ({ ...o, score: 0, answered: false, correct: false })));
          setTotalRounds(data.totalRounds);
          setScore(0); setRoom(null);
          setStage('playing');
          break;
        case 'round_intro':
          if (data.isBonus) SFX.bonusIntro(); else SFX.roundIntro();
          setIntro(data); setQuestion(null); setReveal(null); setReported(false); setStage('playing');
          break;
        case 'question':
          setIntro(null); setQuestion(data); setSelected(null); setReveal(null);
          setOpponents((prev) => prev.map((o) => ({ ...o, answered: false, correct: false })));
          break;
        case 'report_ack': setReported(true); break;
        case 'round_result':
          if (data.yourCorrect) SFX.correct();
          else if (data.timedOut && !data.yourAnswer && data.yourAnswer !== 0) SFX.timeUp();
          else SFX.wrong();
          setReveal(data); setScore(data.yourScore);
          // Replace (not merge) so a player who disconnected mid-match and
          // dropped out of the backend's list disappears from the HUD too,
          // instead of lingering forever on their last known state.
          setOpponents((prev) => data.others.map((upd) => ({ ...prev.find((o) => o.id === upd.id), ...upd })));
          if (tickRef.current) clearInterval(tickRef.current);
          break;
        case 'game_end':
          if (data.won) SFX.victory(); else if (data.tie) SFX.tie(); else SFX.defeat();
          setResult(data); setScore(data.finalScore); setStage('finished');
          setOpponents((prev) => data.others.map((upd) => ({ ...prev.find((o) => o.id === upd.id), ...upd })));
          statsHook.handleStatsMessage(data);
          break;
        case 'stats': statsHook.handleStatsMessage(data); break;
        case 'error': setStage('error'); break;
        default: social.handleMessage(data); feed.handleMessage(data); break;
      }
    };
    ws.onerror = () => setStage('error');
  }

  useEffect(() => {
    if (stage === 'home' && clientId && (!wsRef.current || wsRef.current.readyState > 1)) connect({ type: 'identify' });
  }, [stage, connect, clientId]);

  const [soloMode, setSoloMode] = useState(false);
  const startWithCategory = useCallback((catKey) => {
    connect({ type: soloMode ? 'solo' : 'join', category: catKey });
  }, [connect, soloMode]);

  const quickMatch = useCallback(() => {
    connect({ type: soloMode ? 'solo' : 'join', category: null });
  }, [connect, soloMode]);

  const createRoom = useCallback(() => {
    connect({ type: 'create_room', category: null });
  }, [connect]);

  const joinRoom = useCallback((code) => {
    if (!code || code.trim().length < 4) return;
    setJoinError(false);
    connect({ type: 'join_room', code: code.trim().toUpperCase() });
  }, [connect]);

  const startRoomMatch = useCallback(() => {
    if (!room) return;
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'start_room', code: room.code }));
    }
  }, [room]);

  const onNav = useCallback((s) => setStage(s), []);

  const answer = useCallback((index) => {
    if (selected !== null || reveal) return;
    SFX.select();
    setSelected(index);
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'answer', answerIndex: index }));
    }
  }, [selected, reveal]);

  const reportQuestion = useCallback(() => {
    if (reported) return;
    if (wsRef.current && wsRef.current.readyState === 1) {
      wsRef.current.send(JSON.stringify({ type: 'report' }));
    }
  }, [reported]);

  // Keeps the same (already-identified) connection instead of closing and
  // reopening it — the backend now recognizes a just-finished game as free
  // to leave immediately, so there's no need to force a fresh connection
  // between matches. That close/reopen used to race against the new
  // socket's handshake on any real network latency, occasionally dropping
  // the identify message that links a rematch's stats to the player.
  const playAgain = useCallback(() => {
    setResult(null); setQuestion(null); setIntro(null); setReveal(null);
    setSelected(null); setFriendRequestSent({}); setRoom(null);
    social.clearGameChat();
    setStage('home');
  }, [social]);

  const topProps = useMemo(() => ({ muted, toggleMute, theme, toggleTheme }), [muted, toggleMute, theme, toggleTheme]);

  // --- Screens ---------------------------------------------------------------
  if (stage === 'join') {
    return (
      <div className="app">
        <TopControls {...topProps} />
        <JoinScreen name={name} setName={setName} avatar={avatar} setAvatar={setAvatar} onContinue={() => setStage('home')} />
      </div>
    );
  }

  if (stage === 'home') {
    return (
      <div className="app app-nav app-top">
        <TopControls {...topProps} />
        <div className="container wide">
          <div className="home-head">
            <div>
              <div className="home-greeting">Hey {name} {'\u{1F44B}'}</div>
              <div className="home-logo-sm">Quizz<span>Up</span></div>
            </div>
            <button className="home-avatar-chip" onClick={() => setStage('profile')} aria-label="Open profile">{avatar}</button>
          </div>
          <SoloToggle solo={soloMode} onToggle={() => setSoloMode((s) => !s)} />
          <button className="quick-play" onClick={quickMatch}>
            <span className="qp-left"><span className="qp-bolt">{'⚡'}</span> Quick Play</span>
            <span className="qp-sub">Random topic</span>
          </button>
          <div className="section-title">{'\u{1F525}'} Popular Topics</div>
          <div className="topics-scroll">
            {CATEGORIES.map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} />)}
          </div>
          <div className="section-title">
            <span>All Topics</span>
            <button className="see-all" onClick={() => setStage('categories')}>See all {'›'}</button>
          </div>
          <div className="topics-grid">
            {CATEGORIES.map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} />)}
          </div>
          <div className="social-row">
            <button className="social-btn" onClick={createRoom}>{'⚔️'} Party (2-4)</button>
            <button className="social-btn outline" onClick={() => { setJoinError(false); setJoinCode(''); setStage('enter_code'); }}>{'\u{1F511}'} Join code</button>
          </div>
        </div>
        <NavBar active="home" onNav={onNav} onQuickMatch={quickMatch} />
      </div>
    );
  }

  if (stage === 'room_wait' && room) {
    const copyCode = () => { try { navigator.clipboard.writeText(room.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch {} };
    const cancel = () => { if (wsRef.current) wsRef.current.close(); setRoom(null); setStage('home'); };
    return (
      <div className="app"><TopControls {...topProps} />
        <RoomLobby
          code={room.code} players={room.players} isHost={room.isHost} canStart={room.canStart}
          onStart={startRoomMatch} onCancel={cancel} copied={copied} onCopyCode={copyCode}
        />
      </div>);
  }

  if (stage === 'enter_code') {
    return (
      <div className="app"><TopControls {...topProps} />
        <div className="container center">
          <div className="status-label">{'\u{1F511}'} Join a friend</div>
          <div className="room-code-label">Enter their code</div>
          <input className={`input code-input ${joinError ? 'err' : ''}`} placeholder="ABC12" value={joinCode} maxLength={5}
            onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(false); }} />
          {joinError && <div className="code-err-msg">Code not found, full, or already started</div>}
          <button className="btn" disabled={joinCode.trim().length < 4} onClick={() => joinRoom(joinCode)}>Join match</button>
          <button className="home-themes-link" onClick={() => setStage('home')}>{'←'} Back</button>
        </div></div>);
  }

  if (stage === 'categories') {
    return (
      <div className="app app-nav app-top">
        <TopControls {...topProps} />
        <div className="container wide">
          <div className="cat-header">
            <h2>All Topics</h2>
            <button className="back-link" onClick={() => setStage('home')}>{'←'} Back</button>
          </div>
          <div className="topics-grid full">
            {CATEGORIES.map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} />)}
          </div>
        </div>
        <NavBar active="categories" onNav={onNav} onQuickMatch={quickMatch} />
      </div>
    );
  }

  if (stage === 'feed') {
    return (
      <div className="app app-nav app-top">
        <TopControls {...topProps} />
        <div className="container wide">
          <div className="cat-header">
            <h2>Accueil</h2>
          </div>
          <FeedScreen feed={feed} />
        </div>
        <NavBar active="feed" onNav={onNav} onQuickMatch={quickMatch} />
      </div>
    );
  }

  if (stage === 'profile') {
    const isGoogleLinked = firebaseUser && !firebaseUser.isAnonymous;
    return (
      <div className="app app-nav app-top"><TopControls {...topProps} />
        <div className="container">
          <div className="profile-head">
            <div className="profile-avatar">{avatar}</div>
            <div className="profile-name">{name || 'Player'}</div>
            <div className="profile-sub">Level {statsHook.stats.level} {'·'} Rookie</div>
          </div>
          <ProfileStats stats={statsHook.stats} />
          {isGoogleLinked ? (
            <div className="account-linked">{'✓'} Connecté avec Google ({firebaseUser.email})</div>
          ) : (
            <button className="social-btn outline account-link-btn" onClick={linkGoogle} disabled={linking || !clientId}>
              {linking ? 'Connexion…' : `${'\u{1F511}'} Se connecter avec Google`}
            </button>
          )}
          <FriendsScreen social={social} />
        </div><NavBar active="profile" onNav={onNav} onQuickMatch={quickMatch} />
      </div>);
  }

  if (stage === 'waiting') {
    return (
      <div className="app game-bg"><TopControls {...topProps} />
        <div className="container center">
          <div className="vs-screen">
            <div className="vs-player">
              <div className="vs-ava me">{avatar}</div>
              <div className="vs-name">{name}</div>
              <div className="vs-rank">Novice</div>
            </div>
            <div className="vs-bolt-wrap"><div className="vs-bolt">{'⚡'}</div></div>
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
      <div className="app game-bg"><TopControls {...topProps} />
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
      <div className="app game-bg"><TopControls {...topProps} />
        <div className="container game">
          <div className="hud-timer-block">
            <span className="hud-timer-label">TIME</span>
            <span className={`hud-timer ${timeLeft <= 3 && !sr ? 'urgent' : ''}`}>{sr ? '✓' : timeLeft}</span>
          </div>
          <PlayerHud me={{ avatar, name, score }} others={opponents} revealing={sr} />
          <PlayerPhoto image={question.image} credit={question.credit} timeLeft={timeLeft} timeLimit={question.timeLimit} revealed={sr} />
          <div className="question">{question.question}</div>
          <div className="answers">
            {question.answers.map((a, idx) => <button key={idx} className={ansCls(idx)} onClick={() => answer(idx)} disabled={selected !== null || sr}>{a}</button>)}
          </div>
          <div className="timer-bar-bottom"><div className={`timer-bar-fill ${timeLeft <= 3 && !sr ? 'urgent' : ''}`} style={{ width: sr ? '0%' : `${pct}%` }} /></div>
          {sr && <div className="reveal-note">{reveal.yourCorrect ? `+${reveal.pointsEarned} pts` : reveal.timedOut && selected === null ? 'Time up' : 'Wrong'}</div>}
          {sr && <button className="report-btn" onClick={reportQuestion} disabled={reported}>{reported ? '✓ Reported' : '\u{1F6A9} Report'}</button>}
          <GameChat social={social} />
        </div></div>);
  }

  if (stage === 'finished' && result) {
    const { won, tie } = result;
    const left = result.reason === 'opponent_disconnected' || result.reason === 'opponent_left';
    const isSolo = opponents.length === 0 && !left;
    const rematch = () => { playAgain(); quickMatch(); };
    const addableOpponents = opponents.filter(
      (o) => o.clientId && !social.friends.some((f) => f.id === o.clientId) && !friendRequestSent[o.clientId]
    );
    const shareResult = () => {
      const text = isSolo ? `J'ai fait ${result.finalScore} points sur QuizzUp !`
        : won ? 'Je viens de gagner sur QuizzUp !' : tie ? 'Match nul sur QuizzUp !' : 'Je viens de jouer sur QuizzUp !';
      if (navigator.share) navigator.share({ text }).catch(() => {});
      else navigator.clipboard?.writeText(text).catch(() => {});
    };
    return (
      <div className="app game-bg"><TopControls {...topProps} />
        <div className="container center">
          <div className={`result-title ${isSolo ? 'tie' : won ? 'win' : tie ? 'tie' : 'loss'}`}>{isSolo ? 'TERMINÉ !' : won ? 'VICTORY!' : tie ? 'DRAW!' : 'DEFEAT'}</div>
          <div className="result-sub">{left ? 'Someone left' : `Final score: ${result.finalScore}`}</div>
          {result.stats && <LevelRing level={result.stats.level} xpIntoLevel={result.stats.xpIntoLevel} xpForLevel={result.stats.xpForLevel} />}
          <div className="xp-breakdown">
            <div className="xpb-row"><span>Score du match</span><span>{result.finalScore}</span></div>
            <div className="xpb-row"><span>Bonus fin</span><span>+{result.xpBreakdown?.finishBonus ?? 0}</span></div>
            <div className="xpb-row"><span>Bonus victoire</span><span>+{result.xpBreakdown?.winBonus ?? 0}</span></div>
            <div className="xpb-row total"><span>XP totale</span><span>{result.xp}</span></div>
          </div>
          <Leaderboard leaderboard={result.leaderboard} myId={myId} />
          <div className="rewards-row"><span className="rw">+{result.coins} coins</span></div>
          <button className="share-link" onClick={shareResult}>{'\u{1F4E4}'} Partager</button>
          {addableOpponents.map((o) => (
            <button key={o.clientId} className="add-friend-link" onClick={() => {
              social.addFriend(o.clientId);
              setFriendRequestSent((prev) => ({ ...prev, [o.clientId]: true }));
            }}>
              {`+ Add ${o.name} as friend`}
            </button>
          ))}
          <div className="result-actions">
            <button className="ra-btn rematch" onClick={rematch}>Rematch</button>
            <button className="ra-btn new-opp" onClick={playAgain}>{isSolo ? 'New game' : 'New opponent'}</button>
            <button className="ra-btn see-res" onClick={playAgain}>Back to home</button>
          </div>
        </div></div>);
  }

  if (stage === 'error') {
    return (
      <div className="app"><TopControls {...topProps} />
        <ErrorScreen onRetry={() => window.location.reload()} />
      </div>);
  }

  return null;
}
