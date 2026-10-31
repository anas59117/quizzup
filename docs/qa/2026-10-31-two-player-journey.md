# QuizzUp — contrôle du parcours à deux joueurs

Date : 31 octobre 2026. Version produit : `f255b18`.

## Résultat

Aucun blocage fonctionnel reproduit sur les parcours ci-dessous. Les deux joueurs utilisent des identités invitées distinctes, de vraies connexions HTTP/WebSocket et les composants de l'application. Le serveur et ses treize fichiers de données sont isolés des données du développeur et de la production.

| Parcours | Résultat | Vérification |
| --- | --- | --- |
| Premier lancement des deux visiteurs | PASS | Les trois étapes d'accueil sont suivies dans l'interface. |
| Découverte d'un joueur et demande d'ami | PASS | Publication communautaire, ouverture du profil, bouton Ajouter en ami, acceptation dans Messages. |
| Discussion et notifications | PASS | Message reçu par l'autre joueur et badge non lu. |
| Destinataire hors ligne | PASS | Message retrouvé après reconnexion et rechargement. |
| Brouillon et petit écran | PASS | Brouillon conservé après navigation, zone de saisie accessible avec viewport réduit à 320 × 500. |
| Défi envoyé depuis le chat | PASS | Invitation acceptée et six questions terminées par les deux joueurs. |
| Résultat et revanche depuis le chat | PASS | Résultat dans la conversation, nouvelle invitation, deuxième duel de six questions terminé. |
| Historique après rechargement | PASS | Les parties et le nom de l'adversaire sont retrouvés. |
| Question avant les réponses | PASS | Lecture sans réponses visibles, réponses désactivées, temps de réponse préservé, question sans saut vertical. |
| Reconnexion pendant une manche | PASS | Après coupure du WebSocket, le paquet de question récupéré contient la réponse déjà envoyée ; sa sélection et le verrouillage des quatre boutons sont vérifiés dans le rendu avant la réponse de l'adversaire. |
| Revanche depuis les résultats | PASS | Attente du premier joueur, accord du second, nouvelle partie. |
| Défi chacun son tour | PASS | Premier joueur pendant l'absence du second, puis l'inverse ; mêmes questions, scores canoniques, résultat et historique persistants. |
| Invitation par code | PASS | Code produit par le serveur, deuxième joueur admis et démarrage par l'hôte. |
| Photo de profil | PASS | Enregistrement, annulation d'un retrait, rechargement, photo visible par l'adversaire et retour à l'avatar après retrait confirmé. |
| Musique du duel | PASS | Absente à l'accueil, active en duel, coupure et reprise via les commandes, arrêt au résultat. Contrôle du moteur Web Audio ; pas d'appréciation subjective du morceau. |
| Partage du résultat avec photo | PASS | Export du canvas en PNG sans erreur CORS. |
| Communauté et retrait d'ami | PASS | Texte, photo, question, commentaire, lien partagé, navigation Retour et retrait confirmé. |

## Couverture et limites

- Navigateur : Chromium/Edge piloté par Playwright. Contrôles de largeur à 320, 375, 390 et 430 px selon les scénarios ; ils ne remplacent pas un essai sur iPhone physique.
- Tests frontend : **184 réussis, 23 suites**.
- Tests backend : **150 réussis**.
- Deux sessions simultanées ont été vérifiées. Aucun test de capacité à grande échelle n'a été effectué dans ce lot.
- La connexion Google et la récupération sur un autre appareil restent à tester avec des comptes Google de test autorisés. Aucune session Google personnelle n'a été utilisée.
- Le site public et la route de santé du backend répondaient HTTP 200 lors du contrôle. Les actions de jeu de ce rapport ont été réalisées sur le serveur isolé, pas sur les comptes de production.

## Corrections apportées aux tests

Les échecs initiaux provenaient de scénarios devenus obsolètes : nom accessible de Messages préfixé par un badge, libellé « La revanche », commandes déplacées dans Réglages et dans le menu Jouer. Les sélecteurs ont été corrigés sans changer ces interfaces.

Une autre source de faux échec était la migration automatique des anciens fichiers JSON vers un nouveau DATA_DIR. Les scénarios de navigateur et le test de statistiques démarrent désormais avec des fichiers explicitement vides. Les données historiques ne sont ni supprimées ni modifiées.

La revue indépendante a demandé de renforcer l'attente après reconnexion : le test attend désormais la question récupérée puis son rendu avec la sélection restaurée. La version renforcée passe.

**Aucun fichier fonctionnel du site, visuel ou paramètre de production n'a été modifié dans ce lot.**

## Relancer

Depuis `frontend/`, construire d'abord les composants de test :

```powershell
node scripts/mobile-preview/build.cjs
node scripts/mobile-preview/social-check.cjs
node scripts/mobile-preview/live-check.cjs
node scripts/mobile-preview/photo-duel-check.cjs
node scripts/mobile-preview/async-check.cjs
```

Les trois premiers scénarios utilisent le port backend 3003 et doivent s'exécuter successivement. Le scénario asynchrone utilise le port 3005. Les captures se trouvent dans `frontend/.mobile-preview/`, notamment `social-history-390.png`, `live-ack-waiting.png`, `live-results.png`, `personal-photo-duel.png` et `async-e2e/`.
