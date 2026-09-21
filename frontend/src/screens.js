import React, { useState, useMemo } from 'react';
import { CATEGORIES, FAMILIES, categoriesInFamily, normalizeForSearch, famLabel, SoloToggle, CategoryTile, FamilyGrid, SearchBar, PlayerPhoto, LevelRing } from './ui';
import { PlayerHud, Leaderboard } from './multiplayer';
import { ProfileStats } from './stats';
import { FriendsScreen } from './social';
import { useI18n } from './i18n';

export function HomeContent({ name, avatar, soloMode, setSoloMode, quickMatch, startWithCategory, onOpenProfile, onSeeAll, createRoom, onOpenEnterCode, pending }) {
  const { t } = useI18n();
  return (
    <div className="container wide">
      <div className="home-head">
        <div>
          <div className="home-greeting">{t('hey', { name })} {'\u{1F44B}'}</div>
          <div className="home-logo-sm">Quizz<span>Up</span></div>
        </div>
        <button className="home-avatar-chip" onClick={onOpenProfile} aria-label="Open profile">{avatar}</button>
      </div>
      <SoloToggle solo={soloMode} onToggle={() => setSoloMode((s) => !s)} />
      <button className="quick-play" onClick={quickMatch} disabled={pending} aria-busy={pending || undefined}>
        <span className="qp-left"><span className="qp-bolt">{'⚡'}</span> {t('quickPlay')}</span>
        <span className="qp-sub">{t('randomTopic')}</span>
      </button>
      <div className="section-title">{'\u{1F525}'} {t('popularTopics')}</div>
      <div className="topics-scroll">
        {CATEGORIES.map((c) => <CategoryTile key={c.key} c={c} onClick={() => startWithCategory(c.key)} disabled={pending} />)}
      </div>
      <div className="section-title">
        <span>{t('allTopics')}</span>
        <button className="see-all" onClick={() => onSeeAll()}>{t('seeAll')}</button>
      </div>
      <FamilyGrid onSelect={onSeeAll} />
      <div className="social-row">
        <button className="social-btn" onClick={createRoom} disabled={pending}>{'⚔️'} {t('party')}</button>
        <button className="social-btn outline" onClick={onOpenEnterCode}>{'\u{1F511}'} {t('joinCode')}</button>
      </div>
    </div>
  );
}

export function EnterCodeContent({ joinCode, setJoinCode, joinError, setJoinError, joinRoom, onBack, pending }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <div className="status-label">{'\u{1F511}'} {t('joinFriend')}</div>
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
    </div>
  );
}

export function ProfileContent({ avatar, name, stats, isGoogleLinked, googleEmail, linkGoogle, linking, clientId, social }) {
  const { t } = useI18n();
  return (
    <div className="container">
      <div className="profile-head">
        <div className="profile-avatar">{avatar}</div>
        <div className="profile-name">{name || 'Player'}</div>
        <div className="profile-sub">{t('level')} {stats.level} {'·'} {t('rookie')}</div>
      </div>
      <ProfileStats stats={stats} />
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

export function WaitingContent({ avatar, name, onCancel, pending }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <div className="vs-screen">
        <div className="vs-player">
          <div className="vs-ava me">{avatar}</div>
          <div className="vs-name">{name}</div>
          <div className="vs-rank">{t('novice')}</div>
        </div>
        <div className="vs-bolt-wrap"><div className="vs-bolt">{'⚡'}</div></div>
        <div className="vs-player">
          <div className="vs-ava searching">?</div>
          <div className="vs-name dim">{t('searching')}</div>
        </div>
      </div>
      <div className="loading-bar"><div className="loading-fill" /></div>
      <button className="home-themes-link" onClick={onCancel} disabled={pending}>{t('cancel')}</button>
    </div>
  );
}

export function RoundIntroContent({ intro, totalRounds }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <div className={`round-intro-icon ${intro.isBonus ? 'bonus' : ''}`}>{intro.icon}</div>
      <div className="round-intro-cat">{intro.category}</div>
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
      {sr && <div className="reveal-note">{reveal.yourCorrect ? t('ptsEarned', { n: reveal.pointsEarned }) : reveal.timedOut && selected === null ? t('timeUp') : t('wrong')}</div>}
      {sr && <button className="report-btn" onClick={reportQuestion} disabled={reported}>{reported ? t('reported') : t('report')}</button>}
      <GameChat social={social} />
    </div>
  );
}

export function FinishedContent({ result, opponents, myId, social, friendRequestSent, addFriend, playAgain, rematch, newMatch }) {
  const { t } = useI18n();
  const { won, tie } = result;
  const left = result.reason === 'opponent_disconnected' || result.reason === 'opponent_left';
  const isSolo = opponents.length === 0 && !left;
  const addableOpponents = opponents.filter(
    (o) => o.clientId && !social.friends.some((f) => f.id === o.clientId) && !friendRequestSent[o.clientId]
  );
  const shareResult = () => {
    const text = isSolo ? t('shareSolo', { n: result.finalScore })
      : won ? t('shareWon') : tie ? t('shareTie') : t('sharePlayed');
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else navigator.clipboard?.writeText(text).catch(() => {});
  };
  return (
    <div className="container center">
      <div className={`result-title ${isSolo ? 'tie' : won ? 'win' : tie ? 'tie' : 'loss'}`}>{isSolo ? t('finished') : won ? t('victory') : tie ? t('draw') : t('defeat')}</div>
      <div className="result-sub">{left ? t('someoneLeft') : t('finalScore', { n: result.finalScore })}</div>
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
        <button className="ra-btn rematch" onClick={rematch}>{t('rematch')}</button>
        <button className="ra-btn new-opp" onClick={newMatch}>{isSolo ? t('newGame') : t('newOpponent')}</button>
        <button className="ra-btn see-res" onClick={playAgain}>{t('backHome')}</button>
      </div>
    </div>
  );
}
