// Direction: warm editorial — ivory paper, charcoal ink, QuizzUp red.
// Rules: clear type, quiet hairlines, honest presence and persistent conversations.
// Signature: gold duel invitations embedded in the personal conversation.
import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from './i18n';
import { Icon, CATEGORIES } from './ui';
import { PlayerAvatar } from './PlayerAvatar';
import { FriendInviteActions } from './FriendInviteActions';
import { SOCIAL_COPY } from './social-copy';
import './messenger.css';

export function Messenger({ social, onBack, onOpenPlayer, onInviteFriend, onJoinFriend, pending, initialPeerId }) {
  const { lang } = useI18n();
  const c = SOCIAL_COPY[lang] || SOCIAL_COPY.fr;
  const [query, setQuery] = useState('');
  const [drafts, setDrafts] = useState({});
  const [chooser, setChooser] = useState(false);
  const [sendError, setSendError] = useState(false);
  const endRef = useRef(null);
  const submitted = useRef({});
  const shellRef = useRef(null);
  const id = social.activeConversationId;
  const messages = social.messages?.[id] || [];
  const conversations = social.conversations || [];
  const peers = [...new Map([...conversations.map(item => item.peer), ...social.friends].filter(Boolean).map(peer => [peer.id, peer])).values()];
  const peer = peers.find(item => item.id === id);
  const draft = drafts[id] || '';
  const back = () => { if (chooser) setChooser(false); else if (id) social.closeConversation(); else onBack?.(); };
  useEffect(() => {
    social.requestConversations();
    if (initialPeerId) social.openConversation(initialPeerId);
    return () => social.closeConversation();
    // A mounted messenger owns the visible thread; initial peer is consumed once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => { setChooser(false); setSendError(false); }, [id]);
  useEffect(() => {
    const pending = submitted.current[id];
    if (pending && messages.some(message => message.fromId === social.clientId && message.text === pending.text && !pending.ids.has(message.id))) {
      setDrafts(previous => previous[id]?.trim() === pending.text ? { ...previous, [id]: '' } : previous);
      delete submitted.current[id];
    }
  }, [id, messages, social.clientId]);
  useEffect(() => {
    const children = [...(shellRef.current?.children || [])].filter(child => !child.classList.contains('messenger-sheet'));
    children.forEach(child => { child.inert = chooser; });
    return () => children.forEach(child => { child.inert = false; });
  }, [chooser]);
  useEffect(() => {
    const viewport = window.visualViewport;
    const update = () => shellRef.current?.style.setProperty('--ms-viewport', `${viewport?.height || window.innerHeight}px`);
    update(); viewport?.addEventListener('resize', update);
    return () => viewport?.removeEventListener('resize', update);
  }, []);
  useEffect(() => { endRef.current?.scrollIntoView?.({ block: 'nearest' }); }, [id, messages.length]);
  useEffect(() => {
    const escape = event => { if (event.key === 'Escape') { event.preventDefault(); back(); } };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  });
  const date = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleDateString(lang, { day: 'numeric', month: 'short' });
  };
  const time = value => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '' : parsed.toLocaleTimeString(lang, { hour: '2-digit', minute: '2-digit' });
  };
  const preview = message => !message ? c.newMessage : message.kind === 'challenge' ? c.invite : message.kind === 'result' ? c.result : message.text;
  const theme = category => CATEGORIES.find(item => item.key === category)?.label || category;
  const send = event => {
    event.preventDefault();
    if (!draft.trim() || social.pendingActions?.[id]) return;
    if (social.sendDM(id, draft)) { submitted.current[id] = { text: draft.trim(), ids: new Set(messages.map(message => message.id)) }; setSendError(false); }
    else setSendError(true);
  };
  const challengeCard = message => {
    const challenge = message.challenge;
    if (!challenge) return null;
    const waiting = challenge.status === 'pending' && new Date(challenge.expiresAt).getTime() > Date.now();
    const status = challenge.status === 'pending' && !waiting ? 'expired' : challenge.status;
    return <section className="messenger-duel" aria-label={c.invite}>
      <span className="messenger-kicker"><Icon name="bolt" size={16} /> {c.invite}</span>
      <h3>{theme(challenge.category)}</h3>
      <p>{c[status] || status}</p>
      {waiting && challenge.toId === social.clientId && <div className="messenger-actions">
        <button disabled={social.pendingActions?.[challenge.id] || !social.connected} onClick={() => social.respondChallenge(challenge.id, true)}>{c.accept}</button>
        <button className="quiet" disabled={social.pendingActions?.[challenge.id] || !social.connected} onClick={() => social.respondChallenge(challenge.id, false)}>{c.decline}</button>
      </div>}
      {['completed', 'declined', 'expired'].includes(status) && <button disabled={!social.connected || social.pendingActions?.[`challenge:${id}`]} onClick={() => social.createChallenge(id, challenge.category)}>{c.rematch}</button>}
    </section>;
  };
  const resultCard = message => {
    const result = message.result || {};
    const scores = result.scores || [];
    const own = scores.find(score => score.id === social.clientId)?.score ?? result.score;
    const other = scores.find(score => score.id !== social.clientId)?.score ?? result.opponentScore;
    return <section className="messenger-duel messenger-result"><span className="messenger-kicker"><Icon name="trophy" size={16} />{c.result}</span><h3>{theme(result.category)}</h3>
      {own != null && other != null && <p className="messenger-score"><span>{c.you}<strong>{own}</strong></span><span aria-hidden="true">:</span><span>{peer?.name}<strong>{other}</strong></span></p>}
      <button disabled={!result.category || !social.connected || social.pendingActions?.[`challenge:${id}`]} onClick={() => social.createChallenge(id, result.category)}>{c.rematch}</button></section>;
  };
  return <section ref={shellRef} className={`messenger ${id ? 'is-thread' : ''}`} aria-label={c.title}>
    <header className="messenger-header">
      <button className="messenger-icon" aria-label={c.back} onClick={back}><span aria-hidden="true">←</span></button>
      {id ? <button className="messenger-peer" disabled={!onOpenPlayer} onClick={() => onOpenPlayer?.(id)} aria-label={`${c.profile} · ${peer?.name || ''}`}>
        <span className="messenger-avatar"><PlayerAvatar avatar={peer?.avatar} /></span><span><strong>{peer?.name || c.title}</strong><small>{peer?.online ? c.online : c.offline}</small></span>
      </button> : <div><span className="messenger-kicker">{c.eyebrow}</span><h1>{c.title}{social.unreadCount > 0 && <span className="messenger-total">{social.unreadCount}</span>}</h1></div>}
      {id && <button className="messenger-challenge" onClick={() => setChooser(true)} aria-label={c.challenge}><Icon name="bolt" size={19} /><span>{c.challenge}</span></button>}
    </header>
    {!social.connected && <p className="messenger-notice" role="status">{c.disconnected}</p>}
    {(social.error || sendError) && <div className="messenger-notice error" role="alert">{sendError ? c.failed : c.error}<button onClick={() => { setSendError(false); id ? social.requestHistory(id) : social.requestConversations(); }}>{c.retry}</button></div>}
    {id ? <>
      <div className="messenger-thread" role="log" aria-label={peer?.name || c.title} aria-live="polite">
        {social.hasMore?.[id] && <button className="messenger-more" disabled={social.loading?.[id]} onClick={() => social.requestHistory(id, messages[0]?.id)}>{c.more}</button>}
        {social.loading?.[id] && <p className="messenger-state" role="status">{c.loading}</p>}
        {!social.loading?.[id] && messages.length === 0 && <div className="messenger-empty"><Icon name="chat" size={34} /><h2>{c.start}</h2><p>{c.startHelp}</p></div>}
        {messages.map((message, index) => <React.Fragment key={message.id}>
          {(index === 0 || date(message.createdAt) !== date(messages[index - 1].createdAt)) && <p className="messenger-date">{date(message.createdAt)}</p>}
          <article className={`messenger-message ${message.fromId === social.clientId ? 'own' : ''}`}>
            {message.kind === 'challenge' ? challengeCard(message) : message.kind === 'result' ? resultCard(message) : <p className="messenger-bubble">{message.text}</p>}
            <time dateTime={new Date(message.createdAt).toISOString()}>{time(message.createdAt)}</time>
          </article></React.Fragment>)}<div ref={endRef} />
      </div>
      <form className="messenger-composer" onSubmit={send}>
        <label className="messenger-sr" htmlFor="messenger-draft">{c.placeholder}</label>
        <textarea id="messenger-draft" rows={1} maxLength={200} value={draft} placeholder={c.placeholder} onChange={event => setDrafts(previous => ({ ...previous, [id]: event.target.value }))} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) send(event); }} />
        <button type="submit" disabled={!draft.trim() || !social.connected || social.pendingActions?.[id]} aria-label={social.pendingActions?.[id] ? c.sending : c.send}><Icon name="send" size={20} /></button>
      </form>
    </> : <div className="messenger-inbox">
      <label className="messenger-search"><Icon name="search" size={18} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder={c.search} aria-label={c.search} /></label>
      {social.requests.length > 0 && <details className="messenger-requests"><summary>{c.requests}<span>{social.requests.length}</span></summary>{social.requests.map(request => <div className="messenger-request" key={request.id}><span className="messenger-avatar"><PlayerAvatar avatar={request.avatar} /></span><strong>{request.name}</strong><button onClick={() => social.acceptFriend(request.id)}>{c.accept}</button><button aria-label={`${c.decline} ${request.name}`} onClick={() => social.declineFriend(request.id)}><Icon name="close" size={16} /></button></div>)}</details>}
      {social.loading?.conversations && <p className="messenger-state" role="status">{c.loading}</p>}
      {peers.length === 0 && <div className="messenger-empty"><Icon name="users" size={38} /><h2>{c.empty}</h2><p>{c.emptyHelp}</p></div>}
      {query && !peers.some(item => item.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase())) && <p className="messenger-state">{c.noResults}</p>}
      <div className="messenger-conversations">{peers.filter(item => item.name?.toLocaleLowerCase().includes(query.toLocaleLowerCase())).map(item => {
        const conversation = conversations.find(row => row.peer.id === item.id);
        return <button className="messenger-row" key={item.id} onClick={() => social.openConversation(item.id)}><span className={`messenger-avatar ${item.online ? 'online' : ''}`}><PlayerAvatar avatar={item.avatar} /></span><span className="messenger-row-copy"><strong>{item.name}</strong><span>{preview(conversation?.lastMessage)}</span><small>{item.online ? c.online : c.offline}</small></span><span className="messenger-row-meta"><time>{date(conversation?.lastMessage?.createdAt)}</time>{conversation?.unread > 0 && <b>{conversation.unread}</b>}</span></button>;
      })}</div>
      <FriendInviteActions onInviteFriend={onInviteFriend} onJoinFriend={onJoinFriend} pending={pending} />
    </div>}
    {chooser && <div className="messenger-sheet" role="dialog" aria-modal="true" aria-labelledby="messenger-choose" onKeyDown={event => {
      if (event.key !== 'Tab') return;
      const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')];
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }}><header><h2 id="messenger-choose">{c.choose}</h2><button autoFocus className="messenger-icon" aria-label={c.cancel} onClick={() => setChooser(false)}><Icon name="close" size={20} /></button></header><p>{c.chooseHelp}</p><div className="messenger-themes">{CATEGORIES.map(category => <button disabled={!social.connected || social.pendingActions?.[`challenge:${id}`]} key={category.key} onClick={() => { if (social.createChallenge(id, category.key)) setChooser(false); }}><span>{category.label}</span><Icon name="arrow" size={18} /></button>)}</div></div>}
  </section>;
}




