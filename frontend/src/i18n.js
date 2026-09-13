import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

// UI chrome only — category labels and quiz question content are NOT
// translated here. French-specific categories (Foot FR, Rap FR...) stay in
// French regardless of UI language, same as how a French Wikipedia article
// title doesn't change when you switch your OS language.
const STRINGS = {
  fr: {
    legendBack: 'LA LÉGENDE EST DE RETOUR',
    tagline: 'Duels de culture générale en temps réel',
    usernamePlaceholder: 'Choisis ton pseudo',
    continue: 'Continuer →',
    hey: 'Salut {name} 👋',
    quickPlay: 'Partie rapide',
    randomTopic: 'Thème aléatoire',
    popularTopics: 'Thèmes populaires',
    allTopics: 'Tous les thèmes',
    seeAll: 'Voir tout ›',
    party: 'Groupe (2-4)',
    joinCode: 'Code ami',
    joinFriend: 'Rejoindre un ami',
    enterCode: 'Entre son code',
    codeError: 'Code introuvable, complet, ou déjà lancé',
    joinMatch: 'Rejoindre',
    back: '← Retour',
    accueil: 'Accueil',
    level: 'Niveau',
    rookie: 'Débutant',
    connectedGoogle: '✓ Connecté avec Google ({email})',
    connectGoogle: '🔑 Se connecter avec Google',
    connecting: 'Connexion…',
    friendRequests: 'Demandes d\'ami',
    accept: 'Accepter',
    friendsCount: 'Amis ({count})',
    friendsEmpty: 'Ajoute des amis après une partie pour les voir ici.',
    online: 'En ligne',
    offline: 'Hors ligne',
    messagePlaceholder: 'Message…',
    send: 'Envoyer',
    novice: 'Novice',
    searching: 'Recherche en cours…',
    bonusRound: 'MANCHE BONUS',
    round: 'Manche {n}',
    doublePoints: 'Points doublés !',
    roundOf: '{n} sur {total}',
    time: 'TEMPS',
    ptsEarned: '+{n} pts',
    timeUp: 'Temps écoulé',
    wrong: 'Faux',
    report: '🚩 Signaler',
    reported: '✓ Signalé',
    sayPlaceholder: 'Dis quelque chose…',
    finished: 'TERMINÉ !',
    victory: 'VICTOIRE !',
    draw: 'MATCH NUL !',
    defeat: 'DÉFAITE',
    someoneLeft: 'Un joueur a quitté',
    finalScore: 'Score final : {n}',
    matchScore: 'Score du match',
    finishBonus: 'Bonus fin',
    winBonus: 'Bonus victoire',
    xpTotal: 'XP totale',
    addFriend: '+ Ajouter {name} comme ami',
    rematch: 'Revanche',
    newGame: 'Nouvelle partie',
    newOpponent: 'Nouvel adversaire',
    backHome: 'Retour à l\'accueil',
    share: '📤 Partager',
    coins: '+{n} pièces',
    connectionLost: 'Connexion perdue',
    serverUnreachable: 'Impossible de joindre le serveur.',
    retry: 'Réessayer',
    partyLobby: '⚔️ Salon de groupe',
    shareCode: 'Partage ce code',
    copied: '✓ Copié !',
    tapToCopy: 'Touche le code pour le copier',
    waitingDots: 'En attente…',
    startMatch: 'Démarrer ({n})',
    waitingPlayers: 'En attente de joueurs…',
    waitingHost: 'En attente que l\'hôte démarre…',
    cancel: '← Annuler',
    you: 'Toi',
    games: 'Parties',
    wins: 'Victoires',
    streak: 'Série',
    whatsNew: 'Quoi de neuf ?',
    post: 'Publier',
    noPosts: 'Aucun post pour l\'instant.',
    postedIn: 'a publié dans',
    signal: 'Signaler',
    signaled: '✓ Signalé',
    solo: '🧍 Solo',
    multiplayer: '👥 Multijoueur',
    navHome: 'Accueil',
    navFeed: 'Feed',
    navThemes: 'Thèmes',
    navProfile: 'Profil',
    shareSolo: 'J\'ai fait {n} points sur QuizzUp !',
    shareWon: 'Je viens de gagner sur QuizzUp !',
    shareTie: 'Match nul sur QuizzUp !',
    sharePlayed: 'Je viens de jouer sur QuizzUp !',
  },
  en: {
    legendBack: 'THE LEGEND IS BACK',
    tagline: 'Real-time trivia battles',
    usernamePlaceholder: 'Choose your username',
    continue: 'Continue →',
    hey: 'Hey {name} 👋',
    quickPlay: 'Quick Play',
    randomTopic: 'Random topic',
    popularTopics: 'Popular Topics',
    allTopics: 'All Topics',
    seeAll: 'See all ›',
    party: 'Party (2-4)',
    joinCode: 'Join code',
    joinFriend: 'Join a friend',
    enterCode: 'Enter their code',
    codeError: 'Code not found, full, or already started',
    joinMatch: 'Join match',
    back: '← Back',
    accueil: 'Home',
    level: 'Level',
    rookie: 'Rookie',
    connectedGoogle: '✓ Connected with Google ({email})',
    connectGoogle: '🔑 Sign in with Google',
    connecting: 'Connecting…',
    friendRequests: 'Friend requests',
    accept: 'Accept',
    friendsCount: 'Friends ({count})',
    friendsEmpty: 'Add friends after a match to see them here.',
    online: 'Online',
    offline: 'Offline',
    messagePlaceholder: 'Message…',
    send: 'Send',
    novice: 'Novice',
    searching: 'Searching…',
    bonusRound: 'BONUS ROUND',
    round: 'Round {n}',
    doublePoints: 'Double points!',
    roundOf: '{n} of {total}',
    time: 'TIME',
    ptsEarned: '+{n} pts',
    timeUp: 'Time up',
    wrong: 'Wrong',
    report: '🚩 Report',
    reported: '✓ Reported',
    sayPlaceholder: 'Say something…',
    finished: 'FINISHED!',
    victory: 'VICTORY!',
    draw: 'DRAW!',
    defeat: 'DEFEAT',
    someoneLeft: 'Someone left',
    finalScore: 'Final score: {n}',
    matchScore: 'Match score',
    finishBonus: 'Finish bonus',
    winBonus: 'Win bonus',
    xpTotal: 'Total XP',
    addFriend: '+ Add {name} as friend',
    rematch: 'Rematch',
    newGame: 'New game',
    newOpponent: 'New opponent',
    backHome: 'Back to home',
    share: '📤 Share',
    coins: '+{n} coins',
    connectionLost: 'Connection lost',
    serverUnreachable: "Couldn't reach the game server.",
    retry: 'Retry',
    partyLobby: '⚔️ Party lobby',
    shareCode: 'Share this code',
    copied: '✓ Copied!',
    tapToCopy: 'Tap the code to copy',
    waitingDots: 'Waiting…',
    startMatch: 'Start match ({n})',
    waitingPlayers: 'Waiting for players…',
    waitingHost: 'Waiting for the host to start…',
    cancel: '← Cancel',
    you: 'You',
    games: 'Games',
    wins: 'Wins',
    streak: 'Streak',
    whatsNew: "What's new?",
    post: 'Post',
    noPosts: 'No posts yet.',
    postedIn: 'posted in',
    signal: 'Report',
    signaled: '✓ Reported',
    solo: '🧍 Solo',
    multiplayer: '👥 Multiplayer',
    navHome: 'Home',
    navFeed: 'Feed',
    navThemes: 'Themes',
    navProfile: 'Profile',
    shareSolo: 'I scored {n} points on QuizzUp!',
    shareWon: 'I just won on QuizzUp!',
    shareTie: 'Draw on QuizzUp!',
    sharePlayed: 'I just played QuizzUp!',
  },
};

const LANG_KEY = 'quizzup-lang';

function detectDefaultLang() {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch { /* localStorage unavailable */ }
  return navigator.language && navigator.language.toLowerCase().startsWith('fr') ? 'fr' : 'en';
}

function interpolate(template, vars) {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) => (key in vars ? String(vars[key]) : `{${key}}`));
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(detectDefaultLang);

  const setLang = useCallback((next) => {
    setLangState(next);
    try { localStorage.setItem(LANG_KEY, next); } catch { /* ignore */ }
  }, []);

  const toggleLang = useCallback(() => setLang(lang === 'fr' ? 'en' : 'fr'), [lang, setLang]);

  const t = useCallback((key, vars) => interpolate(STRINGS[lang][key] || STRINGS.fr[key] || key, vars), [lang]);

  const value = useMemo(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
