# Audit du nouveau lot de questions — 2 novembre 2026

**150 points documentés : 119 erreurs factuelles ou présupposés faux, 19 ambiguïtés et 12 précisions rédactionnelles, dans 25 quiz.**

**Suivi : les 150 points ont été traités dans le [correctif associé](2026-11-02-new-question-corrections.md). Les constats ci-dessous décrivent l’état avant correction.**

Commit inspecté : `6fa761bc3cec905e0a70170e3492321e81fba2b1`. Lot d’origine : `2be7f66`.

Le lot avait ajouté **1 500 questions actives** ; deux copies Ninho ont déjà été retirées dans la correction précédente. Ce contrôle couvre donc les **1 498 nouvelles questions actives restantes**, plus la lecture des **70 questions d’un fichier GOT non chargé par le jeu**. Les problèmes potentiels de ce fichier inactif sont exclus des comptes de production.

**Les 1 498 questions et leurs choix ont été lus et contrôlés structurellement. La vérification externe des faits est ciblée sur les points sourcés ci-dessous : ce n’est pas une certification factuelle exhaustive des 1 498 réponses.** Une question non signalée n’est pas une question validée.

**Aucune question n’a été modifiée et aucune correction de ce nouveau lot n’a été publiée.**

## Répartition

| Quiz | Points à traiter |
|---|---:|
| animaux | 7 |
| architecture_celebre | 1 |
| attaque_des_titans | 2 |
| ballon_d_or | 8 |
| bayern_munich | 15 |
| beyonce | 4 |
| cristiano_ronaldo | 5 |
| demon_slayer | 1 |
| dinosaures | 4 |
| dragon_ball | 3 |
| equipe_de_france_football | 5 |
| hunter_x_hunter | 5 |
| jujutsu_kaisen | 8 |
| lionel_messi | 9 |
| liverpool | 12 |
| manchester_united | 8 |
| michael_jackson | 3 |
| mythologie_grecque | 1 |
| ninho | 7 |
| olympique_de_marseille | 13 |
| pnl | 10 |
| rihanna | 6 |
| seconde_guerre_mondiale | 6 |
| taylor_swift | 2 |
| the_weeknd | 5 |

## Constats sourcés

Les numéros affichés commencent à un ; les index JSON commencent à zéro. Le journal JSON conserve les choix, l’index correct actuel et l’empreinte SHA-256 UTF-8 de `JSON.stringify([question.text, question.answers, question.correct])`.

### N001 — animaux, question nº 116

