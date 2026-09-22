import React, { useState, useEffect, useCallback, memo } from 'react';
import { useI18n } from './i18n';


export const Icon = memo(function Icon({ name, size = 20, className = '' }) {
  const paths = {
    home: <><path d="M3.5 10.5 12 3l8.5 7.5"/><path d="M5.5 9.8V21h13V9.8"/><path d="M9.5 21v-6h5v6"/></>,
    feed: <><path d="M5 5h14"/><path d="M5 12h14"/><path d="M5 19h10"/><circle cx="3" cy="5" r=".7" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r=".7" fill="currentColor" stroke="none"/><circle cx="3" cy="19" r=".7" fill="currentColor" stroke="none"/></>,
    themes: <><rect x="4" y="4" width="6" height="6" rx="1.4"/><rect x="14" y="4" width="6" height="6" rx="1.4"/><rect x="4" y="14" width="6" height="6" rx="1.4"/><rect x="14" y="14" width="6" height="6" rx="1.4"/></>,
    profile: <><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20c.8-4 3-6 6.5-6s5.7 2 6.5 6"/></>,
    bolt: <path d="m13.5 2-8 11H11l-.5 9 8-12H13l.5-8Z"/>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 4 4"/></>,
    volume: <><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="M16 9.5c1.3 1.3 1.3 3.7 0 5"/><path d="M18.5 7c2.7 2.7 2.7 7.3 0 10"/></>,
    mute: <><path d="M4 10v4h4l5 4V6l-5 4H4Z"/><path d="m17 10 4 4"/><path d="m21 10-4 4"/></>,
    sun: <><circle cx="12" cy="12" r="3.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></>,
    moon: <path d="M20 15.5A8 8 0 0 1 8.5 4 8 8 0 1 0 20 15.5Z"/>,
    arrow: <><path d="M5 12h14"/><path d="m14 7 5 5-5 5"/></>,
    users: <><circle cx="9" cy="9" r="3"/><circle cx="17" cy="10" r="2.5"/><path d="M3.5 20c.6-3.7 2.4-5.5 5.5-5.5s4.9 1.8 5.5 5.5"/><path d="M14 15.5c2.9-.7 5.1.8 6 4.5"/></>,
    key: <><circle cx="8.5" cy="12.5" r="4.5"/><path d="m12 10 8-8"/><path d="m16 6 2 2"/><path d="m18 4 2 2"/></>,
    check: <path d="m5 12.5 4 4L19 6.5"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 10v6"/><circle cx="12" cy="7" r=".8" fill="currentColor" stroke="none"/></>,
    close: <><path d="m7 7 10 10"/><path d="m17 7-10 10"/></>,
    trophy: <><path d="M8 4h8v4c0 4-1.8 6-4 6s-4-2-4-6V4Z"/><path d="M8 6H4v1c0 3 1.5 5 4 5"/><path d="M16 6h4v1c0 3-1.5 5-4 5"/><path d="M12 14v4"/><path d="M8.5 21h7"/><path d="M10 18h4"/></>,
    edit: <><path d="m4 20 4.2-1 10.7-10.7-3.2-3.2L5 15.8 4 20Z"/><path d="m13.8 7 3.2 3.2"/></>,
    chat: <><path d="M5 5h14v10H9l-4 4V5Z"/><path d="M8 9h8"/><path d="M8 12h5"/></>,
    send: <><path d="m3 11 17-7-7 17-2.6-7.4L3 11Z"/><path d="m10.4 13.6 4.4-4.4"/></>,
  };
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name] || paths.bolt}
    </svg>
  );
});

export const AVATARS = ['\u{1F43A}', '\u{1F981}', '\u{1F98A}', '\u{1F43C}', '\u{1F989}', '\u{1F438}', '\u{1F42F}', '\u{1F984}'];

