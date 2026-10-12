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

    // Call the original answer function
    answer(idx);

    // We don't know yet if it's correct — the reveal comes from parent.
    // The effect is handled in useEffect below when `reveal` changes.
  }, [answer, question.expired, selected, sr]);

  // Trigger effects when reveal changes
  const roundKey = `${question.round || 1}:${question.question}`;
  const feedbackRoundRef = useRef(null);
  const { triggerCorrect, triggerWrong, triggerOpponentAnswer, resetCombo, triggerTick } = gf;
  React.useEffect(() => {
    if (reveal && feedbackRoundRef.current !== roundKey) {
      feedbackRoundRef.current = roundKey;

      if (reveal.yourCorrect) {
        const btn = buttonRefs.current[selected];
        const rect = btn ? btn.getBoundingClientRect() : null;
        triggerCorrect(reveal.pointsEarned || 0, rect);
      } else {
        const btn = selected !== null ? buttonRefs.current[selected] : null;
        triggerWrong(btn ? btn.getBoundingClientRect() : null);
      }

      // Opponent "answered" visual pop
      if (opponents.some(o => o.answered)) {
        triggerOpponentAnswer();
      }
    }
  }, [reveal, selected, opponents, roundKey, triggerCorrect, triggerWrong, triggerOpponentAnswer]);

  // Reset combo when new question starts
  React.useEffect(() => {
    resetCombo();
  }, [roundKey, resetCombo]);

  // Enhanced timer tick sound
  const prevTimeRef = useRef(timeLeft);
  React.useEffect(() => {
    if (timeLeft < prevTimeRef.current && timeLeft > 0 && !sr) {
      triggerTick(timeLeft <= 3);
    }
    prevTimeRef.current = timeLeft;
  }, [timeLeft, sr, triggerTick]);

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
  const correctAnswer = sr && !isInstantAck ? question.answers[reveal.correctIndex] : null;

  return (
    <div className={`container game game-v4${opponents.length > 1 ? ' game-v4--group' : ''}${question.image ? ' game-v4--photo' : ''}`}>
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
      <div className="game-round-meta">
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
      </div>

      <div className={`answers-wrapper ${gf.opponentPop ? 'opponent-just-answered' : ''}`}>
        <div className="question-panel">
          <h1 className="question">{question.question}</h1>
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
                {sr && ((isInstantAck && idx === selected) || (!isInstantAck && (idx === reveal.correctIndex || idx === selected))) && (
                  <span className="answer-result-icon" aria-label={(!isInstantAck ? idx === reveal.correctIndex : reveal.yourCorrect) ? t('answerCorrect') : t('answerIncorrect')}>
                    {(!isInstantAck ? idx === reveal.correctIndex : reveal.yourCorrect) ? '✓' : '✕'}
                  </span>
                )}
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
      <div className="game-footer">
      <div className={`reveal-note mobile-answer-feedback${sr ? (reveal.yourCorrect ? ' is-correct' : ' is-wrong') : ''}`} role="status" aria-live="polite" aria-atomic="true">
        {sr ? <>
          <strong>{reveal.yourCorrect ? t('answerCorrect') : reveal.timedOut && selected === null ? t('timeUp') : t('answerIncorrect')}</strong>
          {reveal.yourCorrect && <span>{t('ptsEarned', { n: reveal.pointsEarned || 0 })}</span>}
          {!reveal.yourCorrect && correctAnswer != null && <span>{t('answerWas', { answer: correctAnswer })}</span>}
        </> : selected !== null ? t('answerWaiting') : null}
      </div>
      {sr && !isInstantAck && (
        <button className="report-btn" onClick={reportQuestion} disabled={reported}>
          {reported ? t('reported') : t('report')}
        </button>
      )}
      <GameChat social={social} />
      </div>
    </div>
  );
}