- Type : **ambiguite**.
- Emplacement : backend/data/animaux.json:1117 (index 115).
- Question : « Quel animal marin peut régénérer ses bras s'ils sont coupés ? »
- Réponse actuellement acceptée : **L'étoile de mer**.
- Constat : Le poulpe, proposé en premier choix, régénère aussi ses bras. La capacité décrite ne permet pas de n’accepter que l’étoile de mer.
- Proposition : Préciser un échinoderme à symétrie radiale ou remplacer le distracteur poulpe.
- Sources : [Marine Biological Laboratory — régénération des bras de poulpe](https://www.mbl.edu/news/limb-how-octopus-regrows-its-arms-mental-floss).

### N002 — animaux, question nº 117

- Type : **factuel**.
- Emplacement : backend/data/animaux.json:1118 (index 116).
- Question : « Quel est le plus petit mammifère du monde par le poids ? »
- Réponse actuellement acceptée : **La chauve-souris bourdon**.
- Constat : La question précise le poids, mais accepte la chauve-souris bourdon. Le classement par masse donne la musaraigne étrusque ; le record par longueur concerne la chauve-souris.
- Proposition : Conserver le critère du poids et accepter la musaraigne étrusque (index 0).
- Sources : [Guinness — distinction du plus petit mammifère par longueur et par masse](https://www.guinnessworldrecords.com/world-records/70467-smallest-mammal).

### N003 — animaux, question nº 119

- Type : **factuel**.
- Emplacement : backend/data/animaux.json:1120 (index 118).
- Question : « Combien d'estomacs fonctionnels possède une vache ? »
- Réponse actuellement acceptée : **Quatre**.
- Constat : Une vache a un estomac comprenant quatre compartiments, pas quatre estomacs distincts. Le choix Un existe mais est refusé.
- Proposition : Demander le nombre de compartiments gastriques (quatre), ou accepter Un si l’on conserve estomac.
- Sources : [Mississippi State University — un estomac, quatre compartiments](https://extension.msstate.edu/publications/understanding-the-ruminant-animal-digestive-system).

### N004 — animaux, question nº 136

- Type : **ambiguite**.
- Emplacement : backend/data/animaux.json:1137 (index 135).
- Question : « Quel animal possède des dents qui poussent tout au long de sa vie, y compris les défenses ? »
- Réponse actuellement acceptée : **L'éléphant**.
- Constat : L’hippopotame proposé possède lui aussi des incisives et canines à croissance continue. L’éléphant a des défenses à croissance continue et des molaires remplacées par séries ; la formulation ne sélectionne pas un seul animal.
- Proposition : Demander explicitement chez quel animal les défenses sont des incisives supérieures allongées, ou changer les distracteurs.
- Sources : [San Diego Zoo — croissance continue des canines et incisives de l’hippopotame](https://animals.sandiegozoo.org/animals/hippo) ; [Smithsonian National Zoo — défenses et renouvellement des molaires](https://nationalzoo.si.edu/animals/asian-elephant).

### N005 — animaux, question nº 141

- Type : **ambiguite**.
- Emplacement : backend/data/animaux.json:1142 (index 140).
- Question : « Quel primate est le plus proche génétiquement de l'humain ? »
- Réponse actuellement acceptée : **Le bonobo**.
- Constat : Chimpanzé et bonobo sont également les plus proches parents vivants de l’humain ; les deux sont proposés, seul bonobo est accepté.
- Proposition : Proposer une réponse groupée chimpanzé et bonobo, ou poser un critère distinctif.
- Sources : [Smithsonian Human Origins — chimpanzé et bonobo également proches de l’humain](https://humanorigins.si.edu/evidence/genetics).

### N006 — animaux, question nº 152

- Type : **ambiguite**.
- Emplacement : backend/data/animaux.json:1153 (index 151).
- Question : « Quel animal sécrète un liquide nauséabond quand il se sent menacé ? »
- Réponse actuellement acceptée : **La mouffette**.
- Constat : Le putois, autre choix disponible, libère également une sécrétion malodorante lorsqu’il est menacé. Le comportement ne désigne pas exclusivement la mouffette.
- Proposition : Remplacer les distracteurs putois, blaireau et furet, qui empêchent d’identifier exclusivement la mouffette à partir de ce comportement ; ne pas se limiter à un pelage noir et blanc.
- Sources : [Animal Diversity Web — sécrétion défensive du putois](https://animaldiversity.org/accounts/Mustela_putorius/).

### N007 — animaux, question nº 153

- Type : **precision**.
- Emplacement : backend/data/animaux.json:1154 (index 152).
- Question : « Quel mammifère marin possède une corne torsadée pouvant mesurer 3 mètres ? »
- Réponse actuellement acceptée : **Le narval**.
- Constat : La structure torsadée du narval est une dent transformée en défense, et non une corne. La réponse narval demeure correcte.
- Proposition : Remplacer corne par longue défense torsadée.
- Sources : [NOAA — la défense du narval est une dent](https://www.fisheries.noaa.gov/species/narwhal).

### N008 — architecture_celebre, question nº 125

- Type : **factuel**.
- Emplacement : backend/data/architecture_celebre.json:1126 (index 124).
- Question : « Quel architecte danois a conçu le terminal TWA à l'aéroport JFK de New York ? »
- Réponse actuellement acceptée : **Eero Saarinen**.
- Constat : Eero Saarinen est qualifié de Danois alors qu’il est finno-américain. Son attribution du terminal TWA est correcte.
- Proposition : Remplacer danois par finno-américain, en gardant Eero Saarinen.
- Sources : [National Park Service — Eero Saarinen, architecte finno-américain](https://www.nps.gov/people/eero-saarinen.htm).

### N009 — attaque_des_titans, question nº 139

- Type : **factuel**.
- Emplacement : backend/data/attaque_des_titans.json:1521 (index 138).
- Question : « Quel personnage Mikasa décapite-t-elle dans le dernier chapitre du manga ? »
- Réponse actuellement acceptée : **Eren Jäger**.
- Constat : La décapitation d'Eren par Mikasa se déroule au chapitre 138, avant-dernier chapitre. Le dernier est le 139 et en montre les conséquences.
- Proposition : Remplacer « dans le dernier chapitre » par « au chapitre 138 » ou « à la fin du manga ». Conserver Eren.
- Sources : [Attack on Titan Wiki — A Long Dream, chapitre 138](https://attackontitan.fandom.com/wiki/A_Long_Dream_%28Chapter%29) ; [Attack on Titan Wiki — Toward the Tree on That Hill, chapitre final 139](https://attackontitan.fandom.com/wiki/Toward_the_Tree_on_That_Hill_%28Chapter%29).

### N010 — attaque_des_titans, question nº 149

- Type : **factuel**.
- Emplacement : backend/data/attaque_des_titans.json:1631 (index 148).
- Question : « Quel personnage perd un bras lors de la bataille de Shiganshina contre le Titan Bestial ? »
- Réponse actuellement acceptée : **Erwin Smith**.
- Constat : Erwin perd son bras pendant le sauvetage d'Eren capturé par Reiner et Bertolt (chapitre 49 / épisode 36). Il l'a déjà perdu lors de la reconquête de Shiganshina contre le Titan Bestial.
- Proposition : Demander qui perd son bras pendant le sauvetage d'Eren enlevé par Reiner et Bertolt.
- Sources : [Attack on Titan Wiki — Charge, épisode 36, scène de la perte du bras](https://attackontitan.fandom.com/wiki/Charge_%28Episode%29) ; [Crunchyroll — épisode 36, Charge : affrontement avec le Titan Cuirassé](https://www.crunchyroll.com/it/watch/G65VZWK36/charge).

### N011 — ballon_d_or, question nº 130

- Type : **ambiguite**.
- Emplacement : backend/data/ballon_d_or.json:1355 (index 129).
- Question : « Quel club a fourni le plus de lauréats du Ballon d'Or masculin ? »
- Réponse actuellement acceptée : **Le FC Barcelone**.
- Constat : Le Barça et le Real Madrid sont à égalité avec douze Ballons d'Or masculins dans le relevé officiel 2025 : choisir le seul Barça exclut une autre bonne réponse.
- Proposition : Dater le relevé et proposer 'Barcelone et Real Madrid, à égalité'.
- Sources : [FC Barcelona - FC Barcelona d'Or](https://foundation.fcbarcelona.com/en/news/4367951/fc-barcelona-dor).

### N012 — ballon_d_or, question nº 131

- Type : **ambiguite**.
- Emplacement : backend/data/ballon_d_or.json:1366 (index 130).
- Question : « Combien de joueurs différents du FC Barcelone ont remporté le Ballon d'Or ? »
- Réponse actuellement acceptée : **7**.
- Constat : Le libellé ne précise pas si les joueurs devaient être au Barça au moment du prix ou si les anciens joueurs comptent aussi, ni le périmètre masculin/féminin. Six est le compte masculin des personnes récompensées sous le maillot du Barça ; ce contrôle ne démontre pas simplement que sept serait faux pour tous les périmètres.
- Proposition : Préciser 'joueurs masculins ayant reçu le prix en évoluant au Barça' et proposer/marquer 6.
- Sources : [FC Barcelona - Barça d'Or](https://www.fcbarcelona.com/en/football/first-team/news/1513626) ; [FC Barcelona - 2025 men's and women's honours](https://foundation.fcbarcelona.com/en/news/4367951/fc-barcelona-dor).

### N013 — ballon_d_or, question nº 135

- Type : **ambiguite**.
- Emplacement : backend/data/ballon_d_or.json:1410 (index 134).
- Question : « Quel Brésilien a remporté deux Ballons d'Or consécutifs en 1997 et 1998 ? »
- Réponse actuellement acceptée : **Ronaldo en 1997, Zidane en 1998**.
- Constat : La question présuppose deux victoires consécutives d'un Brésilien ; Ronaldo gagne en 1997 et le Français Zidane en 1998. Les choix 0 et 3 disent aussi la même chose.
- Proposition : Demander qui a gagné en 1998 (Zidane), ou retirer cette question.
- Sources : [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/).

### N014 — ballon_d_or, question nº 136

- Type : **factuel**.
- Emplacement : backend/data/ballon_d_or.json:1421 (index 135).
- Question : « Quel joueur néerlandais a terminé deuxième du Ballon d'Or 2010 ? »
- Réponse actuellement acceptée : **Wesley Sneijder**.
- Constat : Le deuxième en 2010 est Andrés Iniesta ; Sneijder n'est pas sur le podium.
- Proposition : Remplacer le libellé par 'Quel joueur a terminé deuxième en 2010 ?' et proposer/marquer Iniesta.
- Sources : [FC Barcelona - 10 years since a unique Ballon d'Or podium](https://www.fcbarcelona.com/en/football/first-team/news/1924303/10/featured).

### N015 — ballon_d_or, question nº 138

- Type : **factuel**.
- Emplacement : backend/data/ballon_d_or.json:1443 (index 137).
- Question : « Quel attaquant argentin de la Fiorentina a remporté le Ballon d'Or en 1957 ? »
- Réponse actuellement acceptée : **Alfredo Di Stéfano**.
- Constat : Di Stéfano remporte le trophée 1957 au Real Madrid, pas à la Fiorentina.
- Proposition : Remplacer Fiorentina par Real Madrid.
- Sources : [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/).

### N016 — ballon_d_or, question nº 147

- Type : **factuel**.
- Emplacement : backend/data/ballon_d_or.json:1542 (index 146).
- Question : « Quel joueur italien de l'Inter Milan a remporté le Ballon d'Or en 1961 ? »
- Réponse actuellement acceptée : **Omar Sívori**.
- Constat : Omar Sívori remporte le Ballon d'Or 1961 à la Juventus, pas à l'Inter.
- Proposition : Remplacer Inter Milan par Juventus.
- Sources : [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/).

### N017 — ballon_d_or, question nº 149

- Type : **factuel**.
- Emplacement : backend/data/ballon_d_or.json:1564 (index 148).
- Question : « Quel joueur néerlandais de l'AC Milan a remporté trois Ballons d'Or consécutifs de 1988 à 1990 ? »
- Réponse actuellement acceptée : **Marco van Basten**.
- Constat : Van Basten gagne en 1988, 1989 et 1992 ; le vainqueur 1990 est Matthäus.
- Proposition : Remplacer 'trois ... consécutifs de 1988 à 1990' par 'en 1988, 1989 et 1992'.
- Sources : [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/).

### N018 — ballon_d_or, question nº 152

- Type : **factuel**.
- Emplacement : backend/data/ballon_d_or.json:1597 (index 151).
- Question : « Quel joueur a terminé deuxième du Ballon d'Or 2015 derrière Messi ? »
- Réponse actuellement acceptée : **Neymar**.
- Constat : Le deuxième du Ballon d'Or 2015 est Cristiano Ronaldo ; Neymar est troisième.
- Proposition : Marquer Cristiano Ronaldo (choix 0).
- Sources : [FIFA - Ballon d'Or 2015 voting results](https://img.fifa.com/image/upload/fvj8uf4ekirhc2bg0o2x.pdf).

### N019 — bayern_munich, question nº 105

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1147 (index 104).
- Question : « Quel milieu autrichien a joué pour le Bayern de 2016 à 2022 ? »
- Réponse actuellement acceptée : **David Alaba**.
- Constat : David Alaba quitte le club en 2021 après treize ans ; la période 2016-2022 est fausse.
- Proposition : Demander quel Autrichien quitte le Bayern en 2021 après treize ans au club.
- Sources : [FC Bayern - Farewell to club legends](https://fcbayern.com/de/news/2021/05/meister-2021/fc-bayern-verabschiedet-vereins-legenden).

### N020 — bayern_munich, question nº 107

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1169 (index 106).
- Question : « Quel attaquant ivoirien a joué un rôle clé au Bayern en 2024-2025 ? »
- Réponse actuellement acceptée : **Mathys Tel**.
- Constat : Mathys Tel est international espoirs français ; la source de son prêt explique aussi son faible temps de jeu avant février 2025. Le qualifier d'attaquant ivoirien clé de 2024-2025 est erroné.
- Proposition : Demander quel attaquant français a été prêté à Tottenham en février 2025.
- Sources : [FC Bayern - Mathys Tel joins Tottenham on loan](https://fcbayern.com/en/news/2025/02/mathys-tel-joins-tottenham-hotspur-on-loan).

### N021 — bayern_munich, question nº 113

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1235 (index 112).
- Question : « Quel défenseur français a joué pour le Bayern de 2019 à 2024 ? »
- Réponse actuellement acceptée : **Benjamin Pavard**.
- Constat : Pavard joue au Bayern de 2019 à 2023 et part à l'Inter en août 2023.
- Proposition : Remplacer 2024 par 2023.
- Sources : [FC Bayern - Benjamin Pavard joins Inter](https://fcbayern.com/de/news/2023/08/benjamin-pavard-vom-fc-bayern-zu-inter-mailand).

### N022 — bayern_munich, question nº 119

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1301 (index 118).
- Question : « Quel club le Bayern a-t-il battu 8-0 en quart de finale de Ligue des champions 2020 ? »
- Réponse actuellement acceptée : **Le FC Barcelone**.
- Constat : La victoire en quart de finale 2020 est 8-2, pas 8-0 (contradiction aussi avec la ligne 119).
- Proposition : Remplacer 8-0 par 8-2.
- Sources : [FC Bayern - Barcelona 2:8 Bayern](https://fcbayern.com/de/news/spielberichte/2020/08/spielbericht-champions-league-fc-barcelona---fc-bayern).

### N023 — bayern_munich, question nº 120

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1312 (index 119).
- Question : « Quel joueur du Bayern a marqué quatre buts contre le Barça lors du 8-2 en 2020 ? »
- Réponse actuellement acceptée : **Thomas Müller**.
- Constat : Müller marque deux buts, pas quatre. Aucun Bavarois ne marque quatre fois dans ce match.
- Proposition : Remplacer quatre par deux et retirer Coutinho des distracteurs (il marque lui aussi deux buts), ou préciser l'auteur des 1er et 4e buts.
- Sources : [FC Bayern - Barcelona 2:8 Bayern](https://fcbayern.com/de/news/spielberichte/2020/08/spielbericht-champions-league-fc-barcelona---fc-bayern).

### N024 — bayern_munich, question nº 133

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1455 (index 132).
- Question : « Quel milieu espagnol a joué pour le Bayern de 2013 à 2015 ? »
- Réponse actuellement acceptée : **Xabi Alonso**.
- Constat : Xabi Alonso arrive du Real en 2014 ; son contrat est prolongé en décembre 2015 jusqu'en 2017. La période 2013-2015 est fausse.
- Proposition : Écrire 2014 à 2017.
- Sources : [FC Bayern - Contract extensions](https://fcbayern.com/de/news/2015/12/fcb-verlangert-vertrage-mit-muller-boateng-martinez-und-alonso).

### N025 — bayern_munich, question nº 139

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1521 (index 138).
- Question : « Quel attaquant du Bayern a été meilleur buteur de Bundesliga sept saisons consécutives ? »
- Réponse actuellement acceptée : **Robert Lewandowski**.
- Constat : Lewandowski a sept titres de meilleur buteur au total, dont cinq consécutifs, pas sept consécutifs.
- Proposition : Remplacer sept saisons consécutives par cinq saisons consécutives.
- Sources : [Bundesliga - Robert Lewandowski legend](https://www.bundesliga.com/en/bundesliga/news/robert-lewandowski-bayern-munich-transfer-to-barcelona-legend-20569).

### N026 — bayern_munich, question nº 142

- Type : **precision**.
- Emplacement : backend/data/bayern_munich.json:1554 (index 141).
- Question : « Quel milieu de terrain français a joué au Bayern de 2015 à 2019 ? »
- Réponse actuellement acceptée : **Franck Ribéry**.
- Constat : La période mentionnée est contenue dans le passage réel au club et n’est donc pas nécessairement fausse comme sous-période. Pour donner le passage complet, la proposition suivante est plus précise : Écrire de 2007 à 2019.
- Proposition : Écrire de 2007 à 2019.
- Sources : [DFB - Franck Ribery player history](https://datencenter.dfb.de/en/people/franck-ribery/player).

### N027 — bayern_munich, question nº 147

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1609 (index 146).
- Question : « Quel club marocain le Bayern a-t-il battu en demi-finale du Mondial des clubs 2013 ? »
- Réponse actuellement acceptée : **Raja Casablanca**.
- Constat : Le Bayern affronte Guangzhou Evergrande, club chinois, en demi-finale 2013 ; le Raja est l'adversaire de la finale (comme le dit aussi 147).
- Proposition : Remplacer demi-finale par finale.
- Sources : [FC Bayern - Classy Bayern move step closer to fifth trophy](https://fcbayern.com/en/news/matchreports/2013/12/match-report-guangzhou---bayern).

### N028 — bayern_munich, question nº 149

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1631 (index 148).
- Question : « Quel milieu allemand formé au Bayern a rejoint Leipzig puis le Bayern de nouveau ? »
- Réponse actuellement acceptée : **Konrad Laimer**.
- Constat : Laimer est autrichien et formé à Salzbourg ; il rejoint le Bayern depuis Leipzig en 2023 pour la première fois.
- Proposition : Écrire 'Quel milieu autrichien formé à Salzbourg a rejoint le Bayern depuis Leipzig en 2023 ?'.
- Sources : [FC Bayern - Konrad Laimer quiz with answers](https://fcbayern.com/kidsclub/de/gaudi/2023/raetsel-2324/raetselspass-konrad-laimer).

### N029 — bayern_munich, question nº 150

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1642 (index 149).
- Question : « Quel joueur du Bayern a inscrit 365 buts en Bundesliga, record qui a tenu jusqu'en 2021 ? »
- Réponse actuellement acceptée : **Gerd Müller**.
- Constat : Les 365 buts de Gerd Müller restent le record de carrière de Bundesliga. Le record battu en 2021 est celui des buts sur une saison (40, dépassé par les 41 de Lewandowski).
- Proposition : Retirer 'qui a tenu jusqu'en 2021' ou reformuler sur le record de 40 buts en une saison.
- Sources : [Bundesliga - records (31 August 2026)](https://www.bundesliga.com/en/faq/10-things-on-the-bundesliga/bundesliga-records-goals-titles-attendances-for-players-and-clubs-10555).

### N030 — bayern_munich, question nº 152

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1664 (index 151).
- Question : « Quel attaquant espagnol a joué au Bayern de 2010 à 2013 ? »
- Réponse actuellement acceptée : **Mario Gómez**.
- Constat : Mario Gómez est international allemand et rejoint le Bayern en 2009, pas en 2010.
- Proposition : Écrire 'Quel attaquant allemand a rejoint le Bayern en 2009 depuis Stuttgart ?'.
- Sources : [FC Bayern - The historic treble](https://fcbayern.com/en/club/history/mile-stones/2010-to-2013-the-historic-treble).

### N031 — bayern_munich, question nº 153

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1675 (index 152).
- Question : « Quel joueur néerlandais a joué pour le Bayern et Arsenal ? »
- Réponse actuellement acceptée : **Arjen Robben**.
- Constat : Le parcours officiel de Robben comprend Groningen, PSV, Chelsea, Real Madrid, Bayern et Groningen ; il ne passe pas par Arsenal.
- Proposition : Remplacer Arsenal par Chelsea.
- Sources : [Eredivisie - Arjen Robben career](https://eredivisie.nl/nieuws/arjen-robben-zet-punt-achter-imposante-carriere/).

### N032 — bayern_munich, question nº 156

- Type : **ambiguite**.
- Emplacement : backend/data/bayern_munich.json:1708 (index 155).
- Question : « Quel joueur du Bayern a marqué lors de la Supercoupe d'Europe 2020 contre Séville ? »
- Réponse actuellement acceptée : **Javi Martínez**.
- Constat : Goretzka et Javi Martínez marquent tous deux lors du 2-1 contre Séville en 2020 ; deux réponses sont correctes.
- Proposition : Préciser 'a marqué le but de la victoire en prolongation' (Javi Martínez).
- Sources : [UEFA - Super Cup 2020](https://de.uefa.com/uefasupercup/history/2020/).

### N033 — bayern_munich, question nº 158

- Type : **factuel**.
- Emplacement : backend/data/bayern_munich.json:1730 (index 157).
- Question : « Quel joueur du Bayern a été élu meilleur joueur de la Coupe du monde 2010 ? »
- Réponse actuellement acceptée : **Thomas Müller**.
- Constat : Le meilleur joueur du Mondial 2010 est Forlán. Müller obtient le Soulier d'or et le prix du meilleur jeune.
- Proposition : Écrire 'meilleur jeune joueur de la Coupe du monde 2010'.
- Sources : [FIFA - Pride for Africa as Spain strike gold](https://inside.fifa.com/en/tournaments/mens/worldcup/2010south-africa/news/pride-for-africa-spain-strike-gold-2247372).

### N034 — beyonce, question nº 142

- Type : **factuel**.
- Emplacement : backend/data/beyonce.json:1504 (index 141).
- Question : « Quel producteur nigérian a travaillé sur plusieurs titres de Renaissance ? »
- Réponse actuellement acceptée : **P2J**.
- Constat : P2J est crédité sur MOVE seulement dans la liste complète de Renaissance ; « plusieurs titres » est faux.
- Proposition : Demander quel producteur a coproduit MOVE avec Beyoncé ; réponse P2J.
- Sources : [Renaissance : crédits complets](https://pitchfork.com/news/beyonce-releases-new-album-renaissance-listen/).

### N035 — beyonce, question nº 146

- Type : **factuel**.
- Emplacement : backend/data/beyonce.json:1548 (index 145).
- Question : « Quelle chanteuse de gospel apparaît sur 'Daddy Lessons' en version live aux CMA Awards ? »
- Réponse actuellement acceptée : **The Chicks (Dixie Chicks)**.
- Constat : The Chicks est un groupe de country, pas une chanteuse de gospel.
- Proposition : Remplacer le début par « Quel groupe de country accompagne Beyoncé sur Daddy Lessons aux CMA Awards 2016 ? ».
- Sources : [Beyoncé et The Chicks aux CMA](https://ca.billboard.com/music/music-news/beyonce-cmas-cowboy-carter-1235636304/).

### N036 — beyonce, question nº 147

- Type : **factuel**.
- Emplacement : backend/data/beyonce.json:1559 (index 146).
- Question : « Quel producteur français a co-produit 'Crazy in Love' ? »
- Réponse actuellement acceptée : **Rich Harrison**.
- Constat : Rich Harrison est américain, pas français ; la réponse cochée contredit la prémisse.
- Proposition : Cocher « Aucun producteur français » ou retirer « français » et conserver Rich Harrison.
- Sources : [Rich Harrison, producteur américain](https://en.wikipedia.org/wiki/Rich_Harrison).

### N037 — beyonce, question nº 160

- Type : **factuel**.
- Emplacement : backend/data/beyonce.json:1702 (index 159).
- Question : « Quel sample classique de house music est utilisé sur 'ENERGY' de Renaissance ? »
- Réponse actuellement acceptée : **'Miss Elliott - Get Ur Freak On' via BEAM**.
- Constat : ENERGY n'interpole pas Get Ur Freak On de Missy Elliott. Les éléments documentés viennent de Teena Marie et, dans la version initiale, de Kelis.
- Proposition : Remplacer la question par une interpolation attestée : Ooh La La La de Teena Marie ; préciser la version pour Milkshake.
- Sources : [Pitchfork — crédits complets Renaissance, 05 Energy](https://pitchfork.com/news/beyonce-releases-new-album-renaissance-listen/).

### N038 — cristiano_ronaldo, question nº 130

- Type : **factuel**.
- Emplacement : backend/data/cristiano_ronaldo.json:1322 (index 129).
- Question : « En quelle année Ronaldo a-t-il marqué 69 buts toutes compétitions confondues avec le Real Madrid ? »
- Réponse actuellement acceptée : **2011-2012**.
- Constat : Le record de saison de Ronaldo au Real est 61 buts en 2014-2015. Aucun des exercices proposés ne correspond à 69 buts toutes compétitions au Real.
- Proposition : Demander l'exercice de ses 61 buts : 2014-2015.
- Sources : [UEFA - Cristiano Ronaldo adds to record collection](https://www.uefa.com/uefachampionsleague/news/0253-0d7f1c7af7b5-61da696c8990-1000--cristiano-ronaldo-adds-to-record-collection/).

### N039 — cristiano_ronaldo, question nº 131

- Type : **factuel**.
- Emplacement : backend/data/cristiano_ronaldo.json:1333 (index 130).
- Question : « Quel club allemand Ronaldo a-t-il affronté lors d'un triplé en demi-finale de Ligue des champions 2017 ? »
- Réponse actuellement acceptée : **L'Atlético de Madrid**.
- Constat : L'Atlético de Madrid est espagnol ; il est bien l'adversaire du triplé en demi-finale 2017.
- Proposition : Remplacer allemand par espagnol.
- Sources : [UEFA - Ronaldo hat-trick leaves Real Madrid on brink](https://www.uefa.com/uefachampionsleague/news/0239-0e96d80bccab-59a3cd0ec78a-1000/).

### N040 — cristiano_ronaldo, question nº 135

- Type : **precision**.
- Emplacement : backend/data/cristiano_ronaldo.json:1377 (index 134).
- Question : « Quel club Ronaldo a-t-il éliminé d'un triplé en quarts de Ligue des champions 2018 ? »
- Réponse actuellement acceptée : **La Juventus**.
- Constat : Ronaldo marque deux buts à l'aller puis un au retour contre la Juventus en quarts 2018. Aucun triplé sur un match ; le libellé peut confondre trois buts sur la confrontation et un triplé.
- Proposition : Écrire 'a marqué trois buts sur l'ensemble des deux matchs de quarts en 2018'.
- Sources : [UEFA - How Madrid and Liverpool reached the final](https://www.uefa.com/uefachampionsleague/news/0245-0e98d19961a0-948d8f745d6c-1000--how-madrid-and-liverpool-reached-the-final/).

### N041 — cristiano_ronaldo, question nº 141

- Type : **factuel**.
- Emplacement : backend/data/cristiano_ronaldo.json:1443 (index 140).
- Question : « Quel record Ronaldo a-t-il établi en marquant lors de 11 matchs consécutifs en Liga ? »
- Réponse actuellement acceptée : **La plus longue série de matchs consécutifs en marquant en Liga**.
- Constat : Le record de matchs consécutifs en marquant en Liga est de 21, établi par Messi en 2012-2013 ; onze n'est pas le record.
- Proposition : Demander le record de Messi (21) ou remplacer la compétition et dater un record précis de Ronaldo.
- Sources : [Guinness World Records - Most consecutive games scored in La Liga](https://www.guinnessworldrecords.com/world-records/725235-most-consecutive-games-scored-in-la-liga-by-an-individual).

### N042 — cristiano_ronaldo, question nº 155

- Type : **ambiguite**.
- Emplacement : backend/data/cristiano_ronaldo.json:1597 (index 154).
- Question : « Combien de buts Ronaldo a-t-il marqués lors de sa deuxième saison à la Juventus (2019-2020) ? »
- Réponse actuellement acceptée : **31**.
- Constat : Ronaldo marque 37 buts toutes compétitions avec la Juventus en 2019-2020. Les 31 concernent la Serie A, que le libellé ne précise pas.
- Proposition : Préciser toutes compétitions et marquer 37 (choix 3), ou ajouter 'en Serie A'.
- Sources : [Juventus official - All 37 Ronaldo goals 2019/20](https://www.youtube.com/watch?v=DhU9bMMaLYw).

### N043 — demon_slayer, question nº 128

- Type : **precision**.
- Emplacement : backend/data/demon_slayer.json:1300 (index 127).
- Question : « Quel Pilier possède une force musculaire huit fois supérieure à la normale ? »
- Réponse actuellement acceptée : **Mitsuri Kanroji**.
- Constat : Le facteur huit concerne la densité musculaire exceptionnelle de Mitsuri ; le texte le transforme en mesure précise de sa force, ce que cette donnée n'établit pas (révélation au chapitre 123).
- Proposition : Remplacer « une force musculaire huit fois supérieure » par « une densité musculaire huit fois supérieure ».
- Sources : [Kimetsu no Yaiba Wiki — Mitsuri Kanroji, Abnormal Muscular Constitution](https://kimetsu-no-yaiba.fandom.com/wiki/Mitsuri_Kanroji) ; [Anime Explained — How Strong Is Mitsuri Kanroji, densité des fibres et chapitre 123](https://www.animeexplained.com/explained/how-strong-is-mitsuri-kanroji-in-demon-slayer-analyzing-the-love-hashiras-power/).

### N044 — dinosaures, question nº 114

- Type : **factuel**.
- Emplacement : backend/data/dinosaures.json:1115 (index 113).
- Question : « Quel dinosaure du Crétacé supérieur possédait un bec de perroquet et une collerette ? »
- Réponse actuellement acceptée : **Psittacosaurus**.
- Constat : Psittacosaurus vivait au Crétacé inférieur, pas supérieur. Les autres choix comprennent des cératopsiens du Crétacé supérieur, ce qui aggrave l’ambiguïté.
- Proposition : Réécrire l’énoncé sur Psittacosaurus au Crétacé inférieur et son bec de perroquet, sans lui attribuer une grande collerette typique d’autres cératopsiens.
- Sources : [Natural History Museum — Psittacosaurus, Crétacé inférieur](https://www.nhm.ac.uk/discover/dino-directory/psittacosaurus.html).

### N045 — dinosaures, question nº 127

- Type : **factuel**.
- Emplacement : backend/data/dinosaures.json:1128 (index 126).
- Question : « Quel dinosaure herbivore du Jurassique possédait de longues épines sur le cou ? »
- Réponse actuellement acceptée : **Amargasaurus**.
- Constat : Amargasaurus est un sauropode du Crétacé inférieur, pas du Jurassique.
- Proposition : Remplacer Jurassique par Crétacé inférieur.
- Sources : [Natural History Museum — Amargasaurus, Crétacé inférieur](https://www.nhm.ac.uk/discover/dino-directory/amargasaurus.html).

### N046 — dinosaures, question nº 146

- Type : **factuel**.
- Emplacement : backend/data/dinosaures.json:1147 (index 145).
- Question : « Quel dinosaure a été le premier à être découvert en Antarctique ? »
- Réponse actuellement acceptée : **Cryolophosaurus**.
- Constat : La question confond découverte et description : Cryolophosaurus n’est pas le premier fossile de dinosaure découvert en Antarctique. Antarctopelta a été découvert en 1986 ; un fossile récolté en 1985 a même été reconnu et décrit en 2026.
- Proposition : Demander quel dinosaure non avien découvert en Antarctique a été le premier officiellement nommé (Cryolophosaurus, en 1994), au lieu de confondre date de découverte et de description.
- Sources : [British Antarctic Survey — premier fossile trouvé en 1985, confirmé en 2026](https://www.bas.ac.uk/news/antarcticas-first-dinosaur-fossil-confirmed-from-1985-antarctic-expedition/) ; [CONICET — découverte d’Antarctopelta en 1986](https://www.conicet.gov.ar/homenaje-al-cientifico-del-cadic-que-encontro-el-primer-dinosaurio-de-antartida/) ; [Natural History Museum — Cryolophosaurus](https://www.nhm.ac.uk/discover/dino-directory/cryolophosaurus.html) ; [United States Antarctic Program — découverte et premier dinosaure nommé](https://www.usap.gov/news/4583/).

### N047 — dinosaures, question nº 153

- Type : **factuel**.
- Emplacement : backend/data/dinosaures.json:1154 (index 152).
- Question : « Quel dinosaure carnivore du Crétacé supérieur d'Amérique du Nord avait une corne nasale ? »
- Réponse actuellement acceptée : **Ceratosaurus**.
- Constat : Ceratosaurus vivait au Jurassique supérieur, pas au Crétacé supérieur.
- Proposition : Remplacer Crétacé supérieur par Jurassique supérieur.
- Sources : [Natural History Museum — Ceratosaurus, Jurassique supérieur](https://www.nhm.ac.uk/discover/dino-directory/ceratosaurus.html).

### N048 — dragon_ball, question nº 136

- Type : **precision**.
- Emplacement : backend/data/dragon_ball.json:1388 (index 135).
- Question : « Quel est le niveau de puissance de Goku quand il arrive sur Namek d'après le scouter ? »
- Réponse actuellement acceptée : **90 000**.
- Constat : La réponse 90 000 renvoie à la puissance de base donnée dans les guides. La mention d’après le scouter et le moment de mesure demandent une précision : les lectures citées dans le récit incluent 5 000 et 180 000 avec le Kaioken. Le contrôle ne rejette pas 90 000 comme puissance de base.
- Proposition : Préciser « Quelle valeur le scouter de Ginyu affiche-t-il initialement pour Goku ? » et marquer 5 000, ou poser une question distincte sur les 180 000 avec Kaioken.
- Sources : [Dragon Ball Official — Character Showcase #117: Ginyu, Tale 285](https://en.dragon-ball-official.com/news/01_2068.html).

### N049 — dragon_ball, question nº 138

- Type : **factuel**.
- Emplacement : backend/data/dragon_ball.json:1410 (index 137).
- Question : « Quel est le vrai nom de Mr Satan ? »
- Réponse actuellement acceptée : **Hercule**.
- Constat : Le site officiel indique que le véritable nom de Mr Satan est Mark. « Hercule » est un nom de localisation anglophone, pas son véritable nom révélé par Toriyama.
- Proposition : Marquer « Mark », déjà proposé, comme bonne réponse.
- Sources : [Dragon Ball Official — Character Showcase #64: Mr. Satan, Trivia](https://en.dragon-ball-official.com/news/01_1268.html).

### N050 — dragon_ball, question nº 141

- Type : **ambiguite**.
- Emplacement : backend/data/dragon_ball.json:1443 (index 140).
- Question : « Quel est le pouvoir spécial du scouter utilisé par les soldats de Freezer ? »
- Réponse actuellement acceptée : **Mesurer les niveaux de puissance**.
- Constat : Le scouter mesure la puissance mais possède également une fonction de communication. « Communiquer avec Freezer » décrit donc une autre de ses utilisations ; le libellé général « pouvoir spécial » ne distingue pas les deux fonctions.
- Proposition : Demander « Quelle grandeur le scouter mesure-t-il ? » et conserver les niveaux de puissance ; remplacer le distracteur sur la communication.
- Sources : [Dragon Ball Official — Why Do Scouters Explode, appareil de calcul et communication](https://en.dragon-ball-official.com/news/01_1666.html) ; [Dragon Ball Official — Character Showcase #21: Raditz, communication via scouter](https://dragon-ball-official.com/news/01_504.html) ; [Dragon Ball Wiki — Scouter, communication des soldats de Freezer](https://dragonball.fandom.com/wiki/Scouter).

### N051 — equipe_de_france_football, question nº 110

- Type : **factuel**.
- Emplacement : backend/data/equipe_de_france_football.json:1116 (index 109).
- Question : « Quel attaquant français a inscrit quatre buts contre l'Argentine en huitièmes du Mondial 2018 ? »
- Réponse actuellement acceptée : **Kylian Mbappé**.
- Constat : Mbappé marque deux fois, pas quatre, contre l'Argentine en huitième 2018 ; la France gagne 4-3.
- Proposition : Remplacer quatre buts par deux buts.
- Sources : [FIFA - France v Argentina classic 2018](https://www.fifa.com/en/articles/france-argentina-fifa-world-cup-2018).

### N052 — equipe_de_france_football, question nº 112

- Type : **factuel**.
- Emplacement : backend/data/equipe_de_france_football.json:1138 (index 111).
- Question : « Quel joueur français a inscrit le premier but de la finale du Mondial 2018 ? »
- Réponse actuellement acceptée : **Mario Mandžukić (csc)**.
- Constat : La question demande un joueur français, mais la réponse marquée est Mandžukić ; la ligne 125 indique explicitement qu'il est Croate.
- Proposition : Demander 'À quel joueur est attribué le premier but de la finale 2018 ?' en conservant le CSC de Mandžukić.
- Preuve : Contradiction explicite dans les énoncés ou choix de cette banque ; pas de source externe utilisée pour ce constat.

### N053 — equipe_de_france_football, question nº 136

- Type : **factuel**.
- Emplacement : backend/data/equipe_de_france_football.json:1402 (index 135).
- Question : « Quel milieu de terrain français a été élu meilleur joueur de la Coupe des Confédérations 2003 ? »
- Réponse actuellement acceptée : **Thierry Henry**.
- Constat : Henry remporte bien le Ballon d'or de la Coupe des Confédérations 2003, mais c'est un attaquant, pas un milieu.
- Proposition : Remplacer milieu de terrain par attaquant.
- Sources : [FIFA - Henry secures France title defence](https://inside.fifa.com/tournaments/mens/confederationscup/france2003/news/the-decisive-goal-henry-secures-france-title-defence-2884187).

### N054 — equipe_de_france_football, question nº 150

- Type : **factuel**.
- Emplacement : backend/data/equipe_de_france_football.json:1556 (index 149).
- Question : « Quel joueur a inscrit le centième but de la France en Coupe du monde ? »
- Réponse actuellement acceptée : **Kylian Mbappé**.
- Constat : Le centième but des Bleus en Coupe du monde est marqué par Olivier Giroud contre la Suisse le 20 juin 2014.
- Proposition : Marquer Olivier Giroud (choix 2).
- Sources : [FFF - Suisse France 20 juin 2014](https://www.fff.fr/selection/matchs/1639-suisse-france.html).

### N055 — equipe_de_france_football, question nº 158

- Type : **factuel**.
- Emplacement : backend/data/equipe_de_france_football.json:1644 (index 157).
- Question : « Quel joueur a été élu homme du match de la finale du Mondial 2022 ? »
- Réponse actuellement acceptée : **Kylian Mbappé**.
- Constat : L'homme du match officiel de la finale 2022 est Lionel Messi, pas Mbappé.
- Proposition : Marquer Lionel Messi (choix 0).
- Sources : [FIFA official - Lionel Messi Player of the Match Argentina vs France](https://www.youtube.com/watch?v=DTXVOJkb-y8).

### N056 — hunter_x_hunter, question nº 104

- Type : **factuel**.
- Emplacement : backend/data/hunter_x_hunter.json:1036 (index 103).
- Question : « Quel est le numéro de candidat de Gon à l'examen Hunter ? »
- Réponse actuellement acceptée : **99**.
- Constat : Le badge de Gon à son examen Hunter porte le numéro 405 ; 99 est celui de Killua. Le tableau du 287e examen donne explicitement ces numéros.
- Proposition : Marquer « 405 », déjà proposé, comme bonne réponse.
- Sources : [Hunterpedia — 287th Hunter Exam, tableau des candidats](https://hunterxhunter.fandom.com/wiki/287th_Hunter_Exam) ; [Game8 — Nen Survivor, explication des numéros 44, 99 et 405](https://game8.jp/hunterhunter-nensaba/781674).

### N057 — hunter_x_hunter, question nº 129

- Type : **ambiguite**.
- Emplacement : backend/data/hunter_x_hunter.json:1311 (index 128).
- Question : « Quel pays fictif est envahi par les Fourmis-Chimères ? »
- Réponse actuellement acceptée : **NGL**.
- Constat : Les Fourmis-Chimères envahissent NGL puis Gorteau de l'Est. Les deux pays figurent dans les choix et le libellé ne précise ni première implantation ni étape de l'arc.
- Proposition : Demander « Dans quel pays la reine des Fourmis-Chimères s'installe-t-elle au début de l'arc ? » pour NGL ; ou cibler la prise du palais pour Gorteau de l'Est.
- Sources : [NTV — Hunter x Hunter, épisode 79, Fourmis-Chimères à NGL](https://www.ntv.co.jp/hunterhunter/story/079.html) ; [VIZ — Manga Spotlight: HUNTER x HUNTER 27, NGL puis conquête de Gorteau de l'Est](https://www.viz.com/blog/posts/manga-spotlight-hunter-x-hunter-27-41).

### N058 — hunter_x_hunter, question nº 135

- Type : **factuel**.
- Emplacement : backend/data/hunter_x_hunter.json:1377 (index 134).
- Question : « Quel Fourmi-Chimère devient gouverneur de la République de Gorteau de l'Est ? »
- Réponse actuellement acceptée : **Meruem sous l'identité de Ming Jol-ik**.
- Constat : Meruem ne se fait pas passer personnellement pour Ming Jol-ik. Il tue son sosie officiel ; Neferpitou répare et manipule ce cadavre pour diffuser les ordres publics, tandis que Meruem commande. La réponse marquée confond souverain réel et identité utilisée par une marionnette.
- Proposition : Demander « Qui manipule le cadavre du dirigeant de Gorteau de l'Est ? » et marquer Neferpitou.
- Sources : [Hunterpedia — Ming Jol-ik's Double, mort et manipulation du cadavre](https://hunterxhunter.fandom.com/wiki/Ming_Jol-ik%27s_Double) ; [Hunterpedia — Neferpitou, contrôle public de Gorteau](https://hunterxhunter.fandom.com/wiki/Neferpitou).

### N059 — hunter_x_hunter, question nº 142

- Type : **factuel**.
- Emplacement : backend/data/hunter_x_hunter.json:1454 (index 141).
- Question : « Quel membre de la Brigade Fantôme possède la capacité de téléporter des objets ? »
- Réponse actuellement acceptée : **Kortopi**.
- Constat : Gallery Fake de Kortopi matérialise des copies d'objets touchés ; ce n'est pas une téléportation. Aucune des réponses proposées ne corrige la confusion dans ce libellé.
- Proposition : Remplacer « téléporter des objets » par « créer des copies d'objets » ; conserver Kortopi. Attention : cette question devient proche de l'index 151, doublon éditorial à gérer séparément.
- Sources : [Hunterpedia — Kortopi, Gallery Fake : copie main gauche/main droite](https://hunterxhunter.fandom.com/wiki/Kortopi).

### N060 — hunter_x_hunter, question nº 159

- Type : **factuel**.
- Emplacement : backend/data/hunter_x_hunter.json:1641 (index 158).
- Question : « Quel examinateur de l'examen Hunter possède la capacité de lancer des épingles ? »
- Réponse actuellement acceptée : **Gittarackur**.
- Constat : Gittarackur/Illumi est un candidat au 287e examen, numéro 301, et non un examinateur. La capacité identifie le bon personnage mais son rôle dans la question est faux.
- Proposition : Remplacer « Quel examinateur » par « Quel candidat ».
- Sources : [Hunterpedia — Illumi Zoldyck, Hunter Exam arc](https://hunterxhunter.fandom.com/wiki/Illumi_Zoldyck) ; [Hunterpedia — 287th Hunter Exam, tableau des candidats](https://hunterxhunter.fandom.com/wiki/287th_Hunter_Exam).

### N061 — jujutsu_kaisen, question nº 118

- Type : **factuel**.
- Emplacement : backend/data/jujutsu_kaisen.json:1190 (index 117).
- Question : « Quelle est la technique héréditaire de la famille Fushiguro ? »
- Réponse actuellement acceptée : **La Technique des Dix Ombres**.
- Constat : La fiche officielle de Megumi dit explicitement que les Dix Ombres sont une technique héréditaire du clan Zenin. Fushiguro est son nom, pas le clan auquel la technique appartient.
- Proposition : Remplacer « de la famille Fushiguro » par « du clan Zenin, utilisée par Megumi Fushiguro ».
- Sources : [Site officiel Jujutsu Kaisen — Megumi Fushiguro, 禪院家相伝の術式](https://jujutsukaisen.jp/character/).

### N062 — jujutsu_kaisen, question nº 123

- Type : **factuel**.
- Emplacement : backend/data/jujutsu_kaisen.json:1245 (index 122).
- Question : « Quel événement marque la fin de l'arc de Shibuya ? »
- Réponse actuellement acceptée : **Le scellement de Gojo**.
- Constat : Le scellement de Gojo intervient au début de Shibuya : il est déjà annoncé à l'épisode 34, tandis que la phase finale de l'arc arrive à l'épisode 47. Il ne marque pas la fin de l'arc.
- Proposition : Demander « Quel événement majeur survient au début de l'incident de Shibuya ? » ou remplacer les choix par un événement de la conclusion.
- Sources : [Site officiel Jujutsu Kaisen — épisode 34, annonce du scellement](https://jujutsukaisen.jp/episodes/34.php) ; [Site officiel Jujutsu Kaisen — épisode 47, phase finale de Shibuya](https://jujutsukaisen.jp/episodes/47.php).

### N063 — jujutsu_kaisen, question nº 136

- Type : **factuel**.
- Emplacement : backend/data/jujutsu_kaisen.json:1388 (index 135).
- Question : « Quel exorciste ancien de l'ère Heian utilise la foudre comme arme dans le Jeu de l'extermination ? »
- Réponse actuellement acceptée : **Hajime Kashimo**.
- Constat : Kashimo est un sorcier d'environ 400 ans avant l'époque présente, pas de l'ère Heian. L'annonce du diffuseur licencié le décrit explicitement comme venant de 400 ans dans le passé.
- Proposition : Supprimer « de l'ère Heian » ou remplacer par « ayant vécu environ 400 ans auparavant ».
- Sources : [Crunchyroll — Season 3 Casts Ryohei Kimura as Hajime Kashimo, origine il y a 400 ans](https://www.crunchyroll.com/id/news/latest/2026/2/5/jujutsu-kaisen-season-3-anime-casts-ryohei-kimura-as-hajime-kashimo).

### N064 — jujutsu_kaisen, question nº 139

- Type : **factuel**.
- Emplacement : backend/data/jujutsu_kaisen.json:1421 (index 138).
- Question : « Combien de frères Choso compte-t-il parmi les peintures de la mort ? »
- Réponse actuellement acceptée : **Neuf**.
- Constat : Il existe neuf Peintures de la mort au total, Choso inclus ; il a donc huit frères parmi celles-ci. Neuf compte Choso lui-même. Huit n'est pas proposé.
- Proposition : Ajouter « Huit » et le marquer correct, ou demander combien de Peintures de la mort existent au total pour conserver « Neuf ».
- Sources : [ABEMA — Choso, section sur les neuf Peintures de la mort, Choso inclus](https://times.abema.tv/articles/-/10002406) ; [Jujutsu Kaisen Wiki — Choso, liste de ses huit frères](https://jujutsu-kaisen.fandom.com/wiki/Choso).

### N065 — jujutsu_kaisen, question nº 141

- Type : **precision**.
- Emplacement : backend/data/jujutsu_kaisen.json:1443 (index 140).
- Question : « Quel est le concept de restriction céleste dans Jujutsu Kaisen ? »
- Réponse actuellement acceptée : **Un échange où le corps est renforcé au prix de l'énergie occulte**.
- Constat : La restriction céleste n'est pas toujours un corps renforcé au prix de l'énergie occulte. Kokichi Muta présente l'échange inverse : un corps très diminué contre une portée et une puissance occultes élevées, décrit sur la fiche officielle.
- Proposition : Définir une contrainte innée imposant un échange entre capacités physiques et énergie/portée occultes, ou limiter la question au cas de Toji/Maki.
- Sources : [Site officiel Jujutsu Kaisen — Kokichi Muta / Ultimate Mechamaru, échange corps contre portée et puissance](https://jujutsukaisen.jp/character/category2.php).

### N066 — jujutsu_kaisen, question nº 144

- Type : **factuel**.
- Emplacement : backend/data/jujutsu_kaisen.json:1476 (index 143).
- Question : « Quel est le nom de la technique de territoire de Mahito ? »
- Réponse actuellement acceptée : **Le Cercueil de fer de la transmutation**.
- Constat : Le domaine de Mahito est 自閉円頓裹 (Jihei Endonka), appelé Self-Embodiment of Perfection en anglais. Le « Cercueil de fer » appartient à Jogo ; lui ajouter « de la transmutation » n'en fait pas le domaine de Mahito. Aucune proposition n'identifie son domaine.
- Proposition : Remplacer le choix marqué par le nom français de Jihei Endonka dans l'édition retenue, en ajoutant le nom japonais si nécessaire. Ne pas imposer une traduction française non vérifiée.
- Sources : [Jujutsu Kaisen Wiki — Self-Embodiment of Perfection, Mahito, chapitre 29 / épisode 13](https://jujutsu-kaisen.fandom.com/wiki/Self-Embodiment_of_Perfection) ; [Animate Times — liste des domaines, 自閉円頓裹／真人](https://www.animatetimes.com/news/details.php?id=1716442730).

### N067 — jujutsu_kaisen, question nº 149

- Type : **factuel**.
- Emplacement : backend/data/jujutsu_kaisen.json:1531 (index 148).
- Question : « Quel est le vrai nom du corps que Kenjaku occupe dans la série ? »
- Réponse actuellement acceptée : **Les trois à différentes époques**.
- Constat : La réponse « Les trois » inclut Jin Itadori, qui n'est pas le corps d'emprunt parental de Kenjaku : il s'agit de Kaori Itadori. Dans l'intrigue principale Kenjaku occupe Suguru Geto ; il a aussi occupé Noritoshi Kamo autrefois. Le libellé au singulier et la réponse groupée se contredisent.
- Proposition : Demander « Quel corps Kenjaku occupe-t-il pendant l'intrigue principale ? » et marquer « Suguru Geto ». Pour une question sur ses hôtes historiques, remplacer Jin par Kaori et reformuler au pluriel.
- Sources : [Site officiel Jujutsu Kaisen — Kenjaku, ancien Kamo et corps actuel de Geto](https://jujutsukaisen.jp/character/) ; [Anime Explained — Yuji's Real Parents, révélation du chapitre 143](https://www.animeexplained.com/explained/jujutsu-kaisen-who-are-yujis-real-parents-explained/).

### N068 — jujutsu_kaisen, question nº 157

- Type : **factuel**.
- Emplacement : backend/data/jujutsu_kaisen.json:1619 (index 156).
- Question : « Quel personnage se sacrifie pour créer une balle unique que Maki utilise ensuite ? »
- Réponse actuellement acceptée : **Mai Zenin**.
- Constat : Mai se sacrifie pour créer un sabre que Maki emploie ensuite, pas une balle. Le texte confond sa limite habituelle d'une balle créée par jour avec sa création finale (chapitre 149).
- Proposition : Remplacer « créer une balle unique » par « créer un sabre » ; conserver « Mai Zenin ».
- Sources : [Animate Times — Mai Zenin, limite d'une balle quotidienne et sabre créé au prix de sa vie](https://www.animatetimes.com/news/details.php?id=1649904925) ; [Animate Times — Maki Zenin, réplique de Split Soul Katana laissée par Mai](https://www.animatetimes.com/news/details.php?id=1641435348).

### N069 — lionel_messi, question nº 110

- Type : **ambiguite**.
- Emplacement : backend/data/lionel_messi.json:1102 (index 109).
- Question : « Quel numéro Messi portait-il initialement au Barça avant le 10 ? »
- Réponse actuellement acceptée : **19**.
- Constat : Messi débute avec le numéro 30. Le 19 précède immédiatement le 10, mais 'initialement' désigne ses débuts et rend le choix 30 correct.
- Proposition : Écrire 'Quel numéro portait-il immédiatement avant le 10 ?' ou marquer 30 pour ses débuts.
- Sources : [FC Barcelona - Anniversary of official debut](https://www.fcbarcelona.com/en/football/first-team/news/886918/the-14-year-anniversary-of-leo-messis-official-barca-debut).

### N070 — lionel_messi, question nº 123

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1245 (index 122).
- Question : « En quelle année Messi a-t-il remporté son premier titre de Liga avec le Barça ? »
- Réponse actuellement acceptée : **2005-2006**.
- Constat : Son premier titre de Liga date de 2005 (saison 2004-2005), pas 2005-2006.
- Proposition : Marquer 2004-2005 (choix 0).
- Sources : [FC Barcelona - Most decorated player](https://www.fcbarcelona.com/en/football/first-team/noticies/2208549/el-jugador-mes-llorejat-de-la-historia-culer).

### N071 — lionel_messi, question nº 124

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1256 (index 123).
- Question : « Quel entraîneur argentin a fait de Messi le capitaine de la sélection ? »
- Réponse actuellement acceptée : **Lionel Scaloni**.
- Constat : Alejandro Sabella le nomme capitaine en août 2011, avant Scaloni.
- Proposition : Marquer Alejandro Sabella (choix 3).
- Sources : [FIFA - Immortal Messi reaches century](https://www.fifa.com/en/articles/immortal-messi-reaches-century-of-international-goals).

### N072 — lionel_messi, question nº 130

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1322 (index 129).
- Question : « Combien de buts Messi a-t-il marqués lors de la remontada du Barça contre le PSG (6-1) ? »
- Réponse actuellement acceptée : **Deux**.
- Constat : Messi marque un seul but (penalty) lors du 6-1 ; Neymar en marque deux.
- Proposition : Marquer Un (choix 1).
- Sources : [LaLiga - Barcelona complete historic comeback](https://www.laliga.com/en-GB/news/barcelona-complete-historic-comeback-in-the-champions-league).

### N073 — lionel_messi, question nº 133

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1355 (index 132).
- Question : « Quel club japonais le Barça de Messi a-t-il battu en finale du Mondial des clubs 2009 ? »
- Réponse actuellement acceptée : **Estudiantes (Argentine)**.
- Constat : Le libellé demande un club japonais et marque Estudiantes, explicitement identifié comme argentin dans le choix.
- Proposition : Remplacer 'japonais' par 'argentin'.
- Preuve : Contradiction explicite dans les énoncés ou choix de cette banque ; pas de source externe utilisée pour ce constat.

### N074 — lionel_messi, question nº 136

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1388 (index 135).
- Question : « Quel joueur a remplacé Messi comme numéro 10 au PSG après son départ ? »
- Réponse actuellement acceptée : **Ousmane Dembélé**.
- Constat : Le libellé dit que Messi portait le numéro 10 au PSG ; la ligne 118 indique correctement le 30.
- Proposition : Demander qui a repris le numéro 10 après Neymar (Dembélé).
- Preuve : Contradiction explicite dans les énoncés ou choix de cette banque ; pas de source externe utilisée pour ce constat.

### N075 — lionel_messi, question nº 139

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1421 (index 138).
- Question : « Quel joueur formait le duo 'M&S' ou 'SuárezMessi' au Barça avant l'arrivée de Neymar ? »
- Réponse actuellement acceptée : **Luis Suárez**.
- Constat : Suárez rejoint le Barça en 2014 ; Neymar est déjà recruté pour 2013-2014. Le duo Messi-Suárez n'y précède pas Neymar.
- Proposition : Supprimer 'avant l'arrivée de Neymar' ou demander l'année d'arrivée de Suárez.
- Sources : [FC Barcelona - Five years since Suarez arrival](https://www.fcbarcelona.com/en/football/first-team/news/1276278/five-years-since-the-arrival-of-luis-suarez-to-barca) ; [FC Barcelona - Changes in first team 2013/14](https://www.fcbarcelona.com/en/football/first-team/actualites/1138507/changes-in-barca-first-team-squad).

### N076 — lionel_messi, question nº 141

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1443 (index 140).
- Question : « Quel était le score du match où Messi a battu le record de buts de Gerd Müller en 2012 ? »
- Réponse actuellement acceptée : **Barça 2-0 Valladolid**.
- Constat : Le record de Müller est dépassé lors de Betis 1-2 Barça, pas contre Valladolid.
- Proposition : Marquer Barça 2-1 Betis (choix 0), idéalement présenter le score dans l'ordre domicile extérieur.
- Sources : [FC Barcelona - Messi after Betis record](https://www.fcbarcelona.com/en/news/1147104/messi-the-record-is-great-but-whats-truly-important-is-that-the-team-won).

### N077 — lionel_messi, question nº 153

- Type : **factuel**.
- Emplacement : backend/data/lionel_messi.json:1575 (index 152).
- Question : « Quel joueur a inscrit le premier but de l'Inter Miami lors de la Leagues Cup 2023 remportée par Messi ? »
- Réponse actuellement acceptée : **Lionel Messi**.
- Constat : Robert Taylor ouvre le score lors du premier match de Miami en Leagues Cup 2023 ; Messi marque le but vainqueur.
- Proposition : Proposer/marquer Robert Taylor, ou demander l'auteur du but de la victoire contre Cruz Azul.
- Sources : [Inter Miami - Messi debut match recap](https://www.intermiamicf.com/news/match-recap-lionel-messi-scores-late-free-kick-winner-in-inter-miami-cf-debut).

### N078 — liverpool, question nº 110

- Type : **precision**.
- Emplacement : backend/data/liverpool.json:1112 (index 109).
- Question : « Quel attaquant néerlandais a joué pour Liverpool de 2007 à 2010 ? »
- Réponse actuellement acceptée : **Dirk Kuyt**.
- Constat : La période mentionnée est contenue dans le passage réel au club et n’est donc pas nécessairement fausse comme sous-période. Pour donner le passage complet, la proposition suivante est plus précise : Écrire 2006 à 2012.
- Proposition : Écrire 2006 à 2012.
- Sources : [Liverpool FC - Dirk Kuyt](https://bootroom.liverpoolfc.com/history/past-players/dirk-kuyt).

### N079 — liverpool, question nº 112

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1134 (index 111).
- Question : « Quel joueur japonais a rejoint Liverpool en 2024 ? »
- Réponse actuellement acceptée : **Wataru Endō**.
- Constat : Endō signe à Liverpool en août 2023, pas en 2024.
- Proposition : Remplacer 2024 par 2023.
- Sources : [Liverpool FC - Endo signing day 18 August 2023](https://www.youtube.com/watch?v=O7m0-wRxOE4).

### N080 — liverpool, question nº 114

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1156 (index 113).
- Question : « Quel joueur colombien a joué pour Liverpool de 2020 à 2024 ? »
- Réponse actuellement acceptée : **Luis Díaz**.
- Constat : Le passage de Luis Díaz à Liverpool est 2022-2025, pas 2020-2024.
- Proposition : Écrire 2022 à 2025.
- Sources : [FC Bayern - Luis Diaz career profile](https://fcbayern.com/en/teams/first-team/luis-diaz).

### N081 — liverpool, question nº 118

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1200 (index 117).
- Question : « Quel défenseur slovaque a joué pour Liverpool de 2016 à 2018 ? »
- Réponse actuellement acceptée : **Martin Škrtel**.
- Constat : Škrtel joue à Liverpool de 2008 à 2016 ; il ne rejoint pas le club en 2016.
- Proposition : Écrire 2008 à 2016.
- Sources : [Liverpool FC - Martin Skrtel](https://www.liverpoolfc.com/info/martin-skrtel).

### N082 — liverpool, question nº 121

- Type : **precision**.
- Emplacement : backend/data/liverpool.json:1233 (index 120).
- Question : « Quel attaquant belge a joué pour Liverpool de 2014 à 2019 ? »
- Réponse actuellement acceptée : **Divock Origi**.
- Constat : La période mentionnée est contenue dans le passage réel au club et n’est donc pas nécessairement fausse comme sous-période. Pour donner le passage complet, la proposition suivante est plus précise : Écrire 'a signé en 2014 et quitté Liverpool en 2022'.
- Proposition : Écrire 'a signé en 2014 et quitté Liverpool en 2022'.
- Sources : [Liverpool FC - Divock Origi](https://www.liverpoolfc.com/info/divock-origi).

### N083 — liverpool, question nº 122

- Type : **precision**.
- Emplacement : backend/data/liverpool.json:1244 (index 121).
- Question : « Quel milieu anglais a joué pour Liverpool de 2015 à 2023 avant de partir en Arabie Saoudite ? »
- Réponse actuellement acceptée : **Jordan Henderson**.
- Constat : La période mentionnée est contenue dans le passage réel au club et n’est donc pas nécessairement fausse comme sous-période. Pour donner le passage complet, la proposition suivante est plus précise : Remplacer 2015 par 2011.
- Proposition : Remplacer 2015 par 2011.
- Sources : [Liverpool FC - Jordan Henderson](https://www.liverpoolfc.com/info/jordan-henderson).

### N084 — liverpool, question nº 123

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1255 (index 122).
- Question : « Quel club Liverpool a-t-il battu 4-0 en demi-finale retour de Ligue des champions 2018 ? »
- Réponse actuellement acceptée : **Manchester City**.
- Constat : Le 4-0 en demi-finale retour est contre Barcelone en 2019, pas City en 2018.
- Proposition : Remplacer 2018 par 2019 et marquer FC Barcelone.
- Sources : [Liverpool FC - Divock Origi (2019 comeback)](https://www.liverpoolfc.com/info/divock-origi).

### N085 — liverpool, question nº 125

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1277 (index 124).
- Question : « Quel joueur de Liverpool a remporté le Soulier d'or européen en 2018 et 2019 ? »
- Réponse actuellement acceptée : **Mohamed Salah**.
- Constat : Les récompenses de Salah en 2018 et 2019 sont les Golden Boots de Premier League, pas le Soulier d'or européen. Le libellé confond les deux trophées.
- Proposition : Remplacer 'Soulier d'or européen' par 'Soulier d'or de Premier League'.
- Sources : [Liverpool FC - Salah record Premier League scorer](https://www.liverpoolfc.com/news/first-team/458836-mohamed-salah-becomes-liverpool-s-record-premier-league-scorer) ; [FC Barcelona - Messi European Golden Shoe seasons](https://www.fcbarcelona.com/fcbarcelona/document/2022/10/10/84ba2af9-a6c4-447e-94e2-dc90f718b1a3/Memoria_club_CAST.pdf).

### N086 — liverpool, question nº 127

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1299 (index 126).
- Question : « Quel défenseur croate a joué pour Liverpool de 2018 à 2023 ? »
- Réponse actuellement acceptée : **Dejan Lovren**.
- Constat : Lovren joue à Liverpool de 2014 à 2020, pas de 2018 à 2023.
- Proposition : Écrire 2014 à 2020.
- Sources : [Liverpool FC - Dejan Lovren](https://www.liverpoolfc.com/info/dejan-lovren).

### N087 — liverpool, question nº 148

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1530 (index 147).
- Question : « Quel entraîneur intérimaire a pris la suite de Kenny Dalglish après Hillsborough en 1989 pour le reste de la saison ? »
- Réponse actuellement acceptée : **Ronnie Moran**.
- Constat : Ronnie Moran assure l'intérim après la démission de Dalglish en février 1991, pas après Hillsborough en 1989.
- Proposition : Remplacer le contexte par 'après la démission de Dalglish en février 1991'.
- Sources : [Liverpool FC - Ronnie Moran](https://www.liverpoolfc.com/info/ronnie-moran-0).

### N088 — liverpool, question nº 152

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1574 (index 151).
- Question : « Quel joueur de Liverpool a reçu le prix Puskás du plus beau but en 2006 ? »
- Réponse actuellement acceptée : **Steven Gerrard**.
- Constat : Le prix Puskás a été créé en 2009 : Gerrard ne pouvait pas le recevoir en 2006.
- Proposition : Retirer la question ou demander le premier lauréat en 2009 (Cristiano Ronaldo).
- Sources : [FIFA - Eleven Puskas Award winning golazos](https://inside.fifa.com/en/news/eleven-puskas-award-winning-golazos).

### N089 — liverpool, question nº 160

- Type : **factuel**.
- Emplacement : backend/data/liverpool.json:1662 (index 159).
- Question : « Quel milieu de terrain anglais a rejoint Liverpool en provenance d'Aston Villa en 2015 ? »
- Réponse actuellement acceptée : **James Milner**.
- Constat : Milner arrive en 2015 depuis Manchester City, pas Aston Villa.
- Proposition : Remplacer Aston Villa par Manchester City.
- Sources : [Liverpool FC - James Milner](https://www.liverpoolfc.com/info/james-milner).

### N090 — manchester_united, question nº 132

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1354 (index 131).
- Question : « Quel défenseur central brésilien a rejoint United en 2022 ? »
- Réponse actuellement acceptée : **Lisandro Martínez**.
- Constat : La question demande un défenseur brésilien et marque Lisandro Martínez ; la ligne 146 le présente correctement comme Argentin.
- Proposition : Remplacer brésilien par argentin.
- Preuve : Contradiction explicite dans les énoncés ou choix de cette banque ; pas de source externe utilisée pour ce constat.

### N091 — manchester_united, question nº 140

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1442 (index 139).
- Question : « Quel milieu anglais a été capitaine de United après Wayne Rooney ? »
- Réponse actuellement acceptée : **Harry Maguire**.
- Constat : Michael Carrick succède à Rooney comme capitaine en 2017. Maguire est un successeur ultérieur, et un défenseur.
- Proposition : Demander le successeur immédiat et marquer Michael Carrick (choix 0).
- Sources : [Manchester United - 15 memorable Michael Carrick moments](https://www.manutd.com/en/news/15-great-michael-carrick-man-utd-moments-3-december-2021).

### N092 — manchester_united, question nº 142

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1464 (index 141).
- Question : « Quel gardien camerounais a défendu les buts de United dans les années 2000 ? »
- Réponse actuellement acceptée : **André Onana**.
- Constat : La ligne situe Onana à United dans les années 2000 ; la ligne 142 date correctement son arrivée de 2023.
- Proposition : Remplacer 'dans les années 2000' par 'à partir de 2023'.
- Preuve : Contradiction explicite dans les énoncés ou choix de cette banque ; pas de source externe utilisée pour ce constat.

### N093 — manchester_united, question nº 144

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1486 (index 143).
- Question : « Quel attaquant danois a rejoint United en janvier 2022 ? »
- Réponse actuellement acceptée : **Christian Eriksen**.
- Constat : Eriksen, milieu de terrain, rejoint United en juillet 2022 ; janvier 2022 correspond à son arrivée à Brentford.
- Proposition : Remplacer attaquant par milieu et janvier par juillet.
- Sources : [Sky Sports - Manchester United sign Christian Eriksen](https://www.skysports.com/football/news/12652535/christian-eriksen-manchester-united-sign-former-tottenham-midfielder-on-three-year-deal).

### N094 — manchester_united, question nº 153

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1585 (index 152).
- Question : « Quel joueur détient le record du but le plus rapide de l'histoire de la Premier League (7,69 secondes) sous le maillot de United ? »
- Réponse actuellement acceptée : **Ryan Giggs**.
- Constat : Le but en 7,69 secondes est celui de Shane Long pour Southampton contre Watford en 2019, pas de Giggs pour United.
- Proposition : Proposer/marquer Shane Long et remplacer United par Southampton.
- Sources : [Premier League - Long scores fastest goal](https://www.premierleague.com/en/news/1195500?sf211480096=1).

### N095 — manchester_united, question nº 156

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1618 (index 155).
- Question : « Quel entraîneur allemand a dirigé brièvement United en 2022-2023 ? »
- Réponse actuellement acceptée : **Ralf Rangnick**.
- Constat : Rangnick prend l'équipe en décembre 2021 et termine en mai 2022, pas en 2022-2023.
- Proposition : Écrire 2021-2022.
- Sources : [Manchester United 2021-22 season - managerial chronology](https://en.wikipedia.org/wiki/2021%E2%80%9322_Manchester_United_F.C._season).

### N096 — manchester_united, question nº 157

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1629 (index 156).
- Question : « Quel joueur de United a marqué le 1000e but de Premier League du club en 2023 ? »
- Réponse actuellement acceptée : **Marcus Rashford**.
- Constat : Le 1000e but de United en Premier League est marqué par Cristiano Ronaldo à Middlesbrough en octobre 2005, pas par Rashford en 2023.
- Proposition : Proposer/marquer Cristiano Ronaldo et dater 2005.
- Sources : [Manchester United 2005-06 season - Middlesbrough match](https://en.wikipedia.org/wiki/2005%E2%80%9306_Manchester_United_F.C._season).

### N097 — manchester_united, question nº 159

- Type : **factuel**.
- Emplacement : backend/data/manchester_united.json:1651 (index 158).
- Question : « Quel joueur jamaïcain a été le premier noir à porter le maillot de Manchester United en match officiel ? »
- Réponse actuellement acceptée : **Viv Anderson**.
- Constat : Dennis Walker est le premier joueur noir de United en match officiel (1963).
- Proposition : Proposer Dennis Walker ; retirer jamaïcain.
- Sources : [The Guardian (2020)](https://www.theguardian.com/football/2020/oct/30/dennis-walker-manchester-united-first-and-only-black-busby-babe).

### N098 — michael_jackson, question nº 132

- Type : **factuel**.
- Emplacement : backend/data/michael_jackson.json:1394 (index 131).
- Question : « Avec quel label The Jackson 5 ont-ils d'abord signé ? »
- Réponse actuellement acceptée : **Motown**.
- Constat : Le premier contrat du groupe était chez Steeltown Records, avant Motown ; aucune option ne donne ce label.
- Proposition : Ajouter et cocher Steeltown Records, ou demander quel label les a rendus mondialement célèbres.
- Sources : [Premier contrat des Jackson Five](https://guernseys.com/v2/jackson_contract.html) ; [Jackson 5 — Detroit Historical Society](https://www.detroithistorical.org/learn/online-research/encyclopedia-of-detroit/jackson-5).

### N099 — michael_jackson, question nº 140

- Type : **factuel**.
- Emplacement : backend/data/michael_jackson.json:1482 (index 139).
- Question : « Quel titre de Michael Jackson a été le premier clip d'un artiste noir diffusé sur MTV ? »
- Réponse actuellement acceptée : **Billie Jean**.
- Constat : Billie Jean n'est pas le premier clip d'un artiste noir diffusé sur MTV : des artistes noirs y passaient déjà. Le jalon porte sur la forte rotation.
- Proposition : Reformuler « Quel clip de Michael Jackson a marqué l'accès à une forte rotation sur MTV ? ».
- Sources : [Michael Jackson World Network / Thriller40 — chronologie de fan-club](https://www.thriller40.com/timeline/billie-jean-airs-on-mtv/) ; [Billie Jean et les précédents artistes noirs de MTV](https://au.rollingstone.com/music/music-lists/best-music-videos-28407/michael-jackson-billie-jean-28499/).

### N100 — michael_jackson, question nº 159

- Type : **ambiguite**.
- Emplacement : backend/data/michael_jackson.json:1691 (index 158).
- Question : « Quelle chanson Michael Jackson a-t-il chantée lors de la cérémonie des Grammy Awards 1988 ? »
- Réponse actuellement acceptée : **Man in the Mirror**.
- Constat : Man in the Mirror et The Way You Make Me Feel ont tous deux été interprétés aux Grammy Awards 1988 ; les deux figurent dans les choix.
- Proposition : Demander quel morceau clôturait sa prestation, ou demander les deux titres.
- Sources : [Michael Jackson — Recording Academy](https://www.grammy.com/artists/michael-jackson/13202/).

### N101 — mythologie_grecque, question nº 51

- Type : **precision**.
- Emplacement : backend/data/mythologie_grecque.json:502 (index 50).
- Question : « Quel Titan porte le monde sur ses épaules ? »
- Réponse actuellement acceptée : **Atlas**.
- Constat : Le mythe décrit Atlas portant la voûte céleste. Dire le monde entretient la confusion courante avec le globe terrestre. La réponse Atlas reste valable.
- Proposition : Remplacer le monde par la voûte céleste.
- Sources : [Hésiode, Théogonie — Atlas soutient le ciel](https://www.theoi.com/Text/HesiodTheogony.html).

### N102 — ninho, question nº 101

- Type : **factuel**.
- Emplacement : backend/data/ninho.json:1061 (index 100).
- Question : « Dans quelle ville de banlieue parisienne Ninho a-t-il grandi ? »
- Réponse actuellement acceptée : **Corbeil-Essonnes**.
- Constat : Ninho a grandi entre Yerres et Nemours, pas Corbeil-Essonnes. Aucune des quatre villes proposées ne convient.
- Proposition : Ajouter Yerres ou Nemours et préciser la période, ou accepter « Yerres puis Nemours ».
- Sources : [Entretien avec Ninho sur son enfance](https://yard.media/interview-ninho/).

### N103 — ninho, question nº 115

- Type : **ambiguite**.
- Emplacement : backend/data/ninho.json:1215 (index 114).
- Question : « Quel stade Ninho a-t-il rempli en 2024 ? »
- Réponse actuellement acceptée : **Stade de France**.
- Constat : Les concerts ont lieu en mai 2025, mais remplir peut désigner la billetterie en 2024. Il faut distinguer date de vente et date du concert, plutôt que déclarer la phrase nécessairement fausse.
- Proposition : Demander dans quel stade Ninho s’est produit en mai 2025 pour viser le Stade de France.
- Sources : [Programme officiel Ninho au Stade de France](https://www.stadefrance.com/medias/docs/bdc_gce/SITE%20%20BDC_NINHO_02052025.pdf) ; [Stade de France — newsletter mars 2024 annonçant les concerts déjà remplis de 2025](https://www.stadefrance.com/medias/nl/cta/nl_mars2024_web_CTA.html).

### N104 — ninho, question nº 130

- Type : **factuel**.
- Emplacement : backend/data/ninho.json:1380 (index 129).
- Question : « Quel titre de M.I.L.S 2.0 est devenu un classique du rap français ? »
- Réponse actuellement acceptée : **Maman ne le sait pas**.
- Constat : Maman ne le sait pas appartient à Destin (2019), pas à M.I.L.S 2.0 (2018).
- Proposition : Pour conserver M.I.L.S 2.0, choisir Toutes options, Bavard ou Un Poco avec un critère distinctif ; sinon remplacer l'album par Destin.
- Sources : [Maman ne le sait pas — catalogue Apple Music](https://music.apple.com/us/song/1453399195) ; [M.I.L.S 2.0 — liste officielle](https://ninho.lnk.to/MILS_20).

### N105 — ninho, question nº 133

- Type : **factuel**.
- Emplacement : backend/data/ninho.json:1413 (index 132).
- Question : « Quel rappeur français du 92 Ninho a-t-il en featuring sur Comme prévu ? »
- Réponse actuellement acceptée : **Sofiane**.
- Constat : Sofiane est originaire de Seine-Saint-Denis (93), pas du 92.
- Proposition : Remplacer « du 92 » par « du 93 ».
- Sources : [Sofiane — biographie Universal Music](https://universalmusic.fr/artistes/31777110114).

### N106 — ninho, question nº 144

- Type : **factuel**.
- Emplacement : backend/data/ninho.json:1534 (index 143).
- Question : « Combien de places Ninho a-t-il vendues en 6 heures pour son concert au Stade de France en 2024 ? »
- Réponse actuellement acceptée : **80 000**.
- Constat : Le concert est daté 2024 alors qu’il a lieu en mai 2025. Le site officiel distingue le concert de 2025 et la vente en moins de six heures ; le nombre exact de places n’est pas certifié par ce contrôle.
- Proposition : Distinguer vente en 2024 et concert le 3 mai 2025 ; vérifier séparément le nombre exact de billets avant de conserver une réponse chiffrée.
- Sources : [Stade de France — Ninho les 2 et 3 mai 2025, première date vendue en moins de six heures](https://www.stadefrance.com/fr/le-stade/ninho-au-stade-de-france).

### N107 — ninho, question nº 146

- Type : **ambiguite**.
- Emplacement : backend/data/ninho.json:1556 (index 145).
- Question : « Quel artiste international apparaît sur un titre de l'album NI ? »
- Réponse actuellement acceptée : **Lil Baby**.
- Constat : Central Cee et Lil Baby, tous deux proposés, participent à NI.
- Proposition : Demander quel artiste américain apparaît sur Blue Story ; Lil Baby. Pour la question générale, accepter aussi Central Cee.
- Sources : [Ninho — biographie et NI chez Universal Music](https://www.universalmusic.fr/artistes/32399163728).

### N108 — ninho, question nº 156

- Type : **factuel**.
- Emplacement : backend/data/ninho.json:1666 (index 155).
- Question : « Quel rappeur belge Ninho a-t-il en featuring sur 'De l'autre côté' ? »
- Réponse actuellement acceptée : **Nekfeu**.
- Constat : De l'autre côté est bien avec Nekfeu, mais Nekfeu est français, pas belge.
- Proposition : Remplacer « rappeur belge » par « rappeur français ».
- Sources : [Nekfeu — biographie AllMusic](https://www.allmusic.com/artist/nekfeu-mn0003001875) ; [Comme prévu — crédits et titres](https://lescharts.com/album/ninho/comme-prevu-340887).

### N109 — olympique_de_marseille, question nº 107

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1077 (index 106).
- Question : « L'OM a-t-il déjà été relégué en deuxième division ? »
- Réponse actuellement acceptée : **Oui, deux fois**.
- Constat : L'OM connaît quatre périodes de D2 : 1959-1962, 1963-1966, 1980-1984, 1994-1996. La réponse deux relégations est fausse ; quatre n'est pas proposé.
- Proposition : Proposer/marquer quatre fois, en précisant le périmètre des descentes.
- Sources : [Olympique de Marseille - History of league participation](https://fr.wikipedia.org/wiki/Olympique_de_Marseille).

### N110 — olympique_de_marseille, question nº 112

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1132 (index 111).
- Question : « Quel ancien international français a été président de l'OM de 2005 à 2009 ? »
- Réponse actuellement acceptée : **Pape Diouf**.
- Constat : Pape Diouf est un ancien journaliste et agent de joueurs ; il n'est pas un ancien international français.
- Proposition : Remplacer 'ancien international français' par 'ancien journaliste et agent de joueurs'.
- Sources : [LFP - Disparition de Pape Diouf](https://www.lfp.fr/article/disparition-de-pape-diouf).

### N111 — olympique_de_marseille, question nº 115

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1165 (index 114).
- Question : « Le virage Nord du Vélodrome est associé à quel groupe de supporters ? »
- Réponse actuellement acceptée : **Le Commando Ultra**.
- Constat : Le Commando Ultra 84 est au virage Sud ; les Dodgers sont au virage Nord.
- Proposition : Marquer les Dodgers et dater la question pour éviter les groupes disparus.
- Sources : [OM - Official supporters groups](https://www.om.fr/en/supporters).

### N112 — olympique_de_marseille, question nº 122

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1242 (index 121).
- Question : « Quel attaquant camerounais a joué à l'OM au début des années 2010 ? »
- Réponse actuellement acceptée : **André Ayew**.
- Constat : André Ayew est international ghanéen, pas camerounais.
- Proposition : Remplacer camerounais par ghanéen.
- Sources : [France Football - Andre Ayew profile](https://app.francefootball.fr//fiche/joueur/andre-ayew/27501).

### N113 — olympique_de_marseille, question nº 125

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1275 (index 124).
- Question : « Quel joueur brésilien a été élu meilleur joueur de Ligue 1 avec l'OM en 2007 ? »
- Réponse actuellement acceptée : **Lucho González**.
- Constat : Lucho González est argentin et arrive à l'OM en juillet 2009. Il ne peut avoir été meilleur joueur avec l'OM en 2007 ; la nationalité brésilienne est fausse aussi.
- Proposition : Remplacer par 'Quel milieu argentin a rejoint l'OM depuis Porto en 2009 ?'.
- Sources : [UEFA - Lucho laid low for Marseille](https://www.uefa.com/uefachampionsleague/news/01db-0e7285a7dd72-ba67b74b79ed-1000--lucho-laid-low-for-marseille/).

### N114 — olympique_de_marseille, question nº 132

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1352 (index 131).
- Question : « En quelle année l'OM a-t-il été relégué en D2 pour la première fois ? »
- Réponse actuellement acceptée : **1994**.
- Constat : La première relégation en D2 date de 1959, pas 1994.
- Proposition : Marquer 1959 (choix 0).
- Sources : [Olympique de Marseille - History of league participation](https://fr.wikipedia.org/wiki/Olympique_de_Marseille).

### N115 — olympique_de_marseille, question nº 135

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1385 (index 134).
- Question : « Quel défenseur central français a été formé à l'OM avant de rejoindre le Bayern Munich ? »
- Réponse actuellement acceptée : **Boubacar Kamara**.
- Constat : Kamara quitte son club formateur l'OM pour Aston Villa en mai 2022, pas pour le Bayern.
- Proposition : Remplacer Bayern Munich par Aston Villa.
- Sources : [Aston Villa - Boubacar Kamara profile](https://next.avfc.co.uk/teams/mens/boubacarkamara).

### N116 — olympique_de_marseille, question nº 142

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1462 (index 141).
- Question : « Quel club écossais l'OM a-t-il affronté au premier tour de la Coupe des clubs champions 1993-1994 ? »
- Réponse actuellement acceptée : **Les Rangers**.
- Constat : L'OM est interdit de défendre son titre européen en 1993-1994. Les Rangers sont rencontrés en phase de groupes 1992-1993, pas au premier tour de 1993-1994.
- Proposition : Écrire 'Quel club écossais l'OM a-t-il affronté en phase de groupes en 1992-1993 ?'.
- Sources : [UEFA - French first for Marseille](https://www.uefa.com/uefachampionsleague/news/0119-0e6a0ed00b00-432257e362a9-1000/).

### N117 — olympique_de_marseille, question nº 143

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1473 (index 142).
- Question : « Quel buteur brésilien a porté le maillot de l'OM lors de la saison 2014-2015 ? »
- Réponse actuellement acceptée : **Brandão**.
- Constat : Brandão quitte l'OM pour Saint-Étienne en 2012 ; il n'est donc pas le buteur de l'OM de la saison 2014-2015.
- Proposition : Dater son passage correctement (2009-2012, avec prêts) ou demander son but face à l'Inter en 2012.
- Sources : [L'Equipe - La carriere de Brandao en Ligue 1](https://www.lequipe.fr/Football/Actualites/La-carriere-de-brandao-en-l1-toute-une-histoire/622330).

### N118 — olympique_de_marseille, question nº 144

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1484 (index 143).
- Question : « Quel défenseur argentin champion du monde 2022 a joué à l'OM ? »
- Réponse actuellement acceptée : **Leonardo Balerdi**.
- Constat : Balerdi n'est pas dans la liste argentine du Mondial 2022 ; il ne peut pas être qualifié de champion du monde 2022.
- Proposition : Retirer 'champion du monde 2022'.
- Sources : [FIFA - Argentina 26-man squad for Qatar 2022](https://www.fifa.com/en/articles/messi-makes-fifth-world-cup-as-garnacho-simeone-omitted).

### N119 — olympique_de_marseille, question nº 155

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1605 (index 154).
- Question : « Quel club allemand a éliminé l'OM en phase de poules de la Ligue des champions 2020-2021 ? »
- Réponse actuellement acceptée : **Le Bayern Munich**.
- Constat : Aucun club allemand n'est dans le groupe de l'OM en 2020-2021 : ses adversaires sont Manchester City, Porto et Olympiacos.
- Proposition : Retirer la question ou demander les adversaires du groupe C.
- Sources : [UEFA - All 2020/21 Champions League results](https://www.uefa.com/uefachampionsleague/news/0262-10842df9b0ba-783a15c1aa93-1000--group-stage-fixtures/).

### N120 — olympique_de_marseille, question nº 158

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1638 (index 157).
- Question : « Quel international français, passé par l'OM, a ensuite entraîné le club en 2004-2005 ? »
- Réponse actuellement acceptée : **Jean Tigana**.
- Constat : L'entraîneur de l'OM en 2004-2005 est Philippe Troussier, pas Jean Tigana. L'expression 'international français passé par l'OM' ne correspond pas à Troussier.
- Proposition : Demander simplement quel entraîneur a succédé à Anigo en novembre 2004 et marquer Troussier.
- Sources : [UEFA - Marseille se separe de Troussier](https://fr.uefa.com/news-media/news/01aa-0f84749a6073-2e5b19dd0b66-1000--marseille-se-separe-de-troussier/).

### N121 — olympique_de_marseille, question nº 160

- Type : **factuel**.
- Emplacement : backend/data/olympique_de_marseille.json:1660 (index 159).
- Question : « Quel entraîneur a conduit l'OM au titre de champion de France 1971 ? »
- Réponse actuellement acceptée : **Mario Zatelli**.
- Constat : Lucien Leduc remplace Zatelli en décembre 1970 et conduit l'OM au titre 1971.
- Proposition : Marquer Lucien Leduc (choix 1).
- Sources : [UEFA - France says farewell to Leduc](https://www.uefa.com/news-media/news/019f-0f84591e7cc0-590ac5a3381e-1000--france-says-farewell-to-leduc/).

### N122 — pnl, question nº 59

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:600 (index 58).
- Question : « Combien de titres contient l'album Le Monde Chico ? »
- Réponse actuellement acceptée : **14**.
- Constat : Le Monde Chico comporte 17 titres ; la réponse 14 et toutes les options sont incorrectes.
- Proposition : Ajouter et cocher 17.
- Sources : [Le monde Chico — catalogue Apple Music](https://music.apple.com/us/album/le-monde-chico/1048964879).

### N123 — pnl, question nº 65

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:666 (index 64).
- Question : « Dans quel pays le clip de « DA » a-t-il été tourné ? »
- Réponse actuellement acceptée : **L'Italie**.
- Constat : Le clip DA revient aux Tarterêts à Corbeil-Essonnes, en France, et n'a pas pour décor l'Italie.
- Proposition : Ajouter et cocher « France ».
- Sources : [DA — présentation et tournage au quartier](https://www.booska-p.com/musique/actualites/decouvrez-da-le-nouveau-pnl/).

### N124 — pnl, question nº 70

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:721 (index 69).
- Question : « Combien de featurings PNL a-t-il réalisés sur ses albums studio ? »
- Réponse actuellement acceptée : **Aucun**.
- Constat : L’affirmation aucun featuring sur tous les albums studio n’est pas soutenable : Le Monde Chico inclut Rebenga avec RKM et Que la mif avec S-Pion. Aucun total complet de collaborations n’est certifié ici.
- Proposition : Limiter explicitement la question à Dans la légende et Deux frères, ou reconstruire le comptage des collaborations.
- Sources : [Le monde Chico — catalogue de la médiathèque](https://mediatheques.agglo-larochelle.fr/doc/SYRACUSE/2227910/le-monde-chico-pnl-duo-voc-et-instr) ; [Booska-P — S-Pion, invité sur Que la mif](https://www.booska-p.com/musique/actualites/le-clip-hurricane-carter-de-s-pion/).

### N125 — pnl, question nº 72

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:743 (index 71).
- Question : « Quelle est la signification de « DD » dans le titre « Au DD » ? »
- Réponse actuellement acceptée : **Disque de diamant**.
- Constat : Au DD signifie « au détail », en référence à la vente de stupéfiants, pas « disque de diamant ». Aucune option n'est correcte.
- Proposition : Ajouter et cocher « Au détail ».
- Sources : [Au DD — explication du titre](https://www.leprogres.fr/sortir/2019/03/22/rap-pnl-a-lache-son-dernier-clip-au-dd).

### N126 — pnl, question nº 75

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:776 (index 74).
- Question : « En quelle année est sorti l'EP Que la famille ? »
- Réponse actuellement acceptée : **2014**.
- Constat : Que la famille est sorti le 2 mars 2015, pas en 2014.
- Proposition : Cocher 2015.
- Sources : [Que la famille — catalogue Apple Music](https://music.apple.com/us/album/que-la-famille/968338156).

### N127 — pnl, question nº 94

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:985 (index 93).
- Question : « Sur quel album figure « Uranus » ? »
- Réponse actuellement acceptée : **Deux frères**.
- Constat : Uranus figure sur Dans la légende, pas Deux frères.
- Proposition : Cocher Dans la légende.
- Sources : [Dans la légende — liste Apple Music](https://music.apple.com/us/album/dans-la-l%C3%A9gende/1663880916).

### N128 — pnl, question nº 95

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:996 (index 94).
- Question : « Quel titre de Deux frères évoque une planète ? »
- Réponse actuellement acceptée : **Uranus**.
- Constat : Uranus n'est pas un titre de Deux frères ; il figure sur Dans la légende.
- Proposition : Remplacer Deux frères par Dans la légende.
- Sources : [Dans la légende — liste Apple Music](https://music.apple.com/us/album/dans-la-l%C3%A9gende/1663880916).

### N129 — pnl, question nº 99

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:1040 (index 98).
- Question : « Quelle est la durée approximative de l'album Deux frères ? »
- Réponse actuellement acceptée : **55 minutes**.
- Constat : L'édition standard de Deux frères dure environ 73 minutes, et non 55 ; 70 minutes est l'option la plus proche.
- Proposition : Cocher 70 minutes et préciser l'édition standard.
- Sources : [Deux frères — durée Apple Music](https://music.apple.com/us/album/deux-fr%C3%A8res/1663879853).

### N130 — pnl, question nº 103

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:1084 (index 102).
- Question : « Quel titre de Dans la légende fait référence à un film d'animation Disney ? »
- Réponse actuellement acceptée : **Onizuka**.
- Constat : Onizuka renvoie au manga GTO, pas à Disney. Simba renvoie au Roi Lion mais appartient à Que la famille, pas Dans la légende.
- Proposition : Remplacer l'album par Que la famille et cocher Simba ; ou poser sur Dans la légende une question portant sur GTO.
- Sources : [Dans la légende — présentation Apple Music](https://music.apple.com/us/album/dans-la-l%C3%A9gende/1663880916) ; [Que la famille — liste Spotify](https://open.spotify.com/intl-es/album/2LOyzVRA6BJgfgGxQj21O1).

### N131 — pnl, question nº 108

- Type : **factuel**.
- Emplacement : backend/data/pnl.json:1139 (index 107).
- Question : « Combien de titres contient l'EP Que la famille ? »
- Réponse actuellement acceptée : **7**.
- Constat : Que la famille comporte 12 titres, pas 7. Aucun choix n'indique 12.
- Proposition : Ajouter et cocher 12.
- Sources : [Que la famille — catalogue Apple Music](https://music.apple.com/us/album/que-la-famille/968338156).

### N132 — rihanna, question nº 122

- Type : **factuel**.
- Emplacement : backend/data/rihanna.json:1284 (index 121).
- Question : « Quel titre de Good Girl Gone Bad a été remixé avec une version featuring Ne-Yo ? »
- Réponse actuellement acceptée : **Hate That I Love You**.
- Constat : Hate That I Love You inclut Ne-Yo dans la version originale de Good Girl Gone Bad ; il ne s'agit pas d'un remix ajoutant Ne-Yo.
- Proposition : Demander simplement quel titre de l'album est en duo avec Ne-Yo.
- Sources : [Good Girl Gone Bad — catalogue Apple Music](https://music.apple.com/us/album/good-girl-gone-bad/1472503760).

### N133 — rihanna, question nº 128

- Type : **factuel**.
- Emplacement : backend/data/rihanna.json:1350 (index 127).
- Question : « Quel titre de A Girl Like Me est une reprise de Soft Cell ? »
- Réponse actuellement acceptée : **SOS**.
- Constat : SOS sample Tainted Love de Soft Cell ; ce n'est pas une reprise de la chanson.
- Proposition : Remplacer « est une reprise de Soft Cell » par « sample Tainted Love de Soft Cell ».
- Sources : [Rihanna — Recording Academy](https://www.grammy.com/artists/rihanna/5943/).

### N134 — rihanna, question nº 142

- Type : **factuel**.
- Emplacement : backend/data/rihanna.json:1504 (index 141).
- Question : « Quel producteur norvégien a co-écrit 'Umbrella' ? »
- Réponse actuellement acceptée : **Tor Erik Hermansen (StarGate)**.
- Constat : Tor Erik Hermansen n'est pas parmi les auteurs d'Umbrella ; les crédits indiquent Christopher Stewart, Terius Nash, Thaddis Harrell et Shawn Carter.
- Proposition : Remplacer le QCM par une question sur un auteur attesté et supprimer la prémisse « norvégien ».
- Sources : [Umbrella — crédits Apple/Shazam](https://www.shazam.com/song/1472503762/umbrella-feat-jac3bf-z).

### N135 — rihanna, question nº 143

- Type : **factuel**.
- Emplacement : backend/data/rihanna.json:1515 (index 142).
- Question : « Quel rappeur apparaît sur 'Lemon' avec Rihanna en remix ? »
- Réponse actuellement acceptée : **N.E.R.D (feat. Rihanna)**.
- Constat : Le remix concerné ajoute Drake ; N.E.R.D est le groupe de la version originale, pas le rappeur ajouté par le remix.
- Proposition : Cocher Drake.
- Sources : [Lemon (Drake Remix) — catalogue Qobuz](https://www.qobuz.com/us-en/album/lemon-nerd-rihanna-feat-drake/owkzxdq27m29a).

### N136 — rihanna, question nº 157

- Type : **ambiguite**.
- Emplacement : backend/data/rihanna.json:1669 (index 156).
- Question : « Quel titre Rihanna a-t-elle chanté pour le film Black Panther: Wakanda Forever ? »
- Réponse actuellement acceptée : **Lift Me Up**.
- Constat : Born Again et Lift Me Up, tous deux proposés, sont des chansons de Rihanna pour Wakanda Forever.
- Proposition : Préciser « sorti en premier, en octobre 2022 » pour viser Lift Me Up ; sinon accepter les deux.
- Sources : [Rihanna et les chansons de Wakanda Forever — Disney](https://www.disney.com.br/novidades/as-5-cancoes-iconicas-da-trilha-sonora-de-pantera-negra-wakanda-para-sempre) ; [Les deux chansons de Rihanna dans Wakanda Forever](https://www.spinmagazine.com/2022/11/rihanna-new-song-black-panther/).

### N137 — rihanna, question nº 160

- Type : **factuel**.
- Emplacement : backend/data/rihanna.json:1702 (index 159).
- Question : « Quel titre de Rihanna a été produit par Calvin Harris et co-écrit sous le pseudonyme de Tom Petty ? »
- Réponse actuellement acceptée : **This Is What You Came For**.
- Constat : Le pseudonyme utilisé par Taylor Swift pour coécrire This Is What You Came For est Nils Sjöberg ; Tom Petty n'est pas ce pseudonyme.
- Proposition : Remplacer « sous le pseudonyme de Tom Petty » par « par Taylor Swift sous le pseudonyme de Nils Sjöberg ».
- Sources : [Entertainment Tonight — confirmation de la représentante de Taylor Swift, Nils Sjoberg](https://www.etonline.com/music/193133_taylor_swift_secretly_wrote_calvin_harris_this_is_what_you_came_for_hit_featuring_rihanna).

### N138 — seconde_guerre_mondiale, question nº 108

- Type : **factuel**.
- Emplacement : backend/data/seconde-guerre-mondiale.json:109 (index 107).
- Question : « Quel général allemand a tenté d'assassiner Hitler le 20 juillet 1944 ? »
- Réponse actuellement acceptée : **Claus von Stauffenberg**.
- Constat : Claus von Stauffenberg était colonel, et non général, lors de l’attentat du 20 juillet 1944.
- Proposition : Remplacer général par officier ou colonel.
- Sources : [USHMM — attentat du colonel Stauffenberg du 20 juillet 1944](https://encyclopedia.ushmm.org/content/en/timeline-event/holocaust/1942-1945/attempt-to-assassinate-hitler).

### N139 — seconde_guerre_mondiale, question nº 119

- Type : **ambiguite**.
- Emplacement : backend/data/seconde-guerre-mondiale.json:120 (index 118).
- Question : « Quel pays neutre a accueilli de nombreux réfugiés juifs pendant la guerre ? »
- Réponse actuellement acceptée : **La Suisse**.
- Constat : L’Espagne et le Portugal, tous deux proposés, ont aussi accueilli ou laissé transiter de nombreux réfugiés juifs. Neutralité et nombreux réfugiés ne distinguent pas la Suisse.
- Proposition : Demander un fait propre à la Suisse, ou proposer plusieurs pays dans une même bonne réponse.
- Sources : [USHMM — réfugiés en Espagne et au Portugal](https://encyclopedia.ushmm.org/content/en/article/escape-from-german-occupied-europe).

### N140 — seconde_guerre_mondiale, question nº 135

- Type : **precision**.
- Emplacement : backend/data/seconde-guerre-mondiale.json:136 (index 134).
- Question : « Quel maréchal allemand commanda le groupe d'armées encerclé à Stalingrad ? »
- Réponse actuellement acceptée : **Friedrich Paulus**.
- Constat : Paulus commandait la Sixième Armée à Stalingrad, pas un groupe d’armées. Ce sont deux échelons distincts.
- Proposition : Remplacer groupe d’armées par Sixième Armée.
- Sources : [National Army Museum — Paulus et la Sixième Armée à Stalingrad](https://collection.nam.ac.uk/detail.php?acc=2007-03-1-5).

### N141 — seconde_guerre_mondiale, question nº 145

- Type : **factuel**.
- Emplacement : backend/data/seconde-guerre-mondiale.json:146 (index 144).
- Question : « Quel pays a été divisé en deux zones d'occupation (soviétique et alliée) après la guerre ? »
- Réponse actuellement acceptée : **L'Allemagne**.
- Constat : L’Allemagne a été divisée en quatre zones d’occupation (américaine, britannique, française et soviétique), pas en deux. La division ultérieure RFA/RDA est un autre événement.
- Proposition : Demander quel pays a été partagé en quatre zones en 1945, ou dater séparément la formation de deux États en 1949.
- Sources : [Deutsches Historisches Museum — quatre zones d’occupation](https://www.dhm.de/en/exhibitions/permanent-exhibition/germany-under-allied-occupation/).

### N142 — seconde_guerre_mondiale, question nº 151

- Type : **precision**.
- Emplacement : backend/data/seconde-guerre-mondiale.json:152 (index 150).
- Question : « Quel général britannique a vaincu Rommel à El-Alamein en 1942 ? »
- Réponse actuellement acceptée : **Bernard Montgomery**.
- Constat : Deux batailles d’El-Alamein ont eu lieu en 1942 : Auchinleck a arrêté Rommel lors de la première, Montgomery a remporté la seconde. Les deux noms figurent parmi les choix.
- Proposition : Préciser seconde bataille d’El-Alamein en octobre-novembre 1942 pour conserver Montgomery.
- Sources : [National Army Museum — Auchinleck à la première bataille, Montgomery à la seconde](https://www.nam.ac.uk/explore/struggle-north-africa-1940-43).

### N143 — seconde_guerre_mondiale, question nº 153

- Type : **ambiguite**.
- Emplacement : backend/data/seconde-guerre-mondiale.json:154 (index 152).
- Question : « Quel pays a signé l'armistice avec le Japon à bord du USS Missouri ? »
- Réponse actuellement acceptée : **Les États-Unis**.
- Constat : La signature sur le Missouri est la capitulation du Japon devant plusieurs puissances alliées, dont les quatre pays proposés, pas un armistice bilatéral exclusif avec les États-Unis.
- Proposition : Demander quel amiral signe pour les États-Unis (Nimitz), ou nommer les Alliés comme partie bénéficiaire en modifiant les options.
- Sources : [National Archives — capitulation du Japon devant les Alliés](https://www.archives.gov/milestone-documents/surrender-of-japan).

### N144 — taylor_swift, question nº 141

- Type : **ambiguite**.
- Emplacement : backend/data/taylor_swift.json:1493 (index 140).
- Question : « Quel producteur suédois a co-écrit 'Shake It Off' et 'Blank Space' ? »
- Réponse actuellement acceptée : **Max Martin**.
- Constat : Max Martin et Shellback, tous deux proposés, sont suédois et ont coécrit Shake It Off et Blank Space.
- Proposition : Demander quels deux producteurs suédois ont coécrit les morceaux, ou retirer Shellback des distracteurs.
- Sources : [Apple Music — The Life of a Showgirl, introduction sur Martin et Shellback et les titres de 1989](https://music.apple.com/us/album/the-life-of-a-showgirl/1842897453).

### N145 — taylor_swift, question nº 158

- Type : **factuel**.
- Emplacement : backend/data/taylor_swift.json:1680 (index 157).
- Question : « Quelle chanteuse est créditée sur 'Gasoline' du Tortured Poets Department ? »
- Réponse actuellement acceptée : **Florence Welch**.
- Constat : Gasoline est un titre de HAIM dont une version accueille Taylor Swift sur Women in Music Pt. III. Le duo de TTPD avec Florence est Florida!!!.
- Proposition : Remplacer Gasoline par Florida!!! et conserver Florence Welch, ou poser une question sur HAIM et Gasoline.
- Sources : [Gasoline — publication officielle HAIM](https://www.youtube.com/watch?v=kQ15Nq1XjRA) ; [Florida!!! — catalogue Apple Music](https://music.apple.com/us/song/1742058094).

### N146 — the_weeknd, question nº 126

- Type : **factuel**.
- Emplacement : backend/data/the_weeknd.json:1328 (index 125).
- Question : « Quel artiste éthiopien-canadien est signé sur XO Records ? »
- Réponse actuellement acceptée : **Tous ces artistes**.
- Constat : « Tous ces artistes » ne peut désigner des artistes éthiopiens-canadiens : NAV est d'origine punjabi et Belly est palestinien-canadien.
- Proposition : Retirer l'ethnicité et demander lequel de ces artistes a été signé chez XO ; vérifier aussi la période pour 88Glam.
- Sources : [NAV — biographie Universal Music](https://universalmusic.fr/artistes/32062221619) ; [Entretien avec Belly — International Rescue Committee](https://www.rescue.org/eu/article/my-past-my-music-meet-rapper-songwriter-and-record-producer-belly).

### N147 — the_weeknd, question nº 129

- Type : **factuel**.
- Emplacement : backend/data/the_weeknd.json:1361 (index 128).
- Question : « Quel single de Beauty Behind the Madness a un clip où The Weeknd joue aux côtés de l'actrice Madalina Ghenea ? »
- Réponse actuellement acceptée : **In the Night**.
- Constat : Le clip In the Night met en scène Bella Hadid ; Madalina Ghenea n'est pas la partenaire indiquée pour ce clip.
- Proposition : Remplacer Madalina Ghenea par Bella Hadid, ou reconstruire la question sur le clip correspondant.
- Sources : [In the Night avec Bella Hadid](https://www.upi.com/Entertainment_News/2015/12/09/The-Weeknd-enlists-girlfriend-Bella-Hadid-for-In-The-Night-video/7981449678208/).

### N148 — the_weeknd, question nº 142

- Type : **factuel**.
- Emplacement : backend/data/the_weeknd.json:1504 (index 141).
- Question : « Quel réalisateur canadien a réalisé plusieurs clips de The Weeknd ? »
- Réponse actuellement acceptée : **Anton Tammi**.
- Constat : Anton Tammi est finlandais, pas canadien.
- Proposition : Remplacer « canadien » par « finlandais ».
- Sources : [Anton Tammi — biographie de sa société de production](https://fela.tv/artists/live-action/anton-tammi/).

### N149 — the_weeknd, question nº 146

- Type : **factuel**.
- Emplacement : backend/data/the_weeknd.json:1548 (index 145).
- Question : « Quel titre de Thursday sample 'Dirty Diana' de Michael Jackson ? »
- Réponse actuellement acceptée : **D.D.**.
- Constat : D.D. est sur Echoes of Silence, pas Thursday ; c'est une reprise de Dirty Diana, pas un sample décrit comme tel.
- Proposition : Demander quel titre d'Echoes of Silence reprend Dirty Diana ; réponse D.D.
- Sources : [Echoes of Silence — boutique officielle Republic](https://www.republicrecords.com/collections/buy-more-save-more/products/the-weeknd-echoes-of-silence-lp) ; [D.D. est une reprise de Dirty Diana](https://news.twentyfourbit.com/2011/12/the-weeknd-echoes-of-silence-download/).

### N150 — the_weeknd, question nº 160

- Type : **factuel**.
- Emplacement : backend/data/the_weeknd.json:1702 (index 159).
- Question : « En quelle année The Weeknd a-t-il été nommé ambassadeur de bonne volonté du Programme alimentaire mondial des Nations Unies ? »
- Réponse actuellement acceptée : **2017**.
- Constat : Le Programme alimentaire mondial a nommé The Weeknd ambassadeur mondial le 7 octobre 2021, pas en 2017.
- Proposition : Cocher 2021.
- Sources : [Nomination officielle au PAM](https://www.wfp.org/news/un-world-food-programme-announces-weeknd-global-goodwill-ambassador).

## Autres points et limites

- **70 questions GOT non intégrées** : le fichier `backend/data/got.json` existe, mais `backend/questions.js` utilise une autre banque intégrée. Ne pas l’activer automatiquement : plusieurs formulations demandent encore vérification.
- **195 pistes non confirmées** sont conservées dans le JSON associé, sans les compter comme erreurs établies.
- Sources : organismes officiels et éditeurs en priorité ; certains récits manga sont documentés par des encyclopédies spécialisées avec références de chapitres. Les variantes de traduction et d’édition restent à respecter.
- Les tests structurels passent sur les 494 quiz ; ils ne détectent pas une réponse historiquement fausse si le QCM est bien formé.
- Les reformulations doivent être relues avant publication, en donnant priorité aux mauvaises réponses acceptées, aux choix multiples et aux questions sans bon choix.
- Les superlatifs et données évolutives doivent recevoir un critère et une date. Les périodes de carrière contenues dans un passage réel sont classées comme précisions, pas comme faits nécessairement faux.

[Journal détaillé, options et pistes non confirmées](2026-11-02-new-questions-audit.json)
