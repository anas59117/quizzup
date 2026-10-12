# Corrections mobiles QuizzUp

Base : `origin/main`, commit `90065fe` (boutique v4, 33 objets). Branche locale : `codex/mobile-comfort-20261012`.

## Modifications

- Réglages son/thème/langue : son accessible, thème et langue dans un panneau repliable. Pendant le jeu, seul le son reste affiché. Fermeture par Échap et clic extérieur.
- Navigation : bouton Jouer jaune avec icône foncée et texte visible ; six onglets conservés.
- Carte vedette : illustration et légende en deux blocs dans le flux, sans superposition.
- Duel : en-tête compact, espacement adapté aux petits écrans, réponses tactiles de 44 px minimum. Safe areas et hauteur dynamique du viewport prises en compte. Chat placé sous les réponses.
- Révélation : textes et symboles explicites, couleurs renforcées. La bonne réponse n'est affichée qu'après le résultat complet du serveur, jamais lors de l'accusé de réception individuel.
- Version française et anglaise conservées. Styles isolés dans `frontend/src/mobile-comfort.css`, importés après les styles v4.

## Intégration

Les changements sont appliqués dans cette copie de travail. La publication en production utilise le déploiement Vercel lié à la branche `main`.

Pour les intégrer dans une autre copie actualisée de QuizzUp, utiliser le patch fourni avec l'archive :

```sh
git apply --check quizzup-mobile.patch
git apply quizzup-mobile.patch
```

Si la base a évolué, reporter les changements avec un merge, sans remplacer aveuglément les fichiers complets. Le dossier `frontend/` de l'archive fournit aussi les sources modifiées. Les scripts `scripts/mobile-preview/` servent uniquement aux vérifications locales et ne sont pas importés par l'application.

## Vérification

```sh
cd frontend
npm run build
npx react-scripts test --watch=false --runInBand --runTestsByPath src/mobile-comfort.test.js
node scripts/mobile-preview/build.cjs
node scripts/mobile-preview/check.cjs
```

Le contrôle navigateur utilise Edge et Playwright déjà installés sur ce PC. Sur une autre machine, définir `EDGE_PATH` et `PLAYWRIGHT_PATH` dans l'environnement. Les dépendances React sont réutilisées localement via une jonction `node_modules`, non incluse dans l'archive.

Scénarios : duel, question longue, photo, quatre joueurs et accueil ; viewports 320×480, 375×550, 390×664, 430×760 et 1440×900. Vérifie notamment l'absence de débordement horizontal, la hauteur tactile, les quatre réponses au-dessus du bas de l'écran pour les fixtures de duel mobile, le non-chevauchement de la carte vedette, les réglages et le résultat d'une réponse.

Limites : tests de rendu dans Edge, pas sur un iPhone physique. Les textes exceptionnellement longs, les grandes tailles de texte et les orientations très basses restent défilables afin de ne pas masquer le contenu. L'aperçu est alimenté par des données de démonstration, sans connexion au backend.

Pour ouvrir cet aperçu local :

```sh
node scripts/mobile-preview/serve.cjs
```

Puis `http://127.0.0.1:4321/?home` pour l'accueil ou `http://127.0.0.1:4321/` pour le duel.
