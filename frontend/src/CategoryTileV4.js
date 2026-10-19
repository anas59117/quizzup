/**
 * CategoryTileV4 — Each category has its own typographic world.
 * Fallback hierarchy:
 *   1. Topic-specific typo world (Spider-Man Bungee, HP Cinzel, etc.)
 *   2. Cover image from topicCovers.js (Rap FR photo, Ligue Champions, etc.)
 *   3. Family-level gradient + emoji icon
 */
import React, { memo } from 'react';
import { getTopicCover } from './topicCovers';

// Monogram text per topic — short label for the big typographic hero
const TOPIC_TYPO = {
  // Pop culture / sagas
  spider_man: { line1: 'SPIDER', line2: 'MAN', sub: 'Multiverse', font: 'bungee' },
  marvel:     { line1: 'MARVEL', sub: 'Avengers', font: 'bungee' },
  dc_comics:  { line1: 'DC', sub: 'Comics', font: 'bungee' },
  batman:     { line1: 'BAT', line2: 'MAN', sub: 'Gotham', font: 'bungee' },
  star_wars:  { line1: 'STAR', line2: 'WARS', sub: 'A Long Time Ago', font: 'bungee' },
  harry_potter: { line1: 'HP', font: 'cinzel' },
  game_of_thrones: { line1: 'GOT', sub: 'Westeros', font: 'cinzel' },
  lupin:      { line1: 'LUPIN', sub: 'Gentleman', font: 'playfair' },
  kaamelott:  { line1: 'KAAM', line2: 'ELOTT', sub: 'Camelot', font: 'cinzel' },
  disney:     { line1: 'Disney', font: 'playfair' },
  disney_renaissance: { line1: 'Renais', line2: 'sance', font: 'playfair' },
  ghibli:     { line1: 'Ghibli', font: 'playfair' },
  pixar:      { line1: 'Pixar', font: 'playfair' },
  saga_fantastique: { line1: 'Fantasy', font: 'cinzel' },

  // Séries
  bridgerton: { line1: 'Bridger', line2: 'ton', font: 'playfair' },
  gossip_girl: { line1: 'Gossip', line2: 'Girl', font: 'playfair' },
  vampire_diaries: { line1: 'VAMP', sub: 'Diaries', font: 'cinzel' },

  // Gaming
  minecraft:  { line1: 'MINE', line2: 'CRAFT', font: 'pixel' },
  zelda:      { line1: 'ZELDA', sub: 'Hyrule', font: 'cinzel' },
  sonic:      { line1: 'SONIC', sub: 'Gotta Go Fast', font: 'bungee' },
  elden_ring: { line1: 'ELDEN', line2: 'RING', font: 'cinzel' },
  world_of_warcraft: { line1: 'WoW', sub: 'Azeroth', font: 'cinzel' },
  yu_gi_oh:   { line1: 'YU-GI', line2: '-OH!', font: 'bungee' },
  fnaf:       { line1: 'FNAF', font: 'rubik' },
  fifa_ea_sport: { line1: 'FIFA', sub: 'EA Sport', font: 'bebas' },

  // Anime / manga
  one_piece:  { line1: 'ONE', line2: 'PIECE', font: 'bungee' },
  pokemon:    { line1: 'POKÉMON', font: 'bungee' },
  anime_shonen: { line1: 'SHONEN', font: 'bungee' },
  anime_culte: { line1: 'ANIME', sub: 'Culte', font: 'bungee' },
  solo_leveling: { line1: 'SOLO', line2: 'LEVELING', font: 'cinzel' },
  sailor_moon: { line1: 'SAILOR', sub: 'Moon', font: 'playfair' },
  arcane:     { line1: 'ARCANE', font: 'cinzel' },

  // Musique
  rap_fr:     { line1: 'RAP', line2: 'FR', sub: 'France · 2024', font: 'archivo' },
  werenoi:    { line1: 'WERE', line2: 'NOI', sub: 'Rap FR · 2024', font: 'archivo' },
  stromae:    { line1: 'STRO', line2: 'MAE', sub: 'Belgique', font: 'archivo' },
  angele:     { line1: 'ANGÈLE', sub: 'Pop BE', font: 'playfair' },

  // Sport
  ligue_champions: { line1: 'UCL', sub: 'FOOTBALL', font: 'bebas' },
  ballon_dor:      { line1: 'BALLON', line2: "D'OR", sub: '2025', font: 'bebas' },
  ballon_dor_2025: { line1: 'BALLON', line2: "D'OR 25", sub: 'FOOTBALL', font: 'bebas' },
  mercato:    { line1: 'MERCATO', sub: 'Transferts', font: 'bebas' },
  wembanyama: { line1: 'WEMBY', sub: 'NBA', font: 'bebas' },
  nba:        { line1: 'NBA', font: 'bebas' },

  // Culture
  euphoria:   { line1: 'EUPHORIA', font: 'cinzel' },
  drapeaux:   { line1: 'DRAPEAUX', font: 'bebas' },
  culture_fr: { line1: 'Culture', line2: 'FR', font: 'playfair' },
  culture_g:  { line1: 'Culture', line2: 'G', font: 'playfair' },
  geo_france: { line1: 'GÉO', sub: 'France', font: 'playfair' },
  argot_verlan: { line1: 'ARGOT', line2: '& VERLAN', font: 'bungee' },

  // Horror / braquage
  film_horreur: { line1: 'HORREUR', font: 'rubik' },
  film_braquage: { line1: 'HEIST', sub: 'Braquage', font: 'bebas' },
};

