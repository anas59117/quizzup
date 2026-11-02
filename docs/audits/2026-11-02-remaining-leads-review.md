# Vérification des 195 pistes restantes — 2 novembre 2026

Référence locale : `cac6335c4593aefa64e55ed028eb5096516bf4a3`. **Aucune question modifiée, aucune publication.**

Ce rapport porte sur les 195 pistes du précédent audit, dont 189 questions actives et 6 questions d’un fichier GOT inutilisé. Il ne certifie pas toutes les questions du site.

| Décision | Total | Actives | Fichier inactif |
| --- | ---: | ---: | ---: |
| Erreur confirmée | 57 | 54 | 3 |
| Ambiguïté / précision nécessaire | 89 | 86 | 3 |
| Soupçon écarté | 18 | 18 | 0 |
| Preuves insuffisantes ou divergentes | 31 | 31 | 0 |

## Lecture du bilan

- Une ambiguïté peut rendre un QCM injuste même si la réponse marquée est vraie ; ce statut ne vaut pas validation de publication.
- Une source ne démontrant pas une affirmation ne prouve pas sa fausseté : ces cas restent éditoriaux ou non résolus.
- Les encyclopédies de fiction et les médias spécialisés sont des sources secondaires ; leur présence ne signifie pas lecture des planches, épisodes ou crédits originaux.
- Les six questions GOT proviennent d’un fichier non chargé ; elles sont exclues des comptes actifs.
- Les records, statistiques et titres évolutifs nécessitent un périmètre et une date de référence ; les valeurs futures ne sont pas extrapolées.

Les indices ci-dessous sont ceux des fichiers actuels, à partir de zéro. Le JSON compagnon conserve les quatre choix et une empreinte SHA-256 de chaque question. Toutes les empreintes ont été recontrôlées lors de la génération.

## Détail des décisions

### Erreur confirmée (57)

#### P001 — ballon_d_or [100]

**Question :** Dans quel pays se déroule la cérémonie du Ballon d'Or ?

**Réponse marquée :** France

La dernière cérémonie, celle du 26 octobre 2026, a lieu à Londres (Angleterre). France n'est pas une localisation générale immuable : Zurich accueille aussi les éditions 2010-2015.

**Proposition, non appliquée :** Dater une édition précise ; pour 2026, marquer Angleterre.

Emplacement : `backend/data/ballon_d_or.json:1036`.

