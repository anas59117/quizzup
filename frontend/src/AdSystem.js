/**
 * AdSystem — Récompenses vidéo (rewarded ads simulation)
 * Limite 5/jour, localStorage tracking
 */
import React, { useState, useEffect, useCallback } from 'react';

const MAX_ADS_PER_DAY = 5;
const REWARD_COINS = 50;
const REWARD_XP = 20;

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function loadAdData() {
  try {
    return JSON.parse(localStorage.getItem('quizzup-ads') || '{"count":0,"date":"","totalWatched":0}');
  } catch {
    return { count: 0, date: '', totalWatched: 0 };
  }
}

function saveAdData(data) {
  localStorage.setItem('quizzup-ads', JSON.stringify(data));
}

export function useAdSystem() {
  const [adData, setAdData] = useState(() => {
    const data = loadAdData();
    const today = getTodayKey();
    if (data.date !== today) {
      return { count: 0, date: today, totalWatched: data.totalWatched || 0 };
    }
    return data;
  });

  const canWatch = adData.count < MAX_ADS_PER_DAY;
  const remaining = MAX_ADS_PER_DAY - adData.count;

  const watchAd = useCallback((onReward) => {
    if (!canWatch) return false;
    
    // Simulate ad watching (3 seconds)
    setTimeout(() => {
      const today = getTodayKey();
      setAdData(prev => {
        const updated = { count: prev.count + 1, date: today, totalWatched: prev.totalWatched + 1 };
        saveAdData(updated);
        return updated;
      });
      if (onReward) onReward(REWARD_COINS, REWARD_XP);
    }, 2500);
    
    return true;
  }, [canWatch]);

  return { canWatch, remaining, count: adData.count, totalWatched: adData.totalWatched, watchAd };
}

export function AdRewardsPanel({ adSystem, onReward, t }) {
  const [watching, setWatching] = useState(false);
  const [justRewarded, setJustRewarded] = useState(false);

  const handleWatch = () => {
    if (watching || !adSystem.canWatch) return;
    setWatching(true);
    setJustRewarded(false);
    
    const started = adSystem.watchAd((coins, xp) => {
      setWatching(false);
      setJustRewarded(true);
      if (onReward) onReward(coins, xp);
      setTimeout(() => setJustRewarded(false), 2000);
    });
    
    if (!started) setWatching(false);
  };

  return (
    <div className="ad-panel">
      <div className="ad-header">
        <span className="ad-icon">🎬</span>
        <div>
          <div className="ad-title">{t('watchAd')}</div>
          <div className="ad-sub">{t('watchAdDesc')}</div>
        </div>
      </div>

      <div className="ad-rewards">
        <div className="ad-reward">+{REWARD_COINS} 🪙</div>
        <div className="ad-reward">+{REWARD_XP} ⭐</div>
      </div>

      <button 
        className={`ad-btn ${!adSystem.canWatch ? 'disabled' : ''} ${watching ? 'watching' : ''}`}
        onClick={handleWatch}
        disabled={!adSystem.canWatch || watching}
      >
        {watching ? (
          <>
            <span className="ad-spinner" /> {t('watching')}
          </>
        ) : justRewarded ? (
          <>✅ {t('rewarded')}</>
        ) : !adSystem.canWatch ? (
          <>{t('limitReached')}</>
        ) : (
          <>{t('watch')} ({adSystem.remaining}/{MAX_ADS_PER_DAY})</>
        )}
      </button>

      <div className="ad-progress">
        <div className="ad-bar">
          <div 
            className="ad-fill" 
            style={{ width: `${(adSystem.count / MAX_ADS_PER_DAY) * 100}%` }}
          />
        </div>
        <div className="ad-count">{adSystem.count}/{MAX_ADS_PER_DAY} {t('today')}</div>
      </div>
    </div>
  );
}