export const CATEGORIES = [
  { key: 'movies', label: 'Movies', icon: '\u{1F3AC}', grad: 'g1', tag: '\u{1F525}', desc: 'Blockbusters & classics', family: 'entertainment' },
  { key: 'music', label: 'Music', icon: '\u{1F3B5}', grad: 'g2', desc: 'Artists, albums & lyrics', family: 'music' },
  { key: 'sports', label: 'Sports', icon: '⚽', grad: 'g3', desc: 'Teams & champions', family: 'sport' },
  { key: 'geography', label: 'Geography', icon: '\u{1F30D}', grad: 'g4', desc: 'Capitals & landmarks', family: 'culture' },
  { key: 'gaming', label: 'Gaming', icon: '\u{1F3AE}', grad: 'g5', desc: 'Consoles & lore', family: 'gaming' },
  { key: 'science', label: 'Science', icon: '\u{1F9EC}', grad: 'g6', tag: '✨', desc: 'Space, bio & physics', family: 'culture' },
  { key: 'rap_fr', label: 'Rap Français', icon: '\u{1F3A4}', grad: 'g7', tag: '\u{1F525}', desc: 'PNL, Booba, Jul & co.', family: 'music', cover: '/images/players/booba.jpg' },
  { key: 'foot_fr', label: 'Foot Français', icon: '⚽', grad: 'g8', desc: 'Ligue 1, Bleus & légendes', family: 'sport', cover: '/images/covers/foot_fr.jpg' },
  { key: 'cinema_fr', label: 'Cinéma Français', icon: '\u{1F3AD}', grad: 'g9', desc: 'Films, séries & acteurs', family: 'entertainment' },
  { key: 'culture_fr', label: 'Culture Générale FR', icon: '\u{1F1EB}\u{1F1F7}', grad: 'g10', desc: 'Histoire, géo & traditions', family: 'culture' },
  { key: 'premier_league', label: 'Premier League', icon: '\u{1F981}', grad: 'g11', tag: '\u{1F4F8}', desc: 'Devine le joueur anglais', family: 'sport', cover: '/images/covers/premier_league.jpg' },
  { key: 'la_liga', label: 'La Liga', icon: '\u{1F402}', grad: 'g12', tag: '\u{1F4F8}', desc: 'Devine le joueur espagnol', family: 'sport', cover: '/images/covers/la_liga.jpg' },
  { key: 'bundesliga', label: 'Bundesliga', icon: '\u{1F985}', grad: 'g25', tag: '\u{1F4F8}', desc: 'Devine le joueur allemand', family: 'sport', cover: '/images/covers/bundesliga.jpg' },
  { key: 'serie_a', label: 'Serie A', icon: '\u{1F462}', grad: 'g26', tag: '\u{1F4F8}', desc: 'Devine le joueur italien', family: 'sport', cover: '/images/covers/serie_a.jpg' },
  { key: 'ligue_1', label: 'Ligue 1', icon: '\u{1F413}', grad: 'g27', tag: '\u{1F4F8}', desc: 'Devine le joueur français', family: 'sport', cover: '/images/covers/ligue_1.jpg' },
  { key: 'bollywood', label: 'Bollywood', icon: '\u{1F1EE}\u{1F1F3}', grad: 'g28', tag: '\u{1F4F8}', desc: 'Devine la star indienne', family: 'entertainment', cover: '/images/players/shahrukh_khan.jpg' },
  { key: 'actors_az', label: 'Acteurs (A-L)', icon: '⭐', grad: 'g29', tag: '\u{1F4F8}', desc: 'Devine la star (A à L)', family: 'entertainment', cover: '/images/players/brad_pitt.jpg' },
  { key: 'actors_mz', label: 'Acteurs (M-Z)', icon: '\u{1F31F}', grad: 'g30', tag: '\u{1F4F8}', desc: 'Devine la star (M à Z)', family: 'entertainment', cover: '/images/players/robert_de_niro.jpg' },
  // `logo` (path under /images/logos/) shows the real brand mark once
  // provided; until then the emoji `icon` is the fallback.
  { key: 'netflix', label: 'Netflix', icon: '\u{1F3AC}', logo: null, grad: 'g13', desc: 'Séries & films Netflix', family: 'entertainment' },
  { key: 'got', label: 'Game of Thrones', icon: '\u{1F409}', logo: null, grad: 'g14', desc: 'Le Trône de Fer', family: 'entertainment' },
  { key: 'harry_potter', label: 'Harry Potter', icon: '\u{1FA84}', grad: 'g15', desc: 'Poudlard & sorcellerie', family: 'entertainment' },
  { key: 'marvel', label: 'Marvel', icon: '\u{1F9B8}', grad: 'g16', desc: 'Avengers & super-héros', family: 'entertainment' },
  { key: 'star_wars', label: 'Star Wars', icon: '\u{2694}\u{FE0F}', grad: 'g17', desc: 'Jedi, Sith & la Force', family: 'entertainment' },
  { key: 'disney', label: 'Disney Classics', icon: '\u{1F3F0}', grad: 'g18', desc: 'Contes animés cultes', family: 'entertainment' },
  { key: 'pokemon', label: 'Pokémon', icon: '\u{26A1}', grad: 'g19', desc: 'Dresseurs & Pokéballs', family: 'gaming' },
  { key: 'f1', label: 'Formule 1', icon: '\u{1F3CE}\u{FE0F}', grad: 'g20', desc: 'Écuries & champions', family: 'sport' },
  { key: 'nba', label: 'Basket NBA', icon: '\u{1F3C0}', grad: 'g21', desc: 'Légendes du parquet', family: 'sport' },
  { key: 'tv_shows', label: 'Séries Cultes', icon: '\u{1F4FA}', grad: 'g22', desc: 'Friends, House & co.', family: 'entertainment' },
  { key: 'histoire_fr', label: 'Histoire de France', icon: '\u{269C}\u{FE0F}', grad: 'g23', desc: 'Rois, guerres & dates', family: 'culture' },
  { key: 'retro_games', label: 'Jeux Vidéo Rétro', icon: '\u{1F47E}', grad: 'g24', desc: 'Mario, Sonic & arcade', family: 'gaming' },
  { key: 'seconde_guerre_mondiale', label: 'Seconde Guerre Mondiale', icon: '\u{2694}\u{FE0F}', grad: 'g31', desc: 'Dates, batailles & figures clés', family: 'culture' },
  { key: 'espace_astronomie', label: 'Espace & Astronomie', icon: '\u{1F680}', grad: 'g32', desc: 'Planètes, missions & étoiles', family: 'culture' },
  { key: 'corps_humain', label: 'Corps Humain', icon: '\u{1FAC0}', grad: 'g33', desc: 'Anatomie & physiologie', family: 'culture' },
  { key: 'ligue_champions', label: 'Ligue des Champions', icon: '\u{1F3C6}', grad: 'g34', desc: 'Finales, légendes & records', family: 'sport' },
  { key: 'coupe_du_monde_histoire', label: 'Coupe du Monde (Histoire)', icon: '\u{1F30D}', grad: 'g35', desc: 'Vainqueurs & moments cultes', family: 'sport' },
  { key: 'tour_de_france', label: 'Tour de France', icon: '\u{1F6B4}', grad: 'g36', desc: 'Maillots, cols & champions', family: 'sport' },
  { key: 'jo_ete_histoire', label: "JO d'Été (Histoire)", icon: '\u{1F947}', grad: 'g37', desc: 'Villes hôtes & exploits', family: 'sport' },
  { key: 'can_foot_africain', label: 'CAN (Foot Africain)', icon: '\u{1F30D}', grad: 'g38', desc: 'Palmarès & légendes africaines', family: 'sport' },
  { key: 'copa_america', label: 'Copa América', icon: '\u{1F3C6}', grad: 'g39', desc: 'Argentine, Brésil & Uruguay', family: 'sport' },
  { key: 'legendes_foot_allemand_anglais_italien', label: 'Légendes Foot ALL/ANG/ITA', icon: '\u{2B50}', grad: 'g40', desc: 'Beckenbauer, Best & Baggio', family: 'sport' },
  { key: 'eredivisie', label: 'Eredivisie', icon: '\u{1F1F3}\u{1F1F1}', grad: 'g41', desc: 'Ajax, PSV & Feyenoord', family: 'sport' },
  { key: 'tennis', label: 'Tennis', icon: '\u{1F3BE}', grad: 'g42', tag: '\u{1F4F8}', desc: 'Devine la légende du tennis', family: 'sport', cover: '/images/quizphotos/tennis/rafael_nadal.jpg' },
  { key: 'basketball', label: 'Basketball', icon: '\u{1F3C0}', grad: 'g43', tag: '\u{1F4F8}', desc: 'Devine la légende du basket', family: 'sport', cover: '/images/quizphotos/basketball/michael_jordan.jpg' },
  { key: 'rugby', label: 'Rugby', icon: '\u{1F3C9}', grad: 'g44', tag: '\u{1F4F8}', desc: 'Devine la légende du rugby', family: 'sport', cover: '/images/quizphotos/rugby/antoine_dupont.jpg' },
  { key: 'boxe', label: 'Boxe', icon: '\u{1F94A}', grad: 'g45', tag: '\u{1F4F8}', desc: 'Devine le champion de boxe', family: 'sport', cover: '/images/quizphotos/boxe/mohamed_ali.jpg' },
  { key: 'athletisme', label: 'Athlétisme', icon: '\u{1F3C3}', grad: 'g46', tag: '\u{1F4F8}', desc: "Devine la légende de l'athlé", family: 'sport', cover: '/images/quizphotos/athletisme/usain_bolt.jpg' },
  { key: 'science_stars', label: 'Savants Célèbres', icon: '\u{1F52C}', grad: 'g47', tag: '\u{1F4F8}', desc: 'Devine le grand scientifique', family: 'culture', cover: '/images/quizphotos/science/leonard_de_vinci.png' },
  { key: 'humour', label: 'Humour', icon: '\u{1F602}', grad: 'g48', tag: '\u{1F4F8}', desc: 'Devine la légende comique', family: 'entertainment', cover: '/images/quizphotos/humour/charlie_chaplin.jpg' },
  { key: 'mode', label: 'Mode', icon: '\u{1F483}', grad: 'g49', tag: '\u{1F4F8}', desc: "Devine l'icône de mode", family: 'entertainment', cover: '/images/quizphotos/mode/marilyn_monroe.jpg' },
  { key: 'kpop', label: 'K-pop', icon: '\u{1F1F0}\u{1F1F7}', grad: 'g50', tag: '\u{1F4F8}', desc: 'Devine la star ou le groupe K-pop', family: 'music', cover: '/images/quizphotos/kpop/rm.jpg' },
  { key: 'series_ado_romance', label: 'Séries Ado & Romance', icon: '\u{1F495}', grad: 'g51', tag: '\u{1F4F8}', desc: "Devine l'acteur de ta série préférée", family: 'entertainment', cover: '/images/quizphotos/series_ado_romance/zendaya.jpg' },
  { key: 'drapeaux', label: 'Drapeaux', icon: '\u{1F6A9}', grad: 'g52', desc: 'Devine le pays', family: 'culture' },
  { key: 'liga_portugal', label: 'Liga Portugal', icon: '\u{1F1F5}\u{1F1F9}', grad: 'g53', desc: 'Benfica, Porto & Sporting', family: 'sport' },
  { key: 'mls', label: 'MLS', icon: '\u{1F1FA}\u{1F1F8}', grad: 'g54', desc: 'Foot US, expansion & stars', family: 'sport' },
  { key: 'tennis_atp', label: 'Tennis ATP', icon: '\u{1F3BE}', grad: 'g55', desc: 'Grand Chelem & légendes', family: 'sport' },
  { key: 'tennis_wta', label: 'Tennis WTA', icon: '\u{1F3BE}', grad: 'g56', desc: 'Championnes & records', family: 'sport' },
  { key: 'roland_garros', label: 'Roland-Garros', icon: '\u{1F3BE}', grad: 'g57', desc: 'Terre battue & finales cultes', family: 'sport' },
  { key: 'wimbledon', label: 'Wimbledon', icon: '\u{1F3BE}', grad: 'g58', desc: 'Gazon, tradition & champions', family: 'sport' },
  { key: 'rugby_top_14', label: 'Rugby Top 14', icon: '\u{1F3C9}', grad: 'g59', desc: 'Clubs & champions de France', family: 'sport' },
  { key: 'mma_ufc', label: 'MMA/UFC', icon: '\u{1F94B}', grad: 'g60', desc: 'Octogone & champions', family: 'sport' },
  { key: 'legendes_du_cyclisme', label: 'Légendes du cyclisme', icon: '\u{1F6B4}', grad: 'g61', desc: 'Merckx, Hinault & co.', family: 'sport' },
  { key: 'natation_olympique', label: 'Natation olympique', icon: '\u{1F3CA}', grad: 'g62', desc: 'Records & champions du bassin', family: 'sport' },
  { key: 'jo_d_hiver_histoire', label: "JO d'hiver (histoire)", icon: '\u{2603}\u{FE0F}', grad: 'g63', desc: 'Villes hôtes & légendes de la neige', family: 'sport' },
  { key: 'volleyball', label: 'Volleyball', icon: '\u{1F3D0}', grad: 'g64', desc: 'Filet, smashs & champions', family: 'sport' },
  { key: 'ski_alpin', label: 'Ski alpin', icon: '\u{26F7}\u{FE0F}', grad: 'g65', desc: 'Slalom, descente & légendes', family: 'sport' },
  { key: 'sports_d_hiver', label: "Sports d'hiver", icon: '\u{1F94C}', grad: 'g66', desc: 'Biathlon, bobsleigh & patinage', family: 'sport' },
  { key: 'golf', label: 'Golf', icon: '\u{26F3}', grad: 'g67', desc: 'Majeurs & légendes du green', family: 'sport' },
  { key: 'nhl', label: 'NHL', icon: '\u{1F3D2}', grad: 'g68', desc: 'Coupe Stanley & légendes', family: 'sport' },
  { key: 'baseball_mlb', label: 'Baseball MLB', icon: '\u{26BE}', grad: 'g69', desc: 'World Series & légendes', family: 'sport' },
  { key: 'motogp', label: 'MotoGP', icon: '\u{1F3CD}\u{FE0F}', grad: 'g70', desc: 'Champions & circuits mythiques', family: 'sport' },
  { key: 'rallye_wrc', label: 'Rallye WRC', icon: '\u{1F3CE}\u{FE0F}', grad: 'g71', desc: 'Monte-Carlo, Safari & champions', family: 'sport' },
  { key: 'paris_saint_germain', label: 'Paris Saint-Germain', icon: '\u{1F534}', grad: 'g72', tag: '\u{1F525}', desc: 'Parc des Princes & légendes', family: 'sport' },
  { key: 'real_madrid', label: 'Real Madrid', icon: '\u{26AA}', grad: 'g73', tag: '\u{1F525}', desc: 'Bernabéu & Ligue des Champions', family: 'sport' },
  { key: 'lionel_messi', label: 'Lionel Messi', icon: '\u{1F410}', grad: 'g74', tag: '\u{1F525}', desc: 'La Pulga, Ballons d’Or & Mondial', family: 'sport' },
  { key: 'cristiano_ronaldo', label: 'Cristiano Ronaldo', icon: '\u{1F410}', grad: 'g75', tag: '\u{1F525}', desc: 'CR7, buts & records', family: 'sport' },
  { key: 'fortnite', label: 'Fortnite', icon: '\u{1FA82}', grad: 'g76', tag: '\u{1F525}', desc: 'Battle Royale, objets & personnages', family: 'gaming' },
  { key: 'minecraft', label: 'Minecraft', icon: '\u{26CF}\u{FE0F}', grad: 'g77', tag: '\u{1F525}', desc: 'Blocs, créatures & dimensions', family: 'gaming' },
  { key: 'gta', label: 'GTA', icon: '\u{1F698}', grad: 'g78', tag: '\u{1F525}', desc: 'Villes, personnages & missions', family: 'gaming' },
  { key: 'league_of_legends', label: 'League of Legends', icon: '\u{2694}\u{FE0F}', grad: 'g79', tag: '\u{1F525}', desc: 'Champions, rôles & Runeterra', family: 'gaming' },
  { key: 'valorant', label: 'VALORANT', icon: '\u{1F3AF}', grad: 'g80', tag: '\u{1F525}', desc: 'Agents, armes & cartes', family: 'gaming' },
  { key: 'roblox', label: 'Roblox', icon: '\u{1F9F1}', grad: 'g81', tag: '\u{1F525}', desc: 'Expériences, création & avatars', family: 'gaming' },
  { key: 'call_of_duty', label: 'Call of Duty', icon: '\u{1F396}\u{FE0F}', grad: 'g82', tag: '\u{1F525}', desc: 'Campagnes, Zombies & Warzone', family: 'gaming' },
  { key: 'genshin_impact', label: 'Genshin Impact', icon: '\u{2728}', grad: 'g83', tag: '\u{1F525}', desc: 'Teyvat, personnages & éléments', family: 'gaming' },
  { key: 'zelda', label: 'Zelda', icon: '\u{1F6E1}\u{FE0F}', grad: 'g84', tag: '\u{1F525}', desc: 'Hyrule, donjons & légendes', family: 'gaming' },
  { key: 'univers_mario', label: 'Univers Mario', icon: '\u{1F344}', grad: 'g85', tag: '\u{1F525}', desc: 'Royaumes, bonus & personnages', family: 'gaming' },
  { key: 'rugby_coupe_du_monde', label: 'Rugby Coupe du Monde', icon: '\u{1F3C9}', grad: 'g86', desc: 'Trophée Webb Ellis & grandes finales', family: 'sport' },
  { key: 'xv_de_france', label: 'XV de France', icon: '\u{1F413}', grad: 'g87', desc: 'Les Bleus, Tournoi & légendes', family: 'sport' },
  { key: 'boxe_champions', label: 'Boxe (champions)', icon: '\u{1F94A}', grad: 'g88', desc: 'Ceintures, combats & champions', family: 'sport' },
  { key: 'handball', label: 'Handball', icon: '\u{1F93E}', grad: 'g89', desc: 'Règles, sélections & grands titres', family: 'sport' },
  { key: 'nfl', label: 'NFL', icon: '\u{1F3C8}', grad: 'g90', desc: 'Super Bowl, franchises & légendes', family: 'sport' },
  { key: 'gymnastique', label: 'Gymnastique', icon: '\u{1F938}', grad: 'g91', desc: 'Agrès, figures & champions', family: 'sport' },
  { key: 'patinage_artistique', label: 'Patinage artistique', icon: '\u{26F8}\u{FE0F}', grad: 'g92', desc: 'Sauts, glace & champions', family: 'sport' },
  { key: 'sports_extremes', label: 'Sports extrêmes', icon: '\u{1FA82}', grad: 'g93', desc: 'Glisse, hauteur & adrénaline', family: 'sport' },
  { key: 'femmes_du_sport', label: 'Femmes du sport', icon: '\u{1F3C5}', grad: 'g94', desc: 'Championnes & exploits historiques', family: 'sport' },
  { key: 'jeunes_talents_du_sport', label: 'Jeunes talents du sport', icon: '\u{1F31F}', grad: 'g95', desc: 'Records précoces & révélations', family: 'sport' },
  { key: 'legendes_du_sport_francais', label: 'Légendes du sport français', icon: '\u{1F1EB}\u{1F1F7}', grad: 'g96', desc: 'Champions, records & exploits', family: 'sport' },
  { key: 'padel', label: 'Padel', icon: '\u{1F3BE}', grad: 'g97', desc: 'Règles, coups & champions', family: 'sport' },
  { key: 'beach_volley', label: 'Beach-volley', icon: '\u{1F3D0}', grad: 'g98', desc: 'Sable, règles & légendes', family: 'sport' },
  { key: 'k_pop_groupes_feminins', label: 'K-pop groupes féminins', icon: '\u{1F3A4}', grad: 'g99', desc: 'Groupes, débuts & fandoms', family: 'music' },
  { key: 'k_pop_groupes_masculins', label: 'K-pop groupes masculins', icon: '\u{1F3B6}', grad: 'g100', desc: 'Groupes, débuts & fandoms', family: 'music' },
  { key: 'bts', label: 'BTS', icon: '\u{1F49C}', grad: 'g101', tag: '\u{1F525}', desc: 'Membres, albums & chansons', family: 'music' },
  { key: 'blackpink', label: 'BLACKPINK', icon: '\u{1F5A4}', grad: 'g102', tag: '\u{1F525}', desc: 'Membres, albums & performances', family: 'music' },
  { key: 'afrobeats', label: 'Afrobeats', icon: '\u{1F30D}', grad: 'g103', desc: 'Artistes, albums & grands titres', family: 'music' },
  { key: 'latin_pop_reggaeton', label: 'Latin pop & reggaeton', icon: '\u{1F525}', grad: 'g104', desc: 'Hits, artistes & rythmes latinos', family: 'music' },
  { key: 'rap_us_legendes', label: 'Rap US légendes', icon: '\u{1F399}\u{FE0F}', grad: 'g105', desc: 'Albums, labels & classiques', family: 'music' },
  { key: 'r_b', label: 'R&B', icon: '\u{1F399}\u{FE0F}', grad: 'g106', desc: 'Voix, albums & grands classiques', family: 'music' },
  { key: 'variete_francaise', label: 'Variété française', icon: '\u{1F1EB}\u{1F1F7}', grad: 'g107', desc: 'Interprètes, albums & chansons', family: 'music' },
  { key: 'chanson_francaise_classique', label: 'Chanson française classique', icon: '\u{1F3BC}', grad: 'g108', desc: 'Piaf, Brel, Brassens & légendes', family: 'music' },
  { key: 'rock_francais', label: 'Rock français', icon: '\u{1F3B8}', grad: 'g109', desc: 'Groupes, albums & hymnes', family: 'music' },
  { key: 'rock_legendes_anglo_us', label: 'Rock légendes anglo-US', icon: '\u{1F918}', grad: 'g110', desc: 'Groupes cultes, albums & riffs', family: 'music' },
  { key: 'metal', label: 'Metal', icon: '\u{1F918}', grad: 'g111', desc: 'Groupes, albums & hymnes puissants', family: 'music' },
  { key: 'pop_rock_2000s', label: 'Pop rock 2000s', icon: '\u{1F3B8}', grad: 'g112', desc: 'Groupes, albums & tubes des années 2000', family: 'music' },
  { key: 'electro_edm', label: 'Electro/EDM', icon: '\u{1F39B}\u{FE0F}', grad: 'g113', desc: 'DJs, albums & classiques électroniques', family: 'music' },
  { key: 'house_techno', label: 'House & techno', icon: '\u{1F39A}\u{FE0F}', grad: 'g114', desc: 'Pionniers, clubs, labels & titres', family: 'music' },
  { key: 'reggae_dancehall', label: 'Reggae & dancehall', icon: '\u{1F1EF}\u{1F1F2}', grad: 'g115', desc: 'Artistes, albums & classiques jamaïcains', family: 'music' },
  { key: 'jazz_legendes', label: 'Jazz légendes', icon: '\u{1F3B7}', grad: 'g116', desc: 'Artistes, instruments & standards', family: 'music' },
  { key: 'compositeurs_classiques', label: 'Compositeurs classiques', icon: '\u{1F3BC}', grad: 'g117', desc: 'Époques, œuvres & grands maîtres', family: 'music' },
  { key: 'eurovision', label: 'Eurovision', icon: '\u{1F3A4}', grad: 'g118', desc: 'Vainqueurs, chansons & villes hôtes', family: 'music' },
  { key: 'festivals_de_musique', label: 'Festivals de musique', icon: '\u{1F3AA}', grad: 'g119', desc: 'Scènes, lieux & rendez-vous cultes', family: 'music' },
  { key: 'clips_iconiques', label: 'Clips iconiques', icon: '\u{1F3AC}', grad: 'g120', desc: 'Réalisateurs, images & chansons cultes', family: 'music' },
  { key: 'duos_collabs_celebres', label: 'Duos & collabs célèbres', icon: '\u{1F91D}', grad: 'g121', desc: 'Artistes, albums & collaborations cultes', family: 'music' },
  { key: 'bandes_originales_de_films', label: 'Bandes originales de films', icon: '\u{1F39E}\u{FE0F}', grad: 'g122', desc: 'Compositeurs, chansons & cinéma', family: 'music' },
  { key: 'comedies_musicales', label: 'Comédies musicales', icon: '\u{1F3AD}', grad: 'g123', desc: 'Scènes, auteurs & chansons', family: 'music' },
  { key: 'girl_groups_boys_bands_2000s_2010s', label: 'Girl groups & boys bands', icon: '\u{1F3A4}', grad: 'g124', desc: 'Groupes, membres & tubes 2000s-2010s', family: 'music' },
  { key: 'musique_annees_80', label: 'Musique années 80', icon: '\u{1F4FC}', grad: 'g125', desc: 'Albums, tubes & productions cultes', family: 'music' },
];

