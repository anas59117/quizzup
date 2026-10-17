function cleanDisplayName(value, fallback = 'Player', maxLength = 20) {
  if (typeof value !== 'string') return fallback;
  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
  return clean || fallback;
}

function isPhotoPath(value) {
  return typeof value === 'string' && /^\/profile-photos\/[a-f0-9]{24}-[a-f0-9]{32}\.jpg$/.test(value);
}

function cleanAvatar(value, fallback = '\u{1F43A}') {
  if (typeof value !== 'string') return fallback;
  if (isPhotoPath(value)) return value;
  if (/[/:<>\\]/.test(value)) return fallback;
  const clean = value
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, 16);
  return clean || fallback;
}

module.exports = { cleanDisplayName, cleanAvatar, isPhotoPath };
