// Direction: warm editorial — ivory sheet with one clear choice per row.
// Rules: native buttons, contained keyboard focus and safe-area breathing room.
// Signature: the golden play action opens four honest ways to play.
import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from './i18n';

export function PlaySheet({ onClose, onDuel, onSolo, onInvite, onJoin, pending }) {
  const { lang } = useI18n();
  const fr = lang === 'fr';
  const panel = useRef(null);
  const titleId = useId();
  const closeRef = useRef(onClose); closeRef.current = onClose;
  useEffect(() => {
    const back = event => { event.preventDefault(); closeRef.current(); };
    window.addEventListener('quizzup-play-back', back);
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const siblings = [...document.body.children].filter(child => !child.contains(panel.current));
    const states = siblings.map(child => child.inert);
    siblings.forEach(child => { child.inert = true; });
    panel.current?.querySelector('button')?.focus();
    return () => {
      window.removeEventListener('quizzup-play-back', back);
      document.body.style.overflow = overflow;
      siblings.forEach((child, index) => { child.inert = states[index]; });
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  const keydown = event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
    if (event.key !== 'Tab') return;
    const buttons = [...panel.current.querySelectorAll('button:not(:disabled)')];
    const first = buttons[0], last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  };
  return createPortal(<div className="play-sheet-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={panel} className="play-sheet" role="dialog" aria-modal="true" aria-labelledby={titleId} onKeyDown={keydown}>
      <header><h2 id={titleId}>{fr ? 'On joue ?' : 'Ready to play?'}</h2><button type="button" onClick={onClose} aria-label={fr ? 'Fermer' : 'Close'}>×</button></header>
      <button type="button" disabled={pending} onClick={onDuel}><strong>{fr ? 'Duel rapide' : 'Quick duel'}</strong><small>{fr ? 'Trouver un adversaire' : 'Find an opponent'}</small><span aria-hidden="true">→</span></button>
      <button type="button" disabled={pending} onClick={onSolo}><strong>Solo</strong><small>{fr ? 'Jouer à ton rythme' : 'Play on your own'}</small><span aria-hidden="true">→</span></button>
      <button type="button" disabled={pending} onClick={onInvite}><strong>{fr ? 'Inviter un ami' : 'Invite a friend'}</strong><small>{fr ? 'Créer une partie privée' : 'Create a private game'}</small><span aria-hidden="true">→</span></button>
      <button type="button" disabled={pending} onClick={onJoin}><strong>{fr ? 'J’ai un code' : 'I have a code'}</strong><small>{fr ? 'Rejoindre une partie' : 'Join a game'}</small><span aria-hidden="true">→</span></button>
    </section>
  </div>, document.body);
}
