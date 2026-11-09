import { QuestionContent as EnhancedQuestionContent } from './enhanced-QuestionContent';
import React, { useState, useMemo, useEffect } from 'react';
import { StreakBadge } from './DailyStreak';
import { ShareCard } from './ShareCard';
import { ChallengeButton } from './ChallengeLink';
import { CATEGORIES, FAMILIES, categoriesInFamily, normalizeForSearch, famLabel, SoloToggle, CategoryTile, FamilyGrid, SearchBar, PlayerPhoto, LevelRing, Icon, BrowseHeader } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';
import { Leaderboard } from './multiplayer';
import { FriendInviteActions } from './FriendInviteActions';
import { TopicLevelList, topicTitleKey, topicLabel } from './players';
import { useI18n } from './i18n';
import { PlayerAvatar, avatarId } from './PlayerAvatar';
import { ShopArt as QV4ShopArt } from './shop-art';
import { BrandLogo } from './Brand';
import { getTopicCover } from './topicCovers';
import { localizedTopicTitle } from './topicTitles';

const FEATURED_TOPIC_KEYS = [
  'spider_man', 'harry_potter', 'minecraft', 'rap_fr',
  'ligue_champions', 'marvel', 'one_piece', 'pokemon',
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

// Direction: warm editorial — red ground, ivory navigation and existing topic worlds.
// Rules: quiet controls, equal covers, real personal and community content.
// Signature: four equal topic covers lead directly into a compact discovery shelf.
export function HomeContent({ startWithCategory, onSeeAll, pending, stats, controls, onOpenCommunity, communityPost }) {
  const { t, lang } = useI18n();
  const personalKeys = [...new Set([...(stats?.followedThemes || []), ...(stats?.recentThemes || []).map(topic => topic.key), ...[...(stats?.topics || [])].sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0)).map(topic => topic.key)])];
  const personalThemes = personalKeys.map(key => CATEGORIES.find(c => c.key === key)).filter(Boolean);
  const myThemes = [...personalThemes, ...FEATURED_TOPICS.filter(c => !personalThemes.some(mine => mine.key === c.key))].slice(0, 4);
  const discovery = [...FEATURED_TOPICS, ...CATEGORIES].filter(c => !myThemes.some(mine => mine.key === c.key)).slice(0, 2);
  return <main id="main-content" tabIndex={-1} aria-labelledby="home-title" className="container wide home-v4 home-refined">
    <header className="home-head home-head--v4">
      <BrandLogo />
      <div className="home-actions"><button type="button" className="home-action" onClick={() => onSeeAll?.(null, true)} aria-label={t('searchPlaceholder')}><Icon name="search" size={24} /></button>{controls}</div>
    </header>
    <h1 id="home-title" tabIndex={-1} className="screen-reader-only">{t('homeTitle')}</h1>
    <section aria-labelledby="home-my-themes">
      <div className="section-head-v4"><h2 id="home-my-themes" className="section-title-v4">{t('myThemesSection')}</h2><button className="section-edit" onClick={() => onSeeAll?.()}>{t('seeAll')} <Icon name="arrow" size={16} /></button></div>
      {!personalThemes.length && <p className="home-starter-label">{t('suggestionsToStart')}</p>}
      <div className="topics-grid-v4">{myThemes.map((c, index) => {
        const level = [...(stats?.topics || []), ...(stats?.recentThemes || [])].find(topic => topic.key === c.key)?.level;
        return <div key={c.key} className="topic-tile-wrap" data-topic={c.key}><CategoryTileV4 c={c} priority={index < 2 ? 'high' : 'eager'} onClick={() => startWithCategory(c.key)} disabled={pending} />{personalThemes.length > 0 && !personalThemes.some(mine => mine.key === c.key) && <span className="home-theme-suggestion">{t('suggestedLabel')}</span>}{Number.isFinite(level) && <span className="personal-theme-level">{t('level')} {level}</span>}</div>;
      })}</div>
    </section>
    <section aria-labelledby="home-discover"><div className="section-head-v4"><h2 id="home-discover" className="section-title-v4">{t('discoverSection')}</h2></div><div className="home-discovery">{discovery.map(c => <CategoryTileV4 key={c.key} c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />)}</div></section>
    <section aria-labelledby="home-community" className="home-community-section">
      <button className={`home-community-teaser${communityPost ? '' : ' is-empty'}`} onClick={() => onOpenCommunity?.(communityPost?.id)}>
        <span className="home-community-content"><strong id="home-community" className="home-community-heading">{t('communityTitle')}</strong>
        {communityPost ? <span className="home-community-post"><span className="home-community-avatar"><PlayerAvatar avatar={communityPost.authorAvatar} /></span><span className="home-community-copy"><strong>{communityPost.authorName}</strong><small>{topicLabel(communityPost.category)}</small><span>{communityPost.text}</span><small>{communityPost.commentsCount || 0} {t('repliesTitle').toLowerCase()}</small></span></span> : <span className="home-community-invitation">{t('joinDiscussions')}</span>}</span><Icon name="arrow" size={20} />
      </button>
    </section>
  </main>;
}

