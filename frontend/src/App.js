import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import './App.css';
import SFX from './sounds';
import music from './music';
import { useSocial, GameChat } from './social';
import { ensureSignedIn, linkGoogleAccount, preloadFirebase } from './firebase';
import { useStats } from './stats';
import { useFeed, FeedScreen } from './feed';
import { usePlayers, PlayerSheet, topicLabel } from './players';
import { RoomLobby } from './multiplayer';
import { AVATARS, useTheme, TopControls, NavBar, ErrorScreen, Toast } from './ui';
import { HomeContent, EnterCodeContent, CategoriesContent, ProfileContent, LeaderboardContent, WaitingContent, RoundIntroContent, QuestionContent, FinishedContent } from './screens';
import { useI18n } from './i18n';
import { useGameSocket } from './useGameSocket';

const LIVE_SESSION_KEY = 'quizzup-live-session';
const HISTORY_KEY = 'quizzup';
const BROWSABLE_STAGES = new Set(['home', 'feed', 'categories', 'profile', 'leaderboard', 'enter_code']);
const SESSION_STAGES = new Set(['waiting', 'room_wait', 'playing', 'finished', 'error']);

function browserLocation(stage, family) {
  if (SESSION_STAGES.has(stage)) return { stage: 'session', family: null };
  if (BROWSABLE_STAGES.has(stage)) return { stage, family: stage === 'categories' ? family : null };
  return null; // The brief boot splash is not a page in browser history.
}

