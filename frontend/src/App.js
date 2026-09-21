import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import SFX from './sounds';
import music from './music';
import { useSocial, GameChat } from './social';
import { ensureSignedIn, linkGoogleAccount } from './firebase';
import { useStats } from './stats';
import { useFeed, FeedScreen } from './feed';
import { RoomLobby } from './multiplayer';
import { AVATARS, useTheme, TopControls, NavBar, JoinScreen, ErrorScreen } from './ui';
import { HomeContent, EnterCodeContent, CategoriesContent, ProfileContent, WaitingContent, RoundIntroContent, QuestionContent, FinishedContent } from './screens';
import { useI18n } from './i18n';
import { useGameSocket } from './useGameSocket';

const LIVE_SESSION_KEY = 'quizzup-live-session';

function readLiveSession() {
  try {
    const value = sessionStorage.getItem(LIVE_SESSION_KEY);
    return value === 'game' || value === 'room' ? value : null;
  } catch {
    return null;
  }
}

function writeLiveSession(value) {
  try {
    if (value) sessionStorage.setItem(LIVE_SESSION_KEY, value);
    else sessionStorage.removeItem(LIVE_SESSION_KEY);
  } catch {}
}

export default function App() {
  const { t } = useI18n();
  const [theme, toggleTheme] = useTheme();
  const [muted, setMuted] = useState(SFX.muted);
  const toggleMute = useCallback(() => setMuted(SFX.toggle()), []);
  useEffect(() => { music.setMuted(muted); }, [muted]);
  const [stage, setStage] = useState('join');
  const [categoryFamily, setCategoryFamily] = useState(null);
  const [name, setName] = useState(() => {
    try { return localStorage.getItem('quizzup-name') || ''; } catch { return ''; }
  });
  const [avatar, setAvatar] = useState(() => {
    try { return localStorage.getItem('quizzup-avatar') || AVATARS[0]; } catch { return AVATARS[0]; }
  });
  useEffect(() => {
    try {
      if (name.trim()) localStorage.setItem('quizzup-name', name.trim());
      else localStorage.removeItem('quizzup-name');
      localStorage.setItem('quizzup-avatar', avatar);
    } catch {}
  }, [name, avatar]);
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
  const [pending, setPending] = useState(false);
  const tickRef = useRef(null);
  const copyTimerRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const bootNameRef = useRef(name);
  const bootSessionRef = useRef(readLiveSession());
  const matchActionRef = useRef(null);
  const [skipRoomRecovery, setSkipRoomRecovery] = useState(false);
  const messageHandlerRef = useRef(null);

  const clearPending = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setPending(false);
  }, []);

  const {
    wsRef,
    connect,
    send: sendSocket,
    closeSocket,
    scheduleRecovery,
    reconnecting,
  } = useGameSocket({
    name,
    avatar,
    firebaseUser,
    shouldRecover: !!firebaseUser && stage !== 'error',
    // A page load with a persisted name is only an *opportunistic* recovery
    // probe. Most returning users have no active match, so only an already
    // visible playing screen requires a missing match to be fatal.
    expectGameRecovery: stage === 'playing',
    expectRoomRecovery: stage === 'room_wait',
    recoverGameOnIdentify: (
      stage === 'playing'
      || (stage === 'join' && bootSessionRef.current === 'game')
    ),
    recoverRoomOnIdentify: (
      !skipRoomRecovery
      && (
        stage === 'room_wait'
        || (stage === 'join' && bootSessionRef.current === 'room')
      )
    ),
    onMessageRef: messageHandlerRef,
    onFatalError: () => setStage('error'),
    onPendingClear: clearPending,
  });

  const social = useSocial(wsRef);
  const statsHook = useStats();
  const feed = useFeed(wsRef);
  const clientId = firebaseUser?.uid || null;

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
  }, []);

  // A verified Firebase identity is required by the authoritative backend.
  // Do not fall back to an unverified local id: that would make the UI look
  // authenticated while every gameplay action is correctly rejected.
  useEffect(() => {
    let cancelled = false;
    ensureSignedIn()
      .then((user) => { if (!cancelled) setFirebaseUser(user); })
      .catch((err) => {
        console.error('Firebase sign-in failed', err);
        if (!cancelled) setStage('error');
      });
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

  messageHandlerRef.current = (data) => {
    switch (data.type) {
      case 'session':
        setMyId(data.playerId);
        break;
      case 'identified':
        if (skipRoomRecovery) {
          setSkipRoomRecovery(false);
          // Defensive fallback: the server should not reconnect a room when
          // recoverRoom=false, but if it ever does, leave it immediately.
          if (data.roomReconnected) sendSocket({ type: 'leave_room' });
          setRoom(null);
          setStage('home');
          break;
        }

        // A returning browser probes for an unfinished game/lobby because the
        // display identity is persisted locally. No recovery is the normal
        // case: continue to Home instead of treating it as an error.
        if (
          stage === 'join'
          && bootNameRef.current.trim()
          && !data.reconnected
          && !data.roomReconnected
        ) {
          bootSessionRef.current = null;
          writeLiveSession(null);
          setStage('home');
          break;
        }

        // If the transport hook already flushed an action that was queued
        // before authentication, do not replay it a second time. If the
        // action had previously reached the server (e.g. we were waiting for
        // an opponent), replay it after reconnect so the server can requeue us.
        if (
          matchActionRef.current
          && !data.queuedActionFlushed
          && (stage === 'waiting' || stage === 'home' || pending)
        ) {
          connect(matchActionRef.current);
        }
        break;
      case 'game_reconnected':
        bootSessionRef.current = 'game';
        writeLiveSession('game');
        matchActionRef.current = null;
        clearPending();
        setScore(data.score || 0);
        setTotalRounds(data.totalRounds || 6);
        if (data.you) {
          if (data.you.name) setName(data.you.name);
          if (data.you.avatar) setAvatar(data.you.avatar);
        }
        setOpponents((data.opponents || []).map((o) => ({
          ...o,
          score: o.score || 0,
          answered: !!o.answered,
          correct: !!o.correct,
        })));
        setRoom(null);
        setStage('playing');
        break;
      case 'waiting':
        clearPending();
        setStage('waiting');
        break;
      case 'room_created':
      case 'room_update':
        bootSessionRef.current = 'room';
        writeLiveSession('room');
        clearPending();
        setRoom({ code: data.code, players: data.players, isHost: data.isHost, canStart: data.canStart });
        setJoinError(false);
        setStage('room_wait');
        break;
      case 'room_not_found':
      case 'room_unavailable':
      case 'room_full':
        clearPending();
        setJoinError(true);
        break;
      case 'already_playing':
        matchActionRef.current = null;
        clearPending();
        break;
      case 'rate_limited':
        clearPending();
        break;
      case 'room_left':
        bootSessionRef.current = null;
        writeLiveSession(null);
        setSkipRoomRecovery(false);
        setRoom(null);
        setStage('home');
        break;
      case 'room_closed':
        bootSessionRef.current = null;
        writeLiveSession(null);
        setSkipRoomRecovery(false);
        setRoom(null);
        setStage('home');
        break;
      case 'game_start':
        bootSessionRef.current = 'game';
        writeLiveSession('game');
        matchActionRef.current = null;
        SFX.gameStart();
        clearPending();
        setOpponents(data.opponents.map((o) => ({ ...o, score: 0, answered: false, correct: false })));
        setTotalRounds(data.totalRounds);
        setScore(0);
        setRoom(null);
        setStage('playing');
        break;
      case 'round_intro':
        if (data.isBonus) SFX.bonusIntro(); else SFX.roundIntro();
        setIntro(data);
        setQuestion(null);
        setReveal(null);
        setReported(false);
        setStage('playing');
        break;
      case 'question':
        setIntro(null);
        setQuestion(data);
        setSelected(data.reconnect && data.answered ? data.yourAnswer : null);
        setReveal(null);
        if (!data.reconnect) {
          setOpponents((prev) => prev.map((o) => ({ ...o, answered: false, correct: false })));
        }
        break;
      case 'report_ack':
        setReported(true);
        break;
      case 'round_result':
        if (!data.reconnect) {
          if (data.yourCorrect) SFX.correct();
          else if (data.timedOut && !data.yourAnswer && data.yourAnswer !== 0) SFX.timeUp();
          else SFX.wrong();
        }
        setReveal(data);
        setScore(data.yourScore);
        setOpponents((prev) => data.others.map((upd) => ({ ...prev.find((o) => o.id === upd.id), ...upd })));
        if (tickRef.current) clearInterval(tickRef.current);
        break;
      case 'game_end':
        bootSessionRef.current = null;
        writeLiveSession(null);
        if (data.won) SFX.victory(); else if (data.tie) SFX.tie(); else SFX.defeat();
        setResult(data);
        setScore(data.finalScore);
        setStage('finished');
        setOpponents((prev) => data.others.map((upd) => ({ ...prev.find((o) => o.id === upd.id), ...upd })));
        statsHook.handleStatsMessage(data);
        break;
      case 'stats':
        statsHook.handleStatsMessage(data);
        break;
      case 'error':
        matchActionRef.current = null;
        clearPending();
        setStage('error');
        break;
      default:
        social.handleMessage(data);
        feed.handleMessage(data);
        break;
    }
  };

  useEffect(() => {
    const canIdentify = clientId && firebaseUser && typeof firebaseUser.getIdToken === 'function';
    // A name that existed when the page loaded can be used to recover a game
    // after refresh. First-time visitors do not connect while still typing
    // their name; they identify after entering Home instead.
    const recoveringFromRefresh = stage === 'join' && !!bootNameRef.current.trim();
    if (canIdentify && (stage === 'home' || recoveringFromRefresh)) {
      connect({ type: 'identify' });
    }
  }, [stage, clientId, firebaseUser]);

  const [soloMode, setSoloMode] = useState(false);
  // `pending` blocks a second matchmaking request (double-tap, rapid-fire
  // click) from going out before the server answers the first one — nothing
  // previously stopped duplicate join/solo/create_room/join_room/start_room
  // sends from the same click burst. Cleared by every terminal server
  // response (see attachHandlers) and defensively after a short timeout in
  // case a response is somehow missed.
  const beginPending = useCallback(() => {
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    setPending(true);
    pendingTimerRef.current = setTimeout(() => {
      pendingTimerRef.current = null;
      setPending(false);
    }, 15000);
  }, []);

  function startWithCategory(catKey) {
    if (pending) return;
    const action = { type: soloMode ? 'solo' : 'join', category: catKey };
    matchActionRef.current = action;
    beginPending();
    connect(action);
  }

  function quickMatch() {
    if (pending) return;
    const action = { type: soloMode ? 'solo' : 'join', category: null };
    matchActionRef.current = action;
    beginPending();
    connect(action);
  }

  function createRoom() {
    if (pending) return;
    beginPending();
    connect({ type: 'create_room', category: null });
  }

  function joinRoom(code) {
    if (!code || code.trim().length < 4 || pending) return;
    setJoinError(false);
    beginPending();
    connect({ type: 'join_room', code: code.trim().toUpperCase() });
  }

  function startRoomMatch() {
    if (!room || pending) return;
    beginPending();
    connect({ type: 'start_room', code: room.code });
  }

  // Tapping the "Themes" nav tab directly (not via a family tile on Home)
  // should land on the family overview, not silently reuse whichever family
  // was last opened.
  const onNav = useCallback((s) => { if (s === 'categories') setCategoryFamily(null); setStage(s); }, []);

  function answer(index) {
    if (selected !== null || reveal || reconnecting) return;
    // Only mark the answer as "selected" once it's actually been sent — the
    // old code called setSelected unconditionally before checking the
    // socket, so if the connection had silently dropped the button would
    // still highlight as picked while nothing was transmitted, locking the
    // player into a screen that looks answered but never gets a result.
    if (sendSocket({ type: 'answer', answerIndex: index })) {
      SFX.select();
      setSelected(index);
    } else {
      scheduleRecovery();
    }
  }

  const reportQuestion = useCallback(() => {
    if (reported) return;
    sendSocket({ type: 'report' });
  }, [reported]);

  // Keeps the same (already-identified) connection instead of closing and
  // reopening it — the backend now recognizes a just-finished game as free
  // to leave immediately, so there's no need to force a fresh connection
  // between matches. That close/reopen used to race against the new
  // socket's handshake on any real network latency, occasionally dropping
  // the identify message that links a rematch's stats to the player.
  const playAgain = useCallback(() => {
    bootSessionRef.current = null;
    writeLiveSession(null);
    matchActionRef.current = null;
    setResult(null); setQuestion(null); setIntro(null); setReveal(null);
    setSelected(null); setFriendRequestSent({}); setRoom(null);
    social.clearGameChat();
    setStage('home');
  }, [social]);

  // "New opponent" / "New game" previously reused playAgain — identical to
  // "Back Home" — so the button's own label ("nouvel adversaire") was a
  // promise it never kept: the player landed on Home and had to manually
  // tap Quick Play again. This mirrors what `rematch` already does, minus
  // forcing the same category/opponent.
  function newMatch() { playAgain(); quickMatch(); }

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
        <HomeContent
          name={name} avatar={avatar} soloMode={soloMode} setSoloMode={setSoloMode}
          quickMatch={quickMatch} startWithCategory={startWithCategory}
          onOpenProfile={() => setStage('profile')} onSeeAll={(fam) => { setCategoryFamily(fam || null); setStage('categories'); }}
          createRoom={createRoom} onOpenEnterCode={() => { setJoinError(false); setJoinCode(''); setStage('enter_code'); }}
          pending={pending}
        />
        <NavBar active="home" onNav={onNav} onQuickMatch={quickMatch} />
      </div>
    );
  }

  if (stage === 'room_wait' && room) {
    const copyCode = () => {
      try {
        navigator.clipboard.writeText(room.code);
        setCopied(true);
        if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => { setCopied(false); copyTimerRef.current = null; }, 1500);
      } catch {}
    };
    const cancel = () => {
      // If the socket is alive, leave explicitly and keep the authenticated
      // connection. If it is already down, cancel the scheduled reconnect so
      // the client cannot reattach to a lobby the user just chose to leave.
      bootSessionRef.current = null;
      writeLiveSession(null);
      setSkipRoomRecovery(true);
      if (!sendSocket({ type: 'leave_room' })) closeSocket();
      setRoom(null);
      setStage('home');
    };
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
        <EnterCodeContent
          joinCode={joinCode} setJoinCode={setJoinCode} joinError={joinError} setJoinError={setJoinError}
          joinRoom={joinRoom} onBack={() => setStage('home')} pending={pending}
        />
      </div>);
  }

  if (stage === 'categories') {
    return (
      <div className="app app-nav app-top">
        <TopControls {...topProps} />
        <CategoriesContent startWithCategory={startWithCategory} onBack={() => setStage('home')} initialFamily={categoryFamily} pending={pending} />
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
            <h2>{t('accueil')}</h2>
          </div>
          <FeedScreen feed={feed} />
        </div>
        <NavBar active="feed" onNav={onNav} onQuickMatch={quickMatch} />
      </div>
    );
  }

  if (stage === 'profile') {
    return (
      <div className="app app-nav app-top"><TopControls {...topProps} />
        <ProfileContent
          avatar={avatar} name={name} stats={statsHook.stats}
          isGoogleLinked={!!(firebaseUser && !firebaseUser.isAnonymous)} googleEmail={firebaseUser?.email}
          linkGoogle={linkGoogle} linking={linking} clientId={clientId} social={social}
        />
        <NavBar active="profile" onNav={onNav} onQuickMatch={quickMatch} />
      </div>);
  }

  if (stage === 'playing' && reconnecting) {
    return (
      <div className="app game-bg"><TopControls {...topProps} />
        <div className="container center">
          <h2 className="logo">Reconnexion…</h2>
          <p className="tagline">La partie est conservée pendant quelques secondes.</p>
        </div>
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div className="app game-bg"><TopControls {...topProps} />
        <WaitingContent avatar={avatar} name={name} />
      </div>);
  }

  if (stage === 'playing' && intro && !question) {
    return (
      <div className="app game-bg"><TopControls {...topProps} />
        <RoundIntroContent intro={intro} totalRounds={totalRounds} />
      </div>);
  }

  if (stage === 'playing' && question) {
    return (
      <div className="app game-bg"><TopControls {...topProps} />
        <QuestionContent
          question={question} timeLeft={timeLeft} reveal={reveal} selected={selected} answer={answer}
          opponents={opponents} avatar={avatar} name={name} score={score}
          reportQuestion={reportQuestion} reported={reported} social={social} GameChat={GameChat}
        />
      </div>);
  }

  if (stage === 'finished' && result) {
    const addFriend = (targetClientId) => {
      social.addFriend(targetClientId);
      setFriendRequestSent((prev) => ({ ...prev, [targetClientId]: true }));
    };
    return (
      <div className="app game-bg"><TopControls {...topProps} />
        <FinishedContent
          result={result} opponents={opponents} myId={myId} social={social}
          friendRequestSent={friendRequestSent} addFriend={addFriend}
          playAgain={playAgain} rematch={() => { playAgain(); quickMatch(); }} newMatch={newMatch}
        />
      </div>);
  }

  if (stage === 'error') {
    return (
      <div className="app"><TopControls {...topProps} />
        <ErrorScreen onRetry={() => window.location.reload()} />
      </div>);
  }

  return null;
}
