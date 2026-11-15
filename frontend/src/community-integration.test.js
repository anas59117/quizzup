import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useFeed, FeedScreen } from "./feed";
import { useMatchHistory } from "./MatchHistory";
import { PlayerSheet } from "./players";
import { I18nProvider } from "./i18n";
import { communityMediaUrl, shareCommunityPost } from "./community-media";

global.IS_REACT_ACT_ENVIRONMENT = true;
let root, container, feed, history, socket;
function Harness() {
  feed = useFeed(socket, "me");
  history = useMatchHistory(socket);
  return <FeedScreen feed={feed} />;
}
beforeEach(() => {
  jest.useFakeTimers();
  localStorage.setItem("quizzup-lang", "en");
  socket = { current: { readyState: 1, send: jest.fn() } };
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  act(() =>
    root.render(
      <I18nProvider>
        <Harness />
      </I18nProvider>,
    ),
  );
});
afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.useRealTimers();
});
const post = {
  id: "p",
  authorId: "me",
  authorName: "Me",
  category: "music",
  text: "Hello",
  createdAt: "2026-10-18",
  reactions: 0,
};

test("demo starters are visibly labelled and use fandom images without a fake follow action", () => {
  act(() => feed.handleMessage({ type: "feed_list", scope: "all", posts: [{
    ...post, authorId: null, authorName: "Repaire Marvel", isDemo: true,
    demoAvatar: "https://quizzup-ten.vercel.app/images/covers/approved-v2/spider_man-640.webp",
    mediaUrl: "/images/covers/approved-v2/marvel-640.webp",
  }] }));
  expect(container.querySelector(".community-demo-label")).not.toBeNull();
  expect(container.querySelector(".community-author img")?.getAttribute("src")).toContain("spider_man-640.webp");
  expect(container.querySelector(".community-photo")?.getAttribute("src")).toContain("marvel-640.webp");
  expect(container.querySelector(".community-follow")).toBeNull();
});

test("official launch discussions use the brand identity and ordinary text without demo personas", () => {
  act(() => feed.handleMessage({ type: "feed_list", scope: "all", posts: [{
    ...post, authorId: null, authorName: "QuizzUp", isOfficial: true,
    text: "Infinity War ou Endgame ?\nLequel vous a le plus marqué ?", mediaUrl: null,
  }] }));
  expect(container.querySelector(".community-official-label")?.textContent).toBe("Team");
  expect(container.querySelector(".community-brand-avatar")).not.toBeNull();
  expect(container.querySelector(".community-demo-label")).toBeNull();
  expect(container.querySelector(".community-photo")).toBeNull();
  expect(container.querySelector(".feed-post-text strong")).toBeNull();
  expect(container.querySelector(".community-follow")).toBeNull();
  expect(container.querySelector(".feed-post-text").textContent).toContain("Lequel vous a le plus marqué");
});

test("my posts ignores foreign broadcasts and stale public-feed responses", () => {
  act(()=>feed.setFilter({scope:'mine'}));
  act(()=>feed.handleMessage({type:'feed_list',scope:'all',posts:[{...post,id:'foreign',authorId:'other',text:'Foreign public post'}]}));
  expect(container.textContent).not.toContain('Foreign public post');
  act(()=>feed.handleMessage({type:'feed_list',scope:'mine',posts:[{...post,text:'My own post'},{...post,id:'foreign',authorId:'other',text:'Foreign public post'}]}));
  expect(container.textContent).toContain('My own post');
  expect(container.textContent).not.toContain('Foreign public post');
  expect(container.querySelector('.community-tabs')).toBeNull();
  expect(container.querySelector('h1').textContent).toBe('My posts');
  act(()=>feed.handleMessage({type:'post_created',post:{...post,id:'new-foreign',authorId:'other',text:'Foreign broadcast'}}));
  expect(container.textContent).not.toContain('Foreign broadcast');
});

