const { createJsonWriter, readJsonFileSync } = require('./json-writer');
const { getStorePath } = require('./store-path');
const { randomId } = require('./ids');
const social = require('./social');
function createMessaging({
  file = getStorePath('messages.json'),
  friends = social.areFriends,
  profile = social.profileOf,
} = {}) {
  const saved = readJsonFileSync(
    file,
    {},
    (value) => !!value && typeof value === 'object' && !Array.isArray(value),
  );
  const threads = new Map();
  const themes = new Map();
  for (const t of Array.isArray(saved.threads) ? saved.threads : [])
    if (
      Array.isArray(t.members) &&
      t.members.length === 2 &&
      t.members.every((x) => typeof x === 'string')
    )
      threads.set(JSON.stringify([...t.members].sort()), {
        members: t.members,
        messages: (Array.isArray(t.messages) ? t.messages : [])
          .filter(
            (m) =>
              m &&
              typeof m.id === 'string' &&
              t.members.includes(m.fromId) &&
              t.members.includes(m.toId) &&
              m.fromId !== m.toId,
          )
          .slice(-100),
        read: t.read || {},
      });
  for (const [id, list] of Object.entries(saved.themes || {}))
    if (Array.isArray(list))
      themes.set(id, list.filter((x) => typeof x === 'string').slice(0, 200));
  const persist = createJsonWriter(file, () => ({
    threads: [...threads.values()],
    themes: Object.fromEntries(themes),
  }));
  function thread(a, b, create = false) {
    if (!a || !b || a === b || !friends(a, b)) throw Error('NOT_FRIENDS');
    const key = JSON.stringify([a, b].sort());
    let t = threads.get(key);
    if (!t && create) {
      for (const id of [a, b])
        if (
          [...threads.values()].filter((t) => t.members.includes(id)).length >=
          200
        )
          throw Error('CONVERSATION_LIMIT');
      t = { members: [a, b], messages: [], read: {} };
      threads.set(key, t);
    }
    return t;
  }
  function send(a, b, text, extra = {}) {
    const t = thread(a, b, true);
    const clientMessageId =
      typeof extra.clientMessageId === 'string'
        ? extra.clientMessageId.slice(0, 80)
        : null;
    if (clientMessageId) {
      const old = t.messages.find(
        (m) => m.fromId === a && m.clientMessageId === clientMessageId,
      );
      if (old) return old;
    }
    const clean = typeof text === 'string' ? text.trim().slice(0, 300) : '';
    if (!clean && !extra.kind) throw Error('EMPTY_MESSAGE');
    const message = {
      id: randomId('m_'),
      fromId: a,
      toId: b,
      kind: extra.kind || 'text',
      text: clean,
      createdAt: Date.now(),
    };
    for (const k of ['challenge', 'result'])
      if (extra[k]) message[k] = extra[k];
    if (typeof extra.clientMessageId === 'string')
      message.clientMessageId = extra.clientMessageId.slice(0, 80);
    t.messages.push(message);
    t.messages = t.messages.slice(-100);
    persist();
    return message;
  }
  function history(a, b, before) {
    const t = thread(a, b);
    let rows = t?.messages || [];
    if (before) {
      const index = rows.findIndex((m) => m.id === before);
      rows = index < 0 ? [] : rows.slice(0, index);
    }
    return {
      targetId: b,
      messages: rows.slice(-40),
      hasMore: rows.length > 40,
    };
  }
  function read(a, b) {
    const t = thread(a, b);
    if (t) {
      t.read[a] = t.messages.at(-1)?.id;
      persist();
    }
  }
  function summaries(a) {
    const conversations = [];
    for (const t of threads.values()) {
      if (!t.members.includes(a)) continue;
      const b = t.members.find((x) => x !== a);
      if (!friends(a, b) || !t.messages.length) continue;
      const cursor = t.messages.findIndex((m) => m.id === t.read[a]);
      conversations.push({
        peer: profile(b),
        lastMessage: t.messages.at(-1),
        unread: t.messages.slice(cursor + 1).filter((m) => m.toId === a).length,
      });
    }
    conversations.sort(
      (a, b) => b.lastMessage.createdAt - a.lastMessage.createdAt,
    );
    return {
      conversations,
      unreadCount: conversations.reduce((n, c) => n + c.unread, 0),
    };
  }
  function updateChallenge(challenge) {
    for (const t of threads.values())
      for (const m of t.messages)
        if (m.challenge?.id === challenge.id) m.challenge = { ...challenge };
    persist();
  }
  return {
    send,
    history,
    read,
    summaries,
    updateChallenge,
    flush: persist.flush,
    getFollowedThemes: (id) => themes.get(id) || [],
    setThemeFollowing(id, key, on) {
      const list = new Set(themes.get(id) || []);
      on ? list.add(key) : list.delete(key);
      themes.set(id, [...list].slice(0, 200));
      persist();
    },
  };
}
const store = createMessaging();
function recordMatchResults(g, results) {
  const players = Array.isArray(results)
    ? results
        .filter((r) => r.clientId)
        .map((r) => ({ clientId: r.clientId, id: r.playerId, score: r.score }))
    : g.players.filter((p) => p.clientId && !p.isBot);
  for (let i = 0; i < players.length; i++)
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i],
        b = players[j];
      if (!social.areFriends(a.clientId, b.clientId)) continue;
      const score = (p) =>
        Number(results?.find?.((r) => r.playerId === p.id)?.score ?? p.score) ||
        0;
      const result = {
        gameId: g.id,
        category: g.categoryKey,
        scores: [
          { id: a.clientId, score: score(a) },
          { id: b.clientId, score: score(b) },
        ],
      };
      const message = store.send(a.clientId, b.clientId, '', {
        kind: 'result',
        result,
        clientMessageId: `result:${g.id}`,
      });
      for (const p of [a, b]) {
        const ws = social.getWs(p.clientId);
        if (ws?.readyState === 1)
          ws.send(JSON.stringify({ type: 'dm', message }));
      }
    }
  if (g.challengeId) require('./challenges').complete(g.challengeId);
}
module.exports = { ...store, createMessaging, recordMatchResults };
