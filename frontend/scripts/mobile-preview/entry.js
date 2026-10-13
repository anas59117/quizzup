// Local visual-test fixture using the production components; no backend requests.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../src/i18n';
import { GameFeelProvider } from '../../src/GameFeelProvider';
import { QuestionContent } from '../../src/enhanced-QuestionContent';
import { HomeContent, FinishedContent, WaitingContent, ProfileContent, ShopContent, CategoryPreviewContent, RoundIntroContent } from '../../src/screens';
import { NavBar, TopControls, FamilyGrid, CATEGORIES } from '../../src/ui';
import { NotificationContainer } from '../../src/NotificationSystem';
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
if (params.has('long')) question.question = 'Quel dessinateur a illustré « Kraven’s Last Hunt » avec le scénariste J. M. DeMatteis dans les aventures de Spider-Man ?';
if (params.has('photo')) {
  question.question = 'Quel joueur se trouve sur cette photo ?';
  question.image = '/images/players/booba.jpg';
}
function Preview() {
  const [screen, setScreen] = useState(['home', 'profile', 'waiting', 'result', 'shop', 'themes', 'quiz', 'intro'].find(key => params.has(key)) || 'game');
  const [selected, setSelected] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [muted, setMuted] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [solo, setSolo] = useState(false);
  const social = React.useMemo(() => ({ friends: [], requests: [], dms: {}, outgoingRequests: new Set(), gameChat: [], gameChatSeenRef: { current: 0 }, sendGameChat: () => false }), []);
  const opponents = params.has('gameSolo') ? [] : [{ id: '2', name: 'clem10', avatar: 'owl', score: 55, answered: !!reveal?.others, correct: false }];
  if (params.has('group')) opponents.push({ id: '3', name: 'Alex', avatar: '🦊', score: 12 }, { id: '4', name: 'Sam', avatar: '🐼', score: 10 });
  const controls = <TopControls muted={muted} toggleMute={() => setMuted(!muted)} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} playing={screen === 'game'} />;
  const stats = { games: 27, wins: 12, level: 6, xpIntoLevel: 121, xpForLevel: 1200, xp: 2400, coins: 420, topics: [], ownedItems: ['robot','fox'], equippedItems: { avatars: 'fox' } };
  const result = { won: !params.has('loss') && !params.has('tie'), tie: params.has('tie'), solo: params.has('solo'), finalScore: 84, xp: 224, coins: 50, stats,
    topic: { key: 'ligue_champions', level: 3 }, matchTally: { rounds: 6, correct: 5, answered: 6, totalMs: 36000 },
    leaderboard: [{ id: '1', name: 'Sisi', avatar: 'fox', score: 84 }, ...opponents] };
  const play = () => { setSelected(null); setReveal(null); setScreen('game'); };
  const browse = ['home', 'profile', 'shop', 'themes', 'quiz'].includes(screen);
  return <div className={screen === 'home' ? 'app app-top app-nav app-home' : screen === 'game' ? 'app game-bg app-question' : screen === 'result' ? 'app results-bg' : screen === 'waiting' ? 'app game-bg app-matchmaking' : screen === 'intro' ? 'app game-bg' : `app app-top app-nav ${screen === 'quiz' ? 'app-category-preview' : screen === 'shop' ? 'app-shop' : screen === 'profile' ? 'app-profile' : ''}`}>
    {screen !== 'home' && screen !== 'quiz' && controls}
    {screen === 'home' && <HomeContent controls={controls} name="Sisi" avatar="fox" stats={stats} soloMode={solo} setSoloMode={setSolo}
      quickMatch={play} startWithCategory={play} onOpenProfile={() => setScreen('profile')} onSeeAll={() => setScreen('themes')} />}
    {screen === 'profile' && <ProfileContent name="Sisi" avatar="fox" stats={stats} social={social}
      streak={{ streak: 1, calendar: [] }} onSaveProfile={() => {}} onOpenLeaderboard={() => {}} onOpenShop={() => setScreen('shop')} />}
    {screen === 'waiting' && <WaitingContent name="Sisi" avatar="fox" level={6} categoryKey="ligue_champions" onCancel={() => setScreen('home')} onPlaySolo={play} />}
    {screen === 'shop' && <ShopContent name="Sisi" avatar="fox" stats={stats} onBuy={() => {}} onEquip={() => {}} onPlay={play} onBack={() => setScreen('home')} />}
    {screen === 'themes' && <div className="container"><FamilyGrid onSelect={play} /></div>}
    {screen === 'quiz' && <CategoryPreviewContent controls={controls} category={CATEGORIES.find(cat => cat.key === (params.get('topic') || 'rap_fr'))} stats={stats} onBack={() => setScreen('home')} onPlay={play} />}
    {screen === 'intro' && <RoundIntroContent intro={{ round: 1, category: 'Rap Français' }} opponents={opponents} avatar="fox" name="Sisi" level={6} totalRounds={6} />}
    {screen === 'result' && <>
      {!params.has('solo') && <NotificationContainer notifications={[{ id: 1, message: '+20 LP', type: 'success' }]} onDismiss={() => {}} />}
      <FinishedContent result={result} opponents={opponents} myId="1" name="Sisi" avatar="fox" social={social}
        rematch={play} newMatch={play} playAgain={() => setScreen('home')} />
    </>}
    {screen === 'game' && <QuestionContent question={question} timeLeft={9} selected={selected} reveal={reveal}
      answer={idx => { setSelected(idx); setReveal({ yourCorrect: idx === 0, correctIndex: 0, pointsEarned: idx === 0 ? 17 : 0, others: [] }); }}
      opponents={opponents} avatar="fox" name="Sisi" score={reveal?.yourCorrect ? 17 : 0} reportQuestion={() => {}}
      social={social} GameChat={GameChat} />}
    {browse && <NavBar active={screen === 'themes' ? 'categories' : screen} onQuickMatch={play} onNav={setScreen} />}
  </div>;
}
createRoot(document.getElementById('root')).render(<I18nProvider><GameFeelProvider>{params.has('app') ? <App /> : <Preview />}</GameFeelProvider></I18nProvider>);