test("comment reaction broadcasts preserve my selection and update the real count", () => {
  act(() => feed.handleMessage({ type: "post_comments", postId: "p", comments: [
    { id: "c1", authorId: "peer", text: "My take", reactions: 1, reacted: true },
  ] }));
  act(() => feed.handleMessage({ type: "post_comment_reacted", postId: "p", commentId: "c1", actorId: "peer", reactions: 2, reacted: false }));
  expect(feed.comments.p[0]).toMatchObject({ reactions: 2, reacted: true });
  act(() => feed.handleMessage({ type: "post_comment_reacted", postId: "p", commentId: "c1", actorId: "me", reactions: 1, reacted: false }));
  expect(feed.comments.p[0]).toMatchObject({ reactions: 1, reacted: false });
});

test("replies carry their root comment and keep the draft pending until confirmation", () => {
  act(() => feed.comment("p", "A reply", "root-comment"));
  expect(JSON.parse(socket.current.send.mock.calls.at(-1)[0])).toMatchObject({
    type: "post_comment", postId: "p", parentId: "root-comment", text: "A reply",
  });
  expect(feed.pending["comment:p"]).toBe(true);
});

test("server comment evictions keep the replied-to root and remove obsolete threads", () => {
  const comments = Array.from({ length: 100 }, (_, index) => ({ id: `root-${index}`, authorId: "peer", text: `Comment ${index}` }));
  act(() => feed.handleMessage({ type: "post_comments", postId: "p", comments }));
  act(() => feed.handleMessage({ type: "post_commented", postId: "p", commentsCount: 100,
    removedCommentIds: ["root-1"], comment: { id: "reply-new", parentId: "root-0", authorId: "me", text: "My reply" } }));
  expect(feed.comments.p).toHaveLength(100);
  expect(feed.comments.p.some((reply) => reply.id === "root-0")).toBe(true);
  expect(feed.comments.p.some((reply) => reply.id === "root-1")).toBe(false);
  expect(feed.comments.p.at(-1).parentId).toBe("root-0");
});

test("my topics requests keep canonical categories and reject stale topic responses", () => {
  act(() => feed.setFilter({ scope: "topics", categories: ["spider_man", "marvel", "marvel"] }));
  expect(JSON.parse(socket.current.send.mock.calls.at(-1)[0])).toMatchObject({
    type: "feed_list", scope: "topics", categories: ["marvel", "spider_man"],
  });
  act(() => feed.handleMessage({ type: "feed_list", scope: "topics", categories: ["music"], posts: [post] }));
  expect(feed.posts).toEqual([]);
});

