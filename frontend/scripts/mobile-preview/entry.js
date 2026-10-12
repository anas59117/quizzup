// Local visual-test fixture using the production components; no backend requests.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { I18nProvider } from '../../src/i18n';
import { GameFeelProvider } from '../../src/GameFeelProvider';
import { QuestionContent } from '../../src/enhanced-QuestionContent';
import { HomeContent } from '../../src/screens';
import { NavBar, TopControls } from '../../src/ui';
import { GameChat } from '../../src/social';
import SFX from '../../src/sounds';
if (!SFX.muted) SFX.toggle();
localStorage.setItem('quizzup-lang', 'fr');
const params = new URLSearchParams(location.search);
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
  const [home, setHome] = useState(params.has('home'));
  const [selected, setSelected] = useState(null);
  const [reveal, setReveal] = useState(null);
  const [muted, setMuted] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [solo, setSolo] = useState(false);
  const social = React.useMemo(() => ({ gameChat: [], gameChatSeenRef: { current: 0 }, sendGameChat: () => false }), []);
  const opponents = [{ id: '2', name: 'clem10', avatar: '🦁', score: 29 }];
  if (params.has('group')) opponents.push({ id: '3', name: 'Alex', avatar: '🦊', score: 12 }, { id: '4', name: 'Sam', avatar: '🐼', score: 10 });
  return <div className={home ? 'app app-top app-nav' : 'app game-bg app-question'}>
    <TopControls muted={muted} toggleMute={() => setMuted(!muted)} theme={theme} toggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')} playing={!home} />
    {home ? <>
      <HomeContent name="Sisi" avatar="🦁" stats={{ games: 24 }} soloMode={solo} setSoloMode={setSolo}
        quickMatch={() => setHome(false)} startWithCategory={() => setHome(false)} />
      <NavBar active="home" onQuickMatch={() => setHome(false)} onNav={() => setHome(true)} />
    </> : <QuestionContent question={question} timeLeft={9} selected={selected} reveal={reveal}
      answer={idx => { setSelected(idx); setReveal({ yourCorrect: idx === 0, correctIndex: 0, pointsEarned: idx === 0 ? 17 : 0, others: [] }); }}
      opponents={opponents} avatar="🦁" name="Sisi" score={reveal?.yourCorrect ? 17 : 0} reportQuestion={() => {}}
      social={social} GameChat={GameChat} />}
  </div>;
}
createRoot(document.getElementById('root')).render(<I18nProvider><GameFeelProvider><Preview /></GameFeelProvider></I18nProvider>);
