import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CommunityComposer } from "./CommunityComposer";
import { PlayerAvatar } from "./PlayerAvatar";
import { communityMediaUrl, shareCommunityPost } from "./community-media";
import { useI18n } from "./i18n";
import { topicLabel } from "./players";
import { getTopicCover } from "./topicCovers";
import { localizedTopicTitle } from "./topicTitles";
import { CATEGORIES, Icon } from "./ui";

const topics = new Map(CATEGORIES.map((topic) => [topic.key, topic]));
const suggestions = ["star_wars", "equipe_de_france_football", "euphoria"];
const titleFor = (key, lang) => topics.has(key) ? localizedTopicTitle(topics.get(key), lang) : topicLabel(key);
const formatDate = (value, lang) => {
  const date = new Date(value);
  const age = Math.max(0, Math.floor((Date.now() - date.getTime()) / 60000));
  if (age < 1440) {
    const time = new Intl.RelativeTimeFormat(lang, { numeric: "auto", style: "short" });
    return age < 60 ? time.format(-age, "minute") : time.format(-Math.floor(age / 60), "hour");
  }
  return date.toLocaleDateString(lang, { day: "numeric", month: "short" });
};

function Quiz({ post, feed, fr }) {
  const [expanded, setExpanded] = useState(false);
  const result = feed.answers[post.id];
  const { prompt, answers } = post.question;
  return (
    <div className="community-quiz">
      <p className="community-quiz-title"><Icon name="bolt" /> {fr ? "Mini-quiz" : "Quick quiz"}</p>
      {expanded || result ? (
        <fieldset className="community-question">
          <legend>{prompt}</legend>
          <div className="community-answers">
            {answers.map((answer, index) => (
              <button key={index} type="button" disabled={!!result || feed.pending[`answer:${post.id}`]}
                aria-pressed={result?.answerIndex === index}
                className={result?.correctIndex === index ? "correct" : result?.answerIndex === index ? "incorrect" : ""}
                onClick={() => feed.answer(post.id, index)}>{answer}</button>
            ))}
          </div>
          {result && <p role="status">{result.correct
            ? fr ? "Bonne réponse !" : "Correct!"
            : (fr ? "Bonne réponse : " : "Correct answer: ") + answers[result.correctIndex]}</p>}
        </fieldset>
      ) : (
        <button className="community-quiz-open" type="button" onClick={() => setExpanded(true)}>
          <span>{prompt}</span><span>{fr ? "Répondre" : "Answer"} <Icon name="arrow" /></span>
        </button>
      )}
    </div>
  );
}

