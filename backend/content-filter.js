// Deterministic baseline for public text. Whole words avoid substring false
// positives; normalization catches common accent/zero-width/leet evasion.
const denied = /\b(?:fuck(?:ing|er|ers)?|motherfucker|cunt|nigger|nigga|faggot|connard|connasse|encule|enculer|salope|pute)\b|\bva\s+te\s+faire\s+foutre\b/i;
function contentAllowed(value) {
  if (typeof value !== 'string') return true;
  const normalized = value.normalize('NFKD').replace(/[\u0300-\u036f\u200b-\u200f\ufeff]/g, '').toLowerCase()
    .replace(/[13405@$]/g, c => ({ 1: 'i', 3: 'e', 4: 'a', 0: 'o', 5: 's', '@': 'a', '$': 's' })[c]);
  return !denied.test(normalized);
}
module.exports = { contentAllowed };
