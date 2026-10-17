# Photos personnelles et finition du duel

Demande approuvée : photo personnelle prioritaire, avatars pour les joueurs sans photo ; réponses mieux cadrées ; musique originale pendant le duel.

## Contraintes
- Préserver les comptes, le volume Railway, les avatars achetés et le protocole de duel.
- Conserver les trois secondes de face-à-face, les introductions de manche avec trophée et la lecture de la question avant les réponses.
- Photos persistantes et visibles par les autres joueurs ; upload HTTP authentifié et borné, aucune image base64 dans les messages WebSocket.
- Aucun morceau existant réactivé dans les menus. Musique originale, modérée, commandée par le bouton son, arrêtée hors duel et pendant les publicités.
- Vérification CI, parcours mobile, revue indépendante avant publication sur main.

## Travaux
1. Photos : stockage backend, validation, normalisation, rendu avec avatar de secours, éditeur de profil et partage. Le responsable photo possède ces fichiers et les seules sections identité/profil de App.js.
2. Musique : moteur et composition originaux dans un module isolé, tests. Le contrôleur intègre les effets de cycle de vie dans App.js après accord sur l'API.
3. Cadrage : resserrer la relation question/réponses, conserver des cibles confortables et quatre choix accessibles, sans déplacement pendant leur arrivée. Le contrôleur possède duel-premium.css et les tests navigateur.
4. Revue de chaque module, revue globale, corrections, build CI et déploiement vérifié.
