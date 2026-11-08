import { useState, useCallback } from 'react';
import { useI18n } from './i18n';

const DEFAULT_STATS = { games: 0, wins: 0, streak: 0, dayStreak: 0, bestDayStreak: 0, level: 1, coins: 0, topics: [], followers: 0, following: 0 };

// Player stats (games/wins/streak) live server-side, keyed by the verified
// QuizzUp identity. Pushed on identify (so Profile shows real numbers right
// away) and again in game_end (so a just-finished match updates immediately).
export function useStats() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const handleStatsMessage = useCallback((data) => {
    // Merge: some messages (game_end, follow updates) only carry part of it.
    if (data.stats) setStats((prev) => ({ ...prev, ...data.stats }));
  }, []);
  return { stats, handleStatsMessage };
}

export function ProfileStats({ stats }) {
  const { t } = useI18n();
  const rows = [
    [stats.games || 0, t('games')],
    [stats.wins || 0, t('wins')],
    [stats.coins || 0, t('coinBalance')],
  ];
  return (
    <>
      <dl className="profile-stats">
        {rows.map(([value, label]) => (
          <div key={label} className="pstat"><dt className="pstat-lbl">{label}</dt><dd className="pstat-val">{value}</dd></div>
        ))}
      </dl>
      {stats.streak > 0 && <p className="profile-win-streak">{t('streak')} · {stats.streak}</p>}
    </>
  );
}
