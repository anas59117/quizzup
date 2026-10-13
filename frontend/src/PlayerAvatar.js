import React from 'react';
import './player-avatar.css';

// One illustrated identity across the shop, profile and duel. Legacy account
// values stay intact on the server; only their presentation uses this collection.
export const AVATAR_IDS = ['fox', 'robot', 'brain', 'astronaut', 'ninja', 'dragon', 'cat', 'owl', 'ghost', 'lion'];
const LEGACY_AVATARS = { '🦊': 'fox', '🤖': 'robot', '🧠': 'brain', '👻': 'ghost', '🐱': 'cat', '🦉': 'owl', '🐉': 'dragon' };

export function avatarId(value) {
  return AVATAR_IDS.includes(value) ? value : LEGACY_AVATARS[value] || 'robot';
}

export function PlayerAvatar({ avatar, className = '' }) {
  const id = avatarId(avatar);
  const index = AVATAR_IDS.indexOf(id);
  return <span className={`player-avatar ${className}`} data-avatar={id} aria-hidden="true"
    style={{ '--avatar-x': `${(index % 5) * 25}%`, '--avatar-y': `${Math.floor(index / 5) * 100}%` }} />;
}
