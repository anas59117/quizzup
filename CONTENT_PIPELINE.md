# Quizzup — pipeline de génération de contenu (lecture obligatoire avant de continuer)

Ce projet ajoute ~215 catégories de quiz au jeu Quizzup (30 catégories d'origine +
seconde_guerre_mondiale/espace_astronomie/corps_humain déjà livrées + 4 catégories
sport déjà livrées). La liste complète et son état d'avancement vivent dans
`backend/data/CONTENT_ROADMAP.json` (source de vérité — ne jamais la reconstruire
de mémoire, toujours la lire dans le repo).

## À chaque reprise du travail

1. Lire `backend/data/CONTENT_ROADMAP.json` dans le repo (device bridge).
2. Lire `backend/questions.js` pour voir quelles clés existent déjà dans
   `CATEGORIES` (double vérification — le roadmap doit déjà refléter ça mais on
   vérifie que rien n'a été perdu).
3. Prendre les 4 prochaines entrées `"status": "pending"` du roadmap (dans
   l'ordre du fichier : sport → musique → divertissement → culture → gaming).
4. Générer ~100 questions par catégorie au format exact :
   `{ text: string, answers: [4 strings], correct: 0-3 }`
   - Français, ton neutre, une seule bonne réponse non ambiguë.
   - Privilégier les faits stables (histoire, chiffres établis) plutôt que des
     classements/records qui changent vite.
   - **Vérification obligatoire (exigence explicite d'Ans, très importante)** :
     relire chaque question, et faire des recherches web ciblées sur les faits
     à risque (dates précises, scores, records, attributions de citations,
     surnoms) avant intégration. Ne jamais deviner un fait spécifique sans le
     vérifier si un doute existe. Plusieurs erreurs ont déjà été détectées et
     corrigées ainsi lors des lots précédents (ex : mauvais surnom d'un athlète,
     mauvaise ville pour une finale, fausse prémisse dans une question) — donc
     cette étape n'est pas optionnelle.
   - Valider avec un script Python : 4 réponses, `correct` dans [0,3], pas de
     doublons de texte, pas de doublons de réponses au sein d'une question.
5. Intégrer directement dans le repo (voir "Intégration" ci-dessous).
6. Mettre à jour `CONTENT_ROADMAP.json` : passer les entrées traitées à
   `"status": "done"`, et commit ce fichier aussi.
7. Recommencer avec le batch suivant.
8. **Quand il ne reste plus aucune entrée `"pending"`** dans le roadmap :
   envoyer un message à Ans (dineropronos@gmail.com) confirmant que les 262
   catégories sont terminées, avec le total de questions généré, puis
   désactiver la tâche planifiée qui exécute ce pipeline (elle ne doit plus se
   relancer).

## Intégration dans le repo (identique aux lots précédents)

Repo : `C:\Users\User\Documents\GitHub\quizzup` (accessible via le device
bridge — `get_device_info` doit lister ce dossier dans `connectedFolders`).

- `backend/data/<slug>.json` — un fichier par catégorie (le tableau de questions).
- `backend/questions.js` :
  - ajouter `const xxx = require('./data/<slug>.json');` en haut (grouper par
    lot avec un commentaire `// Batch N — <famille>`)
  - ajouter l'entrée dans `CATEGORIES` : `slug: { label, icon, questions: [...xxx] }`
- `frontend/src/ui.js` : ajouter l'entrée dans le tableau `CATEGORIES` avec
  `key, label, icon, grad: 'gN', desc, family`. `family` doit être l'une de :
  sport, music, entertainment, culture, gaming (voir les valeurs déjà utilisées
  dans le fichier). `gN` = prochain numéro de gradient libre (vérifier le plus
  grand `gN` déjà utilisé dans `App.css` et incrémenter).
- `frontend/src/App.css` : ajouter une règle `.gN { background:
  linear-gradient(135deg, #xxxxxx, #xxxxxx); }` pour chaque nouvelle catégorie
  (couleurs variées, cohérentes avec le reste de la palette).

Après édition des 3 fichiers + N fichiers JSON de données :
1. Copier chaque fichier modifié vers `/mnt/user-data/outputs/quizzup/...`
   (même arborescence que le repo).
2. `device_commit_files` avec les paires stagedPath → devicePath (chemins
   Windows `C:\Users\User\Documents\GitHub\quizzup\...`).
3. Vérifier que `rejected` est vide dans la réponse.
4. Optionnel mais recommandé : reconstituer `questions.js` dans un bac à
   sable Node local (`require()` + `listCategories()`) pour confirmer que le
   fichier se charge sans erreur avant de commit (voir les lots précédents
   pour le pattern — stubber `reports.js`/`trivia-api.js` et les fichiers
   `players-*.json` avec des tableaux vides `[]`).

## Contexte utilisateur

Ans (dineropronos@gmail.com) est le développeur solo du jeu. Il a demandé
explicitement de ne pas être dérangé tant que le travail n'est pas terminé
("fait les toute et previens moi quand c fini") — donc ne pas envoyer de
message intermédiaire par catégorie ou par lot, seulement la confirmation
finale une fois `CONTENT_ROADMAP.json` entièrement à `"done"`.
