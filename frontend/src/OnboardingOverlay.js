/**
 * OnboardingOverlay — Tutoriel interactif premier lancement
 * S'affiche uniquement si localStorage 'quizzup-onboarded' n'est pas '1'
 * 3 étapes : Pseudo → Tutoriel rapide → C'est parti
 */
import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from './i18n';
import SFX from './sounds';

const ONBOARDING_KEY = 'quizzup-onboarded';
const ONBOARDING_NAME_KEY = 'quizzup-name';

function useLocalStorage(key, initial) {
  const [value, setValue] = useState(() => {
    try { return localStorage.getItem(key) || initial; } catch { return initial; }
  });
  const set = (v) => { try { localStorage.setItem(key, v); } catch {} setValue(v); };
  return [value, set];
}

export function useOnboarding() {
  const [done, setDone] = useLocalStorage(ONBOARDING_KEY, '');
  const isFirstTime = done !== '1';
  const markDone = () => setDone('1');
  return { isFirstTime, markDone };
}

export function OnboardingOverlay({ onComplete, defaultName }) {
  const { t } = useI18n();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(defaultName.replace(/^Joueur\d+/, ''));
  const [demoScore, setDemoScore] = useState(0);
  const [demoFlash, setDemoFlash] = useState(false);
  const [demoCombo, setDemoCombo] = useState(0);
  const demoTimerRef = useRef(null);

  const totalSteps = 3;

  // Step 1: validate name
  const canProceedName = name.trim().length >= 2 && name.trim().length <= 20;

  // Step 2: mini demo
  useEffect(() => {
    if (step !== 1) return;
    let score = 0;
    let combo = 0;
    const runDemo = () => {
      combo += 1;
      const points = combo >= 3 ? 15 : 9;
      score += points;
      setDemoScore(score);
      setDemoCombo(combo);
      setDemoFlash(true);
      SFX.select();
      setTimeout(() => setDemoFlash(false), 400);
    };
    demoTimerRef.current = setInterval(runDemo, 1200);
    return () => clearInterval(demoTimerRef.current);
  }, [step]);

  const handleFinish = () => {
    if (canProceedName) {
      try { localStorage.setItem(ONBOARDING_NAME_KEY, name.trim()); } catch {}
    }
    SFX.gameStart?.() || SFX.correct();
    onComplete(name.trim() || defaultName);
  };

  const handleNext = () => {
    SFX.select();
    if (step === 0 && !canProceedName) return;
    setStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const handleBack = () => {
    SFX.select();
    setStep((s) => Math.max(s - 1, 0));
  };

  // Progress dots
  const dots = (
    <div className="onb-dots">
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} className={`onb-dot ${i === step ? 'active' : ''}`} />
      ))}
    </div>
  );

  return (
    <div className="onb-overlay">
      <div className="onb-card">
        {/* STEP 0 — Choose name */}
        {step === 0 && (
          <>
            <div className="onb-brand">
              <div className="onb-brandmark">Q</div>
              <h2 className="onb-title">QuizzUp</h2>
            </div>
            <p className="onb-desc">{t('onbWelcome')}</p>
            <div className="onb-input-wrap">
              <label className="onb-label">{t('onbChooseName')}</label>
              <input
                className="onb-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('onbNamePlaceholder')}
                maxLength={20}
                autoFocus
              />
              <span className="onb-hint">{t('onbNameHint')}</span>
            </div>
            {dots}
            <button className="onb-btn primary" onClick={handleNext} disabled={!canProceedName}>
              {t('onbNext')}
            </button>
          </>
        )}

        {/* STEP 1 — Quick tutorial */}
        {step === 1 && (
          <>
            <div className="onb-step-icon">⚡</div>
            <h3 className="onb-step-title">{t('onbSpeedTitle')}</h3>
            <p className="onb-desc">{t('onbSpeedDesc')}</p>

            {/* Mini demo */}
            <div className={`onb-demo-box ${demoFlash ? 'flash' : ''}`}>
              <div className="onb-demo-question">{t('onbDemoQuestion')}</div>
              <div className="onb-demo-answers">
                <div className="onb-demo-ans correct">{t('onbDemoAns1')}</div>
                <div className="onb-demo-ans">{t('onbDemoAns2')}</div>
              </div>
              <div className="onb-demo-hud">
                <span className="onb-demo-score">{demoScore} pts</span>
                {demoCombo >= 3 && <span className="onb-demo-combo">x{Math.min(demoCombo - 1, 3)} COMBO</span>}
              </div>
            </div>

            <p className="onb-tip">💡 {t('onbTip')}</p>
            {dots}
            <div className="onb-row">
              <button className="onb-btn secondary" onClick={handleBack}>{t('onbBack')}</button>
              <button className="onb-btn primary" onClick={handleNext}>{t('onbNext')}</button>
            </div>
          </>
        )}

        {/* STEP 2 — Ready */}
        {step === 2 && (
          <>
            <div className="onb-step-icon onb-rocket">🚀</div>
            <h3 className="onb-step-title">{t('onbReadyTitle')}</h3>
            <p className="onb-desc">{t('onbReadyDesc', { name: name.trim() || defaultName })}</p>
            <div className="onb-features">
              <div className="onb-feat">🏆 <span>{t('onbFeat1')}</span></div>
              <div className="onb-feat">🔥 <span>{t('onbFeat2')}</span></div>
              <div className="onb-feat">⚔️ <span>{t('onbFeat3')}</span></div>
            </div>
            {dots}
            <button className="onb-btn primary large" onClick={handleFinish}>
              {t('onbPlayFirst')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
