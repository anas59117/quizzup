import React, { useState, useMemo, useEffect } from 'react';
import { AVATARS, CATEGORIES, FAMILIES, categoriesInFamily, normalizeForSearch, famLabel, SoloToggle, CategoryTile, FamilyGrid, SearchBar, PlayerPhoto, LevelRing, Icon } from './ui';
import { PlayerHud, Leaderboard } from './multiplayer';
import { ProfileStats, RecentMatches } from './stats';
import { FriendsScreen } from './social';
import { useI18n } from './i18n';

const FEATURED_TOPIC_KEYS = [
  'foot_fr', 'rap_fr', 'premier_league', 'la_liga',
  'tennis', 'basketball', 'kpop', 'actors',
];
const FEATURED_TOPICS = FEATURED_TOPIC_KEYS
  .map((key) => CATEGORIES.find((category) => category.key === key))
  .filter(Boolean);

export function HomeContent({ name, avatar, soloMode, setSoloMode, quickMatch, startWithCategory, onOpenProfile, onSeeAll, createRoom, onOpenEnterCode, pending }) {
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
        <button className="home-avatar-chip" onClick={onOpenProfile} aria-label="Open profile">{avatar}</button>
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

export function CategoriesContent({ startWithCategory, onBack, initialFamily, pending }) {
  const { t } = useI18n();
  const [family, setFamily] = useState(initialFamily || null);
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
          <button className="back-to-topics" onClick={() => setFamily(null)}>{t('backToTopics')}</button>
          <div className="topics-grid full">
            {categoriesInFamily(activeFamily.key).map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />)}
          </div>
        </>
      ) : (
        <FamilyGrid onSelect={setFamily} />
      )}
      <a className="cover-credits-link" href="/image-credits.html" target="_blank" rel="noopener noreferrer">
        Crédits photos
      </a>
    </div>
  );
}

