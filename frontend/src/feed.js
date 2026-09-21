import { useState, useCallback } from 'react';
import { CATEGORIES } from './ui';
import { useI18n } from './i18n';

// The "Accueil" topic feed from the original QuizUp: short posts tagged with
// a topic, with a lightning-bolt reaction — kept alongside social.js's
// friends/chat since it follows the same send/handleMessage shape.
export function useFeed(wsRef) {
  const [posts, setPosts] = useState([]);
  const [reportedIds, setReportedIds] = useState(() => new Set());

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
      case 'feed_list': setPosts(data.posts); break;
      case 'post_created':
        // Guards against a double-insert if the same identity has two
        // sockets open (two tabs/devices) and both receive the broadcast.
        setPosts((p) => (p.some((post) => post.id === data.post.id) ? p : [data.post, ...p]));
        break;
      case 'post_reacted':
        setPosts((p) => p.map((post) => (post.id === data.id ? { ...post, reactions: data.reactions } : post)));
        break;
      case 'post_report_ack':
        setReportedIds((prev) => new Set(prev).add(data.id));
        break;
      case 'post_hidden':
        setPosts((p) => p.filter((post) => post.id !== data.id));
        break;
      default: break;
    }
  }, []);

  const createPost = (category, text) => {
    if (!text.trim()) return false;
    return send({ type: 'post_create', category, text: text.trim() });
  };
  const react = (postId) => send({ type: 'post_react', postId });
  const report = (postId) => send({ type: 'post_report', postId });
  const refresh = () => send({ type: 'feed_list' });

  return { posts, reportedIds, handleMessage, createPost, react, report, refresh };
}

function timeAgo(ts, lang) {
  const dayUnit = lang === 'fr' ? 'j' : 'd';
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} ${dayUnit}`;
}

function categoryLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}

export function FeedScreen({ feed }) {
  const { t, lang } = useI18n();
  const [category, setCategory] = useState(CATEGORIES[0].key);
  const [draft, setDraft] = useState('');

  const submit = () => {
    if (!draft.trim()) return;
    if (feed.createPost(category, draft)) setDraft('');
  };
  const reportPost = (id) => {
    feed.report(id);
  };

  return (
    <div className="feed-screen">
      <div className="feed-composer">
        <select className="feed-cat-select" aria-label={t('postCategory')} value={category} onChange={(e) => setCategory(e.target.value)}>
          {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
        <input className="feed-input" value={draft} maxLength={240} placeholder={t('whatsNew')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
        <button className="feed-post-btn" onClick={submit} disabled={!draft.trim()}>{t('post')}</button>
      </div>
      {feed.posts.length === 0 && <div className="friends-empty">{t('noPosts')}</div>}
      {feed.posts.map((p) => (
        <div key={p.id} className="feed-post">
          <div className="feed-post-ava">{p.authorAvatar}</div>
          <div className="feed-post-body">
            <div className="feed-post-head">
              <span className="feed-post-author">{p.authorName}</span>
              <span className="feed-post-meta">{t('postedIn')} <span className="feed-post-cat">{categoryLabel(p.category)}</span> {'·'} {timeAgo(p.createdAt, lang)}</span>
            </div>
            <div className="feed-post-text">{p.text}</div>
            <div className="feed-post-actions">
              <button className="feed-react-btn" onClick={() => feed.react(p.id)}>{'⚡'} {p.reactions}</button>
              <button className="feed-report-btn" onClick={() => reportPost(p.id)} disabled={feed.reportedIds.has(p.id)}>
                {feed.reportedIds.has(p.id) ? t('signaled') : t('signal')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