// Big topic families (QuizUp-style browsing: tap a broad category to see
// every quiz inside it) — labels/descriptions are translated UI chrome,
// unlike the quiz-specific CATEGORIES labels above.
export const FAMILIES = [
  { key: 'sport', mark: 'SP', grad: 'g3' },
  { key: 'entertainment', mark: 'TV', grad: 'g13' },
  { key: 'music', mark: 'MU', grad: 'g7' },
  { key: 'culture', mark: 'IQ', grad: 'g10' },
  { key: 'gaming', mark: 'GG', grad: 'g5' },
];

export function categoriesInFamily(familyKey) {
  return CATEGORIES.filter((c) => c.family === familyKey);
}

// Strips accents so "francais" matches "Français" — search shouldn't
// require the visitor to type the exact diacritics of an on-screen label.
export function normalizeForSearch(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function famLabel(t, key, suffix = '') {
  return t(`fam${key[0].toUpperCase()}${key.slice(1)}${suffix}`);
}

function topicMark(label) {
  const words = String(label).replace(/\([^)]*\)/g, '').trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) return (words[0][0] + words[1][0]).toUpperCase();
  return words[0]?.slice(0, 2).toUpperCase() || 'QZ';
}


export const Toast = memo(function Toast({ toast, onDismiss }) {
  if (!toast) return null;
  const tone = toast.tone || 'info';
  return (
    <div className={`toast toast-${tone}`} role={tone === 'error' ? 'alert' : 'status'} aria-live="polite">
      <span className="toast-icon">
        <Icon name={tone === 'success' ? 'check' : 'info'} size={17} />
      </span>
      <span className="toast-text">{toast.message}</span>
      <button className="toast-close" onClick={onDismiss} aria-label="Dismiss">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
});

export const JoinScreen = memo(function JoinScreen({ name, setName, avatar, setAvatar, onContinue }) {
  const { t } = useI18n();
  return (
    <div className="container center">
      <div className="join-brandmark">Q</div>
      <div className="badge">{t('legendBack')}</div>
      <h1 className="logo">Quizz<span>Up</span></h1>
      <p className="tagline">{t('tagline')}</p>
      <div className="join-panel">
        <input className="input" placeholder={t('usernamePlaceholder')} value={name} maxLength={20}
          onChange={(e) => setName(e.target.value)} />
        <div className="avatar-picker">
        {AVATARS.map((a, index) => (
          <button
            key={a}
            className={`avatar-opt ${avatar === a ? 'active' : ''}`}
            onClick={() => setAvatar(a)}
            aria-label={`Avatar ${index + 1}`}
            aria-pressed={avatar === a}
          >
            {a}
          </button>
        ))}
        </div>
        <button className="btn" disabled={!name.trim()} onClick={onContinue}>{t('continue')} <Icon name="arrow" size={18} /></button>
      </div>
    </div>
  );
});

export const ErrorScreen = memo(function ErrorScreen({ reason = 'connection', code = '', onRetry }) {
  const { t } = useI18n();
  const isAuth = reason === 'auth';
  const showDebugCode = (
    process.env.NODE_ENV !== 'production'
    || new URLSearchParams(window.location.search).has('debug')
  );
  return (
    <div className="container center">
      <h2 className="logo">{t(isAuth ? 'authProblem' : 'connectionLost')}</h2>
      <p className="tagline">{t(isAuth ? 'authUnavailable' : 'serverUnreachable')}</p>
      {showDebugCode && code && <div className="error-code">{String(code).slice(0, 120)}</div>}
      <button className="btn" onClick={onRetry}>{t('retry')}</button>
    </div>
  );
});

export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('quizzup-theme');
      if (saved) return saved;
      return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } catch { return 'light'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('quizzup-theme', theme); } catch {}
  }, [theme]);
  const toggle = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);
  return [theme, toggle];
}

