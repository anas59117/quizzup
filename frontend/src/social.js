import { initialSocialData, socialDataReducer } from './social-data';
import { useState, useCallback, useRef, useEffect, useReducer } from 'react';
import { useI18n } from './i18n';
import { Icon } from './ui';
import { PlayerAvatar } from './PlayerAvatar';
import { FriendInviteActions } from './FriendInviteActions';

export function useSocial(wsRef, clientId) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState(() => new Set());
  const [legacyDms, setDms] = useState({});
  const [dataState, dispatch] = useReducer(socialDataReducer, initialSocialData);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const activeRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [gameChat, setGameChat] = useState([]);
  const gameChatSeenRef = useRef(0);

  const send = useCallback(
    (obj) => {
      if (!wsRef.current || wsRef.current.readyState !== 1) return false;
      try { wsRef.current.send(JSON.stringify(obj)); } catch { return false; }
      return true;
    },
    [wsRef]
  );

  const handleMessage = useCallback((data) => {
    dispatch({ ...data, clientId });
    if (['dm', 'dm_sent', 'challenge_updated'].includes(data.type)) {
      send({ type: 'conversations_list' });
      if (activeRef.current && typeof document !== 'undefined' && document.visibilityState === 'visible') send({ type: 'dm_read', targetId: activeRef.current });
    }
    if (data.type === 'identified') {
      send({ type: 'conversations_list' });
      if (activeRef.current) send({ type: 'dm_history', targetId: activeRef.current });
    }
    switch (data.type) {
      case 'friends_list': setFriends(data.friends); break;
      case 'friend_requests': setRequests(data.requests); break;
      case 'friend_request_received':
        setRequests((r) => (r.some((x) => x.id === data.from.id) ? r : [...r, data.from]));
        break;
      case 'friend_request_sent':
        setOutgoingRequests((prev) => new Set(prev).add(data.targetId));
        break;
      case 'friend_request_rejected':
        setOutgoingRequests((prev) => {
          const next = new Set(prev);
          next.delete(data.targetId);
          return next;
        });
        break;
      case 'friend_declined':
        setRequests((r) => r.filter((x) => x.id !== data.id));
        break;
      case 'friend_added':
        setFriends((f) => (f.some((x) => x.id === data.friend.id) ? f : [...f, data.friend]));
        setRequests((r) => r.filter((x) => x.id !== data.friend.id));
        setOutgoingRequests((prev) => {
          const next = new Set(prev);
          next.delete(data.friend.id);
          return next;
        });
        break;
      case 'friend_removed': setFriends((f) => f.filter((x) => x.id !== data.id)); break;
      case 'friend_profile_updated':
        if (data.profile?.id) {
          setFriends((f) => f.map((x) => (x.id === data.profile.id ? { ...x, ...data.profile } : x)));
          setRequests((r) => r.map((x) => (x.id === data.profile.id ? { ...x, ...data.profile } : x)));
        }
        break;
      case 'presence': setFriends((f) => f.map((x) => (x.id === data.id ? { ...x, online: data.online } : x))); break;
      case 'dm': if (data.message) break; setDms((c) => ({ ...c, [data.from]: [...(c[data.from] || []), { from: 'them', text: data.text }] })); break;
      case 'dm_sent': if (data.message) break; setDms((c) => ({ ...c, [data.targetId]: [...(c[data.targetId] || []), { from: 'me', text: data.text }] })); break;
      case 'dm_unavailable':
        setDms((c) => ({
          ...c,
          [data.targetId]: [...(c[data.targetId] || []), { from: 'system', kind: 'unavailable' }],
        }));
        break;
      case 'game_chat': setGameChat((m) => [...m, { from: 'them', text: data.text, senderName: data.from }]); break;
      case 'game_chat_sent': setGameChat((m) => [...m, { from: 'me', text: data.text }]); break;
      case 'player_left': setGameChat((m) => [...m, { from: 'system', kind: 'left', name: data.name }]); break;
      case 'player_disconnected': setGameChat((m) => [...m, { from: 'system', kind: 'disconnected', name: data.name }]); break;
      case 'player_reconnected': setGameChat((m) => [...m, { from: 'system', kind: 'reconnected', name: data.name }]); break;
      default: break;
    }
  }, [clientId, send]);

  const addFriend = (targetId) => send({ type: 'friend_request', targetId });
  const acceptFriend = (id) => send({ type: 'friend_accept', requesterId: id });
  const declineFriend = (id) => send({ type: 'friend_decline', requesterId: id });
  const removeFriend = (id) => send({ type: 'friend_remove', targetId: id });
  const sendDM = (targetId, text) => {
    if (!text.trim()) return false;
    const sent = send({ type: 'dm', targetId, text: text.trim(), clientMessageId: globalThis.crypto?.randomUUID?.() || String(Date.now()) });
    if (sent) dispatch({ type: 'pending', key: targetId });
    return sent;
  };
  const sendGameChat = (text) => {
    if (!text.trim()) return false;
    return send({ type: 'game_chat', text: text.trim() });
  };
  const clearGameChat = () => {
    gameChatSeenRef.current = 0;
    setGameChat([]);
  };

  const requestConversations = useCallback(() => {
    const sent = send({ type: 'conversations_list' });
    if (sent) dispatch({ type: 'loading', key: 'conversations' });
    return sent;
  }, [send]);
  const requestHistory = useCallback((targetId, before) => {
    const sent = send({ type: 'dm_history', targetId, ...(before ? { before } : {}) });
    if (sent) dispatch({ type: 'loading', key: targetId });
    return sent;
  }, [send]);
  const markRead = useCallback(targetId => {
    if (activeRef.current !== targetId || document.visibilityState !== 'visible') return false;
    return send({ type: 'dm_read', targetId });
  }, [send]);
  const openConversation = useCallback(targetId => {
    activeRef.current = targetId;
    setActiveConversationId(targetId);
    requestHistory(targetId);
    markRead(targetId);
  }, [requestHistory, markRead]);
  const closeConversation = useCallback(() => { activeRef.current = null; setActiveConversationId(null); }, []);
  const createChallenge = (targetId, category) => {
    const sent = send({ type: 'challenge_create', targetId, category });
    if (sent) dispatch({ type: 'pending', key: `challenge:${targetId}` });
    return sent;
  };
  const respondChallenge = (challengeId, accept) => {
    const sent = send({ type: 'challenge_respond', challengeId, accept });
    if (sent) dispatch({ type: 'pending', key: challengeId });
    return sent;
  };
  useEffect(() => {
    let previous;
    const refresh = () => {
      const socket = wsRef.current;
      const online = socket?.readyState === 1;
      setConnected(online);
      if (online && socket !== previous) {
        previous = socket;
        requestConversations();
        if (activeRef.current) requestHistory(activeRef.current);
      }
      if (!online) previous = null;
    };
    refresh();
    const timer = setInterval(refresh, 1000);
    const visible = () => { if (activeRef.current) markRead(activeRef.current); };
    document.addEventListener('visibilitychange', visible);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [wsRef, requestConversations, requestHistory, markRead]);
  useEffect(() => {
    if (!Object.values(dataState.pendingActions).some(Boolean) && !Object.values(dataState.loading).some(Boolean)) return undefined;
    const timer = setTimeout(() => dispatch({ type: 'social_error', action: 'timeout', code: 'timeout' }), 12000);
    return () => clearTimeout(timer);
  }, [dataState.pendingActions, dataState.loading]);
  const dms = { ...legacyDms, ...Object.fromEntries(Object.entries(dataState.messages).map(([id, list]) => [id, list.map(m => ({ ...m, from: m.fromId === clientId ? 'me' : 'them' }))])) };
  return {
    ...dataState, clientId, connected, activeConversationId, requestConversations, requestHistory,
    openConversation, closeConversation, markRead, createChallenge, respondChallenge,
    friends, requests, outgoingRequests, dms, gameChat, gameChatSeenRef,
    handleMessage, addFriend, acceptFriend, declineFriend, removeFriend,
    sendDM, sendGameChat, clearGameChat,
  };
}

