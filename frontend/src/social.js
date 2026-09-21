import { useState, useCallback, useRef, useEffect } from 'react';
import { useI18n } from './i18n';
import { Icon } from './ui';

export function useSocial(wsRef) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState(() => new Set());
  const [dms, setDms] = useState({}); // targetId -> [{from,text}]
  const [gameChat, setGameChat] = useState([]);

  const send = useCallback(
    (obj) => {
      if (!wsRef.current || wsRef.current.readyState !== 1) return false;
      wsRef.current.send(JSON.stringify(obj));
      return true;
    },
    [wsRef]
  );

  const handleMessage = useCallback((data) => {
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
      case 'dm': setDms((c) => ({ ...c, [data.from]: [...(c[data.from] || []), { from: 'them', text: data.text }] })); break;
      case 'dm_sent': setDms((c) => ({ ...c, [data.targetId]: [...(c[data.targetId] || []), { from: 'me', text: data.text }] })); break;
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
  }, []);

  const addFriend = (targetId) => send({ type: 'friend_request', targetId });
  const acceptFriend = (id) => send({ type: 'friend_accept', requesterId: id });
  const declineFriend = (id) => send({ type: 'friend_decline', requesterId: id });
  const removeFriend = (id) => send({ type: 'friend_remove', targetId: id });
  const sendDM = (targetId, text) => {
    if (!text.trim()) return false;
    return send({ type: 'dm', targetId, text: text.trim() });
  };
  const sendGameChat = (text) => {
    if (!text.trim()) return false;
    return send({ type: 'game_chat', text: text.trim() });
  };
  const clearGameChat = () => setGameChat([]);

  return {
    friends, requests, outgoingRequests, dms, gameChat,
    handleMessage, addFriend, acceptFriend, declineFriend, removeFriend,
    sendDM, sendGameChat, clearGameChat,
  };
}

export function FriendsScreen({ social }) {
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

  return (
    <div className="friends-screen">
      {social.requests.length > 0 && (
        <div className="friends-block">
          <div className="friends-section-title">{t('friendRequests')}</div>
          {social.requests.map((r) => (
            <div key={r.id} className="friend-row">
              <div className="friend-ava">{r.avatar}</div>
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
      {social.friends.length === 0 && <div className="friends-empty">{t('friendsEmpty')}</div>}
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
            <div className={`friend-ava ${f.online ? 'online' : ''}`}>{f.avatar}</div>
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
  const [seenCount, setSeenCount] = useState(0);
  const endRef = useRef(null);
  const unread = Math.max(0, social.gameChat.length - seenCount);
  useEffect(() => {
    if (open) {
      setSeenCount(social.gameChat.length);
      endRef.current?.scrollIntoView({ block: 'nearest' });
      return;
    }
    // A new match clears the chat array. Clamp the read cursor as well or a
    // previous game's message count could suppress unread badges in the next.
    setSeenCount((count) => Math.min(count, social.gameChat.length));
  }, [social.gameChat, open]);
  return (
    <div className={`game-chat ${open ? 'open' : ''}`}>
      <button
        className="game-chat-toggle"
        onClick={() => setOpen((o) => {
          const next = !o;
          if (next) setSeenCount(social.gameChat.length);
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