export const TopControls = memo(function TopControls({ muted, toggleMute, theme, toggleTheme }) {
  const { lang, toggleLang } = useI18n();
  return (
    <div className="top-controls">
      <button className="ctrl-btn" onClick={toggleMute} aria-label="Toggle sound" title="Toggle sound">
        <Icon name={muted ? 'mute' : 'volume'} size={18} />
      </button>
      <button className="ctrl-btn" onClick={toggleTheme} aria-label="Toggle theme" title="Toggle theme">
        <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={18} />
      </button>
      <button className="ctrl-btn lang-btn" onClick={toggleLang} aria-label="Toggle language" title="Toggle language">
        {lang === 'fr' ? 'FR' : 'EN'}
      </button>
    </div>
  );
});

export const SoloToggle = memo(function SoloToggle({ solo, onChange }) {
  const { t } = useI18n();
  return (
    <div className="solo-toggle" role="group" aria-label={`${t('multiplayer')} / ${t('solo')}`}>
      <button
        type="button"
        className={!solo ? 'active' : ''}
        aria-pressed={!solo}
        onClick={() => onChange(false)}
      >
        {t('multiplayer')}
      </button>
      <button
        type="button"
        className={solo ? 'active' : ''}
        aria-pressed={solo}
        onClick={() => onChange(true)}
      >
        {t('solo')}
      </button>
    </div>
  );
});

