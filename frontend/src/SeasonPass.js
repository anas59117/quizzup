/**
 * SeasonPass — Battle Pass avec niveaux gratuits et premium
 */
import React, { useState, useEffect, useCallback } from 'react';

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

export function SeasonPassPanel({ pass, onClaim, t }) {
  return (
    <div className="season-pass">
      <div className="sp-header">
        <div>
          <div className="sp-title">{t('seasonPass')}</div>
          <div className="sp-sub">{t('season')} — {t('level')} {pass.currentLevel}/10</div>
        </div>
        {!pass.premium && (
          <button className="sp-buy" onClick={pass.buyPremium}>
            💎 {t('buyPremium')}
          </button>
        )}
        {pass.premium && <div className="sp-premium-badge">💎 PREMIUM</div>}
      </div>

      <div className="sp-progress-wrap">
        <div className="sp-progress-bar">
          <div className="sp-progress-fill" style={{ width: `${pass.levelProgress}%` }} />
        </div>
        <div className="sp-xp">{pass.xp % 500}/500 XP</div>
      </div>

      <div className="sp-levels">
        {PASS_LEVELS.map(lvl => {
          const isClaimed = pass.claimed.includes(lvl.level);
          const isUnlocked = pass.currentLevel >= lvl.level;
          return (
            <div key={lvl.level} className={`sp-level ${isUnlocked ? 'unlocked' : ''} ${isClaimed ? 'claimed' : ''}`}>
              <div className="sp-lvl-num">{lvl.level}</div>
              
              <div className="sp-rewards-row">
                <div className="sp-free-reward">
                  <span className="sp-tag free">FREE</span>
                  <div className="sp-reward-items">
                    {lvl.free.coins && <span>+{lvl.free.coins}🪙</span>}
                    {lvl.free.xp && <span>+{lvl.free.xp}⭐</span>}
                  </div>
                  {isUnlocked && !isClaimed && (
                    <button className="sp-claim" onClick={() => onClaim(lvl.level)}>{t('claim')}</button>
                  )}
                  {isClaimed && <span className="sp-checked">✅</span>}
                </div>

                <div className={`sp-premium-reward ${pass.premium ? '' : 'locked'}`}>
                  <span className="sp-tag premium">PREMIUM</span>
                  <div className="sp-reward-items">
                    {lvl.premium.coins && <span>+{lvl.premium.coins}🪙</span>}
                    {lvl.premium.xp && <span>+{lvl.premium.xp}⭐</span>}
                    {lvl.premium.item && <span className="sp-item">{lvl.premium.item}</span>}
                  </div>
                  {pass.premium && isUnlocked && !isClaimed && (
                    <button className="sp-claim premium" onClick={() => onClaim(lvl.level)}>{t('claim')}</button>
                  )}
                  {pass.premium && isClaimed && <span className="sp-checked">✅</span>}
                  {!pass.premium && <span className="sp-lock">🔒</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
