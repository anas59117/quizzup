import React from 'react';

const EMBLEMS = new Set(['bronze', 'argent', 'or', 'neon', 'flamme', 'glace', 'arcenciel', 'diamant']);

// Faceted metal and crystal ornaments, shared by cards and compact player avatars.
// Decorative only: the identity name remains the accessible label of its parent.
export function hasEmblem(frame) {
  return EMBLEMS.has(frame);
}

export function IdentityEmblem({ frame, className = '' }) {
  if (!hasEmblem(frame)) return null;
  return <img className={`identity-emblem emblem-${frame} ${className}`.trim()}
    src={`${process.env.PUBLIC_URL || ''}/images/emblems/${frame}.svg`}
    width="160" height="120" alt="" aria-hidden="true" draggable={false} />;
}