// Short, complete pitches keep the entry into a duel concise in both languages.
const PREVIEW_SUB = {
  spider_man: { eyebrow: 'POP CULTURE · MARVEL', desc: 'De Peter Parker à Miles Morales. Le multivers n’aura plus de secrets pour toi.', en: 'From Peter Parker to Miles Morales. Discover every corner of the multiverse.' },
  harry_potter: { eyebrow: 'POP CULTURE · WIZARDING', desc: 'Poudlard, sortilèges et créatures magiques. Mets tes connaissances à l’épreuve.', en: 'Hogwarts, spells and magical creatures. Put your knowledge to the test.' },
  marvel: { eyebrow: 'POP CULTURE · MARVEL', desc: 'Avengers, X-Men et tout l’univers Marvel réuni.', en: 'Avengers, X-Men and the entire Marvel universe.' },
  dc_comics: { eyebrow: 'POP CULTURE · DC', desc: 'Justice League, Batman, Superman : explore l’univers DC Comics.', en: 'Justice League, Batman, Superman: explore the DC Comics universe.' },
  batman: { eyebrow: 'POP CULTURE · DC', desc: 'Gotham, le Chevalier Noir, Joker et toute la Bat-Famille.', en: 'Gotham, the Dark Knight, the Joker and the whole Bat-Family.' },
  star_wars: { eyebrow: 'POP CULTURE · LUCASFILM', desc: 'La Force, les Jedi et les Sith. Explore toute la saga galactique.', en: 'The Force, the Jedi and the Sith. Explore the entire galactic saga.' },
  game_of_thrones: { desc: 'Westeros, dragons, trônes et trahisons.', en: 'Westeros, dragons, thrones and betrayals.' },
  one_piece: { eyebrow: 'MANGA · SHŌNEN', desc: 'Luffy et son équipage à la recherche du One Piece.', en: 'Join Luffy and his crew on the quest for the One Piece.' },
  pokemon: { eyebrow: 'POP CULTURE · GAMING', desc: 'Pokémon, régions et évolutions : à toi de tous les reconnaître.', en: 'Pokémon, regions and evolutions: how many can you recognize?' },
  minecraft: { eyebrow: 'GAMING · SANDBOX', desc: 'Blocs, créatures, biomes et dimensions du jeu culte.', en: 'Blocks, creatures, biomes and dimensions of the iconic game.' },
  rap_fr: { desc: 'PNL, Booba, Jul, SCH et les grands noms du rap français.', en: 'PNL, Booba, Jul, SCH and the biggest names in French rap.' },
  werenoi: { desc: 'La discographie et l’univers de Werenoi.', en: 'Explore Werenoi’s discography and musical world.' },
  ligue_champions: { desc: 'Finales, légendes et records de la compétition européenne.', en: 'Finals, legends and records of European club football.' },
  foot_fr: { desc: 'Ligue 1, les Bleus et les légendes du football français.', en: 'Ligue 1, Les Bleus and the legends of French football.' },
};

