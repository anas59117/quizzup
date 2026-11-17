/**
 * LeagueSystem — Mode Ranked (Bronze → Diamant)
 * Stockage localStorage
 */
import React, { useState, useCallback } from 'react';
import { Icon } from './ui';
import { DuelAction, ProgressionHeading, useProgressionCopy } from './ProgressionUI';
import { applyLeagueOutcome } from './league-results';

const SEASON_DURATION_DAYS = 30;

function getCurrentSeason() {
  const start = new Date('2024-01-01').getTime();
  const now = Date.now();
  return Math.floor((now - start) / (SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000)) + 1;
}

function checkSeasonReset(data) {
  const currentSeason = getCurrentSeason();
  if (data.season !== currentSeason) {
    return { lp: 0, wins: 0, losses: 0, streak: 0, season: currentSeason, history: [...(data.history || []), { season: data.season, lp: data.lp, tier: getTier(data.lp).key }] };
  }
  return data;
}

const TIERS = [
  { key: 'bronze', label: 'Bronze', min: 0, color: '#cd7f32', icon: '🥉' },
  { key: 'silver', label: 'Silver', min: 500, color: '#c0c0c0', icon: '🥈' },
  { key: 'gold', label: 'Gold', min: 1200, color: '#ffd700', icon: '🥇' },
  { key: 'platinum', label: 'Platinum', min: 2500, color: '#3eb489', icon: '💎' },
  { key: 'diamond', label: 'Diamond', min: 5000, color: '#b9f2ff', icon: '💠' },
];

function getTier(lp) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (lp >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

function getNextTier(lp) {
  for (let i = 0; i < TIERS.length; i++) {
    if (lp < TIERS[i].min) return TIERS[i];
  }
  return null;
}

function loadLeague() {
  try {
    const raw = JSON.parse(localStorage.getItem('quizzup-league') || '{"lp":0,"wins":0,"losses":0,"streak":0,"season":1}');
    return checkSeasonReset(raw);
  } catch {
    return { lp: 0, wins: 0, losses: 0, streak: 0, season: getCurrentSeason(), history: [] };
  }
}

function saveLeague(data) {
  localStorage.setItem('quizzup-league', JSON.stringify({ ...data, lastUpdate: Date.now() }));
}

export function useLeague() {
  const [league, setLeague] = useState(loadLeague);

  const addResult = useCallback((result) => {
    setLeague(prev => {
      const updated = applyLeagueOutcome(prev, result);
      if (updated !== prev) saveLeague(updated);
      return updated;
    });
  }, []);

  const tier = getTier(league.lp);
  const next = getNextTier(league.lp);
  const progress = next ? ((league.lp - tier.min) / (next.min - tier.min)) * 100 : 100;
  const currentSeason = getCurrentSeason();
  const seasonEnd = new Date('2024-01-01').getTime() + (currentSeason * SEASON_DURATION_DAYS * 24 * 60 * 60 * 1000);
  const daysLeft = Math.ceil((seasonEnd - Date.now()) / (24 * 60 * 60 * 1000));

  const totalGames = (league.wins || 0) + (league.losses || 0);
  const winRate = totalGames > 0 ? Math.round((league.wins / totalGames) * 100) : 0;
  return { ...league, tier, next, progress, winRate, currentSeason, daysLeft, addResult };
}

export function LeagueContent({ league, onBack, onPlay }) {
  const { copy } = useProgressionCopy();
  const { lp, wins, losses, streak, tier, next } = league;
  const names = {
    bronze: copy('Bronze', 'Bronze', 'Bronce'), silver: copy('Argent', 'Silver', 'Plata'),
    gold: copy('Or', 'Gold', 'Oro'), platinum: copy('Platine', 'Platinum', 'Platino'),
    diamond: copy('Diamant', 'Diamond', 'Diamante'),
  };
  const total = wins + losses;
  const winRate = total > 0 ? Math.round(wins / total * 100) : 0;
  const progress = Math.max(0, Math.min(100, league.progress));
  return <main id="main-content" className="progression-page" aria-labelledby="progression-title" tabIndex={-1}>
    <ProgressionHeading title={copy('Ma ligue', 'My league', 'Mi liga')} eyebrow={copy('À toi de monter', 'Keep climbing', 'Sigue subiendo')} onBack={onBack} />
    <div className="progression-layout">
      <section className="progression-card progression-rank">
        <div className="progression-section-top"><span className="progression-eyebrow">{copy('Saison', 'Season', 'Temporada')} {league.currentSeason}</span><span>{league.daysLeft} {copy('jours restants', 'days left', 'días restantes')}</span></div>
        <Icon name="trophy" size={52} />
        <h2>{names[tier.key]}</h2>
        <p className="progression-number">{lp}<span>LP</span></p>
        <div className="progression-meter" role="progressbar" aria-label={copy('Points de ligue', 'League points', 'Puntos de liga')} aria-valuemin={tier.min} aria-valuemax={next ? next.min : Math.max(tier.min, lp)} aria-valuenow={lp}>
          <span style={{ width: `${progress}%` }} />
        </div>
        <p className="progression-note">{next ? `${next.min - lp} LP · ${copy('Prochain rang', 'Next rank', 'Próximo rango')} : ${names[next.key]}` : copy('Rang le plus élevé atteint', 'Highest rank reached', 'Rango máximo alcanzado')}</p>
        <DuelAction onPlay={onPlay} />
      </section>
      <section className="progression-card">
        <h2>{copy('Les rangs', 'The ranks', 'Los rangos')}</h2>
        <ol className="progression-ranks">{TIERS.map((item, index) => <li key={item.key} className={item.key === tier.key ? 'is-current' : ''} aria-current={item.key === tier.key ? 'step' : undefined}>
          <span className="progression-rank-index">0{index + 1}</span><strong>{names[item.key]}</strong><span>{item.min} LP</span>{item.key === tier.key && <span className="progression-current">{copy('Toi', 'You', 'Tú')}</span>}
        </li>)}</ol>
      </section>
    </div>
    <dl className="progression-statistics">{[
      [wins, copy('Victoires', 'Wins', 'Victorias')], [losses, copy('Défaites', 'Losses', 'Derrotas')],
      [`${winRate}%`, copy('De victoires', 'Win rate', 'De victorias')], [streak || 0, copy('Série en cours', 'Current streak', 'Racha actual')],
    ].map(([value, label]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <section className="progression-card progression-explainer">
      <Icon name="info" size={24} /><div><h2>{copy('Comment ça marche ?', 'How does it work?', '¿Cómo funciona?')}</h2>
      <p>{copy('LP = points de ligue. Une victoire en duel rapporte 25 LP, puis 35 LP dès la troisième victoire consécutive. Une défaite retire jusqu’à 20 LP, sans descendre sous zéro. Les égalités et les parties solo ne changent pas les LP.', 'LP means league points. A duel win earns 25 LP, then 35 LP from the third consecutive win. A loss removes up to 20 LP, never below zero. Ties and solo games do not change LP.', 'LP son puntos de liga. Una victoria da 25 LP y 35 LP desde la tercera victoria consecutiva. Una derrota resta hasta 20 LP, sin bajar de cero. Los empates y las partidas individuales no cambian los LP.')}</p>
      <p className="progression-note">{copy('Progression enregistrée sur cet appareil uniquement. Chaque saison dure 30 jours et les points repartent à zéro.', 'Progress is saved on this device only. Each season lasts 30 days and points reset to zero.', 'El progreso se guarda solo en este dispositivo. Cada temporada dura 30 días y los puntos vuelven a cero.')}</p></div>
    </section>
  </main>;
}