import { QuestionContent as EnhancedQuestionContent } from './enhanced-QuestionContent';
import React, { useState, useMemo, useEffect } from 'react';
import { StreakBadge, StreakCalendar } from './DailyStreak';
import { ShareCard } from './ShareCard';
import { ChallengeButton } from './ChallengeLink';
import { AVATARS, CATEGORIES, FAMILIES, categoriesInFamily, normalizeForSearch, famLabel, SoloToggle, CategoryTile, FamilyGrid, SearchBar, PlayerPhoto, LevelRing, Icon } from './ui';
import { CategoryTileV4 } from './CategoryTileV4';
import { PlayerHud, Leaderboard } from './multiplayer';
import { ProfileStats } from './stats';
import { FriendsScreen } from './social';
import { TopicLevelList, topicTitleKey, topicLabel } from './players';
import { useI18n } from './i18n';
import { PlayerAvatar, AVATAR_IDS, avatarId } from './PlayerAvatar';
import { ShopArt as QV4ShopArt } from './shop-art';

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

export function HomeContent({ name, avatar, frame, soloMode, setSoloMode, quickMatch, startWithCategory, onOpenProfile, onSeeAll, createRoom, onOpenEnterCode, onStartTournament, onOpenFriends, onOpenLeague, onOpenSeasonPass, pending, stats, controls }) {
  const { t } = useI18n();
  const [showMore, setShowMore] = useState(false);
  // Keep up to 7 featured covers for Mes thèmes; Spider-Man-equivalent card gets the 2:1 "featured" slot.
  const myThemes = FEATURED_TOPICS.slice(0, 7);
  const [heroTopic, ...rest] = myThemes;
  const games = (stats && stats.games) || 0;
  const followers = (stats && stats.followers) || 0;
  const following = (stats && stats.following) || 0;
  return (
    <div className="container wide home-v4">
      <header className="home-head home-head--v4">
        <div className="home-brand">
          <div className="home-brandmark">Q</div>
          <div className="home-logo-sm">Quizz<span>Up</span></div>
        </div>
        <div className="home-actions">
          <button className="home-action" onClick={() => onSeeAll && onSeeAll()} aria-label={t('searchPlaceholder')}>
            <Icon name="search" size={18} />
          </button>
          <button className="home-action" onClick={() => onOpenFriends && onOpenFriends()} aria-label={t('friends')}>
            <Icon name="users" size={18} />
          </button>
          {controls}
        </div>
      </header>
      <button className="profile-card-v4" onClick={onOpenProfile} aria-label={t('editProfile')}>
        <div className="profile-row-v4">
          <div className="profile-avatar-v4"><PlayerAvatar avatar={avatar} /></div>
          <div className="profile-identity-v4">
            <div className="profile-name-v4">{name || 'Joueur'}</div>
            <div className="profile-bio-v4">{t('hey', { name })}</div>
          </div>
        </div>
        <div className="profile-stats-v4">
          <span><b>{games}</b> parties</span>
          <span className="dot">·</span>
          <span><b>{followers}</b> amis</span>
          <span className="dot">·</span>
          <span>tu suis <b>{following}</b></span>
        </div>
      </button>
      <div className="home-solo-row">
        <SoloToggle solo={soloMode} onChange={setSoloMode} />
      </div>
      <div className="section-head-v4">
        <h2 className="section-title-v4">Mes thèmes</h2>
        <button className="section-edit" onClick={() => onSeeAll && onSeeAll()}>
          {t('seeAll')}
        </button>
      </div>
      <div className="topics-grid-v4">
        {heroTopic && (
          <div className="topic-tile-wrap topic-tile-wrap--featured" data-topic={heroTopic.key}>
            <CategoryTileV4 c={heroTopic} featured onClick={() => startWithCategory(heroTopic.key)} disabled={pending} />
          </div>
        )}
        {rest.map((c) => (
          <div key={c.key} className="topic-tile-wrap" data-topic={c.key}>
            <CategoryTileV4 c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />
          </div>
        ))}
      </div>
      <div className="section-head-v4">
        <h2 className="section-title-v4">{t('allTopics')}</h2>
        <button className="section-edit" onClick={() => onSeeAll && onSeeAll()}>{t('seeAll')}</button>
      </div>
      <FamilyGrid onSelect={onSeeAll} />
      <div className="home-social-row-v4">
        <button className="social-chip" onClick={createRoom} disabled={pending}><Icon name="users" size={16} /> {t('party')}</button>
        <button className="social-chip" onClick={onOpenEnterCode}><Icon name="key" size={16} /> {t('joinCode')}</button>
      </div>
      <button
        className="more-toggle"
        type="button"
        onClick={() => setShowMore((v) => !v)}
      >
        {showMore ? t('back') : '•••'}
      </button>
      {showMore && (
        <div className="home-extras-v4">
          <button className="extra-chip" onClick={() => onStartTournament && onStartTournament()} disabled={pending}>
            <span>🏆</span> {t('tournament')}
          </button>
          <button className="extra-chip" onClick={() => onOpenLeague && onOpenLeague()} disabled={pending}>
            <span>🏆</span> {t('league')}
          </button>
          <button className="extra-chip" onClick={() => onOpenSeasonPass && onOpenSeasonPass()} disabled={pending}>
            <span>🎯</span> {t('seasonPass')}
          </button>
        </div>
      )}
      {/* Hidden Quick Play button — triggered from NavBar bolt */}
      <button
        className="quick-play quick-play--hidden"
        onClick={quickMatch}
        disabled={pending}
        aria-busy={pending || undefined}
        aria-label={t('quickPlay')}
        aria-hidden="true"
        tabIndex={-1}
      >
        <Icon name="bolt" size={21} />
      </button>
    </div>
  );
}

