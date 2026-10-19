import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { CATEGORIES } from "./ui";
import { useI18n } from "./i18n";
import { topicLabel } from "./players";
import { PlayerAvatar } from "./PlayerAvatar";
import {
  communityMediaUrl,
  uploadCommunityPhoto,
  shareCommunityPost,
} from "./community-media";
export function useFeed(wsRef, clientId) {
  const [posts, setPosts] = useState([]),
    [reportedIds, setReportedIds] = useState(() => new Set()),
    [filter, setFilterState] = useState({
      scope: "all",
      category: null,
    }),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [pending, setPending] = useState({}),
    [comments, setComments] = useState({}),
    [answers, setAnswers] = useState({}),
    [createdVersion, setCreatedVersion] = useState(0);
  const { lang } = useI18n();
  const fr = lang === "fr";
  const requestTimers = useRef({});
  const sharedRequest = useRef(null);
  const filterRef = useRef(filter),
    pendingRef = useRef({});
  useEffect(
    () => () => Object.values(requestTimers.current).forEach(clearTimeout),
    [],
  );
  const markPending = useCallback(
    (key, value) => {
      clearTimeout(requestTimers.current[key]);
      if (value)
        requestTimers.current[key] = setTimeout(() => {
          pendingRef.current = {
            ...pendingRef.current,
            [key]: false,
          };
          setPending(pendingRef.current);
          setLoading(false);
          setError(
            fr
              ? "Délai dépassé. Réessaie, ton brouillon est conservé."
              : "Request timed out. Retry; your draft is saved.",
          );
        }, 12000);
      pendingRef.current = {
        ...pendingRef.current,
        [key]: value,
      };
      setPending(pendingRef.current);
    },
    [fr],
  );
  const send = useCallback(
    (obj) => {
      if (wsRef.current?.readyState !== 1) {
        setError(fr ? "Connexion indisponible" : "Connection unavailable");
        return false;
      }
      wsRef.current.send(JSON.stringify(obj));
      return true;
    },
    [wsRef, fr],
  );
  const refresh = useCallback(() => {
    const f = filterRef.current;
    setLoading(true);
    markPending("list", true);
    setError("");
    if (
      !send({
        type: "feed_list",
        scope: f.scope,
        category: f.category || undefined,
      })
    )
      setLoading(false);
  }, [send, markPending]);
  const handleMessage = useCallback(
    (data) => {
      switch (data.type) {
        case "feed_list": {
          const f = filterRef.current;
          if (
            (data.category || null) !== f.category ||
            (data.scope || "all") !== f.scope
          )
            return;
          setPosts(data.posts || []);
          markPending("list", false);
          setLoading(false);
          break;
        }
        case "post_detail": {
          if (data.postId !== sharedRequest.current) return;
          markPending("shared", false);
          if (data.post) {
            setPosts((previous) => [
              data.post,
              ...previous.filter((post) => post.id !== data.post.id),
            ]);
            setTimeout(
              () =>
                document
                  .getElementById(`post-${data.post.id}`)
                  ?.scrollIntoView({ block: "center" }),
              80,
            );
          } else
            setError(
              fr
                ? "Cette publication est indisponible."
                : "This post is unavailable.",
            );
          break;
        }
        case "post_created": {
          if (!data.post) return;
          if (data.post.authorId === clientId && pendingRef.current.create) {
            markPending("create", false);
            setCreatedVersion((v) => v + 1);
          }
          const f = filterRef.current;
          if (
            f.scope === "following" ||
            (f.category && data.post.category !== f.category)
          )
            break;
          setPosts((p) =>
            p.some((x) => x.id === data.post.id) ? p : [data.post, ...p],
          );
          break;
        }
        case "post_reacted":
          markPending(`react:${data.id}`, false);
          setPosts((p) =>
            p.map((x) =>
              x.id === data.id
                ? {
                    ...x,
                    reactions: data.reactions,
                    reacted:
                      data.actorId === clientId ? data.reacted : x.reacted,
                  }
                : x,
            ),
          );
          break;
        case "post_report_ack":
          setReportedIds((p) => new Set(p).add(data.id));
          break;
        case "post_hidden":
          setPosts((p) => p.filter((x) => x.id !== data.id));
          break;
        case "post_comments":
          markPending(`comments:${data.postId}`, false);
          setComments((p) => ({
            ...p,
            [data.postId]: data.comments || [],
          }));
          break;
        case "post_commented":
          if (data.comment.authorId === clientId)
            markPending(`comment:${data.postId}`, false);
          setComments((p) => ({
            ...p,
            [data.postId]: [
              ...(p[data.postId] || []).filter((x) => x.id !== data.comment.id),
              data.comment,
            ],
          }));
          setPosts((p) =>
            p.map((x) =>
              x.id === data.postId
                ? {
                    ...x,
                    commentsCount: data.commentsCount,
                  }
                : x,
            ),
          );
          break;
        case "post_question_result":
          markPending(`answer:${data.postId}`, false);
          setAnswers((p) => ({
            ...p,
            [data.postId]: data,
          }));
          break;
        case "community_error":
          setError(
            fr
              ? "Action impossible. Réessaie, ton brouillon est conservé."
              : "Unable to complete. Retry; your draft is saved.",
          );
          Object.values(requestTimers.current).forEach(clearTimeout);
          setLoading(false);
          pendingRef.current = {};
          setPending({});
          break;
        default:
          break;
      }
    },
    [clientId, markPending, fr],
  );
  const setFilter = useCallback(
    (next) => {
      const f = {
        scope: next.scope === "following" ? "following" : "all",
        category: next.category || null,
      };
      filterRef.current = f;
      setFilterState(f);
      setPosts([]);
      refresh();
    },
    [refresh],
  );
  const action = useCallback(
    (key, obj) => {
      if (pendingRef.current[key]) return false;
      if (!send(obj)) return false;
      markPending(key, true);
      setError("");
      return true;
    },
    [send, markPending],
  );
  const createPost = useCallback(
    (category, text, extra = {}) =>
      action("create", {
        type: "post_create",
        category,
        text: text.trim(),
        ...extra,
      }),
    [action],
  );
  const openPost = useCallback(
    (postId) => {
      sharedRequest.current = postId;
      markPending("shared", true);
      send({ type: "post_get", postId });
    },
    [markPending, send],
  );
  return {
    openPost,
    clientId,
    posts,
    reportedIds,
    filter,
    setFilter,
    handleMessage,
    createPost,
    refresh,
    loading,
    error,
    pending,
    comments,
    answers,
    createdVersion,
    react: (id) =>
      action(`react:${id}`, {
        type: "post_react",
        postId: id,
      }),
    report: (id) =>
      send({
        type: "post_report",
        postId: id,
      }),
    loadComments: (id) =>
      action(`comments:${id}`, {
        type: "post_comments",
        postId: id,
      }),
    comment: (id, text) =>
      action(`comment:${id}`, {
        type: "post_comment",
        postId: id,
        text,
      }),
    answer: (id, answerIndex) =>
      action(`answer:${id}`, {
        type: "post_question_answer",
        postId: id,
        answerIndex,
      }),
  };
}
function CommunityPost({ post: p, feed, onOpenPlayer, onPlayTopic, fr }) {
  const [open, setOpen] = useState(false),
    [draft, setDraft] = useState(""),
    [notice, setNotice] = useState("");
  const result = feed.answers[p.id];
  const media = communityMediaUrl(p.mediaUrl);
  const submitted = useRef(null);
  useEffect(() => {
    if (
      submitted.current &&
      (feed.comments[p.id] || []).some(
        (c) => c.text === submitted.current && c.authorId === feed.clientId,
      )
    ) {
      setDraft("");
      submitted.current = null;
    }
  }, [feed.comments, p.id, feed.clientId]);
  const submit = (e) => {
    e.preventDefault();
    if (feed.comment(p.id, draft.trim())) submitted.current = draft.trim();
  };
  return (
    <article className="feed-post" id={`post-${p.id}`}>
      <div className="feed-post-ava">
        <PlayerAvatar avatar={p.authorAvatar} />
      </div>
      <div className="feed-post-body">
        <header className="feed-post-head">
          <button
            className="feed-post-author as-link"
            onClick={() => onOpenPlayer?.(p.authorId)}
          >
            {p.authorName}
          </button>
          <time>
            {new Date(p.createdAt).toLocaleDateString(fr ? "fr" : "en")}
          </time>
        </header>
        <button
          className="as-link"
          onClick={() =>
            feed.setFilter({
              scope: "all",
              category: p.category,
            })
          }
        >
          {topicLabel(p.category)}
        </button>
        <p className="feed-post-text">{p.text}</p>
        {media && (
          <img
            className="community-photo"
            src={media}
            alt={fr ? "Photo de la publication" : "Post photo"}
            loading="lazy"
          />
        )}
        {p.question && (
          <fieldset className="community-question">
            <legend>{p.question.prompt}</legend>
            {p.question.answers.map((a, i) => (
              <button
                key={i}
                disabled={!!result || feed.pending[`answer:${p.id}`]}
                aria-pressed={result?.answerIndex === i}
                className={result?.correctIndex === i ? "correct" : ""}
                onClick={() => feed.answer(p.id, i)}
              >
                {a}
              </button>
            ))}
            {result && (
              <p role="status">
                {result.correct
                  ? fr
                    ? "Bonne réponse !"
                    : "Correct!"
                  : (fr ? "Bonne réponse : " : "Correct answer: ") +
                    p.question.answers[result.correctIndex]}
              </p>
            )}
          </fieldset>
        )}
        <div className="feed-post-actions">
          <button
            aria-pressed={!!p.reacted}
            aria-label={fr ? "Réagir" : "React"}
            disabled={feed.pending[`react:${p.id}`]}
            onClick={() => feed.react(p.id)}
          >
            ⚡ {p.reactions}
          </button>
          <button
            onClick={() => {
              if (!open) feed.loadComments(p.id);
              setOpen((v) => !v);
            }}
            aria-expanded={open}
          >
            {p.commentsCount || 0} {fr ? "Commentaires" : "Comments"}
          </button>
          <button
            onClick={async () => {
              try {
                const r = await shareCommunityPost(p);
                setNotice(
                  r === "copied" ? (fr ? "Lien copié" : "Link copied") : "",
                );
              } catch {
                setNotice(fr ? "Partage indisponible" : "Sharing unavailable");
              }
            }}
          >
            {fr ? "Partager" : "Share"}
          </button>
          <button onClick={() => onPlayTopic(p.category)}>
            {fr ? "Jouer" : "Play"}
          </button>
          <button
            disabled={feed.reportedIds.has(p.id)}
            onClick={() => feed.report(p.id)}
          >
            {feed.reportedIds.has(p.id)
              ? fr
                ? "Signalé"
                : "Reported"
              : fr
                ? "Signaler"
                : "Report"}
          </button>
        </div>
        {notice && <p role="status">{notice}</p>}
        {open && (
          <section className="community-comments">
            {feed.pending[`comments:${p.id}`] && <p role="status">…</p>}
            {(feed.comments[p.id] || []).map((c) => (
              <p key={c.id}>
                <button
                  className="as-link"
                  onClick={() => onOpenPlayer?.(c.authorId)}
                >
                  {c.authorName}
                </button>{" "}
                {c.text}
              </p>
            ))}
            <form onSubmit={submit}>
              <input
                aria-label={fr ? "Ton commentaire" : "Your comment"}
                value={draft}
                maxLength={240}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button
                disabled={!draft.trim() || feed.pending[`comment:${p.id}`]}
              >
                {fr ? "Envoyer" : "Send"}
              </button>
            </form>
          </section>
        )}
      </div>
    </article>
  );
}
export function FeedScreen({
  feed,
  myTopics = [],
  onPlayTopic,
  onOpenTopicLeaderboard,
  onOpenPlayer,
}) {
  const { lang } = useI18n();
  const fr = lang === "fr";
  const [category, setCategory] = useState(
      feed.filter.category || CATEGORIES[0].key,
    ),
    [draft, setDraft] = useState(""),
    [mode, setMode] = useState("text"),
    [file, setFile] = useState(null),
    [prompt, setPrompt] = useState(""),
    [options, setOptions] = useState(["", "", "", ""]),
    [correct, setCorrect] = useState(0),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState("");
  const sorted = useMemo(
    () => [...CATEGORIES].sort((a, b) => a.label.localeCompare(b.label, lang)),
    [lang],
  );
  useEffect(() => {
    if (feed.filter.category) setCategory(feed.filter.category);
  }, [feed.filter.category]);
  const previousVersion = useRef(feed.createdVersion);
  useEffect(() => {
    if (previousVersion.current !== feed.createdVersion) {
      previousVersion.current = feed.createdVersion;
      setDraft("");
      setFile(null);
      setPrompt("");
      setOptions(["", "", "", ""]);
      setMode("text");
    }
  }, [feed.createdVersion]);
  const submit = async (e) => {
    e.preventDefault();
    if (uploading || feed.pending.create) return;
    setError("");
    setUploading(true);
    try {
      const extra = {};
      if (mode === "image") {
        if (!file) throw new Error(fr ? "Choisis une photo" : "Choose a photo");
        extra.mediaUrl = await uploadCommunityPhoto(file);
      }
      if (mode === "question") {
        if (!prompt.trim() || options.some((a) => !a.trim()))
          throw new Error(
            fr
              ? "Complète la question et les quatre réponses"
              : "Complete the question and four answers",
          );
        extra.question = {
          prompt: prompt.trim(),
          answers: options.map((a) => a.trim()),
          correctIndex: correct,
        };
      }
      feed.createPost(category, draft, extra);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };
  return (
    <div className="feed-screen community-screen">
      <div className="feed-filters">
        <div className="feed-tabs">
          <button
            aria-pressed={feed.filter.scope === "all"}
            onClick={() =>
              feed.setFilter({
                scope: "all",
              })
            }
          >
            {fr ? "Tout" : "All"}
          </button>
          <button
            aria-pressed={feed.filter.scope === "following"}
            onClick={() =>
              feed.setFilter({
                scope: "following",
              })
            }
          >
            {fr ? "Abonnements" : "Following"}
          </button>
        </div>
        <select
          aria-label={fr ? "Filtrer par thème" : "Filter by theme"}
          value={feed.filter.category || ""}
          onChange={(e) =>
            feed.setFilter({
              scope: "all",
              category: e.target.value || null,
            })
          }
        >
          <option value="">{fr ? "Tous les thèmes" : "All themes"}</option>
          {sorted.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
      </div>
      {feed.filter.category && (
        <div className="topic-header">
          <h2>{topicLabel(feed.filter.category)}</h2>
          <button onClick={() => onPlayTopic(feed.filter.category)}>
            {fr ? "Jouer" : "Play"}
          </button>
          <button onClick={() => onOpenTopicLeaderboard(feed.filter.category)}>
            {fr ? "Classement" : "Ranking"}
          </button>
        </div>
      )}
      <form className="community-composer" onSubmit={submit}>
        <select
          aria-label={fr ? "Thème de la publication" : "Post theme"}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {sorted.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <div className="community-modes">
          {["text", "image", "question"].map((m) => (
            <button
              type="button"
              aria-pressed={mode === m}
              key={m}
              disabled={feed.pending.create || uploading}
              onClick={() => setMode(m)}
            >
              {
                {
                  text: fr ? "Texte" : "Text",
                  image: "Photo",
                  question: "Question",
                }[m]
              }
            </button>
          ))}
        </div>
        <textarea
          aria-label={fr ? "Ta publication" : "Your post"}
          placeholder={fr ? "Quoi de neuf ?" : "What’s new?"}
          value={draft}
          maxLength={240}
          disabled={feed.pending.create || uploading}
          onChange={(e) => setDraft(e.target.value)}
        />
        {mode === "image" && (
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            aria-label="Photo"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={uploading || feed.pending.create}
          />
        )}
        {mode === "question" && (
          <div className="community-question-editor">
            <input
              placeholder={fr ? "Écris ta question" : "Write your question"}
              aria-label="Question"
              value={prompt}
              maxLength={240}
              onChange={(e) => setPrompt(e.target.value)}
            />
            {options.map((a, i) => (
              <label key={i}>
                <input
                  type="radio"
                  name="correct"
                  checked={correct === i}
                  onChange={() => setCorrect(i)}
                  aria-label={`${fr ? "Bonne réponse" : "Correct answer"} ${i + 1}`}
                />
                <input
                  placeholder={`${fr ? "Réponse" : "Answer"} ${i + 1}`}
                  aria-label={`${fr ? "Réponse" : "Answer"} ${i + 1}`}
                  value={a}
                  maxLength={100}
                  onChange={(e) =>
                    setOptions((p) =>
                      p.map((v, j) => (j === i ? e.target.value : v)),
                    )
                  }
                />
              </label>
            ))}
          </div>
        )}
        <button
          className="feed-post-btn"
          disabled={!draft.trim() || uploading || feed.pending.create}
        >
          {uploading || feed.pending.create ? "…" : fr ? "Publier" : "Post"}
        </button>
      </form>
      {(error || feed.error) && (
        <p role="alert">
          {error || feed.error}{" "}
          <button onClick={feed.refresh}>{fr ? "Réessayer" : "Retry"}</button>
        </p>
      )}
      {feed.loading && <p role="status">{fr ? "Chargement…" : "Loading…"}</p>}
      {!feed.loading && !feed.posts.length && (
        <div className="friends-empty">
          {fr
            ? "Aucune publication ici. Lance la conversation !"
            : "No posts yet. Start the conversation!"}
        </div>
      )}
      {feed.posts.map((p) => (
        <CommunityPost
          key={p.id}
          post={p}
          feed={feed}
          onOpenPlayer={onOpenPlayer}
          onPlayTopic={onPlayTopic}
          fr={fr}
        />
      ))}
    </div>
  );
}