export function ProfileContent({
  avatar, name, stats, isGoogleLinked, googleEmail, linkGoogle, linking,
  clientId, social, onOpenLeaderboard, onSaveProfile, profileSaving,
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
      <div className="profile-head">
        <div className="profile-avatar">{avatar}</div>
        <div className="profile-name">{name || 'Player'}</div>
        <div className="profile-sub">
          {t('level')} {stats.level} {'·'} {stats.games ? Math.round((stats.wins / stats.games) * 100) : 0}% {String(t('wins')).toLowerCase()}
        </div>
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

      <ProfileStats stats={stats} />
      <RecentMatches matches={stats.recent} />
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


export function LeaderboardContent({ board, loading, onBack }) {
  const { t } = useI18n();
  const entries = board?.entries || [];
  const topThree = entries.slice(0, 3);
  const remaining = entries.slice(3);

  return (
    <div className="container wide">
      <div className="cat-header">
        <div>
          <div className="status-label">{t('seasonAllTime')}</div>
          <h2>{t('globalLeaderboard')}</h2>
        </div>
        <button className="back-link" onClick={onBack}>{t('back')}</button>
      </div>

      {loading && !entries.length ? (
        <div className="leaderboard-loading" aria-live="polite">
          <div className="loading-bar"><div className="loading-fill" /></div>
          <span>{t('loadingRanking')}</span>
        </div>
      ) : entries.length ? (
        <>
          <div className="podium">
            {topThree.map((entry) => (
              <div key={entry.rank} className={`podium-card rank-${entry.rank} ${entry.isYou ? 'mine' : ''}`}>
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
                <div key={entry.rank} className={`global-leaderboard-row ${entry.isYou ? 'mine' : ''}`}>
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

export function WaitingContent({ avatar, name, level = 1, categoryKey, onCancel, onPlaySolo, pending, reconnecting }) {
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
        <div className="vs-player">
          <div className="vs-ava me">{avatar}</div>
          <div className="vs-name">{name}</div>
          <div className="vs-rank">{t('level')} {level}</div>
        </div>
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

export function RoundIntroContent({ intro, totalRounds }) {
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
    </div>
  );
}

export function QuestionContent({ question, timeLeft, reveal, selected, answer, opponents, avatar, name, score, reportQuestion, reported, social, GameChat }) {
  const { t } = useI18n();
  const sr = !!reveal;
  const pct = Math.max(0, Math.min(100, (timeLeft / question.timeLimit) * 100));
  const ansCls = (idx) => {
    if (sr) return idx === reveal.correctIndex ? 'answer correct' : idx === selected ? 'answer wrong' : 'answer dim';
    return idx === selected ? 'answer selected' : 'answer';
  };
  return (
    <div className="container game">
      <div className="hud-timer-block">
        <span className="hud-timer-label">{t('time')}</span>
        <span className={`hud-timer ${timeLeft <= 3 && !sr ? 'urgent' : ''}`}>{sr ? '✓' : timeLeft}</span>
      </div>
      <PlayerHud me={{ avatar, name, score }} others={opponents} revealing={sr} />
      <PlayerPhoto image={question.image} credit={question.credit} timeLeft={timeLeft} timeLimit={question.timeLimit} revealed={sr} />
      <div className="question-panel">
        <div className="question">{question.question}</div>
        <div className={`answers ${question.image ? '' : 'single-col'}`}>
        {question.answers.map((a, idx) => (
          <button
            key={idx}
            className={ansCls(idx)}
            onClick={() => answer(idx)}
            disabled={question.expired || selected !== null || sr}
          >
            {a}
          </button>
        ))}
        </div>
        <div className="timer-bar-bottom"><div className={`timer-bar-fill ${timeLeft <= 3 && !sr ? 'urgent' : ''}`} style={{ width: sr ? '0%' : `${pct}%` }} /></div>
      </div>
      {sr && <div className="reveal-note">{reveal.yourCorrect ? t('ptsEarned', { n: reveal.pointsEarned }) : reveal.timedOut && selected === null ? t('timeUp') : t('wrong')}</div>}
      {sr && <button className="report-btn" onClick={reportQuestion} disabled={reported}>{reported ? t('reported') : t('report')}</button>}
      <GameChat social={social} />
    </div>
  );
}

export function FinishedContent({ result, opponents, myId, social, addFriend, playAgain, rematch, rematchWaiting, rematchStarting, newMatch }) {
  const { t } = useI18n();
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
      {result.stats && <LevelRing level={result.stats.level} xpIntoLevel={result.stats.xpIntoLevel} xpForLevel={result.stats.xpForLevel} />}
      <div className="xp-breakdown">
        <div className="xpb-row"><span>{t('matchScore')}</span><span>{result.finalScore}</span></div>
        <div className="xpb-row"><span>{t('finishBonus')}</span><span>+{result.xpBreakdown?.finishBonus ?? 0}</span></div>
        <div className="xpb-row"><span>{t('winBonus')}</span><span>+{result.xpBreakdown?.winBonus ?? 0}</span></div>
        <div className="xpb-row total"><span>{t('xpTotal')}</span><span>{result.xp}</span></div>
      </div>
      <Leaderboard leaderboard={result.leaderboard} myId={myId} />
      <div className="rewards-row"><span className="rw">{t('coins', { n: result.coins })}</span></div>
      <button className="share-link" onClick={shareResult}>{t('share')}</button>
      {addableOpponents.map((o) => (
        <button key={o.clientId} className="add-friend-link" onClick={() => addFriend(o.clientId)}>
          {t('addFriend', { name: o.name })}
        </button>
      ))}
      <div className="result-actions">
        <button className="ra-btn rematch" onClick={rematch} disabled={rematchWaiting || rematchStarting}>
          {rematchWaiting || rematchStarting ? t('waitingDots') : t('rematch')}
        </button>
        <button className="ra-btn new-opp" onClick={newMatch} disabled={rematchStarting}>
          {isSolo ? t('newGame') : t('newOpponent')}
        </button>
        <button className="ra-btn see-res" onClick={playAgain} disabled={rematchStarting}>{t('backHome')}</button>
      </div>
    </div>
  );
}
