const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
process.env.DATA_DIR = fs.mkdtempSync(
  path.join(os.tmpdir(), "quizzup-post-detail-"),
);
const posts = require("./posts");
test("shared post details preserve viewer reaction and withhold correct answer and hidden posts", () => {
  const post = posts.addPost(
    "author",
    "Author",
    "robot",
    "music",
    "A real question",
    {
      question: {
        prompt: "How many?",
        answers: ["One", "Two", "Three", "Four"],
        correctIndex: 2,
      },
    },
  );
  assert.ok(post);
  posts.toggleReaction(post.id, "viewer");
  const detail = posts.getPost(post.id, "viewer");
  assert.equal(detail.reacted, true);
  assert.equal(posts.getPost(post.id, "other").reacted, false);
  assert.equal(Object.hasOwn(detail.question, "correctIndex"), false);
  assert.equal(posts.getPost("not-found", "viewer"), null);
  for (const id of ["report-a", "report-b", "report-c"])
    posts.reportPost(post.id, id);
  assert.equal(posts.getPost(post.id, "viewer"), null);
});
