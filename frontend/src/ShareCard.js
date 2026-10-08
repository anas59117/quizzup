/**
 * ShareCard — Génération d'image de victoire partageable
 * Utilise HTML5 Canvas pour créer une image carrée prête pour les réseaux
 */
import React, { useRef, useCallback, useState, useEffect } from 'react';
import { useI18n } from './i18n';
import SFX from './sounds';

export function ShareCard({ result, myName, myAvatar, topicLabel, onClose }) {
  const { t, lang } = useI18n();
  const canvasRef = useRef(null);
  const [generated, setGenerated] = useState(false);
  const [dataUrl, setDataUrl] = useState(null);

  const isWin = result.won;
  const isTie = result.tie;
  const score = result.finalScore || 0;
  const opponentScore = result.leaderboard?.find(p => p.id !== result.myId)?.score || 0;

  const generate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = 1200;
    const H = 1200;
    canvas.width = W;
    canvas.height = H;

    // ─── Background ───
    const grad = ctx.createLinearGradient(0, 0, W, H);
    if (isWin) {
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(0.5, '#16213e');
      grad.addColorStop(1, '#0f3460');
    } else if (isTie) {
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(1, '#2d2d44');
    } else {
      grad.addColorStop(0, '#1a1a2e');
      grad.addColorStop(0.5, '#2e1a1a');
      grad.addColorStop(1, '#4a1c1c');
    }
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Decorative circles
    ctx.beginPath();
    ctx.arc(W * 0.85, H * 0.15, 180, 0, Math.PI * 2);
    ctx.fillStyle = isWin ? 'rgba(46, 204, 113, 0.08)' : 'rgba(231, 76, 60, 0.08)';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W * 0.1, H * 0.85, 220, 0, Math.PI * 2);
    ctx.fillStyle = isWin ? 'rgba(46, 204, 113, 0.05)' : 'rgba(231, 76, 60, 0.05)';
    ctx.fill();

    // ─── Logo ───
    ctx.font = 'bold 64px sans-serif';
    ctx.fillStyle = '#fff';
    ctx.textAlign = 'center';
    ctx.fillText('Quizz', W / 2 - 40, 140);
    ctx.fillStyle = '#ff4d6d';
    ctx.fillText('Up', W / 2 + 110, 140);

    // ─── Result emoji & text ───
    const emoji = isWin ? '🏆' : isTie ? '🤝' : '💥';
    ctx.font = '120px serif';
    ctx.textAlign = 'center';
    ctx.fillText(emoji, W / 2, 320);

    ctx.font = 'bold 72px sans-serif';
    ctx.fillStyle = '#fff';
    const resultText = isWin
      ? (lang === 'en' ? 'VICTORY!' : 'VICTOIRE !')
      : isTie
        ? (lang === 'en' ? 'DRAW' : 'ÉGALITÉ')
        : (lang === 'en' ? 'DEFEAT' : 'DÉFAITE');
    ctx.fillText(resultText, W / 2, 440);

    // ─── Score box ───
    const boxY = 520;
    const boxH = 200;
    const boxPad = 60;
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.beginPath();
    ctx.roundRect(boxPad, boxY, W - boxPad * 2, boxH, 24);
    ctx.fill();

    // Score numbers
    ctx.textAlign = 'center';
    ctx.font = 'bold 96px sans-serif';
    ctx.fillStyle = isWin ? '#2ecc71' : '#fff';
    ctx.fillText(String(score), W / 2 - 180, boxY + 125);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('VS', W / 2, boxY + 110);
    ctx.font = 'bold 96px sans-serif';
    ctx.fillStyle = !isWin && !isTie ? '#e74c3c' : '#fff';
    ctx.fillText(String(opponentScore), W / 2 + 180, boxY + 125);

    // Labels
    ctx.font = '32px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(myName || 'You', W / 2 - 180, boxY + 165);
    ctx.fillText(t('opponent'), W / 2 + 180, boxY + 165);

    // ─── Topic ───
    ctx.font = 'italic 40px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillText(topicLabel || 'Quiz', W / 2, 800);

    // ─── Avatar circle ───
    ctx.beginPath();
    ctx.arc(W / 2, 920, 80, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.font = '80px serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(myAvatar || '👤', W / 2, 950);

    // ─── CTA ───
    ctx.font = 'bold 44px sans-serif';
    ctx.fillStyle = '#ff8fa3';
    const cta = lang === 'en' ? 'Can you beat me?' : 'Peux-tu me battre ?';
    ctx.fillText(cta, W / 2, 1080);

    // ─── URL ───
    ctx.font = '28px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText('quizzup-ten.vercel.app', W / 2, 1140);

    const url = canvas.toDataURL('image/png');
    setDataUrl(url);
    setGenerated(true);
    SFX.select();
  }, [isWin, isTie, score, opponentScore, myName, myAvatar, topicLabel, lang, t]);

  useEffect(() => {
    // Auto-generate on mount
    const t = setTimeout(generate, 300);
    return () => clearTimeout(t);
  }, [generate]);

  const handleShare = async () => {
    if (!dataUrl) return;
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'quizzup-result.png', { type: 'image/png' });

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'QuizzUp Result',
          text: isWin ? `I won ${score}-${opponentScore} on QuizzUp! Can you beat me?` : `I played QuizzUp — can you beat me?`,
        });
      } catch {
        // User cancelled
      }
    } else {
      // Fallback: download
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'quizzup-result.png';
      a.click();
    }
  };

  const handleCopy = async () => {
    const text = isWin
      ? `🏆 ${score}-${opponentScore} victory on QuizzUp! Theme: ${topicLabel}. Can you beat me? https://quizzup-ten.vercel.app`
      : `I just played QuizzUp on ${topicLabel}! Challenge me: https://quizzup-ten.vercel.app`;
    try {
      await navigator.clipboard.writeText(text);
      SFX.select();
    } catch {}
  };

  return (
    <div className="share-overlay" onClick={onClose}>
      <div className="share-card" onClick={(e) => e.stopPropagation()}>
        <h3 className="share-title">{t('shareTitle')}</h3>
        <canvas
          ref={canvasRef}
          className="share-canvas"
          style={{ width: '100%', maxWidth: 360, aspectRatio: '1', borderRadius: 16 }}
        />
        {!generated && <div className="share-loading">{t('shareGenerating')}</div>}

        <div className="share-actions">
          <button className="share-btn primary" onClick={handleShare} disabled={!generated}>
            📤 {t('shareImage')}
          </button>
          <button className="share-btn secondary" onClick={handleCopy} disabled={!generated}>
            📋 {t('shareCopy')}
          </button>
          <button className="share-btn ghost" onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
