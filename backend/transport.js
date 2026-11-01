// Bound per-peer queued output: an unread socket must not consume the server's
// memory indefinitely. Existing authenticated sessions can reconnect normally.
const MAX_BUFFERED_BYTES = 256 * 1024;

function send(ws, value) {
  if (!ws || ws.readyState !== 1) return false;
  try {
    // A large but bounded application snapshot is valid on an empty socket.
    // Backpressure is about bytes already waiting, not the size of that snapshot.
    if ((ws.bufferedAmount || 0) >= MAX_BUFFERED_BYTES) {
      ws.terminate?.();
      return false;
    }
    const payload = JSON.stringify(value);
    ws.send(payload, error => { if (error) ws.terminate?.(); });
    return true;
  } catch {
    ws.terminate?.();
    return false;
  }
}

module.exports = { send, MAX_BUFFERED_BYTES };
