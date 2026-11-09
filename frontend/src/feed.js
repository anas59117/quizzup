import { useState, useCallback, useRef, useEffect } from "react";
import { useI18n } from "./i18n";
export { FeedScreen } from "./FeedScreen";

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
  const { t } = useI18n();
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
          setError(t('draftSavedTimeout'));
        }, 12000);
      pendingRef.current = {
        ...pendingRef.current,
        [key]: value,
      };
      setPending(pendingRef.current);
    },
    [t],
  );
  const send = useCallback(
    (obj) => {
      if (wsRef.current?.readyState !== 1) {
        setError(t('connectionUnavailable'));
        return false;
      }
      wsRef.current.send(JSON.stringify(obj));
      return true;
    },
    [wsRef, t],
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
            setError(t('postUnavailable'));
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
        case "follow_updated":
          markPending(`follow:${data.targetId}`, false);
          setPosts((p) =>
            p.flatMap((post) => {
              if (post.authorId !== data.targetId) return [post];
              if (filterRef.current.scope === "following" && !data.isFollowing)
                return [];
              return [{ ...post, authorFollowed: !!data.isFollowing }];
            }),
          );
          if (data.reason === "blocked")
            setError(t('followingUnavailable'));
          break;
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
          setError(t('actionFailedRetry'));
          Object.values(requestTimers.current).forEach(clearTimeout);
          setLoading(false);
          pendingRef.current = {};
          setPending({});
          break;
        default:
          break;
      }
    },
    [clientId, markPending, t],
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
    followAuthor: (targetId, isFollowing) =>
      action(`follow:${targetId}`, {
        type: isFollowing ? "unfollow" : "follow",
        targetId,
      }),
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
