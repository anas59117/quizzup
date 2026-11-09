import { useEffect, useMemo, useRef, useState } from "react";
import { CATEGORIES, Icon } from "./ui";
import { localizedTopicTitle } from "./topicTitles";
import { uploadCommunityPhoto } from "./community-media";
import { useI18n } from "./i18n";

export function CommunityComposer({ feed, lang, open, onDismiss }) {
  const { t } = useI18n();
  const dialog = useRef(null);
  useEffect(() => {
    const element = dialog.current;
    if (open && !element.open) {
      if (typeof element.showModal === "function") element.showModal();
      else element.setAttribute("open", "");
    } else if (!open && element.open) {
      if (typeof element.close === "function") element.close();
      else element.removeAttribute("open");
    }
  }, [open]);
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
      setCorrect(0);
      onDismiss();
    }
  }, [feed.createdVersion, onDismiss]);
  const submit = async (e) => {
    e.preventDefault();
    if (uploading || feed.pending.create) return;
    setError("");
    setUploading(true);
    try {
      const extra = {};
      if (mode === "image") {
        if (!file) throw new Error(t('choosePhoto'));
        extra.mediaUrl = await uploadCommunityPhoto(file);
      }
      if (mode === "question") {
        if (!prompt.trim() || options.some((a) => !a.trim()))
          throw new Error(t('completeQuestionError'));
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
    <dialog ref={dialog} className="community-publish-dialog" aria-labelledby="community-publish-title" onCancel={(event) => { event.preventDefault(); onDismiss(); }}>
      <form className="community-composer" onSubmit={submit}>
        <header className="community-dialog-heading">
          <h2 id="community-publish-title">{t('newPostTitle')}</h2>
          <button type="button" onClick={onDismiss} aria-label={t('closeLabel')}><Icon name="close" /></button>
        </header>
        <select
          aria-label={t('postThemeLabel')}
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {sorted.map((c) => (
            <option key={c.key} value={c.key}>
              {localizedTopicTitle(c, lang)}
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
                  text: t('textType'),
                  image: "Photo",
                  question: "Question",
                }[m]
              }
            </button>
          ))}
        </div>
        <textarea
          aria-label={t('yourPostLabel')}
          placeholder={t('whatsNewPlaceholder')}
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
              placeholder={t('writeQuestion')}
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
                  aria-label={`${t('correctAnswerField')} ${i + 1}`}
                />
                <input
                  placeholder={`${t('answerField')} ${i + 1}`}
                  aria-label={`${t('answerField')} ${i + 1}`}
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
          {uploading || feed.pending.create ? "…" : t('publishAction')}
        </button>
        {(error || feed.error) && <p role="alert">{error || feed.error}</p>}
      </form>
    </dialog>
  );
}