function CommunityPost({ post, feed, lang, onOpenPlayer, onPlayTopic, onTopic, onThread }) {
  const fr = lang === "fr";
  const [notice, setNotice] = useState("");
  const photo = communityMediaUrl(post.mediaUrl);
  const reported = feed.reportedIds.has(post.id);
  const comments = post.commentsCount || 0;
  const likes = post.reactions || 0;
  const share = async () => {
    try {
      const result = await shareCommunityPost(post);
      setNotice(result === "copied" ? (fr ? "Lien copié" : "Link copied") : "");
    } catch {
      setNotice(fr ? "Partage indisponible" : "Sharing unavailable");
    }
  };
  return (
    <article className="community-post feed-post" id={`post-${post.id}`}>
      <header className="community-author-row">
        <button className="community-author" type="button" onClick={() => onOpenPlayer?.(post.authorId)}>
          <PlayerAvatar className="feed-post-ava" avatar={post.authorAvatar} />
          <span><strong>{post.authorName}</strong><time dateTime={post.createdAt}>{formatDate(post.createdAt, lang)}</time></span>
        </button>
        {feed.clientId && post.authorId !== feed.clientId && (
          <button className="community-follow" type="button" aria-pressed={!!post.authorFollowed}
            disabled={feed.pending[`follow:${post.authorId}`]}
            onClick={() => feed.followAuthor(post.authorId, post.authorFollowed)}>
            {post.authorFollowed ? (fr ? "Abonné" : "Following") : (fr ? "+ Suivre" : "+ Follow")}
          </button>
        )}
      </header>
      <div className="community-post-meta">
        <button className="community-theme-link" type="button" onClick={() => onTopic(post.category)}>
          <Icon name="themes" /> {titleFor(post.category, lang)}
        </button>
        <span className="community-post-type">{post.question ? (fr ? "Mini-quiz" : "Quick quiz") : "Discussion"}</span>
      </div>
      <p className="feed-post-text">{post.text}</p>
      {photo && <img className="community-photo" src={photo} alt={fr ? "Photo de la publication" : "Post photo"} loading="lazy" />}
      {post.question && <Quiz post={post} feed={feed} fr={fr} />}
      <div className="community-post-actions">
        <button type="button" aria-pressed={!!post.reacted} aria-label={fr ? `J’aime · ${likes}` : `Like · ${likes}`}
          disabled={feed.pending[`react:${post.id}`]} onClick={() => feed.react(post.id)}>
          <Icon name="heart" /> <span>{likes}</span>
        </button>
        {onThread ? (
          <button type="button" aria-label={fr ? `Réponses · ${comments}` : `Replies · ${comments}`}
            onClick={(event) => onThread(post.id, event.currentTarget)}>
            <Icon name="chat" /> <span>{comments} {fr ? (comments > 1 ? "réponses" : "réponse") : (comments === 1 ? "reply" : "replies")}</span>
          </button>
        ) : <span className="community-action-count"><Icon name="chat" /> {comments}</span>}
        <details className="community-post-more">
          <summary aria-label={fr ? "Plus d’actions" : "More actions"}>…</summary>
          <div onClick={(event) => { event.currentTarget.parentElement.open = false; }}>
            <button type="button" onClick={share}><Icon name="share" /> {fr ? "Partager" : "Share"}</button>
            {onPlayTopic && <button type="button" onClick={() => onPlayTopic(post.category)}><Icon name="bolt" /> {fr ? "Jouer" : "Play"}</button>}
            <button type="button" disabled={reported} onClick={() => feed.report(post.id)}>
              {reported ? (fr ? "Signalé" : "Reported") : (fr ? "Signaler" : "Report")}
            </button>
          </div>
        </details>
      </div>
      {notice && <p className="community-notice" role="status">{notice}</p>}
      {onThread && post.lastComment && (
        <button className="community-preview-reply" type="button" onClick={(event) => onThread(post.id, event.currentTarget)}>
          <PlayerAvatar avatar={post.lastComment.authorAvatar} />
          <span><strong>{post.lastComment.authorName}</strong> {post.lastComment.text}</span>
          <Icon name="arrow" />
        </button>
      )}
    </article>
  );
}

function Replies({ postId, feed, lang, onOpenPlayer }) {
  const fr = lang === "fr";
  const replies = feed.comments[postId] || [];
  const [draft, setDraft] = useState("");
  const submitted = useRef(null);
  useEffect(() => {
    const attempt = submitted.current;
    if (attempt && replies.some((c) => !attempt.ids.has(c.id) && c.text === attempt.text && c.authorId === feed.clientId)) {
      setDraft((value) => value.trim() === attempt.text ? "" : value);
      submitted.current = null;
    }
  }, [replies, feed.clientId]);
  const sendReply = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (text && feed.comment(postId, text)) submitted.current = { text, ids: new Set(replies.map((c) => c.id)) };
  };
  return (
    <>
      <section className="community-replies" aria-labelledby="community-replies-title">
        <h2 id="community-replies-title">{fr ? "Réponses" : "Replies"}</h2>
        {feed.pending[`comments:${postId}`] ? (
          <p className="community-notice" role="status">{fr ? "Chargement…" : "Loading…"}</p>
        ) : !feed.error && !replies.length && (
          <p className="community-notice">{fr ? "Sois le premier à répondre." : "Be the first to reply."}</p>
        )}
        {replies.map((reply) => (
          <article className="community-reply" key={reply.id}>
            <button className="community-reply-author" type="button" onClick={() => onOpenPlayer?.(reply.authorId)}>
              <PlayerAvatar avatar={reply.authorAvatar} />
              <strong>{reply.authorName}</strong>
              <time dateTime={reply.createdAt}>{formatDate(reply.createdAt, lang)}</time>
            </button>
            <p>{reply.text}</p>
          </article>
        ))}
        {feed.error && <p className="community-notice" role="alert">{feed.error} <button type="button" onClick={() => feed.loadComments(postId)}>{fr ? "Réessayer" : "Retry"}</button></p>}
      </section>
      <form className="community-reply-form" onSubmit={sendReply}>
        <input aria-label={fr ? "Ta réponse" : "Your reply"} placeholder={fr ? "Écrire une réponse…" : "Write a reply…"}
          value={draft} maxLength={240} onChange={(event) => setDraft(event.target.value)} />
        <button aria-label={fr ? "Envoyer" : "Send"} disabled={!draft.trim() || feed.pending[`comment:${postId}`]}><Icon name="send" /></button>
      </form>
    </>
  );
}

