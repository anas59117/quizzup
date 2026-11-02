# Correction du nouveau lot — 2 novembre 2026

Les **150 constats** de l’[audit du nouveau lot](2026-11-02-new-questions-audit.md) sont traités : **145 questions corrigées et cinq questions redondantes retirées**, dans 25 quiz. La banque contient désormais **38 679 questions dans 494 quiz**.

Les réécritures distinguent notamment les trophées et les classements, les dates d’un concert et de sa billetterie, les scores d’un match et d’une confrontation aller-retour, les œuvres et leurs éditions, ainsi que les noms de techniques selon leur traduction. Les options et les index corrects ont été ajustés ensemble pour conserver une seule bonne réponse.

Les cinq questions retirées sont N013, N059, N084, N090 et N092 : leur correction aurait répété une question déjà conservée sur le même fait. Les autres questions et les métadonnées ont été préservées.

## Rétablissement de corrections antérieures

Le commit `dd08394` avait réintroduit les versions antérieures de neuf fichiers, annulant 40 interventions du correctif `6fa761b` : 35 corrections et cinq suppressions de copies. La comparaison a confirmé que ces neuf fichiers étaient exactement revenus à leur version `2be7f66`, sans nouvel ajout à préserver à l’intérieur. Le contenu corrigé a été rétabli avant l’application du présent lot.

Le [journal avant/après](2026-11-02-new-question-corrections.json) documente les 150 interventions et ce rétablissement. Les index y sont ceux d’origine ; les suppressions décalent certains index des fichiers finaux.

## Vérification

- Les 150 empreintes et emplacements de départ ont été contrôlés avant correction.
- Les 25 fichiers ont été reconstruits à partir de la version corrigée `6fa761b` et des seuls changements journalisés : aucun autre objet de question ni aucune métadonnée modifiés.
- Revue indépendante des quatre domaines terminée, sans problème actionnable restant.
- Contrôles de contenu et sélection de questions : 13 tests réussis, dont la structure des 494 quiz, les quatre choix distincts et les duels complets de six manches.
- Validateur de contenu : 387/387 catégories de la roadmap terminées, 345 catégories sous politique renforcée.
- Suite backend complète : 189 tests réussis, aucun échec ; deux tests d’intégration PostgreSQL ignorés faute d’environnement dédié.
- Build frontend avec `CI=true` : réussi.

Les **195 pistes non confirmées** et le fichier de **70 questions GOT non chargé par le jeu** n’ont pas été modifiés. Ce correctif ne constitue pas une certification factuelle exhaustive des 38 679 questions.
