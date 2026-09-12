import React from 'react';

// Lobby for a private room (2-4 players). The host sees a Start button once
// 2+ players have joined; everyone else waits for the host to start.
export function RoomLobby({ code, players, isHost, canStart, onStart, onCancel, copied, onCopyCode }) {
  return (
    <div className="container center">
      <div className="status-label">{'⚔️'} Party lobby</div>
      <div className="room-code-label">Share this code</div>
      <button className="room-code" onClick={onCopyCode}>{code}</button>
      <div className="room-copy-hint">{copied ? '✓ Copied!' : 'Tap the code to copy'}</div>
      <div className="lobby-players">
        {players.map((p) => (
          <div key={p.id} className="lobby-player">
            <div className="lobby-ava">{p.avatar}</div>
            <div className="lobby-name">{p.name}</div>
          </div>
        ))}
        {Array.from({ length: Math.max(0, 4 - players.length) }).map((_, i) => (
          <div key={`empty-${i}`} className="lobby-player empty">
            <div className="lobby-ava dim">?</div>
            <div className="lobby-name dim">Waiting…</div>
          </div>
        ))}
      </div>
      {isHost ? (
        <button className="btn" disabled={!canStart} onClick={onStart}>
          {canStart ? `Start match (${players.length})` : 'Waiting for players…'}
        </button>
      ) : (
        <div className="room-wait-status">
          <div className="loading-bar"><div className="loading-fill" /></div>
          <div className="room-wait-text">Waiting for the host to start…</div>
        </div>
      )}
      <button className="home-themes-link" onClick={onCancel}>{'←'} Cancel</button>
    </div>
  );
}

// Compact row of player chips shown during a match. Works for 2-4 players —
// the fixed left-you/right-opponent HUD only made sense for exactly 2.
export function PlayerHud({ me, others, revealing }) {
  const all = [{ ...me, mine: true }, ...others.map((o) => ({ ...o, mine: false }))];
  return (
    <div className="hud-strip">
      {all.map((p) => (
        <div key={p.mine ? 'me' : p.id} className={`hud-chip ${p.mine ? 'mine' : ''}`}>
          <div className="hud-chip-ava">{p.avatar}</div>
          <div className="hud-chip-name">{p.mine ? 'You' : p.name}</div>
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
  return (
    <div className="leaderboard">
      {leaderboard.map((p, i) => (
        <div key={p.id} className={`leaderboard-row ${p.id === myId ? 'mine' : ''} ${i === 0 ? 'first' : ''}`}>
          <div className="lb-rank">#{i + 1}</div>
          <div className="lb-ava">{p.avatar}</div>
          <div className="lb-name">{p.id === myId ? 'You' : p.name}</div>
          <div className="lb-score">{p.score}</div>
        </div>
      ))}
    </div>
  );
}