test("only identified demo posts may display bundled fandom media", () => {
  const image = "/images/covers/approved-v2/marvel-640.webp";
  expect(communityMediaUrl(image, true)).toBe(image);
  expect(communityMediaUrl(image)).toBeNull();
  expect(communityMediaUrl("/images/covers/approved-v2/../private.webp", true)).toBeNull();
  expect(communityMediaUrl("https://evil.example/photo.jpg", true)).toBeNull();
});
test("late feed responses cannot replace the selected theme and duplicate posts are ignored", () => {
  act(() => feed.setFilter({ category: "music" }));
  act(() =>
    feed.handleMessage({
      type: "feed_list",
      scope: "all",
      category: "movies",
      posts: [post],
    }),
  );
  expect(feed.posts).toEqual([]);
  act(() =>
    feed.handleMessage({
      type: "feed_list",
      scope: "all",
      category: "music",
      posts: [post],
    }),
  );
  act(() => feed.handleMessage({ type: "post_created", post }));
  expect(feed.posts).toHaveLength(1);
});
test("pending create suppresses duplicates and timeout permits retry without clearing draft", () => {
  const textarea = container.querySelector("textarea");
  act(() => {
    Object.getOwnPropertyDescriptor(
      HTMLTextAreaElement.prototype,
      "value",
    ).set.call(textarea, "Keep my words");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
  });
  act(() => {
    feed.createPost("music", "Keep my words");
    feed.createPost("music", "duplicate");
  });
  expect(socket.current.send).toHaveBeenCalledTimes(1);
  act(() => jest.advanceTimersByTime(12000));
  expect(feed.pending.create).toBe(false);
  expect(textarea.value).toBe("Keep my words");
  expect(feed.error).toContain("draft");
  act(() => feed.createPost("music", "Keep my words"));
  expect(socket.current.send).toHaveBeenCalledTimes(2);
  act(() => feed.handleMessage({ type: "post_created", post }));
  expect(textarea.value).toBe("");
});
test("another player reaction never changes my selected reaction", () => {
  act(() =>
    feed.handleMessage({
      type: "feed_list",
      scope: "all",
      posts: [{ ...post, reacted: true }],
    }),
  );
  act(() =>
    feed.handleMessage({
      type: "post_reacted",
      id: "p",
      actorId: "peer",
      reacted: false,
      reactions: 2,
    }),
  );
  expect(feed.posts[0].reacted).toBe(true);
  act(() =>
    feed.handleMessage({
      type: "post_reacted",
      id: "p",
      actorId: "me",
      reacted: false,
      reactions: 1,
    }),
  );
  expect(feed.posts[0].reacted).toBe(false);
});
test("history timeout is recoverable and only canonical match history populates records", () => {
  act(() => history.refresh());
  act(() => jest.advanceTimersByTime(12000));
  expect(history.loading).toBe(false);
  expect(history.error).toContain("timed out");
  act(() => history.refresh());
  act(() =>
    history.handleMessage({ type: "match_history", matches: [{ id: "mine" }] }),
  );
  expect(history.matches).toEqual([{ id: "mine" }]);
  expect(history.error).toBe("");
});
test("community media rejects external URLs and share awaits clipboard completion", async () => {
  expect(communityMediaUrl("https://evil.example/photo.jpg")).toBeNull();
  expect(communityMediaUrl("/community-media/../photo.jpg")).toBeNull();
  const writeText = jest.fn().mockResolvedValue();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText },
  });
  expect(await shareCommunityPost(post)).toBe("copied");
  expect(writeText).toHaveBeenCalledWith(expect.stringContaining("#post-p"));
});

test("shared post detail can surface an old post and missing details show honest feedback", () => {
  act(() => feed.openPost("p"));
  act(() => feed.handleMessage({ type: "post_detail", postId: "p", post }));
  expect(feed.posts[0].id).toBe("p");
  act(() => feed.openPost("gone"));
  act(() =>
    feed.handleMessage({ type: "post_detail", postId: "gone", post: null }),
  );
  expect(feed.error).toContain("unavailable");
});

test("profile removal requires confirmation, preserves offline retry, and reflects canonical membership", () => {
  const profile = {
    id: "peer",
    name: "Camille",
    level: 2,
    games: 1,
    topics: [],
    isFriend: true,
  };
  const players = { viewing: { profile }, close: jest.fn() };
  const social = {
    friends: [{ id: "peer" }],
    outgoingRequests: new Set(),
    addFriend: jest.fn(),
    removeFriend: jest.fn(() => false),
  };
  const render = () =>
    act(() =>
      root.render(
        <I18nProvider>
          <PlayerSheet players={players} social={social} />
        </I18nProvider>,
      ),
    );
  render();
  const button = () =>
    [...container.querySelectorAll("button")].find(
      (el) =>
        el.textContent === "Remove friend" ||
        el.textContent === "Confirm removal",
    );
  act(() => button().click());
  expect(social.removeFriend).not.toHaveBeenCalled();
  act(() => button().click());
  expect(social.removeFriend).toHaveBeenCalledWith("peer");
  expect(container.querySelector('[role="alert"]').textContent).toContain(
    "Connection unavailable",
  );
  social.removeFriend.mockReturnValue(true);
  act(() => button().click());
  expect(
    [...container.querySelectorAll("button")].some(
      (el) => el.textContent === "Removing…" && el.disabled,
    ),
  ).toBe(true);
  social.friends = [];
  render();
  expect(
    [...container.querySelectorAll("button")].some(
      (el) => el.textContent === "Remove friend",
    ),
  ).toBe(false);
});
