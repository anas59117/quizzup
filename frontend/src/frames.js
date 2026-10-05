// Avatar frames sold in the coin shop. Prices mirror backend/shop.js, which is
// the authority (the server re-checks every purchase).
export const FRAMES = [
  { id: 'none', price: 0 },
  { id: 'bronze', price: 150 },
  { id: 'argent', price: 400 },
  { id: 'or', price: 900 },
  { id: 'neon', price: 1200 },
  { id: 'flamme', price: 2000 },
  { id: 'glace', price: 2000 },
  { id: 'arcenciel', price: 3500 },
  { id: 'diamant', price: 6000 },
];

const KNOWN = new Set(FRAMES.map((f) => f.id));

// CSS class for an avatar wearing `frame`; empty when there is none.
export function frameClass(frame) {
  return frame && frame !== 'none' && KNOWN.has(frame) ? ` fr-${frame}` : '';
}

export function frameLabelKey(id) {
  return `frame_${id}`;
}