- [France Football - Cérémonie 2026 à Londres](https://ballondor.com/news/posts/the-ballon-dor-ceremony-in-london-on-26-october)

#### P002 — ballon_d_or [110]

**Question :** Quel pays a produit le plus de lauréats du Ballon d'Or masculin ?

**Réponse marquée :** L'Allemagne

Le décompte du palmarès masculin jusqu'en 2026 donne cinq lauréats allemands distincts, contre six Français ; en nombre de trophées, l'Allemagne en a sept contre huit pour la France et huit pour l'Argentine. L'Allemagne n'est donc première dans aucune de ces deux lectures.

**Proposition, non appliquée :** Préciser la mesure et la date : six lauréats français distincts à fin 2026.

Emplacement : `backend/data/ballon_d_or.json:1146`.

- [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/)

#### P008 — bayern_munich [102]

**Question :** Combien de titres de Bundesliga le Bayern a-t-il remportés au total ?

**Réponse marquée :** 33

Le Bayern a 34 titres de Bundesliga après la saison 2025-2026, et 35 championnats allemands en incluant celui d'avant 1963. La réponse 33 est périmée ; aucun choix n'offre 34.

**Proposition, non appliquée :** Dater fin 2025-2026 et proposer 34.

Emplacement : `backend/data/bayern_munich.json:1125`.

- [Bundesliga - Records au 26 octobre 2026](https://www.bundesliga.com/de/bundesliga/news/rekorde-tore-meisterschaft-historie-bestmarken-spieler-meiste-3235)

#### P009 — bayern_munich [120]

**Question :** Quel ancien latéral du Bayern a été sélectionneur de l'Allemagne de 2006 à 2014 ?

**Réponse marquée :** Joachim Löw

Le parcours complet de joueur de Löw publié par la DFB ne contient pas le Bayern. Le présupposé 'ancien latéral du Bayern' est donc faux, indépendamment de sa période comme sélectionneur.

**Proposition, non appliquée :** Supprimer le passé inventé au Bayern et demander le sélectionneur allemand de 2006 à 2021, après vérification directe de ces bornes.

Emplacement : `backend/data/bayern_munich.json:1323`.

- [DFB - Joachim Low, carrière de joueur](https://datencenter.dfb.de/en/people/joachim-low/player)
- [DFB - Dossier Euro 2016, carrière complète](https://www.dfb.de/fileadmin/_dfbdam/105866-FCN-Broschuere_EM_2016_-_final.pdf)

#### P011 — bayern_munich [124]

**Question :** Quel défenseur brésilien a joué au Bayern de 2007 à 2012 ?

**Réponse marquée :** Lúcio

Le Bayern situe Lúcio au club de l'été 2004 à son transfert à l'Inter en 2009. Il n'y joue donc pas jusqu'en 2012.

**Proposition, non appliquée :** Remplacer 2007-2012 par 2004-2009.

Emplacement : `backend/data/bayern_munich.json:1367`.

- [FC Bayern - Joueurs ayant représenté Bayern et Leverkusen](https://fcbayern.com/de/news/2023/09/diese-elf-spielte-fuer-den-fc-bayern-und-bayer-04-leverkusen)

#### P012 — bayern_munich [125]

**Question :** Combien de DFB-Pokal le Bayern a-t-il remportées au total ?

**Réponse marquée :** 20

La DFB confirme le 21e sacre du Bayern en Coupe d'Allemagne le 23 mai 2026. Vingt est périmé et aucun choix ne donne 21.

**Proposition, non appliquée :** Dater après la finale 2026 et proposer 21.

Emplacement : `backend/data/bayern_munich.json:1378`.

- [DFB - Bayern win 21st DFB Pokal](https://www.dfb.de/news/fc-bayern-dethrone-vfb-to-win-21st-dfb-pokal)

#### P015 — bayern_munich [137]

**Question :** Quel joueur togolais a joué au Bayern avant d'aller à Dortmund ?

**Réponse marquée :** Eric Maxim Choupo-Moting

Le profil du club de Choupo-Moting le donne international camerounais, après quatre saisons au Bayern et une arrivée à New York en décembre 2024. Le qualificatif togolais est faux ; aucune preuve d'un passage à Dortmund n'a été trouvée.

**Proposition, non appliquée :** Reformuler sur le Cameroun et le passage Bayern-New York, ou retirer le parcours vers Dortmund.

Emplacement : `backend/data/bayern_munich.json:1510`.

- [New York Red Bulls - Eric Maxim Choupo-Moting](https://www.newyorkredbulls.com/players/eric-maxim-choupo-moting/)

#### P016 — bayern_munich [159]

**Question :** Quel attaquant sénégalais a joué pour le Bayern de 2023 à 2024 ?

**Réponse marquée :** Sadio Mané

Le Bayern annonce le départ de Mané à Al-Nassr le 1er août 2023, un an après son arrivée de Liverpool. Son passage est 2022-2023, pas 2023-2024.

**Proposition, non appliquée :** Remplacer les années par 2022-2023.

Emplacement : `backend/data/bayern_munich.json:1747`.

- [FC Bayern - Sadio Mane to Al Nassr](https://fcbayern.com/de/news/2023/08/sadio-mane-wechselt-vom-fc-bayern-zu-al-nassr)

#### P019 — cristiano_ronaldo [122]

**Question :** Quel numéro de maillot Ronaldo portait-il initialement à Manchester United en 2003 ?

**Réponse marquée :** 28

Ronaldo explique à UEFA avoir demandé le 28 en arrivant, mais Ferguson lui a attribué le 7. Le choix marqué confond numéro souhaité et numéro porté.

**Proposition, non appliquée :** Marquer 7 (choix 0).

Emplacement : `backend/data/cristiano_ronaldo.json:1245`.

- [UEFA - Ronaldo ready to face his United past](https://www.uefa.com/uefachampionsleague/news/025a-0ea959409b48-2ed479925c63-1000--ronaldo-ready-to-face-up-to-his-united-past/)

#### P023 — cristiano_ronaldo [135]

**Question :** Combien de Supercoupe d'Europe Ronaldo a-t-il remportées avec le Real Madrid ?

**Réponse marquée :** Deux

Le palmarès officiel du Real attribue trois Supercoupes d'Europe à Ronaldo. Deux correspond aux finales auxquelles il a pris part, mais le libellé demande les trophées remportés avec le club.

**Proposition, non appliquée :** Marquer Trois, ou demander explicitement le nombre de finales victorieuses disputées.

Emplacement : `backend/data/cristiano_ronaldo.json:1388`.

- [Real Madrid - Cristiano Ronaldo, palmares](https://www.realmadrid.com/es-ES/el-club/historia/leyendas-futbol/cristiano-ronaldo-dos-santos-aveiro)

#### P027 — cristiano_ronaldo [159]

**Question :** Quel club Ronaldo a-t-il affronté lors de son 700e but en carrière ?

**Réponse marquée :** L'Ukraine

La FIFA confirme le 700e but professionnel de Ronaldo pendant la défaite du Portugal contre l'Ukraine en qualification à l'Euro 2020. L'adversaire marqué est une sélection, pas un club.

**Proposition, non appliquée :** Remplacer 'Quel club' par 'Quelle sélection', et préciser octobre 2019 et buts en club plus sélection.

Emplacement : `backend/data/cristiano_ronaldo.json:1647`.

- [FIFA - Fans favourites, 700 goals](https://inside.fifa.com/news/fans-favourites-x5691)

#### P030 — equipe_de_france_football [112]

**Question :** Quel attaquant français détient le record de buts en équipe de France ?

**Réponse marquée :** Olivier Giroud

Le classement actuel FFF place Mbappé premier avec 67 buts, devant les 57 de Giroud. Le record actuel marqué Giroud est périmé.

**Proposition, non appliquée :** Marquer Mbappé et dater le relevé ; ou demander qui détenait le record à sa retraite en 2024.

Emplacement : `backend/data/equipe_de_france_football.json:1149`.

- [FFF - Statistiques des Bleus](https://www.fff.fr/selection/2-equipe-de-france/palmares-et-histoire-des-bleus.html)

#### P032 — equipe_de_france_football [138]

**Question :** Quel joueur français était surnommé le 'Président' lors de son passage comme dirigeant de l'OM ?

**Réponse marquée :** Didier Deschamps

Le dossier officiel UEFA attribue 'Le Président' à Laurent Blanc. Les choix ne le proposent pas ; Deschamps n'est donc pas la réponse documentée à ce surnom. Le contexte de dirigeant est également non étayé.

**Proposition, non appliquée :** Demander le joueur français surnommé Le Président, proposer Blanc et supprimer le contexte de dirigeant.

Emplacement : `backend/data/equipe_de_france_football.json:1435`.

- [UEFA - Euro 2012 press kit, Laurent Blanc](https://www.uefa.com/MultimediaFiles/Download/competitions/Draws/01/72/52/41/1725241_DOWNLOAD.pdf)

#### P034 — equipe_de_france_football [155]

**Question :** Combien de buts Olivier Giroud a-t-il inscrits en équipe de France au total (record) ?

**Réponse marquée :** 57

Le total de Giroud, 57, reste exact. En revanche le qualificatif explicite 'record' est faux actuellement : la FFF donne Mbappé à 67.

**Proposition, non appliquée :** Conserver 57 et remplacer '(record)' par 'à la fin de sa carrière internationale en 2024'.

Emplacement : `backend/data/equipe_de_france_football.json:1622`.

- [FFF - Statistiques des Bleus](https://www.fff.fr/selection/2-equipe-de-france/palmares-et-histoire-des-bleus.html)

#### P035 — equipe_de_france_football [156]

**Question :** Quel milieu de terrain français a marqué le premier but contre l'Australie au Mondial 2018 ?

**Réponse marquée :** Antoine Griezmann

La FFF désigne Griezmann comme attaquant dans sa fiche et dans son compte rendu France-Australie 2018. Le buteur marqué est juste, mais le présupposé de poste est faux dans ce contexte.

**Proposition, non appliquée :** Remplacer milieu de terrain par attaquant.

Emplacement : `backend/data/equipe_de_france_football.json:1633`.

- [FFF - France Australie 2018](https://www.fff.fr/selection/matchs/1135-france-australie.html)
- [FFF - Griezmann, poste attaquant](https://www.fff.fr/equipe-nationale/joueur/8656-griezmann-antoine/fiche.html)

#### P038 — lionel_messi [131]

**Question :** Combien de titres de Ligue 1 Messi a-t-il remportés avec le PSG ?

**Réponse marquée :** Un

La Ligue 1 confirme deux titres de champion de France pendant les deux saisons de Messi au PSG, pas un.

**Proposition, non appliquée :** Marquer Deux (choix 2).

Emplacement : `backend/data/lionel_messi.json:1344`.

- [Ligue 1 - Tous les buts de Messi, deux titres](https://ligue1.com/fr/articles/l1_article_5340-video-tous-les-buts-de-messi-en-ligue-1-mc-donald-s)

#### P039 — lionel_messi [136]

**Question :** Combien de buts Messi a-t-il inscrits avec le PSG en Ligue 1 sur ses deux saisons ?

**Réponse marquée :** 21

La Ligue 1 donne 22 buts de Messi dans le championnat français. Vingt et un est faux et 22 n'est pas proposé.

**Proposition, non appliquée :** Proposer et marquer 22.

Emplacement : `backend/data/lionel_messi.json:1394`.

- [Ligue 1 - Les 22 buts de Messi au PSG](https://ligue1.com/fr/articles/l1_article_5340-video-tous-les-buts-de-messi-en-ligue-1-mc-donald-s)

#### P041 — lionel_messi [145]

**Question :** Quel joueur détient le record de passes décisives pour Messi en Liga ?

**Réponse marquée :** Dani Alves

Dès novembre 2018, le Barça annonce que Suárez dépasse Dani Alves comme premier passeur pour Messi en Liga. Le record attribué à Alves est donc dépassé dans ce périmètre.

**Proposition, non appliquée :** Marquer Luis Suárez ou dater la question avant le dépassement de 2018.

Emplacement : `backend/data/lionel_messi.json:1483`.

- [FC Barcelona - Suarez surpasses Dani Alves](https://www.fcbarcelona.com/en/news/879326/luis-suarez-surpasses-dani-alves-as-number-one-assist-provider-to-lionel-messi-in-la-liga)

#### P042 — lionel_messi [150]

**Question :** Quel club Messi a-t-il affronté lors de sa dernière apparition avec le Barça en août 2021 ?

**Réponse marquée :** L'Eibar

Le Barça annonce explicitement que Messi ne dispute pas le match à Eibar en mai 2021 ; le choix marqué ne peut être sa dernière apparition. La rencontre contre le Celta du 16 mai le compte bien comme buteur. La mention août 2021 confond départ et match.

**Proposition, non appliquée :** Proposer Celta Vigo et mai 2021 ; compléter au besoin par une source nommant expressément sa dernière apparition.

Emplacement : `backend/data/lionel_messi.json:1538`.

- [FC Barcelona - Messi will miss Eibar](https://www.fcbarcelona.com/en/football/first-team/news/2152626)
- [FC Barcelona - Celta 16 mai 2021](https://www.fcbarcelona.com/en/matches/61321/fc-barcelona-celta-de-vigo-la-liga-2020-2021)

#### P045 — liverpool [126]

**Question :** Quel milieu anglais formé à Arsenal a rejoint Liverpool en 2017 ?

**Réponse marquée :** Alex Oxlade-Chamberlain

Liverpool confirme qu'Oxlade-Chamberlain est un produit du centre de formation de Southampton, intégré dès sept ans. Arsenal est son club précédent, pas son club formateur.

**Proposition, non appliquée :** Remplacer 'formé à Arsenal' par 'recruté à Arsenal' ou 'formé à Southampton'.

Emplacement : `backend/data/liverpool.json:1299`.

- [Liverpool FC - Oxlade Chamberlain career profile](https://www.liverpoolfc.com/news/first-team/273794-in-profile-alex-oxlade-chamberlain-s-career-so-far)

#### P050 — liverpool [145]

**Question :** Quel milieu de terrain turc a joué pour Liverpool en 2005, participant à la victoire d'Istanbul ?

**Réponse marquée :** Emre Belözoğlu

UEFA place Emre à l'Inter avant son transfert à Newcastle en juillet 2005. Il ne fait pas partie de la feuille de finale de Liverpool à Istanbul. Le joueur marqué et la participation alléguée sont faux.

**Proposition, non appliquée :** Reformuler sur un membre documenté de l'effectif victorieux 2005 ; aucun des quatre noms ne correspond à l'équipe de la finale.

Emplacement : `backend/data/liverpool.json:1508`.

- [UEFA - Newcastle sign Emre in 2005](https://www.uefa.com/news-media/news/0254-0d7b89e8eabe-c6e7069c78fa-1000--newcastle-tie-up-emre-transfer/)
- [UEFA - Finale 2005, compositions](https://www.uefa.com/newsfiles/UCL/2004/1086988_LU.pdf)

#### P051 — liverpool [152]

**Question :** Quel gardien irlandais de Liverpool est souvent titulaire en coupes nationales ?

**Réponse marquée :** Caoimhín Kelleher

Kelleher rejoint Brentford le 3 juin 2025. La formulation au présent le présente toujours comme gardien de Liverpool : cette appartenance est périmée.

**Proposition, non appliquée :** Dater la question de sa période à Liverpool, par exemple de la saison 2023-2024, en vérifiant le critère précis de titularisation.

Emplacement : `backend/data/liverpool.json:1580`.

- [Brentford - Signature de Caoimhin Kelleher, 3 juin 2025](https://www.brentfordfc.com/en/news/first-team-brentford-sign-caoimhin-kelleher-liverpool)

#### P054 — manchester_united [107]

**Question :** Combien de FA Cups Manchester United a-t-il remportées au total (record en Angleterre) ?

**Réponse marquée :** 13

Le palmarès de United confirme 13 FA Cups, mais Arsenal en revendique 14. Le nombre marqué est juste ; l'affirmation du record anglais est fausse.

**Proposition, non appliquée :** Supprimer « record en Angleterre » et dater le total.

Emplacement : `backend/data/manchester_united.json:1090`.

- [Manchester United - Trophy room](https://www.manutd.com/en/club/history/trophy-room)
- [Arsenal - History, 14 FA Cups](https://www.arsenal.com/history)

#### P055 — manchester_united [108]

**Question :** Quel ancien attaquant de United est devenu consultant emblématique sur Sky Sports ?

**Réponse marquée :** Gary Neville

Gary Neville, bien devenu consultant Sky Sports, est un ancien défenseur de United. Le qualificatif attaquant est faux.

**Proposition, non appliquée :** Remplacer « attaquant » par « défenseur ».

Emplacement : `backend/data/manchester_united.json:1101`.

- [Manchester United - Neville, défenseur](https://www.manutd.com/ar/news/jose-mourinho-on-the-potential-of-diogo-dalot)
- [Manchester United - Gary Neville, carrière après le centre](https://www.manutd.com/en/academy/life-after-the-academy)

#### P056 — manchester_united [109]

**Question :** Quel milieu anglais a joué plus de 700 matchs pour United entre 1993 et 2011 ?

**Réponse marquée :** Paul Scholes

UEFA donne Scholes à 676 matchs lors de sa première retraite en mai 2011, puis documente son retour en janvier 2012 et sa retraite définitive en 2013. Plus de 700 entre 1993 et 2011 est donc faux.

**Proposition, non appliquée :** Étendre la borne finale à 2013 ; ne pas assimiler la première retraite à la fin de carrière.

Emplacement : `backend/data/manchester_united.json:1112`.

- [UEFA - Scholes sort de sa retraite, 676 matchs en 2011](https://www.uefa.com/uefaeuropaleague/news/0254-0d7dc0945674-d1ffa068c24e-1000--scholes-out-of-retirement-for-manchester-united/)
- [UEFA - Retraite définitive de Scholes en 2013](https://www.uefa.com/news/0209-0e84b1919758-7150e50481ad-1000--united-midfielder-scholes-confirms-retirement/)

#### P057 — manchester_united [112]

**Question :** Quel milieu serbe a joué pour United de 2017 à 2024 ?

**Réponse marquée :** Nemanja Matić

La Roma annonce la signature de Matic le 14 juin 2022 après cinq saisons à United. Il n'y joue donc pas jusqu'en 2024.

**Proposition, non appliquée :** Remplacer 2017-2024 par 2017-2022.

Emplacement : `backend/data/manchester_united.json:1145`.

- [AS Roma - Nemanja Matic signs for Roma](https://www.asroma.com/en/news/64401/nemanja-matic-signs-for-roma)

#### P059 — manchester_united [115]

**Question :** Quel défenseur néerlandais, transféré de l'Ajax en 1998, a fait partie du triplé 1999 ?

**Réponse marquée :** Jaap Stam

UEFA indique que Stam quitte le PSV pour United en 1998 et ne rejoint l'Ajax qu'en 2006. Le club de provenance est faux.

**Proposition, non appliquée :** Remplacer « de l'Ajax » par « du PSV Eindhoven ».

Emplacement : `backend/data/manchester_united.json:1178`.

- [UEFA - Ajax secure Stam signature, parcours antérieur](https://www.uefa.com/uefachampionsleague/news/01b1-0e6d5df41aef-ffa507cb1936-1000--ajax-secure-stam-signature/)

#### P060 — manchester_united [118]

**Question :** Quel défenseur central anglais formé au club a marqué deux buts décisifs contre Sheffield Wednesday en 1993 ?

**Réponse marquée :** Steve Bruce

Gillingham situe le début de carrière de Bruce dans son club en 1977, ses débuts professionnels en 1979 et son transfert à Norwich en 1984. United célèbre son arrivée en décembre 1987. Bruce n'est donc pas formé à United.

**Proposition, non appliquée :** Supprimer « formé au club ».

Emplacement : `backend/data/manchester_united.json:1211`.

- [Gillingham - Steve Bruce, carrière commencée au club](https://www.gillinghamfootballclub.com/news/steve-bruce-be-special-guest-upcoming-sportsmans-dinner-event)
- [Manchester United - Arrivée de Bruce le 17 décembre 1987](https://www.manutd.com/en/mutv/videos/detail/goal-of-the-day-bruce-v-oldham-17-december)

#### P063 — manchester_united [133]

**Question :** Quel buteur écossais, surnommé « The King », a marqué 237 buts pour United dans les années 1960 ?

**Réponse marquée :** Denis Law

United attribue les 237 buts de Law à ses onze années au club et documente encore un but contre Palace en 1971. Les 237 ne sont donc pas tous inscrits dans les années 1960.

**Proposition, non appliquée :** Remplacer « dans les années 1960 » par « au cours de ses onze années au club ».

Emplacement : `backend/data/manchester_united.json:1376`.

- [Manchester United - Denis Law, 237 buts en onze ans](https://www.manutd.com/en/news/manchester-united-honour-legendary-former-striker-denis-law-with-series-of-tributes)
- [Manchester United - But de Law contre Palace en 1971](https://www.manutd.com/en/mutv/videos/detail/goal-of-the-day-denis-law-v-crystal-palace-24-february-2020)

#### P064 — manchester_united [137]

**Question :** Quel joueur chilien a joué pour United de 2018 à 2022, prêté plusieurs fois ?

**Réponse marquée :** Alexis Sánchez

L'Inter annonce le prêt de Sanchez en août 2019 puis son transfert définitif le 6 août 2020. Son contrat à United ne va donc pas jusqu'en 2022 ; la succession de plusieurs prêts n'est pas étayée.

**Proposition, non appliquée :** Écrire qu'il rejoint United en 2018 puis est prêté à l'Inter en 2019, avant un transfert définitif en 2020.

Emplacement : `backend/data/manchester_united.json:1420`.

- [Inter - Prêt de Sanchez, août 2019](https://www.inter.it/en/news/2019-08-29-alexis-sanchez-is-an-inter-player)
- [Inter - Transfert définitif, août 2020](https://www.inter.it/en/news/2020-08-06-transfer-inter-alexis-sanchez)

#### P065 — manchester_united [139]

**Question :** Quel défenseur central anglais est devenu le joueur le plus cher de l'histoire en rejoignant United en 2019 ?

**Réponse marquée :** Harry Maguire

Guinness qualifie le transfert de Maguire de record pour un défenseur, à environ 87,5 millions d'euros. Le Barça atteste les 222 millions de Neymar dès 2017 : Maguire n'est pas le joueur le plus cher.

**Proposition, non appliquée :** Remplacer « joueur le plus cher » par « défenseur le plus cher ».

Emplacement : `backend/data/manchester_united.json:1442`.

- [Guinness World Records - Transfert le plus cher d'un défenseur](https://www.guinnessworldrecords.com/world-records/most-expensive-football-player-%28soccer-player%29-defender)
- [FC Barcelona - Neymar, paiement de 222 millions](https://www.fcbarcelona.com/en/football/first-team/actualites/748497/communique-sur-neymar-du-fc-barcelone)

#### P067 — manchester_united [148]

**Question :** Quel attaquant anglais a marqué un but sur son premier ballon touché en Premier League face à Arsenal en 2004 ?

**Réponse marquée :** Wayne Rooney

La Premier League situe les débuts de Rooney contre Tottenham en août 2002 et son premier but de championnat contre Arsenal le 19 octobre 2002 avec Everton. Le récit marqué de 2004 et du premier ballon en Premier League est faux.

**Proposition, non appliquée :** Demander quel joueur d'Everton inscrit son premier but de Premier League contre Arsenal le 19 octobre 2002.

Emplacement : `backend/data/manchester_united.json:1541`.

- [Premier League - Rooney, débuts et premier but en 2002](https://www.premierleague.com/en/news/758950)
- [Premier League - Les 200 buts de Rooney, premier le 19 octobre 2002](https://www.premierleague.com/ar/news/458472/how-rooney-reached-200-goals)

#### P068 — manchester_united [151]

**Question :** Quel milieu de terrain anglais a fait la transition de joueur à entraîneur de United en 2021-2022 ?

**Réponse marquée :** Michael Carrick

United situe le passage de Carrick de joueur à membre du staff en 2018, puis son intérim à la tête de l'équipe en novembre 2021. 2021-2022 confond ces deux étapes.

**Proposition, non appliquée :** Demander quel ancien milieu de United assure l'intérim comme entraîneur principal en novembre 2021.

Emplacement : `backend/data/manchester_united.json:1569`.

- [Manchester United - Quinze moments de la carrière de Carrick](https://www.manutd.com/en/news/15-great-michael-carrick-man-utd-moments-3-december-2021)

#### P070 — olympique_de_marseille [103]

**Question :** Quelle lettre grecque figure dans le logo de l'OM ?

**Réponse marquée :** Alpha

La boutique officielle décrit le logo comme les lettres O et M entrelacées. Le présupposé d'une lettre grecque alpha ne correspond pas au monogramme présenté.

**Proposition, non appliquée :** Demander quelles lettres entrelacées composent le monogramme : O et M, avec des choix adaptés.

Emplacement : `backend/data/olympique_de_marseille.json:1044`.

- [Boutique officielle OM - Pendentif logo, lettres O et M entrelacées](https://boutique.om.fr/products/pendentif-om-logo-et-chaine-argent-oml23-pen-ajou)

#### P071 — olympique_de_marseille [117]

**Question :** Quel attaquant sénégalais a joué à l'OM entre 2007 et 2011 ?

**Réponse marquée :** Mamadou Niang

UEFA documente l'arrivée de Niang en 2005 puis son départ à Fenerbahce en août 2010. La borne 2011 impose une présence après son départ.

**Proposition, non appliquée :** Remplacer 2007-2011 par 2005-2010.

Emplacement : `backend/data/olympique_de_marseille.json:1188`.

- [UEFA - Arrivée de Niang à Marseille en 2005](https://www.uefa.com/news-media/news/01ab-0f84774e9fad-e32a5e2972d8-1000--marseille-move-for-niang/)
- [UEFA - Départ de Niang à Fenerbahce en 2010](https://www.uefa.com/uefaeuropaleague/news/01e8-0e751bd6b54e-7f28cbe80bb8-1000--niang-leaves-om-for-fenerbahce/)

#### P072 — olympique_de_marseille [118]

**Question :** Quelle est la capacité approximative du virage Sud du Vélodrome ?

**Réponse marquée :** 8 000

Le recueil municipal 647 de janvier 2022 fixe le virage Sud à 12 935 places, dont 67 emplacements fauteuil. Huit mille n'est pas une approximation valable de cette capacité.

**Proposition, non appliquée :** Dater le chiffre de 2022 et proposer 12 935, ou environ 13 000, comme réponse unique.

Emplacement : `backend/data/olympique_de_marseille.json:1199`.

- [Ville de Marseille - Recueil des actes administratifs 647, capacité du stade](https://www.marseille.fr/sites/default/files/contenu/mairie/RAA/raa-647-20220101.pdf)

#### P076 — olympique_de_marseille [125]

**Question :** Quel défenseur central sénégalais a été un pilier de l'OM au début des années 2020 ?

**Réponse marquée :** Boubacar Kamara

La fiche FFF identifie Kamara comme international français et milieu. Le qualificatif international sénégalais est faux ; son ascendance ne constitue pas sa nationalité sportive.

**Proposition, non appliquée :** Remplacer par « international français formé à l'OM » et supprimer le jugement « pilier ».

Emplacement : `backend/data/olympique_de_marseille.json:1271`.

- [FFF - Boubacar Kamara, équipe de France](https://www.fff.fr/equipe-nationale/joueur/8941-kamara-boubacar/fiche.html)

#### P079 — olympique_de_marseille [135]

**Question :** Quel milieu de terrain argentin a été recruté par l'OM en 2022 en provenance du Bétis Séville ?

**Réponse marquée :** Guido Rodríguez

La Premier League annonce en août 2024 que Rodriguez rejoint West Ham après quatre saisons et demie au Betis. Cette chronologie continue exclut le recrutement par l'OM en 2022 allégué par la question.

**Proposition, non appliquée :** Reconstruire la question autour du transfert Betis-West Ham en 2024, ou remplacer entièrement cette anecdote.

Emplacement : `backend/data/olympique_de_marseille.json:1381`.

- [Premier League - West Ham signe Guido Rodriguez, 6 août 2024](https://www.premierleague.com/en/news/4076099)

#### P080 — olympique_de_marseille [137]

**Question :** Quel milieu offensif chilien a joué à l'OM sous Jorge Sampaoli ?

**Réponse marquée :** Alexis Sánchez

L'annonce officielle de l'OM du 10 août 2022 présente l'arrivée de Sanchez ; l'historique de la Ligue 1 termine le mandat de Sampaoli le 1er juillet 2022 et commence celui de Tudor le 4 juillet. Sanchez ne joue donc pas à Marseille sous Sampaoli.

**Proposition, non appliquée :** Remplacer Jorge Sampaoli par Igor Tudor et « milieu offensif » par « attaquant ».

Emplacement : `backend/data/olympique_de_marseille.json:1403`.

- [OM - Annonce officielle de la signature de Sanchez, 10 août 2022, publication reproduite dans la presse](https://twitter.com/OM_Officiel/status/1557341611226304512)
- [Ligue 1 - Historique des entraîneurs de l'OM](https://ligue1.com/fr/articles/l1_article_146-historique-les-entraineurs-de-l-om-en-ligue-1)
- [Inter - Départ de Sanchez à l'été 2022, rapport financier](https://www.inter.it/media/downloads/2023/2023_05_29_12_47_01Financial%20Results%20of%20Inter%20Media%20and%20Communication%20S.p.A%20for%20the%20nine%20months%20ended%20March%2031%202023.pdf)

#### P081 — olympique_de_marseille [138]

**Question :** Quel joueur est devenu le plus jeune buteur de l'histoire de l'OM en Ligue 1 en 2023 ?

**Réponse marquée :** Bilal Nadir

La Ligue 1 situe le premier but professionnel de Nadir au 5 janvier 2025 contre Le Havre. Il ne peut être devenu le plus jeune buteur de l'OM en Ligue 1 grâce à un but en 2023.

**Proposition, non appliquée :** Supprimer le faux record ; demander quel joueur inscrit son premier but professionnel contre Le Havre le 5 janvier 2025.

Emplacement : `backend/data/olympique_de_marseille.json:1414`.

- [Ligue 1 - Bilal Nadir après son premier but professionnel](https://ligue1.com/en/articles/l1_article_1626-bilal-nadir-om-midfielder-targets-success-after-injury-setback)
- [Ligue 1 - Marseille-Le Havre, 5 janvier 2025](https://ligue1.com/en/articles/l1_article_1592-recap-om-start-2025-with-five-goal-performance-vs-le-havre)

#### P082 — olympique_de_marseille [139]

**Question :** Quel entraîneur italien a dirigé l'OM lors de la saison 2023-2024 ?

**Réponse marquée :** Jean-Louis Gasset

La CAF qualifie explicitement Gasset d'entraîneur français. La Ligue 1 situe bien Gattuso puis Gasset à Marseille pendant 2023-2024. Le choix marqué Gasset ne répond pas à la nationalité italienne.

**Proposition, non appliquée :** Marquer Gennaro Gattuso, après conservation du critère italien et de la saison.

Emplacement : `backend/data/olympique_de_marseille.json:1425`.

- [CAF - Départ de Jean-Louis Gasset, entraîneur français](https://www.cafonline.com/caf-africa-cup-of-nations/news/jean-louis-gasset-no-longer-cote-d-ivoire-head-coach/)
- [Ligue 1 - Historique des entraîneurs de l'OM](https://ligue1.com/fr/articles/l1_article_146-historique-les-entraineurs-de-l-om-en-ligue-1)

#### P085 — olympique_de_marseille [147]

**Question :** Quel milieu brésilien a joué à l'OM de 2019 à 2023 ?

**Réponse marquée :** Luiz Gustavo

Sao Paulo publie le parcours de Luiz Gustavo : Marseille 2017-2019 puis Fenerbahce 2019-2022. Sa présence à l'OM de 2019 à 2023 est donc fausse.

**Proposition, non appliquée :** Remplacer 2019-2023 par 2017-2019.

Emplacement : `backend/data/olympique_de_marseille.json:1513`.

- [Sao Paulo - Recrutement de Luiz Gustavo et chronologie de carrière](https://www.saopaulofc.net/sao-paulo-acerta-a-contratacao-de-luiz-gustavo/)

#### P086 — olympique_de_marseille [148]

**Question :** Quel est le record d'affluence au Stade Vélodrome pour un match de l'OM ?

**Réponse marquée :** 65 000

La Ligue 1 documente déjà 66 199 spectateurs pour OM-Saint-Etienne en 2025. Ce seul match suffit à réfuter un record exact limité à 65 000 ; la capacité théorique du stade n'est pas utilisée comme preuve d'affluence.

**Proposition, non appliquée :** Choisir un match daté et son affluence exacte, ou retrouver le record actuel complet avant de modifier les choix.

Emplacement : `backend/data/olympique_de_marseille.json:1524`.

- [Ligue 1 - Records d'affluence 2024-2025, 66 199 pour OM-ASSE](https://ligue1.com/fr/articles/l1_article_2073-affluences-du-jamais-vu-l1)

#### P101 — michael_jackson [122]

**Question :** Quel court-métrage musical de 1988, mêlant fiction et clips, met en scène Michael Jackson ?

**Réponse marquée :** Moonwalker

Moonwalker est un film de 93 minutes. La prémisse « court-métrage » est fausse ; le titre et l'année 1988 sont compatibles avec la classification australienne.

**Proposition, non appliquée :** Remplacer « court-métrage musical » par « film musical ».

Emplacement : `backend/data/michael_jackson.json:1295`.

- [Australian Classification — Moonwalker, 93 minutes, classification du 10 novembre 1988](https://www.classification.gov.au/titles/moonwalker-2)
- [American Film Institute — Moonwalker, durée 93 minutes](https://watch.afi.com/movie/moonwalker)

#### P115 — pnl [50]

**Question :** Quelle est l'origine des parents d'Ademo et N.O.S ?

**Réponse marquée :** Algérienne et comorienne

Le portrait réalisé auprès des frères décrit leur mère comme algérienne et leur père comme corse pied-noir. L'origine comorienne proposée n'est pas celle rapportée par cette source directe.

**Proposition, non appliquée :** Remplacer le choix marqué par « Mère algérienne et père corse pied-noir » ; adapter la question pour distinguer les deux parents.

Emplacement : `backend/data/pnl.json:512`.

- [The Fader — PNL cover story, entretien avec les frères](https://www.thefader.com/2016/06/14/pnl-cover-story-french-rap)

#### P117 — pnl [54]

**Question :** Dans quel pays le clip de « Naha » a-t-il été tourné ?

**Réponse marquée :** Le Japon

Le Parisien situe le décor de Naha à Moulin-Galant, à Corbeil-Essonnes. La réponse Japon est fausse et aucun choix ne propose la France.

**Proposition, non appliquée :** Ajouter « La France » comme réponse correcte.

Emplacement : `backend/data/pnl.json:556`.

- [Le Parisien — Les lieux de tournage de PNL à Corbeil-Essonnes](https://www.leparisien.fr/essonne-91/corbeil-essonnes-pnl-tourne-un-clip-aux-tarterets-24-03-2019-8038647.php)
- [Générations — Retour aux sources pour PNL dans Naha](https://generations.fr/video/clip/37838/retour-aux-sources-pour-pnl-dans-naha)

#### P118 — pnl [55]

**Question :** Quel festival PNL a-t-il headliné en 2019, surprenant le public ?

**Réponse marquée :** Coachella

Les têtes d'affiche officielles de Coachella 2019 étaient Childish Gambino, Tame Impala et Ariana Grande. La présence annoncée de PNL à Coachella concernait 2017 et avait été annulée.

**Proposition, non appliquée :** Demander à quel festival PNL devait participer en 2017 avant une annulation liée aux visas, avec Coachella comme réponse.

Emplacement : `backend/data/pnl.json:567`.

- [AEG — Coachella 2019, annonce officielle des têtes d'affiche](https://aegworldwide.com/press-center/press-releases/coachella-valley-music-and-arts-festival-announces-2019-lineup-childish)
- [The Fader — PNL cancel Coachella performance, 16 avril 2017](https://www.thefader.com/2017/04/16/pnl-to-cancel-their-coachella-performance-immigration-issues)

#### P124 — pnl [82]

**Question :** En quelle année le concert au Parc des Princes de PNL a-t-il eu lieu ?

**Réponse marquée :** 2019

Le Parc des Princes annonçait en novembre 2019 le retour des concerts pour 2020, après dix ans sans concert. Cela contredit le concert de PNL prétendument tenu dans ce stade en 2019.

**Proposition, non appliquée :** Retirer cette prémisse ; ne pas déplacer arbitrairement le concert à une autre année.

Emplacement : `backend/data/pnl.json:844`.

- [Le Parisien — Retour annoncé des concerts au Parc des Princes en 2020](https://www.leparisien.fr/culture-loisirs/musique/nekfeu-et-dadju-en-concert-au-parc-des-princes-debut-juin-15-11-2019-8193951.php)
- [CulturePSG — Annonce du PSG : retour des concerts après dix ans](https://www.culturepsg.com/news/club/10-ans-apres-le-parc-des-princes-va-accueillir-un-concert/29408)

#### P128 — pnl [100]

**Question :** En quelle année PNL a-t-il sorti son premier clip ?

**Réponse marquée :** 2013

La vidéo officielle Différents porte la date du 10 avril 2014 et la formation de PNL est située en 2014 dans le portrait réalisé auprès du groupe. Le premier clip de PNL ne doit pas être confondu avec les travaux solo antérieurs des frères.

**Proposition, non appliquée :** Demander en quelle année le clip officiel Différents a été publié : 2014.

Emplacement : `backend/data/pnl.json:1042`.

- [PNL, chaîne officielle — Différents, publié le 10 avril 2014](https://www.youtube.com/watch?v=3ljLkkFzczE)
- [The Fader — PNL cover story, entretien avec les frères](https://www.thefader.com/2016/06/14/pnl-cover-story-french-rap)

#### P134 — rihanna [140]

**Question :** Quel est le nom de la ville natale de Rihanna à la Barbade ?

**Réponse marquée :** Saint Michael

Saint Michael est une paroisse de la Barbade, pas une ville. La source touristique situe bien la naissance de Rihanna dans cette paroisse ; il ne faut pas en déduire automatiquement une ville de naissance.

**Proposition, non appliquée :** Remplacer « ville natale » par « paroisse de naissance » et conserver Saint Michael.

Emplacement : `backend/data/rihanna.json:1493`.

- [Barbados.org — Rihanna, née dans la paroisse de Saint Michael](https://barbados.org/people/rihanna.htm)
- [Barbados Today — Anniversaire de Robyn Rihanna Fenty](https://barbadostoday.bb/2024/02/20/celebrating-national-hero-robyn-rihanna-fenty-on-her-birthday/)

#### P154 — attaque_des_titans [126]

**Question :** Quel personnage infiltre l'armée de Mahr sous une fausse identité pendant des années ?

**Réponse marquée :** Eren Jäger

L'infiltration d'Eren sous le nom de Kruger et le raid de Liberio sont placés en 854 dans la chronologie spécialisée. Le récit du raid décrit ensuite sa correspondance avec les Scouts sur environ un mois ; les flashbacks du séjour des Scouts parlent de quelques mois dans le monde extérieur (chapitre 127). L'affirmation « pendant des années » appliquée à cette infiltration est erronée. Aucun nombre exact de mois n'est imposé.

**Proposition, non appliquée :** Supprimer « pendant des années » : « Quel personnage infiltre l'armée de Mahr sous le nom de Kruger ? » ; conserver Eren Jäger.

Emplacement : `backend/data/attaque_des_titans.json:1389`.

- [Attack on Titan Wiki — Timeline, infiltration et raid de Liberio en 854](https://attackontitan.fandom.com/wiki/Timeline)
- [Attack on Titan Wiki — Raid on Liberio, Infiltration et correspondance pendant le mois précédant le festival](https://attackontitan.fandom.com/wiki/Raid_on_Liberio)
- [Attack on Titan Wiki — Night of The End, chapitre 127, séjour des Scouts de quelques mois](https://attackontitan.fandom.com/wiki/Night_of_The_End_%28Chapter%29)

#### P167 — hunter_x_hunter [138]

**Question :** Quelle contrepartie exige Nanika en échange de vœux importants ?

**Réponse marquée :** Des demandes de plus en plus dangereuses aux proches

La réponse fusionne deux mécanismes distincts. Après un grand vœu, les trois demandes suivantes deviennent plus difficiles et sont adressées à la prochaine personne sollicitée par Alluka, pas nécessairement aux proches du bénéficiaire. Les proches interviennent dans la sanction en cas de refus : la personne sollicitée, la personne qu'elle aime le plus et éventuellement d'autres victimes meurent. Le chapitre 322 et son adaptation à l'épisode 138 illustrent ces règles avec plusieurs domestiques.

**Proposition, non appliquée :** Remplacer la réponse par « Les demandes adressées à la personne sollicitée ensuite deviennent plus difficiles » ; distinguer cette règle des morts provoquées par quatre refus.

Emplacement : `backend/data/hunter_x_hunter.json:1421`.

- [Hunterpedia — chapitre 322 / épisode 138, expériences sur les demandes et conséquences](https://hunterxhunter.fandom.com/wiki/Chapter_322)
- [Hunterpedia — Nanika, destinataire des demandes suivantes et victimes de la sanction](https://hunterxhunter.fandom.com/wiki/Nanika)

#### P170 — jujutsu_kaisen [142]

**Question :** Quelle technique Sukuna utilise-t-il pour trancher l'espace lui-même ?

**Réponse marquée :** Cleave et Dismantle

Le coup qui tranche le monde est une extension de Dismantle élargissant sa cible à l'espace/le monde, apprise à partir de l'adaptation de Mahoraga ; ce n'est pas une combinaison de Cleave et Dismantle. L'encyclopédie du chapitre 236 et la section spécialisée Shrine identifient précisément Dismantle. Le constat concerne les techniques réunies à tort, pas leurs traductions françaises.

**Proposition, non appliquée :** Remplacer « Cleave et Dismantle » par « Dismantle, en élargissant sa cible au monde lui-même ».

Emplacement : `backend/data/jujutsu_kaisen.json:1465`.

- [Jujutsu Kaisen Wiki — chapitre 236, Dismantle ciblant le monde](https://jujutsu-kaisen.fandom.com/wiki/Chapter_236)
- [Jujutsu Kaisen Wiki — Shrine, Slash That Cuts The World](https://jujutsu-kaisen.fandom.com/wiki/Shrine)

#### P171 — jujutsu_kaisen [151]

**Question :** Quelle règle du Jeu de l'extermination permet de gagner des points ?

**Réponse marquée :** Exorciser des joueurs ou des fléaux dans les colonies

La règle officielle 4 dit que les joueurs gagnent des points en mettant fin à la vie d'autres joueurs ; la règle 5 donne en principe cinq points pour un exorciste et un pour un non-exorciste. Le texte marqué présente à tort l'exorcisme de fléaux quelconques dans une colonie comme une autre condition suffisante. Certains fléaux sont eux-mêmes joueurs, ce qui n'autorise pas la généralisation ; certains civils peuvent également devenir joueurs selon la règle 3.

**Proposition, non appliquée :** Remplacer le choix marqué par « Tuer d'autres joueurs du Jeu de l'extermination » et préciser dans la question qu'il s'agit de la règle 4.

Emplacement : `backend/data/jujutsu_kaisen.json:1564`.

- [Site officiel Jujutsu Kaisen — règles 3, 4 et 5 du Jeu de l'extermination](https://jujutsukaisen.jp/shimetsukaiyu/)

#### P187 — got [14] — INACTIF

**Question :** Quelle cité libre est dirigée par le Titan de Braavos ?

**Réponse marquée :** Braavos

Le Titan est une statue et un ouvrage défensif ; le dirigeant de Braavos est le Seigneur de la Mer. La cité attendue est identifiable mais la prémisse dirigée par le Titan est fausse. Fichier GOT inactif.

**Proposition, non appliquée :** Remplacer dirigée par par gardée par pour conserver Braavos.

Emplacement : `backend/data/got.json:16`.

- [A Wiki of Ice and Fire — The Titan of Braavos](https://awoiaf.westeros.org/index.php/The_Titan_of_Braavos)
- [A Wiki of Ice and Fire — Sealord of Braavos](https://awoiaf.westeros.org/index.php/Sealord_of_Braavos)

#### P189 — got [40] — INACTIF

**Question :** Qui forge l'épée Widow's Wail et Oathkeeper à partir de Glace ?

**Réponse marquée :** Tywin Lannister

Tywin commande la refonte mais ne forge pas les épées. Dans les romans, Tobho Mott effectue ce travail ; l'adaptation emploie un forgeron de Volantis. Deux de ces choix figurent déjà dans les options. Tywin est faux pour le travail de forge quelle que soit cette distinction. Fichier GOT inactif.

**Proposition, non appliquée :** Préciser dans les romans et marquer Tobho Mott ; ou demander qui commande la refonte pour conserver Tywin.

Emplacement : `backend/data/got.json:42`.

- [A Wiki of Ice and Fire — Tobho Mott, refonte de Glace dans les romans](https://awoiaf.westeros.org/index.php/Tobho_Mott)
- [Wiki of Westeros — Valyrian sword smith, adaptation télévisée (passages indexés, ouverture complète indisponible)](https://gameofthrones.fandom.com/wiki/Valyrian_sword_smith)

#### P190 — got [57] — INACTIF

**Question :** Quel est le nom du navire de Theon et Yara Greyjoy ?

**Réponse marquée :** Le Silence

Silence est le navire d'Euron Greyjoy. Asha, nom littéraire de Yara, commande Black Wind ; rien ne justifie l'attribution de Silence au duo Theon/Yara. Fichier GOT inactif.

**Proposition, non appliquée :** Demander le navire d'Euron pour conserver Silence, plutôt que d'inventer un navire commun à Theon et Yara.

Emplacement : `backend/data/got.json:59`.

- [A Wiki of Ice and Fire — Silence, Euron](https://awoiaf.westeros.org/index.php/Silence)
- [A Wiki of Ice and Fire — Black Wind, Asha](https://awoiaf.westeros.org/index.php/Black_Wind)
- [Wiki of Westeros — Silence et le Black Wind de Yara (passages indexés, ouverture complète indisponible)](https://gameofthrones.fandom.com/wiki/Silence)

### Ambiguïté / précision nécessaire (89)

#### P003 — ballon_d_or [117]

**Question :** Diego Maradona a-t-il remporté le Ballon d'Or ?

**Réponse marquée :** Non, il n'était pas éligible à l'époque

Maradona n'a pas remporté le prix annuel, mais UEFA confirme qu'il a reçu un Ballon d'Or honorifique. La réponse négative est valable seulement pour le trophée annuel.

**Proposition, non appliquée :** Préciser 'le Ballon d'Or annuel, hors récompense honorifique'.

Emplacement : `backend/data/ballon_d_or.json:1223`.

- [UEFA - Trophées honorifiques de Maradona et Pelé](https://www.uefa.com/ballondor/news/02aa-21dcfc743210-2786daba77d8-1000--2026-ballon-d-or-ceremony-when-and-where-all-the-nominees-/)

#### P004 — ballon_d_or [118]

**Question :** Pelé a-t-il remporté le Ballon d'Or ?

**Réponse marquée :** Non, il n'était pas éligible à l'époque

Pelé n'a pas gagné le prix annuel ; il reçoit cependant le Prix d'Honneur du FIFA Ballon d'Or 2013. La distinction doit être explicite.

**Proposition, non appliquée :** Préciser 'le trophée annuel, hors Ballon d'Or d'honneur'.

Emplacement : `backend/data/ballon_d_or.json:1234`.

- [FIFA - Le Ballon d'Or 2015 en 15 infos](https://inside.fifa.com/fr/news/le-ballon-d-or-2015-en-15-infos-2754041)

#### P005 — ballon_d_or [128]

**Question :** Quel ailier néerlandais de l'AC Milan a remporté le Ballon d'Or en 1987 ?

**Réponse marquée :** Ruud Gullit

L'AC Milan classe Gullit comme milieu. Son prix 1987 est exact ; le mot ailier est une qualification de poste trop restrictive pour ce joueur polyvalent, sans rendre le lauréat faux.

**Proposition, non appliquée :** Écrire 'Quel joueur néerlandais de l'AC Milan…'.

Emplacement : `backend/data/ballon_d_or.json:1344`.

- [AC Milan - Ruud Gullit, midfielder](https://www.acmilan.com/en/hall-of-fame/inductees/ruud-gullit)
- [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/)

#### P006 — ballon_d_or [151]

**Question :** Combien de joueurs ont remporté le Ballon d'Or en jouant en Serie A italienne ?

**Réponse marquée :** Environ 10

En comptant les personnes distinctes et le club au moment du prix dans la liste UEFA, on obtient treize joueurs récompensés dans un club de Serie A. Cannavaro est répertorié au Real en 2006. 'Environ 10' et 'environ 15' imposent un arrondi non défini.

**Proposition, non appliquée :** Demander le nombre exact (13), dater le relevé et fixer le critère club lors de la remise.

Emplacement : `backend/data/ballon_d_or.json:1582`.

- [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/)

#### P007 — ballon_d_or [157]

**Question :** Combien de fois le Ballon d'Or masculin a-t-il été remporté par un joueur évoluant dans un club anglais ?

**Réponse marquée :** Environ 10

La liste UEFA donne sept victoires attribuées à des clubs anglais : Matthews 1956, Law 1964, Charlton 1966, Best 1968, Owen 2001, Ronaldo 2008, Rodri 2024. 'Environ' ne fixe aucune tolérance ; huit est néanmoins le choix le plus proche.

**Proposition, non appliquée :** Proposer le nombre exact 7 et dater le relevé à fin 2026.

Emplacement : `backend/data/ballon_d_or.json:1648`.

- [UEFA - Ballon d'Or laureates](https://www.uefa.com/ballondor/news/0292-1c27056169a7-bc88d1fdba43-1000--ballon-d-or-laureates-who-has-won-football-s-most-prestig/)

#### P010 — bayern_munich [121]

**Question :** Quel milieu de terrain est considéré comme le joueur le plus polyvalent du Bayern actuel ?

**Réponse marquée :** Joshua Kimmich

Le Bayern documente bien la polyvalence de Kimmich, notamment à droite, en défense centrale et au milieu. Il ne s'agit toutefois pas d'un classement mesuré du joueur 'le plus polyvalent' parmi les choix.

**Proposition, non appliquée :** Demander des postes précis occupés ou attribuer cette appréciation à une source datée.

Emplacement : `backend/data/bayern_munich.json:1334`.

- [FC Bayern - Kimmich, deep-rooted in Munich](https://fcbayern.com/en/news/2025/03/kimmich-context)

#### P013 — bayern_munich [128]

**Question :** Quel joueur du Bayern a remporté le plus de titres de Bundesliga ?

**Réponse marquée :** Thomas Müller

En avril 2026, la Bundesliga donne Neuer et Müller à égalité avec treize titres. Müller reste un détenteur du maximum, mais Neuer est une seconde réponse correcte.

**Proposition, non appliquée :** Dater avant 2026 ou proposer 'Müller et Neuer, à égalité'.

Emplacement : `backend/data/bayern_munich.json:1411`.

- [Bundesliga - Neuer égale Müller en 2026](https://www.bundesliga.com/de/bundesliga/news/manuel-neuer-meisterschaft-rekordmeister-thomas-muller-36938)

#### P014 — bayern_munich [129]

**Question :** Quel attaquant péruvien a joué au Bayern dans les années 2000 ?

**Réponse marquée :** Claudio Pizarro

Le palmarès officiel Bayern 2004-2005 montre Pizarro et Guerrero dans l'équipe et parmi les buteurs ; le club confirme aussi Guerrero international péruvien dès 2004. Les deux choix répondent au libellé.

**Proposition, non appliquée :** Ajouter un critère distinctif vérifié ou retirer Guerrero des choix.

Emplacement : `backend/data/bayern_munich.json:1422`.

- [FC Bayern - Saison 2004-2005](https://fcbayern.com/de/club/erfolge/deutscher-meister/saison-2004-2005)
- [FC Bayern - Guerrero et la sélection du Pérou](https://fcbayern.com/es/noticias/2025/10/entrevista-a-felipe-chavez-i-fc-bayern)
- [FC Bayern - Claudio Pizarro](https://fcbayern.com/en/teams/fc-bayern-legends/players/claudio-pizarro)

#### P020 — cristiano_ronaldo [124]

**Question :** En quelle année Ronaldo a-t-il été élu joueur de l'année PFA en Angleterre ?

**Réponse marquée :** 2008

UEFA confirme que Ronaldo remporte en 2008 son deuxième titre PFA consécutif : 2007 et 2008 sont donc deux réponses possibles.

**Proposition, non appliquée :** Demander l'une des éditions précisément ou remplacer un des choix corrects.

Emplacement : `backend/data/cristiano_ronaldo.json:1267`.

- [UEFA - Ronaldo receives English acclaim](https://www.uefa.com/news-media/news/01cc-0e6f54e2f9d2-92ba0828a91e-1000--ronaldo-receives-english-acclaim/)

#### P022 — cristiano_ronaldo [132]

**Question :** Quel record Ronaldo détient-il en Ligue des champions ?

**Réponse marquée :** Le plus de buts

UEFA attribue à Ronaldo les records de buts (140) et de passes décisives (42). La réponse marquée est correcte, mais le premier choix l'est aussi dans le périmètre UEFA.

**Proposition, non appliquée :** Demander son record de 140 buts ou supprimer l'option des passes décisives.

Emplacement : `backend/data/cristiano_ronaldo.json:1355`.

- [UEFA - Ronaldo record assists](https://www.uefa.com/uefachampionsleague/news/0297-1d3e8b524832-5bf371ab86ce-1000--most-assists-in-the-champions-league-cristiano-ronaldo-lea/)

#### P024 — cristiano_ronaldo [137]

**Question :** Quel sélectionneur portugais a succédé à Fernando Santos ?

**Réponse marquée :** Roberto Martínez

La FPF confirme Martínez comme successeur de Santos et comme entraîneur étranger. 'Sélectionneur portugais' peut désigner le poste à la tête du Portugal plutôt que sa nationalité ; le nom marqué reste exact.

**Proposition, non appliquée :** Écrire 'Quel sélectionneur du Portugal a succédé à Fernando Santos ?'.

Emplacement : `backend/data/cristiano_ronaldo.json:1410`.

- [FPF - Sélectionneurs du Portugal](https://portugalstore.fpf.pt/en/editorial/portugal-s-national-team-coaches-through-the-years)

#### P026 — cristiano_ronaldo [149]

**Question :** Quel attaquant a remplacé Ronaldo au Real Madrid après son départ pour la Juventus ?

**Réponse marquée :** Aucun remplacement direct

Le Real confirme le retour de Mariano à l'été 2018, mais ne définit pas un successeur unique au rôle de Ronaldo. 'Remplacement direct' et 'resté numéro un' sont des jugements non opérationnels ; la réponse négative n'est pas prouvée fausse.

**Proposition, non appliquée :** Poser une question sur un transfert, une saison ou un numéro de maillot documenté.

Emplacement : `backend/data/cristiano_ronaldo.json:1537`.

- [Real Madrid - Mariano, retour à l'été 2018](https://www.realmadrid.com/es-ES/noticias/futbol/primer-equipo/personalidades/mariano-cumple-28-anos)

#### P031 — equipe_de_france_football [134]

**Question :** Quel joueur français a ouvert le score contre l'Argentine en finale du Mondial 2022 ?

**Réponse marquée :** Kylian Mbappé

La feuille de finale confirme Messi comme premier buteur du match, et Mbappé comme premier buteur français. Le sens 'a ouvert le score français' sauve la réponse, mais le libellé ne le dit pas.

**Proposition, non appliquée :** Écrire 'Quel joueur a inscrit le premier but français en finale du Mondial 2022 ?'.

Emplacement : `backend/data/equipe_de_france_football.json:1391`.

- [FFF - Finale 2022, si fou si beau si cruel](https://www.fff.fr/article/9090-si-fou-si-beau-si-cruel.html)

#### P037 — lionel_messi [130]

**Question :** Quel trophée Messi a-t-il manqué de remporter avec le PSG malgré deux saisons ?

**Réponse marquée :** La Ligue des champions

Le palmarès officiel PSG ne comporte ni Coupe de France 2022/2023, ni C1 avant 2025. Pendant les deux saisons parisiennes de Messi (2021-2023), il ne remporte donc ni l'un ni l'autre. La C1 est une bonne réponse, mais pas unique.

**Proposition, non appliquée :** Retirer Coupe de France des distracteurs ou demander explicitement le trophée européen.

Emplacement : `backend/data/lionel_messi.json:1333`.

- [PSG - Palmarès masculin](https://www.psg.fr/football-masculin/palmares)
- [Ligue 1 - Messi au PSG 2021-2023](https://ligue1.com/fr/articles/l1_article_5340-video-tous-les-buts-de-messi-en-ligue-1-mc-donald-s)

#### P040 — lionel_messi [141]

**Question :** Quel défenseur Messi a-t-il dribblé cinq fois avant de marquer contre Getafe en 2007 dans un but comparé à celui de Maradona ?

**Réponse marquée :** Plusieurs défenseurs de Getafe

Le Barça décrit un slalom éliminant quatre défenseurs puis le gardien, pas cinq dribbles sur un même défenseur. Le choix 'Plusieurs défenseurs de Getafe' va dans le bon sens, mais ne répond pas au singulier du libellé.

**Proposition, non appliquée :** Demander quelle équipe il a traversée lors de ce slalom ou reformuler au pluriel.

Emplacement : `backend/data/lionel_messi.json:1439`.

- [FC Barcelona - Anniversary of Getafe goal](https://www.fcbarcelona.com/en/news/4250088/18-years-since-messis-maradona-like-goal/amp)

#### P046 — liverpool [133]

**Question :** En quelle saison Liverpool a-t-il réalisé un quadruplé domestique et européen raté de peu en 2022 ?

**Réponse marquée :** 2021-2022

Liverpool gagne deux coupes en 2021-2022 et échoue à la dernière étape en championnat et en C1. La saison marquée est correcte ; 'a réalisé' et 'raté' se contredisent.

**Proposition, non appliquée :** Écrire 'En quelle saison Liverpool a-t-il frôlé le quadruplé ?'.

Emplacement : `backend/data/liverpool.json:1376`.

- [Liverpool FC - Henderson et la saison 2021-2022](https://www.liverpoolfc.com/info/jordan-henderson)

#### P047 — liverpool [135]

**Question :** Quel joueur australien a joué pour Liverpool de 2012 à 2015 ?

**Réponse marquée :** Brad Smith

Liverpool situe les années seniors de Smith en 2013-2016 et ses débuts en décembre 2013, mais le libellé ne précise pas équipe première ou formation. On ne peut transformer cette source senior en preuve qu'il était absent du club en 2012. Les bornes 2012-2015 sont à clarifier.

**Proposition, non appliquée :** Préciser « en équipe première de 2013 à 2016 » pour utiliser le périmètre documenté par Liverpool.

Emplacement : `backend/data/liverpool.json:1398`.

- [Liverpool FC - Brad Smith](https://www.liverpoolfc.com/info/brad-smith)

#### P048 — liverpool [141]

**Question :** Combien de matchs consécutifs sans défaite à domicile Liverpool a-t-il alignés entre 2017 et 2021 ?

**Réponse marquée :** 68

Les 68 matchs correspondent au championnat. Liverpool décrit explicitement la série comme 'home league games', alors que la question omet ce périmètre.

**Proposition, non appliquée :** Ajouter 'en Premier League'.

Emplacement : `backend/data/liverpool.json:1464`.

- [Liverpool FC - Unbeaten league games at Anfield](https://www.liverpoolfc.com/news/first-team/416808-liverpool-set-new-record-for-unbeaten-league-games-at-anfield)
- [Liverpool FC - Records](https://www.liverpoolfc.com/info/liverpool-fc-records)

#### P049 — liverpool [144]

**Question :** Quel défenseur central écossais était un pilier de la défense de Liverpool dans les années 1980 ?

**Réponse marquée :** Alan Hansen

Liverpool décrit Gillespie comme défenseur central écossais, régulièrement titulaire aux côtés de son compatriote Hansen entre 1986 et 1988. 'Pilier' n'est pas un critère qui distingue objectivement ces deux choix.

**Proposition, non appliquée :** Ajouter un critère distinctif vérifié pour Hansen.

Emplacement : `backend/data/liverpool.json:1497`.

- [Liverpool FC - Gary Gillespie](https://www.liverpoolfc.com/past-players/gary-gillespie)

#### P052 — liverpool [153]

**Question :** Quel joueur de Liverpool a été élu meilleur joueur de Premier League en 2019-2020 ?

**Réponse marquée :** Jordan Henderson

Henderson gagne bien le prix FWA 2019-2020. Le prix officiel EA SPORTS de la Premier League revient à De Bruyne. L'organisateur omis rend le libellé ambigu sans démontrer que Henderson n'a reçu aucun prix de meilleur joueur.

**Proposition, non appliquée :** Préciser « Footballer of the Year de la FWA en 2019-2020 » pour conserver Henderson.

Emplacement : `backend/data/liverpool.json:1591`.

- [Liverpool - Henderson remporte le prix FWA](https://www.liverpoolfc.com/news/first-team/403212-jordan-henderson-wins-fwa-footballer-of-the-year-award)
- [Premier League - De Bruyne Player of the Season 2019-2020](https://www.premierleague.com/en/news/1750639)

#### P053 — manchester_united [103]

**Question :** Quel défenseur anglais a été capitaine de United et a joué plus de 400 matchs dans les années 2000 ?

**Réponse marquée :** Rio Ferdinand

UEFA donne Ferdinand à 455 rencontres sur l'ensemble de ses douze saisons, de 2002 à 2014 ; United donne Neville à 602 sur sa carrière. Ces totaux ne prouvent pas plus de 400 apparitions dans la seule décennie 2000-2009. Le périmètre temporel et le critère de capitaine doivent être précisés.

**Proposition, non appliquée :** Demander quel défenseur a totalisé 455 matchs pour United entre 2002 et 2014, pour identifier Ferdinand sans équivoque.

Emplacement : `backend/data/manchester_united.json:1046`.

- [UEFA - Départ de Rio Ferdinand après douze saisons](https://www.uefa.com/news/0252-0ce45028ef81-3dfe04555187-1000--ferdinand-calls-time-on-manchester-united-career/)
- [Manchester United - Life after the Academy, Gary Neville](https://www.manutd.com/en/academy/life-after-the-academy)

#### P062 — manchester_united [129]

**Question :** Quel latéral équatorien a joué pour United de 2009 à 2014 ?

**Réponse marquée :** Antonio Valencia

United confirme dix années de Valencia de 2009 à 2019. La période 2009-2014 est bien comprise dans son passage ; elle est incomplète, sans établir à elle seule une absence ou une fausse présence.

**Proposition, non appliquée :** Écrire « de 2009 à 2019 » si le libellé vise tout son passage.

Emplacement : `backend/data/manchester_united.json:1332`.

- [Manchester United - Adieux de Valencia après dix ans, mai 2019](https://www.manutd.com/en/news/antonio-valencia-says-his-farewells-at-old-trafford-after-10-years)

#### P066 — manchester_united [147]

**Question :** Quel défenseur central français a joué pour United de 2002 à 2008 ?

**Réponse marquée :** Mikaël Silvestre

United confirme l'arrivée de Silvestre le 10 septembre 1999 et neuf saisons jusqu'en 2008. Il joue bien entre 2002 et 2008 : le problème est l'incomplétude du passage si les bornes se veulent exhaustives.

**Proposition, non appliquée :** Employer 1999-2008 pour le passage complet.

Emplacement : `backend/data/manchester_united.json:1530`.

- [Manchester United - Arrivée de Mikael Silvestre en septembre 1999](https://www.manutd.com/en/news/mikael-silvestre-utd-podcast-debut-against-liverpool-08-june-2022)
- [Manchester United - Neuf saisons de Silvestre, 1999-2008](https://www.manutd.com/en/news/who-have-been-man-utd-most-unsung-under-rated-players)

#### P073 — olympique_de_marseille [119]

**Question :** Quel ailier champion du monde 2018 a joué à l'OM de 2013 à 2017 ?

**Réponse marquée :** Florian Thauvin

Thauvin arrive à l'OM en 2013, est transféré à Newcastle en 2015 puis revient en prêt avant de redevenir définitivement marseillais en 2017. Le libellé masque l'interruption, sans invalider son identité.

**Proposition, non appliquée :** Mentionner deux passages, ou choisir une seule saison explicite.

Emplacement : `backend/data/olympique_de_marseille.json:1210`.

- [UEFA - Marseille signe Thauvin en 2013](https://www.uefa.com/uefachampionsleague/news/020d-0e85f84cf30f-2512abb07cf3-1000--marseille-sign-france-starlets-thauvin-and-lemina/)
- [Newcastle - Thauvin en prêt à Marseille, février 2017](https://www.newcastleunited.com/en/news/loan-watch-thauvin-scores)
- [Newcastle - Transfert définitif de Thauvin en juin 2017](https://www.newcastleunited.com/en/news/magpies-submit-retained-list)

#### P074 — olympique_de_marseille [120]

**Question :** Combien de championnats de France l'OM a-t-il remportés avant la Seconde Guerre mondiale ?

**Réponse marquée :** Un

Le premier titre professionnel est celui de 1937. La FFF attribue aussi à l'OM le championnat de France amateur 1929. Un est défendable pour la compétition professionnelle ; Deux l'est si le titre amateur est inclus.

**Proposition, non appliquée :** Ajouter « de première division professionnelle ».

Emplacement : `backend/data/olympique_de_marseille.json:1221`.

- [OM - La naissance et les premiers trophées, titre professionnel 1937](https://www.om.fr/fr/la-naissance-et-les-1ers-trophees)
- [FFF - Raymond Durand, champion de France amateur 1929 avec Marseille](https://www.fff.fr/equipe-nationale/joueur/9989-durand-raymond/fiche.html)

#### P075 — olympique_de_marseille [122]

**Question :** Quel entraîneur a pris la suite de Marcelo Bielsa à l'OM en 2015 ?

**Réponse marquée :** Michel

L'histoire officielle de l'OM indique explicitement un intérim de Passi avant l'arrivée de Michel. Michel reste le successeur durable de Bielsa, mais Passi est aussi proposé et intervient immédiatement.

**Proposition, non appliquée :** Ajouter « après l'intérim de Franck Passi ».

Emplacement : `backend/data/olympique_de_marseille.json:1238`.

- [OM - Ere Louis-Dreyfus, succession Bielsa-Passi-Michel](https://www.om.fr/fr/1997-2016-l-ere-louis-dreyfus)

#### P078 — olympique_de_marseille [130]

**Question :** Quel milieu de terrain a été recruté par l'OM en provenance de Tottenham en 2017 ?

**Réponse marquée :** Clinton Njie

Tottenham confirme le prêt de Njie en 2016-2017 puis son transfert définitif en juillet 2017. Le club le présente comme ailier/attaquant ; « milieu de terrain » manque de précision, mais ailier peut être classé dans l'une ou l'autre ligne selon le système.

**Proposition, non appliquée :** Employer « ailier » et préciser « transféré définitivement en 2017 ».

Emplacement : `backend/data/olympique_de_marseille.json:1326`.

- [Tottenham - Transfert définitif de Clinton Njie en juillet 2017](https://www.tottenhamhotspur.com/news/1033836/clinton-makes-permanent-marseille-move)
- [Tottenham - Njie seals move, profil offensif](https://www.tottenhamhotspur.com/news/1048945/njie-seals-move)

#### P083 — olympique_de_marseille [140]

**Question :** Quel joueur a inscrit le dernier but de l'OM au Vélodrome avant la rénovation pour l'Euro 2016 ?

**Réponse marquée :** André Ayew

La Ville décrit des travaux en site occupé de juin 2011 à juin 2014, avec maintien des matchs. « Avant la rénovation » ne désigne donc pas une fermeture unique ; aucun dernier buteur ne peut être validé sans choisir une borne précise.

**Proposition, non appliquée :** Définir une date et un match précis ; ne pas conserver André Ayew sur la seule formule « avant rénovation ».

Emplacement : `backend/data/olympique_de_marseille.json:1436`.

- [Ville de Marseille - Recueil 353, travaux en mode occupé](https://www.marseille.fr/sites/default/files/contenu/mairie/RAA/raa_353.pdf)
- [Ville de Marseille - Dossier de presse du stade rénové](https://www.marseille.fr/epresse/documents/thesaurus/documents/31361/DPSTADEDEF.pdf)

#### P089 — olympique_de_marseille [156]

**Question :** Quel joueur a inscrit le premier but de l'OM dans la nouvelle version rénovée du Vélodrome en 2014 ?

**Réponse marquée :** André-Pierre Gignac

Le stade est rénové en site occupé et sa livraison est située à la fin d'août 2014 par la Ville. « Première dans la nouvelle version » peut viser une livraison, un premier match ou une inauguration : la borne n'est pas définie, et Gignac n'est pas validé par cette formulation.

**Proposition, non appliquée :** Nommer explicitement le premier match retenu et sa date, puis vérifier la feuille de match.

Emplacement : `backend/data/olympique_de_marseille.json:1607`.

- [Ville de Marseille - Travaux en site occupé, recueil 353](https://www.marseille.fr/sites/default/files/contenu/mairie/RAA/raa_353.pdf)
- [Ville de Marseille - Document financier 2015, livraison du stade fin août 2014](https://www.marseille.fr/sites/default/files/contenu/mairie/PDF-Mairie/emtn_030715.pdf)

#### P090 — beyonce [109]

**Question :** Quel titre de Destiny's Child est l'un des plus gros succès du groupe ?

**Réponse marquée :** Say My Name

Les quatre propositions sont des succès du groupe. « L'un des plus gros succès » ne fournit aucun critère exclusif.

**Proposition, non appliquée :** Définir un classement, un territoire et un rang, ou employer un indice propre à Say My Name.

Emplacement : `backend/data/beyonce.json:1152`.

- [Official Charts — Destiny's Child](https://www.officialcharts.com/artist/4064/destinys-child/)

#### P092 — beyonce [129]

**Question :** Quel titre de B'Day Beyoncé a-t-elle interprété aux BET Awards avec une chorégraphie mémorable ?

**Réponse marquée :** Déjà Vu

BET documente Déjà Vu aux BET Awards 2006 et Get Me Bodied en 2007. « Chorégraphie mémorable » ne les départage pas.

**Proposition, non appliquée :** Préciser l'édition 2006.

Emplacement : `backend/data/beyonce.json:1372`.

- [BET — Beyoncé's Top 10 Show-Stopping BET Moments](https://www.bet.com/article/lsojmc/bet-awards-20-beyonce-s-top-10-show-stopping-bet-moments)

#### P093 — beyonce [135]

**Question :** Quel artiste R&B apparaît sur 'Baby Boy' de Dangerously in Love ?

**Réponse marquée :** Sean Paul

Sean Paul est bien le collaborateur recherché, mais sa présentation comme artiste R&B est imprécise : sa biographie le situe dans le dancehall.

**Proposition, non appliquée :** Demander simplement quel artiste jamaïcain accompagne Beyoncé sur Baby Boy.

Emplacement : `backend/data/beyonce.json:1438`.

- [Apple Music — Sean Paul, biographie](https://music.apple.com/us/artist/sean-paul/155138)

#### P095 — beyonce [138]

**Question :** Quel titre de Lemonade contient un spoken word de Warsan Shire ?

**Réponse marquée :** Lemonade (album entier)

La poésie de Warsan Shire accompagne le film/album visuel Lemonade. La question demande un titre, alors que la réponse désigne l'album entier ; elle mélange morceaux audio et séquences du film.

**Proposition, non appliquée :** Demander quel album visuel utilise la poésie de Warsan Shire.

Emplacement : `backend/data/beyonce.json:1471`.

- [Poetry Foundation — Warsan Shire](https://www.poetryfoundation.org/poets/warsan-shire)
- [Vogue — Warsan Shire et Lemonade](https://www.vogue.com/article/warsan-shire-lemonade-poet)

#### P096 — beyonce [142]

**Question :** Quel titre de Cowboy Carter sample 'Jolene' de Dolly Parton de manière réinterprétée ?

**Réponse marquée :** Jolene

Jolene est bien la réponse attendue. Les sources décrivent une reprise réécrite ; « sample de manière réinterprétée » brouille reprise, interpolation et emprunt d'un enregistrement.

**Proposition, non appliquée :** Remplacer « sample » par « reprend en réécrivant les paroles ».

Emplacement : `backend/data/beyonce.json:1515`.

- [Good Morning America — Beyoncé covers Dolly Parton's Jolene](https://www.goodmorningamerica.com/culture/story/beyonce-covers-dolly-partons-jolene-cowboy-carter-album-108655167)
- [Billboard Canada — Dolly Parton évoque la reprise de Jolene](https://ca.billboard.com/music/country/dolly-parton-perform-jolene-beyonce-at-the-grammys-1235698106/)

#### P097 — beyonce [143]

**Question :** Quel rappeur apparaît sur le titre 'Top Off' avec Beyoncé, Jay-Z et Future ?

**Réponse marquée :** DJ Khaled

Le communiqué du label présente Top Off comme un single de DJ Khaled avec Jay-Z, Future et Beyoncé invités. Le crédit est réel ; la qualification « rappeur » et la formulation des rôles sont imprécises.

**Proposition, non appliquée :** Demander de quel DJ/producteur Top Off est un single.

Emplacement : `backend/data/beyonce.json:1526`.

- [Sony Music Canada — DJ Khaled releases Top Off](https://www.sonymusic.ca/press_release/2071)
- [Recording Academy — DJ Khaled unleashes Top Off](https://www.grammy.com/news/dj-khaled-unleashes-top-beyonce-jay-z-future/)

#### P098 — beyonce [148]

**Question :** Quel titre de Renaissance rend hommage à la culture ballroom ?

**Réponse marquée :** Alien Superstar

Le lien avec la ballroom n'est pas propre à Alien Superstar. Pure/Honey mobilise aussi explicitement cette culture et des enregistrements de Kevin Aviance et Moi Renee.

**Proposition, non appliquée :** Employer un crédit ou un élément sonore précis qui distingue Alien Superstar.

Emplacement : `backend/data/beyonce.json:1581`.

- [Pitchfork — Renaissance, critique de l'album](https://pitchfork.com/reviews/albums/beyonce-renaissance/)

#### P099 — beyonce [149]

**Question :** Quelle icône du disco est samplée sur 'Break My Soul' de Renaissance ?

**Réponse marquée :** Robin S

Robin S est la référence réelle de Show Me Love, mais sa biographie la présente comme une figure de la house. « Icône du disco » est un indice de genre imprécis ; le terme sample mérite aussi d'être distingué d'une interpolation.

**Proposition, non appliquée :** Demander quelle chanteuse de Show Me Love est créditée dans Break My Soul.

Emplacement : `backend/data/beyonce.json:1592`.

- [Apple Music — Robin S, biographie](https://music.apple.com/us/artist/robin-s/1616028754)
- [Pitchfork — Renaissance, crédits complets](https://pitchfork.com/news/beyonce-releases-new-album-renaissance-listen/)

#### P100 — michael_jackson [103]

**Question :** Combien d'exemplaires l'album Thriller s'est-il vendu dans le monde ?

**Réponse marquée :** 70 millions

Sony indiquait déjà plus de 70 millions d'exemplaires en août 2009. Une estimation mondiale sans date ni source ne permet pas d'exiger un total exact et définitif de 70 millions.

**Proposition, non appliquée :** Ancrer l'estimation dans une source et une date ; employer « environ » ou « plus de » selon cette source.

Emplacement : `backend/data/michael_jackson.json:1086`.

- [Sony Pictures — Michael Jackson's This Is It, communiqué du 10 août 2009](https://dev.sonypictures.com/corp/press_releases/2009/08_09/08102009_Michael_Jackson_This_Is_It_SPE.html)

#### P102 — michael_jackson [130]

**Question :** Quel label Michael Jackson a-t-il quitté après l'album Invincible ?

**Réponse marquée :** Epic Records / Sony Music

Le conflit avec Sony et la transition contractuelle après Invincible ne se résument pas à une rupture datée par la sortie de l'album. L'accord exclusif avec Two Seas annoncé en 2006 et les droits de catalogue Sony sont des faits distincts.

**Proposition, non appliquée :** Préciser l'épisode contractuel et sa date, ou demander avec quel groupe musical Michael Jackson était en conflit en 2002.

Emplacement : `backend/data/michael_jackson.json:1383`.

- [SPIN — Michael Jackson Pops Back Into Studio, accord Two Seas en 2006](https://www.spinmagazine.com/2006/04/michael-jackson-pops-back-studio/)
- [Sony Music — Accord avec l'Estate, 16 mars 2010](https://sony.mediaroom.com/2010-03-16-Estate-of-Michael-Jackson-and-Sony-Music-Renew-30-Year-Relationship-With-Landmark-Recording-Deal)

#### P104 — ninho [112]

**Question :** Quelle plateforme de streaming a propulsé la carrière de Ninho ?

**Réponse marquée :** Spotify / Deezer

« A propulsé la carrière » ne définit pas une mesure ni une période. L'entretien YARD documente aussi l'importance des freestyles sur YouTube ; les choix « uniquement » fabriquent une exclusivité non démontrée.

**Proposition, non appliquée :** Poser une question sur un freestyle ou une publication précise, avec une plateforme et une date documentées.

Emplacement : `backend/data/ninho.json:1188`.

- [YARD — Entretien avec Ninho](https://yard.media/interview-ninho/)

#### P110 — ninho [136]

**Question :** Quel titre de Ninho a été certifié single de diamant parmi les premiers ?

**Réponse marquée :** Lettre à une femme

« Parmi les premiers » ne fixe aucun rang ou intervalle. La source de 2020 présente Lettre à une femme comme le premier titre sorti en 2020 à atteindre le diamant, ce qui ne signifie pas premier titre diamant de toute la carrière de Ninho.

**Proposition, non appliquée :** Préciser le critère « premier titre sorti en 2020 à être certifié diamant en France », si ce fait est celui visé.

Emplacement : `backend/data/ninho.json:1452`.

- [Gentsu — Lettre à une femme, premier titre de 2020 certifié diamant](https://www.gentsu.fr/rap-fr/lettre-a-une-femme-de-ninho-est-le-premier-titre-de-2020-a-etre-certifie-diamant/)

#### P112 — ninho [141]

**Question :** Quel producteur est particulièrement associé aux beats de Ninho ?

**Réponse marquée :** Djaresma

Djaresma a réellement participé à Musica de Soprano avec Ninho. En revanche, « particulièrement associé aux beats de Ninho » ne définit ni corpus ni critère de comparaison avec les autres producteurs.

**Proposition, non appliquée :** Interroger un crédit précis de Musica plutôt qu'une association générale.

Emplacement : `backend/data/ninho.json:1507`.

- [Apple Music — Musica, crédits](https://music.apple.com/us/song/1485764830)
- [Qobuz — Du Phoenix aux étoiles, crédits](https://www.qobuz.com/fr-fr/album/du-phoenix-aux-etoiles-soprano/ntockpupau4ya)

#### P114 — ninho [149]

**Question :** Combien de singles certifiés Ninho avait-il atteints en 2023, un record dans le rap français ?

**Réponse marquée :** 300

Le cap de 300 certifications de singles est rapporté en juillet 2023. La question confond potentiellement le nombre de certifications cumulées avec le nombre de titres distincts, et ne précise pas le moment de 2023.

**Proposition, non appliquée :** Parler de « 300 certifications de singles cumulées, cap atteint en juillet 2023 », en citant la méthode de comptage.

Emplacement : `backend/data/ninho.json:1585`.

- [Talents2Kin — Ninho atteint 300 certifications de singles en France](https://talents2kin.com/avec-300-certifications-singles-ninho-devient-le-premier-artiste-a-realiser-cet-exploit-en-france/)
- [L'ABCDR du Son — Bilan du troisième trimestre 2023](https://www.abcdrduson.com/emissions/podcasts/podcast-rap-francophone-troisieme-trimestre-2023/)

#### P119 — pnl [59]

**Question :** Combien de titres contient l'album Dans la légende ?

**Réponse marquée :** 18

L'édition numérique actuellement présentée par Apple Music contient bien 18 titres. Les éditions de sortie ne sont pas identiques ; le total ne peut être demandé sans préciser l'édition.

**Proposition, non appliquée :** Nommer l'édition numérique comportant Crame et Je t'haine, ou une édition physique précise.

Emplacement : `backend/data/pnl.json:606`.

- [Apple Music — Dans la légende, édition numérique de 18 titres](https://music.apple.com/us/album/dans-la-l%C3%A9gende/1663880916)
- [Grazia — Présentation de Dans la légende lors de sa sortie en 2016](https://www.grazia.fr/culture/musique-culture/pnl-entre-dans-la-legende-195161.html)

#### P121 — pnl [79]

**Question :** Combien de concerts PNL a-t-il donné lors de sa tournée Dans la légende ?

**Réponse marquée :** 12

Le programme de novembre 2017 comporte sept concerts réguliers en France, dont deux à Paris. La question ne précise pas si elle compte cette série, les dates initialement annoncées, les festivals ou l'ensemble de la période de promotion ; 12 n'est donc pas démontré par ce périmètre.

**Proposition, non appliquée :** Définir la tournée française de novembre 2017 hors festivals ; proposer alors sept concerts.

Emplacement : `backend/data/pnl.json:811`.

- [Europe 1 — PNL débute sa tournée des Zénith, liste des dates](https://www.europe1.fr/culture/le-groupe-de-rap-pnl-debute-sa-tournee-des-zenith-3484352)
- [Le Parisien — Report de la tournée et ajout d'une seconde date parisienne](https://www.leparisien.fr/culture-loisirs/musique/apres-l-annulation-de-coachella-pnl-repousse-sa-tournee-26-04-2017-6892371.php)

#### P122 — pnl [80]

**Question :** Quel titre de PNL a été certifié single de diamant en France ?

**Réponse marquée :** Au DD

Au DD n'est pas le seul choix ayant reçu le diamant. Onizuka est également documenté comme single diamant en 2017 ; le critère admet donc plusieurs bonnes réponses.

**Proposition, non appliquée :** Ajouter une date ou un autre indice exclusif à Au DD.

Emplacement : `backend/data/pnl.json:822`.

- [SNEP — L'économie de la production musicale 2017, tableau des certifications](https://ressources.arsud-regionsud.com/GED_CUP/196290291447/06-2018-Economie-de-la-production-musicale.pdf)
- [Générations — Onizuka certifié diamant, avril 2017](https://generations.fr/news/coulisse/40119/pnl-dcroche-un-single-de-diamant-avec/print/print)

#### P127 — pnl [91]

**Question :** Quel titre de PNL contient le mot « famille » dans son nom ?

**Réponse marquée :** Que la famille

Que la famille est bien le nom du projet de 2015. « Titre de PNL » peut toutefois se lire comme morceau, alors que le catalogue distingue ce projet et ses douze pistes.

**Proposition, non appliquée :** Remplacer « Quel titre » par « Quel projet ».

Emplacement : `backend/data/pnl.json:943`.

- [Apple Music — Que la famille, liste des douze pistes](https://music.apple.com/us/album/que-la-famille/968338156)

#### P131 — rihanna [105]

**Question :** Avec quel rappeur Rihanna est-elle en couple et a des enfants ?

**Réponse marquée :** A Rocky

Le choix « A Rocky » tronque le nom de scène attendu, A$AP Rocky. Le défaut est une présentation du nom ; cette décision ne certifie pas un statut de couple à une date future.

**Proposition, non appliquée :** Écrire « A$AP Rocky » et dater si nécessaire l'affirmation sur leur relation.

Emplacement : `backend/data/rihanna.json:1108`.

- [RCA Records — A$AP ROCKY, nom de scène sur le site du label](https://shop.rcarecords.com/collections/asap-rocky)

#### P136 — rihanna [155]

**Question :** Quel producteur a travaillé sur la majorité de l'album Anti ?

**Réponse marquée :** Kuk Harrell & Rihanna (co-production)

Les crédits officiels distinguent Rihanna, productrice exécutive, et Kuk Harrell, chargé de la production vocale sur une grande partie des titres. Le choix « co-production » mélange ces responsabilités sans les définir.

**Proposition, non appliquée :** Demander qui assure la production vocale sur la majorité des morceaux : Kuk Harrell.

Emplacement : `backend/data/rihanna.json:1653`.

- [Rihanna — ANTI Deluxe Edition, crédits officiels complets](https://www.rihannanow.com/music/anti-deluxe-edition/)

#### P137 — taylor_swift [107]

**Question :** Quel album Taylor Swift a-t-elle sorti pendant le confinement de 2020 ?

**Réponse marquée :** Folklore

Folklore et Evermore ont été publiés pendant la période de quarantaine de 2020 ; l'indice ne les distingue pas.

**Proposition, non appliquée :** Préciser le 24 juillet 2020.

Emplacement : `backend/data/taylor_swift.json:1130`.

- [Apple Music — Folklore, date de sortie](https://music.apple.com/us/album/folklore/1524793738)
- [Los Angeles Times — Deux albums de Taylor Swift pendant la quarantaine](https://www.latimes.com/entertainment-arts/music/story/2020-12-15/taylor-swift-evermore-jimmy-kimmel-woodvale-rumors)

#### P138 — taylor_swift [108]

**Question :** Quel titre de Taylor Swift parle d'un personnage qui ne vieillit jamais ?

**Réponse marquée :** 22

La présentation de 22 par Taylor Swift porte sur cet âge, ses amies et leurs sentiments contradictoires. « Un personnage qui ne vieillit jamais » est un indice interprétatif non défini, plutôt qu'un fait de récit établi.

**Proposition, non appliquée :** Demander quel titre de Red célèbre l'âge de 22 ans.

Emplacement : `backend/data/taylor_swift.json:1141`.

- [The Boot — Entretien Taylor Swift sur Red et 22](https://theboot.com/taylor-swift-interview-red-album/)

#### P140 — taylor_swift [155]

**Question :** Quel personnage fictif Taylor Swift a-t-elle créé pour le triangle amoureux de Folklore ?

**Réponse marquée :** Betty

Betty est correcte, mais Augusta est aussi un nom employé par Taylor Swift pour la narratrice d'August dans Long Pond, avec Augustine. Augusta n'est donc pas un simple distracteur inventé ou une faute à écarter.

**Proposition, non appliquée :** Demander quel personnage est la narratrice de Cardigan, ou remplacer Augusta par un personnage extérieur au triangle.

Emplacement : `backend/data/taylor_swift.json:1653`.

- [Glamour — Taylor Swift explique la fin du triangle Betty/James/August](https://www.glamour.com/story/taylor-swift-just-revealed-how-the-betty-james-love-triangle-ends)
- [CinemaBlend — Les révélations de Folklore: The Long Pond Studio Sessions](https://www.cinemablend.com/news/2559320/taylor-swifts-disney-concert-film-9-things-we-learned-about-folklore)

#### P141 — taylor_swift [159]

**Question :** Quel titre bonus figure sur la version deluxe de Red (Taylor's Version) en version 10 minutes ?

**Réponse marquée :** All Too Well (10 Minute Version)

All Too Well (10 Minute Version) figure déjà dans la liste officielle des 30 titres de Red (Taylor's Version). La désignation « titre bonus de la version deluxe » ajoute une distinction d'édition inutile et non définie.

**Proposition, non appliquée :** Demander quel morceau de Red (Taylor's Version) existe en version de dix minutes.

Emplacement : `backend/data/taylor_swift.json:1697`.

- [Taylor Swift Official Store — Red (Taylor's Version), liste des titres](https://store.taylorswift.com/products/red-taylors-version-red-vinyl)

#### P142 — the_weeknd [105]

**Question :** Quel titre de Dawn FM a un clip avec un visage vieilli artificiellement ?

**Réponse marquée :** Out of Time

Gasoline montre aussi The Weeknd sous une apparence vieillie. Out of Time ne peut donc pas être isolé par le seul visage âgé.

**Proposition, non appliquée :** Ajouter la présence de Jim Carrey et HoYeon Jung pour identifier Out of Time.

Emplacement : `backend/data/the_weeknd.json:1108`.

- [Pitchfork — Gasoline, The Weeknd affronte son alter ego âgé](https://pitchfork.com/news/the-weeknd-fights-his-alter-ego-in-surreal-new-gasoline-video-watch/)
- [Pitchfork — Out of Time, avec Jim Carrey](https://pitchfork.com/news/watch-the-weeknd-jim-carrey-new-video-out-of-time/)

#### P145 — the_weeknd [132]

**Question :** Quel titre de Hurry Up Tomorrow est le premier single de l'album ?

**Réponse marquée :** Dancing in the Flames

Dancing in the Flames a été annoncé en septembre 2024 pendant la campagne de Hurry Up Tomorrow, mais ne figure pas sur la liste standard des 22 titres publiée en janvier 2025. « De l'album » mélange campagne annoncée et édition finalement commercialisée.

**Proposition, non appliquée :** Demander quel single a lancé la campagne annoncée en septembre 2024, ou préciser l'édition et son premier single effectivement inclus.

Emplacement : `backend/data/the_weeknd.json:1405`.

- [Universal Music Canada — Dancing in the Flames, annonce du 13 septembre 2024](https://www.universalmusic.ca/2024/09/13/the-weeknd-drops-new-song-and-music-video-dancing-in-the-flames/)
- [Universal Music Canada — Hurry Up Tomorrow, liste complète des 22 titres, 31 janvier 2025](https://www.universalmusic.ca/2025/01/31/the-weeknd-officially-releases-heavily-anticipated-new-album-hurry-up-tomorrow/)

#### P148 — the_weeknd [156]

**Question :** Quel remix avec Doja Cat a propulsé 'In Your Eyes' dans le top 10 ?

**Réponse marquée :** In Your Eyes (Remix feat. Doja Cat)

Le remix avec Doja Cat existe et a été promu par Universal. « A propulsé dans le top 10 » ne nomme aucun classement, pays, date ni mesure de causalité ; ce succès ne peut pas être évalué tel quel.

**Proposition, non appliquée :** Demander simplement quelle artiste participe au remix de mai 2020.

Emplacement : `backend/data/the_weeknd.json:1664`.

- [Radiodate — Communiqué promotionnel Universal pour In Your Eyes avec Doja Cat](https://radiodate.it/radio-date/the-weeknd-feat-doja-cat-in-your-eyes-210605-29-05-2020-radiodate/)
- [Official Charts — In Your Eyes, historique de classement](https://www.officialcharts.com/songs/weeknd-in-your-eyes/)

#### P149 — the_weeknd [157]

**Question :** Quel titre d'After Hours fait référence à un quartier de Los Angeles ?

**Réponse marquée :** Escape from LA

Los Angeles est une ville, pas un quartier. Le choix Escape from LA révèle une confusion géographique probable dans le libellé ; le site de la mairie n’établit toutefois pas l’interprétation du titre musical. Une source sur le morceau serait nécessaire pour une validation factuelle complète.

**Proposition, non appliquée :** Remplacer « fait référence à un quartier de Los Angeles » par « évoque le fait de quitter Los Angeles ».

Emplacement : `backend/data/the_weeknd.json:1675`.

- [City of Los Angeles — Site officiel de la ville](https://lacity.gov/)

#### P150 — attaque_des_titans [110]

**Question :** Quel Titan peut cristalliser sa peau pour se protéger ?

**Réponse marquée :** Le Titan Cuirassé

Le Cuirassé est bien spécialisé dans le durcissement de sa peau. Ce pouvoir n'est toutefois pas exclusif : le Bestial durcit sa nuque, notamment dans sa revanche contre Livai (manga, chapitre 113). La formulation « peut cristalliser » et l'absence de périmètre rendent le choix peu discriminant ; ce n'est pas une preuve que la réponse Cuirassé est fausse.

**Proposition, non appliquée :** Demander quel Titan possède une armure de plaques durcies couvrant la majeure partie de son corps ; conserver le Cuirassé.

Emplacement : `backend/data/attaque_des_titans.json:1213`.

- [Attack on Titan Wiki, encyclopédie spécialisée — Armored Titan, peau et durcissement](https://attackontitan.fandom.com/wiki/Armored_Titan)
- [Attack on Titan Wiki — Beast Titan, Hardening et revanche contre Livai](https://attackontitan.fandom.com/wiki/Beast_Titan)

#### P151 — attaque_des_titans [111]

**Question :** Quel personnage rêve de voir la mer ?

**Réponse marquée :** Armin

Armin rêve effectivement de la mer, mais Eren partage cette promesse. Le résumé spécialisé du chapitre 82 rappelle expressément leur promesse de voir l'océan ; Eren est donc un distracteur également défendable. Ambiguïté de choix, pas réponse Armin fausse.

**Proposition, non appliquée :** Demander quel ami montre à Eren le livre sur le monde extérieur, si cette scène est retenue, ou préciser que le rêve appartient aux deux amis et retirer Eren des distracteurs.

Emplacement : `backend/data/attaque_des_titans.json:1224`.

- [Attack on Titan Wiki — Hero, chapitre 82, promesse commune de voir l'océan](https://attackontitan.fandom.com/wiki/Hero_%28Chapter%29)

#### P153 — attaque_des_titans [124]

**Question :** Quel est le nom du continent principal opposé à l'île du Paradis ?

**Réponse marquée :** Mahr

Mahr/Marley est décrit comme une nation et un empire dont le territoire s'étend sur plusieurs masses continentales ; le grand continent à l'ouest de Paradis en constitue le cœur. Aucun nom officiel distinct du continent n'a été établi ici. L'usage métonymique de « Mahr » n'impose pas une autre réponse, mais le terme « continent » devrait être remplacé par une désignation politique.

**Proposition, non appliquée :** Demander le nom de la puissance continentale qui domine les Eldiens en dehors de Paradis ; conserver Mahr.

Emplacement : `backend/data/attaque_des_titans.json:1367`.

- [Attack on Titan Wiki — Marley, Demographics et Geography](https://attackontitan.fandom.com/wiki/Marley)

#### P155 — attaque_des_titans [135]

**Question :** Qui est le leader des Jägeristes ?

**Réponse marquée :** Floch Forster

Les entrées spécialisées manga et anime distinguent explicitement Eren, chef symbolique, et Floch, chef de fait. Floch est donc défendable ; le mot « leader » sans qualification ne l'oppose pas proprement à Eren.

**Proposition, non appliquée :** Demander « Qui dirige les Jägeristes de fait sur Paradis ? » ; conserver Floch.

Emplacement : `backend/data/attaque_des_titans.json:1488`.

- [Attack on Titan Wiki — Yeagerists, symbolic leader et de-facto leader](https://attackontitan.fandom.com/wiki/Yeagerists)
- [Attack on Titan Wiki — Jaegerists (Anime), même distinction](https://attackontitan.fandom.com/wiki/Jaegerists_%28Anime%29)

#### P156 — attaque_des_titans [139]

**Question :** Quel est le véritable objectif du Grand Terrassement d'Eren ?

**Réponse marquée :** Protéger ses amis en éliminant le reste du monde

La protection de ses amis fait partie des motivations exprimées par Eren, mais le dernier chapitre et son adaptation présentent aussi sa volonté personnelle, le devenir d'Ymir, la mise en scène de ses amis en héros et un avenir qu'il a entrevu. « Le véritable objectif » transforme cet ensemble en explication exclusive. Les nuances de l'adaptation finale interdisent de certifier une interprétation unique.

**Proposition, non appliquée :** Ancrer la question dans une déclaration précise d'Eren et dans le manga ou l'anime ; éviter « véritable objectif » sans scène visée.

Emplacement : `backend/data/attaque_des_titans.json:1532`.

- [Attack on Titan Wiki — Toward the Tree on That Hill, chapitre 139, conversation avec Armin](https://attackontitan.fandom.com/wiki/Toward_the_Tree_on_That_Hill_%28Chapter%29)
- [Attack on Titan Wiki — Toward the Tree on That Hill (Episode), conversation finale adaptée](https://attackontitan.fandom.com/wiki/Toward_the_Tree_on_That_Hill_%28Episode%29)

#### P157 — attaque_des_titans [146]

**Question :** Quel est le nom du Titan d'Annie quand elle cristallise son corps pour se protéger ?

**Réponse marquée :** Le Titan Féminin en cristallisation

Le Titan d'Annie reste le Titan Féminin ; « en cristallisation » est une description, pas une transformation distincte attestée. La scène finale de Stohess montre surtout Annie humaine protégée dans un cristal, après son extraction dans le manga ; l'anime met en scène la cristallisation au cours du combat. Le choix identifie le bon Titan mais confond son nom et l'état de sa détentrice.

**Proposition, non appliquée :** Demander simplement « Quel Titan Annie Leonhart possède-t-elle ? » avec « Le Titan Féminin », ou poser une question séparée sur le cristal.

Emplacement : `backend/data/attaque_des_titans.json:1609`.

- [Attack on Titan Wiki — Armin Arlert, fin de Stohess dans le manga : Annie extraite et enfermée dans le cristal](https://attackontitan.fandom.com/wiki/Armin_Arlert)
- [Attack on Titan Wiki — Annie Leonhart (Anime), fin de Stohess et cristal](https://attackontitan.fandom.com/wiki/Annie_Leonhart_%28Anime%29)

#### P158 — attaque_des_titans [159]

**Question :** Quel est le dernier mot prononcé par Erwin Smith avant sa charge suicide contre le Titan Bestial ?

**Réponse marquée :** Donnez vos cœurs !

L'encyclopédie du chapitre 80 reproduit une fin de harangue en trois injonctions à la fureur, au cri et au combat, alors que le choix marqué est la devise générale du Bataillon. Le libellé mélange « avant sa charge » et paroles prononcées pendant la charge, sans édition ou sous-titres français déterminés. Ce contrôle ne certifie donc pas le dernier mot français exact ni une autre des quatre traductions proposées.

**Proposition, non appliquée :** Poser une question sur la devise du Bataillon pour conserver « Donnez vos cœurs ! », ou citer une version française et une scène minutée pour interroger le dernier ordre.

Emplacement : `backend/data/attaque_des_titans.json:1752`.

- [Attack on Titan Wiki — The Nameless Soldiers, chapitre 80 / épisode Perfect Game, harangue de la charge](https://attackontitan.fandom.com/wiki/The_Nameless_Soldiers)

#### P159 — demon_slayer [105]

**Question :** Comment les pourfendeurs tuent-ils les démons ?

**Réponse marquée :** En leur tranchant la tête avec un sabre Nichirin

La décapitation Nichirin est une réponse correcte pour la méthode ordinaire. Shinobu emploie un poison de glycine au lieu de décapiter, ce que le guide du diffuseur licencié explique directement. Une simple « exposition à la glycine » ne désigne pas assez précisément l'administration d'une dose létale pour certifier automatiquement une deuxième réponse vraie.

**Proposition, non appliquée :** Demander la méthode habituelle des pourfendeurs armés d'un sabre Nichirin et remplacer le distracteur ambigu sur la glycine.

Emplacement : `backend/data/demon_slayer.json:1058`.

- [Crunchyroll, diffuseur licencié — A Guide to the Hashira, méthode de Shinobu au poison de glycine](https://www.crunchyroll.com/zh-tw/news/guides/2024/5/14/demon-slayer-hashira)

#### P160 — demon_slayer [136]

**Question :** Quel est le dernier mot que Rengoku adresse à Tanjiro avant de mourir ?

**Réponse marquée :** Enflamme ton cœur

L'exhortation à garder le cœur ardent appartient bien aux adieux de Rengoku. Le résumé du chapitre 66 place ensuite son encouragement sur l'avenir des jeunes pourfendeurs et sa confiance en eux. « Le dernier mot » est donc un critère inutilement littéral et dépend du dialogue français retenu ; la variante « Enflamme ton cœur » n'est pas déclarée fausse.

**Proposition, non appliquée :** Demander « Quelle exhortation Rengoku adresse-t-il à Tanjiro dans son discours d'adieu ? » ; conserver la formulation française choisie.

Emplacement : `backend/data/demon_slayer.json:1399`.

- [Kimetsu no Yaiba Wiki — chapitre 66, succession des paroles d'adieu](https://kimetsu-no-yaiba.fandom.com/wiki/Chapter_66)
- [Crunchyroll — Mugen Train Arc, épisode 7, Set Your Heart Ablaze](https://www.crunchyroll.com/watch/G0DUN0X5Z/set-your-heart-ablaze)

#### P162 — dragon_ball [126]

**Question :** Quel est le nombre maximum de Kaio dans l'univers de Dragon Ball ?

**Réponse marquée :** Quatre

Le site officiel décrit quatre Kaio directionnels et, dans l'anime Dragon Ball Z, un Grand Kaio qui les supervise (première apparition à l'épisode 195). Quatre est donc exact pour les Kaio des quadrants, tandis que « nombre maximum dans l'univers de Dragon Ball » ne définit ni la hiérarchie comptée ni la continuité. Aucun nouveau total universel n'est certifié.

**Proposition, non appliquée :** Demander « Combien de Kaio directionnels veillent sur les quatre quadrants de l'univers 7 ? » ; conserver Quatre.

Emplacement : `backend/data/dragon_ball.json:1289`.

- [Dragon Ball Official — Character Showcase #109: Grand Kaio, quatre Kaio et leur supérieur dans l'anime DBZ](https://en.dragon-ball-official.com/news/01_1913.html)

#### P163 — dragon_ball [132]

**Question :** Qui tue Freezer pour la première fois dans la chronologie ?

**Réponse marquée :** Trunks du futur

Le récit principal montre Trunks tuer Freezer et Cold, confirmé par le site officiel. Dans le futur d'origine de Trunks, Goku les tue ; les versions de lignes temporelles doivent être distinguées. La réponse Trunks est correcte pour la première mort montrée dans le récit principal ; le mot « chronologie » seul rend le périmètre ambigu.

**Proposition, non appliquée :** Demander « Qui tue Freezer lors de sa première mort montrée dans le récit principal ? » ; conserver Trunks du futur.

Emplacement : `backend/data/dragon_ball.json:1355`.

- [Dragon Ball Official — Character Showcase #140: Trunks (Teen), défaite de Freezer et Cold](https://en.dragon-ball-official.com/news/01_2350.html)
- [Dragon Ball Wiki — Future Goku, futur d'origine et mort de Freezer à son retour sur Terre](https://dragonball.fandom.com/wiki/Future_Goku)

#### P165 — hunter_x_hunter [118]

**Question :** Quelle capacité électrique Killua développe-t-il grâce à sa résistance à l'électricité ?

**Réponse marquée :** Godspeed

L'encyclopédie spécialisée relie l'entraînement électrique de Killua à plusieurs capacités : Lightning Palm, Thunderbolt et Godspeed. Les distracteurs anglais semblent être des variantes ou descriptions de ces attaques ; leur forme exacte varie avec les traductions. Godspeed est correcte mais le lien général avec la résistance électrique ne la rend pas unique.

**Proposition, non appliquée :** Décrire la capacité qui accélère les réactions et mouvements de Killua grâce à son aura électrique pour viser Godspeed, et éviter les distracteurs traduits approximativement.

Emplacement : `backend/data/hunter_x_hunter.json:1201`.

- [Hunterpedia — Killua Zoldyck, capacités électriques et deux applications de Godspeed](https://hunterxhunter.fandom.com/wiki/Killua_Zoldyck)

#### P168 — jujutsu_kaisen [109]

**Question :** Qui est considéré comme le plus fort exorciste vivant ?

**Réponse marquée :** Satoru Gojo

Le diffuseur licencié décrit Gojo comme le sorcier le plus puissant du monde au début du récit et dans le contexte de l'anime concerné. Le manga le fait mourir au chapitre 236. « Vivant » doit donc être ancré dans un moment, sans que la bonne réponse initiale soit considérée fausse ni que l'anime soit assimilé à l'état final du manga.

**Proposition, non appliquée :** Ajouter « au début de l'histoire » à la question.

Emplacement : `backend/data/jujutsu_kaisen.json:1102`.

- [Crunchyroll — Gojo's Past Recap, Gojo présenté comme le plus puissant](https://www.crunchyroll.com/news/features/2023/8/29/jujutsu-kaisen-season-2-gojo-past-recap)
- [Jujutsu Kaisen Wiki — chapitre 236, mort de Gojo dans le manga](https://jujutsu-kaisen.fandom.com/wiki/Chapter_236)

#### P172 — animaux [128]

**Question :** Quel oiseau est le seul à pouvoir nager mais pas voler parmi les perroquets ?

**Réponse marquée :** Le kakapo

Le Department of Conservation confirme que le kakapo est un perroquet incapable de voler. La capacité de nager ajoutée à la question n'est pas établie par cette source. Il ne faut ni déclarer cette capacité fausse sans preuve, ni la présenter comme un critère vérifié.

**Proposition, non appliquée :** Demander quel perroquet est incapable de voler ; retirer la mention de la nage.

Emplacement : `backend/data/animaux.json:1130`.

- [Department of Conservation — Kakapo](https://www.doc.govt.nz/nature/native-animals/birds/birds-a-z/kakapo)

#### P173 — animaux [119]

**Question :** Quel amphibien possède une peau si toxique qu'il peut tuer un humain par simple contact ?

**Réponse marquée :** La grenouille dendrobate dorée

L'AMNH confirme la très forte toxicité cutanée de la dendrobate dorée sauvage et le danger de la toucher. La réponse désigne donc bien l'espèce attendue. La formule sur la mort par simple contact omet les conditions d'exposition ; la toxicité dépend également du régime alimentaire. Aucun chiffre de dose létale contradictoire entre fiches n'est retenu ici.

**Proposition, non appliquée :** Demander quel amphibien possède une peau contenant une très puissante toxine ; préciser l'état sauvage, sans promettre une issue létale pour tout contact.

Emplacement : `backend/data/animaux.json:1121`.

- [AMNH — Golden poison frog](https://www.amnh.org/exhibitions/frogs-a-chorus-of-colors/poison-dart-frog-vivarium/golden-poison-frog)
- [AMNH OLogy — Golden poison frog, alimentation et captivité](https://www.amnh.org/explore/ology/ology-cards/352-golden-poison-frog)

#### P174 — animaux [125]

**Question :** Quel poisson est le plus rapide de l'océan ?

**Réponse marquée :** L'espadon voilier

Guinness présente le voilier et le thon rouge comme deux prétendants et souligne les difficultés de mesure. Le thon rouge est aussi proposé dans le QCM. La réponse voilier ne peut donc pas être traitée comme un classement universel incontesté ; aucun remplacement automatique par une autre espèce n'est justifié.

**Proposition, non appliquée :** Remplacer le superlatif par une caractéristique distinctive du voilier, ou citer un record, sa méthode et sa date.

Emplacement : `backend/data/animaux.json:1127`.

- [Guinness World Records — Fastest fish](https://www.guinnessworldrecords.com/world-records/70737-fastest-fish)

#### P175 — animaux [129]

**Question :** Quel est l'animal le plus venimeux au monde ?

**Réponse marquée :** La méduse-boîte

La NOAA qualifie la méduse-boîte australienne de plus venimeux animal marin. Cela ne démontre pas un classement unique de tous les animaux selon tous les critères de toxicité. La réponse attendue reste plausible, mais le périmètre actuel dépasse la source.

**Proposition, non appliquée :** Demander quel animal marin est considéré comme le plus venimeux par la NOAA et identifier Chironex fleckeri.

Emplacement : `backend/data/animaux.json:1131`.

- [NOAA — Most venomous marine animal](https://oceanservice.noaa.gov/facts/box-jellyfish.html)

#### P176 — animaux [141]

**Question :** Quel animal peut dormir debout ?

**Réponse marquée :** Le cheval

Le cheval est une réponse correcte. L'article de 2019 rappelle toutefois un résultat de Ruckebusch (1972) selon lequel des vaches peuvent connaître du sommeil NREM debout ; le sommeil REM exige en revanche une posture couchée. Il ne s'agit pas d'une observation nouvelle propre à l'expérience de 2019. La vache proposée n'est donc pas un distracteur sûrement faux pour une question générale sur la capacité de dormir debout.

**Proposition, non appliquée :** Remplacer les distracteurs également capables de sommeil debout, ou interroger une caractéristique anatomique précisément attribuée au cheval.

Emplacement : `backend/data/animaux.json:1143`.

- [Article expérimental 2019 — Effects of acute lying and sleep deprivation on the behavior of lactating dairy cows, introduction citant Ruckebusch 1972](https://pmc.ncbi.nlm.nih.gov/articles/PMC6713338/)

#### P177 — animaux [147]

**Question :** Quel poisson produit de la lumière par bioluminescence dans les abysses ?

**Réponse marquée :** Le poisson-lanterne

Le poisson-lanterne est bioluminescent, mais le requin nain Euprotomicrus bispinatus possède également des organes lumineux ventraux selon le guide FAO. Le nom vernaculaire du distracteur et le mot abysses méritent précision ; la bioluminescence n'est pas une propriété exclusive du choix marqué.

**Proposition, non appliquée :** Retirer le requin nain des distracteurs et préciser l'espèce ou la famille recherchée.

Emplacement : `backend/data/animaux.json:1149`.

- [FAO — Deep-sea cartilaginous fishes of the Indian Ocean, Euprotomicrus bispinatus](https://www.fao.org/4/i3477e/i3477e.pdf)

#### P178 — animaux [149]

**Question :** Quel animal terrestre a les pattes les plus longues proportionnellement ?

**Réponse marquée :** La girafe

Aucun dénominateur n'est défini pour proportionnellement : longueur du corps, hauteur ou masse. Guinness distingue explicitement le record absolu des oiseaux et le record relatif de l'échasse. Cette source n'établit pas un classement mesuré des quatre animaux proposés ; aucune réponse de remplacement n'est certifiée.

**Proposition, non appliquée :** Remplacer ce superlatif par une mesure ou une propriété de la girafe vérifiable et définie.

Emplacement : `backend/data/animaux.json:1151`.

- [Guinness World Records — Longest legs on a bird relative to body size](https://www.guinnessworldrecords.com/world-records/84847-longest-legs-on-a-bird-relative-to-body-size)

#### P179 — animaux [159]

**Question :** Quel mammifère africain est le plus dangereux pour l'homme en nombre de victimes ?

**Réponse marquée :** L'hippopotame

Le rang de mammifère le plus meurtrier exige une période et une aire géographique. Les études disponibles distinguent les nombres locaux de décès de la gravité d'une attaque. Elles ne permettent pas de certifier ici un total annuel uniforme pour tout le continent. Le crocodile, proposé, n'est par ailleurs pas un mammifère.

**Proposition, non appliquée :** Employer une propriété établie de l'hippopotame ou un jeu de données daté et géographiquement délimité ; ne pas répéter un nombre de victimes sans source.

Emplacement : `backend/data/animaux.json:1161`.

- [Étude originale — Mapping human fatalities from megafauna to inform coexistence strategies](https://pmc.ncbi.nlm.nih.gov/articles/PMC12485064/)
- [Série clinique — Hippopotamus bite morbidity, Burundi](https://pmc.ncbi.nlm.nih.gov/articles/PMC7416829/)

#### P180 — dinosaures [100]

**Question :** Quel dinosaure est souvent considéré comme le plus grand prédateur terrestre ?

**Réponse marquée :** Spinosaurus

Spinosaurus figure parmi les plus longs dinosaures prédateurs, mais longueur et masse ne donnent pas le même classement. Sa vie semi-aquatique rend également terrestre insuffisamment précis. La source muséale ne justifie pas de déclarer Spinosaurus faux pour toute interprétation de plus grand.

**Proposition, non appliquée :** Préciser une estimation de longueur et sa source, ou interroger sa grande voile dorsale.

Emplacement : `backend/data/dinosaures.json:1102`.

- [Natural History Museum — What is the biggest dinosaur?](https://www.nhm.ac.uk/discover/what-is-the-biggest-dinosaur.html)

#### P181 — dinosaures [105]

**Question :** Quel petit dinosaure à plumes est considéré comme l'un des ancêtres directs des oiseaux ?

**Réponse marquée :** Archaeopteryx

Archaeopteryx est pertinent pour les origines des oiseaux. Les positions phylogénétiques et les définitions d'oiseau varient toutefois ; proximité évolutive ne démontre pas une ascendance directe. Le mot direct est plus affirmatif que les preuves disponibles.

**Proposition, non appliquée :** Demander quel célèbre fossile à plumes illustre les liens évolutifs entre dinosaures et oiseaux, en évitant ancêtre direct.

Emplacement : `backend/data/dinosaures.json:1107`.

- [Natural History Museum — Archaeopteryx](https://www.nhm.ac.uk/discover/dino-directory/archaeopteryx)
- [Nature — A Jurassic avialan dinosaur from China resolves the early phylogenetic history of birds](https://www.nature.com/articles/nature12168)

#### P182 — dinosaures [112]

**Question :** Quel était le plus petit dinosaure connu ?

**Réponse marquée :** Microraptor

Guinness retient Microraptor dans son record et le NHM explique les limites du classement. La réponse n'est donc pas démontrée fausse. Le critère doit néanmoins préciser dinosaures éteints, taille de l'adulte, longueur ou masse et référence ; les oiseaux actuels appartiennent aussi aux dinosaures.

**Proposition, non appliquée :** Ancrer la question dans le record Guinness de longueur d'une espèce éteinte plutôt que dans un superlatif absolu.

Emplacement : `backend/data/dinosaures.json:1114`.

- [Guinness World Records — Smallest species of dinosaur](https://www.guinnessworldrecords.com/world-records/smallest-species-of-dinosaur)
- [Natural History Museum — Microraptor](https://www.nhm.ac.uk/discover/dino-directory/microraptor.html)

#### P184 — dinosaures [135]

**Question :** Quel dinosaure du Crétacé supérieur est le parent le plus proche de T. rex en Asie ?

**Réponse marquée :** Tarbosaurus

Une analyse publiée en 2016 place Tarbosaurus et Tyrannosaurus comme groupes frères, tout en comparant une analyse qui associe plutôt Tarbosaurus à Zhuchengtyrannus. Le choix marqué est donc appuyé par une hypothèse publiée, mais plus proche parent n'est pas un classement stable indépendant de l'analyse.

**Proposition, non appliquée :** Nommer l'analyse ou demander quel grand tyrannosauridé asiatique est très proche de T. rex, avec des distracteurs non concurrents.

Emplacement : `backend/data/dinosaures.json:1137`.

- [Scientific Reports 2016 — phylogénies comparées des tyrannosauridés](https://www.nature.com/articles/srep20252)

#### P185 — dinosaures [159]

**Question :** Quel continent n'a livré aucun fossile de tyrannosaure géant ?

**Réponse marquée :** L'Afrique

Les tyrannosauridés du Crétacé terminal sont documentés en Asie et en Amérique du Nord selon l'étude de 2024. L'Europe est donc aussi défendable si tyrannosaure géant vise ces grands tyrannosauridés ; elle possède des tyrannosauroïdes plus anciens tels Eotyrannus. L'absence de définition du groupe et de géant empêche un choix unique sûr.

**Proposition, non appliquée :** Interroger la répartition connue des tyrannosauridés avec un taxon et une période définis ; retirer l'alternative Europe/Afrique ambiguë.

Emplacement : `backend/data/dinosaures.json:1161`.

- [Scientific Reports 2024 — Asiatyrannus et répartition des tyrannosauridés](https://www.nature.com/articles/s41598-024-66278-5)
- [Natural History Museum — Eotyrannus](https://www.nhm.ac.uk/discover/dino-directory/eotyrannus.html)

#### P186 — got [13] — INACTIF

**Question :** Quel est le vrai prénom de Hodor ?

**Réponse marquée :** Walder

Walder correspond aux livres, Wylis à la série télévisée. Le choix marqué n'est pas faux dans le canon littéraire ; la version doit être explicitée. Cette question appartient au fichier GOT inactif.

**Proposition, non appliquée :** Ajouter dans les romans pour conserver Walder, ou proposer Wylis pour une question explicitement télévisée.

Emplacement : `backend/data/got.json:15`.

- [A Wiki of Ice and Fire, encyclopédie spécialisée — Hodor, livres et adaptation](https://awoiaf.westeros.org/index.php/Hodor)

#### P188 — got [30] — INACTIF

**Question :** Qui siège finalement sur le Trône de Fer à la fin de la série ?

**Réponse marquée :** Bran Stark

Bran devient roi des Six Couronnes après la destruction du trône. L'usage figuré est compréhensible mais le verbe siéger suggère un objet disparu. Fichier GOT inactif.

**Proposition, non appliquée :** Demander qui est élu roi des Six Couronnes dans le dernier épisode.

Emplacement : `backend/data/got.json:32`.

- [Rotten Tomatoes — Game of Thrones' Series Finale Best Moments](https://editorial.rottentomatoes.com/article/game-of-thrones-series-finale-top-moments/)

#### P191 — got [60] — INACTIF

**Question :** Quel est le pouvoir spécial de Bran Stark ?

**Réponse marquée :** Voir le passé et le futur (la Corneille à trois yeux)

Les romans décrivent des rêves prophétiques et la perception du temps à travers les barrals. Cela appuie des visions futures, mais pas une connaissance illimitée de l'avenir ; la série n'explicite pas toutes les mêmes limites. Le choix ne peut pas être déclaré faux en bloc. Fichier GOT inactif.

**Proposition, non appliquée :** Préciser la continuité et parler de visions plutôt que d'un accès omniscient au futur.

Emplacement : `backend/data/got.json:62`.

- [A Wiki of Ice and Fire — A Dance with Dragons, Bran III, références au chapitre](https://awoiaf.westeros.org/index.php/A_Dance_with_Dragons-Bran_III)
- [A Wiki of Ice and Fire — Green dreams](https://awoiaf.westeros.org/index.php/Green_dreams)

#### P192 — beyonce [147]

**Question :** Quel est le nom du collectif de danse de Beyoncé ?

**Réponse marquée :** Les Twins (en partie)

Les Twins est le duo français de Larry et Laurent Bourgeois, qui a collaboré avec Beyoncé. Le présenter comme le nom de tout son collectif de danse, avec « en partie » dans la réponse, ne définit pas une entité précise.

**Proposition, non appliquée :** Demander quel duo français de jumeaux a dansé avec Beyoncé.

Emplacement : `backend/data/beyonce.json:1570`.

- [Les Twins — Site officiel et biographie du duo](https://www.officiallestwins.com/)

#### P194 — the_weeknd [138]

**Question :** Quel titre de The Weeknd figure sur la bande originale du film 'Uncut Gems' ?

**Réponse marquée :** Blinding Lights

L’album officiel publié par Daniel Lopatin/Warp ne contient pas Blinding Lights ; Criterion confirme que The Weeknd interprète The Morning dans le film. Cela ne constitue pas une liste exhaustive de tous les morceaux entendus à l’écran. Le libellé bande originale peut désigner l’album ou la musique du film : la correction doit fixer ce périmètre, sans prétendre prouver ici une absence absolue dans le film.

**Proposition, non appliquée :** Demander « Quel morceau The Weeknd interprète-t-il dans le film Uncut Gems ? » et marquer The Morning.

Emplacement : `backend/data/the_weeknd.json:1471`.

- [Oneohtrix Point Never / Warp — Uncut Gems (Original Motion Picture Soundtrack), liste complète des 17 pistes](https://oneohtrixpointnever.bandcamp.com/album/uncut-gems-original-motion-picture-soundtrack-3)
- [NME — Les Safdie expliquent le choix de The Weeknd et de The Morning](https://www.nme.com/news/film/the-weeknd-wasnt-the-safdie-brothers-first-choice-pop-star-for-uncut-gems-2594809)
- [Criterion Collection — Uncut Gems, supplément consacré à la performance de The Morning](https://www.criterion.com/films/31917-uncut-gems)

#### P195 — jujutsu_kaisen [104]

**Question :** Quel sport Yuji pratiquait-il au lycée avant de devenir exorciste ?

**Réponse marquée :** L'athlétisme

Le chapitre/premier épisode montre réellement Yuji lancer le poids contre Takagi, qui cherche à l'inscrire au club d'athlétisme ; cette scène est compatible avec le fait qu'il pratique ponctuellement une discipline athlétique. Le fait qu'il reste au club d'occultisme ne réfute donc pas la question actuelle. En revanche, aucune preuve ne justifie d'en faire un athlète régulièrement inscrit : « pratiquait » laisse cette distinction ouverte.

**Proposition, non appliquée :** Demander « Dans quelle discipline Yuji affronte-t-il l'enseignant qui veut le recruter ? » avec « Le lancer du poids », ou demander quel club veut le recruter et conserver L'athlétisme.

Emplacement : `backend/data/jujutsu_kaisen.json:1047`.

- [Jujutsu Kaisen Wiki — épisode 1, duel au lancer du poids et maintien dans le club d'occultisme](https://jujutsu-kaisen.fandom.com/wiki/Episode_1)
- [Crunchyroll — Characters, Explained, conseiller du club d'athlétisme et capacités de Yuji](https://www.crunchyroll.com/news/guides/2023/8/31/jujutsu-kaisen-characters)

### Soupçon écarté (18)

#### P017 — cristiano_ronaldo [101]

**Question :** Combien de Coupes du monde Ronaldo a-t-il remportées ?

**Réponse marquée :** Zéro

L'Espagne remporte 2026 ; le Portugal ne figure toujours pas au palmarès des vainqueurs et Ronaldo reste sans Coupe du monde. Zéro est correct au 2 novembre 2026.

Emplacement : `backend/data/cristiano_ronaldo.json:1014`.

- [FIFA - Champions du monde 1982-2026](https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2026-italy-argentina-germany-brazil-france-spain)
- [FIFA - Historique du Portugal](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/portugal-team-profile-history?searchOverlay=1)

#### P028 — equipe_de_france_football [101]

**Question :** Combien de Coupes du monde l'équipe de France masculine a-t-elle remportées ?

**Réponse marquée :** Deux

La France reste championne du monde en 1998 et 2018. En 2026, elle termine quatrième et l'Espagne gagne : Deux reste exact.

Emplacement : `backend/data/equipe_de_france_football.json:1028`.

- [FIFA - Champions du monde 1982-2026](https://www.fifa.com/en/tournaments/mens/worldcup/articles/world-cup-champions-1982-2026-italy-argentina-germany-brazil-france-spain)
- [FIFA - Classement final du Mondial 2026](https://www.fifa.com/en/articles/final-tournament-standings)

#### P036 — lionel_messi [101]

**Question :** Combien de Coupes du monde Messi a-t-il remportées ?

**Réponse marquée :** Une

Messi a remporté sa première Coupe du monde en 2022. L'Argentine perd la finale 2026 contre l'Espagne : Une reste exact.

Emplacement : `backend/data/lionel_messi.json:1014`.

- [FIFA - Finales de Messi avec l'Argentine](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/lionel-messi-finals-argentina?searchOverlay=1)
- [FIFA - Finale 2026 Espagne Argentine](https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026/articles/spain-argentina-final-report-highlights)

#### P043 — lionel_messi [155]

**Question :** Quel record de passes décisives en une saison de Liga Messi détient-il (2019-2020) ?

**Réponse marquée :** 21

Le Barça publie explicitement 21 passes décisives pour Messi en Liga 2019-2020 et les présente comme un record. La valeur proposée est donc soutenue par une source primaire ; le soupçon fondé sur un autre fournisseur ne démontre pas une erreur.

Emplacement : `backend/data/lionel_messi.json:1588`.

- [FC Barcelona - Pichichi 2019-2020 et record de passes](https://www.fcbarcelona.com/en/football/first-team/news/1732775/leo-messi-wins-his-seventh-pichichi-a-laliga-record-b1cf-4f5f-808f-ca37bb82fe69)

#### P044 — liverpool [104]

**Question :** Quel gardien espagnol a joué pour Liverpool de 2005 à 2013 ?

**Réponse marquée :** Pepe Reina

Liverpool donne lui-même les années jouées de Reina comme 2005-2013. Son contrat dure jusqu'en 2014, mais il joue 2013-2014 à Naples en prêt. La distinction confirme le libellé actuel.

Emplacement : `backend/data/liverpool.json:1057`.

- [Liverpool FC - Pepe Reina, Years 2005-2013](https://www.liverpoolfc.com/past-players/pepe-reina)
- [Liverpool FC - Prêt à Naples 2013](https://www.liverpoolfc.com/news/first-team/140030-reds-confirm-pepe-reina-loan-move)

#### P058 — manchester_united [113]

**Question :** Quel buteur mexicain a joué pour United de 2010 à 2014 ?

**Réponse marquée :** Javier Hernández

UEFA confirme qu'Hernandez rejoint United en 2010 puis est prêté au Real en septembre 2014. La question porte sur les années jouées, pas sur la fin du contrat : 2010-2014 convient à ce passage effectif.

Emplacement : `backend/data/manchester_united.json:1156`.

- [UEFA - Prêt d'Hernandez au Real en septembre 2014](https://www.uefa.com/uefachampionsleague/news/025a-0ea78ab47997-e2d908789ea2-1000--madrid-take-hernandez-on-loan-from-united/)

#### P077 — olympique_de_marseille [128]

**Question :** Quel joueur ghanéen a été nommé dans le onze africain de l'année lors de son passage à l'OM ?

**Réponse marquée :** André Ayew

La Fédération ghanéenne publie le palmarès CAF 2011 avec Andre Ayew dans l'African XI et le donne alors joueur de l'Olympique de Marseille. La réponse marquée est donc prouvée. La piste concernant Abedi Pelé n'a pas apporté de contre-exemple annuel dans ce périmètre.

**Proposition, non appliquée :** Ajouter « lors des prix CAF 2011 » pour rendre la référence vérifiable et stable.

Emplacement : `backend/data/olympique_de_marseille.json:1304`.

- [Ghana Football Association - CAF Awards 2011 et African XI](https://www.ghanafa.org/toure-claims-african-player-of-the-year-award)

#### P094 — beyonce [136]

**Question :** En quelle année Destiny's Child s'est-il officiellement séparé ?

**Réponse marquée :** 2005

La séparation a été annoncée en juin 2005 pour la fin de la tournée en septembre 2005. Les apparitions ultérieures ne rendent pas 2005 faux.

Emplacement : `backend/data/beyonce.json:1449`.

- [NME — Destiny's Child annoncent leur séparation, juin 2005](https://www.nme.com/news/music/destinys-child-29-1368410)
- [NME — Fin du groupe en septembre, août 2005](https://www.nme.com/news/music/destinys-child-36-1361360)

#### P103 — michael_jackson [151]

**Question :** Combien de spectateurs la tournée Dangerous World Tour a-t-elle attirés ?

**Réponse marquée :** 3,5 millions

La présentation du film officiel Live in Bucharest annonce 69 concerts de la tournée et plus de 3,5 millions de spectateurs. La réponse correspond à l'ordre de grandeur documenté.

Emplacement : `backend/data/michael_jackson.json:1604`.

- [Apple Music — Michael Jackson Live in Bucharest: The Dangerous Tour](https://music.apple.com/us/music-movie/michael-jackson-live-in-bucharest-the-dangerous-tour/646059478)

#### P105 — ninho [118]

**Question :** Quel titre de Ninho a battu le record de streams en 24h sur Spotify France ?

**Réponse marquée :** Lettre à une femme

Lettre à une femme a bien établi un record de streams en 24 heures sur Spotify France en mars 2020. La question ne prétend pas que le record soit encore détenu aujourd'hui.

**Proposition, non appliquée :** Ajouter « en mars 2020 » pour figer la référence historique.

Emplacement : `backend/data/ninho.json:1254`.

- [Purebreak — Record Spotify de Lettre à une femme, mars 2020](https://www.purebreak.com/news/ninho-bat-un-record-avec-le-son-lettre-a-une-femme-de-sa-mixtape-mils-3/192253)
- [Stade de France — Ninho, biographie](https://www.stadefrance.com/fr/le-stade/ninho-au-stade-de-france)

#### P107 — ninho [122]

**Question :** Combien de temps environ M.I.L.S 3 est-il resté numéro 1 des ventes en France ?

**Réponse marquée :** Environ 3 mois

Le catalogue des classements français donne 11 semaines cumulées au sommet pour M.I.L.S 3, ce qui est compatible avec « environ 3 mois ». Il ne faut pas transformer ce total en trois mois consécutifs.

Emplacement : `backend/data/ninho.json:1298`.

- [LesCharts — M.I.L.S 3, historique de classement et 11 semaines au sommet](https://lescharts.com/album/ninho/m-i-l-s-3-405021)

#### P108 — ninho [126]

**Question :** Quel nom porte la marque de vêtements de Ninho ?

**Réponse marquée :** NI

Le lancement de la marque de vêtements NI est documenté en novembre 2020, avec les publications de l'artiste reproduites dans l'article. Le nom n'est pas inventé.

Emplacement : `backend/data/ninho.json:1342`.

- [Mbote — Ninho lance sa marque de vêtements NI, 6 novembre 2020](https://mbote.cd/celebrites/ninho-lance-sa-marque-de-vetement-ni/55457/)

#### P113 — ninho [146]

**Question :** Quel métier le père de Ninho exerçait-il avant d'émigrer en France ?

**Réponse marquée :** Chanteur / musicien

Le père de Ninho, Serge Kiambukuta, est documenté comme chanteur de rumba congolaise, notamment ancien membre de Grand Zaïko Wawa. La réponse chanteur/musicien est étayée, même s'il a également exercé un autre métier.

Emplacement : `backend/data/ninho.json:1552`.

- [20 Minutes — Entretien avec Ninho autour de Jefe](https://www.20minutes.fr/arts-stars/culture/3188355-20211203-jefe-star-rap-francais-ninho-raconte-histoire-vie-nouvel-album)
- [Rap2France — Serge Kiambukuta, ancien chanteur de Grand Zaïko Wawa](https://www.rap2france.com/news/ninho-perd-tragiquement-son-pere-et-reporte-tous-ses-concerts-17144)

#### P120 — pnl [70]

**Question :** À quel moment de la journée le clip « Au DD » a-t-il été tourné sur la tour Eiffel ?

**Réponse marquée :** La nuit

Le récit du photographe Anthony Ghnassia situe le tournage sur une nuit, du 13 au 14 décembre 2018. La présence éventuelle d'images à l'aube ne rend pas « la nuit » faux.

Emplacement : `backend/data/pnl.json:717`.

- [Interlude — Le tournage d'Au DD raconté à partir des publications du photographe](https://intrld.com/pnl-tournage-au-dd/)
- [RapCity — Au DD, tournage à la tour Eiffel](https://www.rapcity.fr/pnl-au-dd-clip-tour-eiffeil/)

#### P132 — rihanna [106]

**Question :** Quel titre de Rihanna a été un succès mondial en 2012 avec un clip en Irlande ?

**Réponse marquée :** We Found Love

We Found Love est entré au classement britannique en octobre 2011 et y figurait encore en août 2012. Le qualifier de succès en 2012 ne revient pas à prétendre qu'il est sorti en 2012 ; ce soupçon chronologique est écarté.

Emplacement : `backend/data/rihanna.json:1119`.

- [Official Charts — We Found Love, historique 2011–2012](https://www.officialcharts.com/songs/rihanna-ft-calvin-harris-we-found-love/)

#### P161 — dragon_ball [111]

**Question :** Quel est le plat préféré de Goku ?

**Réponse marquée :** Tout ce qui est comestible

Le soupçon d'une préférence culinaire inventée est écarté sur le fond : un entretien de Toriyama identifié comme Saikyo Jump de janvier 2018 explique que les Saiyans, Goku inclus, mangent tout ce qui semble comestible sans question de goûts ou dégoûts. « Tout ce qui est comestible » résume cette réponse. La preuve accessible est la citation de l'entretien par un média spécialisé, pas le scan original du magazine ; le singulier « plat préféré » reste seulement une maladresse légère.

Emplacement : `backend/data/dragon_ball.json:1124`.

- [ComicBook, source secondaire citant Toriyama dans Saikyo Jump janvier 2018 — Saiyan Trivia](https://comicbook.com/anime/news/dragon-ball-super-saiyan-trivia/)
- [Dragon Ball Official — Dining in Dragon Ball, appétit et alimentation de Goku](https://en.dragon-ball-official.com/news/01_470.html)

#### P164 — dragon_ball [151]

**Question :** Quel est le nom de la transformation ultime de Goku dans Dragon Ball Super ?

**Réponse marquée :** Ultra Instinct

Parmi les choix proposés, Ultra Instinct est bien une forme de Goku dans Dragon Ball Super ; les autres réponses ne fournissent pas une transformation plus avancée de ce personnage. Le site officiel présente en juin 2025 l'Ultra Instinct comme sa forme la plus puissante et, pour le tome 24, parmi les formes ultimes des protagonistes. La piste d'une réponse factuellement fausse est écartée. « Ultime » reste une description de contexte éditorial, pas une garantie sur toute évolution future de la franchise.

Emplacement : `backend/data/dragon_ball.json:1559`.

- [Dragon Ball Official — Illustration du dixième anniversaire, Goku Ultra Instinct parmi les formes les plus puissantes](https://en.dragon-ball-official.com/news/01_3489.html)
- [Dragon Ball Official — Tome 24, formes ultimes et combat Gohan Beast / Goku Ultra Instinct](https://en.dragon-ball-official.com/news/01_3350.html)

#### P166 — hunter_x_hunter [126]

**Question :** Quel principe du Nen consiste à projeter son aura de manière offensive ?

**Réponse marquée :** Ren

Ren consiste à produire davantage d'aura et à la projeter vers l'extérieur de façon explosive ; il peut aussi servir d'intimidation ou d'agression. La définition spécialisée le présente comme le pendant offensif de Ten, sans exclure son effet défensif. Le chapitre 48 illustre le Ren hostile de Wing/Hisoka. La réponse Ren n'est donc pas une confusion démontrée avec l'Émission ; aucune séparation du corps n'est exigée par le texte actuel.

Emplacement : `backend/data/hunter_x_hunter.json:1289`.

- [Hunterpedia — Nen, section Ren : projection extérieure, emploi offensif et défensif](https://hunterxhunter.fandom.com/wiki/Nen)
- [Hunterpedia — chapitre 48, Ren hostile pendant l'enseignement de Wing](https://hunterxhunter.fandom.com/wiki/Chapter_48)

### Preuves insuffisantes ou divergentes (31)

#### P018 — cristiano_ronaldo [113]

**Question :** Combien d'enfants Cristiano Ronaldo a-t-il ?

**Réponse marquée :** Cinq

La recherche dans les sources football officielles n'a pas livré un relevé familial primaire suffisamment récent. Le chiffre cinq n'est ni invalidé ni certifié ; la distinction enfants vivants/enfant décédé ne doit pas être inférée.

Emplacement : `backend/data/cristiano_ronaldo.json:1146`.


#### P021 — cristiano_ronaldo [128]

**Question :** Quel joueur a été le coéquipier de Ronaldo le plus prolifique en passes décisives au Real Madrid ?

**Réponse marquée :** Karim Benzema

Le Real publie les propos de Benzema sur son rôle de passeur auprès de Ronaldo, mais pas le tableau exhaustif permettant de le comparer à tous les autres coéquipiers, toutes compétitions. Ce témoignage ne démontre pas le superlatif.

**Proposition, non appliquée :** Définir le fournisseur statistique et le périmètre avant de valider le record.

Emplacement : `backend/data/cristiano_ronaldo.json:1311`.

- [Real Madrid - Benzema sur son rôle auprès de Ronaldo](https://www.realmadrid.com/en-US/news/football/first-team/press-conference/benzema-well-be-giving-our-all-to-head-back-to-madrid-with-the-uefa-super-cup)

#### P025 — cristiano_ronaldo [145]

**Question :** Combien de sélections Ronaldo comptait-il environ avec le Portugal fin 2024 ?

**Réponse marquée :** Environ 210

Les sources officielles trouvées donnent des jalons ultérieurs (223 en 2025, puis 233 en 2026), sans isoler le total au 31 décembre 2024. Elles ne permettent pas ici de trancher entre les approximations 210 et 215.

**Proposition, non appliquée :** Obtenir un relevé FPF daté de fin 2024 et proposer le total exact.

Emplacement : `backend/data/cristiano_ronaldo.json:1493`.

- [UEFA - Most capped internationals (2026)](https://www.uefa.com/european-qualifiers/news/023f-0e9797c3479b-bdb6067609d3-1000--ronaldo-extends-world-record/)

#### P029 — equipe_de_france_football [105]

**Question :** Quel milieu défensif français a été élu meilleur joueur de la Coupe du monde 2018 par les fans ?

**Réponse marquée :** N'Golo Kanté

La FIFA attribue le Ballon d'or officiel 2018 à Modrić. Cela ne réfute pas un sondage distinct de fans, mais aucune source du sondage désignant Kanté n'a été identifiée. Le prix visé doit être retrouvé.

**Proposition, non appliquée :** Identifier le vote, l'organisateur et la date ; ne pas substituer automatiquement le Ballon d'or FIFA au sondage allégué.

Emplacement : `backend/data/equipe_de_france_football.json:1072`.

- [FIFA - Awards Russia 2018](https://inside.fifa.com/tournaments/mens/worldcup/2018russia/news/157-awards-piece-2986294)

#### P033 — equipe_de_france_football [153]

**Question :** Quel défenseur français a été élu dans l'équipe type du Mondial 2022 ?

**Réponse marquée :** Theo Hernandez

Aucune équipe type précise désignant Theo Hernandez n'a pu être attribuée à un organisme primaire identifié. Différentes sélections médiatiques existent ; l'absence de source ne prouve pas son exclusion.

**Proposition, non appliquée :** Nommer l'organisme et le vote avant validation.

Emplacement : `backend/data/equipe_de_france_football.json:1600`.


#### P061 — manchester_united [119]

**Question :** Quel ancien milieu de United est devenu entraîneur de Derby County puis des Rangers ?

**Réponse marquée :** Wayne Rooney

Les notices officielles retracent Derby puis D.C. United et Plymouth pour Rooney. Elles contredisent l'idée d'un passage direct de Derby aux Rangers, mais ne constituent pas un historique exhaustif actualisé jusqu'au 2 novembre 2026. Aucun passage aux Rangers n'a été étayé ; son absence définitive n'est pas ici démontrée.

**Proposition, non appliquée :** Remplacer le segment Rangers par D.C. United si l'on veut une séquence documentée, après reformulation du poste de Rooney.

Emplacement : `backend/data/manchester_united.json:1222`.

- [D.C. United - Parcours de Wayne Rooney](https://www.dcunited.com/club/bio/rooney)
- [Plymouth Argyle - Premier entretien de Rooney, mai 2024](https://www.pafc.co.uk/news/first-interview-wayne-rooney)

#### P069 — manchester_united [152]

**Question :** Quel milieu portugais, frère d'un autre joueur célèbre, n'a jamais joué pour United ?

**Réponse marquée :** Hugo Viana

Le CV UEFA complet de Viana exclut United de sa carrière, mais ne documente pas le frère célèbre allégué. L'absence de United ne distingue pas suffisamment ce choix de Bernardo Silva ; le lien familial n'a pas été établi par une source primaire. Ne pas valider ni inventer ce présupposé.

**Proposition, non appliquée :** Retirer le lien familial et construire un critère de carrière positif et unique, plutôt que conserver la seule absence de United.

Emplacement : `backend/data/manchester_united.json:1580`.

- [UEFA Academy - CV complet de Hugo Viana après sa retraite](https://uefaacademy.com/wp-content/uploads/sites/2/2019/02/UEFA-MIP-II_Whos-Who_Final.pdf)
- [Manchester City - Bilan 2026, départ de Bernardo Silva](https://beta.mancity.com/news/mens/hugo-viana-summer-review-2026-bernardo-silva-john-stones-rodri-63925180)

#### P084 — olympique_de_marseille [146]

**Question :** Quel joueur a marqué le 1000e but de l'OM en Coupe d'Europe ?

**Réponse marquée :** Dimitri Payet

Aucun relevé primaire exhaustif toutes Coupes d'Europe, ni annonce officielle d'un 1000e but attribué à Payet, n'a été retrouvé. L'invraisemblance du total ne suffit pas à établir une erreur ; ne pas lui substituer un autre jalon supposé.

**Proposition, non appliquée :** Retrouver la statistique et son périmètre avant toute réécriture.

Emplacement : `backend/data/olympique_de_marseille.json:1502`.


#### P087 — olympique_de_marseille [150]

**Question :** Quel club l'OM a-t-il affronté lors de son premier match officiel en 1899 ?

**Réponse marquée :** Le Stade Helvétique

L'histoire officielle retrouvée distingue la fondation en 1899 des débuts du championnat professionnel en 1932. Elle ne nomme pas le premier adversaire officiel de 1899. Ni le Stade Helvétique ni un autre choix n'a pu être confirmé dans le périmètre demandé.

**Proposition, non appliquée :** Retrouver une archive primaire du match et préciser football, date et compétition avant correction.

Emplacement : `backend/data/olympique_de_marseille.json:1546`.

- [OM - La naissance et les premiers trophées](https://www.om.fr/fr/la-naissance-et-les-1ers-trophees)

#### P088 — olympique_de_marseille [151]

**Question :** Quel défenseur brésilien champion du monde a joué à l'OM en 2009-2010 ?

**Réponse marquée :** Hilton

Aucune source primaire explicite établissant le palmarès mondial ou l'absence de sélection de Hilton n'a été retrouvée dans cette vérification. Son titre français avec l'OM ne prouve pas un titre de champion du monde. Le présupposé reste non validé, sans être transformé en erreur par simple absence de preuve.

**Proposition, non appliquée :** Obtenir une fiche internationale ou les listes exhaustives des effectifs champions concernés avant de conclure.

Emplacement : `backend/data/olympique_de_marseille.json:1557`.


#### P091 — beyonce [127]

**Question :** Quelle membre de Destiny's Child est devenue pasteure après le groupe ?

**Réponse marquée :** Michelle Williams

Les biographies attestent la carrière gospel de Michelle Williams. L'entretien consulté présente son ancien fiancé Chad Johnson comme pasteur ; il ne prouve pas qu'elle le soit devenue.

**Proposition, non appliquée :** Remplacer la qualité non établie de pasteure par une étape documentée de sa carrière gospel.

Emplacement : `backend/data/beyonce.json:1350`.

- [Lyric Opera of Chicago — Michelle Williams](https://www.lyricopera.org/about/company/artists-musicians/michelle-williams/)
- [TheGrio — Entretien Michelle Williams et Chad Johnson](https://thegrio.com/2018/11/11/exclusive-michelle-williams-and-chad-johnson-on-sharing-their-journey-to-the-altar-with-the-world/)

#### P106 — ninho [120]

**Question :** Quel rappeur Ninho mentionne-t-il souvent comme influence dans ses interviews ?

**Réponse marquée :** Tupac

Aucun entretien direct identifié dans cette passe ne permet d'établir que Tupac est l'influence que Ninho mentionne « souvent », ni d'écarter les autres choix.

**Proposition, non appliquée :** Citer un entretien daté et reprendre une déclaration précise plutôt qu'une fréquence indéfinie.

Emplacement : `backend/data/ninho.json:1276`.


#### P109 — ninho [134]

**Question :** Quel est le nom du collectif/crew de Ninho ?

**Réponse marquée :** Carbozo

La BnF atteste Carbozo comme titre interprété par Ninho, mais cette notice ne permet ni de confirmer un collectif de ce nom ni d'en démontrer l'absence.

**Proposition, non appliquée :** Exiger une source directe sur le collectif avant de conserver cette question.

Emplacement : `backend/data/ninho.json:1430`.

- [Bibliothèque nationale de France — Carbozo, notice de l'enregistrement](https://catalogue.bnf.fr/ark%3A/12148/cb45462369c)

#### P111 — ninho [139]

**Question :** En quelle année Ninho a-t-il sorti sa toute première mixtape 'Ils sont pas au courant' ?

**Réponse marquée :** 2013

Les catalogues consultés datent le volume 1 du 17 février 2014, tandis qu'un clip était déjà présenté comme extrait de la mixtape en septembre 2013. Cette annonce anticipée ne prouve pas la date de sortie complète ; la distinction première diffusion/réédition reste incertaine.

**Proposition, non appliquée :** Ne pas remplacer automatiquement 2013 par 2014 sans source primaire de sortie.

Emplacement : `backend/data/ninho.json:1485`.

- [Afrisson — Ils sont pas au courant, vol. 1](https://www.afrisson.com/ils-sont-pas-au-courant-vol-1-dj-quick-presente-ninho/)
- [Générations — Clan des loups, présenté comme extrait de la mixtape, 18 septembre 2013](https://generations.fr/video/clip/24425/ninho-ft-sadek-clan-des-loups-clip-officiel)

#### P116 — pnl [52]

**Question :** Quel est le quatrième album studio de PNL, sorti en 2025 ?

**Réponse marquée :** QLF Records Vol. 2

Le catalogue Apple Music consulté ne présente pas QLF Records Vol. 2 ; il identifie Deux frères, paru en 2019, comme quatrième album selon son propre classement. La notice Infoconcert n’a pas une date de mise à jour suffisamment établie. Ces sources ne constituent pas une preuve exhaustive de l’absence mondiale d’une édition en 2025. La sortie annoncée par la question reste non validée, sans être certifiée inventée.

**Proposition, non appliquée :** Ne pas valider cette sortie de 2025 sans annonce directe du groupe ou du label ; préférer une question sur un disque et une date attestés.

Emplacement : `backend/data/pnl.json:534`.

- [Apple Music — Catalogue des albums de PNL](https://music.apple.com/us/artist/pnl/370571621)
- [Infoconcert — PNL, dernier album Deux frères, notice actualisée en 2026](https://www.infoconcert.com/artiste/pnl-142866/concerts)

#### P123 — pnl [81]

**Question :** Dans quelle ville PNL a-t-il donné un concert événement au Parc des Princes ?

**Réponse marquée :** Paris

Paris est la bonne ville pour situer le Parc des Princes, mais le concert de PNL invoqué n'a pas été établi. La source de 2019 réfute la date 2019 de P124, sans suffire à exclure toute autre date.

**Proposition, non appliquée :** Supprimer la prémisse de concert non sourcée ou la remplacer par un événement de PNL précisément documenté.

Emplacement : `backend/data/pnl.json:833`.

- [Le Parisien — Retour annoncé des concerts au Parc des Princes en 2020](https://www.leparisien.fr/culture-loisirs/musique/nekfeu-et-dadju-en-concert-au-parc-des-princes-debut-juin-15-11-2019-8193951.php)

#### P125 — pnl [84]

**Question :** Quel animal apparaît dans le clip de « Onizuka » ?

**Réponse marquée :** Un singe

La présence d'un singe dans Onizuka n'a pas été établie par un visionnage exhaustif. La notoriété du singe de DA ne permet pas à elle seule de réfuter un autre passage dans Onizuka.

**Proposition, non appliquée :** Vérifier intégralement la vidéo et relever le timecode avant de conserver ou de corriger l'animal.

Emplacement : `backend/data/pnl.json:866`.

- [Clique — Présentation du clip officiel Onizuka](https://www.clique.tv/new-le-clip-de-pnl-onizuka/)

#### P126 — pnl [86]

**Question :** Quel titre de PNL a été utilisé dans une publicité pour Adidas ?

**Réponse marquée :** Aucun titre n'a été utilisé

Aucune archive exhaustive des publicités ou des synchronisations Adidas ne permet de démontrer « Aucun titre ». Les vêtements portés dans les clips ne constituent pas une preuve d'utilisation ou d'absence en publicité.

**Proposition, non appliquée :** Définir une campagne, une année et une vidéo publicitaire vérifiable ; éviter une absence universelle.

Emplacement : `backend/data/pnl.json:888`.


#### P129 — pnl [108]

**Question :** Quel clip de PNL se déroule dans un décor urbain enneigé de la cité des Tarterêts ?

**Réponse marquée :** Tempête

Le dossier consacré aux décors des clips situe Tempête à Londres, notamment à Tower Bridge. Cela rend suspecte la description des Tarterêts enneigés, mais n'exclut pas à lui seul d'autres plans ; le clip n'a pas été vérifié intégralement.

**Proposition, non appliquée :** Resserer la question sur le décor londonien documenté plutôt que certifier l'absence de toute autre séquence.

Emplacement : `backend/data/pnl.json:1125`.

- [Interlude — Les lieux de tournage des premiers clips de PNL](https://intrld.com/le-jour-ou-pnl-a-entame-son-tour-du-monde/)

#### P130 — pnl [109]

**Question :** Quel réalisateur a contribué à plusieurs clips de PNL dont « Au DD » ?

**Réponse marquée :** Greg Ohrel (KLMVNII)

Le dossier professionnel d'Au DD attribue conception et réalisation à QLF. Les documents consultés n'établissent pas la contribution annoncée de Greg Ohrel ; une contribution non créditée ne peut cependant pas être exclue avec ces seuls crédits.

**Proposition, non appliquée :** Demander l'entité créditée à la réalisation dans le dossier professionnel, plutôt qu'une contribution générale à plusieurs clips.

Emplacement : `backend/data/pnl.json:1136`.

- [Club des Directeurs Artistiques — Au DD, crédits de conception et réalisation](https://leclubdesda.org/archive/au-dd-26706)
- [Crew United — PNL: Au DD, fiche de production](https://www.crew-united.com/en/PNL-Au-DD__264065.html)

#### P133 — rihanna [122]

**Question :** Quel producteur est crédité sur 'Umbrella' ?

**Réponse marquée :** The-Dream & Tricky Stewart

La distinction entre composition, production et production vocale doit être établie sur les crédits complets de l'édition. Cette passe ne fournit pas une preuve suffisante pour déclarer faux le choix combinant The-Dream et Tricky Stewart.

**Proposition, non appliquée :** Vérifier les rôles individuels sur le livret original avant toute correction.

Emplacement : `backend/data/rihanna.json:1295`.

- [Shazam — Umbrella, fiche de l'enregistrement et crédits](https://www.shazam.com/song/1472503762/umbrella-feat-jac3bf-z)

#### P135 — rihanna [150]

**Question :** Quel titre de Rated R Rihanna a-t-elle dédié aux victimes de violence domestique ?

**Réponse marquée :** Russian Roulette

Aucune déclaration directe identifiée n'atteste une dédicace de Russian Roulette aux victimes de violence domestique. Le contexte biographique de Rated R ou une interprétation de son thème ne prouve pas cette dédicace.

**Proposition, non appliquée :** Retirer la dédicace si elle ne peut pas être rattachée à une déclaration datée de Rihanna.

Emplacement : `backend/data/rihanna.json:1598`.


#### P139 — taylor_swift [146]

**Question :** Quel titre de '1989' Taylor Swift décrit-elle comme étant inspiré par le film de Ryan Gosling ?

**Réponse marquée :** Out of the Woods

Les explications rapportées de Taylor Swift sur Out of the Woods décrivent l'anxiété d'une relation. Elles n'établissent pas l'inspiration par un film avec Ryan Gosling, mais ne suffisent pas à prouver qu'elle n'en a jamais parlé ailleurs.

**Proposition, non appliquée :** Exiger la déclaration et le film précis ; à défaut, employer l'explication relationnelle documentée.

Emplacement : `backend/data/taylor_swift.json:1554`.

- [Glamour — Taylor Swift explique Out of the Woods au Grammy Museum](https://www.glamour.com/story/taylor-swift-harry-styles-out-of-the-woods)

#### P143 — the_weeknd [111]

**Question :** Quel titre de The Weeknd utilise un sample de 'Take on Me' de a-ha ?

**Réponse marquée :** Blinding Lights

L'emprunt direct à l'enregistrement Take on Me n'est pas établi. Une ressemblance de style et l'absence éventuelle d'a-ha dans des crédits ne suffisent pas à certifier ou à réfuter un sample.

**Proposition, non appliquée :** Retirer la prémisse de sample tant qu'une source de production ou de droits n'est pas trouvée.

Emplacement : `backend/data/the_weeknd.json:1174`.


#### P144 — the_weeknd [114]

**Question :** Quel titre de Beauty Behind the Madness parle d'une relation toxique en montagne ?

**Réponse marquée :** The Hills

Le lieu en montagne et la description de la relation ne sont rattachés ici à aucun passage de paroles ou commentaire direct vérifié. Le titre The Hills, pris seul, ne prouve pas ce contexte. La réponse n’est ni certifiée ni déclarée fausse.

**Proposition, non appliquée :** Employer un élément explicite du clip, des crédits ou du classement de The Hills.

Emplacement : `backend/data/the_weeknd.json:1207`.


#### P146 — the_weeknd [150]

**Question :** Quel producteur canadien cofondateur de XO Records travaille étroitement avec The Weeknd ?

**Réponse marquée :** DaHeala

Le travail de DaHeala dans l'équipe de production de The Weeknd est documenté, avec une collaboration remontant à Kiss Land en 2013. Le statut distinct de cofondateur de XO n'est pas établi par cet entretien ; cette passe ne dispose pas d'un acte ou d'une liste primaire exhaustive permettant de le trancher.

**Proposition, non appliquée :** Retirer « cofondateur » et interroger un crédit de production précis si aucune source directe de fondation n'est fournie.

Emplacement : `backend/data/the_weeknd.json:1598`.

- [Music Week — Living for The Weeknd, entretien avec DaHeala et DannyBoyStyles](https://www.musicweek.com/interviews/read/living-for-the-weeknd/064984)

#### P147 — the_weeknd [151]

**Question :** Quel single de The Weeknd sample 'I Want to Break Free' de Queen ?

**Réponse marquée :** Take My Breath

Les crédits de Dawn FM consultés ne suffisent pas à démontrer l'emprunt direct à I Want to Break Free. L'absence d'un crédit Queen n'est pas une preuve absolue d'absence de sample ou d'interpolation.

**Proposition, non appliquée :** Exiger une déclaration de production ou un crédit de droits explicite ; sinon retirer ce rapprochement.

Emplacement : `backend/data/the_weeknd.json:1609`.

- [Pitchfork — Dawn FM, crédits publiés à la sortie](https://pitchfork.com/news/the-weeknd-releases-new-album-dawn-fm-listen-and-read-the-full-credits/)

#### P152 — attaque_des_titans [119]

**Question :** Qui Armin considère-t-il comme un véritable héros ?

**Réponse marquée :** Erwin

Les sources consultées établissent l'estime d'Armin pour l'intelligence et le commandement d'Erwin, et son opinion selon laquelle Erwin aurait dû être sauvé. Elles ne fournissent pas de déclaration directe attribuant de manière unique le terme « véritable héros » à Erwin. Impossible de certifier ou de réfuter cette appréciation subjective sans scène ou citation précise.

Emplacement : `backend/data/attaque_des_titans.json:1312`.

- [Attack on Titan Wiki — Armin Arlelt (Anime), relation avec Erwin](https://attackontitan.fandom.com/wiki/Armin_Arlelt_%28Anime%29)

#### P169 — jujutsu_kaisen [128]

**Question :** Quel fléau se déguise sous l'apparence d'un humain pour infiltrer la société ?

**Réponse marquée :** Mahito

La fiche officielle établit que Mahito est un fléau issu des humains et capable de modifier les âmes ; l'encyclopédie décrit son apparence humanoïde habituelle. Ces faits ne démontrent pas à eux seuls un déguisement adopté dans le but d'infiltrer la société. L'invisibilité ordinaire des fléaux ne permet pas non plus de prouver qu'aucune infiltration n'a lieu dans aucune scène. La prémisse intentionnelle reste sans preuve directe, sans être déclarée définitivement fausse.

**Proposition, non appliquée :** Demander une scène précise d'infiltration ou remplacer ce critère par une caractéristique directement attestée de Mahito.

Emplacement : `backend/data/jujutsu_kaisen.json:1311`.

- [Site officiel Jujutsu Kaisen — Mahito, origine et capacité de transformation des âmes](https://jujutsukaisen.jp/character/category4.php)
- [Jujutsu Kaisen Wiki — Mahito, apparence humanoïde habituelle](https://jujutsu-kaisen.fandom.com/wiki/Mahito)

#### P183 — dinosaures [124]

**Question :** Quel sauropode titanosaure a été découvert en Patagonie en 2014 ?

**Réponse marquée :** Patagotitan

Les sources muséales emploient des dates différentes pour la découverte : l'AMNH utilise 2014, le Field Museum indique une découverte initiale en 2010. Ces formulations ne permettent pas de trancher la date de découverte sans distinguer premier os, signalement, fouilles et annonce. Patagotitan n'est pas déclaré faux.

**Proposition, non appliquée :** Éviter la date de découverte et poser une question sur son lieu, ou définir précisément l'événement daté après recherche complémentaire.

Emplacement : `backend/data/dinosaures.json:1126`.

- [AMNH — Patagotitan mayorum](https://www.amnh.org/explore/ology/ology-cards/373-patagotitan-mayorum)
- [Field Museum — Putting the titan in titanosaur](https://www.fieldmuseum.org/blog/putting-titan-titanosaur)

#### P193 — the_weeknd [133]

**Question :** Quel artiste K-pop apparaît sur un titre de Hurry Up Tomorrow ?

**Réponse marquée :** BTS

BTS n'est pas attesté dans les documents consultés. La liste complète des 22 titres et les principaux invités ne constituent toutefois pas un relevé exhaustif de toutes les voix discrètes, interpolations et éditions ; ils ne permettent pas de certifier « Aucun artiste K-pop » universellement.

**Proposition, non appliquée :** Remplacer la question par une collaboration précisément créditée, par exemple Playboi Carti sur Timeless, ou vérifier les crédits complets d'une édition nommée.

Emplacement : `backend/data/the_weeknd.json:1416`.

- [Universal Music Canada — Hurry Up Tomorrow, liste complète des 22 titres, 31 janvier 2025](https://www.universalmusic.ca/2025/01/31/the-weeknd-officially-releases-heavily-anticipated-new-album-hurry-up-tomorrow/)
- [The Weeknd — Hurry Up Tomorrow, crédits d'une édition partielle ; non suffisants pour l'album complet](https://www.theweeknd.com/hurryuptomorrowcredits/)
- [Capital XTRA — Liste des principaux invités de Hurry Up Tomorrow](https://www.capitalxtra.com/news/the-weeknd-new-album-hurry-up-tomorrow-features-list/)