function sameBrowserLocation(a, b) {
  return a?.stage === b?.stage && a?.family === b?.family;
}

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
  const [fatalReason, setFatalReason] = useState('connection');
  const [fatalCode, setFatalCode] = useState('');
  const [categoryFamily, setCategoryFamily] = useState(null);
  const lastBrowserLocationRef = useRef(null);
  const restoringBrowserHistoryRef = useRef(false);
  const browserBackHandlerRef = useRef(null);
  const [name, setName] = useState(() => {
    // No sign-up screen: first-time visitors get a generated pseudo they can
    // change later in Profile, and go straight to Home.
    let saved = '';
    try { saved = localStorage.getItem('quizzup-name') || ''; } catch { /* ignore */ }
    return saved.trim() ? saved : `Joueur${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [avatar, setAvatar] = useState(() => {
    let saved = '';
    try { saved = localStorage.getItem('quizzup-avatar') || ''; } catch { /* ignore */ }
    return saved || AVATARS[Math.floor(Math.random() * AVATARS.length)];
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
  const [rematchWaiting, setRematchWaiting] = useState(false);
  const [rematchStarting, setRematchStarting] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState(false);
  const [copied, setCopied] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [linking, setLinking] = useState(false);
  const [pending, setPending] = useState(false);
  const [toast, setToast] = useState(null);
  const [leaderboard, setLeaderboard] = useState({ entries: [], total: 0, yourRank: null });
  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [leaderboardCategory, setLeaderboardCategory] = useState(null);
  const [leaderboardReturn, setLeaderboardReturn] = useState('profile');
  const leaderboardCategoryRef = useRef(null);
  const tickRef = useRef(null);
  // Keeps preloading <img> objects alive until their download finishes.
  const preloadedImagesRef = useRef(new Map());
  const copyTimerRef = useRef(null);
  const pendingTimerRef = useRef(null);
  const toastTimerRef = useRef(null);
  const bootNameRef = useRef(name);
  const bootSessionRef = useRef(readLiveSession());
  const matchActionRef = useRef(null);
  const cancelQueueRef = useRef(false);
  const afterQueueExitRef = useRef(null);
  const [skipRoomRecovery, setSkipRoomRecovery] = useState(false);
  const messageHandlerRef = useRef(null);

  const clearPending = useCallback(() => {
    if (pendingTimerRef.current) {
      clearTimeout(pendingTimerRef.current);
      pendingTimerRef.current = null;
    }
    setPending(false);
  }, []);

  const showToast = useCallback((message, tone = 'info', duration = 3200) => {
    if (!message) return;
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message, tone });
    toastTimerRef.current = setTimeout(() => {
      toastTimerRef.current = null;
      setToast(null);
    }, duration);
  }, []);

  const dismissToast = useCallback(() => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = null;
    setToast(null);
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
    onFatalError: (err) => {
      cancelQueueRef.current = false;
      afterQueueExitRef.current = null;
      setFatalReason('connection');
      setFatalCode(err?.code || '');
      setStage('error');
    },
    onPendingClear: clearPending,
  });

  const social = useSocial(wsRef);
  const statsHook = useStats();
  const feed = useFeed(wsRef);
  const players = usePlayers(wsRef);
  const clientId = firebaseUser?.uid || null;

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    if (pendingTimerRef.current) clearTimeout(pendingTimerRef.current);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
  }, []);

  // The authoritative backend requires a cryptographically verified identity.
  // Guest mode uses a backend-signed token; Google linking remains optional.
  useEffect(() => {
    let cancelled = false;
    ensureSignedIn()
      .then((user) => { if (!cancelled) setFirebaseUser(user); })
      .catch((err) => {
        console.error('Identity bootstrap failed', err);
        if (!cancelled) {
          setFatalReason('auth');
          setFatalCode(err?.code || err?.message || '');
          setStage('error');
        }
      });
    return () => { cancelled = true; };
  }, []);

  // Fetch the Google-link code only when the profile (where the button is)
  // opens, so the popup still opens instantly on click.
  const googleLinked = !!(firebaseUser && !firebaseUser.isAnonymous);
  useEffect(() => {
    if (stage === 'profile' && !googleLinked) preloadFirebase();
  }, [stage, googleLinked]);

  const linkGoogle = useCallback(async () => {
    setLinking(true);
    try {
      const result = await linkGoogleAccount();
      setFirebaseUser(result.user);
      showToast(t('googleLinked'), 'success');
    } catch (err) {
      console.error('Google link failed', err);
      showToast(t('googleLinkUnavailable'), 'error', 4500);
    } finally {
      setLinking(false);
    }
  }, [showToast, t]);

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
    if (stage === 'home' || stage === 'categories' || stage === 'profile' || stage === 'leaderboard' || stage === 'enter_code') {
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
        if (stage === 'feed') feed.refresh();
        if (stage === 'leaderboard' && !data.queuedActionFlushed) {
          setLeaderboardLoading(true);
          if (!sendSocket({ type: 'leaderboard_list', category: leaderboardCategoryRef.current || undefined })) setLeaderboardLoading(false);
        }
        if (cancelQueueRef.current && stage === 'waiting') {
          if (!data.queuedActionFlushed) sendSocket({ type: 'cancel_queue' });
          break;
        }

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
        cancelQueueRef.current = false;
        afterQueueExitRef.current = null;
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
      case 'queue_cancelled': {
        if (!cancelQueueRef.current) break;
        const nextAction = afterQueueExitRef.current;
        cancelQueueRef.current = false;
        afterQueueExitRef.current = null;
        matchActionRef.current = null;
        clearPending();
        setStage('home');
        if (nextAction) {
          setSoloMode(true);
          matchActionRef.current = nextAction;
          beginPending();
          if (!connect(nextAction)) {
            matchActionRef.current = null;
            clearPending();
            showToast(t('matchStartUnavailable'), 'error');
          }
        }
        break;
      }
      case 'queue_cancel_failed':
        cancelQueueRef.current = false;
        afterQueueExitRef.current = null;
        clearPending();
        break;
      case 'room_created':
      case 'room_update':
        setSkipRoomRecovery(false);
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
        showToast(t('alreadyPlaying'), 'info');
        break;
      case 'rematch_waiting':
        clearPending();
        setRematchWaiting(true);
        setRematchStarting(false);
        break;
      case 'rematch_starting':
        clearPending();
        setRematchWaiting(false);
        setRematchStarting(true);
        break;
      case 'rematch_unavailable':
      case 'rematch_cancelled':
        clearPending();
        setRematchWaiting(false);
        setRematchStarting(false);
        break;
      case 'match_aborted':
        cancelQueueRef.current = false;
        afterQueueExitRef.current = null;
        matchActionRef.current = null;
        bootSessionRef.current = null;
        writeLiveSession(null);
        clearPending();
        setRoom(null);
        setStage('home');
        break;
      case 'rate_limited':
        clearPending();
        if (stage === 'leaderboard') setLeaderboardLoading(false);
        showToast(t('slowDown'), 'error');
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
        setRematchWaiting(false);
        setRematchStarting(false);
        cancelQueueRef.current = false;
        afterQueueExitRef.current = null;
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
        if (Array.isArray(data.preloadImages)) {
          const cache = preloadedImagesRef.current;
          data.preloadImages.forEach((src) => {
            if (typeof src !== 'string' || cache.has(src)) return;
            const img = new window.Image();
            img.decoding = 'async';
            img.src = src;
            cache.set(src, img);
            if (cache.size > 40) cache.delete(cache.keys().next().value);
          });
        }
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
        setRematchWaiting(false);
        setRematchStarting(false);
        bootSessionRef.current = null;
        writeLiveSession(null);
        if (data.won) SFX.victory(); else if (data.tie) SFX.tie(); else SFX.defeat();
        setResult(data);
        setScore(data.finalScore);
        setStage('finished');
        setOpponents((prev) => data.others.map((upd) => ({ ...prev.find((o) => o.id === upd.id), ...upd })));
        statsHook.handleStatsMessage(data);
        if (data.dayStreakUp && data.dayStreak > 1) showToast(t('dayStreakUp', { n: data.dayStreak }), 'success', 4500);
        break;
      case 'notification':
        if (data.notification?.type === 'friend_overtook') {
          showToast(t('friendOvertook', { name: data.notification.fromName, topic: topicLabel(data.notification.category) }), 'info', 5000);
        }
        break;
      case 'notifications': {
        const list = Array.isArray(data.notifications) ? data.notifications.filter((n) => n?.type === 'friend_overtook') : [];
        if (list.length === 1) {
          showToast(t('friendOvertook', { name: list[0].fromName, topic: topicLabel(list[0].category) }), 'info', 5000);
        } else if (list.length > 1) {
          showToast(t('friendsOvertookMany', { n: list.length }), 'info', 5000);
        }
        break;
      }
      case 'stats':
        statsHook.handleStatsMessage(data);
        break;
      case 'profile_updated':
        clearPending();
        if (data.profile) {
          if (data.profile.name) setName(data.profile.name);
          if (data.profile.avatar) setAvatar(data.profile.avatar);
        }
        showToast(t('profileUpdated'), 'success');
        break;
      case 'follow_updated':
        players.handleMessage(data);
        if (data.mine) statsHook.handleStatsMessage({ stats: data.mine });
        if (data.reason === 'limit') showToast(t('followLimit'), 'error');
        break;
      case 'new_follower':
        statsHook.handleStatsMessage({ stats: { followers: data.followers } });
        if (data.from?.name) showToast(t('newFollower', { name: data.from.name }), 'success');
        break;
      case 'leaderboard_list':
        // Drop a late reply for a ranking the user already switched away from.
        if ((data.category || null) !== leaderboardCategoryRef.current) break;
        setLeaderboard({
          entries: Array.isArray(data.entries) ? data.entries : [],
          total: Number(data.total) || 0,
          yourRank: Number(data.yourRank) || null,
        });
        setLeaderboardLoading(false);
        break;
      case 'error':
        cancelQueueRef.current = false;
        afterQueueExitRef.current = null;
        matchActionRef.current = null;
        clearPending();
        setFatalReason('connection');
        setFatalCode(data.code || 'SERVER_ERROR');
        setStage('error');
        break;
      default:
        social.handleMessage(data);
        feed.handleMessage(data);
        players.handleMessage(data);
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

  useEffect(() => {
    if (stage === 'feed') feed.refresh();
  }, [stage, feed.refresh]);

  const [soloMode, setSoloMode] = useState(false);
  const [matchCategory, setMatchCategory] = useState(null);
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
    setMatchCategory(catKey);
    const action = { type: soloMode ? 'solo' : 'join', category: catKey };
    matchActionRef.current = action;
    beginPending();
    connect(action);
  }

  function quickMatch() {
    if (pending) return;
    setMatchCategory(null);
    const action = { type: soloMode ? 'solo' : 'join', category: null };
    matchActionRef.current = action;
    beginPending();
    connect(action);
  }

  function cancelMatchmaking(nextAction = null) {
    if (pending) return;
    cancelQueueRef.current = true;
    afterQueueExitRef.current = nextAction;
    matchActionRef.current = null;
    beginPending();
    // Queue the cancellation through authentication/reconnection too. Never
    // start solo until the server confirms the multiplayer queue was left.
    if (!connect({ type: 'cancel_queue' })) {
      cancelQueueRef.current = false;
      afterQueueExitRef.current = null;
      clearPending();
      closeSocket();
      setStage('home');
      showToast(t('matchStartUnavailable'), 'error');
    }
  }

  function switchToSolo() {
    cancelMatchmaking({ type: 'solo', category: matchCategory });
  }

  // Called as an onClick handler too, so a non-string argument means "global".
  function openLeaderboard(category = null, returnTo = 'profile') {
    const cat = typeof category === 'string' ? category : null;
    leaderboardCategoryRef.current = cat;
    setLeaderboardCategory(cat);
    setLeaderboardReturn(typeof returnTo === 'string' ? returnTo : 'profile');
    setLeaderboard({ entries: [], total: 0, yourRank: null });
    setLeaderboardLoading(true);
    setStage('leaderboard');
    if (!connect({ type: 'leaderboard_list', category: cat || undefined })) {
      setLeaderboardLoading(false);
      showToast(t('rankingUnavailable'), 'error');
    }
  }

  // Opens a theme's community page (its filtered feed + level + ranking).
  function openTopic(key) {
    if (!key) return;
    feed.setFilter({ scope: 'all', category: key });
    setStage('feed');
  }

  function saveProfile(nextName, nextAvatar) {
    if (pending) return;
    const cleanName = String(nextName || '').replace(/\s+/g, ' ').trim().slice(0, 20);
    if (!cleanName) return;
    beginPending();
    if (!connect({ type: 'profile_update', name: cleanName, avatar: nextAvatar })) {
      clearPending();
      showToast(t('profileUpdateUnavailable'), 'error');
    }
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
    if (selected !== null || reveal || reconnecting || question?.expired) return;
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
    sendSocket({ type: 'cancel_rematch' });
    setRematchWaiting(false);
    setRematchStarting(false);
    bootSessionRef.current = null;
    writeLiveSession(null);
    matchActionRef.current = null;
    setResult(null); setQuestion(null); setIntro(null); setReveal(null);
    setSelected(null); setRoom(null);
    social.clearGameChat();
    setStage('home');
  }, [social, sendSocket]);

  // "New opponent" / "New game" previously reused playAgain — identical to
  // "Back Home" — so the button's own label ("nouvel adversaire") was a
  // promise it never kept: the player landed on Home and had to manually
  // tap Quick Play again. This mirrors what `rematch` already does, minus
  // forcing the same category/opponent.
  function requestRematch() {
    if (pending || rematchWaiting || rematchStarting) return;
    beginPending();
    if (!connect({ type: 'rematch' })) clearPending();
  }

  function newMatch() { playAgain(); quickMatch(); }

  // React screens do not change the URL. Mirror meaningful screens in the
  // browser's history so the device Back button can restore the prior view.
  useEffect(() => {
    const next = browserLocation(stage, categoryFamily);
    if (!next) return;
    if (restoringBrowserHistoryRef.current) {
      restoringBrowserHistoryRef.current = false;
      lastBrowserLocationRef.current = next;
      return;
    }
    const previous = lastBrowserLocationRef.current;
    if (sameBrowserLocation(previous, next)) return;
    const state = { ...(window.history.state || {}), [HISTORY_KEY]: next };
    if (!previous) {
      if (next.stage === 'session') {
        window.history.replaceState({ ...state, [HISTORY_KEY]: { stage: 'home', family: null } }, '');
        window.history.pushState(state, '');
      } else {
        window.history.replaceState(state, '');
      }
    } else if (previous.stage === 'session' && next.stage !== 'session') {
      window.history.replaceState(state, '');
    } else {
      window.history.pushState(state, '');
    }
    lastBrowserLocationRef.current = next;
  }, [stage, categoryFamily]);

  browserBackHandlerRef.current = (event) => {
    let target = event.state?.[HISTORY_KEY];
    if (!target) return;
    if (target.stage === 'session') {
      // A completed or abandoned match cannot be resurrected by Forward.
      target = { stage: 'home', family: null };
      window.history.replaceState({ ...event.state, [HISTORY_KEY]: target }, '');
    }
    if (!BROWSABLE_STAGES.has(target.stage)) return;
    const current = browserLocation(stage, categoryFamily);
    if (sameBrowserLocation(current, target)) {
      lastBrowserLocationRef.current = target;
      return;
    }
    if (current?.stage === 'session') {
      // Closing the socket also removes the player from a queue or room.
      closeSocket();
      bootSessionRef.current = null;
      writeLiveSession(null);
      setSkipRoomRecovery(true);
      matchActionRef.current = null;
      cancelQueueRef.current = false;
      afterQueueExitRef.current = null;
      clearPending();
      setRematchWaiting(false);
      setRematchStarting(false);
      setRoom(null);
      setResult(null);
      setQuestion(null);
      setIntro(null);
      setReveal(null);
      setSelected(null);
      social.clearGameChat();
    }
    restoringBrowserHistoryRef.current = true;
    setCategoryFamily(target.family || null);
    setStage(target.stage);
  };

  useEffect(() => {
    const onPopState = (event) => browserBackHandlerRef.current(event);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Safety net: never leave someone on the splash if the connection is slow.
  useEffect(() => {
    if (stage !== 'join') return undefined;
    const timer = setTimeout(() => setStage((s) => (s === 'join' ? 'home' : s)), 5000);
    return () => clearTimeout(timer);
  }, [stage]);

  const topProps = useMemo(() => ({ muted, toggleMute, theme, toggleTheme }), [muted, toggleMute, theme, toggleTheme]);

  // --- Screens ---------------------------------------------------------------
  if (stage === 'join') {
    // Brief splash while the saved/generated identity connects and any
    // unfinished game is recovered; then Home (or the recovered match).
    return (
      <div className="app">
        <TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <div className="container center boot-splash" aria-busy="true">
          <div className="join-brandmark">Q</div>
          <h1 className="logo">Quizz<span>Up</span></h1>
          <div className="loading-bar"><div className="loading-fill" /></div>
        </div>
      </div>
    );
  }

  if (stage === 'home') {
    return (
      <div className="app app-nav app-top">
        <TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
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
      <div className="app"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <RoomLobby
          code={room.code} players={room.players} isHost={room.isHost} canStart={room.canStart}
          onStart={startRoomMatch} onCancel={cancel} copied={copied} onCopyCode={copyCode}
        />
      </div>);
  }

  if (stage === 'enter_code') {
    return (
      <div className="app"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <EnterCodeContent
          joinCode={joinCode} setJoinCode={setJoinCode} joinError={joinError} setJoinError={setJoinError}
          joinRoom={joinRoom} onBack={() => setStage('home')} pending={pending}
        />
      </div>);
  }

  if (stage === 'categories') {
    return (
      <div className="app app-nav app-top">
        <TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <CategoriesContent startWithCategory={startWithCategory} onBack={() => setStage('home')}
          family={categoryFamily} onSelectFamily={setCategoryFamily} pending={pending} />
        <NavBar active="categories" onNav={onNav} onQuickMatch={quickMatch} />
      </div>
    );
  }

  if (stage === 'feed') {
    return (
      <div className="app app-nav app-top">
        <TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <div className="container wide">
          <div className="cat-header">
            <h2>{t('accueil')}</h2>
          </div>
          <FeedScreen
            feed={feed}
            myTopics={statsHook.stats.topics || []}
            onPlayTopic={startWithCategory}
            onOpenTopicLeaderboard={(key) => openLeaderboard(key, 'feed')}
            onOpenPlayer={players.open}
          />
        </div>
        <PlayerSheet players={players} social={social} onSelectTopic={openTopic} />
        <NavBar active="feed" onNav={onNav} onQuickMatch={quickMatch} />
      </div>
    );
  }

  if (stage === 'profile') {
    return (
      <div className="app app-nav app-top"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <ProfileContent
          avatar={avatar} name={name} stats={statsHook.stats}
          isGoogleLinked={!!(firebaseUser && !firebaseUser.isAnonymous)} googleEmail={firebaseUser?.email}
          linkGoogle={linkGoogle} linking={linking} clientId={clientId} social={social}
          onOpenLeaderboard={openLeaderboard}
          onSaveProfile={saveProfile} profileSaving={pending}
          onOpenTopic={openTopic}
        />
        <PlayerSheet players={players} social={social} onSelectTopic={openTopic} />
        <NavBar active="profile" onNav={onNav} onQuickMatch={quickMatch} />
      </div>);
  }

  if (stage === 'leaderboard') {
    return (
      <div className="app app-nav app-top"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <LeaderboardContent
          board={leaderboard}
          loading={leaderboardLoading}
          category={leaderboardCategory}
          onChangeCategory={(key) => openLeaderboard(key, leaderboardReturn)}
          onOpenPlayer={players.open}
          onBack={() => setStage(leaderboardReturn)}
        />
        <PlayerSheet players={players} social={social} onSelectTopic={openTopic} />
        <NavBar active="profile" onNav={onNav} onQuickMatch={quickMatch} />
      </div>);
  }


  if (stage === 'playing' && reconnecting) {
    return (
      <div className="app game-bg"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <div className="container center">
          <h2 className="logo">{t('reconnecting')}</h2>
          <p className="tagline">{t('reconnectHold')}</p>
        </div>
      </div>
    );
  }

  if (stage === 'waiting') {
    return (
      <div className="app game-bg"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <WaitingContent
          avatar={avatar} name={name} level={statsHook.stats.level}
          categoryKey={matchCategory}
          onCancel={() => cancelMatchmaking()} onPlaySolo={switchToSolo}
          pending={pending} reconnecting={reconnecting}
        />
      </div>);
  }

  if (stage === 'playing' && intro && !question) {
    return (
      <div className="app game-bg"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <RoundIntroContent intro={intro} totalRounds={totalRounds} />
      </div>);
  }

  if (stage === 'playing' && question) {
    return (
      <div className="app game-bg"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <QuestionContent
          question={question} timeLeft={timeLeft} reveal={reveal} selected={selected} answer={answer}
          opponents={opponents} avatar={avatar} name={name} score={score}
          reportQuestion={reportQuestion} reported={reported} social={social} GameChat={GameChat}
        />
      </div>);
  }

  if (stage === 'finished' && result) {
    return (
      <div className="app game-bg"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <FinishedContent
          result={result} opponents={opponents} myId={myId} social={social}
          addFriend={social.addFriend}
          playAgain={playAgain} rematch={requestRematch}
          rematchWaiting={rematchWaiting} rematchStarting={rematchStarting}
          newMatch={newMatch}
        />
      </div>);
  }

  if (stage === 'error') {
    return (
      <div className="app"><TopControls {...topProps} /><Toast toast={toast} onDismiss={dismissToast} />
        <ErrorScreen reason={fatalReason} code={fatalCode} onRetry={() => window.location.reload()} />
      </div>);
  }

  return null;
}
