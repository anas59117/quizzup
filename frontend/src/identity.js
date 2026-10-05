import React from 'react';
import { useI18n } from './i18n';

// Direction: editorial player cards, inspired by collectible sports print.
// Rules: one ink tone and one spot colour per identity; no decorative glow.
// Signature: a large edition number makes each identity recognisable in play.
export const IDENTITIES = {
  none: { number: '00', mark: 'Q', fr: 'Classique', en: 'Classic', lineFr: 'Le jeu parle pour toi.', lineEn: 'Let your game speak.' },
  bronze: { number: '01', mark: 'B', fr: 'Bronze', en: 'Bronze', lineFr: 'Les débuts d’une légende.', lineEn: 'Every legend starts somewhere.' },
  argent: { number: '02', mark: 'A', fr: 'Argent', en: 'Silver', lineFr: 'Précis. Calme. Implacable.', lineEn: 'Sharp. Calm. Relentless.' },
  or: { number: '03', mark: 'O', fr: 'Or', en: 'Gold', lineFr: 'La place se gagne.', lineEn: 'Earn your place.' },
  neon: { number: '04', mark: 'N', fr: 'Néon', en: 'Neon', lineFr: 'La nuit t’appartient.', lineEn: 'Own the night.' },
  flamme: { number: '05', mark: 'F', fr: 'Flamme', en: 'Flame', lineFr: 'Toujours en feu.', lineEn: 'Always on fire.' },
  glace: { number: '06', mark: 'G', fr: 'Glace', en: 'Ice', lineFr: 'Garde la tête froide.', lineEn: 'Keep your cool.' },
  arcenciel: { number: '07', mark: 'P', fr: 'Prisme', en: 'Prism', lineFr: 'Toutes les facettes du jeu.', lineEn: 'Every side of the game.' },
  diamant: { number: '08', mark: 'D', fr: 'Diamant', en: 'Diamond', lineFr: 'Impossible à ignorer.', lineEn: 'Impossible to miss.' },
};

export function identityFor(frame) {
  return IDENTITIES[frame] ? frame : 'none';
}

function AvatarGlyph({ avatar }) {
  const shapes = {
    '🐺': <><path d="M5 13 3 3l7 5 2-2 2 2 7-5-2 10-3 8H8l-3-8Z"/><path d="m9 13 1 1m5-1-1 1m-3 3 1 1 1-1"/></>,
    '🦁': <><path d="m12 2 3 2 4-1 1 4 3 3-2 4 1 4-4 1-2 3h-8l-2-3-4-1 1-4-2-4 3-3 1-4 4 1 3-2Z"/><path d="M7 11c0-4 2-6 5-6s5 2 5 6v3l-3 4h-4l-3-4v-3Z"/><path d="M9 12h1m4 0h1m-4 3h2"/></>,
    '🦊': <><path d="M3 4 9 8h6l6-4-2 13-7 5-7-5L3 4Z"/><path d="m6 13 4 2-1-3m9 1-4 2 1-3m-4 6h2"/></>,
    '🐼': <><circle cx="5" cy="6" r="3"/><circle cx="19" cy="6" r="3"/><circle cx="12" cy="13" r="9"/><path d="m7 11 3 2-2 2-2-2 1-2Zm10 0-3 2 2 2 2-2-1-2Zm-6 6h2l-1 1-1-1Z"/></>,
    '🦉': <><path d="M3 5 9 7l3-3 3 3 6-2-1 13-8 4-8-4L3 5Z"/><circle cx="8.5" cy="12" r="2.5"/><circle cx="15.5" cy="12" r="2.5"/><path d="m12 14-1 3 1 1 1-1-1-3Z"/></>,
    '🐸': <><circle cx="6" cy="7" r="3"/><circle cx="18" cy="7" r="3"/><path d="M3 11c0-4 18-4 18 0v5c0 4-4 6-9 6s-9-2-9-6v-5Z"/><path d="M8 15c2 3 6 3 8 0"/></>,
    '🐯': <><path d="M4 6 2 3l5 1 5 2 5-2 5-1-2 3v12l-8 4-8-4V6Z"/><path d="M8 8h8m-9 4 3 1m7-1-3 1m-3 4h2m-1-10v3"/></>,
    '🦄': <><path d="m12 1 2 7 5 2v9l-7 3-7-3V9l7-1Z"/><path d="M7 12 3 8m14 4 4-4m-12 7h1m5 0h1m-5 3h2"/></>,
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{shapes[avatar] || <path d="M5 19V5h9a5 5 0 0 1 0 10H5m9 0 5 4"/>}</svg>;
}

export function IdentityCard({ frame, avatar, name, level, className = '' }) {
  const { lang, t } = useI18n();
  const id = identityFor(frame);
  const item = IDENTITIES[id];
  return (
    <article className={`identity-card identity-${id} ${className}`.trim()} aria-label={`${name || t('you')} · ${lang === 'en' ? item.en : item.fr}`}>
      <div className="identity-card-top" aria-hidden="true"><span>QUIZZUP / PLAYER</span><span>{item.number}—08</span></div>
      <div className="identity-card-art" aria-hidden="true">
        <span className="identity-card-number">{item.number}</span>
        <span className="identity-card-mark">{item.mark}</span>
        <span className="identity-card-avatar"><AvatarGlyph avatar={avatar} /></span>
      </div>
      <div className="identity-card-footer">
        <div className="identity-card-meta"><span>{lang === 'en' ? item.en : item.fr}</span>{level != null && <span>{t('level')} {level}</span>}</div>
        <strong className="identity-card-name">{name || t('you')}</strong>
        <small className="identity-card-line">{lang === 'en' ? item.lineEn : item.lineFr}</small>
      </div>
    </article>
  );
}
