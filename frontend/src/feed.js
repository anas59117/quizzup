import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { CATEGORIES, Icon } from './ui';
import { useI18n } from './i18n';
import { topicTitleKey, topicLabel } from './players';

// The "Accueil" topic feed from the original QuizUp: short posts tagged with
// a topic, with a lightning-bolt reaction. The feed can be narrowed to one
// theme's community or to the players you follow.
export function useFeed(wsRef) {
  const [posts, setPosts] = useState([]);
  const [reportedIds, setReportedIds] = useState(() => new Set());
  const [filter, setFilterState] = useState({ scope: 'all', category: null });
  const filterRef = useRef(filter);

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
      case 'feed_list': {
        // Ignore a late reply for a filter the user already left.
        const f = filterRef.current;
        const replyCategory = data.category || null;
        const replyScope = data.scope || 'all';
        if (replyCategory !== f.category || replyScope !== f.scope) break;
        setPosts(Array.isArray(data.posts) ? data.posts : []);
        break;
      }
      case 'post_created': {
        const f = filterRef.current;
        if (f.scope === 'following') break; // the server list is the source of truth there
        if (f.category && data.post.category !== f.category) break;
        // Guards against a double-insert if the same identity has two
        // sockets open (two tabs/devices) and both receive the broadcast.
        setPosts((p) => (p.some((post) => post.id === data.post.id) ? p : [data.post, ...p]));
        break;
      }
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

  const setFilter = useCallback((next) => {
    const f = { scope: next.scope === 'following' ? 'following' : 'all', category: next.category || null };
    filterRef.current = f;
    setFilterState(f);
    setPosts([]);
    send({ type: 'feed_list', scope: f.scope, category: f.category || undefined });
  }, [send]);

  const createPost = useCallback((category, text) => {
    if (!text.trim()) return false;
    return send({ type: 'post_create', category, text: text.trim() });
  }, [send]);
  const react = useCallback((postId) => send({ type: 'post_react', postId }), [send]);
  const report = useCallback((postId) => send({ type: 'post_report', postId }), [send]);
  const refresh = useCallback(() => {
    const f = filterRef.current;
    return send({ type: 'feed_list', scope: f.scope, category: f.category || undefined });
  }, [send]);

  return { posts, reportedIds, filter, setFilter, handleMessage, createPost, react, report, refresh };
}

function timeAgo(ts, lang) {
  const dayUnit = lang === 'fr' ? 'j' : 'd';
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.round(hours / 24)} ${dayUnit}`;
}

function TopicHeader({ categoryKey, myTopic, onPlay, onLeaderboard }) {
  const { t } = useI18n();
  const level = myTopic?.level || 1;
  const pct = myTopic?.xpForLevel ? Math.min(100, Math.round((myTopic.xpIntoLevel / myTopic.xpForLevel) * 100)) : 0;
  return (
    <div className="topic-header">
      <div className="topic-header-top">
        <div>
          <div className="status-label">{t('topicCommunity')}</div>
          <h3>{topicLabel(categoryKey)}</h3>
        </div>
        <div className="topic-header-level">
          <span className="topic-level-badge">{level}</span>
          <small>{t(topicTitleKey(level))}</small>
        </div>
      </div>
      <div className="topic-level-bar" aria-label={`${t('yourTopicLevel')} ${level}`}><span style={{ width: `${pct}%` }} /></div>
      <div className="topic-header-actions">
        <button className="btn" onClick={() => onPlay(categoryKey)}>{t('playTopic')}</button>
        <button className="social-btn outline" onClick={() => onLeaderboard(categoryKey)}>
          <Icon name="trophy" size={16} /> {t('topicLeaderboard')}
        </button>
      </div>
    </div>
  );
}

export function FeedScreen({ feed, myTopics = [], onPlayTopic, onOpenTopicLeaderboard, onOpenPlayer }) {
  const { t, lang } = useI18n();
  const { scope, category: filterCategory } = feed.filter;
  const [category, setCategory] = useState(filterCategory || CATEGORIES[0].key);
  const [draft, setDraft] = useState('');
  const sortedCategories = useMemo(
    () => [...CATEGORIES].sort((a, b) => a.label.localeCompare(b.label, lang)),
    [lang]
  );

  // Posting from inside a theme community tags the post with that theme.
  useEffect(() => { if (filterCategory) setCategory(filterCategory); }, [filterCategory]);

  const submit = () => {
    if (!draft.trim()) return;
    if (feed.createPost(category, draft)) setDraft('');
  };

  const myTopic = filterCategory ? myTopics.find((x) => x.key === filterCategory) : null;
  const emptyText = scope === 'following' ? t('noFollowingPosts') : filterCategory ? t('noTopicPosts') : t('noPosts');

  return (
    <div className="feed-screen">
      <div className="feed-filters">
        <div className="feed-tabs" role="tablist">
          <button role="tab" aria-selected={scope === 'all' && !filterCategory}
            className={scope === 'all' && !filterCategory ? 'active' : ''}
            onClick={() => feed.setFilter({ scope: 'all' })}>{t('feedAll')}</button>
          <button role="tab" aria-selected={scope === 'following'}
            className={scope === 'following' ? 'active' : ''}
            onClick={() => feed.setFilter({ scope: 'following' })}>{t('feedFollowing')}</button>
        </div>
        <select className="feed-cat-select" aria-label={t('allThemes')}
          value={filterCategory || ''}
          onChange={(e) => feed.setFilter({ scope: 'all', category: e.target.value || null })}>
          <option value="">{t('allThemes')}</option>
          {sortedCategories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      </div>

      {filterCategory && (
        <TopicHeader categoryKey={filterCategory} myTopic={myTopic}
          onPlay={onPlayTopic} onLeaderboard={onOpenTopicLeaderboard} />
      )}

      <div className="feed-composer">
        {!filterCategory && (
          <select className="feed-cat-select" aria-label={t('postCategory')} value={category} onChange={(e) => setCategory(e.target.value)}>
            {sortedCategories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
          </select>
        )}
        <input className="feed-input" value={draft} maxLength={240} placeholder={t('whatsNew')}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} />
        <button className="feed-post-btn" onClick={submit} disabled={!draft.trim()}>{t('post')}</button>
      </div>

      {feed.posts.length === 0 && <div className="friends-empty">{emptyText}</div>}
      {feed.posts.map((p) => (
        <div key={p.id} className="feed-post">
          <div className="feed-post-ava">{p.authorAvatar}</div>
          <div className="feed-post-body">
            <div className="feed-post-head">
              {p.authorId && onOpenPlayer ? (
                <button className="feed-post-author as-link" onClick={() => onOpenPlayer(p.authorId)}>{p.authorName}</button>
              ) : (
                <span className="feed-post-author">{p.authorName}</span>
              )}
              <span className="feed-post-meta">
                {t('postedIn')}{' '}
                {p.category ? (
                  <button className="feed-post-cat as-link" onClick={() => feed.setFilter({ scope: 'all', category: p.category })}>
                    {topicLabel(p.category)}
                  </button>
                ) : null}
                {' · '}{timeAgo(p.createdAt, lang)}
              </span>
            </div>
            <div className="feed-post-text">{p.text}</div>
            <div className="feed-post-actions">
              <button className="feed-react-btn" onClick={() => feed.react(p.id)}>{'⚡'} {p.reactions}</button>
              <button className="feed-report-btn" onClick={() => feed.report(p.id)} disabled={feed.reportedIds.has(p.id)}>
                {feed.reportedIds.has(p.id) ? t('signaled') : t('signal')}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
