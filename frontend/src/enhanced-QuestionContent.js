/**
 * Enhanced QuestionContent — drop-in replacement for the one in screens.js
 * Adds: floating points, combo badges, confetti, shake, glow, haptic, opponent pop
 */
import React, { useRef, useCallback } from 'react';
import { useI18n } from './i18n';
import { PlayerHud } from './multiplayer';
import { useGameFeel } from './GameFeelProvider';
import { useRoundTiming } from './round-timing';

export function QuestionContent({ question, timeLeft, reveal, selected, answer, opponents = [], avatar, frame, name, score, reportQuestion, reported, social, GameChat }) {
  const { t } = useI18n();
  const gf = useGameFeel();
  const buttonRefs = useRef([]);
  // Ignore a stale previous-round reveal during reconnect/round transitions.
  const round = question.round || 1;
  if (reveal?.round != null && reveal.round !== round) reveal = null;
  const sr = !!reveal;
  // answer_ack = instant feedback (no `others` array yet); full round_result has `others`.
  const isInstantAck = sr && !Array.isArray(reveal.others);
  const timing = useRoundTiming(question, !sr || isInstantAck);
  const ownAnswer = sr && Object.prototype.hasOwnProperty.call(reveal, 'yourAnswer') ? reveal.yourAnswer : selected;
  const pct = Math.max(0, Math.min(100, (timeLeft / question.timeLimit) * 100));

  // Enhanced answer handler with game feel
  const handleAnswer = useCallback((idx) => {
    if (!timing.canAnswer || question.expired || selected !== null || sr) return;

    // Call the original answer function
    answer(idx);

    // We don't know yet if it's correct — the reveal comes from parent.
    // The effect is handled in useEffect below when `reveal` changes.
  }, [answer, timing.canAnswer, question.expired, selected, sr]);

  // Trigger effects when reveal changes
  const roundKey = `${question.round || 1}:${question.question}`;
  const feedbackRoundRef = useRef(null);
  const { triggerCorrect, triggerWrong, triggerOpponentAnswer, resetCombo, triggerTick } = gf;
  React.useEffect(() => {
    if (reveal && feedbackRoundRef.current !== roundKey) {
      feedbackRoundRef.current = roundKey;

      if (reveal.yourCorrect) {
        const btn = buttonRefs.current[ownAnswer];
        const rect = btn ? btn.getBoundingClientRect() : null;
        triggerCorrect(reveal.pointsEarned || 0, rect);
      } else if (!reveal.timedOut || ownAnswer != null) {
        const btn = ownAnswer != null ? buttonRefs.current[ownAnswer] : null;
        triggerWrong(btn ? btn.getBoundingClientRect() : null);
      }

    }
  }, [reveal, ownAnswer, roundKey, triggerCorrect, triggerWrong]);

  // Arrival is independent of your own acknowledgment. Each opponent pops
  // once per round even if the final result repeats the answered flag.
  const opponentAnswersRef = useRef({ roundKey, ids: new Set() });
  React.useEffect(() => {
    if (opponentAnswersRef.current.roundKey !== roundKey) {
      opponentAnswersRef.current = { roundKey, ids: new Set() };
    }
    const arrived = opponents.filter(o => o.answered && !opponentAnswersRef.current.ids.has(o.id));
    if (arrived.length) {
      arrived.forEach(o => opponentAnswersRef.current.ids.add(o.id));
      triggerOpponentAnswer();
    }
  }, [opponents, roundKey, triggerOpponentAnswer]);

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
      if (idx === ownAnswer) {
        base = reveal.yourCorrect ? 'answer correct' : 'answer wrong';
      } else {
        base = 'answer';
      }
    } else if (sr) {
      // Full reveal: show correct, wrong, dim as before
      base = idx === reveal.correctIndex ? 'answer correct' : idx === ownAnswer ? 'answer wrong' : 'answer dim';
    } else {
      base = idx === selected ? 'answer selected' : 'answer';
    }
    // Add animation classes
    if (sr && idx === ownAnswer) {
      if (reveal.yourCorrect) base += ' duel-answer-confirmed';
      else base += ' duel-answer-missed';
    }
    return base;
  };

  const total = question.totalRounds || 10;
  const correctAnswer = sr && !isInstantAck ? question.answers[reveal.correctIndex] : null;
  const maxScore = (Math.max(1, total) + 1) * 20;
  const confirmedScore = Number.isFinite(reveal?.yourScore) ? reveal.yourScore : score;
  const railPlayers = [{ id: 'me', name: t('you'), score: confirmedScore, mine: true }, ...opponents];

  return (
    <div data-round-phase={timing.phase} className={`container game game-v4 duel-premium${opponents.length > 1 ? ' game-v4--group' : ''}${!opponents.length ? ' duel-premium--solo' : ''}${question.image ? ' game-v4--photo' : ''}`}>
      <div className="hud-timer-block">
        <span className="hud-timer-label">{t('time')}</span>
        <span style={{ '--timer-progress': `${pct}%` }} className={`hud-timer ${timeLeft <= 3 && !sr ? 'urgent' : ''}`}>{sr && !isInstantAck ? '\u2713' : timeLeft}</span>
      </div>
      <PlayerHud
        me={{ avatar, frame, name, score: Number.isFinite(reveal?.yourScore) ? reveal.yourScore : score,
          answered: sr ? ownAnswer != null : selected != null, correct: sr ? reveal.yourCorrect : undefined,
          pointsEarned: sr ? reveal.pointsEarned : undefined, maxPoints: question.isBonus ? 40 : 20 }}
        others={opponents}
        revealing={sr && !isInstantAck}
      />

      <div className="duel-arena-stage">
      <div className="duel-score-rails">
        {railPlayers.map((player, index) => <div key={player.id} className={`duel-score-rail ${player.mine ? 'mine' : 'other'}`}
          data-gained={player.mine && sr && reveal.yourCorrect ? 'true' : undefined}
          style={{ '--rail-index': player.mine ? 0 : index - 1 }} role="progressbar"
          aria-label={`${player.name} · ${t('matchScore')}`} aria-valuemin={0} aria-valuemax={maxScore} aria-valuenow={player.score || 0}>
          <span style={{ height: `${Math.min(100, Math.max(0, (player.score || 0) / maxScore * 100))}%` }} />
        </div>)}
      </div>
      {/* The round count carries progression; side rails carry the scores. */}
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
        <div className={`question-panel duel-round-panel${sr && !isInstantAck ? ' is-round-revealed' : ''}`} key={roundKey}>
          <h1 className="question">{question.question}</h1>
          {question.image && (
            <div className="player-photo-wrap">
              <img src={question.image} alt="" className="player-photo" />
              {sr && question.credit && <div className="photo-credit">{question.credit}</div>}
            </div>
          )}
          <div className={`answers ${question.image ? '' : 'single-col'}`}>
            {question.answers.map((a, idx) => {
              const visible = sr || timing.presentationElapsed >= (question.readingMs || 0) + idx * (question.answerStaggerMs || 0);
              const entering = visible && !timing.canAnswer && !sr;
              return (
              <button
                key={idx}
                ref={(el) => { buttonRefs.current[idx] = el; }}
                className={`${ansCls(idx)}${entering ? ' duel-answer-enter' : ''}`}
                style={{ '--answer-order': idx, '--answer-duration': `${question.answerEnterMs || 250}ms`, visibility: visible ? 'visible' : 'hidden' }}
                aria-hidden={!visible}
                onClick={() => handleAnswer(idx)}
                disabled={!timing.canAnswer || question.expired || selected !== null || sr}
              >
                <span className="answer-text">{a}</span>
                {sr && ((isInstantAck && idx === ownAnswer) || (!isInstantAck && (idx === reveal.correctIndex || idx === ownAnswer))) && (
                  <span className="answer-result-icon" aria-label={(!isInstantAck ? idx === reveal.correctIndex : reveal.yourCorrect) ? t('answerCorrect') : t('answerIncorrect')}>
                    {(!isInstantAck ? idx === reveal.correctIndex : reveal.yourCorrect) ? '✓' : '✕'}
                  </span>
                )}
              </button>
            ); })}
          </div>
          <div className="timer-bar-bottom">
            <div
              className={`timer-bar-fill ${timeLeft <= 3 && !sr ? 'urgent' : ''}`}
              style={{ width: (sr && !isInstantAck) ? '0%' : `${pct}%` }}
            />
          </div>
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