// Family-level fallback typography when a specific topic typo isn't set
const FAMILY_TYPO = {
  music: { font: 'archivo' },
  football: { font: 'bebas' },
  sport: { font: 'bebas' },
  sagas: { font: 'bungee' },
  manga: { font: 'bungee' },
  gaming: { font: 'pixel' },
  culture: { font: 'playfair' },
  films: { font: 'cinzel' },
};

function topicMark(label) {
  const words = String(label || '').replace(/\([^)]*\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0]?.slice(0, 2).toUpperCase() || 'QZ';
}

/**
 * Props:
 *  - c: category object { key, label, icon, grad, tag, desc, family }
 *  - onClick, disabled: same as original CategoryTile
 *  - featured: when true, render as 2:1 hero with subtitle
 */
export const CategoryTileV4 = memo(function CategoryTileV4({ c, onClick, disabled, featured }) {
  const typo = TOPIC_TYPO[c.key];
  const cover = !typo ? getTopicCover(c) : null;
  const familyFont = FAMILY_TYPO[c.family]?.font || 'display';
  const fontClass = typo ? typo.font : familyFont;

  const hasCover = !!cover;
  const className = [
    'tile-v4',
    `tile-v4--${fontClass}`,
    hasCover ? 'tile-v4--has-cover' : '',
    featured ? 'tile-v4--featured' : '',
  ].filter(Boolean).join(' ');

  const coverStyle = cover ? { '--cover-focal': cover.focal } : undefined;

  return (
    <button
      className={className}
      onClick={onClick}
      disabled={disabled}
      data-topic={c.key}
      data-family={c.family}
      style={coverStyle}
      aria-label={c.label}
    >
      {/* Background world (gradient per topic or family) */}
      <div className="tile-v4__bg" aria-hidden="true" />

      {/* Cover image fallback (when no typo custom) */}
      {hasCover && (
        <img
          src={cover.src}
          alt=""
          className="tile-v4__cover"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={(e) => { e.currentTarget.hidden = true; }}
        />
      )}

      {/* Decorative overlay by topic */}
      {c.key === 'spider_man' || c.key === 'marvel' ? (
        <svg className="tile-v4__web" viewBox="0 0 100 100" aria-hidden="true">
          <g fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.5">
            <path d="M50 50L0 0M50 50L100 0M50 50L0 100M50 50L100 100M50 50L50 0M50 50L50 100M50 50L0 50M50 50L100 50"/>
            <path d="M30 30A28 28 0 0 1 70 30M20 50A42 42 0 0 1 80 50M30 70A28 28 0 0 0 70 70" strokeDasharray="3 2"/>
          </g>
        </svg>
      ) : null}

      {c.key === 'rap_fr' || c.key === 'werenoi' ? (
        <div className="tile-v4__noise" aria-hidden="true" />
      ) : null}

      {c.key === 'fnaf' ? (
        <div className="tile-v4__eyes" aria-hidden="true">
          <div className="eye" />
          <div className="eye" />
        </div>
      ) : null}

      {c.key === 'ligue_champions' ? (
        <div className="tile-v4__sunburst" aria-hidden="true" />
      ) : null}

      {!hasCover && fontClass === 'pixel' ? (
        <div className="tile-v4__pixels" aria-hidden="true" />
      ) : null}

      {/* Big typographic monogram OR emoji fallback */}
      {typo && typo.line1 ? (
        <div className="tile-v4__big" aria-hidden="true">
          <div className="tile-v4__big-line">{typo.line1}</div>
          {typo.line2 && <div className="tile-v4__big-line">{typo.line2}</div>}
          {featured && typo.sub && <div className="tile-v4__big-sub">{typo.sub}</div>}
        </div>
      ) : !hasCover ? (
        /* No typo + no cover → big emoji icon or monogram centered */
        <div className="tile-v4__emoji" aria-hidden="true">
          {c.icon || topicMark(c.label)}
        </div>
      ) : null}

      {/* Dark gradient for text readability */}
      <div className="tile-v4__shade" aria-hidden="true" />

      {/* Label + featured meta */}
      <div className="tile-v4__caption">
        <div className="tile-v4__label">{c.label}</div>
        {featured && (
          <div className="tile-v4__meta">
            <span className="tile-v4__pill">{c.descShort || c.desc || c.label}</span>
          </div>
        )}
      </div>
    </button>
  );
});

export default CategoryTileV4;
