import { useLayoutEffect, useRef } from 'react';

const targets = {
  home: '.home-refined:not(.home-loading)',
  categories: '.themes-refined',
  category_preview: '.category-preview-v4',
  profile: '.pf-v4',
  messages: '.messenger-inbox',
};

// Animate only screen content. Transforming .app would also move its fixed
// navigation and change the containing block of sheets on Safari.
export function useBrowseMotion(stage, family) {
  const previous = useRef(null);
  useLayoutEffect(() => {
    const before = previous.current;
    previous.current = { stage, family };
    if (!before || !targets[stage] || !targets[before.stage]) return undefined;
    if (before.stage === stage && before.family === family) return undefined;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return undefined;
    const target = document.querySelector(targets[stage]);
    if (!target?.animate) return undefined;
    const tokens = getComputedStyle(document.documentElement);
    const enteringQuiz = stage === 'category_preview';
    const familyChange = stage === 'categories' && before.stage === 'categories';
    // Profile and messaging use opacity only: their children can open fixed
    // editors or sheets, which must always keep the viewport as their anchor.
    const shift = enteringQuiz ? 18 : familyChange ? (family ? 14 : -14) : 0;
    const animation = target.animate([
      { opacity: .25, ...(shift ? { transform: `translateX(${shift}px)` } : {}) },
      { opacity: 1, ...(shift ? { transform: 'translateX(0)' } : {}) },
    ], {
      duration: parseFloat(tokens.getPropertyValue(shift ? '--motion-enter' : '--motion-base')) || 200,
      easing: tokens.getPropertyValue('--ease-enter').trim() || 'ease-out',
    });
    return () => animation.cancel();
  }, [stage, family]);
}
