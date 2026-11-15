import React, {useEffect, useMemo, useState} from 'react';
import {useI18n} from './i18n';
import {Icon} from './ui';

const COPY = {
  fr: {level:'Niveau QuizzUp',next:'Prochain niveau',help:'Comprendre les niveaux',progress:'Ta progression',moving:'Tu progresses !',reached:n=>`Niveau ${n} atteint !`,rule:'Termine des parties pour progresser. Les bonnes réponses et les victoires te font avancer plus vite.',global:'Ton niveau QuizzUp représente ton expérience sur toute l’app. Chaque quiz a aussi son propre niveau.',detail:'Points d’expérience dans ce niveau',posts:'Mes publications',postsEmpty:'Tes publications apparaîtront ici.',addFriend:'Ajouter un ami',code:'Code de ton ami',myCode:'Mon code ami',sent:'Demande envoyée',rejected:'Cette demande n’a pas pu être envoyée. Vérifie le code de ton ami.',offline:'Connexion indisponible. Ton code est conservé.',pending:'Envoi en cours…',allFriends:'Voir tous',lessFriends:'Réduire',perTopic:'Ton niveau dans chaque quiz'},
  en: {level:'QuizzUp level',next:'Next level',help:'How levels work',progress:'Your progress',moving:'You’re making progress!',reached:n=>`Level ${n} reached!`,rule:'Finish games to make progress. Correct answers and wins help you advance faster.',global:'Your QuizzUp level represents your experience across the app. Each quiz also has its own level.',detail:'Experience points within this level',posts:'My posts',postsEmpty:'Your posts will appear here.',addFriend:'Add a friend',code:"Your friend’s code",myCode:'My friend code',sent:'Request sent',rejected:'The request could not be sent. Check your friend’s code.',offline:'Connection unavailable. Your code is saved.',pending:'Sending…',allFriends:'See all',lessFriends:'Show less',perTopic:'Your level in each quiz'},
  es: {level:'Nivel QuizzUp',next:'Siguiente nivel',help:'Cómo funcionan los niveles',progress:'Tu progreso',moving:'¡Estás progresando!',reached:n=>`¡Nivel ${n} alcanzado!`,rule:'Termina partidas para progresar. Las respuestas correctas y las victorias te ayudan a avanzar más rápido.',global:'Tu nivel QuizzUp representa tu experiencia en toda la app. Cada quiz también tiene su propio nivel.',detail:'Puntos de experiencia en este nivel',posts:'Mis publicaciones',postsEmpty:'Tus publicaciones aparecerán aquí.',addFriend:'Añadir un amigo',code:'Código de tu amigo',myCode:'Mi código de amigo',sent:'Solicitud enviada',rejected:'No se pudo enviar la solicitud. Comprueba el código de tu amigo.',offline:'Conexión no disponible. Tu código se conserva.',pending:'Enviando…',allFriends:'Ver todos',lessFriends:'Ver menos',perTopic:'Tu nivel en cada quiz'},
};
export const profileCopy = lang => COPY[lang] || COPY.en;
const snapshot = stats => {
  const level = Math.max(1, Math.floor(Number(stats?.level) || 1));
  const goal = Math.max(0, Number(stats?.xpForLevel) || 0);
  const value = Math.max(0, Math.min(goal, Number(stats?.xpIntoLevel) || 0));
  return {level,goal,value,fraction:goal ? value/goal : 0};
};

export function PlayerProgress({stats, before, result=false, earned=0}) {
  const {lang}=useI18n(), copy=profileCopy(lang);
  const after=useMemo(()=>snapshot(stats),[stats]);
  const start=useMemo(()=>snapshot(before || stats),[before,stats]);
  const [display,setDisplay]=useState(start);
  const crossed=!!before && after.level>start.level;
  useEffect(()=>{
    const final=after, initial=start;
    if(!result || !before || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches){setDisplay(final);return;}
    setDisplay(initial);
    const timers=[];
    if(final.level>initial.level){
      timers.push(setTimeout(()=>setDisplay({...initial,fraction:1}),100));
      timers.push(setTimeout(()=>setDisplay({...final,fraction:0}),800));
      timers.push(setTimeout(()=>setDisplay(final),950));
    }else timers.push(setTimeout(()=>setDisplay(final),100));
    return ()=>timers.forEach(clearTimeout);
  },[result,before,after,start]);
  return <div className={`player-progression${result?' player-progression--result':''}`}>
    <div className="progression-main">
      {result && <p className="progression-feedback" role="status">{crossed?copy.reached(after.level):earned>0?copy.moving:copy.progress}</p>}
      <div className="progression-labels"><strong>{copy.level} {display.level}</strong><span>{copy.next} {display.level+1}</span></div>
      <progress key={display.level} aria-label={`${copy.level} ${display.level} · ${copy.next} ${display.level+1}`} value={display.fraction} max={1} />
    </div>
    <details className="progression-info"><summary><Icon name="info" size={17}/><span>{copy.help}</span></summary>
      <div className="progression-help-panel"><p>{copy.rule}</p><p>{copy.global}</p>
      {after.goal>0 && <p>{copy.detail} : {after.value.toLocaleString(lang)} / {after.goal.toLocaleString(lang)}</p>}</div>
    </details>
  </div>;
}
