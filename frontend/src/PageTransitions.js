/**
 * PageTransitions — Wrapper d'animations morphing entre les pages
 * Utilise CSS transitions (pas de dépendance externe)
 */
import React, { useRef, useEffect, useState } from 'react';

const STAGE_DIRECTION = {
  'home': 0,
  'enter-code': 1,
  'categories': 1,
  'shop': 1,
  'profile': 1,
  'leaderboard': 1,
  'feed': 1,
  'waiting': 2,
  'round-intro': 3,
  'question': 3,
  'finished': 4,
  'join': -1,
};

export function PageTransition({ stage, children, prevStage }) {
  const [displayStage, setDisplayStage] = useState(stage);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState('in');
  const prevRef = useRef(stage);

  useEffect(() => {
    if (stage !== prevRef.current) {
      const prev = prevRef.current;
      const prevDepth = STAGE_DIRECTION[prev] ?? 0;
      const nextDepth = STAGE_DIRECTION[stage] ?? 0;
      const dir = nextDepth > prevDepth ? 'forward' : 'back';

      setDirection(dir);
      setAnimating(true);

      // Small delay for exit animation
      const t = setTimeout(() => {
        setDisplayStage(stage);
        prevRef.current = stage;
        // Keep animating for enter animation
        const t2 = setTimeout(() => setAnimating(false), 400);
        return () => clearTimeout(t2);
      }, 200);

      return () => clearTimeout(t);
    }
  }, [stage]);

  const getClassName = () => {
    let base = 'page-transition-container';
    if (animating) {
      base += direction === 'forward' ? ' pt-exit-forward' : ' pt-exit-back';
    } else {
      base += direction === 'forward' ? ' pt-enter-forward' : ' pt-enter-back';
    }
    // Special zoom transition for home → game
    if ((prevRef.current === 'home' || prevRef.current === 'categories') &&
        (stage === 'waiting' || stage === 'round-intro')) {
      base += ' pt-zoom-game';
    }
    // Special zoom for game → home
    if ((prevRef.current === 'finished' || prevRef.current === 'question') &&
        stage === 'home') {
      base += ' pt-zoom-home';
    }
    return base;
  };

  return (
    <div className={getClassName()}>
      {children}
    </div>
  );
}

export function CardZoomTransition({ active, children }) {
  return (
    <div className={`card-zoom-wrap ${active ? 'zoomed' : ''}`}>
      {children}
    </div>
  );
}
