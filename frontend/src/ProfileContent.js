// Editorial player card in QuizzUp red and ivory.
// Show identity and XP first, with artwork reserved for earned specialties.
// The XP line ties player progress to the identity card.
import React, { useEffect, useRef, useState } from 'react';
import { BrowseHeader, CATEGORIES, Icon } from './ui';
import { useI18n } from './i18n';
import { AVATAR_IDS, PlayerAvatar } from './PlayerAvatar';
import { ProfilePhotoEditor } from './ProfilePhotoEditor';
import { ProfileStats } from './stats';
import { FriendsScreen } from './social';
import { StreakCalendar } from './DailyStreak';
import { getTopicCover } from './topicCovers';
import { localizedTopicTitle } from './topicTitles';

const categoriesByKey = new Map(CATEGORIES.map(category => [category.key, category]));

export function ProfileContent({
  avatar, name, stats, isGoogleLinked, googleEmail, linkGoogle, linking,
  clientId, social, onOpenLeaderboard, onSaveProfile, profileSaving, onOpenTopic, onDiscoverTopics, streak,
  league, onOpenLeague, onStartTournament, onOpenSeasonPass, onInviteFriend, onJoinFriend, pending, controls, onOpenHistory,
}) {
  const { t, lang } = useI18n();
  const friendsSection = useRef(null);
  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState(name || '');
  const [draftAvatar, setDraftAvatar] = useState(avatar || 'robot');
  const [submitted, setSubmitted] = useState(false);
  const [draftPhoto, setDraftPhoto] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [uploading, setUploading] = useState(false);
  const saving = profileSaving || uploading;
  const fallbackAvatar = stats.equippedItems?.avatars || 'robot';

  const normalizedName = draftName.replace(/\s+/g, ' ').trim().slice(0, 20);
  const unchanged = normalizedName === (name || '') && draftAvatar === avatar && !draftPhoto;

  useEffect(() => {
    if (!editing) {
      setDraftName(name || '');
      setDraftAvatar(avatar || 'robot');
      setDraftPhoto(null);
      setPhotoError('');
    }
  }, [name, avatar, editing]);

  useEffect(() => {
    if (
      submitted
      && !saving
      && !draftPhoto
      && normalizedName === (name || '')
      && draftAvatar === avatar
    ) {
      setSubmitted(false);
      setEditing(false);
    }
  }, [submitted, saving, draftPhoto, normalizedName, draftAvatar, name, avatar]);

  const cancelEdit = () => {
    if (saving) return;
    setDraftName(name || '');
    setDraftAvatar(avatar || 'robot');
    setSubmitted(false);
    setDraftPhoto(null);
    setPhotoError('');
    setEditing(false);
  };

  const saveEdit = async () => {
    if (!normalizedName || unchanged || saving) return;
    setPhotoError('');
    setSubmitted(true);
    setUploading(true);
    try {
      const savedAvatar = await onSaveProfile(normalizedName, draftAvatar, draftPhoto);
      if (savedAvatar) { setDraftAvatar(savedAvatar); setDraftPhoto(null); }
    } catch (err) {
      setSubmitted(false);
      setPhotoError(err.message || 'Le profil n’a pas pu être enregistré. Réessaie.');
    } finally { setUploading(false); }
  };

  const fr = lang === 'fr';
  const level = stats.level || 1;
  const xpTarget = Math.max(0, Number(stats.xpForLevel) || 0);
  const xp = Math.min(xpTarget, Math.max(0, Number(stats.xpIntoLevel) || 0));
  const topics = stats.topics || [];
  const friendCount = social?.friends?.length || 0;
  const hasPlayed = stats.games > 0 || topics.length > 0;
  const hasLeagueActivity = league && (league.wins > 0 || league.losses > 0 || league.lp > 0);

  return (
    <main id="main-content" tabIndex={-1} aria-labelledby="profile-title" className="container pf-v4 profile-player">
      {controls && <BrowseHeader controls={controls} />}
      <div className="profile-layout">
        <div className="profile-overview">
          <header className="profile-player-card">
            <div className="profile-player-identity">
              <div className="pf-avatar-wrap">
                <div className="pf-avatar"><PlayerAvatar avatar={avatar} fallbackAvatar={fallbackAvatar} /></div>
                <button className="pf-edit-dot" aria-label={t('editProfile')} onClick={() => editing ? cancelEdit() : setEditing(true)} aria-expanded={editing} disabled={saving}>
                  <Icon name="edit" size={16} />
                </button>
              </div>
              <div className="profile-player-name">
                <span className="profile-player-kicker">{fr ? 'Mon profil' : 'My profile'}</span>
                <h1 id="profile-title" tabIndex={-1} className="pf-name">{name}</h1>
              </div>
            </div>
            <div className="pf-level-card profile-player-progress">
              <div className="profile-player-progress-head">
                <strong>{t('level')} {level}</strong>
                {xpTarget > 0 && <span>{xp.toLocaleString(lang)} / {xpTarget.toLocaleString(lang)} XP</span>}
              </div>
              {xpTarget > 0 ? (
                <>
                  <progress aria-label={t('overallProgress')} value={xp} max={xpTarget} />
                  <p>{(xpTarget - xp).toLocaleString(lang)} {t('beforeNextLevel')} {level + 1}</p>
                </>
              ) : <p>{fr ? 'Joue pour gagner de l’XP.' : 'Play to earn XP.'}</p>}
            </div>
            <div className="profile-player-social">
              {social && <button type="button" onClick={() => {
                friendsSection.current?.scrollIntoView?.({ block: 'start' });
                friendsSection.current?.focus({ preventScroll: true });
              }}><Icon name="users" size={16} /> {t(friendCount === 1 ? 'socialFriendsOne' : 'socialFriends', { n: friendCount })}</button>}
              <span>{t(stats.following === 1 ? 'followedPlayersOne' : 'followedPlayers', { n: stats.following || 0 })}</span>
            </div>
          </header>
          {editing && (
            <div className="profile-editor">
              <label className="profile-editor-label" htmlFor="profile-name-input">{t('displayName')}</label>
              <input
                id="profile-name-input"
                className="input profile-name-input"
                value={draftName}
                maxLength={20}
                autoComplete="nickname"
                disabled={saving}
                onChange={(event) => setDraftName(event.target.value)}
              />
              <ProfilePhotoEditor avatar={draftAvatar} fallbackAvatar={fallbackAvatar} draft={draftPhoto}
                onChange={draft => { setDraftPhoto(draft); setSubmitted(false); setPhotoError(''); }}
                onRemove={() => { setDraftPhoto(null); setDraftAvatar(fallbackAvatar); setSubmitted(false); }} busy={saving} />
              <div className="profile-editor-label">{t('chooseAvatar')}</div>
              <div className="profile-avatar-grid" role="group" aria-label={t('chooseAvatar')}>
                {AVATAR_IDS.filter((id) => id === 'robot' || stats.ownedItems?.includes(id)).map((option, index) => (
                  <button
                    key={option}
                    className={`avatar-opt ${draftAvatar === option ? 'active' : ''}`}
                    onClick={() => { setDraftAvatar(option); setDraftPhoto(null); setSubmitted(false); }}
                    disabled={saving}
                    aria-label={`${t('avatar')} ${index + 1}`}
                    aria-pressed={draftAvatar === option}
                  >
                    <PlayerAvatar avatar={option} />
                  </button>
                ))}
              </div>
              {photoError && <p className="profile-photo-error" role="alert">{photoError}</p>}
              {submitted && !saving && !unchanged && <p className="profile-photo-error" role="status">Le profil attend la confirmation. Si la connexion a été coupée, réessaie.</p>}
              <div className="profile-editor-actions">
                <button className="profile-editor-cancel" onClick={cancelEdit} disabled={saving}>
                  {t('cancelEdit')}
                </button>
                <button
                  className="profile-editor-save"
                  onClick={saveEdit}
                  disabled={!normalizedName || unchanged || saving}
                >
                  {saving ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </div>
          )}

          {!hasPlayed && (
            <section className="profile-player-section profile-first-quiz" aria-labelledby="profile-first-quiz">
              <div><h2 id="profile-first-quiz">{fr ? 'À toi de jouer' : 'Your turn to play'}</h2>
                <p>{fr ? 'Joue ta première partie pour commencer ta collection de spécialités.' : 'Play your first game to start building your specialties.'}</p>
              </div>
              {onDiscoverTopics && <button type="button" onClick={onDiscoverTopics}><Icon name="bolt" size={17} />{fr ? 'Choisir mon premier quiz' : 'Choose my first quiz'}</button>}
            </section>
          )}

          <section className="profile-account" aria-label={t('saveProgressGoogle')}>
            {isGoogleLinked ? (
              <div className="profile-account-linked"><Icon name="check" size={18} /><span><strong>{t('googleAccountLinked')}</strong>{googleEmail && <small>{googleEmail}</small>}</span></div>
            ) : (
              <button className="profile-account-action" onClick={linkGoogle} disabled={linking || !clientId} aria-busy={!!linking}>
                <Icon name="key" size={17} /><span>{linking ? t('connecting') : t('saveProgressGoogle')}</span><Icon name="arrow" size={15} />
              </button>
            )}
          </section>
        </div>

        <div className="profile-activity">
          {topics.length > 0 ? (
            <section className="profile-player-section" aria-labelledby="profile-specialties">
              <h2 id="profile-specialties" className="pf-section-title">{fr ? 'Mes spécialités' : 'My specialties'}</h2>
              <div className="pf-themes profile-specialty-grid">
                {topics.slice(0, 3).map(topic => <Specialty key={topic.key} topic={topic} lang={lang} levelLabel={t('level')} onSelect={onOpenTopic} />)}
              </div>
              {topics.length > 3 && (
                <details className="profile-more-topics">
                  <summary>{fr ? 'Mes autres thèmes' : 'My other topics'} <span>{topics.length - 3}</span></summary>
                  <div>{topics.slice(3).map(topic => <Specialty key={topic.key} topic={topic} lang={lang} levelLabel={t('level')} onSelect={onOpenTopic} compact />)}</div>
                </details>
              )}
            </section>
          ) : null}

          {social && <section ref={friendsSection} className="profile-player-section profile-friends" aria-label={fr ? 'Mes amis' : 'My friends'} tabIndex={-1}>
            <FriendsScreen social={social} onInviteFriend={onInviteFriend} onJoinFriend={onJoinFriend} pending={pending} showContactsFirst />
          </section>}

          <section className="profile-player-section" aria-labelledby="profile-results">
            <div className="profile-player-section-head">
              <h2 id="profile-results" className="pf-section-title">{t('statistics')}</h2>
              {onOpenHistory && <button className="profile-history-action" type="button" onClick={onOpenHistory}><Icon name="feed" size={17} />{fr ? 'Historique' : 'Match history'}</button>}
            </div>
            {hasPlayed || stats.coins > 0 ? <ProfileStats stats={stats} /> : (
              <p className="profile-results-empty">{fr ? 'Tes résultats apparaîtront après ta première partie.' : 'Your results will appear after your first game.'}</p>
            )}
          </section>

          {streak?.streak > 0 && <StreakCalendar streak={streak.streak} calendar={streak.calendar || []}
            nextMilestone={streak.nextMilestone} milestoneProgress={streak.milestoneProgress} />}

          {hasLeagueActivity && (
            <button className="profile-league-card" type="button" onClick={onOpenLeague}>
              <span className="pl-tier">{league.tier.icon} {league.tier.label}</span>
              <span className="pl-lp">{league.lp} LP</span>
              <span className="pl-progress"><span className="pl-progress-fill" style={{ width: `${league.progress}%`, background: league.tier.color }} /></span>
              <span className="pl-stats">{league.wins} {t('wins').toLowerCase()} · {league.losses} {t('losses').toLowerCase()} · {league.winRate}% {fr ? 'de réussite' : 'win rate'}</span>
            </button>
          )}
          <div className="profile-secondary-links">
            <button type="button" onClick={onStartTournament}>{t('tournament')}</button>
            {!hasLeagueActivity && <button type="button" onClick={onOpenLeague}>{t('league')}</button>}
            <button type="button" onClick={onOpenSeasonPass}>{t('seasonPass')}</button>
          </div>
          <button className="leaderboard-cta" type="button" onClick={onOpenLeaderboard}>
            <span className="leaderboard-cta-icon"><Icon name="trophy" size={20} /></span>
            <span className="leaderboard-cta-copy"><strong>{t('globalLeaderboard')}</strong><small>{t('leaderboardCta')}</small></span>
            <Icon name="arrow" size={18} />
          </button>
          <a className="privacy-link" href="/privacy.html" target="_blank" rel="noopener noreferrer">{t('privacyPolicy')}</a>
        </div>
      </div>
    </main>
  );
}

function Specialty({ topic, lang, levelLabel, onSelect, compact = false }) {
  const category = categoriesByKey.get(topic.key);
  const cover = category && getTopicCover(category);
  const title = category ? localizedTopicTitle(category, lang) : topic.key;
  return (
    <button type="button" className={compact ? 'profile-specialty-row' : 'pf-theme-tile profile-specialty'} onClick={() => onSelect?.(topic.key)}>
      {!compact && <span className="profile-specialty-art">
        {cover?.src ? <img src={cover.src} srcSet={cover.srcSet} sizes="(min-width: 900px) 180px, 31vw"
          alt="" loading="lazy" decoding="async" style={{ objectPosition: cover.embeddedTitle ? 'center top' : cover.focal }} /> : <Icon name="themes" size={22} />}
      </span>}
      <span className="pf-theme-copy">
        <strong className="pf-theme-name">{title}</strong>
        <span className="pf-theme-level">{levelLabel} {topic.level}</span>
      </span>
      {compact && <Icon name="arrow" size={16} />}
    </button>
  );
}
