import React, { useState, useEffect, useCallback, memo } from 'react';
import { useI18n } from './i18n';

export const AVATARS = ['\u{1F43A}', '\u{1F981}', '\u{1F98A}', '\u{1F43C}', '\u{1F989}', '\u{1F438}', '\u{1F42F}', '\u{1F984}'];

export const CATEGORIES = [
  { key: 'movies', label: 'Movies', icon: '\u{1F3AC}', grad: 'g1', tag: '\u{1F525}', desc: 'Blockbusters & classics', family: 'entertainment' },
  { key: 'music', label: 'Music', icon: '\u{1F3B5}', grad: 'g2', desc: 'Artists, albums & lyrics', family: 'music' },
  { key: 'sports', label: 'Sports', icon: '⚽', grad: 'g3', desc: 'Teams & champions', family: 'sport' },
  { key: 'geography', label: 'Geography', icon: '\u{1F30D}', grad: 'g4', desc: 'Capitals & landmarks', family: 'culture' },
  { key: 'gaming', label: 'Gaming', icon: '\u{1F3AE}', grad: 'g5', desc: 'Consoles & lore', family: 'gaming' },
  { key: 'science', label: 'Science', icon: '\u{1F9EC}', grad: 'g6', tag: '✨', desc: 'Space, bio & physics', family: 'culture' },
  { key: 'rap_fr', label: 'Rap Français', icon: '\u{1F3A4}', grad: 'g7', tag: '\u{1F525}', desc: 'PNL, Booba, Jul & co.', family: 'music', cover: '/images/players/booba.jpg' },
  { key: 'foot_fr', label: 'Foot Français', icon: '⚽', grad: 'g8', desc: 'Ligue 1, Bleus & légendes', family: 'sport', cover: '/images/players/ousmane_dembele.jpg' },
  { key: 'cinema_fr', label: 'Cinéma Français', icon: '\u{1F3AD}', grad: 'g9', desc: 'Films, séries & acteurs', family: 'entertainment' },
  { key: 'culture_fr', label: 'Culture Générale FR', icon: '\u{1F1EB}\u{1F1F7}', grad: 'g10', desc: 'Histoire, géo & traditions', family: 'culture' },
  { key: 'premier_league', label: 'Premier League', icon: '\u{1F981}', grad: 'g11', tag: '\u{1F4F8}', desc: 'Devine le joueur anglais', family: 'sport', cover: '/images/players/erling_braut_haaland.jpg' },
  { key: 'la_liga', label: 'La Liga', icon: '\u{1F402}', grad: 'g12', tag: '\u{1F4F8}', desc: 'Devine le joueur espagnol', family: 'sport', cover: '/images/players/lamine_yamal.jpg' },
  { key: 'bundesliga', label: 'Bundesliga', icon: '\u{1F985}', grad: 'g25', tag: '\u{1F4F8}', desc: 'Devine le joueur allemand', family: 'sport', cover: '/images/players/harry_kane.jpg' },
  { key: 'serie_a', label: 'Serie A', icon: '\u{1F462}', grad: 'g26', tag: '\u{1F4F8}', desc: 'Devine le joueur italien', family: 'sport', cover: '/images/players/lautaro_martinez.jpg' },
  { key: 'ligue_1', label: 'Ligue 1', icon: '\u{1F413}', grad: 'g27', tag: '\u{1F4F8}', desc: 'Devine le joueur français', family: 'sport', cover: '/images/players/achraf_hakimi.jpg' },
  // `logo` (path under /images/logos/) shows the real brand mark once
  // provided; until then the emoji `icon` is the fallback.
  { key: 'netflix', label: 'Netflix', icon: '\u{1F3AC}', logo: null, grad: 'g13', desc: 'Séries & films Netflix', family: 'entertainment' },
  { key: 'got', label: 'Game of Thrones', icon: '\u{1F409}', logo: null, grad: 'g14', desc: 'Le Trône de Fer', family: 'entertainment' },
  { key: 'harry_potter', label: 'Harry Potter', icon: '\u{1FA84}', grad: 'g15', desc: 'Poudlard & sorcellerie', family: 'entertainment' },
  { key: 'marvel', label: 'Marvel', icon: '\u{1F9B8}', grad: 'g16', desc: 'Avengers & super-héros', family: 'entertainment' },
  { key: 'star_wars', label: 'Star Wars', icon: '\u{2694}\u{FE0F}', grad: 'g17', desc: 'Jedi, Sith & la Force', family: 'entertainment' },
  { key: 'disney', label: 'Disney Classics', icon: '\u{1F3F0}', grad: 'g18', desc: 'Contes animés cultes', family: 'entertainment' },
  { key: 'pokemon', label: 'Pokémon', icon: '\u{26A1}', grad: 'g19', desc: 'Dresseurs & Pokéballs', family: 'gaming' },
  { key: 'f1', label: 'Formule 1', icon: '\u{1F3CE}\u{FE0F}', grad: 'g20', desc: 'Écuries & champions', family: 'sport' },
  { key: 'nba', label: 'Basket NBA', icon: '\u{1F3C0}', grad: 'g21', desc: 'Légendes du parquet', family: 'sport' },
  { key: 'tv_shows', label: 'Séries Cultes', icon: '\u{1F4FA}', grad: 'g22', desc: 'Friends, House & co.', family: 'entertainment' },
  { key: 'histoire_fr', label: 'Histoire de France', icon: '\u{269C}\u{FE0F}', grad: 'g23', desc: 'Rois, guerres & dates', family: 'culture' },
  { key: 'retro_games', label: 'Jeux Vidéo Rétro', icon: '\u{1F47E}', grad: 'g24', desc: 'Mario, Sonic & arcade', family: 'gaming' },
];

