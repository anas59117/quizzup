// Local visual-test fixture using the production components; no backend requests.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../src/i18n';
import { GameFeelProvider } from '../../src/GameFeelProvider';
import { QuestionContent } from '../../src/enhanced-QuestionContent';
import { HomeContent, FinishedContent, WaitingContent, ProfileContent, ShopContent, CategoryPreviewContent, RoundIntroContent, CategoriesContent } from '../../src/screens';
import { Messenger } from '../../src/Messenger';
import { NavBar, TopControls, CATEGORIES, useTheme } from '../../src/ui';
import { useBrowseMotion } from '../../src/useBrowseMotion';

import { GameChat } from '../../src/social';
import SFX from '../../src/sounds';
import App from '../../src/App';
if (!SFX.muted) SFX.toggle();
const params = new URLSearchParams(location.search);
localStorage.setItem('quizzup-lang', params.has('en') ? 'en' : 'fr');
const question = {
  question: 'Dans « Spider-Man 2099 », quelle est la profession de Miguel O’Hara ?',
  answers: ['Généticien', 'Policier', 'Avocat', 'Photographe'],
  category: 'Spider-Man', timeLimit: 10, round: 3, totalRounds: 6,
};
if (params.has('timed')) Object.assign(question, { readingMs: 1500, answerStaggerMs: 100, answerEnterMs: 250, presentationElapsedMs: 0, answerOpensInMs: 2050, remainingMs: 10000 });
if (params.has('long')) question.question = 'Quel dessinateur a illustré « Kraven’s Last Hunt » avec le scénariste J. M. DeMatteis dans les aventures de Spider-Man ?';
if (params.has('photo')) {
  question.question = 'Quel joueur se trouve sur cette photo ?';
  question.image = '/images/players/booba.jpg';
}
function Preview() {
  const [screen, setScreen] = useState(['home', 'profile', 'waiting', 'result', 'shop', 'themes', 'quiz', 'intro', 'messages'].find(key => params.has(key)) || 'game');
  const [selected, setSelected] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [muted, setMuted] = useState(true);
  const [theme, toggleTheme] = useTheme();
  const [solo, setSolo] = useState(false);
  const [family, setFamily] = useState(null);
  const [topic, setTopic] = useState(params.get('topic') || 'rap_fr');
  const openTopic = key => { setTopic(key); setScreen('quiz'); };
  useBrowseMotion(screen === 'themes' ? 'categories' : screen === 'quiz' ? 'category_preview' : screen, family);
  const [peer, setPeer] = useState(null);
  const [googleLinked, setGoogleLinked] = useState(params.has('linked'));
  const social = React.useMemo(() => ({ friends: [], requests: [], dms: {}, outgoingRequests: new Set(), gameChat: [], gameChatSeenRef: { current: 0 }, sendGameChat: () => false }), []);
  const opponents = params.has('gameSolo') ? [] : [{ id: '2', name: 'clem10', avatar: 'owl', score: 55, answered: !!reveal?.others, correct: false }];
  if (params.has('group')) opponents.push({ id: '3', name: 'Alex', avatar: '🦊', score: 12 }, { id: '4', name: 'Sam', avatar: '🐼', score: 10 });
  const controls = <TopControls muted={muted} toggleMute={() => setMuted(!muted)} theme={theme} toggleTheme={toggleTheme} playing={screen === 'game'} home={['home','themes','profile'].includes(screen)} />;
  const stats = { games: 27, wins: 12, level: 6, xpIntoLevel: 121, xpForLevel: 1200, xp: 2400, coins: 420, topics: params.has('personal') ? [{key:'ligue_champions',level:8},{key:'rap_fr',level:5},{key:'harry_potter',level:3},{key:'minecraft',level:2}] : [], followedThemes: params.has('personal') ? ['ligue_champions','rap_fr','harry_potter','minecraft'] : [], ownedItems: ['robot','fox'], equippedItems: { avatars: 'fox' } };
  const result = { won: !params.has('loss') && !params.has('tie'), tie: params.has('tie'), solo: params.has('solo'), finalScore: 84, xp: 224, coins: 50, stats,
    topic: { key: 'ligue_champions', level: 3 }, matchTally: { rounds: 6, correct: 5, answered: 6, totalMs: 36000 },
    leaderboard: [{ id: '1', name: 'Sisi', avatar: 'fox', score: 84 }, ...opponents] };
  const play = () => { setSelected(null); setReveal(null); setScreen('game'); };
  const browse = ['home', 'profile', 'shop', 'themes', 'quiz', 'messages'].includes(screen) && !peer;
  const previewFriends = params.has('populated') ? [{id:'friend-1',name:'Camille',avatar:'fox',online:true},{id:'friend-2',name:'Nadia',avatar:'owl',online:false},{id:'friend-3',name:'Alex',avatar:'robot',online:false}] : [];
  const previewMessages = previewFriends.length ? { ...social, friends: previewFriends, conversations: previewFriends.map((person,index)=>({peer:person,unread:index===0?2:0,lastMessage:{kind:'text',text:['Une revanche sur le ciné ?','On joue ce soir ?','Bien joué pour le dernier duel !'][index],createdAt:'2026-10-19T11:30:00Z'}})),messages:{'friend-1':[{id:'sample',fromId:'friend-1',kind:'text',text:'Une revanche sur le ciné ?',createdAt:'2026-10-19T11:30:00Z'}]}} : {...social,messages:{},conversations:[]};
  return <div className={screen === 'home' ? 'app app-top app-nav app-home' : screen === 'messages' ? `app app-messenger${!peer?' app-nav messenger-inbox-nav':''}` : screen === 'game' ? 'app game-bg app-question' : screen === 'result' ? 'app results-bg' : screen === 'waiting' ? 'app game-bg app-matchmaking' : screen === 'intro' ? 'app game-bg' : `app app-top app-nav ${screen === 'quiz' ? 'app-category-preview' : screen === 'shop' ? 'app-shop' : screen === 'profile' ? 'app-profile' : screen === 'themes' ? 'app-themes' : ''}`}>
    {!['home','quiz','profile','shop','themes','messages'].includes(screen) && controls}
    {screen === 'home' && <HomeContent controls={controls} name="Sisi" avatar="fox" stats={stats} soloMode={solo} setSoloMode={setSolo}
      quickMatch={play} startWithCategory={openTopic} onOpenProfile={() => setScreen('profile')} onSeeAll={() => setScreen('themes')} />}
    {screen === 'profile' && <ProfileContent controls={controls} name="Sisi" avatar="fox" stats={stats} social={social} clientId="preview-self" isGoogleLinked={googleLinked} googleEmail="sisi@example.test" linkGoogle={()=>setGoogleLinked(true)}
      streak={{ streak: 1, calendar: [] }} onSaveProfile={() => {}} onOpenLeaderboard={() => {}} onOpenShop={() => setScreen('shop')} />}
    {screen === 'waiting' && <WaitingContent name="Sisi" avatar="fox" level={6} categoryKey="ligue_champions" onCancel={() => setScreen('home')} onPlaySolo={play} />}
    {screen === 'shop' && <ShopContent controls={controls} name="Sisi" avatar="fox" stats={stats} onBuy={() => {}} onEquip={() => {}} onPlay={play} onBack={() => setScreen('home')} />}
    {screen === 'themes' && <CategoriesContent controls={controls} family={family} onSelectFamily={setFamily} onBack={()=>setScreen('home')} startWithCategory={openTopic} />}
    {screen === 'messages' && <Messenger social={{...previewMessages,activeConversationId:peer,activeAsyncChallengeId:params.has('async')?'preview-async':null,asyncRuns:{'preview-async':{status:'waiting',score:84}},playAsyncChallenge:()=>{},closeAsyncChallenge:()=>{},connected:true,clientId:'me',requestConversations:()=>{},closeConversation:()=>setPeer(null),openConversation:setPeer,requestHistory:()=>{},sendDM:()=>false}} onBack={()=>setScreen('home')} onInviteFriend={play} onJoinFriend={play} />}
    {screen === 'quiz' && <CategoryPreviewContent controls={controls} category={CATEGORIES.find(cat => cat.key === topic)} stats={stats} onBack={() => setScreen('home')} onPlay={play} />}
    {screen === 'intro' && <RoundIntroContent intro={{ round: Number(params.get('round')) || 1, category: 'Rap Français', icon: '🏆' }} opponents={opponents} avatar="fox" name="Sisi" level={6} totalRounds={6} />}
    {screen === 'result' && <>

      <FinishedContent result={result} opponents={opponents} myId="1" name="Sisi" avatar="fox" social={social}
        leagueAward={params.has('solo') || params.has('tie') ? null : { lpChange: params.has('loss') ? -20 : 25 }} notices={[{id: 1, message: '4 jours de suite ! Reviens demain pour continuer.'}]} rematch={play} newMatch={play} playAgain={() => setScreen('home')} />
    </>}
    {screen === 'game' && <QuestionContent question={question} timeLeft={9} selected={selected} reveal={reveal}
      answer={idx => { setSelected(idx); setReveal({ yourCorrect: idx === 0, correctIndex: 0, pointsEarned: idx === 0 ? 17 : 0, others: [] }); }}
      opponents={opponents} avatar="fox" name="Sisi" score={reveal?.yourCorrect ? 17 : 0} reportQuestion={() => {}}
      social={social} GameChat={GameChat} />}
    {browse && <NavBar active={screen === 'themes' ? 'categories' : screen} onQuickMatch={play} onNav={next=>setScreen(next === 'categories' ? 'themes' : next)} />}
  </div>;
}
createRoot(document.getElementById('root')).render(<I18nProvider><GameFeelProvider>{params.has('app') ? <App /> : <Preview />}</GameFeelProvider></I18nProvider>);
