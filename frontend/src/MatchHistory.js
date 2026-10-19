import React, { useCallback, useState, useEffect, useRef } from "react";
import { PlayerAvatar } from "./PlayerAvatar";
import { topicLabel } from "./players";
import { useI18n } from "./i18n";
export function useMatchHistory(wsRef) {
  const { lang } = useI18n();
  const fr = lang === "fr";
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
      setError(fr ? "Connexion indisponible" : "Connection unavailable");
      return false;
    }
    setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      setError(
        fr ? "Délai dépassé. Réessaie." : "Request timed out. Please retry.",
      );
    }, 12000);
    wsRef.current.send(
      JSON.stringify({
        type: "match_history",
      }),
    );
    return true;
  }, [wsRef, fr]);
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
        setError(fr ? "Historique indisponible" : "History unavailable");
      }
    },
    [fr],
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
  const { lang } = useI18n();
  const fr = lang === "fr";
  return (
    <main className="container community-history">
      <header>
        <button onClick={onBack} aria-label={fr ? "Retour" : "Back"}>
          ←
        </button>
        <h1>{fr ? "Historique" : "Match history"}</h1>
      </header>
      {history.loading && (
        <p role="status">{fr ? "Chargement…" : "Loading…"}</p>
      )}
      {history.error && (
        <p role="alert">
          {history.error}{" "}
          <button onClick={history.refresh}>
            {fr ? "Réessayer" : "Retry"}
          </button>
        </p>
      )}
      {!history.loading && !history.error && !history.matches.length && (
        <p>
          {fr
            ? "Tes prochaines parties apparaîtront ici."
            : "Your next matches will appear here."}
        </p>
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
                win: fr ? "Victoire" : "Win",
                loss: fr ? "Défaite" : "Loss",
                tie: fr ? "Égalité" : "Tie",
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
                  {fr ? "Message / Défi" : "Message / Challenge"}
                </button>
              )}
            </div>
          ))}
        </article>
      ))}
    </main>
  );
}
