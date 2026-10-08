import { QuestionContent as EnhancedQuestionContent } from './enhanced-QuestionContent';
import React, { useState, useMemo, useEffect } from 'react';
import { StreakBadge, StreakCalendar } from './DailyStreak';
import { ShareCard } from './ShareCard';
import { AVATARS, CATEGORIES, FAMILIES, categoriesInFamily, normalizeForSearch, famLabel, SoloToggle, CategoryTile, FamilyGrid, SearchBar, PlayerPhoto, LevelRing, Icon } from './ui';
import { PlayerHud, Leaderboard } from './multiplayer';
import { ProfileStats } from './stats';
import { FriendsScreen } from './social';
import { TopicLevelList, topicTitleKey, topicLabel } from './players';
import { useI18n } from './i18n';
import { FRAMES, frameClass, frameLabelKey } from './frames';
import { IdentityCard, IDENTITIES } from './identity';

const FEATURED_TOPIC_KEYS = [
  'ligue_champions', 'rap_fr', 'one_piece', 'marvel',
  'pokemon', 'euphoria', 'nba', 'drapeaux',
];
const FEATURED_TOPIC_LABELS = { nba: 'NBA', drapeaux: 'Drapeaux du monde' };
const FEATURED_TOPICS = FEATURED_TOPIC_KEYS
  .map((key) => {
    const category = CATEGORIES.find((item) => item.key === key);
    return category && {
      ...category,
      label: FEATURED_TOPIC_LABELS[key] || category.label,
      tag: category.tag || '🔥',
    };
  })
  .filter(Boolean);

export function HomeContent({ name, avatar, frame, soloMode, setSoloMode, quickMatch, startWithCategory, onOpenProfile, onSeeAll, createRoom, onOpenEnterCode, pending }) {
  const { t } = useI18n();
  return (
    <div className="container wide">
      <div className="home-head">
        <div className="home-brand">
          <div className="home-brandmark">Q</div>
          <div>
            <div className="home-logo-sm">Quizz<span>Up</span></div>
            <div className="home-greeting">{t('hey', { name })}</div>
          </div>
        </div>
        <button className={`home-avatar-chip${frameClass(frame)}`} onClick={onOpenProfile} aria-label="Open profile">{avatar}</button>
      </div>
      <div className="play-card">
        <div className="play-card-copy">
          <SoloToggle solo={soloMode} onChange={setSoloMode} />
          <div className="play-title">{t('quickPlay')}</div>
          <div className="play-subtitle">{t('randomTopic')}</div>
        </div>
        <button className="quick-play" onClick={quickMatch} disabled={pending} aria-busy={pending || undefined} aria-label={t('quickPlay')}>
          <Icon name="bolt" size={21} />
          <Icon name="arrow" size={20} className="quick-arrow" />
        </button>
      </div>
      <div className="section-title">{t('popularTopics')}</div>
      <div className="topics-scroll">
        {FEATURED_TOPICS.map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />)}
      </div>
      <div className="section-title">
        <span>{t('allTopics')}</span>
        <button className="see-all" onClick={() => onSeeAll()}>{t('seeAll')}</button>
      </div>
      <FamilyGrid onSelect={onSeeAll} />
      <div className="social-row">
        <button className="social-btn" onClick={createRoom} disabled={pending}><Icon name="users" size={18} /> {t('party')}</button>
        <button className="social-btn outline" onClick={onOpenEnterCode}><Icon name="key" size={18} /> {t('joinCode')}</button>
      </div>
    </div>
  );
}

export function EnterCodeContent({ joinCode, setJoinCode, joinError, setJoinError, joinRoom, onBack, pending }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <div className="status-label">{t('joinFriend')}</div>
      <div className="room-code-label">{t('enterCode')}</div>
      <input className={`input code-input ${joinError ? 'err' : ''}`} placeholder="ABC12" value={joinCode} maxLength={5}
        onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(false); }} />
      {/* role="alert" so a screen reader announces the invalid-code error
          immediately, instead of it being silent to anyone not looking. */}
      {joinError && <div className="code-err-msg" role="alert">{t('codeError')}</div>}
      <button className="btn" disabled={joinCode.trim().length < 4 || pending} onClick={() => joinRoom(joinCode)}>{t('joinMatch')}</button>
      <button className="home-themes-link" onClick={onBack}>{t('back')}</button>
    </div>
  );
}

