// Direction: cinematic cartography, graphite surfaces and warm yellow light.
// Rules: illustrated identities, quiet typography, no implied player locations.
// Signature: the searching world resolves into a vertically split face-off.
import React, { useEffect, useId, useState } from 'react';
import { PlayerAvatar } from './PlayerAvatar';
import { CATEGORIES, Icon } from './ui';
import { useI18n } from './i18n';
import './match-presentation.css';

// Deliberately simplified coastlines; this is an illustration, never player data.
function SearchWorld() {
  const id = useId().replace(/:/g, '');
  return <svg className="wm-world" viewBox="0 0 1000 560" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={`${id}-land`} x1="0" y1="0" x2="0.8" y2="1">
        <stop offset="0" stopColor="#48515b" /><stop offset="1" stopColor="#252e37" />
      </linearGradient>
      <pattern id={`${id}-grid`} width="80" height="70" patternUnits="userSpaceOnUse">
        <path d="M80 0H0V70" fill="none" stroke="#b3bdc4" strokeOpacity=".065" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="1000" height="560" fill={`url(#${id}-grid)`} />
    <g className="wm-coastlines" fill={`url(#${id}-land)`} stroke="#78828b" strokeOpacity=".3" strokeWidth="1.2" strokeLinejoin="round">
      {/* North America, the Canadian archipelago, and Greenland. */}
      <path d="M62 144 82 124 112 117 124 99 155 97 161 84 194 87 208 106 236 111 257 125 275 124 285 140 275 153 261 157 258 178 245 191 238 216 223 229 209 238 207 253 196 251 185 233 166 229 156 216 146 204 132 201 124 185 110 175 106 154 91 149 82 160 66 161 55 153Z" />
      <path d="m158 218 10 16 14 14 18 8 10 18 16 7 8 10 14 3 11 12 12 1 3 9-17-3-15-12-20-6-11-10-16-5-11-13-15-5-13-25Z" />
      <path d="m203 82 14-20 22 3 7 15-11 14-19-1Zm38 7 16-13 17 5 5 18-19 5Zm-45-31 16-13 12 9-4 12Zm58 9 15-23 28 8 5 15-22 9Zm26 39 14-19 21 4-2 16-18 11Z" />
      <path d="m311 58 35-20 43 4 20 14-5 23-23 12-7 25-23 22-12-8-5-27-17-16Z" />
      {/* South America and the Caribbean. */}
      <path d="m268 304 20-9 21 5 14 13 23 6 12 14 26 9 7 18-11 25-13 13-8 30-16 20-7 24-17 19-6 23-15-5-9-23-3-24-11-20-4-27-16-22-7-26 6-22-7-19Z" />
      <path d="m239 278 22-3 18 6-4 5-23-2Zm48 14 14-2 8 5-10 3Zm22 6 11 1 2 7-7 1Z" />
      {/* Europe and its islands. */}
      <path d="m439 151 11-9 1-18 12-7 9 10-6 13 6 8-8 10-15 1-8 8-9-5Z" />
      <path d="m464 171 14-11 4-18 12-11 6-27 20-20 12 3-9 21-10 20-8 7 2 17 19-7 17 2 5 15-13 10-13-1-12 12-17 1-8 13-17-1-4-10-17 2-9-12Z" />
      <path d="m482 189 16 3 8 16 13 9-3 9-13-5-7-15-10-3Zm34-6 13 4 4 13 11 6-4 9-14-8-3-13-10-3Z" />
      <path d="m423 113 13-6 13 6-5 8-17 1Zm-4 62 7-9 4 5-2 13-8 3Z" />
      {/* Africa, Madagascar, and the Arabian Peninsula. */}
      <path d="m466 216 25-5 28 6 15 12 18 2 10 22 17 17 22 2-12 20-18 11-5 31-15 17-4 24-14 23-19 4-11-17-3-23-12-21-5-24-18-7-14-19-4-20 9-25Z" />
      <path d="m589 351 9-16 7 4-2 22-10 16-8-8Z" />
      <path d="m557 218 15-5 13 11 18 6 10 21-17 12-15-5-12-18Z" />
      {/* Asia, including the Indian and South East Asian peninsulas. */}
      <path d="m536 146 17-15 1-19 23-15 27 4 9-14 29-7 15 9 21-8 23 7 20-12 29 12 25-5 15 11 27 1 17 12 28-1 21 17 24 2 19 17 24 1 13 15-7 14-23 1-16-11-15 5-17-9-13 10-18-2-9 15-15 5-4 19-15 13-11-6-14 11-20-6-17 8-12 19-15 3-5 23-14 13-6 29-11-9-7-26-14-15-5-23-19 4-17-10-10-20-17-3-8-16-17 5-8-13-21-4-7-19-14-5Z" />
      <path d="m699 249 13 8 7 22 14 13 5 24 13 9 7 17-11 7-12-16-7-21-15-8-8-23-9-14Z" />
      <path d="m792 211 11 5-3 17-11 7-4-12Zm38-21 6-16 9-2-1 19-12 13-8-2Zm9-29 6-19 11-9 5 7-12 24Z" />
      <path d="m771 291 9 10 1 18 8 13-7 8-10-12-5-22Zm32 31 11 6 6 15-11 4-6-11Z" />
      {/* Indonesia, New Guinea, Australia, and New Zealand. */}
      <path d="m725 348 20 5 17 10-4 7-20-6Zm39 23 31 1 13 5-5 7-32-4Zm30-25 10 4 7 15-6 5-11-11Zm25 23 15-8 24 5 15 12-9 10-18-7-18 1Z" />
      <path d="m802 410 24-15 24-3 12-17 13 7 7 20 18 7 10 21-7 26-13 13-22-3-20 9-22-5-11-13-22-3-5-17Z" />
      <path d="m871 483 12-2 5 11-9 8-8-5Zm65-44 7 6-5 19-11 12-6-6 10-15Zm-13 37 7 7-11 15-17 9-6-6Z" />
    </g>
    <g className="wm-scan-points" fill="currentColor">
      <circle cx="232" cy="186" r="2.5" /><circle cx="339" cy="359" r="2" />
      <circle cx="515" cy="177" r="3" /><circle cx="537" cy="294" r="2" />
      <circle cx="746" cy="201" r="2.5" /><circle cx="853" cy="431" r="2" />
    </g>
  </svg>;
}