// Big topic families (QuizUp-style browsing: tap a broad category to see
// every quiz inside it) — labels/descriptions are translated UI chrome,
// unlike the quiz-specific CATEGORIES labels above.
export const FAMILIES = [
  { key: 'sport', icon: '⚽', grad: 'g3' },
  { key: 'entertainment', icon: '\u{1F3AC}', grad: 'g13' },
  { key: 'music', icon: '\u{1F3B5}', grad: 'g7' },
  { key: 'culture', icon: '\u{1F30D}', grad: 'g10' },
  { key: 'gaming', icon: '\u{1F3AE}', grad: 'g5' },
];

export function categoriesInFamily(familyKey) {
  return CATEGORIES.filter((c) => c.family === familyKey);
}

// Strips accents so "francais" matches "Français" — search shouldn't
// require the visitor to type the exact diacritics of an on-screen label.
export function normalizeForSearch(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function famLabel(t, key, suffix = '') {
  return t(`fam${key[0].toUpperCase()}${key.slice(1)}${suffix}`);
}

export const JoinScreen = memo(function JoinScreen({ name, setName, avatar, setAvatar, onContinue }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <div className="badge">{'⚡'} {t('legendBack')}</div>
      <h1 className="logo">Quizz<span>Up</span></h1>
      <p className="tagline">{t('tagline')}</p>
      <input className="input" placeholder={t('usernamePlaceholder')} value={name} maxLength={20}
        onChange={(e) => setName(e.target.value)} />
      <div className="avatar-picker">
        {AVATARS.map((a) => (
          <button key={a} className={`avatar-opt ${avatar === a ? 'active' : ''}`} onClick={() => setAvatar(a)}>{a}</button>
        ))}
      </div>
      <button className="btn" disabled={!name.trim()} onClick={onContinue}>{t('continue')}</button>
    </div>
  );
});

export const ErrorScreen = memo(function ErrorScreen({ onRetry }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <h2 className="logo">{t('connectionLost')}</h2>
      <p className="tagline">{t('serverUnreachable')}</p>
      <button className="btn" onClick={onRetry}>{t('retry')}</button>
    </div>
  );
});

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
  const { lang, toggleLang } = useI18n();
  return (
    <div className="top-controls">
      <button className="ctrl-btn" onClick={toggleMute} aria-label="Toggle sound" title="Toggle sound">
        {muted ? '\u{1F507}' : '\u{1F50A}'}
      </button>
      <button className="ctrl-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
        {theme === 'dark' ? '☀️' : '\u{1F319}'}
      </button>
      <button className="ctrl-btn" onClick={toggleLang} aria-label="Toggle language" title="Toggle language">
        {lang === 'fr' ? '\u{1F1EB}\u{1F1F7}' : '\u{1F1EC}\u{1F1E7}'}
      </button>
    </div>
  );
});

