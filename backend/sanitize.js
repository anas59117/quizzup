function cleanDisplayName(value, fallback = 'Player', maxLength = 20) {
  if (typeof value !== 'string') return fallback;
  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  return clean || fallback;
}

function cleanAvatar(value, fallback = '\u{1F43A}') {
  if (typeof value !== 'string') return fallback;
  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 16);
  return clean || fallback;
}

module.exports = { cleanDisplayName, cleanAvatar };
