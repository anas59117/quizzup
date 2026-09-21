import { useState, useCallback } from 'react';
import { useI18n } from './i18n';

const DEFAULT_STATS = { games: 0, wins: 0, streak: 0, level: 1, coins: 0 };

// Player stats (games/wins/streak) live server-side, keyed by the verified
// QuizzUp identity. Pushed on identify (so Profile shows real numbers right
// away) and again in game_end (so a just-finished match updates immediately).
export function useStats() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const handleStatsMessage = useCallback((data) => {
    if (data.stats) setStats(data.stats);
  }, []);
  return { stats, handleStatsMessage };
}

export function ProfileStats({ stats }) {
  const { t } = useI18n();
  const rows = [
    [stats.level, t('level')],
    [stats.games, t('games')],
    [stats.wins, t('wins')],
    [stats.streak, t('streak')],
    [stats.coins || 0, t('coinBalance')],
  ];
  return (
    <div className="profile-stats">
      {rows.map(([v, l]) => (
        <div key={l} className="pstat"><div className="pstat-val">{v}</div><div className="pstat-lbl">{l}</div></div>
      ))}
    </div>
  );
}
