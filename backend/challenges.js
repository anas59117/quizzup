const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { randomId } = require('./ids');
function createChallenges({
  file = getStorePath('challenges.json'),
  friends = require('./social').areFriends,
  notify = () => {},
} = {}) {
  const saved = readJsonFileSync(file, []);
  const items = new Map(
    (Array.isArray(saved) ? saved : [])
      .filter((c) => c && c.id)
      .slice(-5000)
      .map((c) => [c.id, c]),
  );
  const reserved = new Set();
  const persist = createJsonWriter(file, () => [...items.values()]);
  function update(c, status) {
    c.status = status;
    persist();
    notify({ ...c });
    return { ...c };
  }
  function get(id) {
    const c = items.get(id);
    if (c?.status === 'pending' && c.expiresAt <= Date.now())
      update(c, 'expired');
    return c;
  }
  function create(fromId, toId, category) {
    if (!friends(fromId, toId)) throw Error('NOT_FRIENDS');
    for (const id of items.keys()) {
      const c = get(id);
      if (
        c.status === 'pending' &&
        [c.fromId, c.toId].includes(fromId) &&
        [c.fromId, c.toId].includes(toId)
      )
        throw Error('CHALLENGE_PENDING');
    }
    const c = {
      id: randomId('challenge_'),
      fromId,
      toId,
      category,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 86400000,
    };
    items.set(c.id, c);
    while (items.size > 5000) items.delete(items.keys().next().value);
    persist();
    return { ...c };
  }
  async function respond(uid, id, accept, { available, start }) {
    const c = get(id);
    if (!c || c.toId !== uid) throw Error('CHALLENGE_FORBIDDEN');
    if (c.status !== 'pending' || reserved.has(id))
      throw Error('CHALLENGE_UNAVAILABLE');
    if (!friends(c.fromId, c.toId)) throw Error('NOT_FRIENDS');
    if (!accept) return update(c, 'declined');
    if (!available(c)) throw Error('PLAYERS_UNAVAILABLE');
    reserved.add(id);
    try {
      const g = await start(c);
      if (!g) throw Error('GAME_START_FAILED');
      g.challengeId = c.id;
      c.gameId = g.id;
      return update(c, 'accepted');
    } finally {
      reserved.delete(id);
    }
  }
  return {
    expire() {
      for (const id of items.keys()) get(id);
    },
    create,
    respond,
    get,
    complete(id) {
      const c = items.get(id);
      if (c) update(c, 'completed');
    },
    flush: persist.flush,
  };
}
const social = require('./social');
const instance = createChallenges({
  notify(challenge) {
    require('./messaging').updateChallenge(challenge);
    for (const id of [challenge.fromId, challenge.toId]) {
      const ws = social.getWs(id);
      if (ws?.readyState === 1)
        ws.send(JSON.stringify({ type: 'challenge_updated', challenge }));
    }
  },
});
module.exports = { ...instance, createChallenges };
