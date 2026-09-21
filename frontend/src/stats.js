import { useState, useCallback } from 'react';
import { useI18n } from './i18n';
import { CATEGORIES } from './ui';

const DEFAULT_STATS = { games: 0, wins: 0, streak: 0, level: 1, coins: 0, recent: [] };

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


function relativeMatchTime(playedAt, lang) {
  const timestamp = Number(playedAt);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return '';
  const deltaSeconds = Math.round((timestamp - Date.now()) / 1000);
  const abs = Math.abs(deltaSeconds);
  const formatter = new Intl.RelativeTimeFormat(lang === 'en' ? 'en' : 'fr', { numeric: 'auto' });

  if (abs < 60) return formatter.format(deltaSeconds, 'second');
  if (abs < 3600) return formatter.format(Math.round(deltaSeconds / 60), 'minute');
  if (abs < 86400) return formatter.format(Math.round(deltaSeconds / 3600), 'hour');
  if (abs < 86400 * 30) return formatter.format(Math.round(deltaSeconds / 86400), 'day');

  return new Intl.DateTimeFormat(lang === 'en' ? 'en' : 'fr', {
    day: 'numeric',
    month: 'short',
  }).format(new Date(timestamp));
}

export function RecentMatches({ matches }) {
  const { t, lang } = useI18n();
  const recent = Array.isArray(matches) ? matches.slice(0, 5) : [];

  if (!recent.length) {
    return (
      <section className="recent-matches" aria-labelledby="recent-matches-title">
        <div className="friends-section-title" id="recent-matches-title">{t('recentMatches')}</div>
        <div className="recent-empty">{t('noRecentMatches')}</div>
      </section>
    );
  }

  return (
    <section className="recent-matches" aria-labelledby="recent-matches-title">
      <div className="friends-section-title" id="recent-matches-title">{t('recentMatches')}</div>
      <div className="recent-match-list">
        {recent.map((match, index) => {
          const category = CATEGORIES.find((item) => item.key === match.categoryKey);
          const categoryLabel = category?.label || match.categoryKey || t('randomTopic');
          const opponent = match.opponents?.[0];
          const extraOpponents = Math.max(0, (match.opponents?.length || 0) - 1);
          const timeLabel = relativeMatchTime(match.playedAt, lang);
          const outcomeLabel = match.leftEarly
            ? t('matchAbandoned')
            : match.outcome === 'win'
              ? t('matchWin')
              : match.outcome === 'loss'
                ? t('matchLoss')
                : match.outcome === 'tie'
                  ? t('matchDraw')
                  : t('matchSolo');

          return (
            <div className={`recent-match recent-${match.outcome}`} key={`${match.playedAt || 0}-${index}`}>
              <div className="recent-outcome" aria-label={outcomeLabel}>
                <span>{outcomeLabel.slice(0, 1)}</span>
              </div>
              <div className="recent-copy">
                <div className="recent-title">
                  <strong>{categoryLabel}</strong>
                  <span className={`recent-result result-${match.outcome}`}>{outcomeLabel}</span>
                </div>
                <div className="recent-meta">
                  {match.mode === 'solo'
                    ? t('soloRun')
                    : opponent
                      ? t('versusPlayer', {
                        name: opponent.name,
                        extra: extraOpponents ? ` +${extraOpponents}` : '',
                      })
                      : t('multiplayer')}
                  {timeLabel && <span aria-hidden="true"> · {timeLabel}</span>}
                </div>
              </div>
              <div className="recent-score">
                <strong>{match.score}</strong>
                <small>{match.xp ? `+${match.xp} XP` : 'XP'}</small>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
