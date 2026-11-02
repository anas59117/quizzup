# Audit des questions et réponses — 1er novembre 2026

**40 points documentés : 28 énoncés/réponses factuellement erronés ou périmés, 4 ambiguïtés, 3 précisions rédactionnelles et 5 doublons (2 jeux de réponses, 3 questions répétées).**

Le contrôle automatique a parcouru **37 189 questions de 494 quiz**, au commit `e51b6a1f0c75d3e031ca0f1d6b824d93b1b3a9e7`. Les **1 419 images locales** référencées par ces questions existent. Les 176 références distantes n’ont pas été vérifiées une à une.

La vérification factuelle est ciblée : elle couvre les cas détaillés ci-dessous et une première revue de quiz prioritaires (judo, football féminin, records, mathématiques), ainsi que les pistes issues du scan. **Elle ne certifie pas l’exactitude factuelle des 37 189 questions. Une question non signalée n’est pas une question validée.**

Aucune donnée de question/réponse n’a été changée et aucune correction n’a été publiée. Les index JSON sont comptés à partir de zéro ; les numéros de question ci-dessous à partir de un. Le JSON associé conserve les options, l’index correct actuel et une empreinte de chaque question pour éviter d’appliquer ensuite un correctif à un fichier ayant changé.

Empreinte reproductible : SHA-256 en UTF-8 de `JSON.stringify([question.text, question.answers, question.correct])`, au format hexadécimal minuscule.

## Résumé des contrôles

| Contrôle | Résultat |
|---|---|
| Structure des questions, quatre réponses non vides, index correct valide | Une anomalie de réponses dupliquées : PLK nº 1 |
| Questions répétées dans un même quiz | FC Barcelone : deux copies supplémentaires ; La Casa de Papel : une |
| Réponses équivalentes après inspection | PLK et UFC : deux cas retenus |
| Images locales des questions | 1 419 présentes, aucune manquante |
| Vérification factuelle ciblée avec sources | 28 énoncés/réponses erronés ou périmés |
| Réponses multiples / formulation indéterminée | 4 questions |
| Vocabulaire ou bornes chronologiques à préciser | 3 questions, dont le chiffre/résultat principal reste correct |

## Cas documentés

### Erreurs factuelles ou données périmées

#### Q001 — judo, question nº 10

