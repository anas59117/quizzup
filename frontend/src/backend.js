const PRODUCTION_BACKEND_ORIGIN = 'https://quizzup-production.up.railway.app';

function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/$/, '');
}

export function getBackendOrigin() {
  const configuredApi = normalizeOrigin(process.env.REACT_APP_API_URL);
  if (configuredApi) return configuredApi;

  const configuredWs = String(process.env.REACT_APP_WS_URL || '').trim();
  if (configuredWs) {
    try {
      const url = new URL(configuredWs);
      url.protocol = url.protocol === 'wss:' ? 'https:' : 'http:';
      url.pathname = '';
      url.search = '';
      url.hash = '';
      return normalizeOrigin(url.toString());
    } catch {
      // Fall through to the environment-aware default below.
    }
  }

  const isLocal = (
    window.location.hostname === 'localhost'
    || window.location.hostname === '127.0.0.1'
  );
  if (isLocal) {
    return `http://${window.location.hostname}:3001`;
  }

  return PRODUCTION_BACKEND_ORIGIN;
}

export function getWebSocketUrl() {
  const configured = String(process.env.REACT_APP_WS_URL || '').trim();
  if (configured) return configured;

  const backend = new URL(getBackendOrigin());
  backend.protocol = backend.protocol === 'https:' ? 'wss:' : 'ws:';
  backend.pathname = '/ws';
  backend.search = '';
  backend.hash = '';
  return backend.toString();
}
