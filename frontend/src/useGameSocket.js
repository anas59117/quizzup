import { useEffect, useRef, useState } from 'react';

const PRODUCTION_WS_URL = 'wss://quizzup-production.up.railway.app/ws';

function getWebSocketUrl() {
  const configured = process.env.REACT_APP_WS_URL?.trim();
  if (configured) return configured;

  const isLocal = (
    window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1'
  );
  if (isLocal) {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.port === '3000'
      ? `${window.location.hostname}:3001`
      : window.location.host;
    return `${proto}//${host}/ws`;
  }

  // Production must never silently fall back to the frontend host: Vercel
  // only serves the React app and has no /ws endpoint. Keeping an explicit
  // Railway fallback makes the deployed app work even if the Vercel env var
  // is missing, while REACT_APP_WS_URL can still override it per environment.
  return PRODUCTION_WS_URL;
}

// Owns transport/authentication/reconnect concerns. Game/UI state stays in
// App.js so protocol events remain easy to review, while socket lifecycle is
// no longer mixed into rendering code.
export function useGameSocket({
  name,
  avatar,
  firebaseUser,
  shouldRecover,
  expectGameRecovery = false,
  expectRoomRecovery = false,
  recoverGameOnIdentify = true,
  recoverRoomOnIdentify = true,
  onMessageRef,
  onFatalError,
  onPendingClear,
}) {
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const identifiedRef = useRef(false);
  const identifySentRef = useRef(false);
  const queuedActionRef = useRef(null);
  const reconnectingRef = useRef(false);
  const boundUidRef = useRef(null);

  const identityRef = useRef({ name, avatar, firebaseUser });
  const shouldRecoverRef = useRef(shouldRecover);
  const expectGameRecoveryRef = useRef(expectGameRecovery);
  const expectRoomRecoveryRef = useRef(expectRoomRecovery);
  const recoverGameOnIdentifyRef = useRef(recoverGameOnIdentify);
  const recoverRoomOnIdentifyRef = useRef(recoverRoomOnIdentify);
  const fatalRef = useRef(onFatalError);
  const clearPendingRef = useRef(onPendingClear);

  const [reconnecting, setReconnecting] = useState(false);

  identityRef.current = { name, avatar, firebaseUser };
  shouldRecoverRef.current = shouldRecover;
  expectGameRecoveryRef.current = expectGameRecovery;
  expectRoomRecoveryRef.current = expectRoomRecovery;
  recoverGameOnIdentifyRef.current = recoverGameOnIdentify;
  recoverRoomOnIdentifyRef.current = recoverRoomOnIdentify;
  fatalRef.current = onFatalError;
  clearPendingRef.current = onPendingClear;

  function clearPending() {
    if (typeof clearPendingRef.current === 'function') clearPendingRef.current();
  }

  function fatal() {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    reconnectingRef.current = false;
    setReconnecting(false);
    clearPending();
    if (typeof fatalRef.current === 'function') fatalRef.current();
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
      fatal();
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
        recoverGame: recoverGameOnIdentifyRef.current,
        recoverRoom: recoverRoomOnIdentifyRef.current,
      }));
    } catch (err) {
      console.error('Firebase token retrieval failed', err);
      identifySentRef.current = false;
      fatal();
    }
  }

  function flushQueuedAction(ws) {
    if (!identifiedRef.current || !queuedActionRef.current) return false;
    const action = queuedActionRef.current;
    queuedActionRef.current = null;
    return sendAction(ws, action);
  }

  function deliver(data) {
    if (onMessageRef && typeof onMessageRef.current === 'function') {
      onMessageRef.current(data);
    }
  }

  function scheduleRecovery() {
    if (reconnectTimerRef.current) return;
    reconnectingRef.current = true;
    setReconnecting(true);

    // Total retry window is below the server's 15s reconnect grace period.
    const delays = [250, 500, 1000, 1500, 2000, 2500, 3000];
    const attempt = reconnectAttemptsRef.current;
    if (attempt >= delays.length) {
      fatal();
      return;
    }

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      reconnectAttemptsRef.current += 1;
      openSocket();
    }, delays[attempt]);
  }

  function attachHandlers(ws) {
    ws.onmessage = (event) => {
      let data;
      try { data = JSON.parse(event.data); } catch { return; }

      if (data.type === 'identified') {
        identifiedRef.current = true;
        identifySentRef.current = false;
        boundUidRef.current = identityRef.current.firebaseUser?.uid || null;

        // Recoveries can require a specific server-side object to still
        // exist (active match or private lobby). If its grace window expired,
        // a plain authenticated socket is not enough: surface a fatal recovery
        // failure instead of leaving the UI on stale state.
        if (reconnectingRef.current && expectGameRecoveryRef.current && data.reconnected === false) {
          fatal();
          return;
        }
        if (reconnectingRef.current && expectRoomRecoveryRef.current && data.roomReconnected === false) {
          fatal();
          return;
        }

        // Matchmaking only needs transport recovery. Private rooms additionally
        // require roomReconnected=true, but once that is confirmed the socket
        // can leave reconnect mode immediately. Active-game recovery is cleared
        // by the earlier game_reconnected snapshot.
        if (
          reconnectingRef.current
          && !expectGameRecoveryRef.current
          && (!expectRoomRecoveryRef.current || data.roomReconnected === true)
        ) {
          if (reconnectTimerRef.current) {
            clearTimeout(reconnectTimerRef.current);
            reconnectTimerRef.current = null;
          }
          reconnectAttemptsRef.current = 0;
          reconnectingRef.current = false;
          setReconnecting(false);
          clearPending();
        }

        const queuedActionFlushed = flushQueuedAction(ws);
        deliver({ ...data, queuedActionFlushed });
        return;
      }

      if (data.type === 'auth_required' || data.type === 'already_connected') {
        queuedActionRef.current = null;
        identifiedRef.current = false;
        identifySentRef.current = false;
        fatal();
        return;
      }

      if (data.type === 'game_reconnected') {
        // The backend only sends this after Firebase token verification.
        // It can arrive just before the separate "identified" ack, so mark
        // the socket usable immediately and avoid a tiny answer-drop window.
        identifiedRef.current = true;
        identifySentRef.current = false;
        if (reconnectTimerRef.current) {
          clearTimeout(reconnectTimerRef.current);
          reconnectTimerRef.current = null;
        }
        reconnectAttemptsRef.current = 0;
        reconnectingRef.current = false;
        setReconnecting(false);
        clearPending();
      }

      deliver(data);
    };

    // Browser WebSocket errors are normally followed by close. Do not mutate
    // pending/recovery state here; doing so can change shouldRecover before
    // the close event gets a chance to schedule the retry.
    ws.onerror = () => {};

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
      identifiedRef.current = false;
      identifySentRef.current = false;

      if (ws.intentionalClose) return;
      if (shouldRecoverRef.current) scheduleRecovery();
      else fatal();
    };
  }

  function openSocket() {
    const current = wsRef.current;
    if (current && (current.readyState === 0 || current.readyState === 1)) return current;

    let ws;
    try {
      ws = new WebSocket(getWebSocketUrl());
    } catch {
      if (shouldRecoverRef.current) scheduleRecovery();
      else fatal();
      return null;
    }

    wsRef.current = ws;
    identifiedRef.current = false;
    identifySentRef.current = false;
    attachHandlers(ws);
    ws.onopen = () => sendIdentify(ws);
    return ws;
  }

  function connect(action) {
    if (action && action.type !== 'identify') {
      queuedActionRef.current = action;
    }

    const user = identityRef.current.firebaseUser;
    if (!user || typeof user.getIdToken !== 'function') return false;

    // If Firebase itself changed account identity, a fresh transport is
    // required because the server deliberately forbids identity switching on
    // an authenticated WebSocket.
    if (boundUidRef.current && boundUidRef.current !== user.uid) {
      closeSocket();
    }

    const current = wsRef.current;
    if (
      action?.type === 'identify'
      && identifiedRef.current
      && current?.readyState === 1
      && !action.force
    ) {
      // Most screen transitions return to Home on an already-authenticated
      // socket. Re-sending Firebase identify here is unnecessary and could
      // consume the server's auth rate-limit during fast navigation.
      return true;
    }

    const ws = openSocket();
    if (!ws) return false;

    if (ws.readyState === 1) {
      if (action?.type === 'identify') {
        sendIdentify(ws);
      } else if (identifiedRef.current) {
        flushQueuedAction(ws);
      } else {
        sendIdentify(ws);
      }
    }
    return true;
  }

  function send(payload) {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1 || !identifiedRef.current) return false;
    ws.send(JSON.stringify(payload));
    return true;
  }

  function closeSocket() {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    queuedActionRef.current = null;
    reconnectAttemptsRef.current = 0;
    reconnectingRef.current = false;
    setReconnecting(false);

    const ws = wsRef.current;
    if (ws) {
      ws.intentionalClose = true;
      ws.close();
      wsRef.current = null;
    }
    identifiedRef.current = false;
    identifySentRef.current = false;
    boundUidRef.current = null;
  }

  useEffect(() => () => {
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    const ws = wsRef.current;
    if (ws) {
      ws.intentionalClose = true;
      ws.close();
    }
  }, []);

  return {
    wsRef,
    connect,
    send,
    closeSocket,
    scheduleRecovery,
    reconnecting,
  };
}
