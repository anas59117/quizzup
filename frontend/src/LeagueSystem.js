/**
 * LeagueSystem — Mode Ranked (Bronze → Diamant)
 * Stockage localStorage
 */
import React, { useState, useEffect, useCallback } from 'react';
import { useI18n } from './i18n';

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

  const addResult = useCallback((won) => {
    setLeague(prev => {
      const lpChange = won ? (prev.streak >= 2 ? 35 : 25) : -20;
      const newLp = Math.max(0, prev.lp + lpChange);
      const newStreak = won ? prev.streak + 1 : 0;
      const updated = {
        ...prev,
        lp: newLp,
        wins: prev.wins + (won ? 1 : 0),
        losses: prev.losses + (won ? 0 : 1),
        streak: newStreak,
      };
      saveLeague(updated);
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

export function LeagueContent({ league, onBack, t }) {
  const { lp, wins, losses, streak, tier, next, progress } = league;
  const total = wins + losses;
  const winRate = total > 0 ? Math.round((wins / total) * 100) : 0;

  return (
    <div className="container league-page">
      <div className="league-header">
        <button className="league-back" onClick={onBack}>←</button>
        <h2 className="league-title">🏆 {t('leagueTitle')}</h2>
      </div>

      <div className="league-season">{t('season')} {league.currentSeason} — {league.daysLeft} {t('daysLeft')}</div>
      <div className="league-card">
        <div className="league-tier-icon" style={{ color: tier.color }}>{tier.icon}</div>
        <div className="league-tier-name" style={{ color: tier.color }}>{tier.label}</div>
        <div className="league-lp">{lp} LP</div>
        {next && (
          <>
            <div className="league-progress-bar">
              <div className="league-progress-fill" style={{ width: `${progress}%`, background: tier.color }} />
            </div>
            <div className="league-next">{t('nextTier')}: {next.label} ({next.min} LP)</div>
          </>
        )}
        {!next && <div className="league-max">{t('maxTier')}</div>}
      </div>

      <div className="league-stats">
        <div className="lstat">
          <div className="lstat-val">{wins}</div>
          <div className="lstat-label">{t('wins')}</div>
        </div>
        <div className="lstat">
          <div className="lstat-val">{losses}</div>
          <div className="lstat-label">{t('losses')}</div>
        </div>
        <div className="lstat">
          <div className="lstat-val">{winRate}%</div>
          <div className="lstat-label">{t('winRate')}</div>
        </div>
        <div className="lstat">
          <div className="lstat-val">{streak > 0 ? `+${streak}` : 0}</div>
          <div className="lstat-label">{t('streak')}</div>
        </div>
      </div>

      <div className="league-tiers">
        <h3>{t('allTiers')}</h3>
        {TIERS.map(tierItem => (
          <div
            key={tierItem.key}
            className={`league-tier-row ${tierItem.key === tier.key ? 'current' : ''}`}
          >
            <span className="tier-icon">{tierItem.icon}</span>
            <span className="tier-name" style={{ color: tierItem.color }}>{tierItem.label}</span>
            <span className="tier-min">{tierItem.min} LP</span>
          </div>
        ))}
      </div>
    </div>
  );
}
