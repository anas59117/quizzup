// Direction: warm editorial — ivory sheet with one clear choice per row.
// Rules: native buttons, contained keyboard focus and safe-area breathing room.
// Signature: the golden play action opens four honest ways to play.
import React, { useEffect, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { useI18n } from './i18n';

export function PlaySheet({ onClose, onDuel, onSolo, onInvite, onJoin, pending }) {
  const { t } = useI18n();
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
      <header><h2 id={titleId}>{t('readyToPlay')}</h2><button type="button" onClick={onClose} aria-label={t('closeLabel')}>×</button></header>
      <button type="button" disabled={pending} onClick={onDuel}><strong>{t('quickDuel')}</strong><small>{t('findOpponent')}</small><span aria-hidden="true">→</span></button>
      <button type="button" disabled={pending} onClick={onSolo}><strong>Solo</strong><small>{t('playOwnPace')}</small><span aria-hidden="true">→</span></button>
      <button type="button" disabled={pending} onClick={onInvite}><strong>{t('inviteFriend')}</strong><small>{t('createPrivateGame')}</small><span aria-hidden="true">→</span></button>
      <button type="button" disabled={pending} onClick={onJoin}><strong>{t('haveFriendCode')}</strong><small>{t('joinGameLabel')}</small><span aria-hidden="true">→</span></button>
    </section>
  </div>, document.body);
}
