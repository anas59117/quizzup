# QuizzUp 2.0 — État du projet

> Point de reprise. Dernière session : conception + design validés.

## 🎯 Le projet

Jeu de quiz **multijoueur temps réel** (successeur spirituel de QuizUp, fermé en 2021 après 80M users). Angle marketing : **"The legend is back"** (nostalgie + features modernes).

Objectif : **~3000€/mois**, budget ~350€, solo, web-first.

## ✅ Fait

- **Code MVP** : backend (Node.js + WebSocket + matchmaking) + frontend (React) → `backend/` et `frontend/`
- **Design validé** : 5 écrans, 2 thèmes (dark + light)
  - Sources interactives : `design/screens/*.dc.html`
  - Aperçus : `design/previews/` (HTML + PNG, dark & light)
- **GitHub** : app Claude installée, push OK

## 🎨 Décision design (validée)

- **2 thèmes au choix de l'utilisateur** : Dark (gaming/premium) + Light (casual/Kahoot-like)
- Toggle dans les settings + sauvegarde localStorage
- Optionnel : 3e mode "Auto" (suit le système)
- Palette dark : fond `#0f0e17`, accents `#7f5af0` (violet), `#2cb67d` (vert), `#ffd803` (jaune)
- Palette light : gradients violet/orange/jaune, cartes blanches
- Font : Poppins

## 📋 Écrans (5)

1. **Join** — username + badge "The legend is back" + stats
2. **Categories** — grille 2×2 colorée, icônes, badges Hot/New, coins
3. **Matchmaking** — versus "You vs ?" animé
4. **Battle** — face-à-face live, timer 10s, scoring, réponses 2×2
5. **Victory** — couronne, rank global, rewards (coins/XP/streak), Share

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

- [ ] Implémenter le **toggle thème dark/light** (CSS variables + localStorage)
- [ ] Décider : lancer MVP web (Option A, 48h) ou app complète (Option B, 2 semaines)
- [ ] Setup comptes hosting (Railway, Vercel, Firebase) — côté utilisateur
- [ ] Anti-triche : timer côté serveur = source de vérité
- [ ] Seed base de questions (500q, 5-6 catégories)
- [ ] Système cosmétiques (shop + inventory)
- [ ] Reconnect/timeout handling multijoueur

## 🔧 Tech stack

- Frontend : React + WebSocket client
- Backend : Node.js + Express + WS (+ Redis pour matchmaking à l'échelle)
- DB : Firebase Firestore (leaderboards, users, cosmétiques)
- Hosting : Railway + Vercel