export const SoloToggle = memo(function SoloToggle({ solo, onToggle }) {
  const { t } = useI18n();
  return (
    <button className={`solo-toggle ${solo ? 'active' : ''}`} onClick={onToggle}>
      {solo ? t('solo') : t('multiplayer')}
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
// `cover` (a real player photo already in the game's own asset set) replaces
// the flat gradient with an actual illustration for photo-quiz categories.
export const CategoryTile = memo(function CategoryTile({ c, onClick }) {
  return (
    <button className="topic-tile" onClick={onClick}>
      <span
        className={`tile-icon-sq ${c.grad} ${c.cover ? 'has-cover' : ''}`}
        style={c.cover ? { backgroundImage: `url(${c.cover})` } : undefined}
      >
        {!c.cover && (c.logo ? <img src={c.logo} alt={c.label} className="tile-logo-img" /> : c.icon)}
        {c.cover && <span className="tile-cover-icon">{c.icon}</span>}
        {c.tag && <span className="tile-tag-badge">{c.tag}</span>}
      </span>
      <span className="tile-label">{c.label}</span>
    </button>
  );
});

// A big "family" card — the QuizUp-style broad topic (Sport, Music...) that
// opens onto every specific quiz inside it, rather than listing all quizzes
// flat on one screen.
export const FamilyTile = memo(function FamilyTile({ fam, label, desc, count, onClick }) {
  return (
    <button className="family-tile" onClick={onClick}>
      <span className={`family-icon ${fam.grad}`}>{fam.icon}</span>
      <span className="family-info">
        <span className="family-label">{label}</span>
        <span className="family-desc">{desc}</span>
      </span>
      <span className="family-count">{count}</span>
    </button>
  );
});

// Shared by Home's "All Topics" section and the Themes screen's overview —
// keeps both in sync instead of duplicating the same map/props in two files.
export const FamilyGrid = memo(function FamilyGrid({ onSelect }) {
  const { t } = useI18n();
  return (
    <div className="family-list">
      {FAMILIES.map((fam) => (
        <FamilyTile key={fam.key} fam={fam} label={famLabel(t, fam.key)} desc={famLabel(t, fam.key, 'Desc')}
          count={t('quizCount', { n: categoriesInFamily(fam.key).length })}
          onClick={() => onSelect(fam.key)} />
      ))}
    </div>
  );
});

export const SearchBar = memo(function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true">{'\u{1F50D}'}</span>
      <input
        className="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
});

export const NavBar = memo(function NavBar({ active, onNav, onQuickMatch }) {
  const { t } = useI18n();
  return (
    <nav className="navbar">
      <button className={`nav-item ${active === 'home' ? 'active' : ''}`} onClick={() => onNav('home')}>
        <span className="nav-ic">{'\u{1F3E0}'}</span><span className="nav-lbl">{t('navHome')}</span>
      </button>
      <button className={`nav-item ${active === 'feed' ? 'active' : ''}`} onClick={() => onNav('feed')}>
        <span className="nav-ic">{'\u{1F4F0}'}</span><span className="nav-lbl">{t('navFeed')}</span>
      </button>
      <button className="nav-bolt" onClick={onQuickMatch} aria-label="Quick Play">{'⚡'}</button>
      <button className={`nav-item ${active === 'categories' ? 'active' : ''}`} onClick={() => onNav('categories')}>
        <span className="nav-ic">{'\u{1F5C2}️'}</span><span className="nav-lbl">{t('navThemes')}</span>
      </button>
      <button className={`nav-item ${active === 'profile' ? 'active' : ''}`} onClick={() => onNav('profile')}>
        <span className="nav-ic">{'\u{1F464}'}</span><span className="nav-lbl">{t('navProfile')}</span>
      </button>
    </nav>
  );
});