- Emplacement : [backend/data/judo.json:57](../../backend/data/judo.json#L57).
- Question : « Quel judoka français est le plus titré de l'histoire avec 2 titres olympiques ? »
- Réponse actuellement acceptée : **Teddy Riner**.
- Constat : L’énoncé attribue deux titres olympiques à Teddy Riner, alors qu’il a obtenu son troisième titre individuel à Paris 2024.
- Correction proposée : Dater la question sur Paris 2024 et indiquer trois titres individuels (Londres 2012, Rio 2016, Paris 2024). Ne pas confondre titres individuels et épreuves par équipes.
- Vérification : [IJF — troisième titre individuel à Paris 2024](https://www.ijf.org/news/show/teddy-riner-s-historic-win-at-the-paris-2024-olympic-games).

#### Q002 — judo, question nº 41

- Emplacement : [backend/data/judo.json:243](../../backend/data/judo.json#L243).
- Question : « Quel judoka géorgien est devenu légendaire en remportant l'or olympique en 2004 et 2008 ? »
- Réponse actuellement acceptée : **Zurab Zviadauri**.
- Constat : Zurab Zviadauri n’a pas gagné les JO en 2004 ET en 2008. Son titre olympique est celui d’Athènes 2004.
- Correction proposée : Demander quel Géorgien a remporté les -90 kg à Athènes 2004 ; conserver Zviadauri comme réponse.
- Vérification : [IJF — résultats de Zurab Zviadauri](https://www.ijf.org/index.php/athlete/4162/results?results_rank_group=all).

#### Q003 — judo, question nº 48

- Emplacement : [backend/data/judo.json:285](../../backend/data/judo.json#L285).
- Question : « Quelle judoka française a remporté l'or olympique à Rio 2016 en -78 kg ? »
- Réponse actuellement acceptée : **Émilie Andéol**.
- Constat : Émilie Andéol est championne olympique de Rio en +78 kg, pas en -78 kg.
- Correction proposée : Remplacer -78 kg par +78 kg dans la question.
- Vérification : [IJF — Émilie Andéol, championne olympique en +78 kg](https://www.ijf.org/history/olympic-champions/4825).

#### Q004 — judo, question nº 49

- Emplacement : [backend/data/judo.json:291](../../backend/data/judo.json#L291).
- Question : « Quelle judoka française est quintuple championne du monde ? »
- Réponse actuellement acceptée : **Clarisse Agbegnenou**.
- Constat : La qualification de quintuple championne du monde est périmée : Agbegnenou a gagné son sixième titre en 2023.
- Correction proposée : Ancrer la question : quelle Française a remporté son sixième titre mondial à Doha en 2023 ?
- Vérification : [IJF — sixième titre de Clarisse Agbegnenou à Doha 2023](https://www.ijf.org/news/show/clarisse-just-changed-the-world).

#### Q005 — judo, question nº 51

- Emplacement : [backend/data/judo.json:303](../../backend/data/judo.json#L303).
- Question : « Quel judoka japonais a remporté 3 titres olympiques consécutifs (2004-2012) ? »
- Réponse actuellement acceptée : **Tadahiro Nomura**.
- Constat : Les trois titres olympiques de Tadahiro Nomura ne correspondent pas à 2004–2012.
- Correction proposée : Remplacer la période par 1996–2004 : Atlanta 1996, Sydney 2000, Athènes 2004.
- Vérification : [IJF — palmarès de Tadahiro Nomura](https://www.ijf.org/judoka/5156/results?results_rank_group=all).

#### Q006 — judo, question nº 67

- Emplacement : [backend/data/judo.json:399](../../backend/data/judo.json#L399).
- Question : « Quel judoka français a remporté l'or aux JO de Paris 2024 en -66 kg ? »
- Réponse actuellement acceptée : **Luka Mkheidze**.
- Constat : Luka Mkheidze n’a pas gagné l’or en -66 kg à Paris 2024 : il est médaillé d’argent en -60 kg. Hifumi Abe a remporté les -66 kg.
- Correction proposée : Soit demander qui a obtenu l’argent en -60 kg (Mkheidze), soit demander le champion en -66 kg (Hifumi Abe, à ajouter aux choix).
- Vérification : [IJF — résultats des JO Paris 2024](https://www.ijf.org/competition/2653/results).

#### Q007 — judo, question nº 72

- Emplacement : [backend/data/judo.json:429](../../backend/data/judo.json#L429).
- Question : « Quel judoka sud-coréen est triple médaillé olympique ? »
- Réponse actuellement acceptée : **Kim Jae-bum**.
- Constat : Kim Jae-bum a deux médailles olympiques, pas trois : argent en 2008, or en 2012.
- Correction proposée : Remplacer triple médaillé par double médaillé et préciser ces deux éditions.
- Vérification : [IJF — palmarès de Kim Jae-bum](https://www.ijf.org/athlete/64/results?results_rank_group=all).

#### Q008 — judo, question nº 74

- Emplacement : [backend/data/judo.json:441](../../backend/data/judo.json#L441).
- Question : « Quel judoka français a été champion olympique et du monde en -100 kg ? »
- Réponse actuellement acceptée : **Djamel Bouras**.
- Constat : Djamel Bouras n’est pas champion olympique et du monde en -100 kg. Son titre olympique d’Atlanta 1996 est en -78 kg.
- Correction proposée : Recentrer la question sur le titre olympique -78 kg d’Atlanta 1996, sans lui attribuer un titre mondial -100 kg.
- Vérification : [IJF — résultats des JO Atlanta 1996](https://www.ijf.org/competition/1862/results).

#### Q009 — judo, question nº 78

- Emplacement : [backend/data/judo.json:465](../../backend/data/judo.json#L465).
- Question : « Quel Français a dirigé la Fédération internationale de judo pendant de nombreuses années ? »
- Réponse actuellement acceptée : **Marius Vizer**.
- Constat : Marius Vizer est présenté comme Français. L’annuaire officiel de l’IJF le rattache à l’Autriche.
- Correction proposée : Retirer le qualificatif Français de l’énoncé ou reformuler autour de sa fonction.
- Vérification : [IJF — organisation, Marius Vizer représente l’Autriche](https://www.ijf.org/ijf/organisation/17).

#### Q010 — football_feminin, question nº 45

- Emplacement : [backend/data/football_feminin.json:267](../../backend/data/football_feminin.json#L267).
- Question : « Quelle gardienne française a évolué au PSG et en équipe de France ? »
- Réponse actuellement acceptée : **Pauline Peyraud-Magnin**.
- Constat : La réponse marquée est Pauline Peyraud-Magnin, mais son historique officiel de clubs ne comprend pas le PSG.
- Correction proposée : Conserver Peyraud-Magnin avec une question sur son passage à Arsenal puis à la Juventus, ou vérifier et sélectionner une gardienne réellement passée au PSG.
- Vérification : [FFF — clubs successifs de Pauline Peyraud-Magnin](https://www.fff.fr/equipe-nationale/joueur/8414-peyraud-magnin-pauline/fiche.html).

#### Q011 — football_feminin, question nº 55

- Emplacement : [backend/data/football_feminin.json:327](../../backend/data/football_feminin.json#L327).
- Question : « Quelle joueuse française a évolué au Real Madrid féminin ? »
- Réponse actuellement acceptée : **Kadidiatou Diani**.
- Constat : Kadidiatou Diani n’a pas évolué au Real Madrid. La FFF recense notamment Juvisy, le PSG puis Lyon.
- Correction proposée : Remplacer l’énoncé par une question sur la succession Juvisy → PSG → Lyon, pour conserver Diani comme réponse.
- Vérification : [FFF — clubs successifs de Kadidiatou Diani](https://www.fff.fr/equipe-nationale/joueur/8417-diani-kadidiatou/fiche.html).

#### Q012 — football_feminin, question nº 60

- Emplacement : [backend/data/football_feminin.json:357](../../backend/data/football_feminin.json#L357).
- Question : « Quelle Néerlandaise a remporté le titre de meilleure joueuse FIFA en 2019 ? »
- Réponse actuellement acceptée : **Lieke Martens**.
- Constat : The Best FIFA 2019 a récompensé Megan Rapinoe, pas Lieke Martens. Toutes les options proposées sont néerlandaises.
- Correction proposée : Reformuler en supprimant Néerlandaise et proposer Megan Rapinoe parmi les réponses, ou vérifier une question explicitement datée de 2017 sur Lieke Martens.
- Vérification : [FIFA — The Best 2019, Megan Rapinoe](https://inside.fifa.com/en/news/the-best-fifa-women-s-player-x1589).

#### Q013 — football_feminin, question nº 62

- Emplacement : [backend/data/football_feminin.json:369](../../backend/data/football_feminin.json#L369).
- Question : « Quelle Anglaise a été meilleure buteuse de la Women's Super League à plusieurs reprises avec Arsenal ? »
- Réponse actuellement acceptée : **Vivianne Miedema**.
- Constat : Vivianne Miedema est néerlandaise, pas anglaise.
- Correction proposée : Remplacer Anglaise par Néerlandaise.
- Vérification : [Arsenal — Vivianne Miedema, internationale néerlandaise](https://www.arsenal.com/news/vivianne-miedema-signs-new-deal-aOKzt9W1PQVy).

#### Q014 — football_feminin, question nº 66

- Emplacement : [backend/data/football_feminin.json:393](../../backend/data/football_feminin.json#L393).
- Question : « Comment s'appelle le championnat féminin de France de première division ? »
- Réponse actuellement acceptée : **D1 Arkema**.
- Constat : Le nom D1 Arkema est périmé pour une question au présent : la compétition est devenue Arkema Première Ligue en 2024.
- Correction proposée : Proposer Arkema Première Ligue comme réponse ou dater une question historique antérieure à 2024.
- Vérification : [FFF — la D1 Arkema devient Arkema Première Ligue](https://www.fff.fr/article/12423-la-d1-arkema-devient-l-arkema-premiere-ligue.html).

#### Q015 — football_feminin, question nº 88

- Emplacement : [backend/data/football_feminin.json:525](../../backend/data/football_feminin.json#L525).
- Question : « Quelle joueuse française a rejoint le FC Barcelone Femení en 2022 ? »
- Réponse actuellement acceptée : **Delphine Cascarino**.
- Constat : Delphine Cascarino n’a pas rejoint le FC Barcelone en 2022 : elle jouait à Lyon puis a rejoint San Diego en juillet 2024.
- Correction proposée : Demander quelle Française a rejoint San Diego en 2024 après sa carrière lyonnaise, pour conserver Cascarino comme réponse.
- Vérification : [FFF — clubs successifs de Delphine Cascarino](https://www.fff.fr/equipe-nationale/joueur/7462-cascarino-delphine/fiche.html).

#### Q016 — football_feminin, question nº 89

- Emplacement : [backend/data/football_feminin.json:531](../../backend/data/football_feminin.json#L531).
- Question : « Quelle équipe a remporté la première édition de la Women's Champions League sous ce nom en 2009 ? »
- Réponse actuellement acceptée : **FFC Frankfurt**.
- Constat : La première finale sous l’appellation Women’s Champions League a été gagnée par Turbine Potsdam en mai 2010, saison 2009–2010 ; pas par Francfort en 2009.
- Correction proposée : Préciser saison 2009–2010 et ajouter Turbine Potsdam aux choix ; aucune des quatre réponses actuelles ne donne ce vainqueur.
- Vérification : [UEFA — première finale de Women’s Champions League, 2010](https://www.uefa.com/womenschampionsleague/news/0252-0cdfeb843bc4-93e8d419e10c-1000--potsdam-hold-nerve-to-claim-european-crown/).

#### Q017 — records_du_monde, question nº 13

- Emplacement : [backend/data/records_du_monde.json:14](../../backend/data/records_du_monde.json#L14).
- Question : « Quel est le désert le plus grand du monde ? »
- Réponse actuellement acceptée : **Le Sahara (hors Antarctique)**.
- Constat : Le Sahara est le plus grand désert CHAUD. La question ne dit pas chaud ; l’exclusion de l’Antarctique seulement dans la réponse ne définit pas correctement la question.
- Correction proposée : Demander explicitement le plus grand désert chaud, en conservant Sahara ; sinon proposer l’Antarctique pour le plus grand désert.
- Vérification : [Guinness — le Sahara est le plus grand désert chaud](https://www.guinnessworldrecords.com/world-records/largest-desert).

#### Q018 — records_du_monde, question nº 25

- Emplacement : [backend/data/records_du_monde.json:26](../../backend/data/records_du_monde.json#L26).
- Question : « Quel est le record du monde de plongée en apnée (profondeur) ? »
- Réponse actuellement acceptée : **Plus de 300 mètres (No Limit)**.
- Constat : La réponse « plus de 300 mètres » en apnée no-limit n’est pas le record recensé par Guinness : Herbert Nitsch y est à 253 m en 2012.
- Correction proposée : Nommer l’organisme et l’année : profondeur de la descente no-limit de Herbert Nitsch recensée par Guinness en 2012, 253 m. Ne pas confondre avec les 214 m certifiés AIDA.
- Vérification : [Guinness — descente no-limit de Herbert Nitsch, 253 m en 2012](https://www.guinnessworldrecords.com/world-records/673884-deepest-no-limit-freedive-male).

#### Q019 — records_du_monde, question nº 29

- Emplacement : [backend/data/records_du_monde.json:30](../../backend/data/records_du_monde.json#L30).
- Question : « Quel est le record du monde du saut à la perche masculin ? »
- Réponse actuellement acceptée : **6,26 m (Armand Duplantis)**.
- Constat : 6,26 m n’est plus le record masculin de la perche. World Athletics rapporte notamment 6,31 m à Uppsala en mars 2026.
- Correction proposée : Dater la performance demandée, par exemple Uppsala 2026 → 6,31 m, au lieu d’un record actuel non daté.
- Vérification : [World Athletics — Duplantis franchit 6,31 m à Uppsala](https://worldathletics.org/news/report/duplantis-breaks-world-pole-vault-record-in-uppsala).

#### Q020 — records_du_monde, question nº 33

- Emplacement : [backend/data/records_du_monde.json:34](../../backend/data/records_du_monde.json#L34).
- Question : « Quel est le plus grand stade du monde par capacité ? »
- Réponse actuellement acceptée : **Le stade du Premier-Mai (Pyongyang, 114 000)**.
- Constat : Le stade du Premier-Mai, donné pour 114 000 places, n’est pas le plus grand : le Narendra Modi Stadium est annoncé à 132 000 places.
- Correction proposée : Ajouter Narendra Modi Stadium aux options et préciser capacité en places assises ainsi que la date de référence.
- Vérification : [BCCI — Narendra Modi Stadium, 132 000 places](https://www.bcci.tv/venues?map=1).

#### Q021 — records_du_monde, question nº 56

- Emplacement : [backend/data/records_du_monde.json:57](../../backend/data/records_du_monde.json#L57).
- Question : « Quel est le record de durée sans dormir ? »
- Réponse actuellement acceptée : **11 jours (264 heures, Randy Gardner)**.
- Constat : Les 264 heures de Randy Gardner en 1964 ne constituent pas le dernier record historique recensé par Guinness ; d’autres durées l’ont dépassé et Guinness a cessé de suivre cette catégorie.
- Correction proposée : Transformer en question historique explicitement sur l’expérience de Randy Gardner en 1964, ou retirer cette question sur un record actuel non suivi.
- Vérification : [Guinness — historique des records de veille et arrêt de leur suivi](https://www.guinnessworldrecords.com/news/2023/1/whats-the-limit-to-how-long-a-human-can-stay-awake-733188).

#### Q022 — records_du_monde, question nº 64

- Emplacement : [backend/data/records_du_monde.json:65](../../backend/data/records_du_monde.json#L65).
- Question : « Quel est le plus grand aquarium du monde ? »
- Réponse actuellement acceptée : **Chimelong Ocean Kingdom (Chine)**.
- Constat : Chimelong Ocean Kingdom a été dépassé par Chimelong Spaceship pour le plus grand aquarium selon Guinness depuis 2023.
- Correction proposée : Remplacer par Chimelong Spaceship et préciser le classement Guinness, avec année de référence.
- Vérification : [Guinness — plus grand aquarium, Chimelong Spaceship](https://www.guinnessworldrecords.com/world-records/69445-largest-aquarium).

#### Q023 — records_du_monde, question nº 86

- Emplacement : [backend/data/records_du_monde.json:87](../../backend/data/records_du_monde.json#L87).
- Question : « Quel est le record du monde du lancer de disque masculin ? »
- Réponse actuellement acceptée : **74,08 m (Mykolas Alekna)**.
- Constat : La combinaison Mykolas Alekna / 74,08 m est erronée : World Athletics a ratifié son record de 75,56 m établi en avril 2025.
- Correction proposée : Dater le record : performance ratifiée de Mykolas Alekna à Ramona en avril 2025 → 75,56 m.
- Vérification : [World Athletics — record ratifié de 75,56 m pour Alekna](https://worldathletics.org/news/press-releases/ratified-world-records-alekna-chebet-duplantis).

#### Q024 — records_du_monde, question nº 89

- Emplacement : [backend/data/records_du_monde.json:90](../../backend/data/records_du_monde.json#L90).
- Question : « Quel est le record du monde de Rubik's Cube (3x3) ? »
- Réponse actuellement acceptée : **3,13 secondes (Max Park)**.
- Constat : Le single 3×3 de Max Park en 3,13 s est un ancien record. La WCA liste notamment le record de Teodor Zajder en 2,76 s en 2026.
- Correction proposée : Préciser résolution unique et dater la performance demandée ; soit Max Park en 2023 → 3,13 s, soit Zajder à Gdańsk en 2026 → 2,76 s.
- Vérification : [WCA — Teodor Zajder, record single de 2,76 s en 2026](https://www.worldcubeassociation.org/persons/2021ZAJD03).

#### Q025 — natation_olympique, question nº 40

- Emplacement : [backend/data/natation_olympique.json:393](../../backend/data/natation_olympique.json#L393).
- Question : « De quel pays est originaire Cesar Cielo, recordman du 100m nage libre ? »
- Réponse actuellement acceptée : **Bresil**.
- Constat : Brésil est bien la nationalité de César Cielo, mais l’apposition recordman du 100 m nage libre est périmée : Pan Zhanle a établi 46,40 s en 2024.
- Correction proposée : Retirer recordman ou préciser ancien recordman. Conserver Brésil comme bonne réponse à la question de nationalité.
- Vérification : [World Aquatics — Pan Zhanle, 46,40 s en 2024](https://www.worldaquatics.com/news/4072542/pan-).

#### Q026 — sakamoto_days, question nº 11

- Emplacement : [backend/data/sakamoto_days.json:103](../../backend/data/sakamoto_days.json#L103).
- Question : « En quelle année le manga a-t-il commencé ? »
- Réponse actuellement acceptée : **2021**.
- Constat : Le début de la série est marqué 2021. La prépublication de Sakamoto Days a débuté en novembre 2020 ; 2021 correspond au premier volume japonais.
- Correction proposée : Demander explicitement l’année de début de prépublication : 2020.
- Vérification : [VIZ — annonce de la nouvelle série Sakamoto Days en novembre 2020](https://www.viz.com/blog/posts/shonen-jump-new-chapters-11-20-2020).

#### Q027 — mathematiques_logique, question nº 66

- Emplacement : [backend/data/mathematiques_logique.json:393](../../backend/data/mathematiques_logique.json#L393).
- Question : « Quel Français a reçu la médaille Fields en 2010 pour ses travaux sur les équations de Navier-Stokes ? »
- Réponse actuellement acceptée : **Cédric Villani**.
- Constat : La citation officielle de la médaille Fields de Cédric Villani en 2010 porte sur l’amortissement de Landau non linéaire et l’équation de Boltzmann, pas sur Navier–Stokes.
- Correction proposée : Remplacer le motif de récompense dans l’énoncé par les travaux sur Boltzmann / l’amortissement de Landau.
- Vérification : [IMU — citation officielle de la médaille Fields 2010](https://www.mathunion.org/fileadmin/IMU/Publications/Bulletins/2007_2010/59_October2010.pdf).

#### Q028 — mathematiques_logique, question nº 80

- Emplacement : [backend/data/mathematiques_logique.json:477](../../backend/data/mathematiques_logique.json#L477).
- Question : « Quel mathématicien persan a donné son nom à l'algèbre ? »
- Réponse actuellement acceptée : **Al-Khwarizmi**.
- Constat : Le nom d’Al-Khwarizmi est à l’origine du mot algorithme. Algèbre vient du titre al-jabr de son traité, pas de son nom.
- Correction proposée : Remplacer algèbre par algorithme dans l’énoncé pour conserver Al-Khwarizmi comme réponse.
- Vérification : [Université de St Andrews — origine des mots algorithme et algèbre](https://mathshistory.st-andrews.ac.uk/Biographies/Al-Khwarizmi/).

### Questions ambiguës ou plusieurs bonnes réponses

#### Q029 — football_feminin, question nº 77

- Emplacement : [backend/data/football_feminin.json:459](../../backend/data/football_feminin.json#L459).
- Question : « Combien de spectateurs ont assisté au match du Barça Femení au Camp Nou en 2022 (record) ? »
- Réponse actuellement acceptée : **91 553**.
- Constat : Deux records différents ont été établis au Camp Nou en 2022 : 91 553 contre le Real en mars, puis 91 648 contre Wolfsburg en avril. Le match n’est pas identifié.
- Correction proposée : Préciser Barça–Real Madrid du 30 mars 2022 pour garder 91 553 ; ou Barça–Wolfsburg du 22 avril 2022 et répondre 91 648.
- Vérification : [FC Barcelone — 91 648 spectateurs le 22 avril 2022](https://www.fcbarcelona.com/en/football/womens-football/news/2585994/camp-nou-does-it-again-and-beats-the-world-record-for-attendance-with-91648-fans).

#### Q030 — football_feminin, question nº 90

- Emplacement : [backend/data/football_feminin.json:537](../../backend/data/football_feminin.json#L537).
- Question : « Quelle joueuse australienne a été nommée Young Player of the Year FIFA en 2023 ? »
- Réponse actuellement acceptée : **Mary Fowler**.
- Constat : Le libellé Young Player of the Year FIFA 2023 ne désigne pas clairement une récompense officielle. Si la question vise le trophée de meilleure jeune du Mondial, il revient à Salma Paralluelo, pas à Mary Fowler.
- Correction proposée : Nommer précisément la récompense. Pour le Mondial 2023, demander la meilleure jeune joueuse, enlever australienne et ajouter Salma Paralluelo aux options.
- Vérification : [FIFA — bilan officiel du Mondial féminin 2023](https://inside.fifa.com/official-documents/annual-report/2023/2023-at-a-glance/fifa-womens-world-cup-summary).

#### Q031 — football_feminin, question nº 91

- Emplacement : [backend/data/football_feminin.json:543](../../backend/data/football_feminin.json#L543).
- Question : « Quel pays a remporté la Coupe du Monde féminine U-20 le plus souvent ? »
- Réponse actuellement acceptée : **Allemagne**.
- Constat : L’Allemagne n’est pas seule en tête : Allemagne, États-Unis et Corée du Nord ont trois titres U20 féminins chacun. Ces trois pays sont tous proposés, mais seul Allemagne est accepté.
- Correction proposée : Construire une question datée avec une seule réponse possible ; par exemple demander quels trois pays partagent le record après Pologne 2026 dans une réponse groupée.
- Vérification : [FIFA — historique des finales U20 jusqu’à Pologne 2026](https://www.fifa.com/en/tournaments/womens/u20womensworldcup/poland-2026/articles/look-back-all-finals-u20-women-world-cup).

#### Q032 — records_du_monde, question nº 82

- Emplacement : [backend/data/records_du_monde.json:83](../../backend/data/records_du_monde.json#L83).
- Question : « Quel sportif a remporté le plus de Tours de France ? »
- Réponse actuellement acceptée : **Eddy Merckx**.
- Constat : Eddy Merckx et Bernard Hinault, tous deux proposés, ont chacun cinq Tours de France. Accepter uniquement Merckx pénalise une réponse correcte.
- Correction proposée : Reformuler sur un critère unique, par exemple quel Belge a remporté cinq Tours de France, ou proposer un choix regroupant les détenteurs du record.
- Vérification : [Guinness — détenteurs du record de victoires au Tour de France](https://www.guinnessworldrecords.com/world-records/64397-most-tour-de-france-wins).

### Précisions rédactionnelles

#### Q033 — mathematiques_logique, question nº 18

- Emplacement : [backend/data/mathematiques_logique.json:105](../../backend/data/mathematiques_logique.json#L105).
- Question : « Comment s'appelle la droite qui coupe un cercle en deux parties égales ? »
- Réponse actuellement acceptée : **Le diamètre**.
- Constat : Un diamètre est un segment, tandis qu’une droite passant par le centre est un axe de symétrie du cercle. Le vocabulaire de l’énoncé est imprécis.
- Correction proposée : Demander le nom d’une corde passant par le centre : le diamètre.
- Vérification : [OpenStax — définition du diamètre comme segment passant par le centre](https://openstax.org/books/prealgebra-2e/pages/5-key-terms).

#### Q034 — mathematiques_logique, question nº 73

- Emplacement : [backend/data/mathematiques_logique.json:435](../../backend/data/mathematiques_logique.json#L435).
- Question : « Comment appelle-t-on la plus longue droite reliant deux points d'un cercle ? »
- Réponse actuellement acceptée : **Le diamètre**.
- Constat : La formulation plus longue droite est impropre : une droite est illimitée. Le diamètre est la plus longue corde d’un cercle.
- Correction proposée : Remplacer droite par corde.
- Vérification : [OpenStax — définition du diamètre comme segment passant par le centre](https://openstax.org/books/prealgebra-2e/pages/5-key-terms).

#### Q035 — football_feminin, question nº 69

- Emplacement : [backend/data/football_feminin.json:411](../../backend/data/football_feminin.json#L411).
- Question : « Combien de titres de champion de France féminin l'OL a-t-il remportés consécutivement entre 2007 et 2021 ? »
- Réponse actuellement acceptée : **14**.
- Constat : Le nombre de titres consécutifs, 14, est correct. La période gagnerait à se terminer explicitement en 2020 plutôt qu’en 2021, année du titre du PSG.
- Correction proposée : Préciser de 2007 à 2020 inclus, ou les saisons 2006–2007 à 2019–2020.
- Vérification : [FFF — palmarès annuel du championnat de France féminin](https://www.fff.fr/263-palmares-d1-feminine.html).

### Réponses dupliquées

#### Q036 — plk, question nº 1

- Emplacement : [backend/data/plk.json:2](../../backend/data/plk.json#L2).
- Question : « Quel est le vrai nom de PLK ? »
- Réponse actuellement acceptée : **Mathieu Pruski**.
- Constat : Les options Mathieu music et Mathieu Music sont la même réponse à la casse près. Le validateur existant le signale.
- Correction proposée : Remplacer l’un des deux distracteurs par une proposition distincte ; Mathieu Pruski reste la réponse marquée.

#### Q037 — mma_ufc, question nº 109

- Emplacement : [backend/data/mma_ufc.json:1089](../../backend/data/mma_ufc.json#L1089).
- Question : « Quel combattant a vaincu Alex Pereira à l'UFC 300 ? »
- Réponse actuellement acceptée : **Personne, il a gagné**.
- Constat : Jiri Prochazka et Jiří Procházka sont le même combattant ; les quatre options ne sont donc pas distinctes.
- Correction proposée : Remplacer un des deux distracteurs. La réponse marquée Personne, il a gagné ne change pas.

### Questions répétées

#### Q038 — fc_barcelone, question nº 102

- Emplacement : [backend/data/fc_barcelone.json:1024](../../backend/data/fc_barcelone.json#L1024).
- Question : « En quelle année le FC Barcelone a-t-il été fondé ? »
- Réponse actuellement acceptée : **1899**.
- Constat : Question répétée dans le même quiz : même énoncé que la question nº 1.
- Correction proposée : Conserver une version et remplacer ou retirer celle-ci ; ne pas modifier automatiquement les index sans recontrôler les fichiers.

#### Q039 — fc_barcelone, question nº 140

- Emplacement : [backend/data/fc_barcelone.json:1442](../../backend/data/fc_barcelone.json#L1442).
- Question : « En quelle année le Camp Nou a-t-il été inauguré ? »
- Réponse actuellement acceptée : **1957**.
- Constat : Question répétée dans le même quiz : même énoncé que la question nº 51.
- Correction proposée : Conserver une version et remplacer ou retirer celle-ci ; ne pas modifier automatiquement les index sans recontrôler les fichiers.

#### Q040 — la_casa_de_papel, question nº 133

- Emplacement : [backend/data/la_casa_de_papel.json:1405](../../backend/data/la_casa_de_papel.json#L1405).
- Question : « Comment Tokyo meurt-elle dans la partie 5 ? »
- Réponse actuellement acceptée : **En activant des grenades sur elle**.
- Constat : Question répétée dans le même quiz : même énoncé que la question nº 84.
- Correction proposée : Conserver une version et remplacer ou retirer celle-ci ; ne pas modifier automatiquement les index sans recontrôler les fichiers.

## Alertes qui ne doivent pas devenir des faux positifs

- Les 17 alertes de normalisation des réponses ne sont pas 17 erreurs : seuls PLK et UFC sont retenus. Les signes mathématiques, monnaies, emoji et +100/-100 restent distincts.
- Les 20 groupes inter-quiz avec réponses différentes ne sont pas confirmés comme contradictions : contexte de la catégorie, noms courts/longs et descriptions équivalentes expliquent la majorité.
- Les 45 formulations temporelles et 419 formulations à analyser sont des pistes, pas des erreurs confirmées.
- La position des bonnes réponses dans les fichiers n’est pas un défaut de gameplay : shuffleAnswers mélange les réponses à l’envoi.

Les records et clubs au présent doivent être datés ou reformulés autour d’un événement historique stable. Avant correction, vérifier l’empreinte et le texte de la question : les données peuvent évoluer pendant le travail.
