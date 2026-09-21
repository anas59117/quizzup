import React from 'react';
import { useI18n } from './i18n';

// Lobby for a private room (2-4 players). The host sees a Start button once
// 2+ players have joined; everyone else waits for the host to start.
export function RoomLobby({ code, players, isHost, canStart, onStart, onCancel, copied, onCopyCode }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <div className="status-label">{t('partyLobby')}</div>
      <div className="room-code-label">{t('shareCode')}</div>
      <button className="room-code" onClick={onCopyCode}>{code}</button>
      {/* aria-live so a screen reader announces "Copied!" — previously this
          status change was silent to anyone not looking at the screen. */}
      <div className="room-copy-hint" aria-live="polite">{copied ? t('copied') : t('tapToCopy')}</div>
      <div className="lobby-players">
        {players.map((p) => {
          const disconnected = p.connected === false;
          return (
            <div key={p.id} className="lobby-player">
              <div className={`lobby-ava ${disconnected ? 'dim' : ''}`}>{p.avatar}</div>
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

// Compact row of player chips shown during a match. Works for 2-4 players —
// the fixed left-you/right-opponent HUD only made sense for exactly 2.
export function PlayerHud({ me, others, revealing }) {
  const { t } = useI18n();
  const all = [{ ...me, mine: true }, ...others.map((o) => ({ ...o, mine: false }))];
  return (
    <div className="hud-strip">
      {all.map((p) => (
        <div key={p.mine ? 'me' : p.id} className={`hud-chip ${p.mine ? 'mine' : ''}`}>
          <div className="hud-chip-ava">{p.avatar}</div>
          <div className="hud-chip-name">{p.mine ? t('you') : p.name}</div>
          <div className="hud-chip-score">{p.score}</div>
          {revealing && !p.mine && (
            <div className={`hud-chip-mark ${p.answered ? (p.correct ? 'correct' : 'wrong') : 'none'}`}>
              {p.answered ? (p.correct ? '✓' : '✕') : '—'}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// Ranked results list for N players, replacing the 1v1 "you vs opponent"
// layout once more than 2 people played.
export function Leaderboard({ leaderboard, myId }) {
  const { t } = useI18n();
  return (
    <div className="leaderboard">
      {leaderboard.map((p, i) => (
        <div key={p.id} className={`leaderboard-row ${p.id === myId ? 'mine' : ''} ${i === 0 ? 'first' : ''}`}>
          <div className="lb-rank">#{i + 1}</div>
          <div className="lb-ava">{p.avatar}</div>
          <div className="lb-name">{p.id === myId ? t('you') : p.name}</div>
          <div className="lb-score">{p.score}</div>
        </div>
      ))}
    </div>
  );
}
