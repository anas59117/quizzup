import { useState, useCallback, useRef, useEffect } from 'react';

const CLIENT_ID_KEY = 'quizzup-client-id';

// Stable per-browser identity so friends persist across reconnects (no
// account system yet — this is a local anonymous ID, not a login).
export function getClientId() {
  try {
    let id = localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = 'u_' + Math.random().toString(36).slice(2, 11) + Date.now().toString(36);
      localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return 'u_' + Math.random().toString(36).slice(2, 11);
  }
}

export function useSocial(wsRef) {
  const [friends, setFriends] = useState([]);
  const [requests, setRequests] = useState([]);
  const [dms, setDms] = useState({}); // targetId -> [{from,text}]
  const [gameChat, setGameChat] = useState([]);

  const send = useCallback(
    (obj) => { if (wsRef.current && wsRef.current.readyState === 1) wsRef.current.send(JSON.stringify(obj)); },
    [wsRef]
  );

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'friends_list': setFriends(data.friends); break;
      case 'friend_requests': setRequests(data.requests); break;
      case 'friend_request_received': setRequests((r) => [...r, data.from]); break;
      case 'friend_added':
        setFriends((f) => (f.some((x) => x.id === data.friend.id) ? f : [...f, data.friend]));
        setRequests((r) => r.filter((x) => x.id !== data.friend.id));
        break;
      case 'friend_removed': setFriends((f) => f.filter((x) => x.id !== data.id)); break;
      case 'presence': setFriends((f) => f.map((x) => (x.id === data.id ? { ...x, online: data.online } : x))); break;
      case 'dm': setDms((c) => ({ ...c, [data.from]: [...(c[data.from] || []), { from: 'them', text: data.text }] })); break;
      case 'game_chat': setGameChat((m) => [...m, { from: 'them', text: data.text }]); break;
      default: break;
    }
  }, []);

  const addFriend = (targetId) => send({ type: 'friend_request', targetId });
  const acceptFriend = (id) => send({ type: 'friend_accept', requesterId: id });
  const declineFriend = (id) => { send({ type: 'friend_decline', requesterId: id }); setRequests((r) => r.filter((x) => x.id !== id)); };
  const removeFriend = (id) => send({ type: 'friend_remove', targetId: id });
  const sendDM = (targetId, text) => {
    if (!text.trim()) return;
    send({ type: 'dm', targetId, text: text.trim() });
    setDms((c) => ({ ...c, [targetId]: [...(c[targetId] || []), { from: 'me', text: text.trim() }] }));
  };
  const sendGameChat = (text) => {
    if (!text.trim()) return;
    send({ type: 'game_chat', text: text.trim() });
    setGameChat((m) => [...m, { from: 'me', text: text.trim() }]);
  };
  const clearGameChat = () => setGameChat([]);

  return { friends, requests, dms, gameChat, handleMessage, addFriend, acceptFriend, declineFriend, removeFriend, sendDM, sendGameChat, clearGameChat };
}

export function FriendsScreen({ social }) {
  const [openChat, setOpenChat] = useState(null);
  const [draft, setDraft] = useState('');
  return (
    <div className="friends-screen">
      {social.requests.length > 0 && (
        <div className="friends-block">
          <div className="friends-section-title">Friend requests</div>
          {social.requests.map((r) => (
            <div key={r.id} className="friend-row">
              <div className="friend-ava">{r.avatar}</div>
              <div className="friend-name">{r.name}</div>
              <button className="friend-btn accept" onClick={() => social.acceptFriend(r.id)}>Accept</button>
              <button className="friend-btn decline" onClick={() => social.declineFriend(r.id)}>✕</button>
            </div>
          ))}
        </div>
      )}
      <div className="friends-section-title">Friends ({social.friends.length})</div>
      {social.friends.length === 0 && <div className="friends-empty">Add friends after a match to see them here.</div>}
      {social.friends.map((f) => (
        <div key={f.id} className="friends-block">
          <div className="friend-row" onClick={() => setOpenChat(openChat === f.id ? null : f.id)}>
            <div className={`friend-ava ${f.online ? 'online' : ''}`}>{f.avatar}</div>
            <div className="friend-name">{f.name}</div>
            <div className={`friend-status ${f.online ? 'on' : 'off'}`}>{f.online ? 'Online' : 'Offline'}</div>
          </div>
          {openChat === f.id && (
            <div className="friend-chat">
              <div className="friend-chat-msgs">
                {(social.dms[f.id] || []).map((m, i) => (
                  <div key={i} className={`chat-bubble ${m.from === 'me' ? 'me' : 'them'}`}>{m.text}</div>
                ))}
              </div>
              <div className="friend-chat-input">
                <input value={draft} maxLength={200} placeholder="Message…"
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { social.sendDM(f.id, draft); setDraft(''); } }} />
                <button onClick={() => { if (draft.trim()) { social.sendDM(f.id, draft); setDraft(''); } }}>Send</button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function GameChat({ social }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);
  useEffect(() => { if (open) endRef.current?.scrollIntoView({ block: 'nearest' }); }, [social.gameChat, open]);
  return (
    <div className={`game-chat ${open ? 'open' : ''}`}>
      <button className="game-chat-toggle" onClick={() => setOpen((o) => !o)}>
        💬{social.gameChat.length > 0 && !open ? ` ${social.gameChat.length}` : ''}
      </button>
      {open && (
        <div className="game-chat-panel">
          <div className="game-chat-msgs">
            {social.gameChat.map((m, i) => <div key={i} className={`chat-bubble ${m.from === 'me' ? 'me' : 'them'}`}>{m.text}</div>)}
            <div ref={endRef} />
          </div>
          <div className="game-chat-input">
            <input value={draft} maxLength={100} placeholder="Say something…"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && draft.trim()) { social.sendGameChat(draft); setDraft(''); } }} />
            <button onClick={() => { if (draft.trim()) { social.sendGameChat(draft); setDraft(''); } }}>➤</button>
          </div>
        </div>
      )}
    </div>
  );
}
