# Corrections des questions — 2 novembre 2026

Les 40 constats de l’[audit du 1er novembre](2026-11-01-question-audit.md) sont traités : **37 questions corrigées et 3 copies de questions supprimées**. Deux autres copies exactes, ajoutées depuis dans Ninho, ont également été retirées. Une version de chacune des cinq questions répétées reste disponible.

Les ajouts du commit `2be7f66` ont été conservés. La banque après correction contient **38 684 questions dans 494 quiz** (38 689 avant ces cinq suppressions).

Les corrections portent sur les faits, les options et les formulations identifiés dans l’audit. Les records sont rattachés à un événement daté ; les questions comportant plusieurs bonnes réponses sont reformulées pour n’en accepter qu’une. Les niveaux de difficulté et les autres métadonnées sont conservés. Le mécanisme de mélange des réponses reste inchangé.

La revue indépendante a relevé une date erronée dans une première reformulation : Pauline Peyraud-Magnin a rejoint la Juventus en **2021**, après Arsenal et l’Atlético. La version finale utilise 2021. [Annonce officielle Juventus](https://www.juventus.com/en/news/articles/official-peyraud-magnin-signs-for-juventus)

Le [journal JSON](2026-11-02-question-corrections.json) conserve les 42 interventions, les questions avant/après, les index d’origine, les empreintes et les sources. Les index d’origine ne sont pas ceux des tableaux après suppression des copies.

## Vérification

- Test de non-régression ajouté sur l’intégralité des quiz : structure, minimum de six questions, absence de questions répétées, quatre options distinctes, y compris les variantes d’accents et de casse. Les signes mathématiques et la ponctuation sont préservés.
- Échec du test observé avant correction sur PLK, UFC, Barcelone, La Casa de Papel et Ninho ; réussite après correction.
- Contrôle du journal contre le commit de départ : uniquement les 37 remplacements et les cinq suppressions annoncés ; aucune autre modification de question.
- Validation du contenu : 387/387 catégories de la roadmap terminées, 345 sous politique renforcée.
- Suite backend : 189 tests réussis, aucun échec, deux tests d’intégration PostgreSQL ignorés faute d’environnement dédié.
- Tests ciblés de contenu et de sélection des questions relancés après les dernières retouches : 13 réussis.
- Build frontend avec `CI=true` : réussi.

Cette intervention ne constitue pas une validation factuelle exhaustive des 38 684 questions. Les nouveaux ajouts n’ont reçu ici que le contrôle structurel ; les autres pistes de l’audit initial restent à examiner.
