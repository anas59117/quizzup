function parseTrustedHops(value) {
  const n = Number.parseInt(String(value || ''), 10);
  return Number.isInteger(n) && n > 0 ? Math.min(n, 10) : 1;
}

function getClientIp(
  req,
  {
    trustProxy = process.env.TRUST_PROXY === 'true',
    trustedHops = parseTrustedHops(process.env.TRUST_PROXY_HOPS),
  } = {}
) {
  const remote = req?.socket?.remoteAddress || 'unknown';
  if (!trustProxy) return remote;

  const forwarded = req?.headers?.['x-forwarded-for'];
  if (!forwarded) return remote;

  const values = (Array.isArray(forwarded) ? forwarded.join(',') : String(forwarded))
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!values.length) return remote;

  // XFF is ordered client -> proxies. Trusting N proxies means the client
  // address is N positions from the right edge of the forwarded chain.
  const index = Math.max(0, values.length - trustedHops);
  return values[index] || remote;
}

module.exports = { getClientIp, parseTrustedHops };
