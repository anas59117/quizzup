// Open Trivia DB integration (https://opentdb.com) — free, ~4000 questions,
// no API key. We keep a small per-category cache and refill it in the
// background, because OpenTDB rate-limits to ~1 request / 5s per IP.
//
// This module NEVER throws to the caller: on any network/parse/rate-limit
// failure it returns null and the game falls back to the local question bank
// (questions.js). That keeps the game playable even if the API is down or
// blocked (e.g. a sandboxed dev environment).

const OTDB_CATEGORY = {
  movies: 11, // Entertainment: Film
  music: 12, // Entertainment: Music
  sports: 21, // Sports
  geography: 22, // Geography
  gaming: 15, // Entertainment: Video Games
  science: 17, // Science & Nature
};

const CACHE_TARGET = 40; // questions to keep cached per category
const REFILL_AT = 12; // refill when a category drops below this
const RATE_LIMIT_MS = 5500; // OpenTDB: ~1 req / 5s per IP

const cache = new Map(); // categoryKey -> question[]
const refilling = new Set();

function createRateLimitedQueue(
  intervalMs,
  now = () => Date.now(),
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
) {
  let nextAllowedAt = 0;
  let chain = Promise.resolve();

  return function schedule(task) {
    const run = async () => {
      const wait = Math.max(0, nextAllowedAt - now());
      if (wait > 0) await sleep(wait);
      nextAllowedAt = now() + intervalMs;
      return task();
    };

    const result = chain.then(run, run);
    // Keep the queue alive even when one request fails.
    chain = result.catch(() => {});
    return result;
  };
}

const scheduleFetch = createRateLimitedQueue(RATE_LIMIT_MS);

const b64 = (s) => Buffer.from(s, 'base64').toString('utf8');
// Fisher-Yates: uniform-random permutation. (sort(() => Math.random() - 0.5)
// is not uniform — it's biased by the sort algorithm's comparison pattern.)
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Turn one OpenTDB result (base64-encoded) into our question shape.
function normalize(r, label, icon) {
  const text = b64(r.question);
  const correct = b64(r.correct_answer);
  const incorrect = r.incorrect_answers.map(b64);
  const answers = shuffle([correct, ...incorrect]);
  return { text, answers, correct: answers.indexOf(correct), category: label, icon };
}

async function fetchBatch(categoryKey, label, icon) {
  const otdbId = OTDB_CATEGORY[categoryKey];
  if (!otdbId) return null;

  // OpenTDB limits by source IP. Every category refill therefore shares one
  // serialized queue; concurrent warm-up calls cannot wake up together and
  // accidentally burst several requests after the same delay.
  return scheduleFetch(async () => {
    const url = `https://opentdb.com/api.php?amount=${CACHE_TARGET}&category=${otdbId}&type=multiple&encode=base64`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
      const resp = await fetch(url, { signal: controller.signal });
      if (!resp.ok) return null;
      const data = await resp.json();
      if (data.response_code !== 0 || !Array.isArray(data.results)) return null;
      return data.results.map((r) => normalize(r, label, icon));
    } catch {
      return null; // network error, abort, bad JSON — fall back to local
    } finally {
      clearTimeout(timeout);
    }
  });
}

// Kick off a background refill for a category (non-blocking, deduplicated).
function refill(categoryKey, label, icon) {
  if (refilling.has(categoryKey)) return;
  refilling.add(categoryKey);
  fetchBatch(categoryKey, label, icon)
    .then((batch) => {
      if (batch && batch.length) {
        const existing = cache.get(categoryKey) || [];
        cache.set(categoryKey, existing.concat(batch));
      }
    })
    .finally(() => refilling.delete(categoryKey));
}

// Take `count` cached API questions for a category. Returns [] if the cache
// can't satisfy the request (caller then fills the rest from local). Always
// triggers a background refill when the cache runs low.
function takeFromCache(count, categoryKey, label, icon) {
  const pool = cache.get(categoryKey) || [];
  const taken = pool.splice(0, count);
  cache.set(categoryKey, pool);
  if (pool.length < REFILL_AT) refill(categoryKey, label, icon);
  return taken;
}

function isSupported(categoryKey) {
  return !!OTDB_CATEGORY[categoryKey];
}

module.exports = { takeFromCache, refill, isSupported, createRateLimitedQueue };
