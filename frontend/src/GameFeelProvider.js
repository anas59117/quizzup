/**
 * QuizzUp Game Feel Provider — Context React
 * Drop-in : importe ce fichier et entoure <App /> avec <GameFeelProvider>
 */
import React, { createContext, useContext, useRef, useCallback, useState, useEffect, useMemo } from 'react';
import SFX from './sounds'; // le son existant

const GameFeelContext = createContext(null);

// ─── Haptic helper ───
function vibrate(pattern) {
  if (!navigator.vibrate) return;
  try { navigator.vibrate(pattern); } catch (e) {}
}

// ─── Combo thresholds ───
const COMBO_LEVELS = [3, 5, 7, 10];

export function GameFeelProvider({ children }) {
  const [comboState, setComboState] = useState({ streak: 0, level: 0 });
  const [floatingPoints, setFloatingPoints] = useState([]);
  const [comboBadge, setComboBadge] = useState(null);
  const [shakeTarget, setShakeTarget] = useState(null);
  const [glowTarget, setGlowTarget] = useState(null);
  const [confettiOrigin, setConfettiOrigin] = useState(null);
  const [opponentPop, setOpponentPop] = useState(false);
  const idRef = useRef(0);

  // Cleanup floating points auto-remove
  useEffect(() => {
    if (!floatingPoints.length) return;
    const t = setTimeout(() => {
      setFloatingPoints((prev) => prev.slice(1));
    }, 900);
    return () => clearTimeout(t);
  }, [floatingPoints]);

  // Cleanup combo badge
  useEffect(() => {
    if (!comboBadge) return;
    const t = setTimeout(() => setComboBadge(null), 2000);
    return () => clearTimeout(t);
  }, [comboBadge]);

  // Cleanup shake
  useEffect(() => {
    if (!shakeTarget) return;
    const t = setTimeout(() => setShakeTarget(null), 600);
    return () => clearTimeout(t);
  }, [shakeTarget]);

  // Cleanup glow
  useEffect(() => {
    if (!glowTarget) return;
    const t = setTimeout(() => setGlowTarget(null), 700);
    return () => clearTimeout(t);
  }, [glowTarget]);

  // Cleanup confetti
  useEffect(() => {
    if (!confettiOrigin) return;
    const t = setTimeout(() => setConfettiOrigin(null), 1200);
    return () => clearTimeout(t);
  }, [confettiOrigin]);

  // Cleanup opponent pop
  useEffect(() => {
    if (!opponentPop) return;
    const t = setTimeout(() => setOpponentPop(false), 500);
    return () => clearTimeout(t);
  }, [opponentPop]);

  const addFloatingPoint = useCallback((points, rect, isNegative = false) => {
    const id = ++idRef.current;
    setFloatingPoints((prev) => [
      ...prev,
      {
        id,
        text: isNegative ? `${points}` : `+${points} pts`,
        x: rect ? rect.left + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.top + rect.height / 2 : window.innerHeight / 2,
        isNegative,
      },
    ]);
  }, []);

  const triggerCorrect = useCallback((points, buttonRect) => {
    SFX.correct();
    vibrate([15, 40, 15]);
    addFloatingPoint(points, buttonRect, false);
    setGlowTarget(Date.now());
    setConfettiOrigin(Date.now());

    // Combo logic
    setComboState((prev) => {
      const streak = prev.streak + 1;
      let level = 0;
      for (let i = COMBO_LEVELS.length - 1; i >= 0; i--) {
        if (streak >= COMBO_LEVELS[i]) { level = i + 1; break; }
      }
      if (level > 0) {
        const labels = ['', 'x2 COMBO', 'x3 COMBO', 'MEGA COMBO', 'LEGENDARY'];
        setComboBadge({ level, label: labels[level] || `x${streak} COMBO` });
        SFX.bonusIntro?.() || SFX.correct();
        vibrate([10, 30, 10, 30, 20]);
      }
      return { streak, level };
    });
  }, [addFloatingPoint]);

  const triggerWrong = useCallback((buttonRect) => {
    SFX.wrong();
    vibrate([30, 20, 30]);
    setShakeTarget(Date.now());
    setComboState({ streak: 0, level: 0 });
  }, []);

  const triggerOpponentAnswer = useCallback(() => {
    setOpponentPop(true);
  }, []);

  const triggerTick = useCallback((urgent) => {
    SFX.tick(urgent);
    if (urgent) vibrate(5);
  }, []);

  const resetCombo = useCallback(() => {
    setComboState({ streak: 0, level: 0 });
  }, []);

  const value = {
    comboState,
    floatingPoints,
    comboBadge,
    shakeTarget,
    glowTarget,
    confettiOrigin,
    opponentPop,
    triggerCorrect,
    triggerWrong,
    triggerOpponentAnswer,
    triggerTick,
    resetCombo,
    addFloatingPoint,
  };

  return (
    <GameFeelContext.Provider value={value}>
      {children}
      {/* Global floating points layer */}
      <div className="qu-float-layer">
        {floatingPoints.map((fp) => (
          <div
            key={fp.id}
            className={`qu-float-point-global ${fp.isNegative ? 'qu-negative' : ''}`}
            style={{ left: fp.x, top: fp.y }}
          >
            {fp.text}
          </div>
        ))}
      </div>
      {/* Global combo badge */}
      {comboBadge && (
        <div className="qu-combo-layer">
          <div className="qu-combo-badge-global">{comboBadge.label}</div>
        </div>
      )}
      {/* Global confetti */}
      {confettiOrigin && <ConfettiBurst key={confettiOrigin} />}
    </GameFeelContext.Provider>
  );
}

function ConfettiBurst() {
  const pieces = useMemo(() => {
    const colors = ['#ff4d6d', '#2ecc71', '#f1c40f', '#3498db', '#9b59b6', '#ff8fa3'];
    return Array.from({ length: 8 }).map((_, i) => ({
      id: i,
      color: colors[Math.floor(Math.random() * colors.length)],
      x: (Math.random() - 0.5) * 120,
      y: -(Math.random() * 60 + 40),
      rot: Math.random() * 720,
      delay: Math.random() * 0.15,
    }));
  }, []);

  return (
    <div className="qu-confetti-layer">
      {pieces.map((p) => (
        <div
          key={p.id}
          className="qu-confetti-piece-global"
          style={{
            backgroundColor: p.color,
            transform: `translate(${p.x}px, ${p.y}px) rotate(${p.rot}deg)`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  );
}

export function useGameFeel() {
  const ctx = useContext(GameFeelContext);
  if (!ctx) throw new Error('useGameFeel must be inside GameFeelProvider');
  return ctx;
}