export function CategoriesContent({ startWithCategory, onBack, family, onSelectFamily, pending }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalizeForSearch(query.trim());
    if (!q) return null;
    return CATEGORIES.filter((c) => normalizeForSearch(c.label).includes(q));
  }, [query]);

  const activeFamily = FAMILIES.find((f) => f.key === family);

  return (
    <div className="container wide">
      <div className="cat-header">
        <h2>{activeFamily && !results ? famLabel(t, activeFamily.key) : t('allTopics')}</h2>
        <button className="back-link" onClick={onBack}>{t('back')}</button>
      </div>
      <SearchBar value={query} onChange={setQuery} placeholder={t('searchPlaceholder')} />
      {results ? (
        results.length ? (
          <div className="topics-grid full">
            {results.map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />)}
          </div>
        ) : (
          <div className="no-results">{t('noResults', { q: query })}</div>
        )
      ) : activeFamily ? (
        <>
          <button className="back-to-topics" onClick={() => onSelectFamily(null)}>{t('backToTopics')}</button>
          <div className="topics-grid full">
            {categoriesInFamily(activeFamily.key).map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />)}
          </div>
        </>
      ) : (
        <FamilyGrid onSelect={onSelectFamily} />
      )}
      <a className="cover-credits-link" href="/image-credits.html" target="_blank" rel="noopener noreferrer">
        Crédits photos
      </a>
    </div>
  );
}

