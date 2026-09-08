# QuizzUp 2.0 — État du projet

> Point de reprise. Dernière session : conception + design validés.

## 🎯 Le projet

Jeu de quiz **multijoueur temps réel** (successeur spirituel de QuizUp, fermé en 2021 après 80M users). Angle marketing : **"The legend is back"** (nostalgie + features modernes).

Objectif : **~3000€/mois**, budget ~350€, solo, web-first.

## ✅ Fait

- **Design validé** : 5 écrans, 2 thèmes (dark + light)
  - Sources interactives : `design/screens/*.dc.html`
  - Aperçus : `design/previews/` (HTML + PNG, dark & light)
- **GitHub** : app Claude installée, push OK

### Session solo (backend + frontend production-ready)

- **Questions via API + fallback** — priorité au VOLUME (choix produit) :
  - Source principale : **Open Trivia DB** (`backend/trivia-api.js`) — ~4000
    questions gratuites, sans clé. Cache par catégorie + refill en tâche de
    fond (respecte le rate-limit ~1 req/5s), décodage base64. Parsing validé
    par mock (decode + shuffle + index correct).
  - Fallback / filet : **60 questions locales vérifiées** (`backend/questions.js`)
    sur 6 catégories (100% correctes, relues une par une), utilisées pour
    compléter et quand l'API est indisponible/bloquée/rate-limitée.
  - Priorité : API d'abord (max de variété), local en complément. Fiabilité :
    local = 100% ; OpenTDB = communautaire (~95-98%, non garanti à 100%).
    → nettoyage assuré par le signalement communautaire (voir ci-dessous).
  - Note : l'API est bloquée dans la sandbox de dev (egress proxy) mais
    marchera en prod (Railway). Le jeu reste jouable en local grâce au fallback.
- **Signalement communautaire** (`backend/reports.js`) : bouton "🚩 Report"
  pendant le reveal. Une question atteignant 3 signalements est mise en
  quarantaine et n'est plus jamais servie → la base se nettoie toute seule.
  Anti-abus : 1 signalement/joueur/question, texte pris côté serveur. Persisté
  dans un fichier JSON (best-effort ; migrer vers Firebase pour du durable
  multi-instance). Endpoint `/reports/stats`. Testé (quarantaine + exclusion).
- **Backend réécrit** (`backend/server.js`) — testé end-to-end (2 joueurs) :
  - 🐛 **Bug corrigé** : les réponses n'étaient jamais enregistrées, le jeu
    n'avançait que par timeout. Maintenant le round avance dès que les 2 ont répondu.
  - **Scoring à la vitesse** : réponse rapide = plus de points (20 max → 5 min).
    Vérifié : 250ms = 20 pts vs 3000ms = 15 pts sur la même question.
  - **Anti-triche** : timer serveur = source de vérité, rejet des réponses
    hors-temps et des double-submits.
  - **Bonus round** : dernière question vaut x2.
  - **Feedback par round** : reveal de la bonne réponse + points gagnés.
  - **Déconnexion** : forfait automatique (l'adversaire n'est pas bloqué).
  - Sélection de catégorie au matchmaking + endpoint `/categories`.
- **Frontend réécrit** (`frontend/src/App.js` + `App.css`) — compile OK,
  rendu vérifié dark + light :
  - Matche le design validé (dark premium + light vibrant).
  - **Toggle thème dark/light** + sauvegarde localStorage. ✅ Testé.
  - Sélection d'avatar, écran catégories, timer countdown visuel.
  - Score affiché = **score serveur** (plus de score assumé côté client).
  - Feedback correct/faux/temps écoulé après chaque round.

### Session « rapprochement QuizUp » + social (à partir des 2 vidéos fournies)

Analyse des vidéos QuizUp (frames extraites via ffmpeg) → on reprend le
LAYOUT et le FEEL (mécaniques, pas la marque : notre nom/identité restent) :

- **Écran d'intro « Round X — Get ready! »** avant chaque question (icône
  catégorie), synchronisé serveur, sans grignoter le temps de réponse.
- **Réponses en colonne** (au lieu de la grille 2×2) + **barre de temps**
  horizontale (au lieu du cercle).
- **Thème LIGHT par défaut**, dark en option (toggle 🌙).
- **Palette chaude corail/rouge** (`#f5164f` clair / `#ff3b5c` sombre) au
  lieu du violet — feel énergique type QuizUp.