export function WorldMatchSearch({ avatar, frame, name, level = 1, categoryKey, onCancel, onPlaySolo, pending, reconnecting }) {
  const { t } = useI18n();
  const [elapsed, setElapsed] = useState(0);
  const category = CATEGORIES.find(item => item.key === categoryKey);
  useEffect(() => {
    const startedAt = Date.now();
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => clearInterval(timer);
  }, []);
  const state = pending ? 'pending' : reconnecting ? 'reconnecting' : 'searching';
  return <section className="container wm-search" data-state={state} data-long-wait={elapsed >= 12} aria-label={t('matchmaking')}>
    <header className="wm-heading">
      <span className="wm-eyebrow">QUIZZUP · DUEL</span>
      <h1 role="status" aria-live="polite">{reconnecting ? t('reconnecting') : pending ? t('leavingQueue') : t('matchmaking')}</h1>
      <p className="wm-topic matchmaking-topic">{category?.label || t('randomTopic')}</p>
    </header>
    <div className="wm-atlas">
      <div className="wm-map-camera"><SearchWorld /></div>
      <div className="wm-radar" aria-hidden="true"><i /><i /><i /></div>
      <div className="wm-anchor">
        <div className="wm-avatar"><PlayerAvatar avatar={avatar} /></div>
        <strong className="wm-name">{name}</strong>
        <span className="wm-level">{t('level')} {level}</span>
      </div>
    </div>
    <footer className="wm-controls">
      <div className="wm-search-progress"><span className="wm-search-light" aria-hidden="true" /><span>{t('searching')}</span><time>{t('searchElapsed', { n: elapsed })}</time></div>
      {elapsed >= 12 && <div className="wm-alternative">
        <p role="status">{t('searchTakingLonger')}</p>
        <button className="wm-solo" onClick={onPlaySolo} disabled={pending || reconnecting}>{t('playSoloInstead')}</button>
      </div>}
      <button className="wm-cancel" onClick={onCancel} disabled={pending}>{pending ? t('leavingQueue') : t('cancel')}</button>
    </footer>
  </section>;
}

export function DuelRoundIntro({ intro, totalRounds, opponents = [], avatar, frame, name, level }) {
  const { t } = useI18n();
  const difficultyKey = intro.difficulty ? `difficulty${intro.difficulty[0].toUpperCase()}${intro.difficulty.slice(1)}` : null;
  const firstDuel = intro.round === 1 && opponents.length === 1;
  if (firstDuel) {
    const opponent = opponents[0];
    return <section className="container df-intro" aria-label={`${name} ${t('versus')} ${opponent.name}`}>
      <header className="df-heading"><span className="df-eyebrow">QUIZZUP · DUEL</span><h1>{intro.category}</h1></header>
      <div className="df-faceoff">
        <div className="df-player df-player-own">
          <span className="df-player-tag">{t('you')}</span>
          <div className="df-avatar"><PlayerAvatar avatar={avatar} /></div>
          <h2>{name}</h2><span className="df-level">{t('level')} {level || 1}</span>
        </div>
        <div className="df-divider" aria-hidden="true"><span><Icon name="bolt" size={28} /></span><b>VS</b></div>
        <div className="df-player df-player-opponent">
          <span className="df-player-tag">{t('opponent')}</span>
          <div className="df-avatar"><PlayerAvatar avatar={opponent.avatar} /></div>
          <h2>{opponent.name}</h2><span className="df-level">{opponent.level ? `${t('level')} ${opponent.level}` : t('opponent')}</span>
        </div>
      </div>
      <p className="df-caption">{t('round', { n: 1 })}<span aria-hidden="true"> · </span>{t('roundOf', { n: 1, total: totalRounds })}</p>
    </section>;
  }
  return <section className="container center round-intro-screen" aria-label={t('round', { n: intro.round })}>
    <div className={`round-intro-icon${intro.isBonus ? ' bonus' : ''}`} aria-hidden="true">{intro.icon || '🏆'}</div>
    <div className="round-intro-cat">{intro.category}</div>
    {difficultyKey && <div className={`difficulty-pill ${intro.difficulty}`}>{t(difficultyKey)}</div>}
    <h1 className="round-intro-round">{intro.isBonus ? t('bonusRound') : t('round', { n: intro.round })}</h1>
    <div className="round-intro-sub">{intro.isBonus ? t('doublePoints') : t('roundOf', { n: intro.round, total: totalRounds })}</div>
  </section>;
}
