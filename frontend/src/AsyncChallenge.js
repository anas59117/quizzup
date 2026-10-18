// Direction: glacier duel — dark ink, cold blue, copper feedback.
// Rules: question first, server deadlines, no invented opponent progress.
// Signature: a quiet copper countdown rail above the answer field.
import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from './i18n';
import { Icon } from './ui';
import './async-challenge.css';
import SFX from './sounds';

const COPY = {
 fr: { title:'Chacun son tour', close:'Retour à la conversation', loading:'Reprise de votre défi…', offline:'Connexion interrompue. Votre partie reste enregistrée.', retry:'Reprendre', error:'Impossible de continuer. Réessayez.', question:'Question', score:'Votre score', reading:'Lisez la question', ready:'Préparez-vous', correct:'Bonne réponse', wrong:'La bonne réponse était', points:'points', waiting:'À votre ami de jouer.', waitingHelp:'Votre score est enregistré. Revenez ici lorsque votre ami aura terminé ses six questions.', completed:'Défi terminé', noRewards:'Ce défi amical ne rapporte pas encore d’XP ni de pièces.', you:'Vous', other:'Votre ami', win:'Vous remportez le défi', loss:'Votre ami remporte le défi', tie:'Égalité', pending:'Réponse en cours…', next:'Votre réponse a été enregistrée.', timeout:'Temps écoulé' },
 en: { title:'Take turns', close:'Back to conversation', loading:'Resuming your challenge…', offline:'Connection lost. Your run is saved.', retry:'Resume', error:'We could not continue. Please try again.', question:'Question', score:'Your score', reading:'Read the question', ready:'Get ready', correct:'Correct answer', wrong:'The correct answer was', points:'points', waiting:'Your friend’s turn.', waitingHelp:'Your score is saved. Return here when your friend has finished all six questions.', completed:'Challenge finished', noRewards:'This friendly challenge does not award XP or coins yet.', you:'You', other:'Your friend', win:'You win the challenge', loss:'Your friend wins the challenge', tie:'A tie', pending:'Sending answer…', next:'Your answer was saved.', timeout:'Time is up' }
};
export function AsyncChallenge({ social, challengeId, onClose }) {
 const { lang } = useI18n();
 const c = COPY[lang] || COPY.fr;
 const state = social.asyncRuns?.[challengeId];
 const pending = !!social.asyncPending?.[challengeId];
 const [muted,setMuted] = useState(SFX.muted);
 const [now,setNow] = useState(Date.now());
 const answered = useRef(new Set());
 const showingFeedback = !!state?.feedback && now < state.feedbackUntil;
 const question = showingFeedback ? state.feedbackQuestion : state?.question;
 const dialogRef = useRef(null);
 useEffect(() => { const previous = document.activeElement; dialogRef.current?.querySelector('button')?.focus(); return () => previous?.focus?.(); }, []);
 const round = question?.round;
 useEffect(() => { if (state?.question) answered.current.delete(state.question.round); }, [state?.receivedAt, state?.question]);
 const opensAt = state?.opensAt || 0;
 const deadline = state?.deadline || 0;
 const seconds = Math.max(0, Math.ceil((deadline - Math.max(now,opensAt))/1000));
 const revealAt = opensAt - ((question?.answerStaggerMs ?? 100)*3 + (question?.answerEnterMs ?? 250));
 const revealed = showingFeedback || now >= revealAt;
 const isOpen = !showingFeedback && now >= opensAt && now < deadline;
 useEffect(() => { const timer=setInterval(()=>setNow(Date.now()),80);return()=>clearInterval(timer); },[]);
 useEffect(() => {
  if (!showingFeedback && question && now >= deadline && !pending && social.connected && !answered.current.has(round)) {
   if (social.answerAsyncChallenge(challengeId,round,-1)) answered.current.add(round);
  }
 },[now,deadline,question,pending,social,challengeId,round,showingFeedback]);
 const answer = index => {
  if (!isOpen || pending || answered.current.has(round)) return;
  if (social.answerAsyncChallenge(challengeId,round,index)) answered.current.add(round);
 };
 const resume = () => { answered.current.delete(round); social.playAsyncChallenge(challengeId); };
 const outcomes = state?.result?.outcomes;
 const ownScore = state?.result?.scores?.find(item=>item.id===social.clientId)?.score;
 const otherScore = state?.result?.scores?.find(item=>item.id!==social.clientId)?.score;
 const outcome = (Array.isArray(outcomes) ? outcomes.find(item=>item.id===social.clientId)?.outcome : outcomes?.[social.clientId]) || (ownScore != null && otherScore != null ? ownScore === otherScore ? 'tie' : ownScore > otherScore ? 'win' : 'loss' : null);
 return <section ref={dialogRef} onKeyDown={event => { if (event.key !== "Tab") return; const buttons = [...event.currentTarget.querySelectorAll("button:not(:disabled)")]; const first=buttons[0],last=buttons[buttons.length-1]; if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();} else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();} }} className="async-duel" role="dialog" aria-modal="true" aria-labelledby="async-title">
  <header className="async-header"><button type="button" onClick={onClose} aria-label={c.close} autoFocus>←</button><div><span>{c.title}</span><h2 id="async-title">{question ? `${c.question} ${round+1} / ${question.totalRounds}` : c.title}</h2></div><button className="async-mute" aria-label={muted ? (lang === "fr" ? "Activer le son" : "Enable sound") : (lang === "fr" ? "Couper le son" : "Mute sound")} aria-pressed={muted} onClick={()=>setMuted(SFX.toggle())}><Icon name={muted ? "mute" : "volume"} size={18}/></button><div className="async-score"><small>{c.score}</small><strong>{state?.score ?? '—'}</strong></div></header>
  {!social.connected && <p className="async-notice" role="status">{c.offline}</p>}
  {social.error && <div className="async-notice" role="alert">{c.error}<button onClick={resume}>{c.retry}</button></div>}
  {!state && <p className="async-state" role="status">{c.loading}{!pending && <button onClick={resume}>{c.retry}</button>}</p>}
  {state?.feedback && <div className={`async-feedback ${state.feedback.correct ? 'correct' : ''}`} role="status"><Icon name={state.feedback.correct ? 'check' : 'info'} size={17}/><span>{state.feedback.correct ? c.correct : `${c.wrong} : ${state.feedbackQuestion?.answers?.[state.feedback.correctIndex] || '—'}`} {state.feedback.correct ? ` · +${state.feedback.pointsEarned} ${c.points}` : ''}</span></div>}
  {question && <div className="async-playfield">
   <div className="async-timing"><span>{now < revealAt ? c.reading : now < opensAt ? c.ready : pending ? c.pending : seconds===0 ? c.timeout : `${seconds}s`}</span><div role="progressbar" aria-label={c.ready} aria-valuemin={0} aria-valuemax={10} aria-valuenow={seconds}><i style={{width:`${seconds*10}%`}}/></div></div>
   <h3 className="async-question">{question.question}</h3>
   {question.image && /^https?:\/\/|^\/[^/]/.test(question.image) && <img className="async-question-image" src={question.image} alt=""/>}
   <div className={`async-answers ${question.image ? 'with-images':''}`} aria-hidden={!revealed}>
    {revealed && question.answers.map((item,index)=><button key={`${round}:${index}`} className={showingFeedback && index === state.feedback.correctIndex ? "is-correct" : ""} type="button" style={{'--answer-index':index,'--answer-stagger':`${question.answerStaggerMs ?? 100}ms`,'--answer-enter':`${question.answerEnterMs ?? 250}ms`}} disabled={!isOpen || pending || answered.current.has(round) || !social.connected} onClick={()=>answer(index)}>{typeof item==='object'&&item.image&&/^https?:\/\/|^\/[^/]/.test(item.image)&&<img src={item.image} alt=""/>}<span>{typeof item==='string' ? item : item.text}</span></button>)}
   </div>
  </div>}
  {state?.status==='waiting' && <div className="async-state"><Icon name="check" size={34}/><h3>{c.waiting}</h3><p>{c.waitingHelp}</p><p className="async-rewards">{c.noRewards}</p><button onClick={onClose}>{c.close}</button></div>}
  {state?.status==='completed' && <div className="async-state"><Icon name="trophy" size={38}/><h3>{c[outcome] || c.completed}</h3><div className="async-final-scores">{state.result?.scores?.map(item=><div key={item.id}><span>{item.id===social.clientId ? c.you : c.other}</span><strong>{item.score}</strong></div>)}</div><p className="async-rewards">{c.noRewards}</p><button onClick={onClose}>{c.close}</button></div>}
 </section>;
}