export function FeedScreen({ feed, myTopics = [], controls, onPlayTopic, onOpenTopicLeaderboard, onOpenPlayer, onThreadChange }) {
  const { lang } = useI18n();
  const fr = lang === "fr";
  const [threadId, setThreadId] = useState(null);
  const [composing, setComposing] = useState(false);
  const origin = useRef(null);
  const threadHeading = useRef(null);
  const restoreScroll = useRef(null);
  const thread = feed.posts.find((post) => post.id === threadId);
  const isThread = !!thread;
  const closeComposer = useCallback(() => setComposing(false), []);
  useEffect(() => {
    onThreadChange?.(isThread);
    if (isThread) {
      window.scrollTo(0, 0);
      threadHeading.current?.focus({ preventScroll: true });
    }
    return () => onThreadChange?.(false);
  }, [isThread, onThreadChange]);
  useEffect(() => {
    if (threadId && !thread) setThreadId(null);
    if (!isThread && restoreScroll.current !== null) {
      window.scrollTo(0, restoreScroll.current);
      document.getElementById(`post-${origin.current?.id}`)?.querySelector(origin.current?.selector)?.focus({ preventScroll: true });
      restoreScroll.current = null;
    }
  }, [isThread, threadId, thread]);
  const closeThread = () => {
    if (thread?.commentsCount !== origin.current?.commentsCount) feed.refresh();
    setThreadId(null);
  };
  const openThread = (id, button) => {
    restoreScroll.current = window.scrollY;
    origin.current = { id, commentsCount: feed.posts.find((post) => post.id === id)?.commentsCount, selector: button.classList.contains("community-preview-reply") ? ".community-preview-reply" : ".community-post-actions button:nth-child(2)" };
    setThreadId(id);
    feed.loadComments(id);
  };
  const setCategory = (key) => {
    if (threadId) {
      restoreScroll.current = null;
      setThreadId(null);
    }
    if (key !== feed.filter.category) feed.setFilter({ ...feed.filter, category: key });
  };
  const chipKeys = [...new Set([feed.filter.category, ...myTopics.map((item) => item.key || item.category),
    ...feed.posts.map((post) => post.category), ...suggestions])].filter((key) => topics.has(key)).slice(0, 4);
  const postProps = { feed, lang, onOpenPlayer, onPlayTopic, onTopic: setCategory };
  const category = feed.filter.category;
  const sortedTopics = useMemo(() => [...CATEGORIES].sort((a, b) => titleFor(a.key, lang).localeCompare(titleFor(b.key, lang), lang)), [lang]);
  return (
    <div className="community-social community-screen">
      {thread ? (
        <>
          <header className="community-bar community-thread-bar">
            <button className="community-thread-back" type="button" onClick={closeThread} aria-label={fr ? "Retour au fil" : "Back to feed"}>←</button>
            <h1 id="community-title" ref={threadHeading} tabIndex={-1}>Discussion</h1>
          </header>
          <div key="thread" className="community-thread">
            <CommunityPost key={thread.id} post={thread} {...postProps} />
            <Replies key={thread.id} postId={thread.id} feed={feed} lang={lang} onOpenPlayer={onOpenPlayer} />
          </div>
        </>
      ) : (
        <>
          <header className="community-bar">
            <span className="community-brand" aria-hidden="true"><Icon name="bolt" /></span>
            <h1 id="community-title" tabIndex={-1}>{fr ? "Communauté" : "Community"}</h1>
            <button className="community-publish" type="button" onClick={() => setComposing(true)}><span aria-hidden="true">+</span> {fr ? "Publier" : "Post"}</button>
            {controls && <div className="community-settings">{controls}</div>}
          </header>
          <div key="feed" className="community-feed">
            <div className="community-tabs" aria-label={fr ? "Fil de publications" : "Feed"}>
              {[["all", fr ? "Récents" : "Latest"], ["following", fr ? "Abonnements" : "Following"]].map(([scope, label]) => (
                <button key={scope} type="button" aria-pressed={feed.filter.scope === scope}
                  onClick={() => { if (scope !== feed.filter.scope) feed.setFilter({ ...feed.filter, scope }); }}>{label}</button>
              ))}
            </div>
            <div className="community-topics">
              <select aria-label={fr ? "Filtrer par thème" : "Filter by theme"} value={category || ""} onChange={(event) => setCategory(event.target.value || null)}>
                <option value="">{fr ? "Tous les thèmes" : "All themes"}</option>
                {sortedTopics.map((topic) => (
                  <option key={topic.key} value={topic.key}>{titleFor(topic.key, lang)}</option>
                ))}
              </select>
              {chipKeys.map((key) => {
                const cover = getTopicCover(topics.get(key));
                return <button key={key} type="button" aria-pressed={category === key} onClick={() => setCategory(category === key ? null : key)}>
<<<<<<< HEAD
                  {cover?.src && <img src={cover.src} srcSet={cover.srcSet} sizes="24px" alt="" loading="lazy" decoding="async" style={{ objectPosition: cover.focal }} />}
=======
                  {cover?.src && <img src={cover.src} srcSet={cover.srcSet} sizes="24px" alt="" style={{ objectPosition: cover.focal }} />}
>>>>>>> 6646450f4e1e9e7719542c3e43d037ca7bb7ef3d
                  <span>{titleFor(key, lang)}</span>
                </button>;
              })}

            </div>
            {category && <div className="community-topic-actions">
              <strong>{titleFor(category, lang)}</strong>
              {onPlayTopic && <button type="button" onClick={() => onPlayTopic(category)}>{fr ? "Jouer" : "Play"}</button>}
              {onOpenTopicLeaderboard && <button type="button" onClick={() => onOpenTopicLeaderboard(category)}>{fr ? "Classement" : "Ranking"}</button>}
            </div>}
            {feed.error && !composing && <p className="community-notice" role="alert">{feed.error} <button type="button" onClick={feed.refresh}>{fr ? "Réessayer" : "Retry"}</button></p>}
            {feed.loading && <p className="community-notice" role="status">{fr ? "Chargement…" : "Loading…"}</p>}
            {!feed.loading && !feed.error && !feed.posts.length && (
              <div className="community-empty">
                <Icon name="chat" />
                <h2>{feed.filter.scope === "following" ? (fr ? "Tes abonnements" : "Your following feed") : (fr ? "Lance la conversation" : "Start the conversation")}</h2>
                <p>{feed.filter.scope === "following"
                  ? (fr ? "Les publications des joueurs que tu suis apparaîtront ici." : "Posts from players you follow will appear here.")
                  : (fr ? "Partage une idée, une photo ou un mini-quiz." : "Share an idea, a photo or a quick quiz.")}</p>
                <button type="button" onClick={() => feed.filter.scope === "following" ? feed.setFilter({ scope: "all" }) : setComposing(true)}>
                  {feed.filter.scope === "following" ? (fr ? "Voir les publications récentes" : "See recent posts") : (fr ? "Créer une publication" : "Create a post")}
                </button>
              </div>
            )}
            {feed.posts.map((post) => <CommunityPost key={post.id} post={post} {...postProps} onThread={openThread} />)}
          </div>
        </>
      )}
      <CommunityComposer feed={feed} lang={lang} open={composing} onDismiss={closeComposer} />
    </div>
  );
}
