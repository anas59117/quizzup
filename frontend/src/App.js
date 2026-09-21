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

export default function App() {
  const { t } = useI18n();
  const [theme, toggleTheme] = useTheme();
  const [muted, setMuted] = useState(SFX.muted);
  const toggleMute = useCallback(() => setMuted(SFX.toggle()), []);
  useEffect(() => { music.setMuted(muted); }, [muted]);
  const [stage, setStage] = useState('join');
  const [categoryFamily, setCategoryFamily] = useState(null);
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
  const [reconnecting, setReconnecting] = useState(false);
  const wsRef = useRef(null);
  const tickRef = useRef(null);
  const copyTimerRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const identifiedRef = useRef(false);
  const identifySentRef = useRef(false);
  const queuedActionRef = useRef(null);
  const stageRef = useRef(stage);
  const reconnectingRef = useRef(false);
  const identityRef = useRef({ name, avatar, firebaseUser });
  const [pending, setPending] = useState(false);
  const social = useSocial(wsRef);
  const statsHook = useStats();
  const feed = useFeed(wsRef);
  const clientId = firebaseUser?.uid || null;
  stageRef.current = stage;
  reconnectingRef.current = reconnecting;
  identityRef.current = { name, avatar, firebaseUser };

  useEffect(() => () => {
    if (wsRef.current) { wsRef.current.intentionalClose = true; wsRef.current.close(); }
    if (tickRef.current) clearInterval(tickRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
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

  function wsUrl() {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '3000' ? `${window.location.hostname}:3001` : window.location.host;
    return process.env.REACT_APP_WS_URL || `${proto}//${host}/ws`;
  }

  function sendAction(ws, action) {
    if (!ws || ws.readyState !== 1 || !action) return false;
    const identity = identityRef.current;
    ws.send(JSON.stringify({
      ...action,
      name: identity.name,
      avatar: identity.avatar,
      clientId: identity.firebaseUser?.uid || null,
    }));
    return true;
  }

  async function sendIdentify(ws) {
    if (!ws || ws.readyState !== 1 || identifySentRef.current) return;
    const identity = identityRef.current;
    const user = identity.firebaseUser;
    if (!user || typeof user.getIdToken !== 'function') {
      setPending(false);
      setStage('error');
      return;
    }

    identifySentRef.current = true;
    try {
      const idToken = await user.getIdToken();
      if (wsRef.current !== ws || ws.readyState !== 1) return;
      ws.send(JSON.stringify({
        type: 'identify',
        name: identity.name,
        avatar: identity.avatar,
        clientId: user.uid,
        idToken,
      }));
    } catch (err) {
      console.error('Firebase token retrieval failed', err);
      identifySentRef.current = false;
      setPending(false);
      setStage('error');
    }
  }

  function flushQueuedAction(ws) {
    if (!identifiedRef.current || !queuedActionRef.current) return;
    const action = queuedActionRef.current;
    queuedActionRef.current = null;
    sendAction(ws, action);
  }

  function openSocket() {
    const current = wsRef.current;
    if (current && (current.readyState === 0 || current.readyState === 1)) return current;

    let ws;
    try {
      ws = new WebSocket(wsUrl());
    } catch {
      scheduleRecovery();
      return null;
    }

    wsRef.current = ws;
    identifiedRef.current = false;
    identifySentRef.current = false;
    attachHandlers(ws);
    ws.onopen = () => sendIdentify(ws);
    return ws;
  }

  function scheduleRecovery() {
    if (reconnectTimerRef.current) return;
    setReconnecting(true);
    reconnectingRef.current = true;

    const delays = [250, 500, 1000, 1500, 2000, 2500, 3000];
    const attempt = reconnectAttemptsRef.current;
    if (attempt >= delays.length) {
      setReconnecting(false);
      reconnectingRef.current = false;
      setStage('error');
      return;
    }

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      reconnectAttemptsRef.current += 1;
      openSocket();
    }, delays[attempt]);
  }

  function connect(action) {
    if (action && action.type !== 'identify') queuedActionRef.current = action;

    const ws = openSocket();
    if (!ws) return;

    if (ws.readyState === 1) {
      if (identifiedRef.current) flushQueuedAction(ws);
      else sendIdentify(ws);
    }
  }

  function attachHandlers(ws) {
    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }
      switch (data.type) {
        case 'session':
          setMyId(data.playerId);
          break;
        case 'identified':
          identifiedRef.current = true;
          identifySentRef.current = false;
          if (reconnectingRef.current && data.reconnected === false) {
            setReconnecting(false);
            reconnectingRef.current = false;
            setStage('error');
            return;
          }
          flushQueuedAction(ws);
          break;
        case 'auth_required':
        case 'already_connected':
          queuedActionRef.current = null;
          identifiedRef.current = false;
          identifySentRef.current = false;
          setPending(false);
          setReconnecting(false);
          reconnectingRef.current = false;
          setStage('error');
          break;
        case 'game_reconnected':
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          reconnectAttemptsRef.current = 0;
          setReconnecting(false);
          reconnectingRef.current = false;
          setPending(false);
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
          setPending(false);
          setStage('waiting');
          break;
        case 'room_created':
        case 'room_update':
          setPending(false);
          setRoom({ code: data.code, players: data.players, isHost: data.isHost, canStart: data.canStart });
          setJoinError(false);
          setStage('room_wait');
          break;
        case 'room_not_found':
        case 'room_full':
          setPending(false);
          setJoinError(true);
          break;
        case 'already_playing':
          setPending(false);
          break;
        case 'room_closed':
          setRoom(null);
          setStage('home');
          break;
        case 'game_start':
          SFX.gameStart();
          reconnectAttemptsRef.current = 0;
          setReconnecting(false);
          reconnectingRef.current = false;
          setPending(false);
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
          setOpponents((prev) => prev.map((o) => ({ ...o, answered: false, correct: false })));
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
          setPending(false);
          setStage('error');
          break;
        default:
          social.handleMessage(data);
          feed.handleMessage(data);
          break;
      }
    };

    // Most browser WebSocket errors are followed by close; letting close own
    // recovery avoids racing an error screen against a successful reconnect.
    ws.onerror = () => { setPending(false); };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      identifiedRef.current = false;
      identifySentRef.current = false;
      setPending(false);
      if (ws.intentionalClose) return;

      if (stageRef.current === 'playing') scheduleRecovery();
      else setStage((s) => (s === 'finished' || s === 'join' ? s : 'error'));
    };
  }

  useEffect(() => {
    if (stage === 'home' && clientId && firebaseUser && typeof firebaseUser.getIdToken === 'function') {
      connect({ type: 'identify' });
    }
    // connect intentionally reads the latest identity through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, clientId, firebaseUser]);

  const [soloMode, setSoloMode] = useState(false);
  // `pending` blocks a second matchmaking request (double-tap, rapid-fire
  // click) from going out before the server answers the first one — nothing
  // previously stopped duplicate join/solo/create_room/join_room/start_room
  // sends from the same click burst. Cleared by every terminal server
  // response (see attachHandlers) and defensively after a short timeout in
  // case a response is somehow missed.
  const beginPending = useCallback(() => {
    setPending(true);
    setTimeout(() => setPending(false), 8000);
  }, []);

  const startWithCategory = useCallback((catKey) => {
    if (pending) return;
    beginPending();
    connect({ type: soloMode ? 'solo' : 'join', category: catKey });
  }, [connect, soloMode, pending, beginPending]);

  const quickMatch = useCallback(() => {
    if (pending) return;
    beginPending();
    connect({ type: soloMode ? 'solo' : 'join', category: null });
  }, [connect, soloMode, pending, beginPending]);

  const createRoom = useCallback(() => {
    if (pending) return;
    beginPending();
    connect({ type: 'create_room', category: null });
  }, [connect, pending, beginPending]);

  const joinRoom = useCallback((code) => {
    if (!code || code.trim().length < 4 || pending) return;
    setJoinError(false);
    beginPending();
    connect({ type: 'join_room', code: code.trim().toUpperCase() });
  }, [connect, pending, beginPending]);

  const startRoomMatch = useCallback(() => {
    if (!room || pending) return;
    beginPending();
    connect({ type: 'start_room', code: room.code });
  }, [room, pending, beginPending]);

  // Tapping the "Themes" nav tab directly (not via a family tile on Home)
  // should land on the family overview, not silently reuse whichever family
  // was last opened.
  const onNav = useCallback((s) => { if (s === 'categories') setCategoryFamily(null); setStage(s); }, []);

  const answer = useCallback((index) => {
    if (selected !== null || reveal || reconnecting) return;
    // Only mark the answer as "selected" once it's actually been sent — the
    // old code called setSelected unconditionally before checking the
    // socket, so if the connection had silently dropped the button would
    // still highlight as picked while nothing was transmitted, locking the
    // player into a screen that looks answered but never gets a result.
    if (wsRef.current && wsRef.current.readyState === 1) {
      SFX.select();
      setSelected(index);
      wsRef.current.send(JSON.stringify({ type: 'answer', answerIndex: index }));
    } else {
      scheduleRecovery();
    }
  }, [selected, reveal, reconnecting]);

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

  // "New opponent" / "New game" previously reused playAgain — identical to
  // "Back Home" — so the button's own label ("nouvel adversaire") was a
  // promise it never kept: the player landed on Home and had to manually
  // tap Quick Play again. This mirrors what `rematch` already does, minus
  // forcing the same category/opponent.
  const newMatch = useCallback(() => { playAgain(); quickMatch(); }, [playAgain, quickMatch]);

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
    const cancel = () => { if (wsRef.current) { wsRef.current.intentionalClose = true; wsRef.current.close(); } setRoom(null); setStage('home'); };
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