// "Guess the player" rounds carry an optional photo, shown fully sharp
// throughout the round, then with its required CC attribution once revealed.
export const PlayerPhoto = memo(function PlayerPhoto({ image, credit, timeLeft, timeLimit, revealed }) {
  if (!image) return null;
  return (
    <div className="player-photo-wrap">
      <img src={image} alt="Guess the player" className="player-photo" />
      {revealed && credit && <div className="photo-credit">{credit}</div>}
    </div>
  );
});

// Post-match level-up ring: a conic-gradient arc (no SVG needed) showing
// progress toward the next level, with the level number in the center.
export const LevelRing = memo(function LevelRing({ level, xpIntoLevel, xpForLevel }) {
  const pct = xpForLevel ? Math.round((xpIntoLevel / xpForLevel) * 100) : 0;
  return (
    <div className="level-ring" style={{ background: `conic-gradient(var(--accent) ${pct}%, rgba(255,255,255,0.15) ${pct}%)` }}>
      <div className="level-ring-inner">{level}</div>
    </div>
  );
});

// A single home-screen topic tile: square icon + label underneath, matching
// the original QuizUp's dense topic grid rather than a big descriptive card.
// `cover` (a real photo already in the game's own asset set) replaces the
// flat gradient with a full-bleed illustration — the emoji `icon` is only
// shown on tiles WITHOUT a cover, so a photo tile isn't cluttered with a
// small floating emoji on top of the artwork.
export const CategoryTile = memo(function CategoryTile({ c, onClick, disabled }) {
  return (
    <button className="topic-tile" onClick={onClick} disabled={disabled}>
      <span
        className={`tile-icon-sq ${c.grad} ${c.cover ? 'has-cover' : ''}`}
        style={c.cover ? { backgroundImage: `url(${c.cover})` } : undefined}
      >
        {!c.cover && (
          c.logo
            ? <img src={c.logo} alt={c.label} className="tile-logo-img" />
            : <span className="tile-monogram">{topicMark(c.label)}</span>
        )}
        {c.tag && <span className="tile-tag-badge">{String(c.tag).includes('📸') ? 'PHOTO' : 'TOP'}</span>}
      </span>
      <span className="tile-label">{c.label}</span>
    </button>
  );
});

