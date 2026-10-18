import React from 'react';
import { useI18n } from './i18n';
import { identityFor, IDENTITIES } from './identity';
import { PlayerAvatar } from './PlayerAvatar';

// Lobby for a private room (2-4 players). The host sees a Start button once
// 2+ players have joined; everyone else waits for the host to start.
export function RoomLobby({ code, players, isHost, canStart, onStart, onCancel, copied, onCopyCode, onShareCode }) {
  const { t } = useI18n();
  return (
    <div className="container center duel-lobby">
      <div className="status-label">{t('partyLobby')}</div>
      <div className="room-code-label">{t('shareCode')}</div>
      <button className="room-code" onClick={onCopyCode}>{code}</button>
      {/* aria-live so a screen reader announces "Copied!" — previously this
          status change was silent to anyone not looking at the screen. */}
      <div className="room-copy-hint" aria-live="polite">{copied ? t('copied') : t('tapToCopy')}</div>
      {onShareCode && <button type="button" className="room-share-button" onClick={onShareCode}>{t('shareRoomCode')}</button>}
      <div className="lobby-players">
        {players.map((p) => {
          const disconnected = p.connected === false;
          return (
            <div key={p.id} className="lobby-player">
              <div className={`lobby-ava ${disconnected ? 'dim' : ''}`}><PlayerAvatar avatar={p.avatar} /></div>
              <div className={`lobby-name ${disconnected ? 'dim' : ''}`}>
                {p.name}{disconnected ? ' …' : ''}
              </div>
            </div>
          );
        })}
        {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="lobby-player empty">
            <div className="lobby-ava dim">?</div>
            <div className="lobby-name dim">{t('waitingDots')}</div>
          </div>
        ))}
      </div>
      {isHost ? (
        <button className="btn" disabled={!canStart} onClick={onStart}>
          {canStart ? t('startMatch', { n: players.length }) : t('waitingPlayers')}
        </button>
      ) : (
        <div className="room-wait-status">
          <div className="loading-bar"><div className="loading-fill" /></div>
          <div className="room-wait-text">{t('waitingHost')}</div>
        </div>
      )}
      <button className="home-themes-link" onClick={onCancel}>{t('cancel')}</button>
    </div>
  );
}

// `revealing` means the COMPLETE round_result, never an answer_ack.
// me.correct is authoritative after acknowledgment; opponent.correct is only
// authoritative at full reveal. me.pointsEarned is the confirmed round award;
// maxPoints is the round ceiling (20 normally, 40 for the bonus round).
export function PlayerHud({ me, others = [], revealing = false }) {
  const { t, lang } = useI18n();
  const all = [{ ...me, mine: true }, ...others.map((o) => ({ ...o, mine: false }))];
  return (
    <div className={`hud-strip duel-hud${all.length > 2 ? ' duel-hud--group' : ''}${all.length === 1 ? ' duel-hud--solo' : ''}`}>
      {all.map((p) => {
        const known = typeof p.correct === 'boolean' && (p.mine || revealing) && p.answered;
        const timedOut = revealing && !p.answered;
        const status = p.connected === false ? (lang === 'en' ? 'Reconnecting…' : 'Reconnexion…')
          : known ? (p.correct ? t('answerCorrect') : t('answerIncorrect'))
            : timedOut ? t('timeUp') : p.answered ? t('answerWaiting') : t('waitingDots');
        const state = p.connected === false ? 'disconnected' : known ? (p.correct ? 'correct' : 'wrong')
          : timedOut ? 'timeout' : p.answered ? 'answered' : 'waiting';
        const points = Number.isFinite(p.pointsEarned) ? Math.max(0, p.pointsEarned) : 0;
        const maxPoints = p.maxPoints || 20;
        const identity = identityFor(p.frame);
        return (
          <div key={p.mine ? 'me' : p.id} className={`hud-chip ${p.mine ? 'mine' : ''}`} data-identity={identity} data-state={state}>
            <div className="hud-chip-portrait">
              {p.mine && <svg className="duel-points-ring" viewBox="0 0 64 64" role="progressbar"
                aria-label={lang === 'en' ? 'Confirmed round points' : 'Points confirmés de la manche'}
                aria-valuemin={0} aria-valuemax={maxPoints} aria-valuenow={points}>
                <circle className="duel-points-track" cx="32" cy="32" r="29" />
                <circle className="duel-points-fill" cx="32" cy="32" r="29" pathLength="100"
                  strokeDasharray="100" strokeDashoffset={100 - Math.min(100, points / maxPoints * 100)} />
              </svg>}
              <div className="hud-chip-ava"><PlayerAvatar avatar={p.avatar} /></div>
              {state !== 'waiting' && <span className={`hud-chip-mark ${state}`} aria-hidden="true">
                {known ? (p.correct ? '✓' : '✕') : timedOut || state === 'disconnected' ? '—' : '•'}
              </span>}
            </div>
            <div className="hud-chip-name" title={p.name}>{p.name || t('you')}</div>
            <div className="hud-chip-score"><span key={p.score}>{p.score ?? 0}</span></div>
            <div className={`hud-chip-status ${state}`} title={status}>
              {p.mine && known && p.correct ? <><span className="duel-visually-hidden">{status} · </span>{t('ptsEarned', { n: points })}</> : status}
            </div>
            {identity !== 'none' && <span className="duel-visually-hidden">{lang === 'en' ? IDENTITIES[identity].en : IDENTITIES[identity].fr}</span>}
          </div>
        );
      })}
    </div>
  );
}

// Ranked results list for N players, replacing the 1v1 "you vs opponent"
// layout once more than 2 people played.
export function Leaderboard({ leaderboard, myId }) {
  const { t, lang } = useI18n();
  return (
    <div className="leaderboard">
      {leaderboard.map((p, i) => (
        <div key={p.id} data-identity={identityFor(p.frame)} className={`leaderboard-row duel-leaderboard-row ${p.id === myId ? 'mine' : ''} ${i === 0 ? 'first' : ''}`}>
          <div className="lb-rank">#{i + 1}</div>
          <div className="lb-ava"><PlayerAvatar avatar={p.avatar} /></div>
          <div className="lb-name">{p.id === myId ? t('you') : p.name}</div>
          <div className="lb-score">{p.score}</div>
          {identityFor(p.frame) !== 'none' && <span className="duel-visually-hidden">{lang === 'en' ? IDENTITIES[identityFor(p.frame)].en : IDENTITIES[identityFor(p.frame)].fr}</span>}
        </div>
      ))}
    </div>
  );
}
