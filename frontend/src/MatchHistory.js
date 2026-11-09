import React, { useCallback, useState, useEffect, useRef } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import { topicLabel } from "./players";
import { useI18n } from "./i18n";
export function useMatchHistory(wsRef) {
  const { t } = useI18n();
  const timer = useRef();
  useEffect(() => () => clearTimeout(timer.current), []);
  const [matches, setMatches] = useState([]),
    [loading, setLoading] = useState(false),
    [error, setError] = useState("");
  const refresh = useCallback(() => {
    clearTimeout(timer.current);
    setError("");
    if (wsRef.current?.readyState !== 1) {
      setLoading(false);
      setError(t('connectionUnavailable'));
      return false;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      setError(t('requestTimeout'));
    }, 12000);
    wsRef.current.send(
      JSON.stringify({
        type: "match_history",
      }),
    );
    return true;
  }, [wsRef, t]);
  const handleMessage = useCallback(
    (data) => {
      if (data.type === "match_history") {
        clearTimeout(timer.current);
        setMatches(data.matches || []);
        setLoading(false);
        setError("");
      }
      if (data.type === "social_error" && data.action === "match_history") {
        setLoading(false);
        clearTimeout(timer.current);
        setError(t('historyUnavailable'));
      }
    },
    [t],
  );
  return {
    matches,
    loading,
    error,
    refresh,
    handleMessage,
  };
}
export function MatchHistory({
  history,
  onBack,
  onOpenPlayer,
  onMessage,
  friends = [],
}) {
  const { t, lang } = useI18n();
  return (
    <main id="main-content" tabIndex={-1} aria-labelledby="history-title" className="container community-history">
      <header>
        <button onClick={onBack} aria-label={t('back')}>
          ←
        </button>
        <h1 id="history-title" tabIndex={-1}>{t('matchHistoryTitle')}</h1>
      </header>
      {history.loading && (
        <p role="status">{t('loadingDots')}</p>
      )}
      {history.error && (
        <p role="alert">
          {history.error}{" "}
          <button onClick={history.refresh}>
            {t('retryLabel')}
          </button>
        </p>
      )}
      {!history.loading && !history.error && !history.matches.length && (
        <p>{t('noMatchesYet')}</p>
      )}
      {history.matches.map((m) => (
        <article className="history-card" key={m.id}>
          <div>
            <strong>{topicLabel(m.category)}</strong>
            <time>{new Date(m.createdAt).toLocaleDateString(lang)}</time>
          </div>
          <b>
            {m.score} · {m.opponentScore ?? "—"}
          </b>
          <span>
            {
              {
                win: t('resultWinShort'),
                loss: t('resultLossShort'),
                tie: t('resultTieShort'),
                solo: "Solo",
              }[m.outcome]
            }
          </span>
          {(m.opponents || []).map((o) => (
            <div className="history-peer" key={o.id}>
              <button onClick={() => onOpenPlayer(o.id)}>
                <PlayerAvatar avatar={o.avatar} />
                {o.name}
              </button>
              {friends.some((f) => f.id === o.id) && (
                <button onClick={() => onMessage(o.id)}>
                  {t('messageChallenge')}
                </button>
              )}
            </div>
          ))}
        </article>
      ))}
    </main>
  );
}