- **Accueil façon QuizUp** : gros bouton central « Play now » (quick match)
  + barre de navigation basse (Home / Themes / Profile).
- **Catégories en liste** (icône + description + badges) au lieu de la grille.
- **Profil** (placeholder) : stats + « friends/ranking coming soon ».

### Social — brique 1 faite : « Défi par ami » (levier viral n°1)

- **Rooms privées par code** (`backend/server.js`) : `create_room` génère un
  code 5 lettres partageable (alphabet sans ambiguïté), `join_room` matche
  hôte + invité en partie privée. Codes expirent (10 min) + nettoyés à la
  déconnexion ; mauvais code → `room_not_found`. Testé (hôte+invité matchés).
- **Frontend** : « Challenge a friend » (affiche le code, tap pour copier) +
  « Enter a code ». Partage type « bats-moi : ABC12 » sur WhatsApp/Discord.
- 🐛 **Bug corrigé** : le quick match choisissait une catégorie aléatoire
  côté client → 2 joueurs ne se matchaient jamais. Désormais quick match =
  pool commun (category null), le serveur résout la catégorie au démarrage.

Brique 2 (profils persistants + follow + classement global) → **nécessite
Firebase** (compte à créer par l'utilisateur). Non commencée.

## 📋 Écrans

1. **Join** — username + choix d'avatar + badge "The legend is back"
2. **Home** — logo + bouton central "Play now" + navbar (façon QuizUp)
3. **Themes** — liste des catégories (icône + description + badges)
4. **Challenge / Enter code** — défi par code entre amis
5. **Matchmaking** — versus "You vs ?" animé
6. **Round intro** — "Round X — Get ready!" + icône catégorie
7. **Battle** — face-à-face live, barre de temps, réponses en colonne, reveal
8. **Victory** — couronne, rewards (coins/XP/streak)
9. **Profile** — stats (placeholder, social à venir)

## 💰 Monétisation (plan)

1. **Cosmétiques** (60%) — avatars, effets victoire, skins catégories
2. **Battle Pass** (20%) — 4.99€/season
3. **Sponsored categories** (10%) — brands (Nike, Netflix…) + affiliate
4. **Ads rewarded** (5%) — video optionnelle pour bonus

Cible revenue : mois 3 = ~750€/mois, mois 6 = ~4500€/mois.

## 🚀 Stratégie de lancement

- **Phase 1** : Web (Railway backend + Vercel frontend + Firebase data), ~20€/mois
- **Phase 2** : Content viral TikTok/Reels ("QuizzUp is back")
- **Phase 3** : App Store après traction (nom à valider — "QuizzUp" 2z existe mais app morte)

## ⏭️ Prochaines étapes (reprise)

Fait : ✅ toggle thème, ✅ anti-triche serveur, ✅ questions API+local, ✅
signalement communautaire, ✅ rapprochement QuizUp (intro/colonne/barre/accueil/
liste/palette), ✅ défi par code, ✅ fix quick match. Reste :

- [ ] **Décider** : lancer MVP web (Option A, 48h) ou app complète (Option B)
- [ ] Setup comptes hosting (Railway, Vercel, Firebase) — **côté utilisateur**
- [ ] **Social brique 2** : profils persistants + follow + classement global
      — nécessite Firebase
- [ ] **Cosmétiques persistants** (shop + inventory) — nécessite Firebase
      (structure prête : coins/XP en fin de partie, avatars sélectionnables)
- [ ] Reconnexion en cours de partie (actuellement : déconnexion = forfait)
- [ ] Intégrer les images dans les questions (champ `image` optionnel)

## ▶️ Lancer en local (dev)

```bash
# Terminal 1 — backend
cd quizzup-game/backend && npm install && npm start   # :3001

# Terminal 2 — frontend
cd quizzup-game/frontend && npm install && npm start   # :3000
```
Ouvre 2 onglets sur http://localhost:3000, choisis un nom + catégorie dans
les deux → le match se lance. Le frontend parle au backend sur :3001 en dev.

## 🔧 Tech stack

- Frontend : React + WebSocket client
- Backend : Node.js + Express + WS (+ Redis pour matchmaking à l'échelle)
- DB : Firebase Firestore (leaderboards, users, cosmétiques)
- Hosting : Railway + Vercel