// Direction: full-width artwork dissolves into one continuous themed canvas.
// Rules: preserve faces, keep the pitch complete, lead with play and compact progress.
export function CategoryPreviewContent({ category, stats, onBack, onPlay, onChallenge, pending, friendsOnTopic = [], controls, onCommunity, onLeaderboard, following, onToggleFollow }) {
  const { t, lang } = useI18n();
  const [failedCover, setFailedCover] = useState(null);
  const [loadedCover, setLoadedCover] = useState(null);
  const cover = category ? getTopicCover(category) : null;
  const tint = cover?.detailTint || ({ spider_man: '#721027', marvel: '#721027', foot_fr: '#142e55', harry_potter: '#58401e', minecraft: '#294d36', rap_fr: '#4d192c', ligue_champions: '#142e55', liga_portugal: '#194c3c' })[category?.key]
    || ({ football: '#142e55', sport: '#183c49', music: '#4d192c', gaming: '#273c42', cinema: '#42302f', sagas: '#493326', series: '#483049', manga: '#423241', culture: '#263f54' })[category?.family] || '#4b2436';
  useEffect(() => {
    if (!category) return undefined;
    const app = document.querySelector('.app-category-preview');
    const previousCanvas = app?.style.getPropertyValue('--cp-canvas');
    const themeColor = document.querySelector('meta[name="theme-color"]');
    const previousTheme = themeColor?.getAttribute('content');
    app?.style.setProperty('--cp-canvas', tint);
    themeColor?.setAttribute('content', tint);
    return () => {
      if (previousCanvas) app?.style.setProperty('--cp-canvas', previousCanvas);
      else app?.style.removeProperty('--cp-canvas');
      if (previousTheme !== null && previousTheme !== undefined) themeColor?.setAttribute('content', previousTheme);
    };
  }, [category, tint]);
  if (!category) return null;
  const artwork = cover?.src && failedCover !== cover.src ? cover : null;
  const preview = PREVIEW_SUB[category.key] || { desc: category.desc };
  const title = localizedTopicTitle(category, lang);
  const family = category.family ? famLabel(t, category.family) : 'Quiz';
  const description = (lang === 'fr' ? preview.desc : preview.en) || category.desc || '';
  const eyebrow = preview.eyebrow || family;
  const topicStats = (stats?.topics || []).find(topic => topic.key === category.key) || {};
  const completion = Number.isFinite(topicStats.completion) ? `${topicStats.completion}%` : '—';
  const bestStreak = Number.isFinite(topicStats.bestStreak) ? topicStats.bestStreak : '—';
  const topicLevel = topicStats.level || 1;
  const resolvedImage = artwork && loadedCover?.src === artwork.src ? loadedCover.url : null;
  return (
    <main id="main-content" tabIndex={-1} aria-labelledby="quiz-title" className={`container wide category-preview-v4 cp-detail${artwork ? ' cp-has-artwork' : ''}`} data-topic={category.key} data-family={category.family}
      style={{ '--cp-tint': tint, '--cp-image': resolvedImage ? `url(${JSON.stringify(resolvedImage)})` : 'none', '--cp-fit': category.key === 'foot_fr' || artwork?.embeddedTitle || artwork?.fit === 'contain' ? 'contain' : 'cover', '--cp-focal': category.key === 'spider_man' ? 'center 20%' : artwork?.focal || 'center' }}>
      <div className="cp-bg" aria-hidden="true" />
      <header className="cp-head">
        <button className="cp-back" onClick={onBack} aria-label={t('back')}><Icon name="arrow" size={18} className="cp-back-ic" /></button>
        <div className="cp-head-right">
          <button className="cp-icon-btn" aria-label={following ? t('unfollowTheme') : t('followTheme')} aria-pressed={!!following} onClick={onToggleFollow}><Icon name="heart" size={18} /></button>
          {controls}
        </div>
      </header>
      <div className="cp-visual" aria-hidden="true">
        <div className="cp-visual-ambience" />
        {artwork ? <img className="cp-artwork" src={artwork.src} srcSet={artwork.srcSet} sizes="(min-width: 900px) 600px, 100vw" alt="" fetchpriority="high" decoding="async"
          onLoad={event => setLoadedCover({ src: artwork.src, url: event.currentTarget.currentSrc || artwork.src })} onError={() => setFailedCover(artwork.src)} />
          : <div className="cp-cover-fallback"><span>{title.split(/\s+/).slice(0, 2).map(word => word[0]).join('')}</span><Icon name="bolt" size={36} /></div>}
      </div>
      <div className="cp-content">
      <div className="cp-hero">
        <div className="cp-eyebrow">{eyebrow}</div>
        <h1 id="quiz-title" tabIndex={-1} className="cp-title">{title}</h1>
        {description && <p className="cp-info">{description}</p>}
      </div>
      <div className="cp-cta">
        <button className="cp-play" onClick={onPlay} disabled={pending}><Icon name="bolt" size={20} />{t('playNow')}</button>
        <button className="cp-ghost" onClick={onChallenge} disabled={pending} aria-label={t('challengeFriend')}><Icon name="users" size={22} /></button>
      </div>
      <div className="cp-stats" aria-label={t('yourProgress')}>
        <div className="cp-stat cp-stat-level"><Icon name="trophy" size={16} /><b>{t('level')} {topicLevel}</b></div>
        <div className="cp-stat"><span>{t('progressLabel')}</span><b>{completion}</b></div>
        <div className="cp-stat" title={t('bestStreakLabel')}><span>{t('streakLabelShort')}</span><b>{bestStreak}</b></div>
      </div>
      <section className="cp-friends" aria-labelledby="quiz-friends-title">
        <div className="cp-friends-symbol" aria-hidden="true"><Icon name="users" size={23} /></div>
        <button className="cp-friend-invite" onClick={onChallenge} disabled={pending}>
          <span id="quiz-friends-title" className="cp-friends-title">{t('challengeYourFriends')}</span>
          <span className="cp-friends-empty">{t('inviteFriendTopic')}</span>
        </button>
        {friendsOnTopic.length > 0 && <div className="cp-friends-row">
          {friendsOnTopic.slice(0, 4).map(friend => <div key={friend.id} className="cp-friend-ava" title={friend.name}>{(friend.name || '?')[0].toUpperCase()}</div>)}
          {friendsOnTopic.length > 4 && <span className="cp-friends-more">+ {friendsOnTopic.length - 4} {t('othersMore')}</span>}
        </div>}
      </section>
      <div className="social-entry-row"><button onClick={onCommunity}><Icon name="chat" size={18} />{t('communityTitle')}</button><button onClick={onLeaderboard}><Icon name="trophy" size={18} />{t('rankingLabel')}</button></div>
      </div>
    </main>
  );
}

export function EnterCodeContent({ joinCode, setJoinCode, joinError, setJoinError, joinRoom, onBack, pending }) {
  const { t } = useI18n();
  return (
    <main id="main-content" tabIndex={-1} aria-labelledby="join-title" className="container center">
      <h1 id="join-title" tabIndex={-1} className="screen-reader-only">{t('joinFriend')}</h1>
      <div className="status-label">{t('joinFriend')}</div>
      <div className="room-code-label">{t('enterCode')}</div>
      <input className={`input code-input ${joinError ? 'err' : ''}`} placeholder="ABC12" value={joinCode} maxLength={5}
        onChange={(e) => { setJoinCode(e.target.value.toUpperCase()); setJoinError(false); }} />
      {/* role="alert" so a screen reader announces the invalid-code error
          immediately, instead of it being silent to anyone not looking. */}
      {joinError && <div className="code-err-msg" role="alert">{t('codeError')}</div>}
      <button className="btn" disabled={joinCode.trim().length < 4 || pending} onClick={() => joinRoom(joinCode)}>{t('joinMatch')}</button>
      <button className="home-themes-link" onClick={onBack}>{t('back')}</button>
    </main>
  );
}