// A big "family" card — the QuizUp-style broad topic (Sport, Music...) that
// opens onto every specific quiz inside it, rather than listing all quizzes
// flat on one screen.
export const FamilyTile = memo(function FamilyTile({ fam, label, desc, count, onClick }) {
  return (
    <button className="family-tile" onClick={onClick}>
      <span className={`family-icon ${fam.grad}`}>{fam.mark}</span>
      <span className="family-info">
        <span className="family-label">{label}</span>
        <span className="family-desc">{desc}</span>
      </span>
      <span className="family-count">{count}</span>
    </button>
  );
});

// Shared by Home's "All Topics" section and the Themes screen's overview —
// keeps both in sync instead of duplicating the same map/props in two files.
export const FamilyGrid = memo(function FamilyGrid({ onSelect }) {
  const { t } = useI18n();
  return (
    <div className="family-list">
      {FAMILIES.map((fam) => (
        <FamilyTile key={fam.key} fam={fam} label={famLabel(t, fam.key)} desc={famLabel(t, fam.key, 'Desc')}
          count={t('quizCount', { n: categoriesInFamily(fam.key).length })}
          onClick={() => onSelect(fam.key)} />
      ))}
    </div>
  );
});

export const SearchBar = memo(function SearchBar({ value, onChange, placeholder }) {
  return (
    <div className="search-bar">
      <span className="search-icon" aria-hidden="true"><Icon name="search" size={17} /></span>
      <input
        className="search-input"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
      />
    </div>
  );
});

