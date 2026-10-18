export function mergeMessages(previous = [], incoming = []) {
  const byId = new Map(previous.filter(Boolean).map(message => [message.id, message]));
  incoming.filter(Boolean).forEach(message => { if (message.id) byId.set(message.id, { ...byId.get(message.id), ...message }); });
  return [...byId.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt) || String(a.id).localeCompare(String(b.id))).slice(-500);
}
export function messagePeer(message, clientId, fallback) {
  return message.fromId === clientId ? message.toId : message.fromId || fallback;
}
export const initialSocialData = { messages: {}, conversations: [], unreadCount: 0, loading: {}, error: null, pendingActions: {}, hasMore: {} };
export function socialDataReducer(state, action) {
  if (action.type === 'loading') return { ...state, error: null, loading: { ...state.loading, [action.key]: true } };
  if (action.type === 'social_error' || action.type === 'dm_unavailable') return { ...state, loading: {}, pendingActions: {}, error: action };
  if (action.type === 'pending') return { ...state, error: null, pendingActions: { ...state.pendingActions, [action.key]: true } };
  if (action.type === 'conversations_list') return { ...state, conversations: action.conversations || [], unreadCount: action.unreadCount || 0, loading: { ...state.loading, conversations: false }, error: null };
  if (action.type === 'dm_read') {
    const conversations = state.conversations.map(c => c.peer.id === action.targetId ? { ...c, unread: 0 } : c);
    return { ...state, conversations, unreadCount: conversations.reduce((total, c) => total + (c.unread || 0), 0) };
  }
  if (action.type === 'dm_history') return { ...state, messages: { ...state.messages, [action.targetId]: mergeMessages(state.messages[action.targetId], action.messages) }, hasMore: { ...state.hasMore, [action.targetId]: !!action.hasMore }, loading: { ...state.loading, [action.targetId]: false }, error: null };
  if ((action.type === 'dm' || action.type === 'dm_sent') && action.message) {
    const peer = messagePeer(action.message, action.clientId, action.targetId);
    return { ...state, messages: { ...state.messages, [peer]: mergeMessages(state.messages[peer], [action.message]) }, pendingActions: { ...state.pendingActions, [peer]: false, [`challenge:${peer}`]: false }, error: null };
  }
  if (action.type === 'challenge_updated') {
    const messages = Object.fromEntries(Object.entries(state.messages).map(([id, list]) => [id, list.map(m => m.challenge?.id === action.challenge.id ? { ...m, challenge: action.challenge } : m)]));
    return { ...state, messages, pendingActions: {}, error: null };
  }
  return state;
}