export function CategoriesContent({ startWithCategory, family, onSelectFamily, pending, controls }) {
  const { t, lang } = useI18n();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = normalizeForSearch(query.trim());
    if (!q) return null;
    return CATEGORIES.filter((c) => normalizeForSearch(`${c.label} ${localizedTopicTitle(c, lang)}`).includes(q));
  }, [query, lang]);

  const activeFamily = FAMILIES.find((f) => f.key === family);

  return (
    <main id="main-content" tabIndex={-1} aria-labelledby="themes-title" className="container wide themes-refined">
      {controls && <BrowseHeader controls={controls} />}
      <div className="cat-header">
        <h1 id="themes-title" tabIndex={-1}>{activeFamily && !results ? famLabel(t, activeFamily.key) : t('allTopics')}</h1>
        {activeFamily && <button className="back-link" onClick={() => { setQuery(''); onSelectFamily(null); }}>{t('backToTopics')}</button>}
      </div>
      <SearchBar value={query} onChange={setQuery} placeholder={t('searchPlaceholder')} describedBy="themes-search-scope" />
      <p className="themes-search-scope" id="themes-search-scope">{t('searchAllTopicsHint')}</p>
      {results ? (
        results.length ? (
          <div className="topics-grid-v4">
            {results.map((c, index) => (
              <div key={c.key} className="topic-tile-wrap" data-topic={c.key}>
                <CategoryTileV4 c={c} priority={index < 2 ? 'high' : index < 4 ? 'eager' : 'lazy'} onClick={() => startWithCategory(c.key)} disabled={pending} />
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">{t('noResults', { q: query })}</div>
        )
      ) : activeFamily ? (
        <>
          <div className="topics-grid-v4">
            {categoriesInFamily(activeFamily.key).map((c, index) => (
              <div key={c.key} className="topic-tile-wrap" data-topic={c.key}>
                <CategoryTileV4 c={c} priority={index < 2 ? 'high' : index < 4 ? 'eager' : 'lazy'} onClick={() => startWithCategory(c.key)} disabled={pending} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <FamilyGrid onSelect={onSelectFamily} />
      )}
      <a className="cover-credits-link" href="/image-credits.html" target="_blank" rel="noopener noreferrer">
        Crédits photos
      </a>
    </main>
  );
}

export { ProfileContent } from './ProfileContent';

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
    <main id="main-content" tabIndex={-1} aria-labelledby="ranking-title" className="container wide">
      <div className="cat-header">
        <div>
          <div className="status-label">{category ? t('topicLeaderboard') : t('seasonAllTime')}</div>
          <h1 id="ranking-title" tabIndex={-1}>{category ? topicLabel(category) : t('globalLeaderboard')}</h1>
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
                <div className="podium-avatar"><PlayerAvatar avatar={entry.avatar} /></div>
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
                  <span className="global-avatar"><PlayerAvatar avatar={entry.avatar} /></span>
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
    </main>
  );
}

export { WorldMatchSearch as WaitingContent, DuelRoundIntro as RoundIntroContent } from './MatchPresentation';

export const QuestionContent = EnhancedQuestionContent;

export function FinishedContent({ result, opponents, myId, avatar, name, frame, social, addFriend, playAgain, rematch, rematchWaiting, rematchStarting, newMatch, adOffer, onWatchAd, adClaimed, streak, onShowShare, leagueAward, notices = [], onOpenMessages }) {
  const { t } = useI18n();
  const [showShare, setShowShare] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
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
  // v4 results hero — editorial headline on coral, then the reward signals
  // inline (score, XP, coins, streak). Only the deep breakdown folds away.
  const opp = opponents && opponents[0];
  const myScore = result.finalScore;
  const oppScore = opp ? (opp.score ?? 0) : null;
  const topicName = result.topic ? topicLabel(result.topic.key) : '';
  const tally = result.matchTally || {};
  const correctPct = tally.rounds ? Math.round((tally.correct / tally.rounds) * 100) : null;
  const avgSec = tally.answered ? (tally.totalMs / tally.answered / 1000) : null;
  const coinsEarned = adClaimed ? result.coins * 2 : result.coins;

  // Sentence case, never all-caps — the mockup's voice is "Belle victoire."
  const headline = t(isSolo ? 'resultSolo' : won ? 'resultWin' : tie ? 'resultTie' : 'resultLoss');

  return (
    <div className="container center results-v4">
      <div className="res-content">
        <div className="res-eyebrow">
          {topicName}{topicName && !isSolo && oppScore !== null ? ' \u00b7 ' : ''}
          {isSolo || oppScore === null ? '' : `${myScore} \u00e0 ${oppScore}`}
        </div>
        <h1 className={`res-title ${isSolo ? 'tie' : won ? 'win' : tie ? 'tie' : 'loss'}`}>
          {headline}<em>.</em>
        </h1>

        {leagueAward && <div className="res-league-award" role="status">
          <b>{leagueAward.lpChange > 0 ? '+' : ''}{leagueAward.lpChange} LP</b>
          <span>{t('leagueTitle')}</span>
        </div>}
        {result.dayStreakUp && result.dayStreak > 1 && <div className="res-inline-message" role="status">
          {t('dayStreakUp', { n: result.dayStreak })}
        </div>}
        {notices.map((notice, index) => <div className="res-inline-message" role="status" key={notice.id || index}>
          {notice.message || notice.text}
        </div>)}
        {left && <div className="res-left-note">{t('someoneLeft')}</div>}

        {!isSolo && opponents.length > 1 && result.leaderboard ? (
          <div className="res-group-board"><Leaderboard leaderboard={result.leaderboard} myId={myId} /></div>
        ) : !isSolo && opp ? (
          <div className={`res-scoreboard ${won ? 'win' : tie ? 'tie' : 'loss'}`}>
            <div className="res-score me">
              <div className="av" aria-label={name}><PlayerAvatar avatar={avatar} /></div>
              <div className="pts">{myScore}</div>
              <div className="nm">{t('you')}</div>
            </div>
            <div className="res-vs">vs</div>
            <div className="res-score op">
              <div className="av" aria-label={opp.name}><PlayerAvatar avatar={opp.avatar} /></div>
              <div className="pts">{oppScore}</div>
              <div className="nm">{opp.name}</div>
            </div>
          </div>
        ) : (
          <div className="res-soloboard">
            <div className="res-solo-score">{myScore}</div>
            <div className="res-solo-label">{t('matchScore')}</div>
          </div>
        )}

        {!isSolo && opp?.clientId && social.friends.some(f => f.id === opp.clientId) && <button className="social-btn" onClick={() => onOpenMessages?.(opp.clientId)}>Messages · {opp.name}</button>}
        {/* Reward signals stay visible — this is what the old screen got right */}
        <div className="res-rewards">
          <div className="res-reward">
            <b>+{result.xp}</b>
            <span>{t('xpTotal')}</span>
          </div>
          {result.coins > 0 && (
            <div className="res-reward">
              <b>+{coinsEarned}</b>
              <span>{adClaimed ? t('coinsDoubled') : t('coinBalance')}</span>
            </div>
          )}
          {result.dayStreak > 1 && (
            <div className="res-reward">
              <b>{result.dayStreak}j</b>
              <span>{t('dayStreak')}</span>
            </div>
          )}
        </div>

        <div className="res-cta">
          {!isSolo ? (
            <button className="res-btn-primary" onClick={rematch} disabled={rematchWaiting || rematchStarting}>
              {rematchWaiting || rematchStarting ? t('waitingDots') : t('rematch')}
            </button>
          ) : (
            <button className="res-btn-primary" onClick={newMatch} disabled={rematchStarting}>
              {t('newGame')}
            </button>
          )}
          {!isSolo && (
            <button className="res-btn-outline" onClick={newMatch} disabled={rematchStarting}>
              {t('newOpponent')}
            </button>
          )}
          <button className="res-btn-outline" onClick={playAgain} disabled={rematchStarting}>
            {t('backHome')}
          </button>
        </div>

        {result.stats && (
          <div className="res-level">
            <LevelRing level={result.stats.level} xpIntoLevel={result.stats.xpIntoLevel} xpForLevel={result.stats.xpForLevel} />
            <div className="res-level-text">
              <b>{t('level')} {result.stats.level}</b>
              <span>{result.stats.xpIntoLevel} / {result.stats.xpForLevel} XP</span>
            </div>
          </div>
        )}

        {adOffer && !adClaimed && result.coins > 0 && (
          <button className="res-btn-ad" onClick={onWatchAd}>
            <span aria-hidden="true">▶</span> {t('adDouble', { n: result.coins })}
          </button>
        )}

        <button className="res-details-toggle" onClick={() => setShowDetails((v) => !v)} aria-expanded={showDetails} aria-controls="match-result-details">
          {showDetails ? t('hideDetails') : t('showDetails')}
        </button>
      </div>

      {showDetails && (
      <div className="res-details" id="match-result-details">
      <h2 className="res-details-heading">{t('matchStatistics')}</h2>
      <div className="res-stats">
        <div className="res-stat"><b>{correctPct === null ? '—' : `${correctPct}%`}</b><span>{t('correctAnswers')}</span></div>
        <div className="res-stat"><b>{avgSec === null ? '—' : `${avgSec.toFixed(1)}s`}</b><span>{t('averageTime')}</span></div>
        <div className="res-stat"><b>{result.topic ? `N${result.topic.level}` : `+${result.xp}`}</b><span>{result.topic ? t('topicLevel') : t('xpTotal')}</span></div>
      </div>
      <div className="res-player-identity"><PlayerAvatar avatar={avatar} /><span>{name}</span></div>
      {result.topic && (
        <div className="result-topic-level">
          <span className="topic-level-badge">{result.topic.level}</span>
          <span>
            <strong>{t('topicLevelUp', { level: result.topic.level, topic: topicLabel(result.topic.key) })}</strong>
            <small>{t(topicTitleKey(result.topic.level))}</small>
          </span>
        </div>
      )}
      <div className="xp-breakdown">
        <div className="xpb-row"><span>{t('matchScore')}</span><span>{result.finalScore}</span></div>
        <div className="xpb-row"><span>{t('finishBonus')}</span><span>+{result.xpBreakdown?.finishBonus ?? 0}</span></div>
        <div className="xpb-row"><span>{t('winBonus')}</span><span>+{result.xpBreakdown?.winBonus ?? 0}</span></div>
        <div className="xpb-row total"><span>{t('xpTotal')}</span><span>{result.xp}</span></div>
      </div>
      {!isSolo && <Leaderboard leaderboard={result.leaderboard || []} myId={myId} />}
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
      </div>
      )}
    </div>
  );
}

// ─── Boutique v4 ────────────────────────────────────────────────
const QV4SHOP_CATEGORIES = [
  ['avatars', 'Avatars', 'Du caractère.', 'Trouve le personnage qui te ressemble.'],
  ['entries', 'Entrées', 'Une entrée qui claque.', 'Le duel commence. Fais ton apparition.'],
  ['reactions', 'Réactions', 'À toi de réagir.', 'Un petit geste entre deux grandes réponses.'],
  ['celebrations', 'Célébrations', 'Savoure la victoire.', 'Tu as gagné. Profite de ton moment.'],
];
const QV4SHOP_ITEMS = [
  { id: 'fox', category: 'avatars', name: 'Renard rusé', price: 350, art: 'fox', tone: 'amber', description: 'Malin. Rapide. Toujours une longueur d’avance.', badge: 'POPULAIRE' },
  { id: 'robot', category: 'avatars', name: 'Petit robot', price: 0, art: 'robot', tone: 'cyan', description: 'Curieux, positif, toujours partant.' },
  { id: 'brain', category: 'avatars', name: 'Cerveau en feu', price: 500, art: 'brain', tone: 'pink', description: 'Réfléchit vite. Très vite.', badge: 'NOUVEAU' },
  { id: 'astronaut', category: 'avatars', name: 'Cosmo', price: 450, art: 'astronaut', tone: 'cyan', description: 'La tête dans les étoiles, les réponses sur Terre.' },
  { id: 'ninja', category: 'avatars', name: 'Ninja furtif', price: 500, art: 'ninja', tone: 'pink', description: 'Discret jusqu’à la réponse décisive.' },
  { id: 'dragon', category: 'avatars', name: 'Dragon malicieux', price: 600, art: 'dragon', tone: 'green', description: 'Petit dragon. Grandes ambitions.', badge: 'NOUVEAU' },
  { id: 'cat', category: 'avatars', name: 'Chat de minuit', price: 400, art: 'cat', tone: 'pink', description: 'Neuf vies et un instinct redoutable.' },
  { id: 'owl', category: 'avatars', name: 'Hibou savant', price: 450, art: 'owl', tone: 'cyan', description: 'Il a lu la question avant tout le monde.' },
  { id: 'ghost', category: 'avatars', name: 'Fantôme joueur', price: 350, art: 'ghost', tone: 'ice', description: 'Adorable. Un peu imprévisible.' },
  { id: 'lion', category: 'avatars', name: 'Lion royal', price: 650, art: 'lion', tone: 'amber', description: 'Une crinière, une couronne et du panache.' },
  { id: 'lightning', category: 'entries', name: 'Éclair', price: 600, tone: 'amber', description: 'Apparais au milieu d’une décharge électrique.', badge: 'ANIMÉ' },
  { id: 'smoke', category: 'entries', name: 'Fumée', price: 600, tone: 'cyan', description: 'Un nuage bleu se dissipe et te révèle.', badge: 'ANIMÉ' },
  { id: 'pixels', category: 'entries', name: 'Pixels', price: 750, tone: 'pink', description: 'Ton personnage se matérialise pixel par pixel.', badge: 'ANIMÉ' },
  { id: 'portal', category: 'entries', name: 'Portail', price: 700, tone: 'pink', description: 'Traverse un passage lumineux venu d’ailleurs.', badge: 'ANIMÉ' },
  { id: 'flames', category: 'entries', name: 'Flammes', price: 650, tone: 'amber', description: 'Surgis dans une flambée rouge et or.', badge: 'ANIMÉ' },
  { id: 'glitch', category: 'entries', name: 'Glitch', price: 600, tone: 'cyan', description: 'Un bug dans la matrice. Et te voilà.', badge: 'ANIMÉ' },
  { id: 'tornado', category: 'entries', name: 'Tornade', price: 750, tone: 'ice', description: 'Un tourbillon te dépose au cœur du duel.', badge: 'ANIMÉ' },
  { id: 'meteor', category: 'entries', name: 'Météore', price: 850, tone: 'amber', description: 'Une arrivée fulgurante depuis les étoiles.', badge: 'ANIMÉ' },
  { id: 'clap', category: 'reactions', name: 'Bien joué', price: 200, tone: 'cyan', description: 'Une salve d’applaudissements pour ton adversaire.' },
  { id: 'sweat', category: 'reactions', name: 'Ça chauffe', price: 250, tone: 'pink', description: 'Une goutte de sueur : cette question était dure.' },
  { id: 'cool', category: 'reactions', name: 'Trop facile', price: 300, tone: 'amber', description: 'Les lunettes descendent. La confiance monte.' },
  { id: 'heart', category: 'reactions', name: 'J’adore', price: 200, tone: 'pink', description: 'Un grand cœur pour un beau moment.' },
  { id: 'angry', category: 'reactions', name: 'Pas content', price: 250, tone: 'amber', description: 'Une petite colère après une réponse ratée.' },
  { id: 'laugh', category: 'reactions', name: 'Mort de rire', price: 250, tone: 'cyan', description: 'Cette réponse méritait un fou rire.' },
  { id: 'shock', category: 'reactions', name: 'Incroyable', price: 300, tone: 'ice', description: 'Les yeux grands ouverts. Comment tu savais ça ?' },
  { id: 'thumbsup', category: 'reactions', name: 'Respect', price: 200, tone: 'green', description: 'Un pouce levé pour saluer le talent.' },
  { id: 'dance', category: 'celebrations', name: 'Victory dance', price: 700, tone: 'pink', description: 'Quelques pas de danse pour fêter ta victoire.', badge: 'ANIMÉ' },
  { id: 'throne', category: 'celebrations', name: 'Trône', price: 900, tone: 'amber', description: 'Prends place. Cette partie était la tienne.', badge: 'NOUVEAU' },
  { id: 'fireworks', category: 'celebrations', name: 'Feu d’artifice', price: 800, tone: 'pink', description: 'Des explosions de couleur pour le dernier mot.', badge: 'ANIMÉ' },
  { id: 'disco', category: 'celebrations', name: 'Disco fever', price: 750, tone: 'cyan', description: 'Boule à facettes et piste de danse : c’est ta soirée.', badge: 'ANIMÉ' },
  { id: 'micdrop', category: 'celebrations', name: 'Mic drop', price: 700, tone: 'pink', description: 'Le micro tombe. Tout est dit.', badge: 'ANIMÉ' },
  { id: 'rocket', category: 'celebrations', name: 'Décollage', price: 850, tone: 'amber', description: 'Direction les étoiles après cette victoire.', badge: 'ANIMÉ' },
  { id: 'spotlight', category: 'celebrations', name: 'Sous les projecteurs', price: 750, tone: 'ice', description: 'Les lumières s’allument pour ton grand final.', badge: 'ANIMÉ' },
];
const QV4shopNumber = (number) => number.toLocaleString('fr-FR');

function QV4ShopIcon({ name, size = 22 }) {
  const paths = {
    coin: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18Zm1 3-4 7h4l-2 5',
    arrow: 'M5 12h14m-6-6 6 6-6 6',
    close: 'm6 6 12 12M6 18 18 6',
    play: 'm9 5 11 7-11 7Z',
    shop: 'M4 9h16l-2-6H6L4 9Zm1 0v12h14V9M9 21v-7h6v7',
    home: 'm3 10 9-7 9 7M5 9v12h5v-7h4v7h5V9',
    profile: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
    feed: 'M5 5h14M5 12h10M5 19h14',
    bolt: 'm13 2-9 12h7l-1 8 10-12h-7l1-8Z',
    check: 'm5 12 4 4 10-10',
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name] || paths.shop} /></svg>;
}


function QV4ShopPreviewDialog({ item, owned, equipped, coins, avatar, name, onClose, onBuy, onEquip, pending = false, onPlay, canBuy, canEquip, message }) {
  const ref = React.useRef(null);
  const titleId = React.useId();
  const descriptionId = React.useId();
  const pendingRef = React.useRef(pending);
  pendingRef.current = pending;
  const [replay, setReplay] = React.useState(0);
  React.useEffect(() => {
    const opener = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    (ref.current.querySelector('button:not(:disabled)') || ref.current).focus();
    const onKey = (event) => {
      if (event.key === 'Escape') { event.preventDefault(); if (!pendingRef.current) onClose(); }
      if (event.key !== 'Tab') return;
      const buttons = [...ref.current.querySelectorAll('button:not(:disabled)')];
      if (!buttons.length) { event.preventDefault(); ref.current.focus(); return; }
      const first = buttons[0], last = buttons[buttons.length - 1];
      if (!buttons.includes(document.activeElement)) { event.preventDefault(); (event.shiftKey ? last : first).focus(); }
      else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = previousOverflow; if (opener?.isConnected) opener.focus(); };
  }, [onClose]);
  const busy = pending;
  const canAct = owned ? canEquip : canBuy;
  const affordable = coins >= item.price;
  const hasAnimation = !['avatars'].includes(item.category);
  const previewAvatar = item.category === 'avatars' ? item.art : avatar;
  const previewCaption = { avatars: 'Ton personnage, prêt pour le prochain duel.', entries: 'Ton apparition au début du duel.', reactions: 'Ta réaction entre deux questions.', celebrations: 'Ton moment après la victoire.' }[item.category];
  return <div className="shop-v4-dialog-backdrop" onClick={(event) => { if (!busy && event.target === event.currentTarget) onClose(); }}>
    <section ref={ref} className="shop-v4-dialog" role="dialog" tabIndex={-1} aria-modal="true" aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={busy}>
      <button type="button" disabled={busy} className="shop-v4-close" onClick={onClose} aria-label={"Fermer l\u2019aper\u00E7u"}><QV4ShopIcon name="close" /></button>
      <div className="shop-v4-dialog-art">
        <div className="qa-preview-head"><span>Dans le duel</span><span>Simulation visuelle</span></div>
        <div className="qa-preview-players">
          <div className="qa-preview-player"><PlayerAvatar avatar={previewAvatar} /><div><strong>{name}</strong><small>Toi</small></div></div>
          <span className="qa-preview-versus">VS</span>
          <div className="qa-preview-player"><PlayerAvatar avatar="fox" /><div><strong>Camille</strong><small>Adversaire</small></div></div>
        </div>
        <div className="qa-preview-stage" key={replay}><QV4ShopArt item={item} avatar={avatar} animated /></div>
        <p className="qa-preview-caption">{previewCaption}</p>
      </div>
      <div className="shop-v4-dialog-body">
        <p className="shop-v4-eyebrow">APERÇU POUR {name}</p><h2 id={titleId}>{item.name}</h2><p id={descriptionId}>{item.description}</p>
        {hasAnimation && <button type="button" disabled={busy} className="shop-v4-replay" onClick={() => setReplay((value) => value + 1)}><QV4ShopIcon name="play" size={16} /> {'Rejouer l\u2019aper\u00E7u'}</button>}
        <button type="button" className="shop-v4-button shop-v4-dialog-primary" disabled={busy || equipped || !canAct || (!owned && !affordable)} onClick={() => owned ? onEquip(item) : onBuy(item)}>
          {busy ? 'Demande en cours…' : equipped ? 'Équipé' : !canAct ? 'Indisponible' : owned ? 'Équiper' : !affordable ? `${QV4shopNumber(item.price - coins)} pièces manquantes` : `Acheter · ${QV4shopNumber(item.price)} pièces`}
        </button>
        <p className="shop-v4-status" role="status">{message}</p>
        {!owned && !affordable && typeof onPlay === 'function' && <button type="button" disabled={busy} className="shop-v4-replay" onClick={onPlay}>Jouer pour gagner des pièces</button>}
      </div>
    </section>
  </div>;
}

export function ShopContent({ avatar = 'robot', name = 'QuizMaster', stats = {}, onBuy, onEquip, onPlay, onBack, pending = false, controls }) {
  const [category, setCategory] = React.useState('avatars');
  const [selection, setSelection] = React.useState(null);
  const [notice, setNotice] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const requestRef = React.useRef(false);
  const busy = pending || submitting;
  const closePreview = React.useCallback(() => setSelection(null), []);
  const serverStats = stats && typeof stats === 'object' ? stats : {};
  const inventory = Array.isArray(serverStats.ownedItems) ? serverStats.ownedItems.filter(id => typeof id === 'string') : [];
  const serverEquipment = serverStats.equippedItems && typeof serverStats.equippedItems === 'object' ? serverStats.equippedItems : {};
  const session = {
    coins: Number.isFinite(serverStats.coins) ? Math.max(0, Math.floor(serverStats.coins)) : 0,
    owned: ['robot', ...inventory],
    equipped: Object.fromEntries(QV4SHOP_CATEGORIES.map(([key]) => [key, QV4SHOP_ITEMS.some(item => item.category === key && item.id === serverEquipment[key]) ? serverEquipment[key] : null])),
  };
  const items = QV4SHOP_ITEMS.filter(item => item.category === category);
  const categoryData = QV4SHOP_CATEGORIES.find(([id]) => id === category);
  const currentAvatar = avatarId(session.equipped.avatars || avatar);
  if (QV4SHOP_ITEMS.some(item => item.category === 'avatars' && item.id === currentAvatar)) session.equipped.avatars = currentAvatar;
  const equippedAvatar = QV4SHOP_ITEMS.find(item => item.category === 'avatars' && item.id === currentAvatar) || { category: 'avatars', art: currentAvatar, name: 'Ton avatar', tone: 'cyan' };
  const featured = items[0];
  async function request(item, type) {
    const owned = session.owned.includes(item.id);
    const callback = type === 'buy' ? onBuy : onEquip;
    if (busy || requestRef.current || typeof callback !== 'function') return;
    if (type === 'buy' && (owned || session.coins < item.price)) return;
    if (type === 'equip' && (!owned || session.equipped[item.category] === item.id)) return;
    requestRef.current = true;
    setSubmitting(true);
    setNotice(type === 'buy' ? 'Achat demandé. En attente de confirmation.' : 'Équipement demandé. En attente de confirmation.');
    try { await callback(item.id); }
    catch { setNotice('Impossible de terminer la demande. Réessaie.'); }
    finally { requestRef.current = false; setSubmitting(false); }
  }
  const buy = item => request(item, 'buy');
  const equip = item => request(item, 'equip');
  return <section className="shop-v4-root" aria-labelledby="shop-v4-title">
    <header className="shop-v4-header">{typeof onBack === 'function' && <button type="button" disabled={busy} className="shop-v4-back" onClick={onBack} aria-label="Retour"><QV4ShopIcon name="arrow" /></button>}<span className="shop-v4-brand">QuizzUp<span>{'✦'}</span></span><div className="shop-v4-wallet" aria-label={`${QV4shopNumber(session.coins)} pièces`}><QV4ShopIcon name="coin" /><strong>{QV4shopNumber(session.coins)}</strong></div>{controls}</header>
    <div className="shop-v4-heading"><p className="shop-v4-eyebrow">TON STYLE. TES RÈGLES.</p><h1 id="shop-v4-title">La boutique<span>.</span></h1><p>Fais de chaque duel un peu plus le tien.</p></div>
    <nav className="shop-v4-categories" aria-label="Catégories de la boutique">{QV4SHOP_CATEGORIES.map(([id, label]) => <button type="button" disabled={busy} key={id} aria-pressed={category === id} onClick={() => { setCategory(id); setNotice(''); }}>{label}</button>)}</nav>
    <section className={`shop-v4-hero shop-v4-tone-${featured.tone}`} aria-label={`À la une : ${featured.name}`}>
      <div className="shop-v4-hero-copy"><span className="shop-v4-tag">À LA UNE</span><h2>{categoryData[2]}</h2><p>{categoryData[3]}</p><button type="button" disabled={busy} className="shop-v4-button" onClick={() => { setNotice(''); setSelection(featured); }}>Découvrir <QV4ShopIcon name="arrow" size={18} /></button></div>
      <div className="shop-v4-hero-art" key={category}><QV4ShopArt item={featured} avatar={currentAvatar} animated /></div>
    </section>
    <div className="shop-v4-profile-preview"><div className="shop-v4-profile-icon"><QV4ShopArt item={equippedAvatar} avatar={currentAvatar} /></div><div><strong>{name}</strong><span>{equippedAvatar.name} · Ton look actuel</span></div><span className="shop-v4-preview-label">APERÇU</span></div>
    <div className="shop-v4-section-heading"><h2>{categoryData[1]}</h2><span>{items.length} objets</span></div>
    <div className="shop-v4-grid">{items.map((item) => {
      const owned = session.owned.includes(item.id), equipped = session.equipped[item.category] === item.id;
      return <article key={item.id} className={`shop-v4-card ${equipped ? 'shop-v4-card-equipped' : ''}`}>
        <button type="button" disabled={busy} className="shop-v4-card-preview" aria-label={`Essayer ${item.name}`} onClick={() => { setNotice(''); setSelection(item); }}><QV4ShopArt item={item} avatar={currentAvatar} />{item.badge && <span className="shop-v4-card-badge">{item.badge}</span>}<span className="shop-v4-card-try">Essayer <QV4ShopIcon name="arrow" size={14} /></span></button>
        <div className="shop-v4-card-body"><h3>{item.name}</h3><p>{item.description}</p><button type="button" disabled={busy} className={`shop-v4-price ${owned ? 'shop-v4-price-owned' : ''}`} onClick={() => { setNotice(''); setSelection(item); }} aria-label={`${owned ? 'Voir' : 'Acheter'} ${item.name}`}><QV4ShopIcon name={owned ? 'check' : 'coin'} size={17} />{equipped ? 'Équipé' : owned ? 'Possédé' : QV4shopNumber(item.price)}</button></div>
      </article>;
    })}</div>

    <p className="shop-v4-footer-note">{'Le style s\u2019ach\u00E8te. Les victoires se gagnent.'}</p>
    {selection && <QV4ShopPreviewDialog item={selection} owned={session.owned.includes(selection.id)} equipped={session.equipped[selection.category] === selection.id} coins={session.coins} avatar={currentAvatar} name={name} onClose={closePreview} onBuy={buy} onEquip={equip} pending={busy} onPlay={onPlay} canBuy={typeof onBuy === 'function'} canEquip={typeof onEquip === 'function'} message={notice} />}
  </section>;
}