export function FriendsScreen({ social, onInviteFriend, onJoinFriend, pending }) {
  const { t } = useI18n();
  const [openChat, setOpenChat] = useState(null);
  const [draft, setDraft] = useState('');
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [pendingRemove, setPendingRemove] = useState(null);

  useEffect(() => {
    if (pendingRemove && !social.friends.some((friend) => friend.id === pendingRemove)) {
      setOpenChat(null);
      setConfirmRemove(null);
      setPendingRemove(null);
    }
  }, [social.friends, pendingRemove]);

  useEffect(() => {
    if (!pendingRemove) return undefined;
    const timer = setTimeout(() => setPendingRemove(null), 6000);
    return () => clearTimeout(timer);
  }, [pendingRemove]);

  return (
    <div className="friends-screen">
      {social.requests.length > 0 && (
        <div className="friends-block">
          <div className="friends-section-title">{t('friendRequests')}</div>
          {social.requests.map((r) => (
            <div key={r.id} className="friend-row">
              <div className="friend-ava"><PlayerAvatar avatar={r.avatar} /></div>
              <div className="friend-name">{r.name}</div>
              <button className="friend-btn accept" onClick={() => social.acceptFriend(r.id)}>{t('accept')}</button>
              <button
                className="friend-btn decline"
                onClick={() => social.declineFriend(r.id)}
                aria-label={t('decline')}
                title={t('decline')}
              >
                <Icon name="close" size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="friends-section-title">{t('friendsCount', { count: social.friends.length })}</div>
      {social.friends.length === 0 && <div className="friends-empty"><strong>{t('friendsEmptyTitle')}</strong><p>{t('friendsInviteHelp')}</p></div>}
      <FriendInviteActions onInviteFriend={onInviteFriend} onJoinFriend={onJoinFriend} pending={pending} />
      {social.friends.map((f) => (
        <div key={f.id} className="friends-block">
          <div
            className="friend-row"
            role="button"
            tabIndex={0}
            aria-expanded={openChat === f.id}
            onClick={() => {
              setConfirmRemove(null);
              setOpenChat(openChat === f.id ? null : f.id);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setConfirmRemove(null);
                setOpenChat(openChat === f.id ? null : f.id);
              }
            }}
          >
            <div className={`friend-ava ${f.online ? 'online' : ''}`}><PlayerAvatar avatar={f.avatar} /></div>
            <div className="friend-name">{f.name}</div>
            <div className={`friend-status ${f.online ? 'on' : 'off'}`}>{f.online ? t('online') : t('offline')}</div>
          </div>
          {openChat === f.id && (
            <div className="friend-chat">
              <div className="friend-chat-msgs">
                {(social.dms[f.id] || []).map((m, i) => (
                  <div
                    key={i}
                    className={`chat-bubble ${m.from === 'me' ? 'me' : m.from === 'system' ? 'system' : 'them'}`}
                  >
                    {m.kind === 'unavailable' ? t('messageUnavailable') : m.text}
                  </div>
                ))}
              </div>
              <div className="friend-chat-input">
                <input value={draft} maxLength={200} placeholder={t('messagePlaceholder')}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && draft.trim() && social.sendDM(f.id, draft)) setDraft('');
                  }} />
                <button onClick={() => {
                  if (draft.trim() && social.sendDM(f.id, draft)) setDraft('');
                }}>{t('send')}</button>
              </div>
              <button
                className={`friend-remove-link ${confirmRemove === f.id ? 'confirm' : ''}`}
                onClick={() => {
                  if (confirmRemove === f.id) {
                    if (social.removeFriend(f.id)) setPendingRemove(f.id);
                  } else {
                    setConfirmRemove(f.id);
                  }
                }}
                disabled={pendingRemove === f.id}
              >
                {pendingRemove === f.id
                  ? t('removingFriend')
                  : confirmRemove === f.id
                    ? t('confirmRemoveFriend')
                    : t('removeFriend')}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function GameChat({ social }) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [seenCount, setSeenCount] = useState(() => Math.min(
    social.gameChatSeenRef.current,
    social.gameChat.length
  ));
  const endRef = useRef(null);
  const unread = Math.max(0, social.gameChat.length - seenCount);
  useEffect(() => {
    if (open) {
      social.gameChatSeenRef.current = social.gameChat.length;
      setSeenCount(social.gameChat.length);
      endRef.current?.scrollIntoView({ block: 'nearest' });
      return;
    }
    // A new match clears the chat array. Clamp the read cursor as well or a
    // previous game's message count could suppress unread badges in the next.
    setSeenCount((count) => {
      const next = Math.min(count, social.gameChat.length);
      social.gameChatSeenRef.current = next;
      return next;
    });
  }, [social.gameChat, open]);
  return (
    <div className={`game-chat ${open ? 'open' : ''}`}>
      <button
        className="game-chat-toggle"
        onClick={() => setOpen((o) => {
          const next = !o;
          if (next) {
            social.gameChatSeenRef.current = social.gameChat.length;
            setSeenCount(social.gameChat.length);
          }
          return next;
        })}
        aria-label={t('gameChat')}
        title={t('gameChat')}
      >
        <Icon name="chat" size={18} />
        {unread > 0 && !open && <span className="game-chat-count">{unread}</span>}
      </button>
      {open && (
        <div className="game-chat-panel">
          <div className="game-chat-msgs">
            {social.gameChat.map((m, i) => (
              <div key={i} className={`chat-bubble ${m.from === 'me' ? 'me' : m.from === 'system' ? 'system' : 'them'}`}>
                {m.from !== 'me' && m.senderName && <span className="chat-sender">{m.senderName}: </span>}
                {m.from === 'system'
                  ? m.kind === 'left'
                    ? t('chatPlayerLeft', { name: m.name })
                    : m.kind === 'disconnected'
                      ? t('chatPlayerDisconnected', { name: m.name })
                      : m.kind === 'reconnected'
                        ? t('chatPlayerReconnected', { name: m.name })
                        : m.text
                  : m.text}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <div className="game-chat-input">
            <input value={draft} maxLength={100} placeholder={t('sayPlaceholder')}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draft.trim() && social.sendGameChat(draft)) setDraft('');
              }} />
            <button
              onClick={() => {
                if (draft.trim() && social.sendGameChat(draft)) setDraft('');
              }}
              aria-label={t('send')}
              title={t('send')}
            >
              <Icon name="send" size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}



