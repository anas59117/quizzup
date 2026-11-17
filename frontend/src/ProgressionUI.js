import React from 'react';
import { Icon } from './ui';
import { useI18n } from './i18n';

// Direction: native editorial gaming, cream panels on the shared red ground.
// Rules: quiet line icons, honest availability, a single heading per screen.
// Signature: large rank and level numerals anchor each progression card.
export function useProgressionCopy() {
  const { lang } = useI18n();
  const copy = (fr, en, es) => lang === 'en' ? en : lang === 'es' ? (es || fr) : fr;
  return { copy, lang };
}

export function ProgressionHeading({ title, eyebrow, onBack }) {
  const { copy } = useProgressionCopy();
  return <header className="progression-heading">
    {onBack && <button type="button" className="progression-back" onClick={onBack}>
      <span className="progression-back-icon"><Icon name="arrow" /></span>
      {copy('Retour au profil', 'Back to profile', 'Volver al perfil')}
    </button>}
    <p className="progression-eyebrow">{eyebrow}</p>
    <h1 id="progression-title">{title}</h1>
  </header>;
}

export function DuelAction({ onPlay }) {
  const { copy } = useProgressionCopy();
  return onPlay ? <button type="button" className="progression-play" onClick={onPlay}>
    <Icon name="bolt" />{copy('Jouer un duel', 'Play a duel', 'Jugar un duelo')}<Icon name="arrow" />
  </button> : null;
}
