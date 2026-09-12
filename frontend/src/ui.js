import React, { useState, useEffect, useCallback, memo } from 'react';

export const AVATARS = ['\u{1F43A}', '\u{1F981}', '\u{1F98A}', '\u{1F43C}', '\u{1F989}', '\u{1F438}', '\u{1F42F}', '\u{1F984}'];

export const CATEGORIES = [
  { key: 'movies', label: 'Movies', icon: '\u{1F3AC}', grad: 'g1', tag: '\u{1F525}', desc: 'Blockbusters & classics' },
  { key: 'music', label: 'Music', icon: '\u{1F3B5}', grad: 'g2', desc: 'Artists, albums & lyrics' },
  { key: 'sports', label: 'Sports', icon: '⚽', grad: 'g3', desc: 'Teams & champions' },
  { key: 'geography', label: 'Geography', icon: '\u{1F30D}', grad: 'g4', desc: 'Capitals & landmarks' },
  { key: 'gaming', label: 'Gaming', icon: '\u{1F3AE}', grad: 'g5', desc: 'Consoles & lore' },
  { key: 'science', label: 'Science', icon: '\u{1F9EC}', grad: 'g6', tag: '✨', desc: 'Space, bio & physics' },
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
