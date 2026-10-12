/**
 * Enhanced QuestionContent — drop-in replacement for the one in screens.js
 * Adds: floating points, combo badges, confetti, shake, glow, haptic, opponent pop
 */
import React, { useRef, useCallback } from 'react';
import { useI18n } from './i18n';
import { PlayerHud } from './multiplayer';
import { useGameFeel } from './GameFeelProvider';

export function QuestionContent({ question, timeLeft, reveal, selected, answer, opponents, avatar, frame, name, score, reportQuestion, reported, social, GameChat }) {
  const { t } = useI18n();
  const gf = useGameFeel();
  const buttonRefs = useRef([]);
  const sr = !!reveal;
  // answer_ack = instant feedback (no `others` array yet); full round_result has `others`.
  const isInstantAck = sr && !reveal.others;
  const pct = Math.max(0, Math.min(100, (timeLeft / question.timeLimit) * 100));

  // Enhanced answer handler with game feel
  const handleAnswer = useCallback((idx) => {
    if (question.expired || selected !== null || sr) return;

    const btn = buttonRefs.current[idx];
    const rect = btn ? btn.getBoundingClientRect() : null;

    // Call the original answer function
    answer(idx);

    // We don't know yet if it's correct — the reveal comes from parent.
    // The effect is handled in useEffect below when `reveal` changes.
  }, [answer, question.expired, selected, sr]);

  // Trigger effects when reveal changes
  const prevRevealRef = useRef(null);
  React.useEffect(() => {
    if (reveal && reveal !== prevRevealRef.current) {
      prevRevealRef.current = reveal;

      if (reveal.yourCorrect) {
        const btn = buttonRefs.current[selected];
        const rect = btn ? btn.getBoundingClientRect() : null;
        gf.triggerCorrect(reveal.pointsEarned || 0, rect);
      } else {
        const btn = selected !== null ? buttonRefs.current[selected] : null;
        gf.triggerWrong(btn ? btn.getBoundingClientRect() : null);
      }

      // Opponent "answered" visual pop
      if (opponents.some(o => o.answered)) {
        gf.triggerOpponentAnswer();
      }
    }
  }, [reveal, selected, opponents, gf]);

  // Reset combo when new question starts
  const prevQuestionRef = useRef(null);
  React.useEffect(() => {
    if (question && question !== prevQuestionRef.current) {
      prevQuestionRef.current = question;
      gf.resetCombo();
    }
  }, [question, gf]);

  // Enhanced timer tick sound
  const prevTimeRef = useRef(timeLeft);
  React.useEffect(() => {
    if (timeLeft < prevTimeRef.current && timeLeft > 0 && !sr) {
      gf.triggerTick(timeLeft <= 3);
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft, sr, gf]);

  const ansCls = (idx) => {
    let base = '';
    if (sr && isInstantAck) {
      // Instant ack: only highlight YOUR answer (green/red), others stay neutral
      if (idx === selected) {
        base = reveal.yourCorrect ? 'answer correct' : 'answer wrong';
      } else {
        base = 'answer';
      }
    } else if (sr) {
      // Full reveal: show correct, wrong, dim as before
      base = idx === reveal.correctIndex ? 'answer correct' : idx === selected ? 'answer wrong' : 'answer dim';
    } else {
      base = idx === selected ? 'answer selected' : 'answer';
    }
    // Add animation classes
    if (sr && idx === selected) {
      if (reveal.yourCorrect) base += ' correct-glow';
      else base += ' shake-wrong';
    }
    return base;
  };

  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  const round = question.round || 1;
  const total = question.totalRounds || 10;
  const progressPct = Math.max(0, Math.min(100, (round / total) * 100));

  return (
    <div className="container game game-v4">
      <div className="hud-timer-block">
        <span className="hud-timer-label">{t('time')}</span>
        <span className={`hud-timer ${timeLeft <= 3 && !sr ? 'urgent' : ''}`}>{sr && !isInstantAck ? '\u2713' : timeLeft}</span>
      </div>
      <PlayerHud
        me={{ avatar, frame, name, score }}
        others={opponents}
        revealing={sr}
      />

      {/* Round progress — thin rail + "Question X / Y" (mockup) */}
      <div className="game-progress">
        <div className="game-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <div className="game-progress-text">
        {t('questionLabel')} {round} / {total}
      </div>

      {/* Category tag */}
      {question.category && (
        <div className="game-category">
          <span className="game-cattag">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />
            </svg>
            {question.category}
          </span>
        </div>
      )}

      <div className={`answers-wrapper ${gf.opponentPop ? 'opponent-just-answered' : ''}`}>
        <div className="question-panel">
          <div className="question">{question.question}</div>
          {question.image && (
            <div className="player-photo-wrap">
              <img src={question.image} alt="" className="player-photo" />
              {sr && question.credit && <div className="photo-credit">{question.credit}</div>}
            </div>
          )}
          <div className={`answers ${question.image ? '' : 'single-col'}`}>
            {question.answers.map((a, idx) => (
              <button
                key={idx}
                ref={(el) => { buttonRefs.current[idx] = el; }}
                className={ansCls(idx)}
                onClick={() => handleAnswer(idx)}
                disabled={question.expired || selected !== null || sr}
              >
                <span className="letter" aria-hidden="true">{letters[idx] || idx + 1}</span>
                <span className="answer-text">{a}</span>
              </button>
            ))}
          </div>
          <div className="timer-bar-bottom">
            <div
              className={`timer-bar-fill ${timeLeft <= 3 && !sr ? 'urgent' : ''}`}
              style={{ width: (sr && !isInstantAck) ? '0%' : `${pct}%` }}
            />
          </div>
        </div>
      </div>
      {sr && !isInstantAck && (
        <div className="reveal-note">
          {reveal.yourCorrect
            ? t('ptsEarned', { n: reveal.pointsEarned })
            : reveal.timedOut && selected === null
              ? t('timeUp')
              : t('wrong')}
        </div>
      )}
      {sr && !isInstantAck && (
        <button className="report-btn" onClick={reportQuestion} disabled={reported}>
          {reported ? t('reported') : t('report')}
        </button>
      )}
      <GameChat social={social} />
    </div>
  );
}