// Topic preview short descriptions (fallback for featured sub)
const PREVIEW_SUB = {
  spider_man: { line1: 'SPIDER', line2: 'MAN', eyebrow: 'POP CULTURE · MARVEL', sub: 'Multiverse', desc: 'Du Peter de Raimi au Miles de Across. 150 questions pour départager les vrais fans des Avengers du dimanche.' },
  harry_potter: { line1: 'HARRY', line2: 'POTTER', eyebrow: 'POP CULTURE · WIZARDING', sub: 'Wizarding World', desc: 'Poudlard, sortilèges & créatures magiques. Les vrais fans vont se régaler.' },
  marvel: { line1: 'MARVEL', eyebrow: 'POP CULTURE · MARVEL', sub: 'Avengers', desc: 'Avengers, X-Men, et tout l\'univers Marvel réuni.' },
  dc_comics: { line1: 'DC', line2: 'COMICS', eyebrow: 'POP CULTURE · DC', sub: 'Multiverse', desc: 'Justice League, Batman, Superman — l\'univers DC Comics.' },
  batman: { line1: 'BAT', line2: 'MAN', eyebrow: 'POP CULTURE · DC', sub: 'Gotham', desc: 'Gotham, le Chevalier Noir, Joker et toute la Bat-Famille.' },
  star_wars: { line1: 'STAR', line2: 'WARS', eyebrow: 'POP CULTURE · LUCASFILM', sub: 'Saga', desc: 'La Force, les Jedi, les Sith — toute la saga galactique.' },
  game_of_thrones: { line1: 'GAME OF', line2: 'THRONES', eyebrow: 'SÉRIE · HBO', sub: 'Westeros', desc: 'Westeros, dragons, trônes et trahisons.' },
  one_piece: { line1: 'ONE', line2: 'PIECE', eyebrow: 'MANGA · SHONEN', sub: 'Grand Line', desc: 'Luffy et l\'équipage du Chapeau de paille à la recherche du One Piece.' },
  pokemon: { line1: 'POKÉMON', eyebrow: 'POP CULTURE · GAMING', sub: 'Pokéverse', desc: 'Attrapez-les tous ! Les 1000+ Pokémon depuis la génération 1.' },
  minecraft: { line1: 'MINE', line2: 'CRAFT', eyebrow: 'GAMING · SANDBOX', sub: 'Overworld', desc: 'Blocs, créatures, biomes & dimensions du jeu culte.' },
  rap_fr: { line1: 'RAP', line2: 'FR', eyebrow: 'MUSIQUE · RAP', sub: 'France · 2024', desc: 'PNL, Booba, Jul, SCH & tous les grands noms du rap français.' },
  werenoi: { line1: 'WERE', line2: 'NOI', eyebrow: 'MUSIQUE · RAP FR', sub: 'Rap FR · 2024', desc: 'La discographie et l\'univers de Werenoi.' },
  ligue_champions: { line1: 'LIGUE DES', line2: 'CHAMPIONS', eyebrow: 'SPORT · FOOTBALL', sub: 'UEFA', desc: 'Finales, légendes & records de la plus grande compétition européenne.' },
};

