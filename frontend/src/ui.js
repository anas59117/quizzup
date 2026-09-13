import React, { useState, useEffect, useCallback, memo } from 'react';

export const AVATARS = ['\u{1F43A}', '\u{1F981}', '\u{1F98A}', '\u{1F43C}', '\u{1F989}', '\u{1F438}', '\u{1F42F}', '\u{1F984}'];

export const CATEGORIES = [
  { key: 'movies', label: 'Movies', icon: '\u{1F3AC}', grad: 'g1', tag: '\u{1F525}', desc: 'Blockbusters & classics' },
  { key: 'music', label: 'Music', icon: '\u{1F3B5}', grad: 'g2', desc: 'Artists, albums & lyrics' },
  { key: 'sports', label: 'Sports', icon: '⚽', grad: 'g3', desc: 'Teams & champions' },
  { key: 'geography', label: 'Geography', icon: '\u{1F30D}', grad: 'g4', desc: 'Capitals & landmarks' },
  { key: 'gaming', label: 'Gaming', icon: '\u{1F3AE}', grad: 'g5', desc: 'Consoles & lore' },
  { key: 'science', label: 'Science', icon: '\u{1F9EC}', grad: 'g6', tag: '✨', desc: 'Space, bio & physics' },
  { key: 'rap_fr', label: 'Rap Français', icon: '\u{1F3A4}', grad: 'g7', tag: '\u{1F525}', desc: 'PNL, Booba, Jul & co.' },
  { key: 'foot_fr', label: 'Foot Français', icon: '⚽', grad: 'g8', desc: 'Ligue 1, Bleus & légendes' },
  { key: 'cinema_fr', label: 'Cinéma Français', icon: '\u{1F3AD}', grad: 'g9', desc: 'Films, séries & acteurs' },
  { key: 'culture_fr', label: 'Culture Générale FR', icon: '\u{1F1EB}\u{1F1F7}', grad: 'g10', desc: 'Histoire, géo & traditions' },
  { key: 'premier_league', label: 'Premier League', icon: '\u{1F981}', grad: 'g11', tag: '\u{1F4F8}', desc: 'Devine le joueur anglais' },
  { key: 'la_liga', label: 'La Liga', icon: '\u{1F402}', grad: 'g12', tag: '\u{1F4F8}', desc: 'Devine le joueur espagnol' },
];

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('quizzup-theme') || 'light'; } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('quizzup-theme', theme); } catch {}
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}

export const TopControls = memo(function TopControls({ muted, toggleMute, theme, toggleTheme }) {
  return (
    <div className="top-controls">
      <button className="ctrl-btn" onClick={toggleMute} aria-label="Toggle sound" title="Toggle sound">
        {muted ? '\u{1F507}' : '\u{1F50A}'}
      </button>
      <button className="ctrl-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
        {theme === 'dark' ? '☀️' : '\u{1F319}'}
      </button>
    </div>
  );
});

export const SoloToggle = memo(function SoloToggle({ solo, onToggle }) {
  return (
    <button className={`solo-toggle ${solo ? 'active' : ''}`} onClick={onToggle}>
      {solo ? '\u{1F9CD} Solo' : '\u{1F465} Multijoueur'}
    </button>
  );
});

// "Guess the player" rounds carry an optional photo. It starts sharp and
// blurs more as the clock runs down — like the original QuizUp — to reward
// fast answers, then shows full + its required CC attribution once revealed.
export const PlayerPhoto = memo(function PlayerPhoto({ image, credit, timeLeft, timeLimit, revealed }) {
  if (!image) return null;
  const blur = revealed ? 0 : Math.max(0, (1 - timeLeft / timeLimit) * 18);
  return (
    <div className="player-photo-wrap">
      <img src={image} alt="Guess the player" className="player-photo" style={{ filter: `blur(${blur}px)` }} />
      {revealed && credit && <div className="photo-credit">{credit}</div>}
    </div>
  );
});

// Post-match level-up ring: a conic-gradient arc (no SVG needed) showing
// progress toward the next level, with the level number in the center.
export const LevelRing = memo(function LevelRing({ level, xpIntoLevel, xpForLevel }) {
  const pct = xpForLevel ? Math.round((xpIntoLevel / xpForLevel) * 100) : 0;
  return (
    <div className="level-ring" style={{ background: `conic-gradient(var(--accent) ${pct}%, rgba(255,255,255,0.15) ${pct}%)` }}>
      <div className="level-ring-inner">{level}</div>
    </div>
  );
});

// A single home-screen topic tile: square icon + label underneath, matching
// the original QuizUp's dense topic grid rather than a big descriptive card.
export const CategoryTile = memo(function CategoryTile({ c, onClick }) {
  return (
    <button className="topic-tile" onClick={onClick}>
      <span className={`tile-icon-sq ${c.grad}`}>
        {c.icon}
        {c.tag && <span className="tile-tag-badge">{c.tag}</span>}
      </span>
      <span className="tile-label">{c.label}</span>
    </button>
  );
});

export const NavBar = memo(function NavBar({ active, onNav, onQuickMatch }) {
  return (
    <nav className="navbar">
      <button className={`nav-item ${active === 'home' ? 'active' : ''}`} onClick={() => onNav('home')}>
        <span className="nav-ic">{'\u{1F3E0}'}</span><span className="nav-lbl">Home</span>
      </button>
      <button className="nav-item dimmed">
        <span className="nav-ic">{'\u{1F6D2}'}</span><span className="nav-lbl">Shop</span>
      </button>
      <button className="nav-bolt" onClick={onQuickMatch} aria-label="Quick Play">{'⚡'}</button>
      <button className={`nav-item ${active === 'categories' ? 'active' : ''}`} onClick={() => onNav('categories')}>
        <span className="nav-ic">{'\u{1F5C2}️'}</span><span className="nav-lbl">Themes</span>
      </button>
      <button className={`nav-item ${active === 'profile' ? 'active' : ''}`} onClick={() => onNav('profile')}>
        <span className="nav-ic">{'\u{1F464}'}</span><span className="nav-lbl">Profile</span>
      </button>
    </nav>
  );
});