export function ProfileContent({
  avatar, name, stats, isGoogleLinked, googleEmail, linkGoogle, linking,
  clientId, social, onOpenLeaderboard, onOpenShop, onSaveProfile, profileSaving, onOpenTopic, streak,
}) {
  const { t } = useI18n();
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name || '');
  const [draftAvatar, setDraftAvatar] = useState(avatar || AVATARS[0]);
  const [submitted, setSubmitted] = useState(false);

  const normalizedName = draftName.replace(/\s+/g, ' ').trim().slice(0, 20);
  const unchanged = normalizedName === (name || '') && draftAvatar === avatar;

  useEffect(() => {
    if (!editing) {
      setDraftName(name || '');
      setDraftAvatar(avatar || AVATARS[0]);
    }
  }, [name, avatar, editing]);

  useEffect(() => {
    if (
      submitted
      && !profileSaving
      && normalizedName === (name || '')
      && draftAvatar === avatar
    ) {
      setSubmitted(false);
      setEditing(false);
    }
  }, [submitted, profileSaving, normalizedName, draftAvatar, name, avatar]);

  const cancelEdit = () => {
    if (profileSaving) return;
    setDraftName(name || '');
    setDraftAvatar(avatar || AVATARS[0]);
    setSubmitted(false);
    setEditing(false);
  };

  const saveEdit = () => {
    if (!normalizedName || unchanged || profileSaving) return;
    setSubmitted(true);
    onSaveProfile(normalizedName, draftAvatar);
  };

  return (
    <div className="container">
      <div className="profile-identity-head">
        <IdentityCard frame={stats.frame} avatar={avatar} name={name} level={stats.level} />
        <button
          className="profile-edit-btn"
          onClick={() => setEditing((value) => !value)}
          aria-label={t('editProfile')}
          aria-expanded={editing}
        >
          <Icon name="edit" size={17} />
        </button>
      </div>

      {editing && (
        <div className="profile-editor">
          <label className="profile-editor-label" htmlFor="profile-name-input">{t('displayName')}</label>
          <input
            id="profile-name-input"
            className="input profile-name-input"
            value={draftName}
            maxLength={20}
            autoComplete="nickname"
            onChange={(event) => setDraftName(event.target.value)}
          />
          <div className="profile-editor-label">{t('chooseAvatar')}</div>
          <div className="profile-avatar-grid" role="group" aria-label={t('chooseAvatar')}>
            {AVATARS.map((option, index) => (
              <button
                key={option}
                className={`avatar-opt ${draftAvatar === option ? 'active' : ''}`}
                onClick={() => setDraftAvatar(option)}
                aria-label={`${t('avatar')} ${index + 1}`}
                aria-pressed={draftAvatar === option}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="profile-editor-actions">
            <button className="profile-editor-cancel" onClick={cancelEdit} disabled={profileSaving}>
              {t('cancelEdit')}
            </button>
            <button
              className="profile-editor-save"
              onClick={saveEdit}
              disabled={!normalizedName || unchanged || profileSaving}
            >
              {profileSaving ? t('saving') : t('saveChanges')}
            </button>
          </div>
        </div>
      )}

      <div className="follow-counts">
        <div><strong>{stats.followers || 0}</strong><small>{t('followers')}</small></div>
        <div><strong>{stats.following || 0}</strong><small>{t('followingCount')}</small></div>
      </div>
      <ProfileStats stats={stats} />
      {streak && streak.streak > 0 && (
        <StreakCalendar
          streak={streak.streak}
          calendar={streak.calendar || []}
          nextMilestone={streak.nextMilestone}
          milestoneProgress={streak.milestoneProgress}
        />
      )}
      <div className="section-title">{t('myTopics')}</div>
      <TopicLevelList topics={stats.topics} onSelect={onOpenTopic} />
      <button className="leaderboard-cta shop-cta" onClick={onOpenShop}>
        <span className="leaderboard-cta-icon shop-cta-icon" aria-hidden="true"><Icon name="shop" size={21}/></span>
        <span className="leaderboard-cta-copy">
          <strong>{t('shop')}</strong>
          <small>{t('shopCta', { n: stats.coins || 0 })}</small>
        </span>
        <Icon name="arrow" size={18} />
      </button>
      <button className="leaderboard-cta" onClick={onOpenLeaderboard}>
        <span className="leaderboard-cta-icon"><Icon name="trophy" size={20} /></span>
        <span className="leaderboard-cta-copy">
          <strong>{t('globalLeaderboard')}</strong>
          <small>{t('leaderboardCta')}</small>
        </span>
        <Icon name="arrow" size={18} />
      </button>
      {isGoogleLinked ? (
        <div className="account-linked">{'✓'} {t('connectedGoogle', { email: googleEmail })}</div>
      ) : (
        <button className="social-btn outline account-link-btn" onClick={linkGoogle} disabled={linking || !clientId}>
          {linking ? t('connecting') : t('connectGoogle')}
        </button>
      )}
      <FriendsScreen social={social} />
      <a className="privacy-link" href="/privacy.html" target="_blank" rel="noopener noreferrer">
        {t('privacyPolicy')}
      </a>
    </div>
  );
}


export function LeaderboardContent({ board, loading, onBack, category = null, onChangeCategory, onOpenPlayer }) {
  const { t, lang } = useI18n();
  const entries = board?.entries || [];
  const sortedCategories = useMemo(
    () => [...CATEGORIES].sort((a, b) => a.label.localeCompare(b.label, lang)),
    [lang]
  );
  const openRow = (entry) => { if (entry.id && !entry.isYou && onOpenPlayer) onOpenPlayer(entry.id); };
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <div className="container wide">
      <div className="cat-header">
        <div>
          <div className="status-label">{category ? t('topicLeaderboard') : t('seasonAllTime')}</div>
          <h2>{category ? topicLabel(category) : t('globalLeaderboard')}</h2>
        </div>
        <button className="back-link" onClick={onBack}>{t('back')}</button>
      </div>
      {onChangeCategory && (
        <select className="feed-cat-select leaderboard-cat-select" aria-label={t('topicLeaderboard')}
          value={category || ''} onChange={(e) => onChangeCategory(e.target.value || null)}>
          <option value="">{t('generalRanking')}</option>
          {sortedCategories.map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
        </select>
      )}

      {loading && !entries.length ? (
        <div className="leaderboard-loading" aria-live="polite">
          <div className="loading-bar"><div className="loading-fill" /></div>
          <span>{t('loadingRanking')}</span>
        </div>
      ) : entries.length ? (
        <>
          <div className="podium">
            {topThree.map((entry) => (
              <div key={entry.rank} className={`podium-card rank-${entry.rank} ${entry.isYou ? 'mine' : ''} ${entry.id && !entry.isYou ? 'clickable' : ''}`}
                role={entry.id && !entry.isYou ? 'button' : undefined} tabIndex={entry.id && !entry.isYou ? 0 : undefined}
                onClick={() => openRow(entry)} onKeyDown={(e) => { if (e.key === 'Enter') openRow(entry); }}>
                <div className="podium-rank">#{entry.rank}</div>
                <div className="podium-avatar">{entry.avatar}</div>
                <div className="podium-name">{entry.name}</div>
                <div className="podium-level">{t('level')} {entry.level}</div>
                <div className="podium-xp">{entry.xp.toLocaleString()} XP</div>
              </div>
            ))}
          </div>

          <div className="leaderboard-summary">
            <span>{t('rankedPlayers', { n: board.total })}</span>
            {board.yourRank && <strong>{t('yourRank', { n: board.yourRank })}</strong>}
          </div>

          {remaining.length > 0 && (
            <div className="global-leaderboard-list">
              {remaining.map((entry) => (
                <div key={entry.rank} className={`global-leaderboard-row ${entry.isYou ? 'mine' : ''} ${entry.id && !entry.isYou ? 'clickable' : ''}`}
                  role={entry.id && !entry.isYou ? 'button' : undefined} tabIndex={entry.id && !entry.isYou ? 0 : undefined}
                  onClick={() => openRow(entry)} onKeyDown={(e) => { if (e.key === 'Enter') openRow(entry); }}>
                  <span className="global-rank">{entry.rank}</span>
                  <span className="global-avatar">{entry.avatar}</span>
                  <span className="global-player">
                    <strong>{entry.name}{entry.isYou ? ` · ${t('you')}` : ''}</strong>
                    <small>{t('level')} {entry.level} · {entry.winRate}% {String(t('wins')).toLowerCase()}</small>
                  </span>
                  <span className="global-xp">{entry.xp.toLocaleString()}<small>XP</small></span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="leaderboard-empty">
          <Icon name="trophy" size={28} />
          <strong>{t('rankingEmpty')}</strong>
          <span>{t('rankingEmptyHint')}</span>
        </div>
      )}
    </div>
  );
}

export function WaitingContent({ avatar, frame, name, level = 1, categoryKey, onCancel, onPlaySolo, pending, reconnecting }) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);
  const category = CATEGORIES.find((item) => item.key === categoryKey);

  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="container center">
      <div className="status-label" role="status">
        {reconnecting ? t('reconnecting') : pending ? t('leavingQueue') : t('matchmaking')}
      </div>
      <div className="matchmaking-topic">{category?.label || t('randomTopic')}</div>
      <div className="vs-screen">
        <div className="vs-player"><IdentityCard frame={frame} avatar={avatar} name={name} level={level} className="identity-card-vs" /></div>
        <div className="vs-bolt-wrap"><div className="vs-bolt"><Icon name="bolt" size={24} /></div></div>
        <div className="vs-player">
          <div className="vs-ava searching">?</div>
          <div className="vs-name dim">{t('searching')}</div>
        </div>
      </div>
      <div className="search-meta">{t('searchElapsed', { n: elapsed })}</div>
      <div className="loading-bar"><div className="loading-fill" /></div>
      {elapsed >= 12 && (
        <div className="matchmaking-alternative">
          <p role="status">{t('searchTakingLonger')}</p>
          <button className="btn" onClick={onPlaySolo} disabled={pending || reconnecting}>
            {t('playSoloInstead')}
          </button>
        </div>
      )}
      <button className="home-themes-link" onClick={onCancel} disabled={pending}>
        {pending ? t('leavingQueue') : t('cancel')}
      </button>
    </div>
  );
}

export function RoundIntroContent({ intro, totalRounds, opponents, avatar, frame, name, level }) {
  const { t } = useI18n();
  const difficultyKey = intro.difficulty
    ? `difficulty${intro.difficulty[0].toUpperCase()}${intro.difficulty.slice(1)}`
    : null;
  return (
    <div className="container center">
      <div className={`round-intro-icon ${intro.isBonus ? 'bonus' : ''}`}>{intro.icon}</div>
      <div className="round-intro-cat">{intro.category}</div>
      {difficultyKey && <div className={`difficulty-pill ${intro.difficulty}`}>{t(difficultyKey)}</div>}
      <div className="round-intro-round">{intro.isBonus ? t('bonusRound') : t('round', { n: intro.round })}</div>
      <div className="round-intro-sub">{intro.isBonus ? t('doublePoints') : t('roundOf', { n: intro.round, total: totalRounds })}</div>
      {intro.round === 1 && opponents.length === 1 && (
        <div className="identity-duel" aria-label={`${name} ${t('versus')} ${opponents[0].name}`}>
          <IdentityCard frame={frame} avatar={avatar} name={name} level={level} className="identity-card-duel" />
          <span className="identity-duel-vs" aria-hidden="true">VS</span>
          <IdentityCard frame={opponents[0].frame} avatar={opponents[0].avatar} name={opponents[0].name} className="identity-card-duel" />
        </div>
      )}
    </div>
  );
}

const QuestionContent = EnhancedQuestionContent;

export function FinishedContent({ result, opponents, myId, avatar, name, frame, social, addFriend, playAgain, rematch, rematchWaiting, rematchStarting, newMatch, adOffer, onWatchAd, adClaimed, streak, onShowShare }) {
  const { t } = useI18n();
  const [showShare, setShowShare] = useState(false);
  const { won, tie } = result;
  const left = result.reason === 'opponent_disconnected' || result.reason === 'opponent_left';
  const isSolo = !!result.solo;
  const addableOpponents = opponents.filter(
    (o) => o.clientId && !social.friends.some((f) => f.id === o.clientId) && !social.outgoingRequests.has(o.clientId)
  );
  const shareResult = () => {
    const text = isSolo ? t('shareSolo', { n: result.finalScore })
      : won ? t('shareWon') : tie ? t('shareTie') : t('sharePlayed');
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).catch(() => {});
  };
  return (
    <div className="container center">
      <div className="result-hero">
        <div className={`result-title ${isSolo ? 'tie' : won ? 'win' : tie ? 'tie' : 'loss'}`}>{isSolo ? t('finished') : won ? t('victory') : tie ? t('draw') : t('defeat')}</div>
        <div className="result-sub">{left ? t('someoneLeft') : t('finalScore', { n: result.finalScore })}</div>
      </div>
      <IdentityCard frame={frame} avatar={avatar} name={name} level={result.stats?.level} className="identity-card-result" />
      {result.stats && <LevelRing level={result.stats.level} xpIntoLevel={result.stats.xpIntoLevel} xpForLevel={result.stats.xpForLevel} />}
      {result.topic && (
        <div className="result-topic-level">
          <span className="topic-level-badge">{result.topic.level}</span>
          <span>
            <strong>{t('topicLevelUp', { level: result.topic.level, topic: topicLabel(result.topic.key) })}</strong>
            <small>{t(topicTitleKey(result.topic.level))}</small>
          </span>
        </div>
      )}
      {result.dayStreak > 1 && <div className="result-day-streak">{t('dayStreakLine', { n: result.dayStreak })}</div>}
      <div className="xp-breakdown">
        <div className="xpb-row"><span>{t('matchScore')}</span><span>{result.finalScore}</span></div>
        <div className="xpb-row"><span>{t('finishBonus')}</span><span>+{result.xpBreakdown?.finishBonus ?? 0}</span></div>
        <div className="xpb-row"><span>{t('winBonus')}</span><span>+{result.xpBreakdown?.winBonus ?? 0}</span></div>
        <div className="xpb-row total"><span>{t('xpTotal')}</span><span>{result.xp}</span></div>
      </div>
      {!isSolo && <Leaderboard leaderboard={result.leaderboard} myId={myId} />}
      <div className="rewards-row">
        <span className="rw">{t('coins', { n: adClaimed ? result.coins * 2 : result.coins })}</span>
        {adClaimed && <span className="rw doubled">{t('coinsDoubled')}</span>}
      </div>
      {adOffer && !adClaimed && result.coins > 0 && (
        <button className="ad-double-btn" onClick={onWatchAd}>
          <span aria-hidden="true">▶</span> {t('adDouble', { n: result.coins })}
        </button>
      )}
      <div className="result-streak-row">
        <StreakBadge streak={streak?.streak || 0} />
      </div>
      <button className="share-link" onClick={shareResult}>{t('share')}</button>
      <button className="share-link" onClick={() => setShowShare(true)}>📸 {t('shareImage')}</button>
      {showShare && (
        <ShareCard
          result={result}
          myName={name}
          myAvatar={avatar}
          topicLabel={result.topic ? topicLabel(result.topic.key) : ''}
          onClose={() => setShowShare(false)}
        />
      )}
      {addableOpponents.map((o) => (
        <button key={o.clientId} className="add-friend-link" onClick={() => addFriend(o.clientId)}>
          {t('addFriend', { name: o.name })}
        </button>
      ))}
      <div className="result-actions">
        {!isSolo && (
          <button className="ra-btn rematch" onClick={rematch} disabled={rematchWaiting || rematchStarting}>
            {rematchWaiting || rematchStarting ? t('waitingDots') : t('rematch')}
          </button>
        )}
        <button className="ra-btn new-opp" onClick={newMatch} disabled={rematchStarting}>
          {isSolo ? t('newGame') : t('newOpponent')}
        </button>
        <button className="ra-btn see-res" onClick={playAgain} disabled={rematchStarting}>{t('backHome')}</button>
      </div>
    </div>
  );
}

export function ShopContent({ avatar, name, stats, onBuy, onEquip, onPlay, onBack, pending }) {
  const { t, lang } = useI18n();
  const [selected, setSelected] = useState(() => stats.frame && stats.frame !== 'none' ? stats.frame : 'neon');
  const [confirming, setConfirming] = useState(null);
  const owned = new Set(stats.ownedFrames || ['none']);
  const equipped = stats.frame || 'none';
  const coins = stats.coins || 0;
  const item = FRAMES.find((entry) => entry.id === selected) || FRAMES[0];
  const isOwned = owned.has(item.id);
  const isEquipped = equipped === item.id;
  const affordable = coins >= item.price;
  const identity = IDENTITIES[item.id];
  let action;
  if (isEquipped) {
    action = <span className="shop-feature-equipped"><Icon name="check" size={17} />{t('equipped')}</span>;
  } else if (isOwned) {
    action = <button className="shop-feature-action secondary" disabled={pending} onClick={() => onEquip(item.id)}>{t('equip')}</button>;
  } else if (confirming === item.id) {
    action = <button className="shop-feature-action" disabled={pending} onClick={() => { setConfirming(null); onBuy(item.id); }}>{t('confirmBuy', { n: item.price })}</button>;
  } else {
    action = <button className="shop-feature-action" aria-label={`${item.price} ${t('coinBalance')}`} disabled={!affordable || pending} onClick={() => setConfirming(item.id)}><Icon name="coin" size={18} />{item.price}</button>;
  }
  return (
    <div className="container shop-page">
      <div className="cat-header">
        <h2>{t('shop')}</h2>
        <button className="back-link" onClick={onBack}>{t('back')}</button>
      </div>
      <div className="shop-balance"><span className="shop-coin" aria-hidden="true"><Icon name="coin" size={23}/></span><strong>{coins}</strong><small>{t('coinBalance')}</small></div>
      <p className="shop-intro">{t('shopIntro')}</p>
      <div className="shop-feature">
        <IdentityCard frame={item.id} avatar={avatar} name={name} level={stats.level} className="identity-card-shop" />
        <div className="shop-feature-details">
          <div className="shop-feature-kicker">{t('shopCollection')} / {identity.number}</div>
          <h3>{lang === 'en' ? identity.en : identity.fr}</h3>
          <p>{lang === 'en' ? identity.lineEn : identity.lineFr}</p>
          <div className="shop-feature-actions">{action}</div>
          {!isOwned && !affordable && (
            <div className="shop-earn">
              <div className="shop-earn-track" role="progressbar" aria-label={t('shopProgress')} aria-valuemin={0} aria-valuemax={item.price} aria-valuenow={coins}><span style={{ width: `${Math.min(100, (coins / item.price) * 100)}%` }} /></div>
              <small className="shop-missing">{t('coinsMissing', { n: item.price - coins })}</small>
              <button className="shop-play-link" disabled={pending} onClick={onPlay}>{t('shopPlayToEarn')} <Icon name="arrow" size={17} /></button>
            </div>
          )}
        </div>
      </div>
      <div className="section-title">{t('shopFrames')}</div>
      <div className="shop-picker" role="group" aria-label={t('shopFrames')}>
        {FRAMES.map((entry) => (
          <button key={entry.id} className={`shop-pick identity-${entry.id}${selected === entry.id ? ' selected' : ''}`} aria-pressed={selected === entry.id} onClick={() => { setSelected(entry.id); setConfirming(null); }}>
            <span className="shop-pick-number" aria-hidden="true">{IDENTITIES[entry.id].number}</span>
            <span className="shop-pick-copy"><strong>{t(frameLabelKey(entry.id))}</strong><small>{equipped === entry.id ? t('equipped') : owned.has(entry.id) ? t('equip') : entry.price === 0 ? t('shopFree') : `${entry.price} ${t('coinBalance')}`}</small></span>
            <Icon name="arrow" size={17} />
          </button>
        ))}
      </div>
    </div>
  );
}
