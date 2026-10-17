# Audit mobile et duel validé — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Tasks are scoped below; implement and test before review.

**Goal:** Corriger T1–T5 de l'audit vérifié et livrer le duel de la maquette bleu glacier/orange cuivré.

**Architecture:** Préserver React CRA et le protocole temps réel. Les corrections d'audit sont isolées dans audit-polish.css ; le duel utilise duel-premium.css et ses composants existants ; l'invitation réutilise les salons privés réels et leur code.

**Tech Stack:** React18, CSS, Node, Jest, Playwright/Edge existants. Aucune dépendance ajoutée.

**Spec:** Demande directe du 17 octobre 2026 et maquette approuvée C:/Users/User/.codex/generated_images/01a12d23-1228-74d2-bd8b-2ce6714cc14e/exec-37b25165-e927-4f67-b8c6-5e346485dfb9.png. Audit source C:/Users/User/Downloads/audit.pdf ; arbitrages et mesures exposés dans la conversation.

## Global Constraints
- Fond rouge conservé hors duel ; conserver thèmes, boutique, profil, photos persistantes et musique originale de duel.
- Navbar : Accueil, Thèmes, Boutique, Profil et Jouer central. Ne pas rétablir Feed.
- Duel anthracite, cartes ivoire avec texte sombre centré, sans badges A/B/C/D. Texte : quatre cartes verticales. Image : image entière et grille2x2 alignée. Bleu glacier #55C4EF pour soi, orange cuivré #E7955A pour adversaire ; pistes latérales sur toute la hauteur utile, sans chevauchement.
- Garder lecture initiale de la question, délai serveur, score confirmé immédiatement, statut adverse neutre avant révélation, face-à-face3s et trophée entre manches.
- Conserver l'accès clavier, retour vert/rouge avec icône, mouvement réduit, petits écrans et groupes. Questions longues peuvent défiler plutôt qu'être coupées.
- Contraste AA petits textes ; zones tactiles44px ; aucune invitation à code fictif, aucun message envoyé à une personne sans action explicite.
- Build CI=true, tests ciblés, parcours réel dès intégration, revue indépendante, push main puis vérification publique. Exclure données runtime et maquettes.

## Task 1 — Duel
- [ ] Owner: designer worker. Files: duel-premium.css, enhanced-QuestionContent.js, PlayerHud section of multiplayer.js, focused tests. Match-presentation.css palette only if useful.
- [ ] Review real mobile proportions first and implement both text/photo variants. Use current image fixture, preserve original image ratio.
- [ ] Test timing/input feedback, groups, rails, keyboard labels after removing letter badges.

## Task 2 — Social et textes
- [ ] Owner: social worker. Files: HomeContent and ProfileContent sections screens.js only, FriendsScreen social.js, i18n.js, new FriendInviteActions.js/css and focused tests.
- [ ] Home friendCount prop from real social list; replace redundant greeting with level/progression and clarify following count.
- [ ] Reusable invite/join actions call actual App createRoom/enter_code paths. Empty friends state has direct useful CTA. Parent wires App callbacks.

## Task 3 — Audit accessibilité et contrôles
- [ ] Owner: parent. Files App.js, ui.js, audit-polish.css, preview scripts and browser QA.
- [ ] Maintain one coherent in-flow header on home/shop/profile with existing TopControls and no duplicated headings. controls prop slots for shop/profile owned by parent integration.
- [ ] Correct actual small text foreground/background pairs on home and friend screen; enlarge Solo/Multiplayer, See all and More targets without shrinking other content.
- [ ] Wire friendCount/social actions and code-copy/share actual room flow. Validate two fresh sessions create/join a real room.

## Task 4 — Vérification et publication
- [ ] Run meaningful existing frontend suites plus scoped additions, mobile browser matrix and actual duel/room/photo flow. Compile CI production once sources are stable.
- [ ] Independent whole-diff review; fix important findings and re-run affected checks only.
- [ ] Commit exact sources/tests/plan, push HEAD:main, confirm Vercel+Railway and public smoke checks.