export const NavBar = memo(function NavBar({ active, onNav, onQuickMatch }) {
  const { t } = useI18n();
  return (
    <nav className="navbar">
      <button className={`nav-item ${active === 'home' ? 'active' : ''}`} onClick={() => onNav('home')}>
        <span className="nav-ic"><Icon name="home" size={20} /></span><span className="nav-lbl">{t('navHome')}</span>
      </button>
      <button className={`nav-item ${active === 'feed' ? 'active' : ''}`} onClick={() => onNav('feed')}>
        <span className="nav-ic"><Icon name="feed" size={20} /></span><span className="nav-lbl">{t('navFeed')}</span>
      </button>
      <button className="nav-bolt" onClick={onQuickMatch} aria-label="Quick Play"><Icon name="bolt" size={22} /></button>
      <button className={`nav-item ${active === 'categories' ? 'active' : ''}`} onClick={() => onNav('categories')}>
        <span className="nav-ic"><Icon name="themes" size={20} /></span><span className="nav-lbl">{t('navThemes')}</span>
      </button>
      <button className={`nav-item ${active === 'profile' ? 'active' : ''}`} onClick={() => onNav('profile')}>
        <span className="nav-ic"><Icon name="profile" size={20} /></span><span className="nav-lbl">{t('navProfile')}</span>
      </button>
    </nav>
  );
});
