/**
 * DailyStreak — Système de streak journalier
 * Hook + Composants visuels pour le profil et l'écran de fin
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useI18n } from './i18n';

const STREAK_KEY = 'quizzup-streak';
const LAST_PLAYED_KEY = 'quizzup-last-played';
const CLAIMED_TODAY_KEY = 'quizzup-claimed-today';

// ─── Helpers ───
function getTodayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function getYesterdayStr() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// ─── Hook ───
export function useDailyStreak() {
  const [streak, setStreak] = useState(() => {
    try { return parseInt(localStorage.getItem(STREAK_KEY) || '0', 10); } catch { return 0; }
  });
  const [lastPlayed, setLastPlayed] = useState(() => {
    try { return localStorage.getItem(LAST_PLAYED_KEY) || ''; } catch { return ''; }
  });
  const [claimedToday, setClaimedToday] = useState(() => {
    try { return localStorage.getItem(CLAIMED_TODAY_KEY) === getTodayStr(); } catch { return false; }
  });

  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  // Check if streak is broken (missed a day)
  useEffect(() => {
    if (!lastPlayed) return;
    if (lastPlayed !== today && lastPlayed !== yesterday) {
      // Streak broken
      setStreak(0);
      try { localStorage.setItem(STREAK_KEY, '0'); } catch {}
    }
  }, [lastPlayed, today, yesterday]);

  const claim = useCallback(() => {
    const now = getTodayStr();
    if (claimedToday) return { streak, bonus: 0, isNew: false };

    let newStreak = streak;
    if (lastPlayed === yesterday || lastPlayed === now) {
      newStreak = streak + 1;
    } else {
      newStreak = 1;
    }

    // Bonus coins: x2 at 2 days, x3 at 7 days, x5 at 30 days
    let bonus = 0;
    if (newStreak >= 30) bonus = 5;
    else if (newStreak >= 7) bonus = 3;
    else if (newStreak >= 2) bonus = 2;
    else bonus = 1;

    try {
      localStorage.setItem(STREAK_KEY, String(newStreak));
      localStorage.setItem(LAST_PLAYED_KEY, now);
      localStorage.setItem(CLAIMED_TODAY_KEY, now);
    } catch {}

    setStreak(newStreak);
    setLastPlayed(now);
    setClaimedToday(true);

    return { streak: newStreak, bonus, isNew: true };
  }, [streak, lastPlayed, claimedToday]);

  const canClaimToday = !claimedToday;
  const isStreakAtRisk = lastPlayed === yesterday && !claimedToday;

  // Calendar data (last 7 days)
  const calendar = useMemo(() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = daysAgo(i);
      const dayName = new Date();
      dayName.setDate(dayName.getDate() - i);
      const isPlayed = d === lastPlayed || (d === today && claimedToday);
      const isToday = d === today;
      days.push({ date: d, dayLabel: dayName.toLocaleDateString(undefined, { weekday: 'narrow' }), isPlayed, isToday });
    }
    return days;
  }, [lastPlayed, today, claimedToday]);

  // Milestones
  const nextMilestone = streak < 3 ? 3 : streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : null;
  const milestoneProgress = nextMilestone ? Math.min(100, (streak / nextMilestone) * 100) : 100;

  return {
    streak,
    claimedToday,
    canClaimToday,
    isStreakAtRisk,
    calendar,
    claim,
    nextMilestone,
    milestoneProgress,
  };
}

// ─── Mini badge (affiché dans FinishedContent) ───
export function StreakBadge({ streak }) {
  if (streak < 2) return null;
  return (
    <div className="streak-badge-mini">
      <span className="streak-flame">🔥</span>
      <span className="streak-count">{streak}</span>
    </div>
  );
}

// ─── Full calendar (affiché dans Profile) ───
export function StreakCalendar({ streak, calendar, nextMilestone, milestoneProgress }) {
  const { t } = useI18n();
  return (
    <div className="streak-card">
      <div className="streak-header">
        <div className="streak-main">
          <span className="streak-flame-lg">🔥</span>
          <div>
            <div className="streak-title">{t('streakTitle')}</div>
            <div className="streak-sub">
              {streak > 0
                ? t('streakActive', { n: streak })
                : t('streakNone')}
            </div>
          </div>
        </div>
        {nextMilestone && (
          <div className="streak-milestone">
            <div className="streak-milestone-label">
              {t('streakNext', { n: nextMilestone })}
            </div>
            <div className="streak-milestone-bar">
              <div className="streak-milestone-fill" style={{ width: `${milestoneProgress}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="streak-calendar">
        {calendar.map((day, i) => (
          <div key={i} className={`streak-day ${day.isPlayed ? 'played' : ''} ${day.isToday ? 'today' : ''}`}>
            <span className="streak-day-label">{day.dayLabel}</span>
            <span className="streak-day-dot">
              {day.isPlayed ? '🔥' : day.isToday ? '○' : '·'}
            </span>
          </div>
        ))}
      </div>

      <div className="streak-rewards">
        <div className={`streak-reward ${streak >= 2 ? 'unlocked' : ''}`}>
          <span className="sr-icon">{streak >= 2 ? '✅' : '🔒'}</span>
          <span className="sr-text">{t('streakReward2')}</span>
          <span className="sr-bonus">x2</span>
        </div>
        <div className={`streak-reward ${streak >= 7 ? 'unlocked' : ''}`}>
          <span className="sr-icon">{streak >= 7 ? '✅' : '🔒'}</span>
          <span className="sr-text">{t('streakReward7')}</span>
          <span className="sr-bonus">x3</span>
        </div>
        <div className={`streak-reward ${streak >= 30 ? 'unlocked' : ''}`}>
          <span className="sr-icon">{streak >= 30 ? '✅' : '🔒'}</span>
          <span className="sr-text">{t('streakReward30')}</span>
          <span className="sr-bonus">x5</span>
        </div>
      </div>
    </div>
  );
}
