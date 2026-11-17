/**
 * SeasonPass — Battle Pass avec niveaux gratuits et premium
 */
import React, { useState, useCallback } from 'react';

import { Icon } from './ui';
import { ProgressionHeading, useProgressionCopy } from './ProgressionUI';

const PASS_LEVELS = [
  { level: 1, free: { coins: 50, xp: 100 }, premium: { coins: 150, xp: 300, item: '🖼️ Cadre Bronze' } },
  { level: 2, free: { coins: 75 }, premium: { coins: 200, item: '🎨 Couleur Rose' } },
  { level: 3, free: { xp: 150 }, premium: { coins: 250, xp: 500, item: '👑 Avatar Roi' } },
  { level: 4, free: { coins: 100 }, premium: { coins: 300, item: '🖼️ Cadre Argent' } },
  { level: 5, free: { coins: 125, xp: 200 }, premium: { coins: 400, xp: 800, item: '✨ Animation Étoile' } },
  { level: 6, free: { coins: 150 }, premium: { coins: 450, item: '🎨 Couleur Or' } },
  { level: 7, free: { xp: 250 }, premium: { coins: 500, xp: 1000, item: '🖼️ Cadre Or' } },
  { level: 8, free: { coins: 200 }, premium: { coins: 600, item: '🔥 Animation Feu' } },
  { level: 9, free: { coins: 250, xp: 300 }, premium: { coins: 700, xp: 1200, item: '🎨 Couleur Platine' } },
  { level: 10, free: { coins: 300 }, premium: { coins: 1000, item: '🏆 Titre Légende' } },
];

function loadPass() {
  try {
    return JSON.parse(localStorage.getItem('quizzup-pass') || '{"xp":0,"premium":false,"claimed":[]}');
  } catch {
    return { xp: 0, premium: false, claimed: [] };
  }
}

function savePass(data) {
  localStorage.setItem('quizzup-pass', JSON.stringify(data));
}

export function useSeasonPass() {
  const [pass, setPass] = useState(loadPass);

  const addPassXP = useCallback((amount) => {
    setPass(prev => {
      const updated = { ...prev, xp: prev.xp + amount };
      savePass(updated);
      return updated;
    });
  }, []);

  const buyPremium = useCallback(() => {
    setPass(prev => {
      const updated = { ...prev, premium: true };
      savePass(updated);
      return updated;
    });
  }, []);

  const claimReward = useCallback((level) => {
    setPass(prev => {
      if (prev.claimed.includes(level)) return prev;
      const updated = { ...prev, claimed: [...prev.claimed, level] };
      savePass(updated);
      return updated;
    });
  }, []);

  const currentLevel = Math.min(Math.floor(pass.xp / 500) + 1, 10);
  const levelProgress = (pass.xp % 500) / 500 * 100;

  return { ...pass, currentLevel, levelProgress, addPassXP, buyPremium, claimReward };
}

export function SeasonPassPanel({ pass, onBack }) {
  const { copy } = useProgressionCopy();
  const currentLevel = Math.max(1, Math.min(10, pass.currentLevel || 1));
  return <main id="main-content" className="progression-page" aria-labelledby="progression-title" tabIndex={-1}>
    <ProgressionHeading title={copy('Pass de saison', 'Season pass', 'Pase de temporada')} eyebrow={copy('La suite se prépare', 'More is on the way', 'Se prepara lo próximo')} onBack={onBack} />
    <section className="progression-card progression-pass-intro">
      <div><span className="progression-badge"><Icon name="info" size={16} />{copy('En préparation', 'In preparation', 'En preparación')}</span>
        <h2>{copy('Un aperçu de ton parcours.', 'A preview of your journey.', 'Un vistazo a tu recorrido.')}</h2>
        <p>{copy('Le pass et ses récompenses ne sont pas encore disponibles. Aucun achat ni retrait de récompense n’est possible ici.', 'The pass and its rewards are not available yet. Purchases and reward claims are unavailable here.', 'El pase y sus recompensas aún no están disponibles. No es posible comprar ni reclamar recompensas aquí.')}</p>
      </div>
      <div className="progression-pass-level"><span className="progression-eyebrow">{copy('Niveau local', 'Local level', 'Nivel local')}</span><p className="progression-number">{currentLevel}<span>/ 10</span></p><span>{pass.xp || 0} XP</span></div>
    </section>
    <section aria-labelledby="pass-levels-title">
      <div className="progression-track-heading"><h2 id="pass-levels-title">{copy('Le parcours en aperçu', 'Journey preview', 'Vista previa del recorrido')}</h2><p>{copy('Progression sur cet appareil', 'Progress on this device', 'Progreso en este dispositivo')}</p></div>
      <ol className="progression-levels">{PASS_LEVELS.map(({ level }) => <li className={`progression-card progression-level ${level === currentLevel ? 'is-current' : ''}`} key={level} aria-current={level === currentLevel ? 'step' : undefined}>
        <span className="progression-eyebrow">{copy('Niveau', 'Level', 'Nivel')}</span><strong className="progression-level-number">{String(level).padStart(2, '0')}</strong>
        <span className="progression-level-status"><Icon name="key" size={18} />{copy('Récompenses à venir', 'Rewards to come', 'Próximas recompensas')}</span>
        <span className="progression-note">{(level - 1) * 500} XP</span>
        {level === currentLevel && <span className="progression-current">{copy('Ton niveau local', 'Your local level', 'Tu nivel local')}</span>}
      </li>)}</ol>
    </section>
    <p className="progression-local-note"><Icon name="info" size={18} />{copy('Ces niveaux reflètent uniquement les données de cet appareil. Le contenu définitif du pass sera annoncé à son lancement.', 'These levels reflect this device’s data only. Final pass content will be announced at launch.', 'Estos niveles reflejan solo los datos de este dispositivo. El contenido definitivo del pase se anunciará en su lanzamiento.')}</p>
  </main>;
}