export function CategoryPreviewContent({ category, stats, onBack, onPlay, onChallenge, pending, friendsOnTopic = [], controls }) {
  const { t } = useI18n();
  if (!category) return null;
  const preview = PREVIEW_SUB[category.key] || { eyebrow: category.family || 'QUIZ', desc: category.desc };
  const topicStats = (stats && stats.topics || []).find((t) => t.key === category.key) || {};
  const completion = topicStats.completion || 0;
  const bestStreak = topicStats.bestStreak || 0;
  const topicLevel = topicStats.level || 1;
  return (
    <div className="container wide category-preview-v4" data-topic={category.key} data-family={category.family}>
      <div className="cp-bg" aria-hidden="true" />

      {/* Decorative overlay for Spider-Man / Marvel */}
      {(category.key === 'spider_man' || category.key === 'marvel') && (
        <svg className="cp-web" viewBox="0 0 100 100" aria-hidden="true">
          <g fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5">
            <path d="M50 50L0 0M50 50L100 0M50 50L0 100M50 50L100 100M50 50L50 0M50 50L50 100M50 50L0 50M50 50L100 50"/>
            <path d="M30 30A28 28 0 0 1 70 30M20 50A42 42 0 0 1 80 50M30 70A28 28 0 0 0 70 70M35 35A20 20 0 0 1 65 35M25 50A32 32 0 0 1 75 50" strokeDasharray="2 2"/>
          </g>
        </svg>
      )}

      <div className="cp-head">
        <button className="cp-back" onClick={onBack} aria-label={t('back')}>
          <Icon name="arrow" size={18} className="cp-back-ic" />
        </button>
        <div className="cp-head-right">
          <button className="cp-icon-btn" aria-label="Favori">
            <Icon name="heart" size={18} />
          </button>
          <button className="cp-icon-btn" aria-label="Partager">
            <Icon name="share" size={18} />
          </button>
          {controls}
        </div>
      </div>

      <div className="cp-hero">
        <div className="cp-eyebrow">{preview.eyebrow}</div>
        <h1 className="cp-title">
          {preview.line1 ? (
            <>
              <span className="cp-title-l">{preview.line1}</span>
              {preview.line2 && <span className="cp-title-l">{preview.line2}</span>}
            </>
          ) : (
            <span className="cp-title-l">{category.label}</span>
          )}
          {preview.sub && <span className="cp-subtitle">{preview.sub}</span>}
        </h1>
        <p className="cp-info">{preview.desc}</p>
      </div>

      <div className="cp-stats">
        <div className="cp-stat"><b>{completion}%</b><span>complété</span></div>
        <div className="cp-stat"><b>{bestStreak}</b><span>meilleure série</span></div>
        <div className="cp-stat"><b>N{topicLevel}</b><span>niveau actuel</span></div>
      </div>

      <div className="cp-cta">
        <button className="cp-play" onClick={onPlay} disabled={pending}>
          <Icon name="bolt" size={18} />
          Jouer maintenant
        </button>
        <button className="cp-ghost" onClick={onChallenge} disabled={pending} aria-label="Défier un ami">
          <Icon name="profile" size={18} />
        </button>
      </div>

      <div className="cp-friends">
        <h3>Tes amis sur ce quiz</h3>
        {friendsOnTopic.length > 0 ? (
          <div className="cp-friends-row">
            {friendsOnTopic.slice(0, 4).map((f) => (
              <div key={f.id} className="cp-friend-ava">{(f.name || '?')[0].toUpperCase()}</div>
            ))}
            {friendsOnTopic.length > 4 && <span className="cp-friends-more">+ {friendsOnTopic.length - 4} autres</span>}
          </div>
        ) : (
          <div className="cp-friends-empty">Personne pour l'instant. Sois le premier à défier tes amis.</div>
        )}
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
          <div className="topics-grid-v4">
            {results.map((c) => (
              <div key={c.key} className="topic-tile-wrap" data-topic={c.key}>
                <CategoryTileV4 c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">{t('noResults', { q: query })}</div>
        )
      ) : activeFamily ? (
        <>
          <button className="back-to-topics" onClick={() => onSelectFamily(null)}>{t('backToTopics')}</button>
          <div className="topics-grid-v4">
            {categoriesInFamily(activeFamily.key).map((c) => (
              <div key={c.key} className="topic-tile-wrap" data-topic={c.key}>
                <CategoryTileV4 c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />
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
    </div>
  );
}

export function ProfileContent({
  avatar, name, stats, isGoogleLinked, googleEmail, linkGoogle, linking,
  clientId, social, onOpenLeaderboard, onOpenShop, onSaveProfile, profileSaving, onOpenTopic, streak,
  league, onOpenLeague,
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

  // XP progression
  const xpPct = stats.xpForLevel ? Math.min(100, Math.round((stats.xpIntoLevel / stats.xpForLevel) * 100)) : 0;
  const xpRemaining = stats.xpForLevel ? (stats.xpForLevel - (stats.xpIntoLevel || 0)) : 0;

  // Social counts
  const friendCount = social?.friends?.length || 0;
  const followingCount = stats.following || 0;

  return (
    <div className="container pf-v4">
      {/* ── Hero ──────────────────────────────────────────── */}
      <div className="pf-hero">
        <div className="pf-avatar-wrap">
          <div className="pf-avatar"><PlayerAvatar avatar={avatar} /></div>
          <button className="pf-edit-dot" aria-label={t('editProfile')} onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            <Icon name="edit" size={11} />
          </button>
        </div>
        <div className="pf-name">{name}</div>
        <div className="pf-bio">{t('level')} {stats.level}</div>
        <div className="pf-social">
          {stats.games || 0} {t('games').toLowerCase()} · {friendCount} {t('friends').toLowerCase()} · suit {followingCount} {t('players').toLowerCase()}
        </div>
      </div>

      {/* ── Editor (toggle) ───────────────────────────────── */}
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
            {AVATAR_IDS.filter((id) => id === 'robot' || stats.ownedItems?.includes(id)).map((option, index) => (
              <button
                key={option}
                className={`avatar-opt ${draftAvatar === option ? 'active' : ''}`}
                onClick={() => setDraftAvatar(option)}
                aria-label={`${t('avatar')} ${index + 1}`}
                aria-pressed={draftAvatar === option}
              >
                <PlayerAvatar avatar={option} />
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

      {/* ── Level progression card ────────────────────────── */}
      <div className="pf-section-title">{t('overallProgress')}</div>
      <div className="pf-level-card">
        <div className="pf-level-head">
          <span className="pf-level-label">{t('level')} {stats.level}</span>
          <span className="pf-level-pct">{xpPct}%</span>
        </div>
        <div className="pf-xp-bar"><div className="pf-xp-fill" style={{ width: `${xpPct}%` }} /></div>
        <div className="pf-xp-text">{xpRemaining} {t('beforeNextLevel')} {stats.level + 1}</div>
      </div>

      {/* ── League card ───────────────────────────────────── */}
      {league && (
        <div className="profile-league-card" onClick={() => onOpenLeague && onOpenLeague()}>
          <div className="pl-tier">{league.tier.icon} {league.tier.label}</div>
          <div className="pl-lp">{league.lp} LP</div>
          <div className="pl-progress"><div className="pl-progress-fill" style={{ width: `${league.progress}%`, background: league.tier.color }} /></div>
          <div className="pl-stats">{league.wins}W / {league.losses}L · {league.winRate}% WR</div>
        </div>
      )}

      {/* ── Streak ────────────────────────────────────────── */}
      {streak && streak.streak > 0 && (
        <StreakCalendar
          streak={streak.streak}
          calendar={streak.calendar || []}
          nextMilestone={streak.nextMilestone}
          milestoneProgress={streak.milestoneProgress}
        />
      )}

      {/* ── My themes (mini topic grid) ───────────────────── */}
      {stats.topics && stats.topics.length > 0 && (
        <>
          <div className="pf-section-title">{t('myTopics')}</div>
          <div className="pf-themes">
            {stats.topics.slice(0, 8).map((topic) => {
              const cat = CATEGORIES.find((c) => c.key === topic.key);
              return (
                <button
                  key={topic.key}
                  className="pf-theme-tile"
                  data-family={cat?.family || ''}
                  onClick={() => onOpenTopic && onOpenTopic(topic.key)}
                >
                  <span className="pf-theme-icon">{cat?.icon || '📚'}</span>
                  <span className="pf-theme-lvl">N{topic.level}</span>
                </button>
              );
            })}
          </div>
        </>
      )}

      {/* ── Stats grid ────────────────────────────────────── */}
      <div className="pf-section-title">{t('statistics')}</div>
      <ProfileStats stats={stats} />

      {/* ── CTAs ──────────────────────────────────────────── */}
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

      {/* ── Friends ───────────────────────────────────────── */}
      <FriendsScreen social={social} />

      {/* ── Account link + privacy ────────────────────────── */}
      {isGoogleLinked ? (
        <div className="account-linked">{'✓'} {t('connectedGoogle', { email: googleEmail })}</div>
      ) : (
        <button className="social-btn outline account-link-btn" onClick={linkGoogle} disabled={linking || !clientId}>
          {linking ? t('connecting') : t('connectGoogle')}
        </button>
      )}
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
    <div className="container center matchmaking-v4">
      <div className="status-label" role="status" aria-live="polite">
        {reconnecting ? t('reconnecting') : pending ? t('leavingQueue') : t('matchmaking')}
      </div>
      <div className="matchmaking-topic">{category?.label || t('randomTopic')}</div>
      <div className="vs-screen">
        <div className="vs-player">
          <div className="vs-ava"><PlayerAvatar avatar={avatar} /></div>
          <div className="vs-name">{name}</div>
          <div className="vs-level">{t('level')} {level}</div>
        </div>
        <div className="vs-bolt-wrap"><div className="vs-bolt"><Icon name="bolt" size={24} /></div></div>
        <div className="vs-player">
          <div className="vs-ava searching"><Icon name="users" size={30} /></div>
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
  if (intro.round === 1 && opponents.length === 1) {
    const opponent = opponents[0];
    return <section className="container match-intro" aria-label={`${name} ${t('versus')} ${opponent.name}`}>
      <div className="match-intro-topic">{intro.category}</div>
      <div className="match-intro-arena">
        <div className="match-intro-player match-intro-player-me">
          <div className="match-intro-avatar"><PlayerAvatar avatar={avatar} /></div>
          <h2>{name}</h2><span>{t('level')} {level || 1}</span>
        </div>
        <div className="match-intro-vs" aria-hidden="true"><Icon name="bolt" size={32} /><b>VS</b></div>
        <div className="match-intro-player match-intro-player-other">
          <div className="match-intro-avatar"><PlayerAvatar avatar={opponent.avatar} /></div>
          <h2>{opponent.name}</h2><span>{t('opponent')}</span>
        </div>
      </div>
      <div className="match-intro-caption">{t('roundOf', { n: 1, total: totalRounds })}</div>
    </section>;
  }
  return (
    <div className="container center round-intro-screen">
      <div className={`round-intro-icon ${intro.isBonus ? 'bonus' : ''}`}>{intro.icon}</div>
      <div className="round-intro-cat">{intro.category}</div>
      {difficultyKey && <div className={`difficulty-pill ${intro.difficulty}`}>{t(difficultyKey)}</div>}
      <div className="round-intro-round">{intro.isBonus ? t('bonusRound') : t('round', { n: intro.round })}</div>
      <div className="round-intro-sub">{intro.isBonus ? t('doublePoints') : t('roundOf', { n: intro.round, total: totalRounds })}</div>
    </div>
  );
}

export const QuestionContent = EnhancedQuestionContent;

export function FinishedContent({ result, opponents, myId, avatar, name, frame, social, addFriend, playAgain, rematch, rematchWaiting, rematchStarting, newMatch, adOffer, onWatchAd, adClaimed, streak, onShowShare }) {
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

export function ShopContent({ avatar = 'robot', name = 'QuizMaster', stats = {}, onBuy, onEquip, onPlay, onBack, pending = false }) {
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
    <header className="shop-v4-header">{typeof onBack === 'function' && <button type="button" disabled={busy} className="shop-v4-back" onClick={onBack} aria-label="Retour"><QV4ShopIcon name="arrow" /></button>}<span className="shop-v4-brand">QuizzUp<span>{'✦'}</span></span><div className="shop-v4-wallet" aria-label={`${QV4shopNumber(session.coins)} pièces`}><QV4ShopIcon name="coin" /><strong>{QV4shopNumber(session.coins)}</strong></div></header>
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
