import React, { useState, useCallback, useEffect } from 'react';
import { CATEGORIES } from './ui';
import { useI18n } from './i18n';

// ---- Theme levels & titles (QuizUp-style "Expert en Harry Potter") --------

const TITLES = [
  [25, 'titleLegend'],
  [15, 'titleMaster'],
  [10, 'titleExpert'],
  [6, 'titleConnoisseur'],
  [3, 'titleAmateur'],
  [1, 'titleNovice'],
];

export function topicTitleKey(level) {
  const lvl = Number(level) || 1;
  return (TITLES.find(([min]) => lvl >= min) || TITLES[TITLES.length - 1])[1];
}

export function topicLabel(key) {
  return CATEGORIES.find((c) => c.key === key)?.label || key;
}

export function TopicLevelList({ topics, onSelect, compact = false }) {
  const { t } = useI18n();
  if (!topics || !topics.length) return <div className="friends-empty">{t('noTopicsYet')}</div>;
  return (
    <div className={`topic-levels ${compact ? 'compact' : ''}`}>
      {topics.map((topic) => {
        const pct = topic.xpForLevel ? Math.min(100, Math.round((topic.xpIntoLevel / topic.xpForLevel) * 100)) : 0;
        const Tag = onSelect ? 'button' : 'div';
        return (
          <Tag key={topic.key} className="topic-level-row" onClick={onSelect ? () => onSelect(topic.key) : undefined}>
            <span className="topic-level-badge">{topic.level}</span>
            <span className="topic-level-body">
              <strong>{topicLabel(topic.key)}</strong>
              <small>{t(topicTitleKey(topic.level))} · {t('topicGames', { n: topic.games })}</small>
              {!compact && (
                <span className="topic-level-bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></span>
              )}
            </span>
          </Tag>
        );
      })}
    </div>
  );
}

// ---- Viewing other players + following ------------------------------------

export function usePlayers(wsRef) {
  const [viewing, setViewing] = useState(null); // { id, loading, profile, unavailable }

  const send = useCallback((obj) => {
    if (!wsRef.current || wsRef.current.readyState !== 1) return false;
    wsRef.current.send(JSON.stringify(obj));
    return true;
  }, [wsRef]);

  const open = useCallback((targetId) => {
    if (!targetId) return;
    setViewing({ id: targetId, loading: true, profile: null, unavailable: false });
    if (!send({ type: 'player_profile', targetId })) {
      setViewing({ id: targetId, loading: false, profile: null, unavailable: true });
    }
  }, [send]);

  const close = useCallback(() => setViewing(null), []);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'player_profile':
        setViewing((v) => (v && v.id === data.profile?.id ? { ...v, loading: false, profile: data.profile } : v));
        break;
      case 'player_profile_unavailable':
        setViewing((v) => (v && v.id === data.targetId ? { ...v, loading: false, unavailable: true } : v));
        break;
      case 'follow_updated':
        setViewing((v) => (v && v.profile && v.id === data.targetId
          ? {
            ...v,
            pendingFollow: false,
            profile: { ...v.profile, isFollowing: data.isFollowing, followers: data.followers, following: data.following },
          }
          : v));
        break;
      default: break;
    }
  }, []);

  const toggleFollow = useCallback(() => {
    if (!viewing?.profile || viewing.pendingFollow) return;
    const type = viewing.profile.isFollowing ? 'unfollow' : 'follow';
    if (send({ type, targetId: viewing.profile.id })) {
      setViewing((v) => (v ? { ...v, pendingFollow: true } : v));
    }
  }, [viewing, send]);

  return { viewing, open, close, handleMessage, toggleFollow };
}

export function PlayerSheet({ players, social, onSelectTopic }) {
  const { t } = useI18n();
  const v = players.viewing;

  useEffect(() => {
    if (!v) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') players.close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [v, players]);

  if (!v) return null;
  const p = v.profile;
  const requestSent = p && social?.outgoingRequests?.has(p.id);
  const isFriend = p && (p.isFriend || social?.friends?.some((f) => f.id === p.id));

  return (
    <div className="player-sheet-backdrop" onClick={players.close}>
      <div className="player-sheet" role="dialog" aria-modal="true" aria-label={p?.name || t('loadingProfile')}
        onClick={(e) => e.stopPropagation()}>
        <button className="player-sheet-close" onClick={players.close} aria-label={t('close')}>×</button>
        {v.loading && <div className="leaderboard-loading" aria-live="polite">{t('loadingProfile')}</div>}
        {v.unavailable && <div className="friends-empty">{t('playerUnavailable')}</div>}
        {p && (
          <>
            <div className="player-sheet-head">
              <div className="profile-avatar">{p.avatar}</div>
              <div className="profile-name">{p.name}</div>
              <div className="profile-sub">
                {t('level')} {p.level} · {p.online ? t('online') : t('offline')}
              </div>
            </div>
            <div className="follow-counts">
              <div><strong>{p.followers}</strong><small>{t('followers')}</small></div>
              <div><strong>{p.following}</strong><small>{t('followingCount')}</small></div>
              <div><strong>{p.games}</strong><small>{t('games')}</small></div>
            </div>
            {!p.isYou && (
              <div className="player-sheet-actions">
                <button
                  className={`follow-btn ${p.isFollowing ? 'is-following' : ''}`}
                  onClick={players.toggleFollow}
                  disabled={!!v.pendingFollow}
                  aria-pressed={p.isFollowing}
                >
                  {p.isFollowing ? t('followingState') : t('follow')}
                </button>
                {social && (
                  <button
                    className="social-btn outline"
                    onClick={() => social.addFriend(p.id)}
                    disabled={isFriend || requestSent}
                  >
                    {isFriend ? t('alreadyFriends') : requestSent ? t('friendRequestPending') : t('addFriendShort')}
                  </button>
                )}
              </div>
            )}
            <div className="section-title">{t('topicsLabel')}</div>
            <TopicLevelList
              topics={p.topics}
              compact
              onSelect={onSelectTopic ? (key) => { players.close(); onSelectTopic(key); } : undefined}
            />
          </>
        )}
      </div>
    </div>
  );
}
