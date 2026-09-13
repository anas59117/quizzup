import { useState, useCallback } from 'react';

const DEFAULT_STATS = { games: 0, wins: 0, streak: 0, level: 1 };

// Player stats (games/wins/streak) live server-side, keyed by the Firebase
// uid. Pushed on identify (so Profile shows real numbers right away) and
// again in game_end (so a just-finished match updates immediately).
export function useStats() {
  const [stats, setStats] = useState(DEFAULT_STATS);
  const handleStatsMessage = useCallback((data) => {
    if (data.stats) setStats(data.stats);
  }, []);
  return { stats, handleStatsMessage };
}

export function ProfileStats({ stats }) {
  const rows = [[stats.level, 'Level'], [stats.games, 'Games'], [stats.wins, 'Wins'], [stats.streak, 'Streak']];
  return (
    <div className="profile-stats">
      {rows.map(([v, l]) => (
        <div key={l} className="pstat"><div className="pstat-val">{v}</div><div className="pstat-lbl">{l}</div></div>
      ))}
    </div>
  );
}
